# Data Management System - User Guide

## Overview
The Data Management system allows college administrators to easily manage students and faculty by department through CSV file uploads.

## Access
- **Who can access:** Admin users only
- **Department restriction:** Admins can ONLY manage their own department's data
  - CSE admin → Can only manage CSE students and faculty
  - ECE admin → Can only manage ECE students and faculty
- **What you CANNOT manage:** Admin accounts (to prevent accidental self-deletion)
- **How to access:** Click "Data Management" button in the navbar (blue button)

---

## Features

### 1. **View Current Data**
- See count of students/faculty for YOUR department
- Department is automatically set based on your admin account
- Real-time count updates

### 2. **Delete All Data by Department**
- Delete all records from YOUR department only
- Confirmation dialog prevents accidental deletion
- Cannot access or affect other departments' data

### 3. **Upload CSV Files**
- Upload new data via CSV files
- Automatic validation
- Duplicate detection (skips existing IDs/emails)
- Sample CSV download available

---

## CSV File Formats

### Students CSV Format
```csv
name,id,password,email,phoneNumber,dept,year,section,specialRole
John Doe,231FA04001,Student@123,john@college.edu,9876543210,CSE,2,A,none
Jane Smith,231FA04002,Student@123,jane@college.edu,9876543211,CSE,2,B,CR
```

**Fields:**
- `name` - Full name of student
- `id` - College ID (unique, will be uppercase)
- `password` - Default password (will be hashed automatically)
- `email` - Email address (unique, will be lowercase)
- `phoneNumber` - Phone number
- `dept` - Department (CSE, ECE, MECH, etc.)
- `year` - Year (1, 2, 3, 4)
- `section` - Section (A, B, C, etc.)
- `specialRole` - CR (Class Rep), LR (Lab Rep), or none

### Faculty CSV Format (with Access Permissions)
```csv
facultyId,name,email,phoneNumber,homeDept,password,accessDept,accessYear,accessSections
FAC001,Dr. Ramesh,ramesh@college.edu,9876543210,CSE,Faculty@123,CSE,2,"A,B"
FAC001,Dr. Ramesh,ramesh@college.edu,9876543210,CSE,Faculty@123,CSE,3,A
FAC001,Dr. Ramesh,ramesh@college.edu,9876543210,CSE,Faculty@123,ECE,2,C
FAC002,Dr. Priya,priya@college.edu,9876543211,CSE,Faculty@123,CSE,1,"A,B,C"
```

**Fields:**
- `facultyId` - Faculty ID (unique, will be uppercase)
- `name` - Full name of faculty
- `email` - Email address (unique, will be lowercase)
- `phoneNumber` - Phone number
- `homeDept` - Home department (CSE, ECE, MECH, etc.)
- `password` - Default password (will be hashed automatically)
- `accessDept` - Department they can access
- `accessYear` - Year they can access (1, 2, 3, 4)
- `accessSections` - Sections they can access (comma-separated: "A,B,C")

**Important Notes:**
- **Same facultyId can appear multiple times** - One row per class assignment
- System automatically groups rows by facultyId and builds the access array
- For multiple sections in same dept/year, use comma-separated: "A,B,C"
- Faculty can have access to multiple departments (ECE faculty teaching CSE classes)

**Example:** Dr. Ramesh (CSE faculty) teaches:
- CSE Year 2 Sections A, B
- CSE Year 3 Section A  
- ECE Year 2 Section C (cross-department teaching)

This requires 3 rows in CSV with same facultyId.

### Admin CSV Format (with Access Permissions)

**Note:** Admins can also teach classes, so they have the same access structure as faculty.

```csv
adminId,name,email,phoneNumber,homeDept,password,accessDept,accessYear,accessSections
ADM001,Admin Kumar,admin1@college.edu,9876543210,CSE,Admin@123,CSE,2,"A,B"
ADM001,Admin Kumar,admin1@college.edu,9876543210,CSE,Admin@123,CSE,3,A
ADM001,Admin Kumar,admin1@college.edu,9876543210,CSE,Admin@123,ECE,2,C
ADM002,Admin Priya,admin2@college.edu,9876543211,CSE,Admin@123,CSE,1,"A,B,C"
```

**Fields:** Same as faculty CSV format
- `adminId` - Admin ID (unique, will be uppercase)
- `name` - Full name of admin
- `email` - Email address (unique, will be lowercase)
- `phoneNumber` - Phone number
- `homeDept` - Home department (CSE, ECE, MECH, etc.)
- `password` - Default password (will be hashed automatically)
- `accessDept` - Department they can access
- `accessYear` - Year they can access (1, 2, 3, 4)
- `accessSections` - Sections they can access (comma-separated: "A,B,C")

**Important:** Same adminId can appear multiple times (one row per class assignment).

---

## Workflow: Updating Department Data

### Scenario: CSE Department Section Changes

**Step 1: Prepare CSV File**
- Department sends updated student list with new sections
- Save as `cse_students_2025.csv`
- Ensure all fields are filled correctly

**Step 2: Login as Admin**
- Go to college portal
- Login with admin credentials

**Step 3: Navigate to Data Management**
- Click "Data Management" button in navbar (purple button)

**Step 4: View Your Department**
- Select "Students" tab
- Your department (CSE) is automatically displayed
- View current student count

**Step 5: Delete Old Data**
- Click "Delete All" button
- Confirm deletion in popup dialog
- Wait for success message

**Step 6: Upload New Data**
- Click "Choose CSV File"
- Select your `cse_students_2025.csv` file
- Click "Upload & Add"
- Wait for success message

**Step 7: Verify**
- Check the new student count
- Students can now login with updated information

---

## Important Notes

### Security
- ✅ Only admins can access this feature
- ✅ **Department-based access control** - Admins can ONLY manage their own department
- ✅ Passwords are automatically hashed
- ✅ Confirmation required before deletion
- ✅ Backend validation prevents cross-department access

### Data Validation
- ✅ CSV format is validated
- ✅ Department mismatch is detected
- ✅ Duplicate IDs/emails are skipped
- ✅ Required fields are checked

### Best Practices
1. **Always download sample CSV** before creating your own
2. **Backup data** before deletion (export from MongoDB if needed)
3. **Test with small file** first (2-3 records)
4. **Verify department** before uploading
5. **Check count** after upload to confirm

### Common Issues

**Issue: "Some students already exist"**
- Solution: Some IDs or emails are duplicates. The system will insert non-duplicates and skip duplicates.

**Issue: "Department mismatch"**
- Solution: CSV contains records from different department. Ensure all records have the same department as your admin account.

**Issue: "Access denied. You can only manage [DEPT] department data"**
- Solution: You're trying to access another department's data. You can only manage your own department.

**Issue: "No valid students found"**
- Solution: CSV format is incorrect. Download sample CSV and match the format exactly.

**Issue: "Error parsing CSV"**
- Solution: File is not a valid CSV. Save as CSV (not Excel) and ensure proper encoding (UTF-8).

---

## Sample Files

Sample CSV files are available in `server/sample_csvs/`:
- `sample_students.csv`
- `sample_faculty.csv`
- `sample_admins.csv`

You can also download samples directly from the UI using the "Download Sample" button.

---

## Technical Details

### API Endpoints

**Get Count:**
```
GET /api/data-management/{students|faculty|admins}/count/:dept
```

**Delete All:**
```
DELETE /api/data-management/{students|faculty|admins}/:dept
```

**Upload CSV:**
```
POST /api/data-management/{students|faculty|admins}/upload
Content-Type: multipart/form-data
Body: file (CSV), department (string)
```

### Database Structure

All data is stored in a **single collection per entity type**:
- `students` collection - All students from all departments
- `faculty` collection - All faculty from all departments
- `admins` collection - All admins from all departments

Each record has a `dept` field to identify the department. This design:
- ✅ Simplifies queries and maintenance
- ✅ Allows easy cross-department operations
- ✅ Supports efficient indexing
- ✅ Enables department-specific operations via filtering

---

## Support

For issues or questions, contact the system administrator.
