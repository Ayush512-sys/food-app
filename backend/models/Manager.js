const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ManagerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  managerId: {
    type: String,
    required: [true, 'Please add a manager ID'],
    unique: true
  },
  hostel: {
    type: String,
    required: [true, 'Please add a hostel name']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  messFee: {
    type: Number,
    default: 3500
  }
}, { timestamps: true });

// Encrypt password using bcrypt
ManagerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
ManagerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Manager', ManagerSchema);
