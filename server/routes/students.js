const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const { computeRisk, generateSuggestions, getRiskTrend } = require('../services/riskEngine');
const { getStudentInsights, getMentorInterventionSuggestions, getRuleBasedInsights, getRuleBasedInterventions } = require('../services/llmService');

// GET /api/students — list students (mentor/admin/teacher)
router.get('/', auth, roleGuard('mentor', 'admin', 'teacher'), async (req, res) => {
  try {
    let query = `
      SELECT s.id, s.roll_no, s.semester, s.section, s.mentor_id,
             u.id as user_id, u.name, u.email, u.department
      FROM students s
      JOIN users u ON s.user_id = u.id
    `;
    const params = [];
    if (req.user.role === 'mentor') {
      query += ' WHERE s.mentor_id = $1';
      params.push(req.user.id);
    }
    query += ' ORDER BY s.roll_no';
    const result = await pool.query(query, params);

    const students = await Promise.all(result.rows.map(async (s) => {
      try {
        const risk = await computeRisk(s.id);
        return { ...s, riskScore: risk.score, riskLevel: risk.level, breakdown: risk.breakdown };
      } catch {
        return { ...s, riskScore: null, riskLevel: null };
      }
    }));
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/students/me — current student's own profile
router.get('/me', auth, roleGuard('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name, u.email, u.department, m.name as mentor_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users m ON s.mentor_id = m.id
       WHERE s.user_id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/students/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name, u.email, u.department, m.name as mentor_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users m ON s.mentor_id = m.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/students/:id/risk — with LLM insights
router.get('/:id/risk', auth, async (req, res) => {
  try {
    const risk = await computeRisk(req.params.id);
    const suggestions = generateSuggestions(risk);
    const trend = await getRiskTrend(req.params.id);

    // Per-subject breakdown
    const subjects = await pool.query('SELECT id, name, code FROM subjects');
    const subjectBreakdown = [];
    for (const sub of subjects.rows) {
      const att = await pool.query(
        `SELECT COUNT(*) FILTER (WHERE status='present') as present, COUNT(*) as total
         FROM attendance WHERE student_id = $1 AND subject_id = $2`,
        [req.params.id, sub.id]
      );
      const marks = await pool.query(
        `SELECT mid_marks, internal_marks FROM marks WHERE student_id = $1 AND subject_id = $2`,
        [req.params.id, sub.id]
      );
      const m = marks.rows[0] || { mid_marks: 0, internal_marks: 0 };
      const attPct = att.rows[0].total > 0 ? (parseInt(att.rows[0].present) / parseInt(att.rows[0].total) * 100) : 0;
      const totalMarks = parseFloat(m.mid_marks) + parseFloat(m.internal_marks);
      subjectBreakdown.push({
        subject: sub.name,
        code: sub.code,
        attendance: parseFloat(attPct.toFixed(1)),
        totalMarks: parseFloat(totalMarks.toFixed(1)),
      });
    }

    // LLM insights
    const studentData = await pool.query('SELECT u.name FROM students s JOIN users u ON s.user_id=u.id WHERE s.id=$1', [req.params.id]);
    const studentName = studentData.rows[0]?.name || 'Student';
    let llmInsights = await getStudentInsights(risk, studentName);
    if (!llmInsights) llmInsights = getRuleBasedInsights(risk);

    res.json({ ...risk, suggestions, trend, subjectBreakdown, llmInsights });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/students/:id/attendance — per subject with calendar data
router.get('/:id/attendance', auth, async (req, res) => {
  try {
    const { subjectId } = req.query;
    let query = `SELECT a.*, s.name as subject_name, s.code as subject_code
                 FROM attendance a JOIN subjects s ON a.subject_id = s.id
                 WHERE a.student_id = $1`;
    const params = [req.params.id];
    if (subjectId) {
      query += ' AND a.subject_id = $2';
      params.push(subjectId);
    }
    query += ' ORDER BY a.date DESC';
    const result = await pool.query(query, params);

    const summary = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status='present') as present, COUNT(*) as total
       FROM attendance WHERE student_id = $1`,
      [req.params.id]
    );
    const { present, total } = summary.rows[0];
    const percent = total > 0 ? (parseInt(present) / parseInt(total)) * 100 : 0;

    // Per-subject stats with calendar data
    const subjectStats = await pool.query(
      `SELECT s.id, s.name, s.code,
              COUNT(*) FILTER (WHERE a.status='present') as present,
              COUNT(*) as total
       FROM attendance a JOIN subjects s ON a.subject_id = s.id
       WHERE a.student_id = $1
       GROUP BY s.id, s.name, s.code`,
      [req.params.id]
    );

    res.json({
      records: result.rows,
      summary: { present: parseInt(present), total: parseInt(total), percent: parseFloat(percent.toFixed(1)) },
      subjectStats: subjectStats.rows.map(r => ({
        ...r,
        present: parseInt(r.present),
        total: parseInt(r.total),
        percent: parseInt(r.total) > 0 ? parseFloat((parseInt(r.present) / parseInt(r.total) * 100).toFixed(1)) : 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/students/:id/marks
router.get('/:id/marks', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, s.name as subject_name, s.code as subject_code
       FROM marks m JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/students/:id/assignments — categorized
router.get('/:id/assignments', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, s.name as subject_name, s.code as subject_code,
              sub.status as submission_status, sub.submitted_at, 
              sub.file_url as submission_url, sub.original_filename,
              sub.grade, sub.grade_remarks,
              a.allow_late
       FROM assignments a
       JOIN subjects s ON a.subject_id = s.id
       LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = $1
       ORDER BY a.deadline`,
      [req.params.id]
    );
    const now = new Date();
    const categorized = {
      upcoming: [],
      completed: [],
      pastDue: [],
    };
    for (const r of result.rows) {
      const deadline = new Date(r.deadline);
      if (r.submission_status === 'submitted' || r.submission_status === 'late') {
        categorized.completed.push(r);
      } else if (deadline < now) {
        categorized.pastDue.push(r);
      } else {
        categorized.upcoming.push(r);
      }
    }
    res.json({ all: result.rows, ...categorized });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/students/:id/hallticket
router.get('/:id/hallticket', auth, async (req, res) => {
  try {
    const rules = await pool.query('SELECT * FROM hall_ticket_rules LIMIT 1');
    if (rules.rows.length === 0 || !rules.rows[0].enabled) {
      return res.json({ eligible: false, reason: 'Hall ticket generation is currently disabled' });
    }
    const minAttendance = parseFloat(rules.rows[0].min_attendance_percent);

    const subjectStats = await pool.query(
      `SELECT s.id, s.name, s.code,
              COUNT(*) FILTER (WHERE a.status='present') as present,
              COUNT(*) as total
       FROM attendance a JOIN subjects s ON a.subject_id = s.id
       WHERE a.student_id = $1
       GROUP BY s.id, s.name, s.code`,
      [req.params.id]
    );

    const ineligibleSubjects = [];
    const eligibleSubjects = [];
    for (const sub of subjectStats.rows) {
      const pct = parseInt(sub.total) > 0 ? (parseInt(sub.present) / parseInt(sub.total)) * 100 : 0;
      const subObj = { subject: sub.name, code: sub.code, attendance: parseFloat(pct.toFixed(1)), present: parseInt(sub.present), total: parseInt(sub.total) };
      if (pct < minAttendance) {
        ineligibleSubjects.push(subObj);
      } else {
        eligibleSubjects.push(subObj);
      }
    }

    const student = await pool.query(
      `SELECT s.*, u.name, u.email, u.department FROM students s
       JOIN users u ON s.user_id = u.id WHERE s.id = $1`,
      [req.params.id]
    );

    res.json({
      eligible: ineligibleSubjects.length === 0,
      minAttendance,
      ineligibleSubjects,
      eligibleSubjects,
      student: student.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/students/:id/llm-suggestions — LLM-powered mentor suggestions
router.get('/:id/llm-suggestions', auth, roleGuard('mentor', 'admin'), async (req, res) => {
  try {
    const risk = await computeRisk(req.params.id);
    const studentData = await pool.query(
      'SELECT u.name FROM students s JOIN users u ON s.user_id=u.id WHERE s.id=$1',
      [req.params.id]
    );
    const existingInt = await pool.query(
      'SELECT type, remarks FROM interventions WHERE student_id=$1 ORDER BY created_at DESC LIMIT 3',
      [req.params.id]
    );
    const existing = existingInt.rows.map(i => `${i.type}: ${i.remarks}`).join('; ');

    const payload = {
      name: studentData.rows[0]?.name || 'Student',
      riskScore: risk.score,
      riskLevel: risk.level,
      attendance: risk.breakdown.attendancePercent,
      avgMarks: risk.breakdown.averageMarks,
      assignmentCompletion: risk.breakdown.assignmentCompletion,
      existingInterventions: existing,
    };

    let suggestions = await getMentorInterventionSuggestions(payload);
    if (!suggestions) suggestions = getRuleBasedInterventions(payload);

    res.json({ suggestions, riskData: risk });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
