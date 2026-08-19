const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  category: {
    type: String,
    enum: ['Food', 'Hygiene', 'Service'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved'],
    default: 'Pending'
  },
  managerReply: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
