const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const QRLog = require('../models/QRLog');
const Forecast = require('../models/Forecast');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// Helper to check time locks
const isBeforeCutoff = (meal, dateStr, simulatedTime, simulatedDateStr) => {
  const todayStr = simulatedDateStr || new Date().toISOString().split('T')[0];
  
  if (dateStr < todayStr) return false;
  if (dateStr > todayStr) return true;

  // It's today, check hours
  let currentHour = new Date().getHours();
  if (simulatedTime) {
    const [h] = simulatedTime.split(':').map(Number);
    currentHour = h;
  }

  if (meal === 'breakfast') return currentHour < 6;
  if (meal === 'lunch') return currentHour < 11;
  if (meal === 'dinner') return currentHour < 18;
  return false;
};

// @desc    Get attendance status for a specific date
// @route   GET /api/attendance/status
// @access  Private/Student
router.get('/status', protect, authorize('student'), async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Please specify a date' });

    let record = await Attendance.findOne({ student: req.user.id, date });
    if (!record) {
      // Return default present representation
      record = {
        date,
        breakfast: 'Present',
        lunch: 'Present',
        dinner: 'Present',
        corrected: { breakfast: false, lunch: false, dinner: false }
      };
    }

    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// @desc    Mark absence (single or multi-day leave)
// @route   POST /api/attendance/leave
// @access  Private/Student
router.post('/leave', protect, authorize('student'), async (req, res, next) => {
  try {
    const { date, endDate, breakfast, lunch, dinner } = req.body;
    const simTime = req.headers['x-simulated-time']; // For testing time locks

    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const studentId = req.user.id;

    // Generate array of dates
    const dates = [];
    let curr = new Date(date);
    const end = endDate ? new Date(endDate) : new Date(date);

    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const results = [];

    for (const d of dates) {
      let attendanceRecord = await Attendance.findOne({ student: studentId, date: d });
      if (!attendanceRecord) {
        attendanceRecord = new Attendance({
          student: studentId,
          date: d
        });
      }

      // Check cutoffs if updating today's meals
      if (d === todayStr || d < todayStr) {
        if (breakfast !== undefined) {
          if (isBeforeCutoff('breakfast', d, simTime, simDateStr)) {
            attendanceRecord.breakfast = breakfast ? 'Leave' : 'Present';
          } else if (breakfast !== (attendanceRecord.breakfast !== 'Present')) {
            return res.status(400).json({ success: false, message: 'Breakfast cutoff (6:00 AM) has passed or date is in the past' });
          }
        }
        if (lunch !== undefined) {
          if (isBeforeCutoff('lunch', d, simTime, simDateStr)) {
            attendanceRecord.lunch = lunch ? 'Leave' : 'Present';
          } else if (lunch !== (attendanceRecord.lunch !== 'Present')) {
            return res.status(400).json({ success: false, message: 'Lunch cutoff (11:00 AM) has passed or date is in the past' });
          }
        }
        if (dinner !== undefined) {
          if (isBeforeCutoff('dinner', d, simTime, simDateStr)) {
            attendanceRecord.dinner = dinner ? 'Leave' : 'Present';
          } else if (dinner !== (attendanceRecord.dinner !== 'Present')) {
            return res.status(400).json({ success: false, message: 'Dinner cutoff (6:00 PM) has passed or date is in the past' });
          }
        }
      } else {
        // Future dates can be modified directly
        if (breakfast !== undefined) attendanceRecord.breakfast = breakfast ? 'Leave' : 'Present';
        if (lunch !== undefined) attendanceRecord.lunch = lunch ? 'Leave' : 'Present';
        if (dinner !== undefined) attendanceRecord.dinner = dinner ? 'Leave' : 'Present';
      }

      await attendanceRecord.save();
      results.push(attendanceRecord);
    }

    const notification = await Notification.create({
      targetRole: 'Manager',
      title: `Student Absence Logged`,
      message: `A student has marked an upcoming absence.`
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('attendance_updated', results);
      io.emit('notification_new', notification);
    }

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

// @desc    Get live attendance and statistics for mess manager
// @route   GET /api/attendance/live
// @access  Private/Manager
router.get('/live', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const hostel = req.user.hostel;

    // Total registered students in manager's hostel
    const totalStudents = await Student.countDocuments({ hostel });
    const studentIds = await Student.find({ hostel }).select('_id');
    const ids = studentIds.map(s => s._id);

    // Attendance records for these students on this date
    const records = await Attendance.find({ student: { $in: ids }, date });

    const stats = {
      breakfast: { present: totalStudents, absent: 0, corrected: 0 },
      lunch: { present: totalStudents, absent: 0, corrected: 0 },
      dinner: { present: totalStudents, absent: 0, corrected: 0 }
    };

    records.forEach(r => {
      if (r.breakfast !== 'Present') {
        stats.breakfast.absent++;
        stats.breakfast.present--;
      }
      if (r.breakfast === 'Present' && r.corrected.breakfast) {
        stats.breakfast.corrected++;
      }

      if (r.lunch !== 'Present') {
        stats.lunch.absent++;
        stats.lunch.present--;
      }
      if (r.lunch === 'Present' && r.corrected.lunch) {
        stats.lunch.corrected++;
      }

      if (r.dinner !== 'Present') {
        stats.dinner.absent++;
        stats.dinner.present--;
      }
      if (r.dinner === 'Present' && r.corrected.dinner) {
        stats.dinner.corrected++;
      }
    });

    res.json({
      success: true,
      totalStudents,
      stats
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get monthly attendance history for a specific student
// @route   GET /api/attendance/student/:id/monthly
// @access  Private/Manager
router.get('/student/:id/monthly', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { month } = req.query; // format YYYY-MM
    if (!month) return res.status(400).json({ success: false, message: 'Month is required (YYYY-MM)' });

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.hostel !== req.user.hostel) {
      return res.status(403).json({ success: false, message: 'Not authorized for this student' });
    }

    const records = await Attendance.find({
      student: student._id,
      date: { $regex: `^${month}` }
    }).sort({ date: 1 });

    const stats = {
      breakfast: { present: 0, absent: 0, leave: 0 },
      lunch: { present: 0, absent: 0, leave: 0 },
      dinner: { present: 0, absent: 0, leave: 0 }
    };

    records.forEach(r => {
      const b = r.breakfast.toLowerCase();
      const l = r.lunch.toLowerCase();
      const d = r.dinner.toLowerCase();
      if (stats.breakfast[b] !== undefined) stats.breakfast[b]++;
      if (stats.lunch[l] !== undefined) stats.lunch[l]++;
      if (stats.dinner[d] !== undefined) stats.dinner[d]++;
    });

    res.json({ success: true, data: records, stats });
  } catch (err) {
    next(err);
  }
});

// @desc    Get all students in manager's hostel with their today's attendance status
// @route   GET /api/attendance/students-list
// @access  Private/Manager
router.get('/students-list', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const hostel = req.user.hostel;
    const students = await Student.find({ hostel });

    const list = await Promise.all(
      students.map(async s => {
        let att = await Attendance.findOne({ student: s._id, date });
        if (!att) {
          att = {
            breakfast: 'Present',
            lunch: 'Present',
            dinner: 'Present',
            corrected: { breakfast: false, lunch: false, dinner: false }
          };
        }
        return {
          id: s._id,
          name: s.name,
          email: s.email,
          contact: s.contact,
          subscriptionStart: s.subscriptionStart,
          subscriptionEnd: s.subscriptionEnd,
          rollNumber: s.rollNumber,
          roomNumber: s.roomNumber,
          attendance: {
            breakfast: att.breakfast,
            lunch: att.lunch,
            dinner: att.dinner,
            corrected: att.corrected
          }
        };
      })
    );

    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// @desc    QR Entry check-in scan
// @route   PATCH /api/attendance/scan
// @access  Private/Manager
router.patch('/scan', protect, authorize('manager'), async (req, res, next) => {
  try {
    let { rollNumber, mealType, date } = req.body;
    if(rollNumber) rollNumber = rollNumber.trim();

    if (!rollNumber || !mealType || !date) {
      return res.status(400).json({ success: false, message: 'Roll number, meal type, and date are required' });
    }

    const student = await Student.findOne({ rollNumber, hostel: req.user.hostel });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in your hostel' });
    }

    let att = await Attendance.findOne({ student: student._id, date });
    let wasAbsent = false;

    if (!att) {
      att = new Attendance({
        student: student._id,
        date
      });
    }

    const mealKey = mealType.toLowerCase(); // breakfast, lunch, dinner
    if (att[mealKey] === 'Leave' || att[mealKey] === 'Absent') {
      wasAbsent = true;
      att[mealKey] = 'Present';
      att.corrected[mealKey] = true;
      await att.save();
    }

    // Create QR entry log
    await QRLog.create({
      student: student._id,
      mealType,
      date,
      entryTime: new Date()
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('attendance_updated', { student: student._id, mealType });
    }

    res.json({
      success: true,
      message: wasAbsent
        ? `Scan Success: Student ${student.name} marked Leave - auto-corrected to Present!`
        : `Scan Success: Student ${student.name} checked in.`,
      corrected: wasAbsent,
      studentName: student.name
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get QR scanning entry logs
// @route   GET /api/attendance/logs
// @access  Private/Manager
router.get('/logs', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const hostel = req.user.hostel;
    const students = await Student.find({ hostel }).select('_id');
    const ids = students.map(s => s._id);

    const logs = await QRLog.find({ student: { $in: ids }, date })
      .populate('student', 'name rollNumber roomNumber')
      .sort({ entryTime: -1 });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// @desc    Manually override student attendance
// @route   PUT /api/attendance/override
// @access  Private/Manager
router.put('/override', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { studentId, date, mealType, status } = req.body;
    
    if (!studentId || !date || !mealType || !status) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const student = await Student.findOne({ _id: studentId, hostel: req.user.hostel });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in your hostel' });
    }

    let att = await Attendance.findOne({ student: studentId, date });
    if (!att) {
      att = new Attendance({ student: studentId, date });
    }

    const mealKey = mealType.toLowerCase();
    att[mealKey] = status;
    
    // If manager manually marks present, log it and clear corrected flag
    if (status === 'Present') {
      att.corrected[mealKey] = false;
      await QRLog.create({
        student: studentId,
        mealType,
        date,
        entryTime: new Date()
      });
    }

    await att.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('attendance_updated', { student: studentId, mealType, status });
    }

    res.json({ success: true, message: 'Attendance overridden successfully', data: att });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a QR entry log
// @route   DELETE /api/attendance/logs/:id
// @access  Private/Manager
router.delete('/logs/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
    const log = await QRLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    await log.deleteOne();
    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
