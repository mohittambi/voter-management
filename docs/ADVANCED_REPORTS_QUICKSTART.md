# Advanced Reports Quick Start Guide

Get started with the new advanced reporting features in 5 minutes!

---

## Setup (One-Time)

### 1. Install Dependencies

```bash
cd web
npm install chart.js react-chartjs-2
```

### 2. Run Database Migration

```bash
cd ..
supabase migration up
```

This creates the `custom_reports` table.

### 3. Restart Development Server

```bash
cd web
npm run dev
```

---

## Feature Walkthroughs

### 📥 CSV Exports

1. Navigate to **Reports & Analytics** page
2. Scroll to "Export Actions" section
3. Click any export button:
   - **Download Booth Report (CSV)**
   - **Download Village Report (CSV)**
   - **Download Status Report (CSV)**
4. File downloads automatically with bilingual headers
5. Open in Excel - Marathi characters display correctly ✓

**Pro Tip:** Apply date filters before exporting for specific time periods!

---

### 📈 Chart Visualizations

1. Navigate to **Reports & Analytics** page
2. Click **"📈 Chart View"** toggle button
3. View interactive charts:
   - **Bar Chart**: Top 15 booths
   - **Pie Chart**: Gender distribution
   - **Line Chart**: Age groups
   - **Horizontal Bar**: Top 10 villages
4. Hover over charts for detailed tooltips
5. Click **"📊 Table View"** to switch back

**Pro Tip:** Charts automatically update when you apply date filters!

---

### 📅 Date Range Filters

1. On **Reports & Analytics** page, locate the date filter card
2. Quick presets available:
   - Last 7 days
   - Last 30 days
   - Last 3 months
   - Last year
3. OR select custom dates:
   - Choose **Start Date**
   - Choose **End Date**
   - Click **"✅ Apply Filter"**
4. All reports and charts update automatically
5. Click **"🔄 Clear Filter"** to reset

**What gets filtered:**
- Summary cards (total counts)
- All analytics sections
- Charts
- CSV exports

---

### 🙋 Worker Performance Metrics

1. Navigate to **Reports & Analytics** page
2. Scroll to **"Worker Performance Metrics"** section
3. Click **"🔽 Show Worker Performance"**
4. Wait for data to load (first time only)
5. View metrics table showing:
   - Voters assigned
   - Active voters
   - Families covered
   - Villages covered
   - Contact completion rate
   - **Performance Score** (0-100)

**Performance Score Color Coding:**
- 🟢 Green (70-100): Excellent performance
- 🟡 Yellow (40-69): Good performance
- 🔴 Red (0-39): Needs improvement

**Search Workers:**
- Type in search box to filter by name
- Search is case-insensitive
- Results update in real-time

---

### 🔧 Custom Report Builder

The most powerful feature! Create your own custom reports.

#### Step 1: Navigate to Builder

1. Click **"Custom Reports"** in sidebar (🔧 icon)
2. You'll see a 4-step wizard

#### Step 2: Select Fields

1. **Master Voter Fields** (left column):
   - Check: Name (Marathi), Name (English)
   - Check: Voter ID, Booth Number
   - Check: Age, Gender, Caste
   
2. **Voter Profile Fields** (right column):
   - Check: Mobile, Email
   - Check: Status, Village
   
3. Click **"Next: Add Filters →"**

#### Step 3: Add Filters (Optional)

1. Click **"➕ Add Filter"**
2. Select **Field**: e.g., "Booth Number"
3. Select **Operator**: e.g., "Equals (=)"
4. Enter **Value**: e.g., "123"
5. Add more filters if needed
6. Click **"Next: Sort & Limit →"**

**Example Filters:**
- Booth Number = 123
- Age > 50
- Gender = M
- Status = Active
- Village like "Manoli"

#### Step 4: Configure Sort & Limit

1. **Sort By**: Select a field (e.g., name_marathi)
2. **Sort Order**: Ascending or Descending
3. **Limit Results**: Enter max rows (default: 100, max: 10,000)
4. Click **"Generate Preview →"**

#### Step 5: Preview & Export

1. View first 10 rows of your report
2. See total count
3. Actions available:
   - **"📥 Export to CSV"**: Download full results
   - **"💾 Save Report"**: Save for future use
   - **"← Back"**: Modify configuration

#### Step 6: Save Report

1. Click **"💾 Save Report"**
2. Enter **Report Name**: e.g., "Active Voters by Booth 123"
3. Enter **Description** (optional): "Shows all active voters in booth 123"
4. Click **"💾 Save Report"**

#### Step 7: Run Saved Reports

1. Scroll to **"Your Saved Reports"** section
2. Click **"📂 Load"** on any report
3. Report configuration loads
4. Click **"Generate Preview"** to run it
5. Export or modify as needed

#### Step 8: Delete Reports

1. Click **"🗑️"** button on any saved report
2. Confirm deletion
3. Report is permanently removed

---

## Common Use Cases

### Use Case 1: Export All Active Voters

1. Go to Custom Report Builder
2. Select fields: name_marathi, name_english, voter_id, mobile, status
3. Add filter: status = "Active"
4. Sort by: name_marathi (Ascending)
5. Limit: 10000
6. Generate & Export to CSV

### Use Case 2: Analyze Specific Booth

1. Go to Custom Report Builder
2. Select fields: name_marathi, age, gender, mobile
3. Add filter: booth_number = 123
4. Sort by: age (Descending)
5. Generate Preview
6. Save report: "Booth 123 Analysis"

### Use Case 3: Find Voters Without Mobile

1. Go to Custom Report Builder
2. Select fields: name_marathi, voter_id, booth_number
3. Add filter: mobile is null
4. Sort by: booth_number
5. Limit: 5000
6. Export to CSV for follow-up

### Use Case 4: Monthly Active Voter Report

1. Go to Reports & Analytics
2. Apply date filter: Last 30 days
3. View charts to see trends
4. Export booth report
5. Export village report
6. Share with team

---

## Tips & Tricks

### 💡 Pro Tips

1. **Use Presets for Speed**: Date filter presets are faster than manual selection

2. **Save Common Reports**: Create and save frequently-used custom reports

3. **Combine Filters**: Use multiple filters to narrow down results precisely

4. **Export Before Sorting**: Sort changes display but CSV contains all data

5. **Check Total Count**: Before exporting large reports, check the count

6. **Use LIKE for Partial Matches**: Use operator "Like" to search by partial names

7. **Worker Search is Instant**: No need to press Enter when searching workers

8. **Charts Update Automatically**: Change date filter and charts refresh instantly

### ⚠️ Things to Avoid

1. **Don't export without filters**: For large databases, always apply some filtering

2. **Don't set limit too high**: Start with 100-1000, increase if needed

3. **Don't forget to save**: After creating a complex report, save it!

4. **Don't share service role key**: Keep your Supabase keys secure

---

## Troubleshooting

### Charts Not Showing?

- Refresh the page (Ctrl+R / Cmd+R)
- Check browser console for errors
- Verify data exists in database

### CSV Export Fails?

- Check internet connection
- Verify you're logged in as admin
- Try with date filters applied

### Custom Report No Results?

- Check filters are correct
- Verify field names match database
- Try without filters first

### Worker Performance Empty?

- Check workers are assigned to voters
- Verify worker_id foreign key exists
- Try different date range

### Can't Save Report?

- Verify you're logged in
- Check report name is entered
- Look for validation errors

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+R / Cmd+R | Refresh page |
| Tab | Navigate between fields |
| Enter | Submit form / Apply filter |
| Esc | Close modal/dialog |

---

## Next Steps

1. **Explore the Features**: Try each feature hands-on
2. **Create Your First Custom Report**: Follow Use Case 1 above
3. **Share Insights**: Export reports and share with your team
4. **Provide Feedback**: Let us know what works and what doesn't!

---

## Need Help?

- 📖 Read full documentation: `docs/ADVANCED_REPORTING_FEATURES.md`
- 🐛 Report issues: Contact your system administrator
- 💡 Feature requests: Submit via your project management tool

---

**Happy Reporting! 🚀📊**
