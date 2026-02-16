# Testing Guide: Tabbed Profile & Reports Dashboard

## Quick Start

### Prerequisites
- Development server running (`cd web && npm run dev`)
- Supabase database running with voter data
- Admin user account created

---

## Test 1: Tabbed Voter Profile

### Steps:

1. **Navigate to Search Page**
   ```
   http://localhost:3000/search
   ```

2. **Search for a Voter**
   - Try searching: "गाडेकर" (or any name from your uploaded data)
   - Click on any voter from results

3. **Test Each Tab**

   **Personal Info Tab (वैयक्तिक माहिती)**
   - ✅ Verify Marathi name displays correctly
   - ✅ Verify English name displays correctly
   - ✅ Check voter ID, age, gender, caste

   **Contact Tab (संपर्क)**
   - ✅ View contact information
   - ✅ Click "Edit Contact" button
   - ✅ Modify mobile number or email
   - ✅ Click "Save Changes"
   - ✅ Verify data updates successfully

   **Administrative Tab (प्रशासकीय)**
   - ✅ Check booth number
   - ✅ Verify assembly constituency
   - ✅ View status badge (Active/Inactive)
   - ✅ Check village with Gan/Gat

   **Family Tab (कुटुंब)**
   - ✅ If family head: View list of members
   - ✅ If family member: View head and siblings
   - ✅ Click "Link Family Member" button
   - ✅ Test family linking modal

   **Assignment Tab (नियुक्ती)**
   - ✅ View worker information (yellow card)
   - ✅ View employee information (blue card)
   - ✅ View location information (green card)

4. **Visual Checks**
   - ✅ Tab navigation is smooth
   - ✅ Active tab is highlighted
   - ✅ Icons display correctly
   - ✅ Bilingual labels are visible
   - ✅ Header with avatar and badges looks professional

---

## Test 2: Reports Dashboard

### Steps:

1. **Navigate to Reports**
   ```
   http://localhost:3000/reports
   ```
   
   **Note**: Only accessible to admin users. If you don't see "Reports & Analytics" in the sidebar, ensure you're logged in as admin.

2. **Verify Summary Cards**
   - ✅ Total Voters card (purple gradient)
   - ✅ Total Families card (pink gradient)
   - ✅ Workers card (blue gradient)
   - ✅ Employees card (green gradient)
   - ✅ All numbers are correct

3. **Status Breakdown Section**
   - ✅ Active voters shown with green bar
   - ✅ Inactive voters shown with red bar
   - ✅ Visual bars proportional to counts

4. **Gender Distribution Section**
   - ✅ Male count with blue bar
   - ✅ Female count with pink bar
   - ✅ Female ratio percentage displayed
   - ✅ Total adds up to voter count

5. **Age Groups Section**
   - ✅ Six age brackets displayed
   - ✅ Purple bars showing counts
   - ✅ Visual comparison clear

6. **Village-wise Distribution**
   - ✅ Top 10 villages listed
   - ✅ Sorted by count (highest first)
   - ✅ Green bars with location icons
   - ✅ Counts displayed

7. **Booth-wise Analysis Table**
   - ✅ Table displays up to 20 booths
   - ✅ Booth numbers in first column
   - ✅ Voter counts in second column
   - ✅ Percentages calculated correctly
   - ✅ Visual bars in last column
   - ✅ Sorted by count (descending)

8. **Export Section**
   - ✅ Three export buttons visible
   - ✅ Styled consistently
   - Note: Functionality not yet implemented (placeholders)

---

## Test 3: Access Control

### Admin User Test

1. **Login as Admin**
   ```bash
   # Use credentials from supabase/seed_admin.sql
   Email: admin@example.com
   Password: admin123
   ```

2. **Verify Navigation**
   - ✅ See "Reports & Analytics" menu item (📈)
   - ✅ Can access `/reports` page
   - ✅ All analytics visible

### Office User Test

1. **Create Office User** (if not exists)
   - Navigate to "Create User" (admin only)
   - Email: `office@example.com`
   - Password: `office123`
   - Role: `office_user`

2. **Login as Office User**
   - ✅ Should NOT see "Reports & Analytics" in sidebar
   - ✅ Cannot access `/reports` (redirected or denied)
   - ✅ Can still access Search, Profile pages

---

## Test 4: Data Accuracy

### Verify Report Data

1. **Check Database Counts**
   ```bash
   cd web
   psql postgresql://postgres:postgres@localhost:54322/postgres
   ```

   ```sql
   -- Total voters
   SELECT COUNT(*) FROM master_voters;
   
   -- Total families
   SELECT COUNT(*) FROM families;
   
   -- Gender breakdown
   SELECT gender, COUNT(*) FROM master_voters GROUP BY gender;
   
   -- Booth breakdown
   SELECT booth_number, COUNT(*) FROM master_voters 
   WHERE booth_number IS NOT NULL 
   GROUP BY booth_number 
   ORDER BY COUNT(*) DESC 
   LIMIT 5;
   ```

2. **Compare with Reports Dashboard**
   - ✅ Totals match database counts
   - ✅ Gender breakdown matches
   - ✅ Booth counts are accurate

---

## Test 5: Responsive Design

### Desktop View
- ✅ Navigate to profile and reports on desktop
- ✅ All content fits within viewport
- ✅ No horizontal scrolling

### Tablet View (iPad)
- ✅ Open browser dev tools
- ✅ Set viewport to tablet size
- ✅ Verify tabs wrap appropriately
- ✅ Cards stack properly

### Mobile View
- ✅ Set viewport to mobile size
- ✅ Tabs become scrollable horizontally
- ✅ Report cards stack vertically
- ✅ Tables scroll horizontally

---

## Common Issues & Solutions

### Issue: Reports page shows all zeros

**Solution:**
- Ensure data has been uploaded
- Check RLS policies on tables
- Verify service role key in `.env.local`
- Check browser console for API errors

### Issue: Tabs don't switch

**Solution:**
- Clear browser cache
- Check console for JavaScript errors
- Verify React state updates
- Refresh the page

### Issue: Can't see Reports menu item

**Solution:**
- Verify logged in as admin user
- Check role in database: `SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';`
- Ensure RBAC permissions are correct
- Re-login to refresh auth context

### Issue: Family tab shows empty

**Solution:**
- Verify family data exists in `families` table
- Check `family_members` table for linkages
- Ensure RLS policies allow reading
- Check API response in Network tab

### Issue: Contact edit doesn't save

**Solution:**
- Check Network tab for API errors
- Verify `/api/profile/update` endpoint
- Ensure required fields are provided
- Check database constraints

---

## Performance Notes

### Expected Load Times
- Profile page: < 1 second
- Reports dashboard: 1-3 seconds (depends on data size)
- Tab switching: Instant (no re-fetch)

### Optimization Tips
- If reports are slow, consider caching
- For large booth tables, implement pagination
- Use database indexes for queries

---

## Screenshot Checklist

Document your testing with screenshots of:

1. ✅ All 5 profile tabs
2. ✅ Summary cards on reports dashboard
3. ✅ Each analytics section
4. ✅ Booth-wise table
5. ✅ Navigation menu with Reports item
6. ✅ Mobile responsive views

---

## Next Steps After Testing

Once all tests pass:

1. **Document any issues** in GitHub/issue tracker
2. **Collect user feedback** from actual users
3. **Plan enhancements**:
   - CSV export implementation
   - Additional analytics
   - Chart visualizations
   - Performance optimizations

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Review API responses in Network tab
3. Verify database state with SQL queries
4. Consult main documentation in `/docs/`
5. Check Supabase logs in dashboard

---

**Happy Testing! 🚀**
