const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Forecast = require('../models/Forecast');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get AI forecasting predictions
// @route   GET /api/forecasting
// @access  Private/Manager
router.get('/', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { date, mealType, isExamSeason, weather, isHoliday } = req.query;

    if (!date || !mealType) {
      return res.status(400).json({ success: false, message: 'Please specify date and mealType' });
    }

    const hostel = req.user.hostel;
    const todayStr = date;

    // 1. Get total students registered
    const totalStudents = await Student.countDocuments({ hostel });
    const studentIds = await Student.find({ hostel }).select('_id');
    const ids = studentIds.map(s => s._id);

    // 2. Get students marked absent for this meal
    const attendanceRecords = await Attendance.find({
      student: { $in: ids },
      date: todayStr
    });

    const mealKey = mealType.toLowerCase();
    let absentCount = 0;
    attendanceRecords.forEach(record => {
      if (record[mealKey] === 'Leave' || record[mealKey] === 'Absent') {
        absentCount++;
      }
    });

    // 3. Heuristics Model (Simulating AI regression)
    let predictedAttendance = totalStudents - absentCount;

    // Apply adjustments based on environmental factors
    if (isExamSeason === 'true') {
      predictedAttendance = Math.round(predictedAttendance * 0.9); // 10% decrease
    }
    if (isHoliday === 'true') {
      predictedAttendance = Math.round(predictedAttendance * 0.5); // 50% decrease (students go home)
    }

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    if (dayName === 'Sunday' && mealType === 'Dinner') {
      predictedAttendance = Math.round(predictedAttendance * 0.7); // 30% decrease on Sunday dinner
    }

    if (weather === 'Rainy') {
      predictedAttendance = Math.round(predictedAttendance * 1.05); // 5% increase (fewer students eat out)
    }

    // Ensure predicted attendance is at least 0 and doesn't exceed total registered students
    predictedAttendance = Math.max(0, Math.min(predictedAttendance, totalStudents));

    // 4. Calculate portion recommendations
    // Roti: 2.5 rotis per student (only if lunch/dinner)
    const suggestedRoti = (mealType === 'Lunch' || mealType === 'Dinner') ? predictedAttendance * 2.5 : 0;
    
    // Rice: 0.12 kg per student for Lunch, 0.08 kg for Dinner
    let suggestedRiceQty = 0;
    if (mealType === 'Lunch') suggestedRiceQty = parseFloat((predictedAttendance * 0.12).toFixed(2));
    else if (mealType === 'Dinner') suggestedRiceQty = parseFloat((predictedAttendance * 0.08).toFixed(2));

    // Vegetables: 0.15 kg per student
    const suggestedVegQty = parseFloat((predictedAttendance * 0.15).toFixed(2));

    // 5. Save or update this forecast in the database
    let forecast = await Forecast.findOne({ date: todayStr, mealType });
    if (!forecast) {
      forecast = new Forecast({
        date: todayStr,
        mealType
      });
    }

    forecast.predictedAttendance = predictedAttendance;
    forecast.suggestedRoti = suggestedRoti;
    forecast.suggestedRiceQty = suggestedRiceQty;
    forecast.suggestedVegQty = suggestedVegQty;
    await forecast.save();

    res.json({
      success: true,
      data: {
        date,
        mealType,
        totalStudents,
        absentMarked: absentCount,
        predictedAttendance,
        suggestedRoti,
        suggestedRiceQty, // kg
        suggestedVegQty,  // kg
        isExamSeason: isExamSeason === 'true',
        weather: weather || 'Normal',
        isHoliday: isHoliday === 'true',
        dayOfWeek: dayName
      }
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get daily predictions for all 3 meals
// @route   GET /api/forecasting/daily
// @access  Private/Manager
router.get('/daily', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { date, isExamSeason, weather, isHoliday } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Please specify date' });
    }

    const hostel = req.user.hostel;
    const todayStr = date;

    const totalStudents = await Student.countDocuments({ hostel });
    const studentIds = await Student.find({ hostel }).select('_id');
    const ids = studentIds.map(s => s._id);

    const attendanceRecords = await Attendance.find({
      student: { $in: ids },
      date: todayStr
    });

    const calculateMeal = async (mealType) => {
      const mealKey = mealType.toLowerCase();
      let absentCount = 0;
      attendanceRecords.forEach(record => {
        if (record[mealKey] === 'Leave' || record[mealKey] === 'Absent') {
          absentCount++;
        }
      });

      let predictedAttendance = totalStudents - absentCount;

      if (isExamSeason === 'true') {
        predictedAttendance = Math.round(predictedAttendance * 0.9);
      }
      if (isHoliday === 'true') {
        predictedAttendance = Math.round(predictedAttendance * 0.5);
      }

      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      if (dayName === 'Sunday' && mealType === 'Dinner') {
        predictedAttendance = Math.round(predictedAttendance * 0.7);
      }

      if (weather === 'Rainy') {
        predictedAttendance = Math.round(predictedAttendance * 1.05);
      }

      predictedAttendance = Math.max(0, Math.min(predictedAttendance, totalStudents));

      const suggestedRoti = (mealType === 'Lunch' || mealType === 'Dinner') ? predictedAttendance * 2.5 : 0;
      let suggestedRiceQty = 0;
      if (mealType === 'Lunch') suggestedRiceQty = parseFloat((predictedAttendance * 0.12).toFixed(2));
      else if (mealType === 'Dinner') suggestedRiceQty = parseFloat((predictedAttendance * 0.08).toFixed(2));
      const suggestedVegQty = parseFloat((predictedAttendance * 0.15).toFixed(2));

      // Lock status logic based on server time
      let isLocked = false;
      const now = new Date();
      const targetDate = new Date(date);
      const isToday = now.toISOString().split('T')[0] === date;
      const isPast = targetDate < new Date(now.toISOString().split('T')[0]);

      if (isPast) {
        isLocked = true;
      } else if (isToday) {
        const hour = now.getHours();
        if (mealType === 'Breakfast' && hour >= 6) isLocked = true;
        if (mealType === 'Lunch' && hour >= 9) isLocked = true;
        if (mealType === 'Dinner' && hour >= 16) isLocked = true;
      }

      let lockMessage = '';
      if (mealType === 'Breakfast') lockMessage = 'Locks at 6:00 AM';
      if (mealType === 'Lunch') lockMessage = 'Locks at 9:00 AM';
      if (mealType === 'Dinner') lockMessage = 'Locks at 4:00 PM';

      return {
        mealType,
        predictedAttendance,
        absentMarked: absentCount,
        suggestedRoti,
        suggestedRiceQty,
        suggestedVegQty,
        isLocked,
        lockMessage
      };
    };

    const breakfast = await calculateMeal('Breakfast');
    const lunch = await calculateMeal('Lunch');
    const dinner = await calculateMeal('Dinner');

    res.json({
      success: true,
      data: {
        date,
        totalStudents,
        meals: { breakfast, lunch, dinner }
      }
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get weekly historical trends
// @route   GET /api/forecasting/weekly
// @access  Private/Manager
router.get('/weekly', protect, authorize('manager'), async (req, res, next) => {
  try {
    const hostel = req.user.hostel;
    const students = await Student.find({ hostel }).select('_id');
    const ids = students.map(s => s._id);

    // Get last 7 days dates
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const records = await Attendance.find({
      student: { $in: ids },
      date: { $in: dates }
    });

    const weeklyData = dates.map(date => {
      let b = 0, l = 0, d = 0;
      records.forEach(r => {
        if (r.date === date) {
          if (r.breakfast !== 'Absent' && r.breakfast !== 'Leave') b++;
          if (r.lunch !== 'Absent' && r.lunch !== 'Leave') l++;
          if (r.dinner !== 'Absent' && r.dinner !== 'Leave') d++;
        }
      });
      return { date, breakfast: b, lunch: l, dinner: d };
    });

    res.json({
      success: true,
      data: weeklyData
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
