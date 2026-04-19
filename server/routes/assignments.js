const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'assignments');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

// GET /api/assignments
router.get('/', auth, async (req, res) => {
  try {
    const { subjectId, studentId } = req.query;
    let query = `SELECT a.*, s.name as subject_name, s.code as subject_code, u.name as created_by_name
                 FROM assignments a
                 JOIN subjects s ON a.subject_id = s.id
                 LEFT JOIN users u ON a.created_by = u.id`;
    const params = [];
    const conditions = [];

    if (subjectId) { params.push(subjectId); conditions.push(`a.subject_id = $${params.length}`); }
    if (req.user.role === 'teacher') { params.push(req.user.id); conditions.push(`a.created_by = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.deadline DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/assignments/:id — single assignment with submission for current student
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, s.name as subject_name, s.code as subject_code, u.name as created_by_name
       FROM assignments a
       JOIN subjects s ON a.subject_id = s.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/assignments — teacher creates
router.post('/', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, subjectId, deadline, allowLate } = req.body;
    const result = await pool.query(
      `INSERT INTO assignments (subject_id, title, description, deadline, allow_late, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [subjectId, title, description, deadline, allowLate || false, req.user.id]
    );

    // Create pending submissions for all students
    const students = await pool.query('SELECT id FROM students');
    for (const s of students.rows) {
      await pool.query(
        'INSERT INTO submissions (assignment_id, student_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [result.rows[0].id, s.id, 'pending']
      );
    }

    const io = req.app.get('io');
    if (io) {
      const allStudents = await pool.query('SELECT u.id FROM students s JOIN users u ON s.user_id = u.id');
      for (const s of allStudents.rows) {
        const msg = `New assignment: ${title}. Deadline: ${new Date(deadline).toLocaleDateString()}`;
        io.to(`user_${s.id}`).emit('new_notification', { message: msg });
        await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [s.id, msg]);
      }
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/assignments/:id — teacher edits
router.put('/:id', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, deadline, allowLate } = req.body;
    const result = await pool.query(
      `UPDATE assignments SET title=$1, description=$2, deadline=$3, allow_late=$4 WHERE id=$5 RETURNING *`,
      [title, description, deadline, allowLate, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM assignments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/assignments/:id/submit — student uploads file (with re-submission support)
router.post('/:id/submit', auth, roleGuard('student'), upload.single('file'), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const student = await pool.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (student.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const studentId = student.rows[0].id;

    const assignment = await pool.query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);
    if (assignment.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });

    const now = new Date();
    const deadline = new Date(assignment.rows[0].deadline);
    const isLate = now > deadline;

    // Check if late submission is allowed
    if (isLate && !assignment.rows[0].allow_late) {
      return res.status(403).json({ error: 'Deadline passed. Late submissions not allowed for this assignment.' });
    }

    const status = isLate ? 'late' : 'submitted';
    const fileUrl = req.file ? `/uploads/assignments/${req.file.filename}` : null;
    const originalFilename = req.file ? req.file.originalname : null;

    await pool.query(
      `INSERT INTO submissions (assignment_id, student_id, file_url, original_filename, submitted_at, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (assignment_id, student_id) DO UPDATE
       SET file_url = $3, original_filename = $4, submitted_at = $5, status = $6`,
      [assignmentId, studentId, fileUrl, originalFilename, now, status]
    );

    res.json({ message: 'Assignment submitted', status, isLate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/assignments/:id/submissions — teacher views all submissions
router.get('/:id/submissions', auth, roleGuard('teacher', 'admin', 'mentor'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sub.*, s.roll_no, u.name as student_name,
              a.deadline, a.title as assignment_title
       FROM submissions sub
       JOIN students s ON sub.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN assignments a ON sub.assignment_id = a.id
       WHERE sub.assignment_id = $1
       ORDER BY sub.submitted_at DESC NULLS LAST`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/assignments/:id/submissions/:studentId/grade — teacher grades
router.put('/:id/submissions/:studentId/grade', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const { grade, gradeRemarks } = req.body;
    const result = await pool.query(
      `UPDATE submissions SET grade=$1, grade_remarks=$2
       WHERE assignment_id=$3 AND student_id=$4 RETURNING *`,
      [grade, gradeRemarks, req.params.id, req.params.studentId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });

    // Notify student
    const student = await pool.query(
      'SELECT u.id FROM students s JOIN users u ON s.user_id=u.id WHERE s.id=$1', [req.params.studentId]
    );
    const io = req.app.get('io');
    if (io && student.rows[0]) {
      const msg = `Your assignment has been graded: ${grade}/100`;
      io.to(`user_${student.rows[0].id}`).emit('new_notification', { message: msg });
      await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [student.rows[0].id, msg]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/assignments/:id/my-submission — student views their own submission
router.get('/:id/my-submission', auth, roleGuard('student'), async (req, res) => {
  try {
    const student = await pool.query('SELECT id FROM students WHERE user_id=$1', [req.user.id]);
    if (student.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const result = await pool.query(
      `SELECT sub.*, a.deadline, a.title, a.allow_late, s.name as subject_name
       FROM submissions sub
       JOIN assignments a ON sub.assignment_id = a.id
       JOIN subjects s ON a.subject_id = s.id
       WHERE sub.assignment_id=$1 AND sub.student_id=$2`,
      [req.params.id, student.rows[0].id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
