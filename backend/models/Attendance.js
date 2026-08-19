const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  },
  breakfast: {
    type: String,
    enum: ['Present', 'Absent', 'Leave'],
    default: 'Present'
  },
  lunch: {
    type: String,
    enum: ['Present', 'Absent', 'Leave'],
    default: 'Present'
  },
  dinner: {
    type: String,
    enum: ['Present', 'Absent', 'Leave'],
    default: 'Present'
  },
  corrected: {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Ensure unique index for student + date combination
AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
