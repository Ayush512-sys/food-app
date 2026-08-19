const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Manager = require('../models/Manager');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// @desc    Get all students (System Admin view)
// @route   GET /api/admin/students
// @access  Private/Admin
router.get('/students', protect, authorize('admin'), async (req, res, next) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
});

// @desc    Toggle student subscription or due amounts
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
router.put('/students/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { subscribed, dueAmount } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { subscribed, dueAmount },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const notification = await Notification.create({
      targetRole: 'Student',
      targetUser: student._id,
      title: 'Subscription Status Updated',
      message: `Your fee/subscription status has been updated by the Admin.`
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('student_updated', student);
      io.emit('notification_new', notification);
    }

    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a student
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
router.delete('/students/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const io = req.app.get('io');
    if (io) io.emit('student_deleted', req.params.id);

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// @desc    Get all managers
// @route   GET /api/admin/managers
// @access  Private/Admin
router.get('/managers', protect, authorize('admin'), async (req, res, next) => {
  try {
    const managers = await Manager.find().sort({ createdAt: -1 });
    res.json({ success: true, data: managers });
  } catch (err) {
    next(err);
  }
});

// @desc    Register a new manager
// @route   POST /api/admin/managers
// @access  Private/Admin
router.post('/managers', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, managerId, hostel, password } = req.body;

    const exists = await Manager.findOne({ managerId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Manager ID already registered' });
    }

    const manager = await Manager.create({
      name,
      managerId,
      hostel,
      password
    });

    res.status(201).json({ success: true, data: manager });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a manager
// @route   DELETE /api/admin/managers/:id
// @access  Private/Admin
router.delete('/managers/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const manager = await Manager.findByIdAndDelete(req.params.id);
    if (!manager) return res.status(404).json({ success: false, message: 'Manager not found' });
    res.json({ success: true, message: 'Manager deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// @desc    Get all hostels and their plans
// @route   GET /api/admin/hostels
// @access  Private/Admin
router.get('/hostels', protect, authorize('admin'), async (req, res, next) => {
  try {
    const managers = await Manager.find();
    
    // Build dynamic hostel list from managers
    const hostels = await Promise.all(managers.map(async (manager) => {
      // Find students in this manager's hostel
      const students = await Student.find({ hostel: manager.hostel });
      
      // Calculate MRR (Monthly Recurring Revenue) based on subscribed students
      // Assuming a base fee of 3000 per subscribed student for demonstration
      const activeStudents = students.filter(s => s.subscribed).length;
      const mrr = activeStudents * 3000;
      
      let plan = 'Starter';
      if (activeStudents > 50) plan = 'Enterprise';
      else if (activeStudents > 20) plan = 'Growth';

      return {
        _id: manager._id,
        name: manager.hostel,
        code: manager.managerId,
        manager: manager.name,
        plan,
        status: 'Active',
        mrr
      };
    }));

    res.json({ success: true, data: hostels });
  } catch (err) {
    next(err);
  }
});

// @desc    Get system revenue metrics
// @route   GET /api/admin/revenue
// @access  Private/Admin
router.get('/revenue', protect, authorize('admin'), async (req, res, next) => {
  try {
    const totalPayments = await Payment.find({ status: 'Success' });
    const allStudents = await Student.find();
    
    let totalRevenue = 0;
    
    // Initialize monthly sales with zeroes for the last 6 months dynamically
    const monthlySales = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlySales[monthNames[d.getMonth()]] = 0;
    }

    totalPayments.forEach(p => {
      totalRevenue += p.amount;
      const paymentMonth = monthNames[new Date(p.paymentDate).getMonth()];
      if (monthlySales[paymentMonth] !== undefined) {
        monthlySales[paymentMonth] += p.amount;
      }
    });

    // Calculate total MRR platform-wide (active students * 3000)
    const totalActiveStudents = allStudents.filter(s => s.subscribed).length;
    const platformMRR = totalActiveStudents * 3000;

    res.json({
      success: true,
      mrr: platformMRR,
      totalCollected: totalRevenue,
      totalSubscriptions: totalActiveStudents,
      salesTrends: Object.keys(monthlySales).map(month => ({
        month,
        revenue: monthlySales[month]
      }))
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get all subscription plans
// @route   GET /api/admin/subscriptions
// @access  Private/Admin
router.get('/subscriptions', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
});

// @desc    Create a new subscription plan
// @route   POST /api/admin/subscriptions
// @access  Private/Admin
router.post('/subscriptions', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

// @desc    Update a subscription plan
// @route   PUT /api/admin/subscriptions/:id
// @access  Private/Admin
router.put('/subscriptions/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a subscription plan
// @route   DELETE /api/admin/subscriptions/:id
// @access  Private/Admin
router.delete('/subscriptions/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
