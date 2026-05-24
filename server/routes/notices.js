const express = require('express');
const multer = require('multer');
const path = require('path');
const Notice = require('../models/Notice');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Debug endpoint to check notices in database
router.get('/debug', auth, async (req, res) => {
  try {
    const notices = await Notice.find({}).select('title targetAudience createdAt');
    console.log('🔍 All notices in database:');
    notices.forEach(notice => {
      console.log(`   - ${notice.title}`);
      console.log(`     Target: ${JSON.stringify(notice.targetAudience)}`);
    });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint to check current user details
router.get('/debug/user', auth, async (req, res) => {
  try {
    console.log('🔍 Current user details:', {
      name: req.user.name,
      role: req.user.role,
      dept: req.user.dept,
      year: req.user.year,
      section: req.user.section,
      specialRole: req.user.specialRole
    });
    res.json({
      name: req.user.name,
      role: req.user.role,
      dept: req.user.dept,
      year: req.user.year,
      section: req.user.section,
      specialRole: req.user.specialRole
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Get notices created by current user (faculty/admin only)
router.get('/my-created', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    console.log(`📝 Fetching created notices for ${req.user.role} ${req.user.name} (ID: ${req.user._id})`);
    
    const createdNotices = await Notice.find({
      'author.id': req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${createdNotices.length} created notices`);
    
    res.json(createdNotices);
  } catch (error) {
    console.error('❌ Error fetching created notices:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all notices for current user
router.get('/', auth, async (req, res) => {
  try {
    const { category, department, page = 1, limit = 10 } = req.query;
    
    console.log('📋 Fetching notices for user:', req.user.name, '(', req.user.role, ')');
    if (req.user.role === 'student') {
      console.log('   👨‍🎓 Student details:', { 
        dept: req.user.dept, 
        year: req.user.year, 
        section: req.user.section, 
        specialRole: req.user.specialRole 
      });
    }
    
    // Base query - notices that are active and not hidden by this user
    let query = {
      isActive: true,
      'hiddenFrom.user': { $ne: req.user._id }  // Exclude notices hidden by this user
    };

    // Apply additional filters if provided
    if (category) query.category = category;
    if (department) query['targetAudience.departments'] = department;

    // Get all notices that could potentially match
    const allNotices = await Notice.find(query)
      .sort({ createdAt: -1 });

    // Filter notices based on user's role and specific targeting
    const filteredNotices = allNotices.filter(notice => {
      console.log(`\n🔍 Checking notice: "${notice.title}" (ID: ${notice._id})`);
      console.log('   Target audience:', JSON.stringify(notice.targetAudience, null, 2));
      
      // Skip notices without proper targetAudience structure (old notices)
      if (!notice.targetAudience || !notice.targetAudience.roles || !Array.isArray(notice.targetAudience.roles)) {
        console.log('   ❌ Invalid targetAudience structure - skipping old notice');
        return false;
      }
      
      // Check if user's role is in target audience
      if (!notice.targetAudience.roles.includes(req.user.role)) {
        console.log(`   ❌ Role not targeted: ${req.user.role} (notice targets: ${notice.targetAudience.roles.join(', ')})`);
        return false;
      }

      // For students, check specific targeting
      if (req.user.role === 'student') {
        console.log('   📚 Checking student targeting...');
        console.log(`   👨‍🎓 Student profile: ${req.user.dept} ${req.user.year} ${req.user.section} (${req.user.specialRole})`);
        
        // IMPORTANT: For students, ALL targeting criteria must match if specified
        
        // Check if student's department is targeted (if departments are specified)
        if (notice.targetAudience.departments && notice.targetAudience.departments.length > 0) {
          if (!notice.targetAudience.departments.includes(req.user.dept)) {
            console.log(`   ❌ Department not targeted. User: "${req.user.dept}" | Targets: [${notice.targetAudience.departments.join(', ')}]`);
            return false;
          }
          console.log(`   ✅ Department matches: ${req.user.dept}`);
        }

        // Check if student's year is targeted (if years are specified)
        if (notice.targetAudience.years && notice.targetAudience.years.length > 0) {
          // Convert both to strings for comparison
          const userYear = String(req.user.year);
          const targetYears = notice.targetAudience.years.map(y => String(y));
          
          if (!targetYears.includes(userYear)) {
            console.log(`   ❌ Year not targeted. User: "${userYear}" | Targets: [${targetYears.join(', ')}]`);
            return false;
          }
          console.log(`   ✅ Year matches: ${userYear}`);
        }

        // Check if student's section is targeted (if sections are specified)
        if (notice.targetAudience.sections && notice.targetAudience.sections.length > 0) {
          // Convert both to strings for comparison
          const userSection = String(req.user.section);
          const targetSections = notice.targetAudience.sections.map(s => String(s));
          
          if (!targetSections.includes(userSection)) {
            console.log(`   ❌ Section not targeted. User: "${userSection}" | Targets: [${targetSections.join(', ')}]`);
            return false;
          }
          console.log(`   ✅ Section matches: ${userSection}`);
        }

        // Check student filters (CR, LR, specific IDs, etc.)
        if (notice.targetAudience.studentFilters && notice.targetAudience.studentFilters.length > 0) {
          console.log('   🔍 Checking student filters...');
          const matchingFilter = notice.targetAudience.studentFilters.find(filter => 
            String(filter.dept) === String(req.user.dept) && 
            String(filter.year) === String(req.user.year) && 
            String(filter.section) === String(req.user.section)
          );

          if (!matchingFilter) {
            console.log(`   ❌ No matching filter found for ${req.user.dept} ${req.user.year} ${req.user.section}`);
            return false;
          }

          console.log(`   🔍 Found matching filter: ${matchingFilter.filterType}`);
          
          switch (matchingFilter.filterType) {
            case 'cr':
              if (req.user.specialRole !== 'CR') {
                console.log(`   ❌ CR role required, user has: ${req.user.specialRole}`);
                return false;
              }
              break;
            case 'lr':
              if (req.user.specialRole !== 'LR') {
                console.log(`   ❌ LR role required, user has: ${req.user.specialRole}`);
                return false;
              }
              break;
            case 'both':
              if (!['CR', 'LR'].includes(req.user.specialRole)) {
                console.log(`   ❌ CR or LR role required, user has: ${req.user.specialRole}`);
                return false;
              }
              break;
            case 'specific':
              if (!matchingFilter.specificIds.includes(req.user.id)) {
                console.log(`   ❌ Specific ID required, user ID: ${req.user.id}, allowed: [${matchingFilter.specificIds.join(', ')}]`);
                return false;
              }
              break;
            case 'all':
            default:
              console.log('   ✅ All students in this section allowed');
              break;
          }
        }
        
        console.log('   ✅ Student targeting passed!');
      }

      // For faculty, check specific user targeting
      if (req.user.role === 'faculty') {
        if (notice.targetAudience.roles.includes('faculty') && 
            notice.targetAudience.specificUsers && 
            notice.targetAudience.specificUsers.faculty && 
            notice.targetAudience.specificUsers.faculty.length > 0) {
          // Check if this specific faculty member is targeted
          if (!notice.targetAudience.specificUsers.faculty.some(id => id.toString() === req.user._id.toString())) {
            console.log('   ❌ Faculty member not specifically targeted');
            return false;
          }
        }
        console.log('   ✅ Faculty targeting passed!');
      }

      // For admin, check specific user targeting
      if (req.user.role === 'admin') {
        if (notice.targetAudience.roles.includes('admin') && 
            notice.targetAudience.specificUsers && 
            notice.targetAudience.specificUsers.admin && 
            notice.targetAudience.specificUsers.admin.length > 0) {
          // Check if this specific admin member is targeted
          if (!notice.targetAudience.specificUsers.admin.some(id => id.toString() === req.user._id.toString())) {
            console.log('   ❌ Admin member not specifically targeted');
            return false;
          }
        }
        console.log('   ✅ Admin targeting passed!');
      }

      console.log(`   ✅ Notice "${notice.title}" passed all filters`);
      return true;
    });

    // Apply pagination to filtered results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotices = filteredNotices.slice(startIndex, endIndex);

    console.log('   ✅ FINAL RESULT: Found', paginatedNotices.length, 'targeted notices for:', req.user.role);
    if (req.user.role === 'student') {
      console.log('   👨‍🎓 Student profile:', req.user.dept, req.user.year, req.user.section);
    }
    console.log('   📋 Notice titles:', paginatedNotices.map(n => n.title));

    // Set cache control headers to prevent browser caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      notices: paginatedNotices,
      totalPages: Math.ceil(filteredNotices.length / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('❌ Error fetching notices:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create notice
router.post('/', auth, authorize('admin', 'faculty'), upload.array('attachments'), async (req, res) => {
  try {
    console.log('📝 Notice creation request received');
    console.log('   User:', req.user?.name, '(', req.user?.role, ')');
    console.log('   Body:', req.body);
    
    const { title, content, category, priority, targetAudience, scheduledDate, expiryDate, allowFileSubmissions } = req.body;
    
    console.log('   Target Audience Raw:', targetAudience);
    
    if (!title || !content || !category || !priority || !targetAudience) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const attachments = req.files?.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    })) || [];

    // Parse targetAudience if it's a string
    let parsedTargetAudience = targetAudience;
    if (typeof targetAudience === 'string') {
      try {
        parsedTargetAudience = JSON.parse(targetAudience);
      } catch (e) {
        console.log('❌ Invalid targetAudience format:', e.message);
        return res.status(400).json({ message: 'Invalid targetAudience format' });
      }
    }
    
    console.log('   Parsed Target Audience:', JSON.stringify(parsedTargetAudience, null, 2));

    const notice = new Notice({
      title,
      content,
      category,
      priority,
      targetAudience: {
        ...parsedTargetAudience,
        // Ensure specificUsers structure exists
        specificUsers: parsedTargetAudience.specificUsers || { faculty: [], admin: [] }
      },
      author: {
        id: req.user._id,
        role: req.user.role,
        name: req.user.name
      },
      attachments,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      isScheduled: !!scheduledDate,
      allowFileSubmissions: allowFileSubmissions === 'true' || allowFileSubmissions === true
    });

    await notice.save();

    console.log('✅ Notice created successfully:', notice._id);

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new-notice', notice);
    }

    res.status(201).json(notice);
  } catch (error) {
    console.error('❌ Notice creation error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
});

// Get single notice
router.get('/:id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Add view if not already viewed
    const hasViewed = notice.views.some(view => view.user.toString() === req.user._id.toString());
    if (!hasViewed) {
      notice.views.push({ 
        user: req.user._id,
        role: req.user.role
      });
      await notice.save();
    }

    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment to notice (with file attachments for students)
router.post('/:id/comments', auth, upload.array('attachments'), async (req, res) => {
  try {
    const { content } = req.body;
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Process attachments if any
    const attachments = req.files?.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    })) || [];

    const newComment = {
      user: req.user._id,
      role: req.user.role,
      userId: req.user.id,
      name: req.user.name,
      content,
      attachments
    };

    notice.comments.push(newComment);
    await notice.save();

    res.json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Acknowledge notice
router.post('/:id/acknowledge', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const hasAcknowledged = notice.acknowledgments.some(ack => ack.user.toString() === req.user._id.toString());
    if (!hasAcknowledged) {
      notice.acknowledgments.push({ 
        user: req.user._id,
        role: req.user.role,
        userId: req.user.id,
        name: req.user.name
      });
      await notice.save();
    }

    res.json({ message: 'Notice acknowledged' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hide notice from user's view (dismiss for individual user)
router.post('/:id/hide', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const isAlreadyHidden = notice.hiddenFrom.some(hidden => hidden.user.toString() === req.user._id.toString());
    if (!isAlreadyHidden) {
      notice.hiddenFrom.push({ 
        user: req.user._id,
        role: req.user.role
      });
      await notice.save();
    }

    res.json({ message: 'Notice hidden from your view' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unhide notice (show again in user's view)
router.post('/:id/unhide', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    notice.hiddenFrom = notice.hiddenFrom.filter(hidden => hidden.user.toString() !== req.user._id.toString());
    await notice.save();

    res.json({ message: 'Notice restored to your view' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notice
router.delete('/:id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Check permissions
    if (req.user.role === 'student') {
      // Students can only delete notices they created (if any) or if they have special role
      if (notice.author.id.toString() !== req.user._id.toString() && 
          !['CR', 'LR'].includes(req.user.specialRole)) {
        return res.status(403).json({ message: 'Access denied. Only CR/LR can delete notices.' });
      }
    } else if (req.user.role === 'faculty') {
      // Faculty can delete their own notices or notices in their accessible departments
      if (notice.author.id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only delete your own notices' });
      }
    } else if (req.user.role === 'admin') {
      // Admin can delete any notice
    }

    await Notice.findByIdAndDelete(req.params.id);

    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;