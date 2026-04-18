function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room user_${userId}`);
    });

    // Leave room
    socket.on('leave', (userId) => {
      socket.leave(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
}

function sendNotification(io, userId, data) {
  io.to(`user_${userId}`).emit('new_notification', data);
}

function sendClassReminder(io, userId, data) {
  io.to(`user_${userId}`).emit('class_reminder', data);
}

function sendRiskAlert(io, userId, data) {
  io.to(`user_${userId}`).emit('risk_alert', data);
}

module.exports = { initSocket, sendNotification, sendClassReminder, sendRiskAlert };
