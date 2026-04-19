const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/classrooms
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM classrooms ORDER BY number');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/classrooms
router.post('/', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { number, capacity, type, building } = req.body;
    if (!number) return res.status(400).json({ error: 'Room number required' });
    const result = await pool.query(
      'INSERT INTO classrooms (number, capacity, type, building) VALUES ($1, $2, $3, $4) RETURNING *',
      [number, capacity || 60, type || 'lecture', building || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Room number already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/classrooms/:id
router.put('/:id', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { number, capacity, type, building, isAvailable } = req.body;
    const result = await pool.query(
      'UPDATE classrooms SET number=$1, capacity=$2, type=$3, building=$4, is_available=$5 WHERE id=$6 RETURNING *',
      [number, capacity, type, building, isAvailable, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/classrooms/:id
router.delete('/:id', auth, roleGuard('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM classrooms WHERE id=$1', [req.params.id]);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
