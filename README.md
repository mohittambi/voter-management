# 🗳️ Voter Management Portal

A comprehensive voter management system with role-based access control, built with Next.js, Supabase, and deployed to Vercel.

## 🎯 Overview

This system provides a complete solution for managing voter databases with features for:
- **Voter Master Data Management** - Upload, search, and maintain voter information
- **Tabbed Voter Profiles** - Modern interface with Personal, Contact, Administrative, Family, and Assignment tabs
- **Family Mapping** - Link voters by family relationships with visual family trees
- **Reports & Analytics** - Comprehensive dashboard with booth-wise, village-wise, and demographic analytics
- **Role-Based Access Control** - Admin and Office User roles with specific permissions
- **Service Management** - Track and manage voter services
- **Dynamic Forms** - No-code form builder for custom data collection
- **Audit Logging** - Track all system changes
- **Bilingual Support** - Full Marathi and English interface

## 🚀 Quick Start

**Get the system running in 10 minutes!**

See [docs/QUICKSTART.md](docs/QUICKSTART.md) for a complete step-by-step guide.

### Prerequisites
- Node.js v18.17+ or v20+
- Supabase CLI
- Docker (for local Supabase)

### 1-Minute Setup
```bash
# Start Supabase
supabase start

# Apply migrations
supabase migration up

# Setup storage & RLS
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/setup_storage.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/setup_rls.sql

# Configure environment
cd web
cp .env.example .env.local
# Edit .env.local with your keys from 'supabase start'

# Install & run
npm install
npm run dev

# Create admin user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!","role":"admin"}'

# Login at http://localhost:3000/login
```

## 🔐 User Roles & Permissions

### 👑 Admin
- Upload voter lists (Excel/CSV)
- View import history
- Manage service types
- Create users
- View all reports
- Full system access

### 👤 Office User
- Search voters
- View voter profiles
- Link family members
- Create service requests
- Update work status

See [docs/USER_MANAGEMENT_GUIDE.md](docs/USER_MANAGEMENT_GUIDE.md) for complete RBAC documentation.

## 📁 Project Structure

```
voter-management/
├── supabase/                    # Database & backend
│   ├── migrations/              # Database migrations
│   ├── setup_rls.sql            # Row Level Security policies
│   ├── setup_storage.sql        # Storage bucket setup
│   └── seed_admin.sql           # Admin user seed script
├── web/                         # Next.js frontend
│   ├── contexts/                # React contexts (Auth)
│   ├── lib/                     # Utilities (RBAC, Supabase)
│   ├── components/              # React components
│   ├── pages/                   # Next.js pages & API routes
│   └── styles/                  # Global CSS
└── docs/                        # Documentation
    ├── QUICKSTART.md            # Quick setup guide
    ├── USER_MANAGEMENT_GUIDE.md # RBAC setup & usage
    ├── API_REFERENCE.md         # API documentation
    ├── RBAC_ARCHITECTURE.md     # System architecture
    ├── RBAC_TESTING_CHECKLIST.md # Testing guide
    └── RBAC_IMPLEMENTATION_SUMMARY.md # Implementation details
```

## ✨ Features

### Core Features
- ✅ **Authentication & Authorization** - Secure login with role-based permissions
- ✅ **Voter Upload** - Import Excel/CSV files with master voter data (Manoli.xlsx format supported)
- ✅ **Marathi Language Support** - Full bilingual support (मराठी/English) for names, addresses, and UI
- ✅ **Voter Search** - Fast search by name (Marathi/English), mobile, Aadhaar, booth, status
- ✅ **Tabbed Voter Profiles** - Modern 5-tab interface (Personal, Contact, Administrative, Family, Assignment)
- ✅ **Reports & Analytics Dashboard** - Comprehensive analytics with booth-wise, village-wise, status-wise breakdowns
- ✅ **CSV Export** - Download booth, village, and status reports with bilingual headers
- ✅ **Chart Visualizations** - Interactive charts (Bar, Pie, Line) with Chart.js
- ✅ **Date Range Filters** - Filter all reports by time period with quick presets
- ✅ **Worker Performance Metrics** - Track worker productivity with performance scores
- ✅ **Custom Report Builder** - Create, save, and run custom reports with dynamic queries
- ✅ **Auto Family Linking** - Automatically creates family relationships during upload
- ✅ **Visual Family Trees** - Interactive family member display with relationships
- ✅ **Service Management** - Admin-controlled service type definitions
- ✅ **Import History** - Track all data imports with file downloads
- ✅ **Extended Demographics** - Booth number, caste, age, gender, assembly constituency
- ✅ **Worker/Employee Tracking** - Assign karyakartas and employees to voters
- ✅ **Village Hierarchy** - Village, group (गण), sub-group (गट) management
- ✅ **Status Tracking** - Track voter status (Active/मयत/दुबार/बेपत्ता)
- ✅ **Professional UI/UX** - Modern dashboard with role-based navigation

### Technical Features
- ✅ **Supabase Backend** - PostgreSQL database with Auth & Storage
- ✅ **Row Level Security** - Database-level access control
- ✅ **S3-Compatible Storage** - File uploads with Supabase Storage
- ✅ **Serverless APIs** - Next.js API routes for backend logic
- ✅ **Protected Routes** - Client-side route protection
- ✅ **API Authorization** - Server-side role verification
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **TypeScript** - Type-safe codebase

## 📊 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (GoTrue) |
| **Storage** | Supabase Storage (S3-compatible) |
| **Deployment** | Vercel (Frontend), Supabase Cloud (Backend) |
| **Styling** | CSS3, Custom Design System |

## 🔒 Security

- **Multi-Layer Security**
  - Client-side UI protection
  - Route-level authorization
  - API endpoint verification
  - Database Row Level Security (RLS)
  - Service role key isolation

- **Best Practices**
  - Environment variables for secrets
  - Server-side role verification
  - Encrypted passwords (Supabase Auth)
  - HTTPS in production
  - Audit logging

See [docs/RBAC_ARCHITECTURE.md](docs/RBAC_ARCHITECTURE.md) for security architecture details.

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](docs/QUICKSTART.md) | 10-minute setup guide |
| [USER_MANAGEMENT_GUIDE.md](docs/USER_MANAGEMENT_GUIDE.md) | RBAC setup and usage |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | Complete API documentation |
| [RBAC_ARCHITECTURE.md](docs/RBAC_ARCHITECTURE.md) | System architecture diagrams |
| [RBAC_TESTING_CHECKLIST.md](docs/RBAC_TESTING_CHECKLIST.md) | Comprehensive testing guide |
| [RBAC_IMPLEMENTATION_SUMMARY.md](docs/RBAC_IMPLEMENTATION_SUMMARY.md) | Implementation details |
| [web/README.md](web/README.md) | Frontend-specific documentation |

## 🧪 Testing

Complete testing checklist available in [docs/RBAC_TESTING_CHECKLIST.md](docs/RBAC_TESTING_CHECKLIST.md)

**Run smoke tests:**
1. Login as admin
2. Upload voter list
3. Search voters
4. Create service type
5. Create office user
6. Test access restrictions

## 🚀 Deployment

### Production Deployment

1. **Deploy Frontend to Vercel:**
   ```bash
   cd web
   vercel --prod
   ```

2. **Deploy Backend to Supabase Cloud:**
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

3. **Configure Environment Variables in Vercel:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (secret)
   - `SUPABASE_STORAGE_BUCKET`

See [web/README.md](web/README.md) for detailed deployment instructions.

## 🐛 Troubleshooting

### Common Issues

**"Bucket not found"**
- Run `supabase/setup_storage.sql`

**"Access Denied" on all pages**
- Verify user role in `user_roles` table
- Check RLS policies are applied

**"Module not found"**
- Run `npm install` in `web/` directory
- Check Node.js version (v18.17+ required)

**Search returns empty**
- Upload voter data first via `/upload`

See [docs/USER_MANAGEMENT_GUIDE.md#troubleshooting](docs/USER_MANAGEMENT_GUIDE.md#troubleshooting) for more solutions.

## 📈 Roadmap

### Planned Features
- [ ] Multi-Factor Authentication (MFA)
- [ ] User management UI (edit/deactivate users)
- [ ] Password reset functionality
- [ ] Advanced audit logging
- [ ] WhatsApp/SMS communications
- [ ] AI voice campaigns
- [ ] Automated notifications
- [ ] Reports & analytics
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Update documentation
5. Submit a pull request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Next.js](https://nextjs.org) - React framework
- [Vercel](https://vercel.com) - Deployment platform

## 📞 Support

For issues or questions:
1. Check the [QUICKSTART.md](docs/QUICKSTART.md) guide
2. Review [docs/](docs/) for specific topics
3. Check browser console and server logs
4. Verify database state with SQL queries

## 🎯 Status

**Current Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** February 15, 2026

---

**Built with ❤️ for efficient voter management**
