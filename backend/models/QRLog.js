const mongoose = require('mongoose');

const QRLogSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner'],
    required: true
  },
  entryTime: {
    type: Date,
    default: Date.now
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('QRLog', QRLogSchema);
