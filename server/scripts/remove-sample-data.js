const mongoose = require('mongoose');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

const removeSampleData = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/college_management';
    await mongoose.connect(mongoUri);
    console.log('🔗 Connected to MongoDB');

    // Remove the specific sample data I just added
    const sampleStudentIds = ['231FA04001', '231FA04002', '231FA04003', '231FA04004'];
    const sampleFacultyIds = ['FAC001', 'FAC002', 'FAC003'];
    const sampleAdminIds = ['ADM001', 'ADM002'];

    const deletedStudents = await Student.deleteMany({ id: { $in: sampleStudentIds } });
    const deletedFaculty = await Faculty.deleteMany({ id: { $in: sampleFacultyIds } });
    const deletedAdmins = await Admin.deleteMany({ id: { $in: sampleAdminIds } });

    console.log(`🗑️ Removed ${deletedStudents.deletedCount} sample students`);
    console.log(`🗑️ Removed ${deletedFaculty.deletedCount} sample faculty`);
    console.log(`🗑️ Removed ${deletedAdmins.deletedCount} sample admins`);

    // Check remaining counts
    const remainingStudents = await Student.countDocuments();
    const remainingFaculty = await Faculty.countDocuments();
    const remainingAdmins = await Admin.countDocuments();

    console.log('📊 Remaining data:');
    console.log(`   Students: ${remainingStudents}`);
    console.log(`   Faculty: ${remainingFaculty}`);
    console.log(`   Admins: ${remainingAdmins}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing sample data:', error);
    process.exit(1);
  }
};

removeSampleData();