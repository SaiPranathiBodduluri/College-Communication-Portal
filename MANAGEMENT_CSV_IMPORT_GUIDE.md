# 🔐 Secure CSV Import Guide for Management

## ⚠️ IMPORTANT SECURITY NOTICE
**NEVER import CSV files directly through MongoDB Compass!** This stores passwords as plain text, creating a security vulnerability.

## ✅ Approved Methods for CSV Import

### Method 1: Web Interface (Recommended) ✅ FIXED
1. **Login as Admin** to the college portal
2. **Navigate to Data Management** (`/data-management`)
3. **Upload CSV files** using the provided interface
4. **Passwords are automatically hashed** ✅ (Fixed: Now properly hashes passwords during upload)

### Method 2: Secure Command Line Import
```bash
# Navigate to server directory
cd server

# Import students (recommended)
node scripts/secure-csv-import.js path/to/students.csv students

# Import faculty
node scripts/secure-csv-import.js path/to/faculty.csv faculty

# Import admins
node scripts/secure-csv-import.js path/to/admins.csv admins

# Clear existing data and import (use with caution)
node scripts/secure-csv-import.js students.csv students --clear
```

## 📋 CSV File Format Requirements

### Students CSV:
```csv
name,id,password,email,phoneNumber,dept,year,section,specialRole
John Doe,231FA04001,231FA04001,john@college.edu,9876543210,CSE,1,A,CR
```

### Faculty CSV:
```csv
name,id,password,email,phoneNumber,dept
Dr. Smith,FAC001,Faculty@123,smith@college.edu,9876543210,CSE
```

### Admins CSV:
```csv
name,id,password,email,phoneNumber,dept
Admin User,ADM001,Admin@123,admin@college.edu,9876543210,CSE
```

## 🔐 Security Features

### ✅ What the Secure Import Does:
- **Hashes all passwords** using bcrypt (industry standard)
- **Validates data format** before import
- **Prevents duplicate entries**
- **Maintains data integrity**
- **Provides import summary**

### ❌ What Direct MongoDB Import Does:
- **Stores plain text passwords** (SECURITY RISK)
- **No data validation**
- **Users cannot login** (password mismatch)
- **Violates security best practices**

## 🚨 If You Have Plain Text Passwords

### Quick Fix (Run this if you have existing plain text passwords):
```bash
cd server
node scripts/hash-passwords.js
```

This will hash all plain text passwords in the database.

### ✅ Issue Fixed
The web interface CSV upload now properly hashes passwords during import. Previous uploads may have stored plain text passwords, but this has been resolved.

## 📞 Support

If you need help with CSV imports:
1. **Use the web interface** (safest option)
2. **Contact IT support** for command line assistance
3. **Never share plain text password files**

## 🎯 Best Practices

1. **Always use the web interface** when possible
2. **Keep CSV files secure** and delete after import
3. **Use strong passwords** in CSV files
4. **Test with small batches** first
5. **Backup database** before large imports

---
**Remember: Security is everyone's responsibility!** 🔐