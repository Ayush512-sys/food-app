const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @desc    Submit feedback for a meal
// @route   POST /api/feedback
// @access  Private/Student
router.post('/', protect, authorize('student'), async (req, res, next) => {
  try {
    const { mealType, rating, comments } = req.body;

    if (!mealType || !rating || !comments) {
      return res.status(400).json({ success: false, message: 'Please provide meal type, rating and comments' });
    }

    const feedback = await Feedback.create({
      student: req.user.id,
      mealType,
      rating,
      comments,
      date: new Date()
    });

    const notification = await Notification.create({
      targetRole: 'Manager',
      title: `New Meal Feedback: ${rating} Stars`,
      message: `${mealType} - ${comments.substring(0, 30)}...`
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('feedback_new', feedback);
      io.emit('notification_new', notification);
    }

    res.status(201).json({ success: true, data: feedback });
  } catch (err) {
    next(err);
  }
});

// @desc    Get current student's feedback history
// @route   GET /api/feedback/history
// @access  Private/Student
router.get('/history', protect, authorize('student'), async (req, res, next) => {
  try {
    const simDateStr = req.headers['x-simulated-date'];
    const currentDate = simDateStr ? new Date(simDateStr) : new Date();
    const thresholdDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

    const history = await Feedback.find({ 
      student: req.user.id,
      date: { $gte: thresholdDate }
    }).sort({ date: -1 });

    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

// @desc    Get aggregate feedback stats for managers
// @route   GET /api/feedback/stats
// @access  Private/Manager
router.get('/stats', protect, authorize('manager'), async (req, res, next) => {
  try {
    const hostel = req.user.hostel;

    // Find student IDs in this hostel
    const students = await Student.find({ hostel }).select('_id');
    const ids = students.map(s => s._id);

    const simDateStr = req.headers['x-simulated-date'];
    const currentDate = simDateStr ? new Date(simDateStr) : new Date();
    const thresholdDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

    // Get feedback from these students within last 24 hours
    const feedbacks = await Feedback.find({ 
      student: { $in: ids },
      date: { $gte: thresholdDate }
    })
      .populate('student', 'name rollNumber roomNumber')
      .sort({ date: -1 });

    // Aggregate stats
    let totalRating = 0;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    feedbacks.forEach(f => {
      totalRating += f.rating;
      ratingCounts[f.rating] = (ratingCounts[f.rating] || 0) + 1;
    });

    const averageRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(1) : 'N/A';

    res.json({
      success: true,
      averageRating,
      totalReviews: feedbacks.length,
      ratingCounts,
      feedbacks: feedbacks.slice(0, 50) // Return recent 50 reviews
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
