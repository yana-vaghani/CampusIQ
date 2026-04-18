const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get student/faculty info if applicable
    let extraInfo = {};
    if (user.role === 'student') {
      const student = await pool.query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      if (student.rows[0]) extraInfo.studentId = student.rows[0].id;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, ...extraInfo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, ...extraInfo },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, department FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = result.rows[0];
    let extraInfo = {};
    if (user.role === 'student') {
      const student = await pool.query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      if (student.rows[0]) extraInfo = { studentId: student.rows[0].id, rollNo: student.rows[0].roll_no, semester: student.rows[0].semester, section: student.rows[0].section };
    }

    res.json({ ...user, ...extraInfo });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
