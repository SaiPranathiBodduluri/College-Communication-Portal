const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const { auth } = require('../middleware/auth');

// Get recent messages for current user (inbox)
router.get('/recent', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    console.log('📬 Fetching recent messages for user:', req.user.id);
    
    // Find messages where recipient.id matches the user's id
    const messages = await Message.find({
      'recipient.id': req.user.id
    })
    .sort({ createdAt: -1 })
    .limit(limit);
    
    console.log(`✅ Found ${messages.length} recent messages`);
    res.json(messages);
  } catch (error) {
    console.error('❌ Error fetching recent messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Get students by dept/year/section
router.get('/students', auth, async (req, res) => {
  try {
    const { dept, year, section } = req.query;
    
    if (!dept || !year || !section) {
      return res.status(400).json({ message: 'Department, year, and section are required' });
    }

    const students = await Student.find({
      dept: dept.toUpperCase(),
      year: year,
      section: section.toUpperCase()
    })
    .select('_id id name')
    .sort({ id: 1 });

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Send bulk messages
router.post('/send-bulk', auth, async (req, res) => {
  try {
    const { recipientIds, message, priority } = req.body;

    console.log('📨 POST /api/messages/send-bulk called');
    console.log('User:', req.user);
    console.log('Recipients:', recipientIds?.length, 'students');
    console.log('Message length:', message?.length, 'characters');

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      console.log('❌ No recipient IDs provided');
      return res.status(400).json({ message: 'Recipient IDs are required' });
    }

    if (!message) {
      console.log('❌ No message provided');
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get sender info from req.user (already populated by auth middleware)
    const senderInfo = {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    };

    // Get all recipient students
    const students = await Student.find({ _id: { $in: recipientIds } });
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found' });
    }

    // Create messages for all recipients
    const messages = students.map(student => ({
      sender: senderInfo,
      recipient: {
        id: student.id,
        name: student.name,
        role: 'student'
      },
      subject: 'Message from Faculty',
      message,
      priority: priority || 'normal'
    }));

    console.log('💾 Inserting', messages.length, 'messages into database...');
    await Message.insertMany(messages);

    console.log('✅ Messages sent successfully');
    res.json({ 
      success: true, 
      message: `Message sent to ${messages.length} recipient(s)`,
      count: messages.length
    });
  } catch (error) {
    console.error('❌ Error sending bulk messages:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Error sending messages: ' + error.message });
  }
});

// Search users (students, faculty, admin)
router.get('/search-users', auth, async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    console.log('🔍 Search request:', { query, type, userRole: req.user.role, userId: req.user.id });

    let results = [];
    const searchRegex = new RegExp(query, 'i');
    
    // Get accessible departments and sections based on user role
    let accessibleDepts = [];
    let facultyAccess = null;
    
    if (req.user.role === 'admin') {
      // Admins can only search their own department
      accessibleDepts = [req.user.dept];
      console.log('👨‍💼 Admin access - Department:', req.user.dept);
    } else if (req.user.role === 'faculty') {
      // Faculty can search departments they have access to
      try {
        const faculty = await Faculty.findOne({ id: req.user.id });
        console.log('👩‍🏫 Faculty found:', faculty ? 'Yes' : 'No');
        if (faculty && faculty.access) {
          facultyAccess = faculty.access;
          accessibleDepts = faculty.access.map(a => a.dept);
          console.log('📚 Faculty access:', JSON.stringify(faculty.access, null, 2));
        } else {
          console.log('❌ No faculty access found');
        }
      } catch (error) {
        console.error('Error fetching faculty access:', error);
        return res.status(500).json({ message: 'Error fetching access permissions' });
      }
    }

    // Check if query is numeric (for partial ID search)
    const isNumericQuery = /^\d+$/.test(query);
    
    // Search students
    if (!type || type === 'student') {
      let searchConditions = [
        { name: searchRegex },
        { id: searchRegex },
        { email: searchRegex }
      ];
      
      // If query is numeric, also search for IDs ending with these digits
      if (isNumericQuery && query.length >= 3) {
        const endPattern = new RegExp(query + '$', 'i');
        searchConditions.push({ id: endPattern });
      }
      
      let students = [];
      
      if (req.user.role === 'admin') {
        // Admin: search all students in their department
        console.log('🔍 Admin searching in department:', req.user.dept);
        students = await Student.find({
          dept: req.user.dept,
          $or: searchConditions
        }).select('id name email dept year section').limit(20);
      } else if (req.user.role === 'faculty' && facultyAccess && facultyAccess.length > 0) {
        // Faculty: search only students from specific dept/year/section combinations they have access to
        const accessQueries = [];
        
        facultyAccess.forEach(deptAccess => {
          deptAccess.years.forEach(yearAccess => {
            yearAccess.sections.forEach(section => {
              // For each accessible dept/year/section, create queries with search conditions
              searchConditions.forEach(condition => {
                accessQueries.push({
                  dept: deptAccess.dept,
                  year: yearAccess.year,
                  section: section,
                  ...condition
                });
              });
            });
          });
        });
        
        console.log('🔍 Faculty access queries count:', accessQueries.length);
        if (accessQueries.length > 0) {
          console.log('📋 Sample access query:', JSON.stringify(accessQueries[0], null, 2));
          
          students = await Student.find({
            $or: accessQueries
          }).select('id name email dept year section').limit(20);
        }
      } else {
        // Fallback: search all students (for other roles if any)
        console.log('🔍 Fallback: searching all students');
        students = await Student.find({
          $or: searchConditions
        }).select('id name email dept year section').limit(20);
      }
      
      console.log('👥 Students found:', students.length);
      if (students.length > 0) {
        console.log('📋 Sample student:', students[0]);
      }
      
      results = [...results, ...students.map(s => ({
        ...s.toObject(),
        role: 'student'
      }))];
    }

    // Search faculty (only from user's own department)
    if (!type || type === 'faculty') {
      let searchConditions = [
        { name: searchRegex },
        { id: searchRegex },
        { email: searchRegex }
      ];
      
      // If query is numeric, also search for IDs ending with these digits
      if (isNumericQuery && query.length >= 3) {
        const endPattern = new RegExp(query + '$', 'i');
        searchConditions.push({ id: endPattern });
      }
      
      // Faculty and admins can only search faculty from their own department
      let deptFilter = {};
      if (req.user.role === 'admin') {
        deptFilter = { dept: req.user.dept };
        console.log('🔍 Admin searching faculty in own department:', req.user.dept);
      } else if (req.user.role === 'faculty') {
        // Get faculty's home department
        try {
          const currentFaculty = await Faculty.findOne({ id: req.user.id });
          if (currentFaculty) {
            deptFilter = { dept: currentFaculty.dept };
            console.log('🔍 Faculty searching faculty in own department:', currentFaculty.dept);
          }
        } catch (error) {
          console.error('Error fetching current faculty dept:', error);
        }
      }
      
      const faculty = await Faculty.find({
        ...deptFilter,
        $or: searchConditions
      }).select('id name email dept').limit(20);
      
      console.log('👩‍🏫 Faculty found:', faculty.length);
      results = [...results, ...faculty.map(f => ({
        ...f.toObject(),
        role: 'faculty'
      }))];
    }

    // Search admin (only from user's own department)
    if (!type || type === 'admin') {
      let searchConditions = [
        { name: searchRegex },
        { id: searchRegex },
        { email: searchRegex }
      ];
      
      // If query is numeric, also search for IDs ending with these digits
      if (isNumericQuery && query.length >= 3) {
        const endPattern = new RegExp(query + '$', 'i');
        searchConditions.push({ id: endPattern });
      }
      
      // Faculty and admins can only search admins from their own department
      let deptFilter = {};
      if (req.user.role === 'admin') {
        deptFilter = { dept: req.user.dept };
        console.log('🔍 Admin searching admins in own department:', req.user.dept);
      } else if (req.user.role === 'faculty') {
        // Get faculty's home department
        try {
          const currentFaculty = await Faculty.findOne({ id: req.user.id });
          if (currentFaculty) {
            deptFilter = { dept: currentFaculty.dept };
            console.log('🔍 Faculty searching admins in own department:', currentFaculty.dept);
          }
        } catch (error) {
          console.error('Error fetching current faculty dept:', error);
        }
      }
      
      const admins = await Admin.find({
        ...deptFilter,
        $or: searchConditions
      }).select('id name email dept').limit(20);
      
      console.log('👨‍💼 Admins found:', admins.length);
      results = [...results, ...admins.map(a => ({
        ...a.toObject(),
        role: 'admin'
      }))];
    }

    console.log('📊 Total results:', results.length);
    res.json(results);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { recipientId, subject, message, priority } = req.body;

    if (!recipientId || !subject || !message) {
      return res.status(400).json({ message: 'Recipient, subject, and message are required' });
    }

    // Find recipient
    let recipient = await Student.findOne({ id: recipientId });
    let recipientRole = 'student';
    
    if (!recipient) {
      recipient = await Faculty.findOne({ id: recipientId });
      recipientRole = 'faculty';
    }
    
    if (!recipient) {
      recipient = await Admin.findOne({ id: recipientId });
      recipientRole = 'admin';
    }

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const newMessage = new Message({
      sender: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      recipient: {
        id: recipient.id,
        name: recipient.name,
        role: recipientRole
      },
      subject,
      message,
      priority: priority || 'normal'
    });

    await newMessage.save();

    res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Get inbox messages (received)
router.get('/inbox', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      'recipient.id': req.user.id
    }).sort({ createdAt: -1 });

    const unreadCount = messages.filter(m => !m.isRead).length;

    res.json({
      messages,
      unreadCount
    });
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Get sent messages
router.get('/sent', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      'sender.id': req.user.id
    }).sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ message: 'Error fetching sent messages' });
  }
});

// Get single message
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or recipient
    if (message.sender.id !== req.user.id && message.recipient.id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Mark as read if recipient is viewing
    if (message.recipient.id === req.user.id && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json(message);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ message: 'Error fetching message' });
  }
});

// Mark message as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipient.id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Error marking message as read' });
  }
});

// Delete message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only recipient can delete
    if (message.recipient.id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

module.exports = router;
