const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB Atlas
    if (process.env.MONGODB_URI) {
      console.log('🔗 Connecting to MongoDB Atlas...');
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB Atlas');
      return;
    }
    
    // Fallback to local MongoDB
    console.log('🔗 Trying local MongoDB connection...');
    await mongoose.connect('mongodb://localhost:27017/scnbcp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to local MongoDB');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Please check your MongoDB Atlas connection string or ensure local MongoDB is running');
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };