const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

const importSampleData = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/college_management';
    await mongoose.connect(mongoUri);
    console.log('🔗 Connected to MongoDB');

    // Sample Students Data
    const studentsData = [
      {
        name: 'John Doe',
        id: '231FA04001',
        password: await bcrypt.hash('Student@123', 12),
        email: 'john@college.edu',
        phoneNumber: '9876543210',
        dept: 'CSE',
        year: 2,
        section: 'A',
        specialRole: 'none'
      },
      {
        name: 'Jane Smith',
        id: '231FA04002',
        password: await bcrypt.hash('Student@123', 12),
        email: 'jane@college.edu',
        phoneNumber: '9876543211',
        dept: 'CSE',
        year: 2,
        section: 'B',
        specialRole: 'CR'
      },
      {
        name: 'Rahul Kumar',
        id: '231FA04003',
        password: await bcrypt.hash('Student@123', 12),
        email: 'rahul@college.edu',
        phoneNumber: '9876543212',
        dept: 'CSE',
        year: 3,
        section: 'A',
        specialRole: 'LR'
      },
      {
        name: 'Priya Sharma',
        id: '231FA04004',
        password: await bcrypt.hash('Student@123', 12),
        email: 'priya@college.edu',
        phoneNumber: '9876543213',
        dept: 'CSE',
        year: 3,
        section: 'B',
        specialRole: 'none'
      }
    ];

    // Sample Faculty Data
    const facultyData = [
      {
        name: 'Dr. Ramesh Kumar',
        id: 'FAC001',
        password: await bcrypt.hash('Faculty@123', 12),
        email: 'ramesh@college.edu',
        phoneNumber: '9876543210',
        dept: 'CSE',
        access: [
          { dept: 'CSE', year: 2, sections: ['A', 'B'] },
          { dept: 'CSE', year: 3, sections: ['A'] },
          { dept: 'ECE', year: 2, sections: ['C'] }
        ]
      },
      {
        name: 'Dr. Priya Sharma',
        id: 'FAC002',
        password: await bcrypt.hash('Faculty@123', 12),
        email: 'priya.faculty@college.edu',
        phoneNumber: '9876543211',
        dept: 'CSE',
        access: [
          { dept: 'CSE', year: 1, sections: ['A', 'B', 'C'] },
          { dept: 'CSE', year: 4, sections: ['B'] }
        ]
      },
      {
        name: 'Dr. Gayathri',
        id: 'FAC003',
        password: await bcrypt.hash('Faculty@123', 12),
        email: 'gayathri@college.edu',
        phoneNumber: '6305684849',
        dept: 'ECE',
        access: [
          { dept: 'ECE', year: 3, sections: ['A', 'C'] },
          { dept: 'CSE', year: 2, sections: ['A'] },
          { dept: 'EEE', year: 1, sections: ['C'] }
        ]
      }
    ];

    // Sample Admin Data
    const adminData = [
      {
        name: 'Admin Kumar',
        id: 'ADM001',
        password: await bcrypt.hash('Admin@123', 12),
        email: 'admin1@college.edu',
        phoneNumber: '9876543210',
        dept: 'CSE',
        access: [
          { dept: 'CSE', year: 2, sections: ['A', 'B'] },
          { dept: 'CSE', year: 3, sections: ['A'] },
          { dept: 'ECE', year: 2, sections: ['C'] }
        ]
      },
      {
        name: 'Admin Priya',
        id: 'ADM002',
        password: await bcrypt.hash('Admin@123', 12),
        email: 'admin2@college.edu',
        phoneNumber: '9876543211',
        dept: 'CSE',
        access: [
          { dept: 'CSE', year: 1, sections: ['A', 'B', 'C'] },
          { dept: 'CSE', year: 4, sections: ['B'] }
        ]
      }
    ];

    // Clear existing data
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Admin.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Insert new data
    await Student.insertMany(studentsData);
    console.log(`✅ Imported ${studentsData.length} students`);

    await Faculty.insertMany(facultyData);
    console.log(`✅ Imported ${facultyData.length} faculty members`);

    await Admin.insertMany(adminData);
    console.log(`✅ Imported ${adminData.length} admins`);

    console.log('🎉 Sample data import completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Students: ${studentsData.length}`);
    console.log(`   Faculty: ${facultyData.length}`);
    console.log(`   Admins: ${adminData.length}`);
    console.log('🔐 All passwords are securely hashed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing sample data:', error);
    process.exit(1);
  }
};

importSampleData();