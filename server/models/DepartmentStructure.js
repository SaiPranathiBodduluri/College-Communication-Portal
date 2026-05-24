const mongoose = require('mongoose');

const departmentStructureSchema = new mongoose.Schema({
  dept: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
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
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DepartmentStructure', departmentStructureSchema);
