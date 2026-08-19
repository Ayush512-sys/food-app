const express = require('express');
const router = express.Router();
const WasteRecord = require('../models/WasteRecord');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get waste tracking history and analytics
// @route   GET /api/waste
// @access  Private/Manager
router.get('/', protect, authorize('manager'), async (req, res, next) => {
  try {
    const records = await WasteRecord.find()
      .sort({ date: -1 })
      .limit(30); // Last 30 logs

    // Calculate today's total waste
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = await WasteRecord.find({ date: todayStr });

    let todayWasteWeight = 0;
    let todayEstimatedCost = 0;

    todayRecords.forEach(r => {
      todayWasteWeight += r.wasteWeight;
      todayEstimatedCost += r.estimatedCost;
    });

    res.json({
      success: true,
      todayWasteWeight: parseFloat(todayWasteWeight.toFixed(2)),
      todayEstimatedCost: parseFloat(todayEstimatedCost.toFixed(2)),
      records: records.reverse() // Sort chronologically for Recharts
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Add a waste log record
// @route   POST /api/waste
// @access  Private/Manager
router.post('/', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { date, mealType, wasteWeight, itemsWasted } = req.body;

    if (!date || !mealType || wasteWeight === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide date, meal type, and waste weight' });
    }

    // Estimate cost: let's assume 1 kg of food waste costs roughly 120 INR on average
    const estimatedCost = Math.round(wasteWeight * 120);

    let record = await WasteRecord.findOne({ date, mealType });
    if (record) {
      record.wasteWeight = wasteWeight;
      record.estimatedCost = estimatedCost;
      record.itemsWasted = itemsWasted || [];
      await record.save();
    } else {
      record = await WasteRecord.create({
        date,
        mealType,
        wasteWeight,
        estimatedCost,
        itemsWasted: itemsWasted || []
      });
    }

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
