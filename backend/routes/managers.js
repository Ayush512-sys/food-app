const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

// @desc    Update Mess Fee
// @route   PUT /api/managers/fee
// @access  Private/Manager
router.put('/fee', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { messFee } = req.body;
    
    if (messFee === undefined || messFee < 0) {
      return res.status(400).json({ success: false, message: 'Valid mess fee is required' });
    }

    const manager = await Manager.findById(req.user.id);
    if (!manager) return res.status(404).json({ success: false, message: 'Manager not found' });

    manager.messFee = messFee;
    await manager.save();

    res.json({ success: true, data: manager });
  } catch (err) {
    next(err);
  }
});

// @desc    Get Mess Fee for Manager
// @route   GET /api/managers/fee
// @access  Private/Manager
router.get('/fee', protect, authorize('manager'), async (req, res, next) => {
  try {
    const manager = await Manager.findById(req.user.id);
    if (!manager) return res.status(404).json({ success: false, message: 'Manager not found' });

    res.json({ success: true, messFee: manager.messFee });
  } catch (err) {
    next(err);
  }
});

// @desc    Update Student Subscription Dates
// @route   PUT /api/managers/students/:id/subscription
// @access  Private/Manager
router.put('/students/:id/subscription', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { subscriptionStart, subscriptionEnd } = req.body;
    
    // Ensure the student belongs to the manager's hostel
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    if (student.hostel !== req.user.hostel) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this student' });
    }

    if (subscriptionStart) student.subscriptionStart = new Date(subscriptionStart);
    if (subscriptionEnd) student.subscriptionEnd = new Date(subscriptionEnd);
    
    // If end date is in the future, mark as subscribed
    if (student.subscriptionEnd > new Date()) {
        student.subscribed = true;
    } else {
        student.subscribed = false;
    }

    await student.save();

    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

// @desc    Add a new student to manager's hostel
// @route   POST /api/managers/students
// @access  Private/Manager
router.post('/students', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { name, email, rollNumber, password, roomNumber, contact } = req.body;

    const studentExists = await Student.findOne({ $or: [{ email }, { rollNumber }] });
    if (studentExists) {
      return res.status(400).json({ success: false, message: 'Student with this email or roll number already exists' });
    }

    const student = await Student.create({
      name,
      email,
      rollNumber,
      password,
      hostel: req.user.hostel, // Assign to manager's hostel
      roomNumber,
      contact,
      subscribed: true,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      dueAmount: 0
    });

    res.status(201).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

// @desc    Remove a student from manager's hostel
// @route   DELETE /api/managers/students/:id
// @access  Private/Manager
router.delete('/students/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    if (student.hostel !== req.user.hostel) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this student' });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Student removed successfully' });
  } catch (err) {
    next(err);
  }
});

// @desc    Update student details
// @route   PUT /api/managers/students/:id
// @access  Private/Manager
router.put('/students/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { name, email, rollNumber, roomNumber, contact } = req.body;
    
    let student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    if (student.hostel !== req.user.hostel) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this student' });
    }

    if (email && email !== student.email) {
      const emailExists = await Student.findOne({ email });
      if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    if (rollNumber && rollNumber !== student.rollNumber) {
      const rollExists = await Student.findOne({ rollNumber });
      if (rollExists) return res.status(400).json({ success: false, message: 'Roll number already in use' });
    }

    student.name = name || student.name;
    student.email = email || student.email;
    student.rollNumber = rollNumber || student.rollNumber;
    student.roomNumber = roomNumber || student.roomNumber;
    student.contact = contact || student.contact;

    await student.save();

    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

// @desc    Update student subscription dates
// @route   PUT /api/managers/students/:id/subscription
// @access  Private/Manager
router.put('/students/:id/subscription', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { subscriptionStart, subscriptionEnd } = req.body;
    
    let student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    if (student.hostel !== req.user.hostel) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this student' });
    }

    if (subscriptionStart) student.subscriptionStart = new Date(subscriptionStart);
    if (subscriptionEnd) student.subscriptionEnd = new Date(subscriptionEnd);

    await student.save();

    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
