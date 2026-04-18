const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/authMiddleware');
const roleGuard = require('../middleware/roleGuard');

// GET /api/hallticket/rules
router.get('/rules', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hall_ticket_rules LIMIT 1');
    res.json(result.rows[0] || { min_attendance_percent: 75, enabled: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/hallticket/rules
router.put('/rules', auth, roleGuard('admin'), async (req, res) => {
  try {
    const { minAttendancePercent, enabled } = req.body;
    const existing = await pool.query('SELECT id FROM hall_ticket_rules LIMIT 1');
    if (existing.rows.length > 0) {
      const result = await pool.query(
        'UPDATE hall_ticket_rules SET min_attendance_percent = $1, enabled = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [minAttendancePercent, enabled, existing.rows[0].id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        'INSERT INTO hall_ticket_rules (min_attendance_percent, enabled) VALUES ($1, $2) RETURNING *',
        [minAttendancePercent, enabled]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hallticket/:studentId/eligibility
router.get('/:studentId/eligibility', auth, async (req, res) => {
  try {
    const rules = await pool.query('SELECT * FROM hall_ticket_rules LIMIT 1');
    if (rules.rows.length === 0 || !rules.rows[0].enabled) {
      return res.json({ eligible: false, reason: 'Hall ticket generation is disabled' });
    }
    const minPct = parseFloat(rules.rows[0].min_attendance_percent);

    const stats = await pool.query(
      `SELECT s.id, s.name, s.code,
              COUNT(*) FILTER (WHERE a.status='present') as present,
              COUNT(*) as total
       FROM attendance a JOIN subjects s ON a.subject_id = s.id
       WHERE a.student_id = $1 GROUP BY s.id, s.name, s.code`,
      [req.params.studentId]
    );

    const ineligible = stats.rows.filter(s => {
      const pct = parseInt(s.total) > 0 ? (parseInt(s.present) / parseInt(s.total)) * 100 : 0;
      return pct < minPct;
    }).map(s => ({
      subject: s.name,
      code: s.code,
      attendance: (parseInt(s.present) / parseInt(s.total) * 100).toFixed(1),
    }));

    res.json({ eligible: ineligible.length === 0, minAttendance: minPct, ineligibleSubjects: ineligible });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
