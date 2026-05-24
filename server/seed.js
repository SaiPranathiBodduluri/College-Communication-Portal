const mongoose = require('mongoose');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Admin = require('./models/Admin');
const { connectDB, disconnectDB } = require('./database-setup');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    await connectDB();
    
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Admin.deleteMany({});
    
    console.log('🗑️  Database cleared successfully!');
    console.log('✅ Ready to add users via API');
    
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    await disconnectDB();
    process.exit(1);
  }
};

clearDatabase();