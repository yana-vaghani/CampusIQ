const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/timetable/:section
router.get('/:section', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.name as subject_name, s.code as subject_code
       FROM timetable t JOIN subjects s ON t.subject_id = s.id
       WHERE t.section = $1
       ORDER BY CASE t.day
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
         WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4
         WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END,
         t.start_time`,
      [req.params.section]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/timetable
router.post('/', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { subjectId, section, day, startTime, endTime, roomNumber } = req.body;
    const result = await pool.query(
      `INSERT INTO timetable (subject_id, section, day, start_time, end_time, room_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [subjectId, section, day, startTime, endTime, roomNumber]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/timetable/:id
router.put('/:id', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { subjectId, section, day, startTime, endTime, roomNumber } = req.body;
    const result = await pool.query(
      `UPDATE timetable SET subject_id=$1, section=$2, day=$3, start_time=$4, end_time=$5, room_number=$6
       WHERE id = $7 RETURNING *`,
      [subjectId, section, day, startTime, endTime, roomNumber, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/timetable/:id
router.delete('/:id', auth, roleGuard('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM timetable WHERE id = $1', [req.params.id]);
    res.json({ message: 'Timetable entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
