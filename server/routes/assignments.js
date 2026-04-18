const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'assignments')),
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

    if (subjectId) {
      params.push(subjectId);
      conditions.push(`a.subject_id = $${params.length}`);
    }
    if (req.user.role === 'teacher') {
      params.push(req.user.id);
      conditions.push(`a.created_by = $${params.length}`);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.deadline DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/assignments — teacher creates
router.post('/', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, subjectId, deadline } = req.body;
    const result = await pool.query(
      `INSERT INTO assignments (subject_id, title, description, deadline, created_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [subjectId, title, description, deadline, req.user.id]
    );

    // Create pending submissions for all students
    const students = await pool.query('SELECT id FROM students');
    for (const s of students.rows) {
      await pool.query(
        'INSERT INTO submissions (assignment_id, student_id, status) VALUES ($1, $2, $3)',
        [result.rows[0].id, s.id, 'pending']
      );
    }

    // Notify students
    const io = req.app.get('io');
    if (io) {
      const allStudents = await pool.query('SELECT u.id FROM students s JOIN users u ON s.user_id = u.id');
      for (const s of allStudents.rows) {
        io.to(`user_${s.id}`).emit('new_notification', {
          message: `New assignment: ${title}. Deadline: ${new Date(deadline).toLocaleDateString()}`,
        });
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/assignments/:id/submit — student uploads file
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
    const status = now > deadline ? 'late' : 'submitted';
    const fileUrl = req.file ? `/uploads/assignments/${req.file.filename}` : null;

    await pool.query(
      `INSERT INTO submissions (assignment_id, student_id, file_url, submitted_at, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (assignment_id, student_id) DO UPDATE
       SET file_url = $3, submitted_at = $4, status = $5`,
      [assignmentId, studentId, fileUrl, now, status]
    );

    res.json({ message: 'Assignment submitted', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/assignments/:id/submissions — teacher views
router.get('/:id/submissions', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sub.*, s.roll_no, u.name as student_name
       FROM submissions sub
       JOIN students s ON sub.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE sub.assignment_id = $1
       ORDER BY sub.submitted_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
