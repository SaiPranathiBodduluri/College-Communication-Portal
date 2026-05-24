const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

// Get unread notifications count
router.get('/count', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const userDept = req.user.dept;
    const userYear = req.user.year;
    const userSection = req.user.section;
    const userSpecialRole = req.user.specialRole;

    // Count unread messages
    console.log('🔍 Counting messages for user ID:', req.user.id);
    const unreadMessages = await Message.countDocuments({
      'recipient.id': req.user.id,
      isRead: false
    });
    console.log('📊 Unread message count:', unreadMessages);

    // Count unread notices (notices not viewed by user)
    const noticeQuery = {
      isActive: true,
      $or: [
        { scheduledDate: { $exists: false } },
        { scheduledDate: { $lte: new Date() } }
      ],
      $and: [
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: { $gte: new Date() } }
          ]
        }
      ],
      // Not hidden by user
      'hiddenFrom.user': { $ne: userId },
      // Not viewed by user
      'views.user': { $ne: userId }
    };

    // Add targeting filters
    const targetingConditions = [];

    // Role-based targeting
    targetingConditions.push({
      'targetAudience.roles': { $in: [userRole] }
    });

    // Department-based targeting
    if (userDept) {
      targetingConditions.push({
        'targetAudience.departments': { $in: [userDept] }
      });
    }

    // Student-specific targeting
    if (userRole === 'student') {
      const studentConditions = [];
      
      // General student filters
      studentConditions.push({
        'targetAudience.studentFilters': {
          $elemMatch: {
            dept: userDept,
            year: userYear,
            section: userSection,
            filterType: 'all'
          }
        }
      });

      // Special role filters (CR, LR)
      if (userSpecialRole && userSpecialRole !== 'none') {
        studentConditions.push({
          'targetAudience.studentFilters': {
            $elemMatch: {
              dept: userDept,
              year: userYear,
              section: userSection,
              filterType: { $in: [userSpecialRole, 'both'] }
            }
          }
        });
      }

      // Specific student ID targeting
      studentConditions.push({
        'targetAudience.studentFilters': {
          $elemMatch: {
            dept: userDept,
            year: userYear,
            section: userSection,
            filterType: 'specific',
            specificIds: { $in: [req.user.id] }
          }
        }
      });

      targetingConditions.push({ $or: studentConditions });
    }

    // Faculty/Admin specific targeting
    if (userRole === 'faculty' || userRole === 'admin') {
      targetingConditions.push({
        [`targetAudience.specificUsers.${userRole}`]: userId
      });
    }

    noticeQuery.$and.push({ $or: targetingConditions });

    const unreadNotices = await Notice.countDocuments(noticeQuery);

    const totalUnread = unreadMessages + unreadNotices;

    res.json({
      total: totalUnread,
      messages: unreadMessages,
      notices: unreadNotices
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Get recent unread notifications
router.get('/recent', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const userDept = req.user.dept;
    const userYear = req.user.year;
    const userSection = req.user.section;
    const userSpecialRole = req.user.specialRole;
    const limit = parseInt(req.query.limit) || 10;

    // Get unread messages
    console.log('🔍 Looking for messages for user ID:', req.user.id);
    const unreadMessages = await Message.find({
      'recipient.id': req.user.id,
      isRead: false
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('sender subject message priority createdAt');
    
    console.log('📬 Found unread messages:', unreadMessages.length);
    if (unreadMessages.length > 0) {
      console.log('📋 Sample message:', unreadMessages[0]);
    }

    // Get unread notices
    const noticeQuery = {
      isActive: true,
      $or: [
        { scheduledDate: { $exists: false } },
        { scheduledDate: { $lte: new Date() } }
      ],
      $and: [
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: { $gte: new Date() } }
          ]
        }
      ],
      // Not hidden by user
      'hiddenFrom.user': { $ne: userId },
      // Not viewed by user
      'views.user': { $ne: userId }
    };

    // Add targeting filters (same as count endpoint)
    const targetingConditions = [];

    targetingConditions.push({
      'targetAudience.roles': { $in: [userRole] }
    });

    if (userDept) {
      targetingConditions.push({
        'targetAudience.departments': { $in: [userDept] }
      });
    }

    if (userRole === 'student') {
      const studentConditions = [];
      
      studentConditions.push({
        'targetAudience.studentFilters': {
          $elemMatch: {
            dept: userDept,
            year: userYear,
            section: userSection,
            filterType: 'all'
          }
        }
      });

      if (userSpecialRole && userSpecialRole !== 'none') {
        studentConditions.push({
          'targetAudience.studentFilters': {
            $elemMatch: {
              dept: userDept,
              year: userYear,
              section: userSection,
              filterType: { $in: [userSpecialRole, 'both'] }
            }
          }
        });
      }

      studentConditions.push({
        'targetAudience.studentFilters': {
          $elemMatch: {
            dept: userDept,
            year: userYear,
            section: userSection,
            filterType: 'specific',
            specificIds: { $in: [req.user.id] }
          }
        }
      });

      targetingConditions.push({ $or: studentConditions });
    }

    if (userRole === 'faculty' || userRole === 'admin') {
      targetingConditions.push({
        [`targetAudience.specificUsers.${userRole}`]: userId
      });
    }

    noticeQuery.$and.push({ $or: targetingConditions });

    const unreadNotices = await Notice.find(noticeQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title content category priority author createdAt');

    // Combine and sort by creation date
    const allNotifications = [
      ...unreadMessages.map(msg => ({
        type: 'message',
        id: msg._id,
        title: msg.subject,
        content: msg.message,
        sender: msg.sender,
        priority: msg.priority,
        createdAt: msg.createdAt
      })),
      ...unreadNotices.map(notice => ({
        type: 'notice',
        id: notice._id,
        title: notice.title,
        content: notice.content,
        category: notice.category,
        author: notice.author,
        priority: notice.priority,
        createdAt: notice.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const finalNotifications = allNotifications.slice(0, limit);
    console.log('📤 Sending notifications:', finalNotifications.length);
    console.log('📋 Message types:', finalNotifications.map(n => n.type));
    res.json(finalNotifications);
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notifications as read
router.post('/mark-read', auth, async (req, res) => {
  try {
    const { type, id } = req.body;
    const userId = req.user._id;

    if (type === 'message') {
      await Message.findByIdAndUpdate(id, {
        isRead: true,
        readAt: new Date()
      });
    } else if (type === 'notice') {
      await Notice.findByIdAndUpdate(id, {
        $addToSet: {
          views: {
            user: userId,
            role: req.user.role,
            viewedAt: new Date()
          }
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Mark all unread messages as read
    await Message.updateMany(
      {
        'recipient.id': req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Get all unread notices and mark them as viewed
    const userDept = req.user.dept;
    const userYear = req.user.year;
    const userSection = req.user.section;
    const userSpecialRole = req.user.specialRole;

    const noticeQuery = {
      isActive: true,
      $or: [
        { scheduledDate: { $exists: false } },
        { scheduledDate: { $lte: new Date() } }
      ],
      $and: [
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: { $gte: new Date() } }
          ]
        }
      ],
      'hiddenFrom.user': { $ne: userId },
      'views.user': { $ne: userId }
    };

    // Add targeting filters
    const targetingConditions = [];
    targetingConditions.push({ 'targetAudience.roles': { $in: [userRole] } });

    if (userDept) {
      targetingConditions.push({ 'targetAudience.departments': { $in: [userDept] } });
    }

    if (userRole === 'student') {
      const studentConditions = [];
      
      studentConditions.push({
        'targetAudience.studentFilters': {
          $elemMatch: {
            dept: userDept,
            year: userYear,
            section: userSection,
            filterType: 'all'
          }
        }
      });

      if (userSpecialRole && userSpecialRole !== 'none') {
        studentConditions.push({
          'targetAudience.studentFilters': {
            $elemMatch: {
              dept: userDept,
              year: userYear,
              section: userSection,
              filterType: { $in: [userSpecialRole, 'both'] }
            }
          }
        });
      }

      studentConditions.push({
        'targetAudience.studentFilters': {
          $elemMatch: {
            dept: userDept,
            year: userYear,
            section: userSection,
            filterType: 'specific',
            specificIds: { $in: [req.user.id] }
          }
        }
      });

      targetingConditions.push({ $or: studentConditions });
    }

    if (userRole === 'faculty' || userRole === 'admin') {
      targetingConditions.push({
        [`targetAudience.specificUsers.${userRole}`]: userId
      });
    }

    noticeQuery.$and.push({ $or: targetingConditions });

    await Notice.updateMany(
      noticeQuery,
      {
        $addToSet: {
          views: {
            user: userId,
            role: userRole,
            viewedAt: new Date()
          }
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

module.exports = router;