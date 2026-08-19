const mongoose = require('mongoose');

const ForecastSchema = new mongoose.Schema({
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  },
  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner'],
    required: true
  },
  predictedAttendance: {
    type: Number,
    required: true
  },
  suggestedRoti: {
    type: Number,
    required: true
  },
  suggestedRiceQty: {
    type: Number, // in kg
    required: true
  },
  suggestedVegQty: {
    type: Number, // in kg
    required: true
  }
}, { timestamps: true });

// Ensure unique index for date + mealType
ForecastSchema.index({ date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('Forecast', ForecastSchema);
