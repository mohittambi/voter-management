# API Reference - Authentication & RBAC

## Authentication Endpoints

### POST `/api/auth/signup`

Create a new user with a specified role. **Admin-only endpoint**.

**Authentication:** Requires service role key (server-side)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "role": "admin" | "office_user"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-02-15T12:00:00Z"
  }
}
```

**Response (400):**
```json
{
  "error": "Email and password required"
}
```

**Response (500):**
```json
{
  "error": "Signup failed"
}
```

---

### GET `/api/auth/role`

Fetch the role for a given user ID.

**Query Parameters:**
- `user_id` (required): UUID of the user

**Response (200):**
```json
{
  "role": "admin" | "office_user"
}
```

If no role exists, defaults to:
```json
{
  "role": "office_user"
}
```

**Response (400):**
```json
{
  "error": "user_id required"
}
```

---

## Service Management Endpoints

### GET `/api/services`

List all service types.

**Authentication:** Optional (authenticated users see all, anon users see active only)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Ration Card Application",
    "description": "Apply for new ration card",
    "active": true,
    "created_at": "2026-02-15T12:00:00Z",
    "updated_at": "2026-02-15T12:00:00Z"
  }
]
```

---

### POST `/api/services`

Create a new service type. **Admin-only**.

**Authentication:** Requires service role key

**Request Body:**
```json
{
  "name": "Service Name",
  "description": "Service description",
  "active": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Service Name",
  "description": "Service description",
  "active": true,
  "created_at": "2026-02-15T12:00:00Z"
}
```

**Response (400):**
```json
{
  "error": "Name is required"
}
```

---

### PUT `/api/services`

Update an existing service type. **Admin-only**.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Service Name",
  "description": "Updated description",
  "active": false
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Service Name",
  "description": "Updated description",
  "active": false,
  "updated_at": "2026-02-15T13:00:00Z"
}
```

**Response (400):**
```json
{
  "error": "ID and name are required"
}
```

---

### DELETE `/api/services?id={uuid}`

Delete a service type. **Admin-only**.

**Query Parameters:**
- `id` (required): UUID of the service to delete

**Response (200):**
```json
{
  "success": true
}
```

**Response (400):**
```json
{
  "error": "ID is required"
}
```

---

## Voter Management Endpoints

### POST `/api/upload`

Upload voter list (Excel/CSV). **Admin-only**.

**Authentication:** Requires service role key

**Request:** Multipart form data with file

**Response (200):**
```json
{
  "imported": 150,
  "importId": "uuid"
}
```

**Response (400):**
```json
{
  "error": "No file uploaded"
}
```

---

### GET `/api/search?q={query}`

Search voters by name, mobile, or aadhaar.

**Authentication:** Required (admin or office_user)

**Query Parameters:**
- `q` (required): Search query string

**Response (200):**
```json
[
  {
    "id": "uuid",
    "first_name": "John",
    "middle_name": "Kumar",
    "surname": "Sharma",
    "voter_id": "ABC1234567",
    "mobile": "9876543210",
    "email": "john@example.com"
  }
]
```

---

### GET `/api/voter?id={uuid}`

Get detailed voter profile.

**Query Parameters:**
- `id` (required): Master voter UUID

**Response (200):**
```json
{
  "master": {
    "id": "uuid",
    "first_name": "John",
    "surname": "Sharma",
    "voter_id": "ABC1234567"
  },
  "profile": {
    "dob": "1990-01-01",
    "mobile": "9876543210",
    "email": "john@example.com",
    "aadhaar_masked": "XXXX-XXXX-1234"
  }
}
```

---

### POST `/api/profile/update`

Update voter profile fields.

**Authentication:** Required

**Request Body:**
```json
{
  "voter_id": "uuid",
  "dob": "1990-01-15",
  "mobile": "9876543210",
  "email": "newemail@example.com"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

### POST `/api/family/link`

Link voters as family members.

**Authentication:** Required

**Request Body:**
```json
{
  "head_voter_id": "uuid",
  "member_voter_id": "uuid",
  "relationship": "spouse" | "child" | "parent" | "sibling" | "other"
}
```

**Response (200):**
```json
{
  "family_id": "uuid",
  "message": "Family linked successfully"
}
```

**Response (400):**
```json
{
  "error": "Voter already in a family"
}
```

---

### GET `/api/family/info?voter_id={uuid}`

Get family information for a voter.

**Query Parameters:**
- `voter_id` (required): Master voter UUID

**Response (200) - Is Family Head:**
```json
{
  "role": "head",
  "family_id": "uuid",
  "members": [
    {
      "id": "uuid",
      "name": "Jane Sharma",
      "relationship": "spouse"
    }
  ]
}
```

**Response (200) - Is Family Member:**
```json
{
  "role": "member",
  "family_id": "uuid",
  "head": {
    "id": "uuid",
    "name": "John Sharma"
  },
  "siblings": []
}
```

**Response (200) - No Family:**
```json
{
  "role": "none"
}
```

---

### GET `/api/imports`

List import history. **Admin-only**.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "filename": "voters_jan_2026.xlsx",
    "rows_imported": 150,
    "created_at": "2026-02-15T12:00:00Z",
    "storage_path": "imports/uuid/voters_jan_2026.xlsx"
  }
]
```

---

## Permission Checking

### Client-Side (React)

```typescript
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../lib/rbac';

function MyComponent() {
  const { role, isAdmin } = useAuth();

  if (isAdmin) {
    // Show admin UI
  }

  if (hasPermission(role, 'UPLOAD_VOTERS')) {
    // Show upload button
  }

  return <div>...</div>;
}
```

### Server-Side (API Route)

```typescript
import { getServiceRoleClient } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  const supabase = getServiceRoleClient();
  
  // Fetch user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (roleData?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Continue with admin operation
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Not logged in |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 405 | Method Not Allowed - Wrong HTTP method |
| 500 | Internal Server Error - Server-side error |

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:
- Implementing rate limiting middleware
- Using Vercel Edge Config for IP-based limiting
- Supabase connection pooling (PgBouncer)

---

## Authentication Flow

```
1. User submits login form
   ↓
2. supabase.auth.signInWithPassword()
   ↓
3. AuthContext fetches user role from /api/auth/role
   ↓
4. Role stored in context state
   ↓
5. ProtectedRoute checks role against allowedRoles
   ↓
6. Page renders if authorized
```

---

## Security Best Practices

1. **Never expose service role key client-side**
   - Use environment variables
   - Only access in API routes (server-side)

2. **Always verify roles server-side**
   - Don't trust client-side role checks
   - Verify in every API route

3. **Use RLS policies**
   - Enable on all tables
   - Define policies for each role

4. **Audit logging**
   - Log all sensitive operations to `audit_logs`
   - Include user_id, action, timestamp

5. **Password requirements**
   - Minimum 6 characters (increase for production)
   - Consider password complexity rules

---

## Testing API Endpoints

### Using curl

```bash
# Create user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","role":"admin"}'

# Get user role
curl http://localhost:3000/api/auth/role?user_id=uuid

# Create service (requires auth)
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Service","active":true}'
```

### Using JavaScript (Browser Console)

```javascript
// After logging in
fetch('/api/services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Service', active: true })
})
  .then(r => r.json())
  .then(console.log);
```

---

## Database Schema Reference

### `user_roles`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| role | enum | 'admin' or 'office_user' |
| created_at | timestamptz | Creation timestamp |

### `service_types`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Service name (unique) |
| description | text | Service description |
| active | boolean | Is service active? |
| created_by | uuid | Creator user ID |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |
