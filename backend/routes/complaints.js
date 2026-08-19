const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Private/Student
router.post('/', protect, authorize('student'), async (req, res, next) => {
  try {
    const { category, title, description } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ success: false, message: 'Please provide category, title and description' });
    }

    const complaint = await Complaint.create({
      student: req.user.id,
      category,
      title,
      description,
      status: 'Pending',
      date: new Date()
    });

    const student = await Student.findById(req.user.id);
    const ManagerModel = require('../models/Manager');
    const manager = await ManagerModel.findOne({ hostel: student.hostel });

    const notification = await Notification.create({
      targetRole: 'Manager',
      targetUser: manager ? manager._id : null,
      title: `New Complaint: ${category}`,
      message: `${student.name} (${student.roomNumber}) filed a complaint: ${title}`
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_new', complaint);
      io.emit('notification_new', notification);
    }

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// @desc    Get student's own complaints
// @route   GET /api/complaints/my
// @access  Private/Student
router.get('/my', protect, authorize('student'), async (req, res, next) => {
  try {
    const simDateStr = req.headers['x-simulated-date'];
    const currentDate = simDateStr ? new Date(simDateStr) : new Date();
    const thresholdDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

    const complaints = await Complaint.find({ 
      student: req.user.id,
      $or: [
        { status: 'Pending' },
        { status: 'Resolved', resolvedAt: { $gte: thresholdDate } },
        { status: 'Resolved', resolvedAt: null }
      ]
    }).sort({ date: -1 });

    res.json({ success: true, data: complaints });
  } catch (err) {
    next(err);
  }
});

// @desc    Get all complaints for manager's hostel
// @route   GET /api/complaints/all
// @access  Private/Manager
router.get('/all', protect, authorize('manager'), async (req, res, next) => {
  try {
    const hostel = req.user.hostel;

    // Find student IDs in this hostel
    const students = await Student.find({ hostel }).select('_id');
    const ids = students.map(s => s._id);

    const simDateStr = req.headers['x-simulated-date'];
    const currentDate = simDateStr ? new Date(simDateStr) : new Date();
    const thresholdDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

    const complaints = await Complaint.find({ 
      student: { $in: ids },
      $or: [
        { status: 'Pending' },
        { status: 'Resolved', resolvedAt: { $gte: thresholdDate } },
        { status: 'Resolved', resolvedAt: null }
      ]
    })
      .populate('student', 'name rollNumber roomNumber')
      .sort({ date: -1 });

    res.json({ success: true, data: complaints });
  } catch (err) {
    next(err);
  }
});

// @desc    Update complaint status (Resolve)
// @route   PATCH /api/complaints/:id
// @access  Private/Manager
router.patch('/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Double-check student belongs to manager's hostel
    const student = await Student.findById(complaint.student);
    if (!student || student.hostel !== req.user.hostel) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this complaint' });
    }

    if (req.body.status && req.body.status !== complaint.status) {
      complaint.status = req.body.status;
      if (req.body.status === 'Resolved') {
        const simDateStr = req.headers['x-simulated-date'];
        complaint.resolvedAt = simDateStr ? new Date(simDateStr) : new Date();
      }
    }

    if (req.body.managerReply !== undefined) {
      complaint.managerReply = req.body.managerReply;
    }
    await complaint.save();

    const notification = await Notification.create({
      targetRole: 'Student',
      targetUser: complaint.student,
      title: `Complaint Updated`,
      message: `Your complaint "${complaint.title}" is now ${complaint.status}`
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_updated', complaint);
      io.emit('notification_new', notification);
    }

    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a complaint
// @route   DELETE /api/complaints/:id
// @access  Private/Manager
router.delete('/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const student = await Student.findById(complaint.student);
    if (!student || student.hostel !== req.user.hostel) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this complaint' });
    }

    await complaint.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_updated');
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
