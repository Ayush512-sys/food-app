const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Manager = require('../models/Manager');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

// Generate JWT token helper
const generateToken = (id, role, hostel = null) => {
  return jwt.sign(
    { id, role, hostel },
    process.env.JWT_SECRET || 'super_secret_foodback_ai_token_key_12345',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, rollNumber, password, hostel, roomNumber, contact } = req.body;

    const studentExists = await Student.findOne({ $or: [{ email }, { rollNumber }] });
    if (studentExists) {
      return res.status(400).json({ success: false, message: 'Student with this email or roll number already exists' });
    }

    const student = await Student.create({
      name,
      email,
      rollNumber,
      password,
      hostel,
      roomNumber,
      contact,
      subscribed: true,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      dueAmount: 0
    });

    const token = generateToken(student._id, 'student');
    res.status(201).json({
      success: true,
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        role: 'student',
        hostel: student.hostel,
        roomNumber: student.roomNumber,
        contact: student.contact
      }
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Login student, manager, or admin
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { role, password } = req.body;
    let emailOrRoll = req.body.emailOrRoll?.trim();
    let managerId = req.body.managerId?.trim();
    let email = req.body.email?.trim();

    if (!role || !password) {
      return res.status(400).json({ success: false, message: 'Please provide role and password' });
    }

    if (role === 'student') {
      // emailOrRoll already extracted and trimmed
      if (!emailOrRoll) {
        return res.status(400).json({ success: false, message: 'Please provide email or roll number' });
      }

      const student = await Student.findOne({
        $or: [{ email: emailOrRoll }, { rollNumber: emailOrRoll }]
      }).select('+password');

      if (!student || !(await student.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(student._id, 'student');
      return res.json({
        success: true,
        token,
        user: {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          role: 'student',
          hostel: student.hostel,
          roomNumber: student.roomNumber,
          contact: student.contact,
          subscribed: student.subscribed,
          subscriptionStart: student.subscriptionStart,
          subscriptionEnd: student.subscriptionEnd,
          dueAmount: student.dueAmount
        }
      });
    }

    if (role === 'manager') {
      // managerId already extracted and trimmed
      if (!managerId) {
        return res.status(400).json({ success: false, message: 'Please provide Manager ID' });
      }

      const manager = await Manager.findOne({ managerId }).select('+password');
      if (!manager || !(await manager.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(manager._id, 'manager', manager.hostel);
      return res.json({
        success: true,
        token,
        user: {
          id: manager._id,
          name: manager.name,
          managerId: manager.managerId,
          role: 'manager',
          hostel: manager.hostel
        }
      });
    }

    if (role === 'admin') {
      // email already extracted and trimmed
      if (!email) {
        return res.status(400).json({ success: false, message: 'Please provide admin email' });
      }

      const admin = await Admin.findOne({ email }).select('+password');
      if (!admin || !(await admin.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(admin._id, 'admin');
      return res.json({
        success: true,
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin'
        }
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid user role' });
  } catch (err) {
    next(err);
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    let userDetails = null;

    if (req.user.role === 'student') {
      userDetails = await Student.findById(req.user.id);
    } else if (req.user.role === 'manager') {
      userDetails = await Manager.findById(req.user.id);
    } else if (req.user.role === 'admin') {
      userDetails = await Admin.findById(req.user.id);
    }

    if (!userDetails) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.json({
      success: true,
      user: {
        ...userDetails.toObject(),
        role: req.user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Mock Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', (req, res) => {
  const { email, role } = req.body;
  res.json({
    success: true,
    message: `A simulated password reset instructions has been sent to ${email} (Role: ${role}).`
  });
});

module.exports = router;
