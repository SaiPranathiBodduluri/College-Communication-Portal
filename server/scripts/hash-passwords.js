const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

const hashPasswords = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/college_management';
    await mongoose.connect(mongoUri);
    console.log('🔗 Connected to MongoDB');

    // Hash student passwords
    console.log('🔐 Hashing student passwords...');
    const students = await Student.find({});
    let studentCount = 0;
    
    for (let student of students) {
      // Check if password is already hashed (starts with $2a$ or $2b$)
      if (!student.password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(student.password, 12);
        await Student.updateOne(
          { _id: student._id },
          { password: hashedPassword }
        );
        console.log(`✅ Hashed password for student: ${student.id}`);
        studentCount++;
      }
    }

    // Hash faculty passwords
    console.log('🔐 Hashing faculty passwords...');
    const faculties = await Faculty.find({});
    let facultyCount = 0;
    
    for (let faculty of faculties) {
      if (!faculty.password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(faculty.password, 12);
        await Faculty.updateOne(
          { _id: faculty._id },
          { password: hashedPassword }
        );
        console.log(`✅ Hashed password for faculty: ${faculty.id}`);
        facultyCount++;
      }
    }

    // Hash admin passwords
    console.log('🔐 Hashing admin passwords...');
    const admins = await Admin.find({});
    let adminCount = 0;
    
    for (let admin of admins) {
      if (!admin.password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(admin.password, 12);
        await Admin.updateOne(
          { _id: admin._id },
          { password: hashedPassword }
        );
        console.log(`✅ Hashed password for admin: ${admin.id}`);
        adminCount++;
      }
    }

    console.log('🎉 Password hashing completed!');
    console.log(`📊 Summary:`);
    console.log(`   Students: ${studentCount} passwords hashed`);
    console.log(`   Faculty: ${facultyCount} passwords hashed`);
    console.log(`   Admins: ${adminCount} passwords hashed`);
    console.log('');
    console.log('✅ You can now login with your credentials!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error hashing passwords:', error);
    process.exit(1);
  }
};

hashPasswords();