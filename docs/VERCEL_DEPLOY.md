# Deploy to Vercel

## Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already)

2. **Go to [vercel.com](https://vercel.com)** → Sign in → **Add New** → **Project**

3. **Import** your `voter-management` repository

4. **Configure project:**
   - **Root Directory:** Click "Edit" → set to `web`
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** (leave default)

5. **Add Environment Variables** (Settings → Environment Variables):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://sbxgwkfxflbawajqltuz.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your secret key (mark as Sensitive) |
   | `SUPABASE_STORAGE_BUCKET` | `voter_bucket` |
   | `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | `voter_bucket` |

6. **Deploy** → Vercel will build and deploy. Your site will be live at `https://your-project.vercel.app`

---

## Option B: Deploy via CLI

1. **Login to Vercel:**
   ```bash
   cd web
   npx vercel login
   ```

2. **Deploy:**
   ```bash
   npx vercel
   ```
   - First run: Link to existing project or create new one
   - Add env vars when prompted, or add later in the dashboard

3. **Production deploy:**
   ```bash
   npx vercel --prod
   ```

---

## After Deployment

1. **Create admin user:**
   ```bash
   curl -X POST https://YOUR_APP.vercel.app/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"Admin123!","role":"admin"}'
   ```

2. **Login** at `https://YOUR_APP.vercel.app/login`
