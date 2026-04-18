const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'lms')),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

// GET /api/lms/:subjectId
router.get('/:subjectId', auth, async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = 'SELECT * FROM lms_content WHERE subject_id = $1';
    const params = [req.params.subjectId];
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND title ILIKE $${params.length}`;
    }
    query += ' ORDER BY uploaded_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lms/upload
router.post('/upload', auth, roleGuard('teacher', 'admin'), upload.single('file'), async (req, res) => {
  try {
    const { subjectId, title, type } = req.body;
    const fileUrl = req.file ? `/uploads/lms/${req.file.filename}` : null;
    const result = await pool.query(
      'INSERT INTO lms_content (subject_id, title, file_url, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [subjectId, title, fileUrl, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/lms/:contentId
router.delete('/:contentId', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM lms_content WHERE id = $1', [req.params.contentId]);
    res.json({ message: 'Content deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
