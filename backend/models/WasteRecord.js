const mongoose = require('mongoose');

const WasteRecordSchema = new mongoose.Schema({
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  },
  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner'],
    required: true
  },
  wasteWeight: {
    type: Number, // weight in kg
    required: [true, 'Please add waste weight']
  },
  estimatedCost: {
    type: Number, // cost in INR
    required: [true, 'Please add estimated waste cost']
  },
  itemsWasted: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Ensure unique index for date + mealType
WasteRecordSchema.index({ date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('WasteRecord', WasteRecordSchema);
