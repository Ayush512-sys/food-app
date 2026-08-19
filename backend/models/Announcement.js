const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically deletes document after 24 hours
  }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
