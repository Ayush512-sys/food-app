const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get the week's menu
// @route   GET /api/menu
// @access  Private (Student, Manager, Admin)
router.get('/', protect, async (req, res, next) => {
  try {
    const menu = await Menu.find();
    res.json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
});

// @desc    Update a menu day
// @route   PUT /api/menu/:id
// @access  Private/Manager
router.put('/:id', protect, authorize('manager', 'student'), async (req, res, next) => {
  try {
    const { breakfast, lunch, dinner } = req.body;

    const menu = await Menu.findByIdAndUpdate(
      req.params.id,
      { breakfast, lunch, dinner },
      { new: true, runValidators: true }
    );

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu day not found' });
    }

    const notification = await Notification.create({
      targetRole: 'Student',
      title: 'Menu Updated',
      message: `The menu for ${menu.day} has been updated.`
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('menu_updated', menu);
      io.emit('notification_new', notification);
    }

    res.json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
