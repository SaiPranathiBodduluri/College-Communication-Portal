const mongoose = require('mongoose');

const listCollections = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/college_management');
    console.log('🔗 Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📂 Available collections:');
    if (collections.length === 0) {
      console.log('   No collections found');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`   - ${collection.name}: ${count} documents`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing collections:', error);
    process.exit(1);
  }
};

listCollections();