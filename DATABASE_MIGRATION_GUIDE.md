# Database Migration Guide

## ⚠️ Important Understanding

**This Lovable project uses Lovable Cloud**, which is built on Supabase infrastructure. You **cannot disconnect** this project from Lovable Cloud or switch it to use an external Supabase project.

However, this guide will help you **replicate** the database schema and data to your external Supabase project at `rgbddzfyznhogebfuhez.supabase.co` for other purposes (analytics, backups, separate services, etc.).

## What This Migration Does

✅ Creates all 24 tables with proper schema
✅ Sets up all indexes and foreign keys
✅ Creates all database functions (has_role, is_admin, etc.)
✅ Enables Row Level Security (RLS) with all policies
✅ Sets up triggers for auto-updating timestamps

## Prerequisites

1. Access to your external Supabase project dashboard at `rgbddzfyznhogebfuhez.supabase.co`
2. Admin/Owner permissions on that project
3. The `database_export.sql` file (generated in this repository)

## Step-by-Step Migration

### Step 1: Create the Schema

First, you need to create all tables and database structure.

### Step 1A: Access Your Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project `rgbddzfyznhogebfuhez`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Schema Migration

1. Open the `database_export.sql` file from this repository
2. Copy the **entire contents** of the file
3. Paste into the Supabase SQL Editor
4. Click **Run** button

This will create:
- The `app_role` enum type
- All 24 tables with proper structure
- All indexes for performance
- All database functions
- All triggers
- Enable RLS on all tables
- Create all RLS policies

**Expected Duration:** 30-60 seconds

### Step 3: Verify the Schema Migration

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 24 tables listed.

---

## Step 2: Import the Data

Now that the schema is created, import the actual data.

### Step 2A: Open the Data Export File

1. Open the `database_data_export.sql` file from this repository
2. This file contains INSERT statements for all existing data

### Step 2B: Run the Data Import

1. Go back to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy the **entire contents** of `database_data_export.sql`
4. Paste into the SQL Editor
5. Click **Run** button

This will import:
- 5 user profiles
- 7 user roles
- 3 subscription plans
- 5 usage tracking records
- 1 event
- 2 groups
- 3 group members
- 3 gift lists
- 8+ gift items
- 2 gift exchanges
- 2 anonymous messages
- 9+ affiliate products
- 5 affiliate configs
- 6 gift cards

**Expected Duration:** 10-20 seconds

**Note:** Large tables like `ai_corrections` and `github_audit_logs` (100+ rows with complex JSONB) are not included. See Step 5 below for exporting those.

### Step 2C: Verify the Data Import

Run verification queries:

```sql
-- Check data counts
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'gift_lists', COUNT(*) FROM gift_lists
UNION ALL
SELECT 'affiliate_products', COUNT(*) FROM affiliate_products;
```

---

### Step 3: Alternative Data Migration (CSV Export)

If you prefer CSV export method or need to export large tables:

1. **Export from Lovable Cloud** (current project):
   - You can view your backend by clicking the backend button in Lovable
   - Go to **Table Editor**
   - For each table, click the **⋮** menu
   - Select **Export as CSV**

2. **Import into your external Supabase:**
   - Go to your external project's **Table Editor**
   - Click the table name
   - Click **Insert** → **Import CSV**

**Recommended for:**
- Large tables (`ai_corrections`, `github_audit_logs`)
- Tables with complex JSONB data
- When you need the most recent data

**Note:** For very large datasets (1000+ rows), consider using `pg_dump` and `pg_restore` for better performance.

---

## Step 4: Configure Auth (Important!)

Your external Supabase project needs auth configured for RLS policies to work:

1. Go to **Authentication** → **Settings**
2. Enable **Email Provider**
3. Configure **Site URL** and **Redirect URLs**
4. Update any auth-related environment variables

---

## Step 5: Test RLS Policies

Create a test user and verify RLS is working:

```sql
-- Test as authenticated user (run in SQL editor)
SELECT current_setting('request.jwt.claims', true)::json->>'sub';
```

## Tables Migrated

### Core User Tables
- ✅ profiles
- ✅ user_roles
- ✅ user_subscriptions
- ✅ usage_tracking

### Group & Gift Exchange Tables
- ✅ events
- ✅ groups
- ✅ group_members
- ✅ gift_lists
- ✅ gift_items
- ✅ gift_exchanges
- ✅ anonymous_messages

### AI & Rate Limiting Tables
- ✅ ai_suggestion_limits
- ✅ ai_usage_tracking
- ✅ anonymous_message_limits
- ✅ rate_limits

### Affiliate & Marketplace Tables
- ✅ affiliate_products
- ✅ affiliate_clicks
- ✅ affiliate_config
- ✅ amazon_credentials
- ✅ amazon_search_tracking
- ✅ gift_card_inventory

### Admin & Audit Tables
- ✅ github_audit_logs
- ✅ ai_corrections
- ✅ subscription_plans

## Key Functions Available

After migration, these security definer functions are available:

```sql
-- Check if user has a specific role
SELECT public.has_role(auth.uid(), 'admin'::app_role);

-- Check if current user is admin
SELECT public.is_admin();

-- Check if user is group member
SELECT public.is_group_member('<group_id>', auth.uid());

-- Check if user created the group
SELECT public.is_group_creator('<group_id>', auth.uid());
```

## Security Considerations

⚠️ **Critical Security Notes:**

1. **RLS Policies Enabled:** All tables have RLS enabled by default
2. **Auth Required:** Most policies require `auth.uid()` to work
3. **Admin Access:** Three emails are auto-assigned admin role:
   - givlyn.app@gmail.com
   - ventas@wincova.com
   - juancovaviajes@gmail.com

4. **Review Policies:** Carefully review RLS policies in `database_export.sql` and adjust for your use case

## Troubleshooting

### Error: "role 'authenticator' does not exist"
This is normal during import. Supabase creates this role automatically.

### Error: "permission denied for schema auth"
The script doesn't modify the `auth` schema. This is expected and safe to ignore.

### Error: "function auth.uid() does not exist"
Make sure you're running queries as an authenticated user, not as the postgres user.

### RLS Policies Not Working
1. Verify auth is configured
2. Check that you're signed in
3. Test with: `SELECT auth.uid();`

## Maintaining Sync Between Projects

If you want to keep both databases in sync:

1. **One-Way Sync (Lovable Cloud → External Supabase):**
   - Use Supabase webhooks on Lovable Cloud
   - Send events to external API
   - Write to external Supabase from API

2. **Two-Way Sync (Not Recommended):**
   - Complex conflict resolution needed
   - Consider using Lovable Cloud as single source of truth

## Summary of Files

This migration includes two SQL files:

1. **`database_export.sql`** - Complete schema with tables, functions, RLS policies, triggers
2. **`database_data_export.sql`** - All data as INSERT statements (NEW!)

## Next Steps

After successful migration:

1. ✅ Test authentication flow
2. ✅ Verify RLS policies work as expected
3. ✅ Verify imported data is accessible
4. ✅ Update application connection strings (if using external Supabase for other apps)
5. ✅ Set up backups on external Supabase
6. ✅ Export large tables (ai_corrections, github_audit_logs) via CSV if needed

## Support

- **Lovable Cloud Issues:** Contact Lovable support
- **External Supabase Issues:** Check [Supabase Docs](https://supabase.com/docs)
- **Migration Questions:** Review this guide and SQL comments

---

**Remember:** This Lovable project will continue using Lovable Cloud. This migration is for replicating the database to your external Supabase project for other purposes.
