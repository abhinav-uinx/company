# Refactoring & Security Plan

This is a comprehensive plan to restructure the Next.js app and secure the database. Since these changes will modify your URLs (e.g., `/customers` becomes `/user/customers` or `/admin/directory`) and enforce strict database security, please review this carefully.

## 1. Deleting Unnecessary Files
We will safely delete old folders that are no longer used since our recent database cleanups:
*   `src/app/patients/` (Replaced completely by `customers`)
*   `src/app/medif/` (Dropped earlier; merged into `escorts` & `general_service_records`)
*   `src/app/forms/` (Old iframe wrapper no longer used)

## 2. Restructuring into Admin & User Folders
We will split the application into two distinct areas. 

**Admin Folder (`src/app/admin/`)**
*   `/admin/dashboard` - Admin-specific dashboard
*   `/admin/directory` - Employee management
*   `/admin/reports` - Reporting and analytics
*   `/admin/sessions` - Active login session management

**User (Employee) Folder (`src/app/user/`)**
*   `/user/dashboard` - Employee-specific dashboard
*   `/user/customers` - Patient/Customer management
*   `/user/escorts` - Medical Escort missions
*   `/user/documentation` - General Service / Documentation
*   `/user/invoices` - Billing and Invoices
*   `/user/vault` - Document vault

*Note: All `<Link href="...">` and `router.push(...)` paths across the codebase will be updated to match these new routes.*

## 3. Supabase RLS (Row Level Security)
Currently, some tables might have open or missing RLS policies. We will run a strict SQL migration:

1.  **Enable RLS on all tables** (`customers`, `escort_missions`, `general_service_records`, `invoices`, `employees`, `admins`, etc.)
2.  **Appply Policies**:
    *   Since your app uses a custom JWT session cookie (and not Supabase's native Auth), we must ensure the backend server actions (using `supabaseAdmin` service role key) can always read/write.
    *   For client-side fetches (`supabaseAuth` anon key), we have two choices:
        *   *Option A:* Move ALL database fetches into Next.js Server Actions to securely bypass RLS (highly recommended for custom auth).
        *   *Option B:* Keep client fetches, but create custom Postgres functions to validate your `active_sessions` table before allowing reads.

**Recommended Action for RLS:** The safest structural change for a custom auth system like yours is to move your data fetching from `useEffect` (client-side) into Server Components or Server Actions. This completely hides your database from the public internet.

---

### Do you approve this structure?
If you'd like to proceed, I will start by moving the files and fixing all the navigation links.
