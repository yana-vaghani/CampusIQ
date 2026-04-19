require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Server } = require('socket.io');
const { initSocket } = require('./services/socketService');
const { startScheduler } = require('./services/scheduler');

const app = express();
const server = http.createServer(app);
const pdfRoutes = require("./routes/pdfRoutes");


const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", pdfRoutes);

// Ensure upload directories exist
const fs = require('fs');
['uploads/assignments', 'uploads/lms', 'uploads/csv'].forEach(dir => {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

// Static uploads — accessible directly by frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/lms', require('./routes/lms'));
app.use('/api/interventions', require('./routes/interventions'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/users', require('./routes/users'));
app.use('/api/hallticket', require('./routes/hallticket'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/classrooms', require('./routes/classrooms'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initSocket(io);
startScheduler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 CampusIQ Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});

module.exports = { app, server, io };
