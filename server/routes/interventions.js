const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const { getMentorInterventionSuggestions, getRuleBasedInterventions } = require('../services/llmService');
const { computeRisk } = require('../services/riskEngine');

// GET /api/interventions — all by mentor
router.get('/', auth, roleGuard('mentor', 'admin'), async (req, res) => {
  try {
    let query = `
      SELECT i.*, u.name as student_name, s.roll_no, m.name as mentor_name
      FROM interventions i
      JOIN students s ON i.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users m ON i.mentor_id = m.id
    `;
    const params = [];
    if (req.user.role === 'mentor') { query += ' WHERE i.mentor_id = $1'; params.push(req.user.id); }
    const { type } = req.query;
    if (type) {
      params.push(type);
      query += (params.length === 1 ? ' WHERE' : ' AND') + ` i.type = $${params.length}`;
    }
    query += ' ORDER BY i.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/interventions/suggest/:studentId — MUST be before /:studentId
router.get('/suggest/:studentId', auth, roleGuard('mentor', 'admin'), async (req, res) => {
  try {
    const risk = await computeRisk(req.params.studentId);
    const studentData = await pool.query(
      'SELECT u.name FROM students s JOIN users u ON s.user_id=u.id WHERE s.id=$1', [req.params.studentId]
    );
    const existingInt = await pool.query(
      'SELECT type, remarks FROM interventions WHERE student_id=$1 ORDER BY created_at DESC LIMIT 3', [req.params.studentId]
    );
    const existingStr = existingInt.rows.map(i => `${i.type}: ${i.remarks}`).join('; ');
    const payload = {
      name: studentData.rows[0]?.name || 'Student',
      riskScore: risk.score, riskLevel: risk.level,
      attendance: risk.breakdown.attendancePercent,
      avgMarks: risk.breakdown.averageMarks,
      assignmentCompletion: risk.breakdown.assignmentCompletion,
      existingInterventions: existingStr,
    };
    let suggestions = await getMentorInterventionSuggestions(payload);
    if (!suggestions) suggestions = getRuleBasedInterventions(payload);
    res.json({ suggestions, riskData: risk });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/interventions/:studentId — for specific student
router.get('/:studentId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.name as mentor_name 
       FROM interventions i
       LEFT JOIN users u ON i.mentor_id = u.id
       WHERE i.student_id = $1
       ORDER BY i.created_at DESC`,
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/interventions
router.post('/', auth, roleGuard('mentor', 'admin'), async (req, res) => {
  try {
    const { studentId, type, remarks, scheduledAt } = req.body;

    // Get LLM suggestion at creation time
    const risk = await computeRisk(studentId);
    const studentData = await pool.query(
      'SELECT u.name FROM students s JOIN users u ON s.user_id=u.id WHERE s.id=$1', [studentId]
    );
    const existingInt = await pool.query(
      'SELECT type, remarks FROM interventions WHERE student_id=$1 ORDER BY created_at DESC LIMIT 3', [studentId]
    );
    const existingStr = existingInt.rows.map(i => `${i.type}: ${i.remarks}`).join('; ');
    const payload = {
      name: studentData.rows[0]?.name || 'Student',
      riskScore: risk.score, riskLevel: risk.level,
      attendance: risk.breakdown.attendancePercent,
      avgMarks: risk.breakdown.averageMarks,
      assignmentCompletion: risk.breakdown.assignmentCompletion,
      existingInterventions: existingStr,
    };
    let llmSuggestion = await getMentorInterventionSuggestions(payload);
    if (!llmSuggestion) llmSuggestion = getRuleBasedInterventions(payload);

    const result = await pool.query(
      'INSERT INTO interventions (student_id, mentor_id, type, remarks, llm_suggestion, scheduled_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [studentId, req.user.id, type, remarks, llmSuggestion, scheduledAt || null]
    );

    const io = req.app.get('io');
    const student = await pool.query('SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = $1', [studentId]);
    if (io && student.rows[0]) {
      const msg = `New ${type} intervention assigned by your mentor.`;
      io.to(`user_${student.rows[0].id}`).emit('new_notification', { message: msg });
      await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [student.rows[0].id, msg]);
    }

    res.status(201).json({ ...result.rows[0], llmSuggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/interventions/:id
router.delete('/:id', auth, roleGuard('mentor', 'admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM interventions WHERE id=$1', [req.params.id]);
    res.json({ message: 'Intervention deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
