const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  targetRole: {
    type: String,
    enum: ['All', 'Student', 'Manager', 'Admin'],
    default: 'All'
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student', // Can also refer to Manager/Admin dynamically if needed, but primarily Student
    default: null
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours TTL index
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
