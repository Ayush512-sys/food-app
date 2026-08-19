const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');

// @desc    Update student profile details
// @route   PUT /api/students/profile
// @access  Private/Student
router.put('/profile', protect, authorize('student'), async (req, res, next) => {
  try {
    const { roomNumber, contact } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { roomNumber, contact },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: student
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get student stats (dashboard overview details)
// @route   GET /api/students/stats
// @access  Private/Student
router.get('/stats', protect, authorize('student'), async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Total feedbacls submitted
    const feedbackCount = await Feedback.countDocuments({ student: studentId });

    // Total leaves/absences marked
    const attendanceRecords = await Attendance.find({ student: studentId });
    let totalAbsentMeals = 0;
    
    attendanceRecords.forEach(record => {
      if (record.breakfast === 'Absent' || record.breakfast === 'Leave') totalAbsentMeals++;
      if (record.lunch === 'Absent' || record.lunch === 'Leave') totalAbsentMeals++;
      if (record.dinner === 'Absent' || record.dinner === 'Leave') totalAbsentMeals++;
    });

    const student = await Student.findById(studentId);

    res.json({
      success: true,
      stats: {
        feedbackSubmitted: feedbackCount,
        absentMealsMarked: totalAbsentMeals,
        subscribed: student.subscribed,
        subscriptionStart: student.subscriptionStart,
        subscriptionEnd: student.subscriptionEnd,
        dueAmount: student.dueAmount
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
