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
       ORDER BY e.start_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events
router.post('/', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { title, startDate, endDate, description } = req.body;
    if (!title || !startDate) return res.status(400).json({ error: 'Title and start date required' });
    const result = await pool.query(
      'INSERT INTO events (title, start_date, end_date, description, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, startDate, endDate || startDate, description, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/events/:id
router.put('/:id', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { title, startDate, endDate, description } = req.body;
    const result = await pool.query(
      'UPDATE events SET title=$1, start_date=$2, end_date=$3, description=$4 WHERE id=$5 RETURNING *',
      [title, startDate, endDate || startDate, description, req.params.id]
    );
    res.json(result.rows[0]);
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
