const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/interventions/:studentId
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

// GET /api/interventions — all by this mentor
router.get('/', auth, roleGuard('mentor', 'admin'), async (req, res) => {
  try {
    let query = `
      SELECT i.*, u.name as student_name, s.roll_no,
             m.name as mentor_name
      FROM interventions i
      JOIN students s ON i.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users m ON i.mentor_id = m.id
    `;
    const params = [];
    if (req.user.role === 'mentor') {
      query += ' WHERE i.mentor_id = $1';
      params.push(req.user.id);
    }
    const { type, startDate, endDate } = req.query;
    if (type) {
      params.push(type);
      query += (params.length === 1 ? ' WHERE' : ' AND') + ` i.type = $${params.length}`;
    }
    if (startDate) {
      params.push(startDate);
      query += (params.length === 1 ? ' WHERE' : ' AND') + ` i.created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += (params.length === 1 ? ' WHERE' : ' AND') + ` i.created_at <= $${params.length}`;
    }
    query += ' ORDER BY i.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/interventions
router.post('/', auth, roleGuard('mentor', 'admin'), async (req, res) => {
  try {
    const { studentId, type, remarks } = req.body;
    const result = await pool.query(
      'INSERT INTO interventions (student_id, mentor_id, type, remarks) VALUES ($1, $2, $3, $4) RETURNING *',
      [studentId, req.user.id, type, remarks]
    );

    // Notify student
    const io = req.app.get('io');
    const student = await pool.query('SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = $1', [studentId]);
    if (io && student.rows[0]) {
      io.to(`user_${student.rows[0].id}`).emit('new_notification', {
        message: `New ${type} intervention assigned by your mentor.`,
      });
      // Save notification
      await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
        [student.rows[0].id, `New ${type} intervention assigned by your mentor.`]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
