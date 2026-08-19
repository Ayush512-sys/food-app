const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
    unique: true
  },
  breakfast: {
    type: String,
    required: [true, 'Please add breakfast menu']
  },
  lunch: {
    type: String,
    required: [true, 'Please add lunch menu']
  },
  dinner: {
    type: String,
    required: [true, 'Please add dinner menu']
  }
}, { timestamps: true });

module.exports = mongoose.model('Menu', MenuSchema);
