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

### Step 1: Access Your Supabase SQL Editor

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

### Step 3: Verify the Migration

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 24 tables listed.

### Step 4: Data Migration (Optional)

If you need to copy existing data from Lovable Cloud to your external Supabase:

1. Use the Supabase Dashboard to export data from Lovable Cloud:
   - Go to **Table Editor**
   - For each table, click the **⋮** menu
   - Select **Export as CSV**

2. Import into your external Supabase:
   - Go to your external project's **Table Editor**
   - Click the table name
   - Click **Insert** → **Import CSV**

**Note:** For large datasets, consider using `pg_dump` and `pg_restore` for better performance.

### Step 5: Configure Auth (Important!)

Your external Supabase project needs auth configured for RLS policies to work:

1. Go to **Authentication** → **Settings**
2. Enable **Email Provider**
3. Configure **Site URL** and **Redirect URLs**
4. Update any auth-related environment variables

### Step 6: Test RLS Policies

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

## Next Steps

After successful migration:

1. ✅ Test authentication flow
2. ✅ Verify RLS policies work as expected
3. ✅ Import any necessary seed data
4. ✅ Update application connection strings (if using external Supabase for other apps)
5. ✅ Set up backups on external Supabase

## Support

- **Lovable Cloud Issues:** Contact Lovable support
- **External Supabase Issues:** Check [Supabase Docs](https://supabase.com/docs)
- **Migration Questions:** Review this guide and SQL comments

---

**Remember:** This Lovable project will continue using Lovable Cloud. This migration is for replicating the database to your external Supabase project for other purposes.
