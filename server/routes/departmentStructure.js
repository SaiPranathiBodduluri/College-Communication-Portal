const express = require('express');
const router = express.Router();
const DepartmentStructure = require('../models/DepartmentStructure');
const { auth, authorize } = require('../middleware/auth');

// Get all department structures (for admins)
router.get('/', auth, async (req, res) => {
  try {
    const structures = await DepartmentStructure.find({ isActive: true });
    res.json(structures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get years for a specific department
router.get('/:dept/years', auth, async (req, res) => {
  try {
    const structure = await DepartmentStructure.findOne({ 
      dept: req.params.dept.toUpperCase(),
      isActive: true 
    });
    
    if (!structure) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    res.json(structure.years.map(y => y.year));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sections for a specific department and year
router.get('/:dept/years/:year/sections', auth, async (req, res) => {
  try {
    const structure = await DepartmentStructure.findOne({ 
      dept: req.params.dept.toUpperCase(),
      isActive: true 
    });
    
    if (!structure) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const yearData = structure.years.find(y => y.year === req.params.year);
    
    if (!yearData) {
      return res.status(404).json({ message: 'Year not found' });
    }
    
    res.json(yearData.sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create department structure (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { dept, years } = req.body;
    
    const structure = new DepartmentStructure({
      dept: dept.toUpperCase(),
      years
    });
    
    await structure.save();
    res.status(201).json(structure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update department structure (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { years } = req.body;
    
    const structure = await DepartmentStructure.findByIdAndUpdate(
      req.params.id,
      { years },
      { new: true }
    );
    
    if (!structure) {
      return res.status(404).json({ message: 'Department structure not found' });
    }
    
    res.json(structure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
