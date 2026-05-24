const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

// Register Student
router.post('/student', async (req, res) => {
  try {
    const { name, id, password, email, phoneNumber, dept, year, section, specialRole } = req.body;

    // Validate required fields
    if (!name || !id || !password || !email || !phoneNumber || !dept || !year || !section) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [{ id: id.toUpperCase() }, { email: email.toLowerCase() }] 
    });
    
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this ID or email already exists' });
    }

    // Create new student
    const student = new Student({
      name,
      id: id.toUpperCase(),
      password,
      email: email.toLowerCase(),
      phoneNumber,
      dept,
      year,
      section,
      specialRole: specialRole || 'none'
    });

    await student.save();

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        _id: student._id,
        name: student.name,
        id: student.id,
        email: student.email,
        phoneNumber: student.phoneNumber,
        dept: student.dept,
        year: student.year,
        section: student.section,
        specialRole: student.specialRole
      }
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Register Faculty
router.post('/faculty', async (req, res) => {
  try {
    const { name, id, password, email, phoneNumber, dept, access } = req.body;

    // Validate required fields
    if (!name || !id || !password || !email || !phoneNumber || !dept || !access) {
      return res.status(400).json({ message: 'All fields are required (name, id, password, email, phoneNumber, dept, access)' });
    }

    // Check if faculty already exists
    const existingFaculty = await Faculty.findOne({ 
      $or: [{ id: id.toUpperCase() }, { email: email.toLowerCase() }] 
    });
    
    if (existingFaculty) {
      return res.status(400).json({ message: 'Faculty with this ID or email already exists' });
    }

    // Create new faculty
    const faculty = new Faculty({
      name,
      id: id.toUpperCase(),
      password,
      email: email.toLowerCase(),
      phoneNumber,
      dept: dept.toUpperCase(),
      access
    });

    await faculty.save();

    res.status(201).json({
      message: 'Faculty registered successfully',
      faculty: {
        _id: faculty._id,
        name: faculty.name,
        id: faculty.id,
        email: faculty.email,
        phoneNumber: faculty.phoneNumber,
        dept: faculty.dept,
        access: faculty.access
      }
    });
  } catch (error) {
    console.error('Faculty registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Register Admin
router.post('/admin', async (req, res) => {
  try {
    const { name, id, password, email, phoneNumber, dept } = req.body;

    // Validate required fields
    if (!name || !id || !password || !email || !phoneNumber || !dept) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [{ id: id.toUpperCase() }, { email: email.toLowerCase() }] 
    });
    
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this ID or email already exists' });
    }

    // Create new admin
    const admin = new Admin({
      name,
      id: id.toUpperCase(),
      password,
      email: email.toLowerCase(),
      phoneNumber,
      dept
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        id: admin.id,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        dept: admin.dept
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

module.exports = router;
