const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '..', 'uploads', 'csv') });

// GET /api/users
router.get('/', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = 'SELECT id, name, email, role, department, created_at FROM users';
    const params = [];
    const conditions = [];
    if (role) { params.push(role); conditions.push(`role = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users
router.post('/', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, department',
      [name, email, hash, role, department]
    );

    // If student, create student record
    if (role === 'student') {
      const rollNo = `CS${new Date().getFullYear()}${String(result.rows[0].id).padStart(3, '0')}`;
      await pool.query(
        'INSERT INTO students (user_id, roll_no, semester, section) VALUES ($1, $2, $3, $4)',
        [result.rows[0].id, rollNo, 1, 'A']
      );
    }
    // If teacher/mentor, create faculty record
    if (role === 'teacher' || role === 'mentor') {
      await pool.query(
        'INSERT INTO faculty (user_id, department) VALUES ($1, $2)',
        [result.rows[0].id, department]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', auth, roleGuard('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/csv-import
router.post('/csv-import', auth, roleGuard('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let count = 0;
        for (const row of results) {
          try {
            const hash = await bcrypt.hash(row.password || 'Default@123', 10);
            await pool.query(
              'INSERT INTO users (name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
              [row.name, row.email, hash, row.role || 'student', row.department || 'General']
            );
            count++;
          } catch (e) { /* skip errors */ }
        }
        fs.unlinkSync(req.file.path);
        res.json({ message: `${count} users imported`, count });
      });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
