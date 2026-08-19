const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authorize } = require('../middleware/auth');

// GET my notifications
router.get('/my', authorize('student', 'manager', 'admin'), async (req, res, next) => {
  try {
    const { role, id } = req.user;
    
    const simDateStr = req.headers['x-simulated-date'];
    const currentDate = simDateStr ? new Date(simDateStr) : new Date();
    const thresholdDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

    // Find notifications targeted at "All", the user's role (e.g. "Student"), or specifically the user's ID
    let notifications = await Notification.find({
      date: { $gte: thresholdDate },
      $or: [
        { targetRole: 'All' },
        { targetRole: role.charAt(0).toUpperCase() + role.slice(1) },
        { targetUser: id }
      ]
    }).lean();

    // Dynamically inject subscription expired notifications for managers
    if (role === 'manager') {
      const Student = require('../models/Student');
      
      const expiredStudents = await Student.find({ subscriptionEnd: { $lt: currentDate } });
      expiredStudents.forEach(student => {
        notifications.push({
          _id: 'expired_' + student._id,
          title: 'Subscription Expired',
          message: `${student.name}'s mess subscription has ended on ${new Date(student.subscriptionEnd).toLocaleDateString()}. Please renew it in the Students tab.`,
          read: false,
          date: student.subscriptionEnd,
          isDynamic: true
        });
      });
    }

    // Sort by date descending and limit to 5
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    notifications = notifications.slice(0, 5);

    res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

// PATCH mark notification as read
router.patch('/:id/read', authorize('student', 'manager', 'admin'), async (req, res, next) => {
  try {
    // Note: Since notifications can be broadcast to roles, modifying a shared notification record 
    // as read would mark it read for everyone. In a production app, a read-receipt table is better.
    // For simplicity in this demo, if it's a specific user notification, we mark it read. 
    // If it's a broadcast, we don't truly persist 'read' for all, but let's just update it if they are the target.
    
    if (req.params.id.startsWith('expired_')) {
      return res.status(200).json({ success: true, message: 'Dynamic notification cannot be marked as read permanently. Please renew the subscription.' });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });

    if (notification.targetUser && notification.targetUser.toString() === req.user.id) {
       notification.read = true;
       await notification.save();
    }
    
    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
