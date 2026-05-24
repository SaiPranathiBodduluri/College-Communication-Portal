// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB } = require('./database-setup'); // keep your connectDB implementation

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "*"
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database
connectDB(); // your function should connect using process.env.MONGO_URI

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (userId) => {
    if (userId) socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes if needed
app.set('io', io);

// Routes - adjust the paths to match your route files
app.use('/api/auth', require('./routes/auth'));
app.use('/api/register', require('./routes/register'));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/users', require('./routes/users'));
app.use('/api/department-structure', require('./routes/departmentStructure'));
app.use('/api/faculty', require('./routes/facultyAccess'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/data-management', require('./routes/dataManagement'));
app.use('/api/notifications', require('./routes/notifications'));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
