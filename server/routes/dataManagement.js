const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const { Readable } = require('stream');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const { auth } = require('../middleware/auth');

// Configure multer for file upload (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Middleware to check if admin can access the department
const checkDepartmentAccess = (req, res, next) => {
  const requestedDept = req.params.dept || req.body.department;
  const adminDept = req.user.dept;
  
  if (requestedDept.toUpperCase() !== adminDept.toUpperCase()) {
    return res.status(403).json({ 
      error: `Access denied. You can only manage ${adminDept} department data.` 
    });
  }
  next();
};

// ==================== STUDENT ROUTES ====================

// Get student count by department
router.get('/students/count/:dept', auth, isAdmin, checkDepartmentAccess, async (req, res) => {
  try {
    const { dept } = req.params;
    console.log('Counting students for department:', dept.toUpperCase());
    const count = await Student.countDocuments({ dept: dept.toUpperCase() });
    console.log('Found students:', count);
    res.json({ count, department: dept.toUpperCase() });
  } catch (error) {
    console.error('Error counting students:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete all students from a department
router.delete('/students/:dept', auth, isAdmin, checkDepartmentAccess, async (req, res) => {
  try {
    const { dept } = req.params;
    const result = await Student.deleteMany({ dept: dept.toUpperCase() });
    res.json({ 
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} students from ${dept.toUpperCase()} department`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload students CSV
router.post('/students/upload', auth, isAdmin, upload.single('file'), checkDepartmentAccess, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { department } = req.body;
    const students = [];
    const errors = [];

    // Parse CSV
    const stream = Readable.from(req.file.buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        // Validate department matches
        if (row.dept && row.dept.toUpperCase() !== department.toUpperCase()) {
          errors.push(`Row with ID ${row.id}: Department mismatch (${row.dept} != ${department})`);
          return;
        }

        students.push({
          name: row.name,
          id: row.id,
          password: row.password, // Will be hashed before insertion
          email: row.email,
          phoneNumber: row.phoneNumber,
          dept: department.toUpperCase(),
          year: row.year,
          section: row.section,
          specialRole: row.specialRole || 'none'
        });
      })
      .on('end', async () => {
        try {
          if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation errors', details: errors });
          }

          if (students.length === 0) {
            return res.status(400).json({ error: 'No valid students found in CSV' });
          }

          // Hash passwords before insertion (insertMany bypasses pre-save middleware)
          console.log('🔐 Hashing passwords for', students.length, 'students...');
          for (let student of students) {
            student.password = await bcrypt.hash(student.password, 12);
          }
          console.log('✅ All passwords hashed successfully');

          // Insert students
          const result = await Student.insertMany(students, { ordered: false });
          
          res.json({
            success: true,
            insertedCount: result.length,
            message: `Successfully uploaded ${result.length} students to ${department.toUpperCase()}`
          });
        } catch (error) {
          // Handle duplicate key errors
          if (error.code === 11000) {
            const insertedCount = error.insertedDocs ? error.insertedDocs.length : 0;
            res.status(400).json({ 
              error: 'Some students already exist (duplicate ID or email)',
              insertedCount,
              message: `Inserted ${insertedCount} students, some duplicates were skipped`
            });
          } else {
            res.status(500).json({ error: error.message });
          }
        }
      })
      .on('error', (error) => {
        res.status(500).json({ error: 'Error parsing CSV: ' + error.message });
      });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FACULTY ROUTES ====================

// Get faculty count by department
router.get('/faculty/count/:dept', auth, isAdmin, checkDepartmentAccess, async (req, res) => {
  try {
    const { dept } = req.params;
    console.log('Counting faculty for department:', dept.toUpperCase());
    const count = await Faculty.countDocuments({ dept: dept.toUpperCase() });
    console.log('Found faculty:', count);
    res.json({ count, department: dept.toUpperCase() });
  } catch (error) {
    console.error('Error counting faculty:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete all faculty from a department
router.delete('/faculty/:dept', auth, isAdmin, checkDepartmentAccess, async (req, res) => {
  try {
    const { dept } = req.params;
    const result = await Faculty.deleteMany({ dept: dept.toUpperCase() });
    res.json({ 
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} faculty from ${dept.toUpperCase()} department`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload faculty CSV with access permissions
router.post('/faculty/upload', auth, isAdmin, upload.single('file'), checkDepartmentAccess, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { department } = req.body;
    const facultyRows = [];
    const errors = [];

    const stream = Readable.from(req.file.buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        // Validate home department matches admin's department
        if (row.homeDept && row.homeDept.toUpperCase() !== department.toUpperCase()) {
          errors.push(`Row with ID ${row.facultyId}: Home department mismatch (${row.homeDept} != ${department})`);
          return;
        }

        facultyRows.push({
          facultyId: row.facultyId,
          name: row.name,
          email: row.email,
          phoneNumber: row.phoneNumber,
          homeDept: row.homeDept || department,
          password: row.password,
          accessDept: row.accessDept,
          accessYear: row.accessYear,
          accessSections: row.accessSections
        });
      })
      .on('end', async () => {
        try {
          if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation errors', details: errors });
          }

          if (facultyRows.length === 0) {
            return res.status(400).json({ error: 'No valid faculty found in CSV' });
          }

          // Group rows by facultyId to build access array
          const facultyMap = {};
          
          facultyRows.forEach(row => {
            if (!facultyMap[row.facultyId]) {
              facultyMap[row.facultyId] = {
                id: row.facultyId,
                name: row.name,
                email: row.email,
                phoneNumber: row.phoneNumber,
                dept: row.homeDept.toUpperCase(),
                password: row.password,
                access: []
              };
            }

            // Parse sections (comma-separated)
            const sections = row.accessSections.split(',').map(s => s.trim());

            // Find or create department in access array
            let deptAccess = facultyMap[row.facultyId].access.find(
              a => a.dept === row.accessDept.toUpperCase()
            );

            if (!deptAccess) {
              deptAccess = {
                dept: row.accessDept.toUpperCase(),
                years: []
              };
              facultyMap[row.facultyId].access.push(deptAccess);
            }

            // Find or create year in department
            let yearAccess = deptAccess.years.find(y => y.year === row.accessYear);

            if (!yearAccess) {
              yearAccess = {
                year: row.accessYear,
                sections: []
              };
              deptAccess.years.push(yearAccess);
            }

            // Add sections (avoid duplicates)
            sections.forEach(section => {
              if (!yearAccess.sections.includes(section)) {
                yearAccess.sections.push(section);
              }
            });
          });

          // Convert map to array
          const facultyArray = Object.values(facultyMap);

          console.log('Processed faculty:', JSON.stringify(facultyArray, null, 2));

          // Hash passwords before insertion (insertMany bypasses pre-save middleware)
          console.log('🔐 Hashing passwords for', facultyArray.length, 'faculty...');
          for (let faculty of facultyArray) {
            faculty.password = await bcrypt.hash(faculty.password, 12);
          }
          console.log('✅ All faculty passwords hashed successfully');

          // Insert faculty
          const result = await Faculty.insertMany(facultyArray, { ordered: false });
          
          res.json({
            success: true,
            insertedCount: result.length,
            message: `Successfully uploaded ${result.length} faculty to ${department.toUpperCase()}`
          });
        } catch (error) {
          console.error('Error inserting faculty:', error);
          if (error.code === 11000) {
            const insertedCount = error.insertedDocs ? error.insertedDocs.length : 0;
            res.status(400).json({ 
              error: 'Some faculty already exist (duplicate ID or email)',
              insertedCount,
              message: `Inserted ${insertedCount} faculty, some duplicates were skipped`
            });
          } else {
            res.status(500).json({ error: error.message });
          }
        }
      })
      .on('error', (error) => {
        res.status(500).json({ error: 'Error parsing CSV: ' + error.message });
      });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Get admin count by department
router.get('/admins/count/:dept', auth, isAdmin, checkDepartmentAccess, async (req, res) => {
  try {
    const { dept } = req.params;
    const count = await Admin.countDocuments({ dept: dept.toUpperCase() });
    res.json({ count, department: dept.toUpperCase() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all admins from a department
router.delete('/admins/:dept', auth, isAdmin, checkDepartmentAccess, async (req, res) => {
  try {
    const { dept } = req.params;
    const result = await Admin.deleteMany({ dept: dept.toUpperCase() });
    res.json({ 
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} admins from ${dept.toUpperCase()} department`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload admins CSV with access permissions
router.post('/admins/upload', auth, isAdmin, upload.single('file'), checkDepartmentAccess, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { department } = req.body;
    const adminRows = [];
    const errors = [];

    const stream = Readable.from(req.file.buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        // Validate home department matches admin's department
        if (row.homeDept && row.homeDept.toUpperCase() !== department.toUpperCase()) {
          errors.push(`Row with ID ${row.adminId}: Home department mismatch (${row.homeDept} != ${department})`);
          return;
        }

        adminRows.push({
          adminId: row.adminId,
          name: row.name,
          email: row.email,
          phoneNumber: row.phoneNumber,
          homeDept: row.homeDept || department,
          password: row.password,
          accessDept: row.accessDept,
          accessYear: row.accessYear,
          accessSections: row.accessSections
        });
      })
      .on('end', async () => {
        try {
          if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation errors', details: errors });
          }

          if (adminRows.length === 0) {
            return res.status(400).json({ error: 'No valid admins found in CSV' });
          }

          // Group rows by adminId to build access array
          const adminMap = {};
          
          adminRows.forEach(row => {
            if (!adminMap[row.adminId]) {
              adminMap[row.adminId] = {
                id: row.adminId,
                name: row.name,
                email: row.email,
                phoneNumber: row.phoneNumber,
                dept: row.homeDept.toUpperCase(),
                password: row.password,
                access: []
              };
            }

            // Parse sections (comma-separated)
            const sections = row.accessSections.split(',').map(s => s.trim());

            // Find or create department in access array
            let deptAccess = adminMap[row.adminId].access.find(
              a => a.dept === row.accessDept.toUpperCase()
            );

            if (!deptAccess) {
              deptAccess = {
                dept: row.accessDept.toUpperCase(),
                years: []
              };
              adminMap[row.adminId].access.push(deptAccess);
            }

            // Find or create year in department
            let yearAccess = deptAccess.years.find(y => y.year === row.accessYear);

            if (!yearAccess) {
              yearAccess = {
                year: row.accessYear,
                sections: []
              };
              deptAccess.years.push(yearAccess);
            }

            // Add sections (avoid duplicates)
            sections.forEach(section => {
              if (!yearAccess.sections.includes(section)) {
                yearAccess.sections.push(section);
              }
            });
          });

          // Convert map to array
          const adminArray = Object.values(adminMap);

          console.log('Processed admins:', JSON.stringify(adminArray, null, 2));

          // Hash passwords before insertion (insertMany bypasses pre-save middleware)
          console.log('🔐 Hashing passwords for', adminArray.length, 'admins...');
          for (let admin of adminArray) {
            admin.password = await bcrypt.hash(admin.password, 12);
          }
          console.log('✅ All admin passwords hashed successfully');

          // Insert admins
          const result = await Admin.insertMany(adminArray, { ordered: false });
          
          res.json({
            success: true,
            insertedCount: result.length,
            message: `Successfully uploaded ${result.length} admins to ${department.toUpperCase()}`
          });
        } catch (error) {
          console.error('Error inserting admins:', error);
          if (error.code === 11000) {
            const insertedCount = error.insertedDocs ? error.insertedDocs.length : 0;
            res.status(400).json({ 
              error: 'Some admins already exist (duplicate ID or email)',
              insertedCount,
              message: `Inserted ${insertedCount} admins, some duplicates were skipped`
            });
          } else {
            res.status(500).json({ error: error.message });
          }
        }
      })
      .on('error', (error) => {
        res.status(500).json({ error: 'Error parsing CSV: ' + error.message });
      });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
