const express = require('express');
const router = express.Router();
const DepartmentStructure = require('../models/DepartmentStructure');
const Notice = require('../models/Notice');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

// Public endpoint for initial setup - no authentication required
router.post('/department-structure', async (req, res) => {
  try {
    const { dept, years } = req.body;
    
    if (!dept || !years) {
      return res.status(400).json({ message: 'Department and years are required' });
    }
    
    // Check if department already exists
    const existing = await DepartmentStructure.findOne({ dept: dept.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Department structure already exists. Use PUT to update.' });
    }
    
    const structure = new DepartmentStructure({
      dept: dept.toUpperCase(),
      years
    });
    
    await structure.save();
    res.status(201).json({
      message: 'Department structure created successfully',
      structure
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk create multiple department structures
router.post('/department-structure/bulk', async (req, res) => {
  try {
    const { departments } = req.body;
    
    if (!departments || !Array.isArray(departments)) {
      return res.status(400).json({ message: 'Departments array is required' });
    }
    
    const created = [];
    const errors = [];
    
    for (const deptData of departments) {
      try {
        const existing = await DepartmentStructure.findOne({ dept: deptData.dept.toUpperCase() });
        if (existing) {
          errors.push({ dept: deptData.dept, error: 'Already exists' });
          continue;
        }
        
        const structure = new DepartmentStructure({
          dept: deptData.dept.toUpperCase(),
          years: deptData.years
        });
        
        await structure.save();
        created.push(structure);
      } catch (error) {
        errors.push({ dept: deptData.dept, error: error.message });
      }
    }
    
    res.status(201).json({
      message: `Created ${created.length} department structures`,
      created,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all department structures (public)
router.get('/department-structure', async (req, res) => {
  try {
    const structures = await DepartmentStructure.find({ isActive: true });
    res.json(structures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete faculty by ID (for cleanup)
router.delete('/faculty/:id', async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    const result = await Faculty.deleteOne({ id: req.params.id.toUpperCase() });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete student by ID (for cleanup)
router.delete('/student/:id', async (req, res) => {
  try {
    const Student = require('../models/Student');
    const result = await Student.deleteOne({ id: req.params.id.toUpperCase() });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update faculty access (for existing faculty)
router.put('/faculty/:id', async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    const { dept, access } = req.body;
    
    const updateData = {};
    if (dept) updateData.dept = dept.toUpperCase();
    if (access) updateData.access = access;
    
    const faculty = await Faculty.findOneAndUpdate(
      { id: req.params.id.toUpperCase() },
      updateData,
      { new: true }
    ).select('-password');
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    res.json({
      message: 'Faculty updated successfully',
      faculty
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Migration endpoint to update existing comments with userId
router.post('/migrate-comments', async (req, res) => {
  try {
    const notices = await Notice.find({});
    let updatedCount = 0;
    let commentsUpdated = 0;
    let acknowledgementsUpdated = 0;

    console.log(`Found ${notices.length} notices to check for migration`);

    for (const notice of notices) {
      let noticeUpdated = false;

      // Update comments
      for (const comment of notice.comments) {
        if (!comment.userId && comment.user) {
          let user;
          try {
            if (comment.role === 'student') {
              user = await Student.findById(comment.user);
            } else if (comment.role === 'faculty') {
              user = await Faculty.findById(comment.user);
            } else if (comment.role === 'admin') {
              user = await Admin.findById(comment.user);
            }

            if (user) {
              comment.userId = user.id;
              comment.name = user.name;
              noticeUpdated = true;
              commentsUpdated++;
              console.log(`Updated comment: ${user.id} - ${user.name}`);
            }
          } catch (error) {
            console.error(`Error updating comment for user ${comment.user}:`, error);
          }
        }
      }

      // Update acknowledgments
      for (const ack of notice.acknowledgments) {
        if (!ack.userId && ack.user) {
          let user;
          try {
            if (ack.role === 'student') {
              user = await Student.findById(ack.user);
            } else if (ack.role === 'faculty') {
              user = await Faculty.findById(ack.user);
            } else if (ack.role === 'admin') {
              user = await Admin.findById(ack.user);
            }

            if (user) {
              ack.userId = user.id;
              ack.name = user.name;
              noticeUpdated = true;
              acknowledgementsUpdated++;
              console.log(`Updated acknowledgment: ${user.id} - ${user.name}`);
            }
          } catch (error) {
            console.error(`Error updating acknowledgment for user ${ack.user}:`, error);
          }
        }
      }

      if (noticeUpdated) {
        await notice.save();
        updatedCount++;
      }
    }

    res.json({ 
      message: `Migration completed successfully!`,
      noticesUpdated: updatedCount,
      commentsUpdated,
      acknowledgementsUpdated,
      totalNoticesChecked: notices.length
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
