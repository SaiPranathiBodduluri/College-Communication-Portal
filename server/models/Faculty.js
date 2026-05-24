const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  // Faculty's home department (where they belong)
  dept: {
    type: String,
    required: true
  },
  // Access structure: departments they can access -> years -> sections
  access: [{
    dept: {
      type: String,
      required: true
    },
    years: [{
      year: {
        type: String,
        required: true
      },
      sections: [{
        type: String,
        required: true
      }]
    }]
  }],
  resetOTP: {
    type: String
  },
  resetOTPExpires: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

facultySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

facultySchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Faculty', facultySchema);
