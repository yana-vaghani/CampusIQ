const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '..', 'uploads', 'csv') });

// PUT /api/marks/bulk — MUST be before /:studentId
router.put('/bulk', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const { marks } = req.body;
    if (!marks || !Array.isArray(marks)) {
      return res.status(400).json({ error: 'Marks array required' });
    }
    for (const m of marks) {
      await pool.query(
        `INSERT INTO marks (student_id, subject_id, mid_marks, internal_marks, ia_marks, endsem_marks)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, subject_id) DO UPDATE 
         SET mid_marks = $3, internal_marks = $4, ia_marks = $5, endsem_marks = $6`,
        [m.studentId, m.subjectId, m.midMarks || 0, m.internalMarks || 0, m.iaMarks || 0, m.endsemMarks !== undefined ? m.endsemMarks : null]
      );
    }

    const io = req.app.get('io');
    if (io) {
      const studentIds = [...new Set(marks.map(m => m.studentId))];
      for (const sid of studentIds) {
        const student = await pool.query('SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = $1', [sid]);
        if (student.rows[0]) {
          const msg = 'Your marks have been updated. Check your grades.';
          io.to(`user_${student.rows[0].id}`).emit('new_notification', { message: msg });
        }
      }
    }
    res.json({ message: 'Marks saved successfully', count: marks.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/marks/csv-upload — MUST be before /:studentId
router.post('/csv-upload', auth, roleGuard('teacher', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    const { subjectId, examType } = req.body;
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
            const updateCol = examType === 'mid' ? 'mid_marks' :
                             examType === 'internal' ? 'internal_marks' :
                             examType === 'ia' ? 'ia_marks' : 'endsem_marks';
            await pool.query(
              `INSERT INTO marks (student_id, subject_id, ${updateCol})
               VALUES ($1, $2, $3)
               ON CONFLICT (student_id, subject_id) DO UPDATE 
               SET ${updateCol} = $3`,
              [student.rows[0].id, subjectId, row.marks || row[examType + '_marks'] || 0]
            );
            count++;
          }
        }
        fs.unlinkSync(req.file.path);
        res.json({ message: `${count} marks records imported from CSV`, count });
      })
      .on('error', (err) => {
        res.status(500).json({ error: 'CSV parsing failed' });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/marks/export/:subjectId — MUST be before /:studentId
router.get('/export/:subjectId', auth, roleGuard('teacher', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.roll_no, u.name as student_name, m.mid_marks, m.internal_marks, m.ia_marks, m.endsem_marks,
              (COALESCE(m.mid_marks,0) + COALESCE(m.internal_marks,0)) as total_internal
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN marks m ON m.student_id = s.id AND m.subject_id = $1
       ORDER BY s.roll_no`,
      [req.params.subjectId]
    );
    const headers = 'roll_no,student_name,mid_marks,internal_marks,ia_marks,endsem_marks,total_internal\n';
    const rows = result.rows.map(r =>
      `${r.roll_no},${r.student_name},${r.mid_marks||0},${r.internal_marks||0},${r.ia_marks||0},${r.endsem_marks||''},${r.total_internal||0}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=marks_subject_${req.params.subjectId}.csv`);
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/marks/:studentId — dynamic param LAST
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

module.exports = router;
