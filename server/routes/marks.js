const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '..', 'uploads', 'csv') });

// GET /api/marks/:studentId
router.get('/:studentId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, s.name as subject_name, s.code as subject_code
       FROM marks m JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = $1`,
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/marks/bulk — teacher bulk save
router.put('/bulk', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const { marks } = req.body; // [{studentId, subjectId, midMarks, internalMarks, endsemMarks}]
    if (!marks || !Array.isArray(marks)) {
      return res.status(400).json({ error: 'Marks array required' });
    }
    for (const m of marks) {
      await pool.query(
        `INSERT INTO marks (student_id, subject_id, mid_marks, internal_marks, endsem_marks)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, subject_id) DO UPDATE 
         SET mid_marks = $3, internal_marks = $4, endsem_marks = $5`,
        [m.studentId, m.subjectId, m.midMarks, m.internalMarks, m.endsemMarks]
      );
    }

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      const studentIds = [...new Set(marks.map(m => m.studentId))];
      for (const sid of studentIds) {
        const student = await pool.query(
          'SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = $1', [sid]
        );
        if (student.rows[0]) {
          io.to(`user_${student.rows[0].id}`).emit('new_notification', {
            message: 'Your marks have been updated. Check your grades.',
          });
        }
      }
    }

    res.json({ message: 'Marks saved successfully', count: marks.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/marks/csv-upload
router.post('/csv-upload', auth, roleGuard('teacher', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    const { subjectId } = req.body;
    if (!subjectId) return res.status(400).json({ error: 'Subject ID required' });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let count = 0;
        for (const row of results) {
          const student = await pool.query('SELECT id FROM students WHERE roll_no = $1', [row.roll_no]);
          if (student.rows[0]) {
            await pool.query(
              `INSERT INTO marks (student_id, subject_id, mid_marks, internal_marks, endsem_marks)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (student_id, subject_id) DO UPDATE 
               SET mid_marks = $3, internal_marks = $4, endsem_marks = $5`,
              [student.rows[0].id, subjectId, row.mid_marks || 0, row.internal_marks || 0, row.endsem_marks || 0]
            );
            count++;
          }
        }
        // Clean up temp file
        fs.unlinkSync(req.file.path);
        res.json({ message: `${count} marks records imported from CSV`, count });
      });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
