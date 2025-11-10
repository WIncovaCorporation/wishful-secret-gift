# 🔐 Environment Variables Documentation

**Last Updated:** 2025-11-10  
**Version:** 1.0.0

---

## Overview

GiftApp MVP uses environment variables to configure integrations, monitoring, and application behavior across different environments (development, staging, production).

**CRITICAL:** All environment variables prefixed with `VITE_` are exposed to the frontend bundle. NEVER store secrets or sensitive data in these variables.

---

## Required Variables by Environment

### Development

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL (auto-configured) | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Yes | Supabase anon/public key (auto-configured) | `eyJhbGc...` |
| `VITE_SUPABASE_PROJECT_ID` | ✅ Yes | Supabase project ID (auto-configured) | `ghbksqyioendvispcseu` |

### Staging

Same as Development, plus:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SENTRY_DSN` | ⚠️ Recommended | Sentry error tracking (optional for staging) | `https://...@sentry.io/123` |
| `VITE_GA_MEASUREMENT_ID` | ⚠️ Recommended | Google Analytics (optional for staging) | `G-XXXXXXXXXX` |
| `VITE_APP_ENV` | ⚠️ Recommended | Set to "staging" | `staging` |

### Production

All of the above, plus:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SENTRY_DSN` | 🔴 CRITICAL | Sentry DSN for error monitoring (P0 blocker) | `https://...@sentry.io/123` |
| `VITE_GA_MEASUREMENT_ID` | 🔴 CRITICAL | GA4 for analytics (P0 blocker) | `G-XXXXXXXXXX` |
| `VITE_APP_ENV` | ✅ Yes | Must be set to "production" | `production` |
| `VITE_APP_VERSION` | ✅ Yes | Current release version | `1.0.0` |

---

## Variable Reference

### VITE_SUPABASE_URL

**Type:** String (URL)  
**Required:** Yes (all environments)  
**Auto-configured:** ✅ By Lovable Cloud  
**Example:** `https://ghbksqyioendvispcseu.supabase.co`

The base URL for your Supabase project. Used by the Supabase client to connect to the database, authentication, and Edge Functions.

**Usage:**
```typescript
import { supabase } from "@/integrations/supabase/client";
// Client automatically uses VITE_SUPABASE_URL
```

---

### VITE_SUPABASE_PUBLISHABLE_KEY

**Type:** String (JWT)  
**Required:** Yes (all environments)  
**Auto-configured:** ✅ By Lovable Cloud  
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

The public/anonymous key for Supabase. Safe to expose in frontend code. Used for authentication and RLS policy enforcement.

**Security Note:** This is NOT a secret. It's meant to be public. Row Level Security (RLS) policies protect your data.

---

### VITE_SUPABASE_PROJECT_ID

**Type:** String  
**Required:** Yes (all environments)  
**Auto-configured:** ✅ By Lovable Cloud  
**Example:** `ghbksqyioendvispcseu`

Your Supabase project identifier. Used for Edge Function URLs and project-specific configurations.

---

### VITE_SENTRY_DSN

**Type:** String (URL)  
**Required:** 🔴 CRITICAL for production  
**Auto-configured:** ❌ Manual setup required  
**Example:** `https://abc123def456@o123456.ingest.sentry.io/7890123`

Sentry Data Source Name for error tracking, performance monitoring, and session replay.

**How to obtain:**
1. Create account at [sentry.io](https://sentry.io)
2. Create new project (select "React")
3. Copy DSN from Project Settings > Client Keys (DSN)

**What happens without this:**
- ⚠️ **Development/Staging:** Errors logged to console only
- 🚨 **Production:** Zero visibility into production errors (BLOCKER)

**Usage:**
```typescript
import { initSentry } from "@/lib/sentry";
// Automatically initialized in main.tsx
// Requires VITE_SENTRY_DSN to send to Sentry dashboard
```

**Configuration:**
- See `src/lib/sentry.ts` for Sentry configuration
- Errors are captured automatically via Error Boundary
- Performance monitoring enabled at 10% sample rate (prod)
- Session replay enabled for 10% of sessions

---

### VITE_GA_MEASUREMENT_ID

**Type:** String  
**Required:** 🔴 CRITICAL for production  
**Auto-configured:** ❌ Manual setup required  
**Example:** `G-ABC123DEFG`  
**Format:** Always starts with `G-`

Google Analytics 4 Measurement ID for user behavior tracking and business metrics.

**How to obtain:**
1. Go to [Google Analytics](https://analytics.google.com)
2. Create GA4 property (or use existing)
3. Go to Admin > Data Streams > Web > Measurement ID
4. Copy ID (format: `G-XXXXXXXXXX`)

**What happens without this:**
- ⚠️ **Development/Staging:** No analytics (acceptable)
- 🚨 **Production:** Zero visibility into user behavior, engagement, conversions (BLOCKER)

**Usage:**
```typescript
import { trackEvent } from "@/lib/analytics";
// Initialized in AnalyticsContext
trackEvent('button_click', { button_id: 'signup' });
```

**Events tracked:**
- Page views (automatic)
- User signup/login
- Gift list creation
- Group creation
- Event creation
- AI suggestions usage
- Custom user actions

---

### VITE_APP_ENV

**Type:** String (enum)  
**Required:** Recommended  
**Auto-configured:** ❌ Manual setup  
**Values:** `development` | `staging` | `production`  
**Default:** `development` (if not set)

Application environment identifier. Affects behavior of error monitoring, logging, and feature flags.

**Usage:**
```typescript
if (import.meta.env.VITE_APP_ENV === 'production') {
  // Production-only code
}
```

**Impact:**
- **Development:** Verbose logging, debug tools enabled
- **Staging:** Similar to production but with extra logging
- **Production:** Minimal logging, optimized for performance

---

### VITE_APP_VERSION

**Type:** String (semver)  
**Required:** Recommended for production  
**Auto-configured:** ❌ Manual setup  
**Example:** `1.0.0`  
**Format:** Semantic versioning (major.minor.patch)

Application version for release tracking in Sentry and debugging.

**Should match:** `version` field in `package.json`

**Usage:**
- Sentry groups errors by release version
- Helps identify which version introduced a bug
- Visible in Sentry dashboard for filtering

**Recommendation:** Update this on every release

---

## Setup Instructions

### Development Setup

1. **Initial Setup (Auto-configured by Lovable):**
   ```bash
   # Supabase variables are already configured
   # No action needed for development
   ```

2. **Optional - Enable Sentry in Development:**
   ```bash
   # Create .env file (if not exists)
   cp .env.example .env
   
   # Add your personal Sentry DSN (optional)
   VITE_SENTRY_DSN=your_dev_sentry_dsn_here
   ```

---

### Staging Setup

1. **Verify Supabase Variables:**
   ```bash
   # Should already be set by Lovable Cloud
   echo $VITE_SUPABASE_URL
   ```

2. **Add Monitoring (Optional but Recommended):**
   ```bash
   # In Lovable Dashboard or .env file
   VITE_SENTRY_DSN=your_staging_sentry_dsn
   VITE_GA_MEASUREMENT_ID=G-STAGINGXXXXXX
   VITE_APP_ENV=staging
   VITE_APP_VERSION=1.0.0-rc.1
   ```

---

### Production Setup (CRITICAL)

1. **Verify ALL Required Variables:**
   ```bash
   # Checklist before production deploy:
   ✅ VITE_SUPABASE_URL (auto-configured)
   ✅ VITE_SUPABASE_PUBLISHABLE_KEY (auto-configured)
   ✅ VITE_SUPABASE_PROJECT_ID (auto-configured)
   ✅ VITE_SENTRY_DSN (MUST CONFIGURE)
   ✅ VITE_GA_MEASUREMENT_ID (MUST CONFIGURE)
   ✅ VITE_APP_ENV=production
   ✅ VITE_APP_VERSION=1.0.0
   ```

2. **Configure in Lovable Dashboard:**
   - Go to Project Settings > Environment Variables
   - Add production values
   - **NEVER** commit .env to git

3. **Validation:**
   ```bash
   # After deploy, check browser console:
   # Should see: "✅ Sentry initialized (production mode)"
   # Should see GA4 pageview events in Network tab
   ```

---

## Security Best Practices

### ✅ DO

- ✅ Use `.env` files for local development
- ✅ Add `.env` to `.gitignore` (already configured)
- ✅ Use Lovable Dashboard for production secrets
- ✅ Use different Sentry projects for staging/production
- ✅ Use different GA4 properties for staging/production
- ✅ Rotate keys if accidentally committed

### ❌ DON'T

- ❌ NEVER commit `.env` to version control
- ❌ NEVER hardcode secrets in code
- ❌ NEVER share production credentials in Slack/email
- ❌ NEVER use production keys in development
- ❌ NEVER expose `service_role_key` to frontend (only `anon_key`)

---

## Troubleshooting

### Issue: "Sentry DSN not configured" warning

**Symptom:** Console shows `⚠️ Sentry DSN not configured`

**Cause:** `VITE_SENTRY_DSN` not set

**Solution:**
- For development: Safe to ignore (errors logged to console)
- For production: MUST configure (see setup instructions)

---

### Issue: Google Analytics not tracking

**Symptom:** No events in GA4 Real-time dashboard

**Diagnosis:**
```javascript
// Check in browser console:
console.log(import.meta.env.VITE_GA_MEASUREMENT_ID);
// Should print: "G-XXXXXXXXXX"
```

**Solutions:**
1. Verify `VITE_GA_MEASUREMENT_ID` is set correctly
2. Check GA4 measurement ID format (must start with `G-`)
3. Verify ad blockers disabled (they block GA4)
4. Wait 1-2 minutes for data to appear in GA4 dashboard

---

### Issue: Supabase connection errors

**Symptom:** "Failed to connect to Supabase" errors

**Diagnosis:**
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
// Should print valid values
```

**Solutions:**
1. **Lovable Cloud:** Should be auto-configured, contact support if missing
2. **Self-hosting:** Verify `.env` file exists and is loaded
3. Restart dev server after changing `.env`
4. Clear browser cache and reload

---

## Environment Variable Checklist

Use this checklist before deploying:

### Development ✅
- [x] `VITE_SUPABASE_URL` (auto-configured)
- [x] `VITE_SUPABASE_PUBLISHABLE_KEY` (auto-configured)
- [x] `VITE_SUPABASE_PROJECT_ID` (auto-configured)
- [ ] `VITE_SENTRY_DSN` (optional)
- [ ] `VITE_GA_MEASUREMENT_ID` (optional)

### Staging ⚠️
- [x] All development variables
- [ ] `VITE_SENTRY_DSN` (recommended)
- [ ] `VITE_GA_MEASUREMENT_ID` (recommended)
- [ ] `VITE_APP_ENV=staging`
- [ ] `VITE_APP_VERSION=1.0.0-rc.1`

### Production 🔴
- [x] All staging variables
- [ ] `VITE_SENTRY_DSN` (REQUIRED)
- [ ] `VITE_GA_MEASUREMENT_ID` (REQUIRED)
- [ ] `VITE_APP_ENV=production` (REQUIRED)
- [ ] `VITE_APP_VERSION=1.0.0` (REQUIRED)
- [ ] All values verified and tested
- [ ] `.env` NOT committed to git

---

## References

- [Vite Environment Variables Docs](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Client Libraries](https://supabase.com/docs/reference/javascript/installing)
- [Sentry React Setup](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Google Analytics 4 Setup](https://support.google.com/analytics/answer/9304153)

---

**Document Version:** 1.0.0  
**Last Reviewed:** 2025-11-10  
**Next Review:** Post-production deployment
