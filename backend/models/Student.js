const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  rollNumber: {
    type: String,
    required: [true, 'Please add a roll number'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  hostel: {
    type: String,
    required: [true, 'Please add a hostel name']
  },
  roomNumber: {
    type: String,
    required: [true, 'Please add a room number']
  },
  contact: {
    type: String,
    required: [true, 'Please add a contact number']
  },
  subscribed: {
    type: Boolean,
    default: true
  },
  subscriptionStart: {
    type: Date,
    default: Date.now
  },
  subscriptionEnd: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  dueAmount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Encrypt password using bcrypt
StudentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
StudentSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', StudentSchema);
