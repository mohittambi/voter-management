# 🎉 Manoli.xlsx Upload - Ready to Use!

## ✅ Implementation Complete

Your voter management system now fully supports the Manoli.xlsx format with:
- **Full Marathi support** (मराठी नावे, पत्ते, संबंध)
- **Auto family linking** (कुटुंब स्वयंचलित जोडले जातात)
- **Extended voter data** (बुथ, जात, वय, कार्यकर्ता, etc.)
- **Bilingual search** (मराठी आणि English)

---

## 🚀 How to Upload Manoli.xlsx

### Step 1: Make Sure Dev Server is Running
```bash
cd web
npm run dev
```
Server should be at: http://localhost:3000

### Step 2: Login as Admin
- URL: http://localhost:3000/login
- Email: `admin@example.com`
- Password: `Admin123!`

### Step 3: Upload File
1. Click **"Upload Voters"** in sidebar
2. Select your `Manoli.xlsx` file from Downloads folder
3. Click **"अपलोड करा / Upload"**
4. **Wait 2-3 minutes** (don't refresh!)
5. Success message will show:
   - Total voters imported
   - Families auto-linked

Example result for your file:
```
✅ अपलोड यशस्वी! / Upload successful!
2671 मतदार आयात केले / 2671 voters imported
458 कुटुंबे तयार केली / 458 families auto-linked
```

---

## 🔍 Test Marathi Search

### Search Examples

Try these searches to test Marathi support:

1. **Search by Marathi name:**
   - "पवार" → Will find all Pawars
   - "गाडेकर" → Will find Gadekars
   - "मनोली" → Will search everywhere including village

2. **Search by booth:**
   - Click "Filter" button
   - Enter booth number: `237`
   - Click "शोधा / Search"

3. **Filter by status:**
   - Click "Filter"
   - Select "मयत" from status dropdown
   - Shows deceased voters

4. **Filter by village:**
   - Click "Filter"
   - Enter "मनोली" in village field
   - Shows all voters from that village

---

## 👤 View Voter Profiles

### What You'll See

After searching, click any voter to see their full profile with:

#### Marathi Name Section
- **Primary**: मतदाराचे नाव (large, bold)
- **Secondary**: English name (smaller, gray)
- Voter ID, Booth number

#### Basic Information
- Date of Birth
- Mobile number
- Email
- Aadhaar

#### अतिरिक्त माहिती / Additional Information
- वय / Age
- लिंग / Gender
- जात / Caste
- स्थिती / Status (with color badge)
- विधानसभा मतदारसंघ / Assembly Constituency
- गाव / Village (with गण/गट)
- पत्ता / Address (in Marathi)
- कार्यकर्ता / Worker info
- कर्मचारी / Employee info

#### कुटुंब / Family Section
- Family head name
- Family members list
- Relationships in Marathi (बायको, मुलगा, etc.)

---

## 📊 What Happens During Upload

### Automatic Processing

1. **Parse 24 columns** from Manoli.xlsx
2. **Extract names** - Splits Marathi names into surname/first/middle
3. **Convert dates** - Excel serial dates → ISO format
4. **Create workers** - Auto-creates कार्यकर्ते records
5. **Create employees** - Auto-creates कर्मचारी records
6. **Create villages** - Auto-creates गाव/गण/गट hierarchy
7. **Import voters** - All 2671 voters with extended data
8. **Link families** - Automatically based on कुटुंबप्रमुख field

### Family Linking Logic

- Finds voters with `kutumb_pramukh = 1` → marks as family heads
- Creates `families` record for each head
- Links other voters to family by matching कुटुंबप्रमुख name
- Stores relationship (नाते) in both Marathi and English
- Creates `family_members` records

Example:
```
पवार इंदुबाई रामनाथ (Family Head)
  └─ पवार जन्याबापू बाळासाहेब (बायको / spouse)
  └─ पवार सुमन जन्याबापू (बायको / spouse)
```

---

## 🎨 UI Highlights

### Search Page
- Bilingual placeholders
- Filter panel for booth/status/village
- Results show Marathi name first (larger)
- English name secondary (smaller)
- Booth badges, status badges with colors
- Village tags

### Upload Page
- Shows format support info
- Displays family count in success
- Bilingual messages

### Voter Profile
- Marathi name prominently displayed
- All labels in both languages
- Color-coded status badges
- Worker/employee assignments visible
- Family tree with Marathi relationships

---

## 🐛 Troubleshooting

### Upload Taking Too Long
- **Normal**: 2-3 minutes for 2671 records
- **Don't refresh** the page
- Check browser console (F12) for progress

### Search Returns Nothing
- Make sure you've uploaded data first
- Try searching with shorter text (e.g., "पवार" not full name)
- Use filters to narrow down results

### Marathi Text Shows as ���
- File should be in Excel format (.xlsx)
- Ensure UTF-8 encoding
- Re-download Manoli.xlsx if corrupted

### Family Not Auto-Linked
- Check कुटुंबप्रमुख names match exactly
- Names are case-sensitive
- Spaces matter (extra spaces will cause mismatch)

---

## 📁 File Locations

### Code Changes
- `web/pages/api/upload.ts` - Upload handler with family linking
- `web/pages/api/search.ts` - Marathi search support
- `web/pages/search.tsx` - Search UI with filters
- `web/pages/voter/[id].tsx` - Profile with extended fields
- `supabase/migrations/20260215120400_expand_voter_schema.sql` - Database changes

### Documentation
- `docs/MANOLI_UPLOAD_FORMAT.md` - Complete format guide
- `docs/MANOLI_IMPLEMENTATION_SUMMARY.md` - Technical details
- `docs/MANOLI_QUICKSTART.md` - This file

---

## ✅ Quick Verification Checklist

After upload, verify:
- [ ] Success message shows voter count (2671)
- [ ] Success message shows family count (~458)
- [ ] Search for "पवार" returns results
- [ ] Search for "237" (booth) returns results
- [ ] Open any voter profile shows Marathi name
- [ ] "अतिरिक्त माहिती" section appears
- [ ] Booth number visible in profile
- [ ] Family section shows relationships
- [ ] Worker info shows (if assigned)
- [ ] Status badge shows correctly

---

## 🎯 Next Steps

1. **Upload Manoli.xlsx** (the file you provided)
2. **Verify import** (check counts match)
3. **Test search** (try Marathi names)
4. **Explore profiles** (see extended data)
5. **Check families** (verify auto-linking worked)

---

## 📞 Need Help?

- Check `docs/MANOLI_UPLOAD_FORMAT.md` for format details
- Review browser console (F12) for errors
- Check terminal logs for backend errors
- Verify database with: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres`

---

**Status**: ✅ **Ready for Upload!**

**Your Manoli.xlsx file from `/Users/mohittambi/Downloads/Manoli.xlsx` is ready to upload.**

Navigate to http://localhost:3000/upload and select the file! 🚀
