# Database Migrations

## How to Run Migrations

### Add Access Field to Existing Admins

This migration adds the `access` field to all existing admin records.

**Run the migration:**
```bash
cd server
node migrations/add-admin-access.js
```

**What it does:**
- Finds all admins without the `access` field
- Adds default access to their home department (all years, all sections)
- Saves the updated records

**Options:**

1. **Empty Access** (admins can manage but not teach):
   - Uncomment the "Option 1" section in the script
   - Comment out the "Option 2" section

2. **Default Access** (admins can teach all classes in their dept):
   - Keep "Option 2" uncommented (default)
   - Admins get access to all years (1-4) and sections (A, B, C) in their home department

**After running:**
- Existing admins will have the `access` field
- They can login and use the system normally
- You can update their access later via CSV upload or MongoDB Compass

## Future Migrations

Add new migration scripts here as needed.
