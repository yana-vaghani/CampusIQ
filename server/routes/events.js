const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/events
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.name as created_by_name FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       ORDER BY e.date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events
router.post('/', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const result = await pool.query(
      'INSERT INTO events (title, date, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, date, description, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', auth, roleGuard('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
