const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');

const createCompassReadyCSV = async (inputFile, outputFile) => {
  try {
    console.log('🔄 Creating Compass-ready CSV with hashed passwords...');
    
    const results = [];
    let count = 0;

    // Read original CSV
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on('data', async (row) => {
        // Hash password
        const plainPassword = row.password || row.Password || row.id || row.ID;
        const hashedPassword = await bcrypt.hash(plainPassword, 12);
        
        // Create Compass-ready row
        const compassRow = {
          name: row.name || row.Name,
          id: row.id || row.ID,
          password: hashedPassword, // ✅ HASHED
          email: row.email || row.Email,
          phoneNumber: row.phoneNumber || row.Phone,
          dept: row.dept || row.Dept,
          year: row.year || row.Year,
          section: row.section || row.Section,
          specialRole: row.specialRole || row['Special Role'] || 'none'
        };
        
        results.push(compassRow);
        count++;
        
        if (count % 10 === 0) {
          console.log(`📊 Processed ${count} records...`);
        }
      })
      .on('end', () => {
        // Write CSV with proper headers and hashed passwords
        const csvContent = [
          // Header
          'name,id,password,email,phoneNumber,dept,year,section,specialRole',
          // Data rows
          ...results.map(row => 
            `"${row.name}","${row.id}","${row.password}","${row.email}","${row.phoneNumber}","${row.dept}","${row.year}","${row.section}","${row.specialRole}"`
          )
        ].join('\\n');
        
        fs.writeFileSync(outputFile, csvContent);
        
        console.log('🎉 Compass-ready CSV created!');
        console.log(`📊 Total records: ${count}`);
        console.log(`💾 Output file: ${outputFile}`);
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Open MongoDB Compass');
        console.log('2. Import the generated CSV file');
        console.log('3. Users can login immediately with their credentials');
        console.log('');
        console.log('✅ All passwords are securely hashed!');
      });

  } catch (error) {
    console.error('❌ Error creating Compass-ready CSV:', error);
  }
};

// Usage
const inputFile = process.argv[2];
const outputFile = process.argv[3] || 'compass_ready_' + (inputFile || 'students.csv');

if (!inputFile) {
  console.log('🧭 Compass-Ready CSV Creator');
  console.log('Usage: node compass-ready-import.js <input-csv> [output-csv]');
  console.log('');
  console.log('Examples:');
  console.log('  node compass-ready-import.js students.csv');
  console.log('  node compass-ready-import.js raw_data.csv compass_students.csv');
  console.log('');
  console.log('This tool:');
  console.log('✅ Hashes all passwords securely');
  console.log('✅ Fixes column headers for MongoDB');
  console.log('✅ Creates CSV ready for Compass import');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`❌ File not found: ${inputFile}`);
  process.exit(1);
}

createCompassReadyCSV(inputFile, outputFile);