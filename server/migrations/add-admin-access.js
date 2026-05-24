const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { connectDB, disconnectDB } = require('../database-setup');
require('dotenv').config();

/**
 * Migration: Add access field to existing admin records
 * 
 * This script adds the access field to all admin records that don't have it.
 * You can choose to add empty access or default access to their home department.
 */

const addAdminAccess = async () => {
  try {
    await connectDB();
    console.log('🔗 Connected to MongoDB');

    // Find all admins without access field
    const adminsWithoutAccess = await Admin.find({ 
      $or: [
        { access: { $exists: false } },
        { access: null }
      ]
    });

    console.log(`📊 Found ${adminsWithoutAccess.length} admins without access field`);

    if (adminsWithoutAccess.length === 0) {
      console.log('✅ All admins already have access field');
      await disconnectDB();
      process.exit(0);
    }

    // Option 1: Add empty access (admins can manage but not teach)
    // Uncomment this if you want empty access:
    /*
    for (const admin of adminsWithoutAccess) {
      admin.access = [];
      await admin.save();
      console.log(`✅ Added empty access to ${admin.name} (${admin.id})`);
    }
    */

    // Option 2: Add default access to their home department (all years, all sections)
    // Uncomment this if you want default access:
    
    for (const admin of adminsWithoutAccess) {
      admin.access = [
        {
          dept: admin.dept,
          years: [
            { year: '1', sections: ['A', 'B', 'C'] },
            { year: '2', sections: ['A', 'B', 'C'] },
            { year: '3', sections: ['A', 'B', 'C'] },
            { year: '4', sections: ['A', 'B', 'C'] }
          ]
        }
      ];
      await admin.save();
      console.log(`✅ Added default access to ${admin.name} (${admin.id}) - ${admin.dept} dept, all years/sections`);
    }
    

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`📝 Updated ${adminsWithoutAccess.length} admin records`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

// Run migration
addAdminAccess();
