const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');

// GET /api/faculty/my/subjects — MUST be before /:id
router.get('/my/subjects', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subjects WHERE teacher_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/faculty
router.get('/', auth, async (req, res) => {
  try {
    const { department, search } = req.query;
    let query = `SELECT f.*, u.name, u.email, u.role FROM faculty f JOIN users u ON f.user_id = u.id`;
    const params = [];
    const conditions = [];
    if (department) { params.push(department); conditions.push(`f.department = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`u.name ILIKE $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY u.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/faculty/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT f.*, u.name, u.email, u.role FROM faculty f JOIN users u ON f.user_id = u.id WHERE f.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Faculty not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
