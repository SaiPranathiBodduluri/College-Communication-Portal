const express = require('express');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const Notice = require('../models/Notice');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get students by dept/year/section (for faculty/admin)
router.get('/students', auth, async (req, res) => {
  try {
    const { dept, year, section } = req.query;
    
    console.log('📚 GET /api/users/students called with:', { dept, year, section });
    
    if (!dept || !year || !section) {
      console.log('❌ Missing parameters');
      return res.status(400).json({ message: 'Department, year, and section are required' });
    }

    const students = await Student.find({
      dept: dept.toUpperCase(),
      year: year,
      section: section.toUpperCase()
    })
    .select('_id id name')
    .sort({ id: 1 });

    console.log(`✅ Found ${students.length} students`);
    res.json(students);
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Get students by department (admin only)
router.get('/students/all', auth, authorize('admin'), async (req, res) => {
  try {
    const adminDept = req.user.dept;
    console.log(`📚 GET /api/users/students/all called for dept: "${adminDept}"`);
    
    // Debug: Check what departments exist
    const allDepts = await Student.distinct('dept');
    console.log(`🔍 Available student departments: [${allDepts.map(d => `"${d}"`).join(', ')}]`);
    
    const students = await Student.find({ dept: adminDept }).select('-password').sort({ id: 1 });
    
    console.log(`✅ Found ${students.length} students in "${adminDept}" department`);
    res.json(students);
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Get faculty by department (admin only)
router.get('/faculty/all', auth, authorize('admin'), async (req, res) => {
  try {
    const adminDept = req.user.dept;
    console.log(`👨‍🏫 GET /api/users/faculty/all called for dept: "${adminDept}"`);
    
    // Debug: Check what departments exist
    const allDepts = await Faculty.distinct('dept');
    console.log(`🔍 Available faculty departments: [${allDepts.map(d => `"${d}"`).join(', ')}]`);
    
    const faculty = await Faculty.find({ dept: adminDept }).select('-password').sort({ id: 1 });
    
    console.log(`✅ Found ${faculty.length} faculty members in "${adminDept}" department`);
    res.json(faculty);
  } catch (error) {
    console.error('❌ Error fetching faculty:', error);
    res.status(500).json({ message: 'Error fetching faculty' });
  }
});

// Get admins by department (admin only)
router.get('/admins/all', auth, authorize('admin'), async (req, res) => {
  try {
    const adminDept = req.user.dept;
    console.log(`👑 GET /api/users/admins/all called for dept: "${adminDept}"`);
    
    // Debug: Check what departments exist
    const allDepts = await Admin.distinct('dept');
    console.log(`🔍 Available admin departments: [${allDepts.map(d => `"${d}"`).join(', ')}]`);
    
    const admins = await Admin.find({ dept: adminDept }).select('-password').sort({ id: 1 });
    
    console.log(`✅ Found ${admins.length} admins in "${adminDept}" department`);
    res.json(admins);
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    res.status(500).json({ message: 'Error fetching admins' });
  }
});

// Get all users (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    const faculty = await Faculty.find().select('-password');
    const admins = await Admin.find().select('-password');
    
    const users = [
      ...students.map(s => ({ ...s.toObject(), role: 'student' })),
      ...faculty.map(f => ({ ...f.toObject(), role: 'faculty' })),
      ...admins.map(a => ({ ...a.toObject(), role: 'admin' }))
    ];
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    console.log(`🚀 Dashboard endpoint called by ${req.user.role} ${req.user.name} (ID: ${req.user._id})`);
    const stats = {};

    // Get all active notices and apply the same filtering logic as in notices.js
    const allNotices = await Notice.find({
      isActive: true,
      'hiddenFrom.user': { $ne: req.user._id }  // Exclude notices hidden by this user
    }).sort({ createdAt: -1 });

    // Apply the same detailed filtering logic as in notices.js
    const filteredNotices = allNotices.filter(notice => {
      // Skip notices without proper targetAudience structure (old notices)
      if (!notice.targetAudience || !notice.targetAudience.roles || !Array.isArray(notice.targetAudience.roles)) {
        return false;
      }
      
      // Check if user's role is in target audience
      if (!notice.targetAudience.roles.includes(req.user.role)) {
        return false;
      }

      // For students, check specific targeting
      if (req.user.role === 'student') {
        // Check if student's department is targeted (if departments are specified)
        if (notice.targetAudience.departments && notice.targetAudience.departments.length > 0) {
          if (!notice.targetAudience.departments.includes(req.user.dept)) {
            return false;
          }
        }

        // Check if student's year is targeted (if years are specified)
        if (notice.targetAudience.years && notice.targetAudience.years.length > 0) {
          const userYear = String(req.user.year);
          const targetYears = notice.targetAudience.years.map(y => String(y));
          if (!targetYears.includes(userYear)) {
            return false;
          }
        }

        // Check if student's section is targeted (if sections are specified)
        if (notice.targetAudience.sections && notice.targetAudience.sections.length > 0) {
          const userSection = String(req.user.section);
          const targetSections = notice.targetAudience.sections.map(s => String(s));
          if (!targetSections.includes(userSection)) {
            return false;
          }
        }

        // Check student filters (CR, LR, specific IDs, etc.)
        if (notice.targetAudience.studentFilters && notice.targetAudience.studentFilters.length > 0) {
          const matchingFilter = notice.targetAudience.studentFilters.find(filter => 
            String(filter.dept) === String(req.user.dept) && 
            String(filter.year) === String(req.user.year) && 
            String(filter.section) === String(req.user.section)
          );

          if (!matchingFilter) {
            return false;
          }

          switch (matchingFilter.filterType) {
            case 'cr':
              if (req.user.specialRole !== 'CR') return false;
              break;
            case 'lr':
              if (req.user.specialRole !== 'LR') return false;
              break;
            case 'both':
              if (!['CR', 'LR'].includes(req.user.specialRole)) return false;
              break;
            case 'specific':
              if (!matchingFilter.specificIds.includes(req.user.id)) return false;
              break;
            case 'all':
            default:
              // All students in this section can see it
              break;
          }
        }
      }

      // For faculty, check specific user targeting
      if (req.user.role === 'faculty') {
        if (notice.targetAudience.roles.includes('faculty') && 
            notice.targetAudience.specificUsers && 
            notice.targetAudience.specificUsers.faculty && 
            notice.targetAudience.specificUsers.faculty.length > 0) {
          // Check if this specific faculty member is targeted
          if (!notice.targetAudience.specificUsers.faculty.some(id => id.toString() === req.user._id.toString())) {
            return false;
          }
        }
      }

      // For admin, check specific user targeting
      if (req.user.role === 'admin') {
        if (notice.targetAudience.roles.includes('admin') && 
            notice.targetAudience.specificUsers && 
            notice.targetAudience.specificUsers.admin && 
            notice.targetAudience.specificUsers.admin.length > 0) {
          // Check if this specific admin member is targeted
          if (!notice.targetAudience.specificUsers.admin.some(id => id.toString() === req.user._id.toString())) {
            return false;
          }
        }
      }

      return true;
    });

    // Get notices created by this user (for faculty and admin)
    let createdNotices = [];
    console.log(`🔍 User role check: ${req.user.role} === 'faculty'? ${req.user.role === 'faculty'}`);
    console.log(`🔍 User role check: ${req.user.role} === 'admin'? ${req.user.role === 'admin'}`);
    
    if (req.user.role === 'faculty' || req.user.role === 'admin') {
      console.log(`🔍 Looking for notices created by ${req.user.role} ${req.user.name} (ID: ${req.user._id})`);
      
      createdNotices = await Notice.find({
        'author.id': req.user._id,
        isActive: true
      }).sort({ createdAt: -1 }).limit(10);
      
      console.log(`📝 Found ${createdNotices.length} created notices`);
      if (createdNotices.length > 0) {
        console.log(`   Titles: ${createdNotices.map(n => n.title).join(', ')}`);
      }
      
      // Debug: Check all notices to see their authors
      const allNotices = await Notice.find({ isActive: true }).select('title author');
      console.log(`🔍 All notices in database:`);
      allNotices.forEach(notice => {
        console.log(`   - "${notice.title}" by ${notice.author?.name} (ID: ${notice.author?.id})`);
      });
    } else {
      console.log(`❌ User role ${req.user.role} is not faculty or admin`);
    }

    if (req.user.role === 'admin') {
      // Count users by department (same as the individual endpoints)
      const adminDept = req.user.dept;
      console.log(`🔍 Admin department: "${adminDept}"`);
      
      const studentCount = await Student.countDocuments({ dept: adminDept });
      const facultyCount = await Faculty.countDocuments({ dept: adminDept });
      const adminCount = await Admin.countDocuments({ dept: adminDept });
      
      console.log(`📊 Department counts for "${adminDept}":`);
      console.log(`   Students: ${studentCount}`);
      console.log(`   Faculty: ${facultyCount}`);
      console.log(`   Admins: ${adminCount}`);
      
      stats.totalUsers = studentCount + facultyCount + adminCount;
      stats.totalNotices = filteredNotices.length;
      stats.activeNotices = filteredNotices.length;
      stats.recentNotices = filteredNotices.slice(0, 5);
      stats.createdNotices = createdNotices;
      stats.totalCreatedNotices = createdNotices.length;
    } else if (req.user.role === 'faculty') {
      stats.totalNotices = filteredNotices.length;
      stats.unreadNotices = filteredNotices.filter(notice => 
        !notice.views.some(view => view.user.toString() === req.user._id.toString())
      ).length;
      stats.recentNotices = filteredNotices.slice(0, 5);
      stats.createdNotices = createdNotices;
      stats.totalCreatedNotices = createdNotices.length;
    } else {
      stats.totalNotices = filteredNotices.length;
      stats.unreadNotices = filteredNotices.filter(notice => 
        !notice.views.some(view => view.user.toString() === req.user._id.toString())
      ).length;
      stats.recentNotices = filteredNotices.slice(0, 5);
    }

    console.log(`📊 Dashboard stats for ${req.user.role} ${req.user.name}:`);
    console.log(`   Total filtered notices: ${filteredNotices.length}`);
    console.log(`   Recent notices: ${stats.recentNotices.map(n => n.title).join(', ')}`);
    if (req.user.role === 'faculty' || req.user.role === 'admin') {
      console.log(`   Created notices: ${stats.createdNotices?.length || 0}`);
      console.log(`   Created notice titles: ${stats.createdNotices?.map(n => n.title).join(', ') || 'none'}`);
    }

    res.json(stats);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get faculty list for notice targeting
router.get('/faculty-list', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const facultyList = await Faculty.find({ isActive: true })
      .select('name id dept email')
      .sort({ name: 1 });
    
    res.json(facultyList);
  } catch (error) {
    console.error('Error fetching faculty list:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get admin list for notice targeting
router.get('/admin-list', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const adminList = await Admin.find({ isActive: true })
      .select('name id dept email')
      .sort({ name: 1 });
    
    res.json(adminList);
  } catch (error) {
    console.error('Error fetching admin list:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;