const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'faculty', 'student'] }
  },
  recipient: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'faculty', 'student'] }
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ 'recipient.id': 1, createdAt: -1 });
messageSchema.index({ 'sender.id': 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
