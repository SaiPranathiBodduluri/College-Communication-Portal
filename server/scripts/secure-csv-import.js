const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

const secureImportCSV = async (csvFile, userType) => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/college_management';
    await mongoose.connect(mongoUri);
    console.log('🔗 Connected to MongoDB');

    const users = [];
    let count = 0;

    console.log(`📂 Reading ${userType} CSV file: ${csvFile}`);

    // Read and process CSV
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', async (row) => {
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(row.password || row.Password, 12);
        
        const userData = {
          name: row.name || row.Name,
          id: row.id || row.ID,
          password: hashedPassword, // 🔐 HASHED PASSWORD
          email: row.email || row.Email,
          phoneNumber: row.phoneNumber || row.Phone,
          dept: row.dept || row.Dept,
        };

        // Add role-specific fields
        if (userType === 'students') {
          userData.year = row.year || row.Year;
          userData.section = row.section || row.Section;
          userData.specialRole = row.specialRole || row['Special Role'] || 'none';
        } else if (userType === 'faculty') {
          // Handle faculty access structure
          userData.access = row.access ? JSON.parse(row.access) : [];
        }

        users.push(userData);
        count++;
      })
      .on('end', async () => {
        try {
          console.log(`📊 Processing ${count} ${userType}...`);

          // Choose the right model
          let Model;
          switch (userType) {
            case 'students': Model = Student; break;
            case 'faculty': Model = Faculty; break;
            case 'admins': Model = Admin; break;
            default: throw new Error('Invalid user type');
          }

          // Clear existing data (optional)
          const clearData = process.argv[4] === '--clear';
          if (clearData) {
            await Model.deleteMany({});
            console.log(`🗑️ Cleared existing ${userType} data`);
          }

          // Insert new data with hashed passwords
          await Model.insertMany(users);
          
          console.log('🎉 Import completed successfully!');
          console.log(`✅ Imported ${count} ${userType} with HASHED passwords`);
          console.log('🔐 All passwords are securely encrypted');
          console.log('✅ Users can now login with their credentials');
          
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during import:', error);
          process.exit(1);
        }
      });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Usage validation
const csvFile = process.argv[2];
const userType = process.argv[3];

if (!csvFile || !userType) {
  console.log('🔐 Secure CSV Import Tool');
  console.log('Usage: node secure-csv-import.js <csv-file> <user-type> [--clear]');
  console.log('');
  console.log('User Types:');
  console.log('  students  - Import student data');
  console.log('  faculty   - Import faculty data');
  console.log('  admins    - Import admin data');
  console.log('');
  console.log('Options:');
  console.log('  --clear   - Clear existing data before import');
  console.log('');
  console.log('Examples:');
  console.log('  node secure-csv-import.js students.csv students');
  console.log('  node secure-csv-import.js faculty.csv faculty --clear');
  process.exit(1);
}

if (!['students', 'faculty', 'admins'].includes(userType)) {
  console.error('❌ Invalid user type. Use: students, faculty, or admins');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.error(`❌ File not found: ${csvFile}`);
  process.exit(1);
}

secureImportCSV(csvFile, userType);