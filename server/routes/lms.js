const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'lms');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

// GET /api/lms — all content (student learning hub). MUST be before /:subjectId
router.get('/', auth, async (req, res) => {
  try {
    const { type, search, subjectId } = req.query;
    let query = `SELECT l.*, s.name as subject_name, s.code as subject_code, u.name as uploaded_by_name 
                 FROM lms_content l 
                 JOIN subjects s ON l.subject_id = s.id 
                 LEFT JOIN users u ON l.uploaded_by = u.id 
                 WHERE 1=1`;
    const params = [];
    if (subjectId) { params.push(subjectId); query += ` AND l.subject_id = $${params.length}`; }
    if (type && type !== 'all') { params.push(type); query += ` AND l.type = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND l.title ILIKE $${params.length}`; }
    query += ' ORDER BY l.uploaded_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lms/upload — MUST be before /:subjectId
router.post('/upload', auth, roleGuard('teacher', 'admin', 'student'), upload.single('file'), async (req, res) => {
  try {
    const { subjectId, title, type } = req.body;
    if (!subjectId || !title || !type) return res.status(400).json({ error: 'subjectId, title, type required' });
    const fileUrl = req.file ? `/uploads/lms/${req.file.filename}` : null;
    const originalFilename = req.file ? req.file.originalname : null;
    const result = await pool.query(
      'INSERT INTO lms_content (subject_id, title, file_url, original_filename, type, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [subjectId, title, fileUrl, originalFilename, type, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/lms/:subjectId — per-subject content
router.get('/:subjectId', auth, async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = `SELECT l.*, u.name as uploaded_by_name 
                 FROM lms_content l 
                 LEFT JOIN users u ON l.uploaded_by = u.id 
                 WHERE l.subject_id = $1`;
    const params = [req.params.subjectId];
    if (type && type !== 'all') { params.push(type); query += ` AND l.type = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND l.title ILIKE $${params.length}`; }
    query += ' ORDER BY l.uploaded_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/lms/:contentId
router.delete('/:contentId', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const content = await pool.query('SELECT file_url FROM lms_content WHERE id=$1', [req.params.contentId]);
    if (content.rows[0]?.file_url) {
      const filePath = path.join(__dirname, '..', content.rows[0].file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM lms_content WHERE id = $1', [req.params.contentId]);
    res.json({ message: 'Content deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
