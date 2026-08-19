const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const WasteRecord = require('../models/WasteRecord');
const { protect, authorize } = require('../middleware/auth');

// @desc    Export mess data as CSV or JSON
// @route   GET /api/reports/export
// @access  Private/Manager
router.get('/export', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { reportType, date } = req.query; // reportType: 'attendance', 'feedback', 'waste'
    
    if (!reportType) {
      return res.status(400).json({ success: false, message: 'Please specify reportType' });
    }

    const hostel = req.user.hostel;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Helper to send CSV header
    const sendCSV = (filename, content) => {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(content);
    };

    if (reportType === 'attendance') {
      const students = await Student.find({ hostel });
      const ids = students.map(s => s._id);

      const records = await Attendance.find({ student: { $in: ids }, date: targetDate })
        .populate('student', 'name rollNumber roomNumber');

      // Create CSV content
      let csv = 'Roll Number,Name,Room Number,Breakfast,Lunch,Dinner,Corrected Breakfast,Corrected Lunch,Corrected Dinner\n';
      
      // We list all students, and put their record if it exists
      for (const s of students) {
        const record = records.find(r => r.student._id.toString() === s._id.toString()) || {
          breakfast: 'Present',
          lunch: 'Present',
          dinner: 'Present',
          corrected: { breakfast: false, lunch: false, dinner: false }
        };
        csv += `"${s.rollNumber}","${s.name}","${s.roomNumber}","${record.breakfast}","${record.lunch}","${record.dinner}","${record.corrected.breakfast}","${record.corrected.lunch}","${record.corrected.dinner}"\n`;
      }

      return sendCSV(`attendance_report_${targetDate}.csv`, csv);
    }

    if (reportType === 'feedback') {
      const students = await Student.find({ hostel }).select('_id');
      const ids = students.map(s => s._id);

      const reviews = await Feedback.find({ student: { $in: ids } })
        .populate('student', 'name rollNumber')
        .sort({ date: -1 });

      let csv = 'Date,Roll Number,Student Name,Meal Type,Rating,Comment\n';
      reviews.forEach(r => {
        const dateStr = new Date(r.date).toISOString().split('T')[0];
        csv += `"${dateStr}","${r.student?.rollNumber || ''}","${r.student?.name || ''}","${r.mealType}",${r.rating},"${r.comments.replace(/"/g, '""')}"\n`;
      });

      return sendCSV(`feedback_report_${targetDate}.csv`, csv);
    }

    if (reportType === 'waste') {
      const records = await WasteRecord.find().sort({ date: -1 });

      let csv = 'Date,Meal Type,Waste Weight (kg),Estimated Cost (INR),Items Wasted\n';
      records.forEach(r => {
        const items = r.itemsWasted ? r.itemsWasted.join(' | ') : '';
        csv += `"${r.date}","${r.mealType}",${r.wasteWeight},${r.estimatedCost},"${items.replace(/"/g, '""')}"\n`;
      });

      return sendCSV(`waste_report_${targetDate}.csv`, csv);
    }

    return res.status(400).json({ success: false, message: 'Invalid reportType' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
