# Manoli.xlsx Upload Format Guide

## Overview

The system now supports the Manoli.xlsx format with full Marathi language support, extended voter data fields, and automatic family linking capabilities.

## Supported File Format

### Expected Columns (24 total)

| Column Name (Marathi) | Column Name (English) | Description | Required |
|--|--|--|--|
| बुथ नं | booth_number | Booth number | ✅ |
| कुटुंबप्रमुख | family_head_name | Name of family head | For family linking |
| अनुक्रमांक | serial_number | Serial number | ✅ |
| मतदाराचे नाव | voter_name_marathi | Full name in Marathi | ✅ |
| voter_id | voter_id | Unique voter ID | ✅ Required |
| नाते | relationship | Relationship (बायको/नवरा/मुलगा/etc) | For family linking |
| मोबाईल नंबर | mobile | Primary mobile number | ✅ |
| जन्मतारीख | dob | Date of birth (Excel date serial) | ✅ |
| जात | caste | Caste/Category | Optional |
| मयत/दुबार/बेपत्ता | status | Status (Active/मयत/दुबार/बेपत्ता) | Optional |
| कार्यकर्ता | worker_name | Worker/Karyakarta name | Optional |
| मोबाइल नं | worker_mobile | Worker mobile number | Optional |
|  कार्यकर्ता Epic No. | worker_epic | Worker EPIC number | Optional |
| कर्मचारी नाव | employee_name | Employee name | Optional |
| कर्मचारी आय डी | employee_id | Employee ID | Optional |
| गाव | village | Village name | Optional |
| नवीन गण | new_gan | New group (गण) | Optional |
| नवीन गट | new_gat | New group (गट) | Optional |
| surname | surname | Surname (English) | Optional |
| age | age | Age | Optional |
| gender | gender | Gender (M/F) | Optional |
| name_english | name_english | Full name in English | Optional |
| address_marathi | address_marathi | Address in Marathi | Optional |
| zAC_AC2024 | assembly_constituency | Assembly constituency code | Optional |
| kutumb_pramukh | is_head | 1 = family head, 0 = member | For family linking |

## Features

### 1. Automatic Family Linking

The system automatically creates family relationships based on:

- **कुटुंबप्रमुख** (family head name): Identifies which family a voter belongs to
- **kutumb_pramukh** flag: 
  - `1` = This voter is a family head
  - `0` = This voter is a family member
- **नाते** (relationship): Specifies the relationship type

#### Relationship Mapping

| Marathi | English |
|---------|---------|
| बायको | spouse |
| नवरा | spouse |
| मुलगा | son |
| मुलगी | daughter |
| आई | mother |
| बाप | father |
| भाऊ | sibling |
| बहीण | sibling |
| स्वतः | self |

### 2. Worker & Employee Tracking

- **Workers (कार्यकर्ते)**: Associates voters with karyakartas/workers
- **Employees (कर्मचारी)**: Links voters to assigned employees
- Auto-creates worker/employee records on first occurrence

### 3. Village Hierarchy

- Stores village (गाव) with hierarchical groups (नवीन गण, नवीन गट)
- Enables filtering and reporting by village/group

### 4. Status Tracking

Supports voter status values:
- **Active**: Currently active voter
- **मयत**: Deceased
- **दुबार**: Duplicate entry
- **बेपत्ता**: Missing/Not found

### 5. Date Handling

- Accepts Excel serial date format (e.g., 25443 for a date)
- Automatically converts to ISO date format (YYYY-MM-DD)

## Upload Process

### Step 1: Prepare File
Ensure your Excel file follows the Manoli.xlsx format with the required columns.

### Step 2: Upload via UI
1. Login as Admin
2. Navigate to "Upload Voters" (मतदार यादी अपलोड करा)
3. Select your `.xlsx` file
4. Click "Upload" (अपलोड करा)

### Step 3: Verify Results

The system will display:
- Total voters imported
- Number of families auto-linked
- Any errors encountered

Example:
```
✅ अपलोड यशस्वी! / Upload successful!
2671 मतदार आयात केले / 2671 voters imported
458 कुटुंबे तयार केली / 458 families auto-linked
```

## Search & Filtering

### Marathi Search Support

The search function supports both Marathi and English:
- Search by Marathi name (मतदाराचे नाव)
- Search by English name
- Search by mobile number
- Search by voter ID

### Filters Available

1. **Booth Number** (बुथ नंबर): Filter by booth
2. **Status** (स्थिती): Active/मयत/दुबार/बेपत्ता
3. **Village** (गाव): Filter by village name

## Data Display

### Voter Profile

Each voter profile shows:

#### Basic Information
- Marathi name (primary)
- English name (secondary)
- Voter ID
- Booth number
- Age, Gender

#### Contact Information
- Primary mobile
- Secondary mobile (if provided)
- Email
- Address (Marathi)

#### Administrative Data
- Assembly constituency
- Serial number
- Caste
- Status badge

#### Assignment Information
- Worker name & mobile
- Employee name & ID
- Village with groups (गण/गट)

#### Family Information
- Family head
- Family members with relationships (Marathi)
- Relationship badges

## Technical Details

### Database Tables

**Extended `master_voters`:**
- `booth_number`, `serial_number`
- `name_marathi`, `name_english`
- `surname_marathi`
- `caste`, `age`, `gender`
- `assembly_constituency`

**Extended `voter_profiles`:**
- `mobile_secondary`
- `address_marathi`, `address_english`
- `village`, `status`
- `worker_id`, `employee_id`, `village_id`

**New Tables:**
- `workers`: Worker information
- `employees`: Employee information  
- `villages`: Village hierarchy

**Updated `family_members`:**
- `relationship_marathi`: Marathi relationship text

### API Endpoints

- **POST `/api/upload`**: Upload Manoli.xlsx format
- **GET `/api/search?q=<query>&booth=<num>&status=<status>&village=<name>`**: Marathi-enabled search
- **GET `/api/voter?id=<uuid>`**: Get voter with extended fields

## Error Handling

### Common Issues

**Problem**: "Upload failed"
- **Solution**: Ensure voter_id column has unique values

**Problem**: Family not auto-linked
- **Solution**: Verify कुटुंबप्रमुख matches exactly with a voter's name

**Problem**: Marathi text shows as ���
- **Solution**: Ensure Excel file is saved with UTF-8 encoding

**Problem**: Wrong family head linked
- **Solution**: Check for duplicate names in कुटुंबप्रमुख column

## Best Practices

1. **Data Validation**: Validate voter_id uniqueness before upload
2. **Family Naming**: Ensure कुटुंबप्रमुख names match exactly (including spacing)
3. **Date Format**: Use Excel's date format for जन्मतारीख column
4. **Status Values**: Use exact status values (Active/मयत/दुबार/बेपत्ता)
5. **Batch Size**: For files >5000 rows, consider splitting into smaller batches

## Sample Upload Result

```json
{
  "imported": 2671,
  "families_created": 458,
  "import_id": "uuid..."
}
```

## Troubleshooting

### Slow Upload
- Files >2000 rows may take 2-3 minutes
- Progress is not shown in real-time
- Do not refresh the page during upload

### Missing Fields
- Non-required fields can be blank
- System will skip rows without voter_id

### Duplicate voter_id
- Existing voter_id will be updated (upsert)
- Old family links are preserved unless new data overrides

## Support

For issues or questions about the Manoli.xlsx format:
1. Check this documentation
2. Verify sample file structure matches your file
3. Review console logs in browser DevTools
4. Contact system administrator

---

**Format Version**: 1.0  
**Last Updated**: February 15, 2026  
**Supported Languages**: Marathi (मराठी), English
