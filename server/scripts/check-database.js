const mongoose = require('mongoose');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

const checkDatabase = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/scnbcp');
    console.log('🔗 Connected to MongoDB');

    // Check total counts
    const totalStudents = await Student.countDocuments();
    const totalFaculty = await Faculty.countDocuments();
    const totalAdmins = await Admin.countDocuments();

    console.log('📊 Total counts:');
    console.log(`   Students: ${totalStudents}`);
    console.log(`   Faculty: ${totalFaculty}`);
    console.log(`   Admins: ${totalAdmins}`);

    // Sample a few records to see the structure
    if (totalStudents > 0) {
      console.log('\n📚 Sample students:');
      const sampleStudents = await Student.find().limit(3).select('name id dept year section');
      sampleStudents.forEach(student => {
        console.log(`   - ${student.name} (${student.id}) - Dept: "${student.dept}", Year: ${student.year}, Section: ${student.section}`);
      });

      // Check unique departments
      const studentDepts = await Student.distinct('dept');
      console.log(`   Student departments: [${studentDepts.map(d => `"${d}"`).join(', ')}]`);
    }

    if (totalFaculty > 0) {
      console.log('\n👨‍🏫 Sample faculty:');
      const sampleFaculty = await Faculty.find().limit(3).select('name id dept');
      sampleFaculty.forEach(faculty => {
        console.log(`   - ${faculty.name} (${faculty.id}) - Dept: "${faculty.dept}"`);
      });

      // Check unique departments
      const facultyDepts = await Faculty.distinct('dept');
      console.log(`   Faculty departments: [${facultyDepts.map(d => `"${d}"`).join(', ')}]`);
    }

    if (totalAdmins > 0) {
      console.log('\n👑 Sample admins:');
      const sampleAdmins = await Admin.find().limit(3).select('name id dept');
      sampleAdmins.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.id}) - Dept: "${admin.dept}"`);
      });

      // Check unique departments
      const adminDepts = await Admin.distinct('dept');
      console.log(`   Admin departments: [${adminDepts.map(d => `"${d}"`).join(', ')}]`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
};

checkDatabase();