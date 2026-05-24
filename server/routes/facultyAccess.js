const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const { auth, authorize } = require('../middleware/auth');

// Get faculty's accessible departments
router.get('/access', auth, authorize('faculty'), async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user._id);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Extract unique departments from access array
    const accessibleDepartments = faculty.access.map(a => a.dept);
    
    res.json({
      homeDepartment: faculty.dept,
      departments: accessibleDepartments,
      access: faculty.access
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get years for faculty's specific department
router.get('/access/:dept/years', auth, authorize('faculty'), async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user._id);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    const dept = req.params.dept.toUpperCase();
    
    // Find the department in faculty's access
    const deptAccess = faculty.access.find(a => a.dept === dept);
    
    if (!deptAccess) {
      return res.status(403).json({ message: 'Access denied to this department' });
    }
    
    // Return years for this department
    const years = deptAccess.years.map(y => y.year);
    res.json(years);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sections for faculty's specific department and year
router.get('/access/:dept/years/:year/sections', auth, authorize('faculty'), async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user._id);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    const dept = req.params.dept.toUpperCase();
    const year = req.params.year;
    
    // Find the department in faculty's access
    const deptAccess = faculty.access.find(a => a.dept === dept);
    
    if (!deptAccess) {
      return res.status(403).json({ message: 'Access denied to this department' });
    }
    
    // Find the year in this department
    const yearAccess = deptAccess.years.find(y => y.year === year);
    
    if (!yearAccess) {
      return res.status(403).json({ message: 'Access denied to this year' });
    }
    
    // Return sections for this year
    res.json(yearAccess.sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
