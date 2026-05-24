const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('../models/Student');

const deleteECEFirstYear = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/college_management';
    await mongoose.connect(mongoUri);
    console.log('🔗 Connected to MongoDB');

    // First, count how many students will be deleted
    const countToDelete = await Student.countDocuments({
      dept: 'ECE',
      year: '1'
    });
    
    console.log(`📊 Found ${countToDelete} ECE 1st year students to delete`);
    
    if (countToDelete === 0) {
      console.log('✅ No ECE 1st year students found');
      process.exit(0);
    }

    // Delete ECE 1st year students
    const result = await Student.deleteMany({
      dept: 'ECE',
      year: '1'
    });

    console.log(`🗑️ Successfully deleted ${result.deletedCount} ECE 1st year students`);
    
    // Verify remaining count
    const remainingCount = await Student.countDocuments();
    console.log(`📋 Total remaining students: ${remainingCount}`);
    
    // Show remaining ECE students by year
    const eceRemaining = await Student.aggregate([
      { $match: { dept: 'ECE' } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('📊 Remaining ECE students by year:');
    eceRemaining.forEach(year => {
      console.log(`   Year ${year._id}: ${year.count} students`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting students:', error);
    process.exit(1);
  }
};

deleteECEFirstYear();