const Student = require('./models/Student');
const Manager = require('./models/Manager');
const Admin = require('./models/Admin');
const Menu = require('./models/Menu');
const WasteRecord = require('./models/WasteRecord');
const Complaint = require('./models/Complaint');
const Attendance = require('./models/Attendance');

const seedData = async () => {
  try {
    // 1. Seed Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        name: 'System Admin',
        email: 'admin@foodback.com',
        password: 'password123'
      });
      console.log('Seeded Admin account successfully (admin@foodback.com / password123)');
    }

    // 2. Seed Manager
    const managerCount = await Manager.countDocuments();
    if (managerCount === 0) {
      await Manager.create({
        name: 'Suresh Kumar',
        managerId: 'manager1',
        hostel: 'Hostel A',
        password: 'password123'
      });
      console.log('Seeded Manager account successfully (manager1 / password123)');
    }

    // 3. Seed Student
    const studentCount = await Student.countDocuments();
    let sampleStudent;
    if (studentCount === 0) {
      sampleStudent = await Student.create({
        name: 'Aarav Mehta',
        email: 'student@foodback.com',
        rollNumber: '2026S001',
        password: 'password123',
        hostel: 'Hostel A',
        roomNumber: 'A-302',
        contact: '9876543210',
        subscribed: true,
        dueAmount: 0
      });

      // Add another student for variety
      await Student.create({
        name: 'Ishita Sharma',
        email: 'ishita@foodback.com',
        rollNumber: '2026S002',
        password: 'password123',
        hostel: 'Hostel A',
        roomNumber: 'A-104',
        contact: '9123456789',
        subscribed: true,
        dueAmount: 3200 // Pending fees
      });

      console.log('Seeded Student accounts successfully (student@foodback.com / password123)');
    } else {
      sampleStudent = await Student.findOne({ rollNumber: '2026S001' });
    }

    // 4. Seed Menu
    const menuCount = await Menu.countDocuments();
    if (menuCount === 0) {
      const menus = [
        { day: 'Monday', breakfast: 'Idli, Sambhar, Coconut Chutney, Tea/Coffee', lunch: 'Roti, Dal Tadka, Seasonal Veg, Steamed Rice, Salad', dinner: 'Roti, Paneer Masala, Jeera Rice, Curd, Sweet Boondi' },
        { day: 'Tuesday', breakfast: 'Poha, Sev, Fried Peanuts, Sprouts, Milk/Tea', lunch: 'Roti, Chana Masala, Mixed Veg, Rice, Butter Milk', dinner: 'Roti, Egg Curry / Aloo Dum, Steamed Rice, Salad, Kheer' },
        { day: 'Wednesday', breakfast: 'Aloo Paratha, Curd, Butter, Pickle, Coffee/Tea', lunch: 'Roti, Rajma, Jeera Rice, Onion Raita, Papad', dinner: 'Roti, Butter Chicken / Paneer Makhani, Rice, Ice Cream' },
        { day: 'Thursday', breakfast: 'Bread Toast, Butter, Jam, Scrambled Eggs, Tea/Coffee', lunch: 'Roti, Kadhi Pakora, Rice, Dry Aloo Jeera, Salad', dinner: 'Roti, Mix Vegetable Jalfrezi, Khichdi, Tomato Chutney' },
        { day: 'Friday', breakfast: 'Uttapam, Sambhar, Tomato Chutney, Banana, Tea/Coffee', lunch: 'Roti, Veg Biryani, Mirchi Salan, Cucumber Raita', dinner: 'Roti, Fish Curry / Kadai Mushroom, Steamed Rice, Gulab Jamun' },
        { day: 'Saturday', breakfast: 'Veg Cutlet, Tomato Ketchup, Bread-Butter, Sprouts, Coffee', lunch: 'Roti, Black Chana, Rice, Beans Fry, Salad', dinner: 'Roti, Bhindi Masala, Rice, Dal Fry, Raita' },
        { day: 'Sunday', breakfast: 'Chole Bhature, Pickle, Lassi, Tea/Coffee', lunch: 'Special Shahi Thali (Roti, Dal Makhani, Paneer Pasanda, Pulao, Papad)', dinner: 'Roti, Seasonal Dry Veg, Rice, Dal Tadka, Custard' }
      ];
      await Menu.insertMany(menus);
      console.log('Seeded weekly Menu successfully');
    }

    // 5. Seed Waste Records
    const wasteCount = await WasteRecord.countDocuments();
    if (wasteCount === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayBefore = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const waste = [
        { date: dayBefore, mealType: 'Breakfast', wasteWeight: 3.2, estimatedCost: 384, itemsWasted: ['Bread Toast', 'Sambhar'] },
        { date: dayBefore, mealType: 'Lunch', wasteWeight: 14.5, estimatedCost: 1740, itemsWasted: ['Steamed Rice', 'Dal Tadka'] },
        { date: dayBefore, mealType: 'Dinner', wasteWeight: 9.1, estimatedCost: 1092, itemsWasted: ['Paneer Masala', 'Roti'] },
        
        { date: yesterday, mealType: 'Breakfast', wasteWeight: 2.1, estimatedCost: 252, itemsWasted: ['Poha', 'Milk'] },
        { date: yesterday, mealType: 'Lunch', wasteWeight: 11.2, estimatedCost: 1344, itemsWasted: ['Chana Masala', 'Rice'] },
        { date: yesterday, mealType: 'Dinner', wasteWeight: 8.4, estimatedCost: 1008, itemsWasted: ['Egg Curry', 'Roti'] },

        { date: todayStr, mealType: 'Breakfast', wasteWeight: 1.8, estimatedCost: 216, itemsWasted: ['Uttapam'] }
      ];
      await WasteRecord.insertMany(waste);
      console.log('Seeded Waste records successfully');
    }

    // 6. Seed Complaints
    const complaintsCount = await Complaint.countDocuments();
    if (complaintsCount === 0 && sampleStudent) {
      await Complaint.create({
        student: sampleStudent._id,
        category: 'Food',
        title: 'Dal was too watery',
        description: 'The Dal served during today\'s lunch was extremely watery and had zero salt. Please look into this.',
        status: 'Pending'
      });
      await Complaint.create({
        student: sampleStudent._id,
        category: 'Hygiene',
        title: 'Mess tables not cleaned properly',
        description: 'Yesterday evening, the cleaning staff left food scraps on multiple tables. Tables need to be sanitized before each meal.',
        status: 'Resolved'
      });
      console.log('Seeded sample Complaints successfully');
    }

    // 7. Seed Attendance records
    const attendanceCount = await Attendance.countDocuments();
    if (attendanceCount === 0 && sampleStudent) {
      const todayStr = new Date().toISOString().split('T')[0];
      await Attendance.create({
        student: sampleStudent._id,
        date: todayStr,
        breakfast: 'Leave', // Simulate student marked absent for breakfast
        lunch: 'Present',
        dinner: 'Present',
        corrected: { breakfast: false, lunch: false, dinner: false }
      });
      console.log('Seeded sample Attendance status successfully');
    }

  } catch (err) {
    console.error('Error seeding data:', err.message);
  }
};

module.exports = seedData;
