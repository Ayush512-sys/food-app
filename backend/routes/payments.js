const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Manager = require('../models/Manager');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get student's payment history
// @route   GET /api/payments/history
// @access  Private/Student
router.get('/history', protect, authorize('student'), async (req, res, next) => {
  try {
    const history = await Payment.find({ student: req.user.id })
      .sort({ paymentDate: -1 });

    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

// @desc    Get Mess Fee for Student
// @route   GET /api/payments/fee
// @access  Private/Student
router.get('/fee', protect, authorize('student'), async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);
    const manager = await Manager.findOne({ hostel: student.hostel });
    const fee = manager && manager.messFee !== undefined ? manager.messFee : 3500;
    
    res.json({ success: true, messFee: fee });
  } catch (err) {
    next(err);
  }
});

// @desc    Create a simulated payment
// @route   POST /api/payments/pay
// @access  Private/Student
router.post('/pay', protect, authorize('student'), async (req, res, next) => {
  try {
    let { amount } = req.body;
    
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!amount) {
      const manager = await Manager.findOne({ hostel: student.hostel });
      amount = manager && manager.messFee !== undefined ? manager.messFee : 3500;
    }

    // Generate simulated transaction ID
    const transactionId = 'TXN' + Math.floor(Math.random() * 1000000000);
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // extends sub by 30 days

    // Create payment record
    const payment = await Payment.create({
      student: student._id,
      amount,
      expiryDate,
      status: 'Success',
      transactionId
    });

    // Update student subscription status
    student.subscribed = true;
    student.subscriptionStart = new Date();
    student.subscriptionEnd = expiryDate;
    student.dueAmount = Math.max(0, student.dueAmount - amount);
    await student.save();

    res.status(201).json({
      success: true,
      data: payment,
      user: student
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
