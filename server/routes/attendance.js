const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/attendance/:studentId
router.get('/:studentId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, s.name as subject_name FROM attendance a
       JOIN subjects s ON a.subject_id = s.id
       WHERE a.student_id = $1 ORDER BY a.date DESC`,
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/attendance — teacher marks attendance
router.post('/', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const { records } = req.body; // [{studentId, subjectId, date, status}]
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array required' });
    }
    for (const r of records) {
      await pool.query(
        `INSERT INTO attendance (student_id, subject_id, date, status) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (student_id, subject_id, date) DO UPDATE SET status = $4`,
        [r.studentId, r.subjectId, r.date, r.status]
      );
    }
    res.json({ message: 'Attendance marked successfully', count: records.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/attendance/subject/:subjectId
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT a.*, s.roll_no, u.name as student_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE a.subject_id = $1
    `;
    const params = [req.params.subjectId];
    if (date) {
      query += ' AND a.date = $2';
      params.push(date);
    }
    query += ' ORDER BY a.date DESC, s.roll_no';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
