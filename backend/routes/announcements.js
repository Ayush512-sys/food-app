const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// GET all announcements
router.get('/', async (req, res, next) => {
  try {
    const simDateStr = req.headers['x-simulated-date'];
    const currentDate = simDateStr ? new Date(simDateStr) : new Date();
    const thresholdDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

    const announcements = await Announcement.find({ date: { $gte: thresholdDate } }).sort({ date: -1 });
    res.status(200).json({ success: true, count: announcements.length, data: announcements });
  } catch (err) {
    next(err);
  }
});

// POST new announcement (Manager/Admin only)
router.post('/', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const { title, message } = req.body;
    const authorName = req.user.name || 'Admin';
    
    const announcement = await Announcement.create({ title, message, authorName });

    // Create Notification for all students
    const notification = await Notification.create({
      targetRole: 'Student',
      title: `New Announcement: ${title}`,
      message: message
    });

    // Emit real-time events
    const io = req.app.get('io');
    if (io) {
      io.emit('announcement_created', announcement);
      io.emit('notification_new', notification);
    }

    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
});

// PUT update announcement (Manager/Admin only)
router.put('/:id', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) io.emit('announcement_updated', announcement);

    res.status(200).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
});

// DELETE announcement (Manager/Admin only)
router.delete('/:id', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) io.emit('announcement_deleted', req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
