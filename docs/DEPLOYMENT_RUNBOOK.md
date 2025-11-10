# 🚀 DEPLOYMENT RUNBOOK - GiftApp MVP

**Version:** 1.0.0  
**Last Updated:** 2025-11-10  
**Maintained by:** DevOps Team

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Post-Deployment Validation](#post-deployment-validation)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring and Alerts](#monitoring-and-alerts)
8. [Troubleshooting](#troubleshooting)
9. [Emergency Contacts](#emergency-contacts)

---

## 1. OVERVIEW

### Deployment Architecture

**Platform:** Lovable Cloud  
**Database:** Supabase (PostgreSQL)  
**Authentication:** Supabase Auth  
**Backend:** Supabase Edge Functions (Deno)  
**Frontend:** React + Vite (Static Build)  
**CDN:** Lovable auto-configured  
**SSL/TLS:** Auto-provisioned Let's Encrypt

### Deployment Trigger

- **Automatic:** Push to `main` branch triggers auto-deploy
- **Manual:** Revert to previous version via Lovable UI
- **Edge Functions:** Auto-deployed with frontend changes

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | `http://localhost:5173` | Local dev |
| Staging | Lovable Preview URL | Pre-production testing |
| Production | Custom domain (TBD) | Live users |

---

## 2. PRE-DEPLOYMENT CHECKLIST

### 🔴 CRITICAL (Must Complete Before ANY Deployment)

#### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Test coverage ≥ 60% for critical paths
- [ ] No console errors in production build
- [ ] Linter passing (`npm run lint`)
- [ ] TypeScript compilation successful

#### Security
- [ ] No hardcoded secrets in codebase
- [ ] Environment variables configured
- [ ] RLS policies verified for all tables
- [ ] Supabase security linter passed
- [ ] CORS configured correctly in Edge Functions

#### Database
- [ ] Migrations tested in staging
- [ ] Backup taken before migration
- [ ] Rollback SQL scripts prepared
- [ ] Foreign key relationships validated

#### Configuration
- [ ] `VITE_SUPABASE_URL` set correctly
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` set correctly
- [ ] `VITE_SENTRY_DSN` configured (production only)
- [ ] `VITE_GA_MEASUREMENT_ID` configured (production only)

### 🟡 RECOMMENDED (Should Complete)

- [ ] Performance testing completed
- [ ] Load testing passed (100+ concurrent users)
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness validated
- [ ] Accessibility audit completed (WCAG 2.1 AA)
- [ ] Legal docs reviewed (Privacy Policy, Terms)
- [ ] CHANGELOG.md updated
- [ ] Release notes prepared

### ⚪ OPTIONAL

- [ ] Feature flags configured
- [ ] A/B test variants prepared
- [ ] Marketing materials ready
- [ ] Support documentation updated

---

## 3. STAGING DEPLOYMENT

### Purpose
- Test functionality in production-like environment
- Validate Edge Functions with real services
- Establish performance baselines
- Train team on deployment process

### Prerequisites
```bash
# 1. Ensure you're on the correct branch
git branch
# Should show: * main or * staging

# 2. Verify all changes committed
git status
# Should show: nothing to commit, working tree clean

# 3. Pull latest changes
git pull origin main
```

### Deployment Steps

#### Step 1: Database Migration (if needed)
```bash
# In Lovable interface:
# 1. Navigate to Cloud > Database
# 2. Click "Migrations" tab
# 3. Review pending migrations
# 4. Click "Run Migration"
# 5. Confirm execution
# 6. Verify migration success in logs
```

**Rollback Plan:** Keep rollback SQL ready
```sql
-- Example rollback for last migration
-- (Prepare specific SQL based on migration)
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
```

#### Step 2: Deploy Edge Functions
**Note:** Edge Functions auto-deploy with code push. No manual action needed.

Verify deployment:
```bash
# Check Edge Functions logs in Lovable Cloud interface
# Cloud > Edge Functions > View Logs
```

#### Step 3: Push to Main Branch
```bash
# All changes on main branch are auto-deployed to staging preview
git push origin main
```

#### Step 4: Wait for Build (2-5 minutes)
- Monitor build progress in Lovable interface
- Check for build errors in console
- Verify no red error indicators

#### Step 5: Verify Deployment
**Automated Checks:**
- [ ] Build completed successfully (green checkmark)
- [ ] No build errors in logs
- [ ] Preview URL accessible

**Manual Checks:**
- [ ] Visit preview URL
- [ ] Login/signup flow works
- [ ] Create a list
- [ ] Join a group
- [ ] Create an event
- [ ] Test AI suggestions
- [ ] Test product search
- [ ] Switch language (EN/ES)
- [ ] Switch theme (dark/light)
- [ ] Test on mobile device

#### Step 6: Performance Baseline
```bash
# Run Lighthouse audit
# 1. Open Preview URL in Chrome
# 2. Open DevTools (F12)
# 3. Navigate to "Lighthouse" tab
# 4. Select "Performance" and "Accessibility"
# 5. Click "Analyze page load"
# 6. Document scores:
#    - Performance: _____
#    - Accessibility: _____
#    - Best Practices: _____
#    - SEO: _____
#    - LCP: _____ seconds
#    - FID: _____ milliseconds
#    - CLS: _____
```

**Target Scores:**
- Performance: ≥ 90
- Accessibility: ≥ 95
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

---

## 4. PRODUCTION DEPLOYMENT

⚠️ **WARNING:** Only proceed if ALL P0 items from Phase 4 Report are resolved

### Prerequisites Validation

**Critical Checks:**
```bash
# 1. Test coverage
npm test -- --coverage
# Must show: Statements ≥ 60%, Branches ≥ 50%

# 2. Linter
npm run lint
# Must show: 0 errors

# 3. Build
npm run build
# Must complete without errors

# 4. Environment variables check
cat .env
# Verify all production values set
```

**Stakeholder Approvals:**
- [ ] Product Owner signed off
- [ ] QA Lead signed off
- [ ] Security Lead signed off
- [ ] Legal/Compliance signed off
- [ ] DevOps Lead signed off

### Deployment Window

**Recommended Time:** Tuesday-Thursday, 10:00-14:00 UTC
- Avoid Mondays (risky start of week)
- Avoid Fridays (no weekend support)
- Avoid late evening (team availability)

**Duration:** ~30 minutes (planned)

### Communication Plan

#### 1 Hour Before Deployment
- [ ] Send notification to all stakeholders
- [ ] Post in company Slack/Teams
- [ ] Notify support team
- [ ] Prepare status page update (if applicable)

**Email Template:**
```
Subject: [DEPLOYMENT] GiftApp v1.0.0 - Production Deployment in 1 Hour

Team,

We will be deploying GiftApp v1.0.0 to production today at [TIME].

Deployment Window: [START_TIME] - [END_TIME] UTC
Expected Downtime: None (zero-downtime deployment)
Rollback Plan: Prepared and tested

Key Changes:
- [List major features]

Monitoring:
- Sentry: [Dashboard URL]
- GA4: [Dashboard URL]
- Supabase: [Dashboard URL]

Emergency Contact: [ON_CALL_ENGINEER]

Thanks,
[YOUR_NAME]
```

### Production Deployment Steps

#### Step 1: Final Staging Verification (T-15 min)
```bash
# Run smoke tests on staging
# Verify:
- [ ] All critical user flows functional
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Edge Functions responding
```

#### Step 2: Database Backup (T-10 min)
```bash
# In Supabase dashboard:
# 1. Navigate to Database > Backups
# 2. Click "Create Backup"
# 3. Name: "pre-v1.0.0-production-deploy-YYYY-MM-DD"
# 4. Wait for backup completion
# 5. Verify backup shows as "Completed"
```

#### Step 3: Apply Database Migrations (T-5 min)
```bash
# In Lovable Cloud interface:
# 1. Navigate to Cloud > Database > Migrations
# 2. Review migration SQL
# 3. Click "Run Migration"
# 4. Monitor execution logs
# 5. Verify success message
```

**On Error:**
```bash
# Rollback immediately
# Execute rollback SQL prepared in pre-deployment
```

#### Step 4: Deploy to Production (T-0)
```bash
# Option A: Via Lovable UI
# 1. Go to Project > Settings > Domains
# 2. Click "Publish to Custom Domain"
# 3. Follow prompts

# Option B: Git tag deployment
git tag -a v1.0.0-prod -m "Production release v1.0.0"
git push origin v1.0.0-prod
```

#### Step 5: Real-Time Monitoring (T+0 to T+30 min)

**First 5 Minutes (CRITICAL):**
- [ ] Application loads (200 OK)
- [ ] No 500 errors in logs
- [ ] Login flow works
- [ ] Database queries executing
- [ ] Edge Functions responding

**Check Every Minute:**
```bash
# In separate terminal windows:

# Window 1: Supabase logs
# Cloud > Database > Logs > Real-time

# Window 2: Edge Function logs
# Cloud > Edge Functions > Logs > Real-time

# Window 3: Sentry errors
# [SENTRY_URL] > Issues > Real-time

# Window 4: Application
# Open browser, test user flows
```

**Metrics to Watch:**
- Error rate: Must stay < 1%
- Response time: Must stay < 2s average
- Database connection pool: Must stay < 80%
- Edge Function errors: Must be 0

**If ANY of these thresholds exceeded:**
→ Proceed to ROLLBACK (Section 6)

#### Step 6: Smoke Test in Production (T+5 min)

**Critical User Flows:**
1. [ ] Sign up new user
2. [ ] Log in existing user
3. [ ] Create gift list
4. [ ] Add items to list
5. [ ] Create group
6. [ ] Join group with code
7. [ ] Create event
8. [ ] Test AI gift suggestions
9. [ ] Test product search
10. [ ] Switch language
11. [ ] Switch theme
12. [ ] Log out

**Time Limit:** 10 minutes total
**On Failure:** Immediate rollback

#### Step 7: Extended Monitoring (T+30 min to T+4 hours)

**Every 30 Minutes:**
- [ ] Check error rate in Sentry
- [ ] Check GA4 real-time users
- [ ] Check Supabase metrics
- [ ] Review support tickets (if any)
- [ ] Test 2-3 random user flows

**Success Criteria (4 hours post-deploy):**
- Zero critical errors
- Response times stable
- No user-reported blockers
- Support tickets ≤ expected baseline

---

## 5. POST-DEPLOYMENT VALIDATION

### Immediate Validation (Within 1 Hour)

#### Health Checks
```bash
# Application
curl -I https://your-domain.com
# Expected: HTTP/2 200

# Edge Functions
curl https://your-project.supabase.co/functions/v1/search-products \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
# Expected: 200 OK

# Database (via Supabase)
# Dashboard > Database > Logs
# Verify: No connection errors
```

#### User-Facing Validation
- [ ] Homepage loads < 3 seconds
- [ ] Sign up creates account
- [ ] Email confirmation sent (check spam)
- [ ] Login redirects to dashboard
- [ ] All navigation links work
- [ ] No broken images
- [ ] No console errors

#### Analytics Validation
```bash
# Google Analytics 4
# 1. Open GA4 dashboard
# 2. Navigate to Real-time > Overview
# 3. Verify events firing:
#    - page_view
#    - sign_up (if tested)
#    - login (if tested)

# Sentry
# 1. Open Sentry dashboard
# 2. Navigate to Issues
# 3. Verify: No new critical errors
# 4. Check: Error rate < 1%
```

### Extended Validation (24-48 Hours)

#### Performance Monitoring
```bash
# Core Web Vitals
# 1. Chrome DevTools > Lighthouse
# 2. Run audit daily for 3 days
# 3. Document trends:
#    - LCP: Should stay < 2.5s
#    - FID: Should stay < 100ms
#    - CLS: Should stay < 0.1
```

#### User Feedback
- [ ] Monitor support email
- [ ] Check social media mentions
- [ ] Review app store reviews (if applicable)
- [ ] Analyze GA4 user behavior flow
- [ ] Check bounce rate (should be < 40%)

#### Database Health
```bash
# In Supabase Dashboard:
# 1. Database > Health
# 2. Check:
#    - Connection pool usage < 80%
#    - Query performance < 100ms average
#    - No slow query alerts
#    - Disk usage < 70%
```

---

## 6. ROLLBACK PROCEDURES

⚠️ **CRITICAL:** Practice rollback in staging before production deployment

### When to Rollback

**Immediate Rollback Required:**
- Error rate > 5%
- Database unavailable
- Critical security vulnerability discovered
- Data corruption detected
- Edge Functions completely failing

**Evaluate Rollback:**
- Error rate 2-5% sustained for > 15 minutes
- Performance degradation > 30%
- Major feature broken (but workaround exists)
- Multiple user complaints

### Rollback Methods

#### Method 1: Lovable UI Revert (FASTEST - 2 minutes)
```bash
# 1. Open Lovable project
# 2. Navigate to History
# 3. Find last stable version
# 4. Click "Revert to this version"
# 5. Confirm revert
# 6. Wait for redeployment (2-3 minutes)
```

**Pros:** Fastest, no Git knowledge needed
**Cons:** Doesn't rollback database migrations

---

#### Method 2: Git Revert (5 minutes)
```bash
# 1. Identify commit to revert to
git log --oneline -10
# Find last stable commit hash (e.g., abc123)

# 2. Create revert branch
git checkout -b rollback-v1.0.0

# 3. Revert to stable commit
git revert --no-commit HEAD~1..abc123
git commit -m "Rollback to stable version abc123"

# 4. Push (triggers auto-deploy)
git push origin rollback-v1.0.0

# 5. Merge to main
git checkout main
git merge rollback-v1.0.0
git push origin main
```

**Pros:** Full Git history preserved
**Cons:** Slower, requires Git knowledge

---

#### Method 3: Database Rollback (for schema issues)
```sql
-- ONLY IF DATABASE MIGRATION CAUSED ISSUE

-- 1. Connect to Supabase SQL editor

-- 2. Execute rollback SQL (prepared pre-deployment)
-- Example: Remove foreign key added in deployment
ALTER TABLE group_members 
DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- 3. Verify rollback
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'group_members';

-- 4. Test application
-- Verify: Issue resolved
```

**⚠️ WARNING:** Database rollbacks are IRREVERSIBLE. Ensure backup exists.

---

### Post-Rollback Actions

1. **Immediate (Within 5 minutes):**
   - [ ] Verify application functional
   - [ ] Test critical user flows
   - [ ] Check error rate dropped
   - [ ] Notify stakeholders of rollback

2. **Within 1 Hour:**
   - [ ] Document rollback reason
   - [ ] Log in AAHGPA audit log
   - [ ] Create post-mortem issue
   - [ ] Update status page (if applicable)

3. **Within 24 Hours:**
   - [ ] Root cause analysis
   - [ ] Fix deployment issue
   - [ ] Test fix in staging
   - [ ] Plan re-deployment

### Communication Template (Rollback)
```
Subject: [ROLLBACK] GiftApp v1.0.0 - Production Rollback Executed

Team,

We have rolled back the GiftApp v1.0.0 deployment due to [REASON].

Rollback Time: [TIME] UTC
Current Status: Application stable on previous version
User Impact: [DESCRIPTION]

Root Cause: [Brief description]
Next Steps: [Plan to fix and redeploy]

Post-Mortem: Scheduled for [DATE/TIME]

Apologies for any inconvenience.

[YOUR_NAME]
```

---

## 7. MONITORING AND ALERTS

### Monitoring Dashboards

#### Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/ghbksqyioendvispcseu

**Key Metrics:**
- Database > Logs (query performance)
- Database > Health (connection pool)
- Edge Functions > Logs (function errors)
- Auth > Users (signups, logins)

**Check Frequency:** Every 30 minutes (first 4 hours), then daily

---

#### Sentry Dashboard
**URL:** [Configure after Sentry setup]

**Key Metrics:**
- Error rate (target: < 1%)
- Issue count (target: < 5 new issues/day)
- User impact (target: < 10 users affected/day)
- Performance degradation alerts

**Check Frequency:** Real-time alerts configured

---

#### Google Analytics 4
**URL:** [Configure after GA4 setup]

**Key Metrics:**
- Real-time users (monitor spikes/drops)
- Page views (engagement)
- Events (user actions)
- Bounce rate (target: < 40%)
- Average session duration (target: > 2 minutes)

**Check Frequency:** Daily summary review

---

### Alert Configuration

#### Critical Alerts (Immediate Action)
- Error rate > 5% (check every 1 minute)
- Database unavailable
- Edge Function failure rate > 10%
- Response time > 5s (sustained 5 minutes)

**Action:** Page on-call engineer

---

#### High Priority Alerts (Action Within 15 Minutes)
- Error rate 2-5% (sustained 10 minutes)
- Response time 2-5s (sustained 15 minutes)
- Database connection pool > 80%
- Disk usage > 85%

**Action:** Notify DevOps team

---

#### Medium Priority Alerts (Action Within 1 Hour)
- Error rate 1-2% (sustained 30 minutes)
- New JavaScript error introduced
- Slow query detected (> 1s)
- Failed Edge Function invocation

**Action:** Create ticket, investigate

---

### On-Call Rotation

**Schedule:** [To be defined]

**Responsibilities:**
- Monitor alerts 24/7 during first week
- Respond to critical alerts within 5 minutes
- Execute rollback if necessary
- Document all incidents
- Conduct daily health checks

**Escalation:**
1. On-call engineer (5 min response)
2. DevOps lead (15 min response)
3. CTO/Engineering manager (30 min response)

---

## 8. TROUBLESHOOTING

### Common Issues and Solutions

#### Issue 1: Build Fails
**Symptoms:** Lovable build shows red error
**Diagnosis:**
```bash
# Check build logs in Lovable interface
# Common causes:
# - TypeScript errors
# - Missing dependencies
# - Syntax errors
```
**Solution:**
```bash
# Run build locally
npm run build
# Fix errors shown
# Commit and push
```

---

#### Issue 2: Database Connection Errors
**Symptoms:** "Failed to connect to database" errors
**Diagnosis:**
```bash
# In Supabase Dashboard:
# Database > Health
# Check connection pool usage
```
**Solution:**
```bash
# If pool exhausted:
# 1. Restart Supabase instance (Dashboard > Settings > Restart)
# 2. Review slow queries
# 3. Optimize queries with high execution count
```

---

#### Issue 3: Edge Function Timeouts
**Symptoms:** Functions return 504 Gateway Timeout
**Diagnosis:**
```bash
# Cloud > Edge Functions > Logs
# Look for timeout errors (> 10s execution)
```
**Solution:**
```bash
# 1. Review function code for infinite loops
# 2. Add timeout handling
# 3. Optimize external API calls
# 4. Consider caching responses
```

---

#### Issue 4: Authentication Not Working
**Symptoms:** Login/signup fails with "Invalid credentials"
**Diagnosis:**
```bash
# Supabase > Auth > Logs
# Check for auth errors
```
**Solution:**
```bash
# Common fixes:
# 1. Verify VITE_SUPABASE_URL and KEY correct
# 2. Check email confirmation required
# 3. Review RLS policies on profiles table
# 4. Clear browser cache and cookies
```

---

#### Issue 5: Groups Page Foreign Key Error
**Symptoms:** "Could not find relationship between group_members and profiles"
**Diagnosis:**
```bash
# Console logs show:
# "Searched for a foreign key relationship..."
```
**Solution:**
```bash
# Run migration to add foreign key:
ALTER TABLE public.group_members
ADD CONSTRAINT group_members_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;
```

---

#### Issue 6: Sentry Not Capturing Errors
**Symptoms:** No errors showing in Sentry dashboard
**Diagnosis:**
```bash
# Check src/lib/sentry.ts
# Verify initSentry() is not commented out
```
**Solution:**
```bash
# 1. Uncomment Sentry code (lines 15-82)
# 2. Add VITE_SENTRY_DSN to .env
# 3. Rebuild and redeploy
```

---

#### Issue 7: Performance Degradation
**Symptoms:** Slow page loads, unresponsive UI
**Diagnosis:**
```bash
# Run Lighthouse audit
# Check Core Web Vitals
```
**Solution:**
```bash
# Common fixes:
# 1. Enable code splitting (Vite lazy loading)
# 2. Optimize images (compression, WebP)
# 3. Add CDN for static assets
# 4. Review database query performance
# 5. Enable browser caching headers
```

---

## 9. EMERGENCY CONTACTS

### Engineering Team

| Role | Name | Email | Phone | Availability |
|------|------|-------|-------|--------------|
| DevOps Lead | [TBD] | devops@giftapp.com | [TBD] | 24/7 |
| Engineering Lead | [TBD] | eng@giftapp.com | [TBD] | Business hours |
| QA Lead | [TBD] | qa@giftapp.com | [TBD] | Business hours |
| Security Lead | [TBD] | security@giftapp.com | [TBD] | On-call |

### External Services

| Service | Support | Emergency Contact |
|---------|---------|-------------------|
| Lovable | support@lovable.dev | Dashboard > Support |
| Supabase | support@supabase.com | Dashboard > Support |
| Sentry | support@sentry.io | Dashboard > Support |

### Escalation Path

1. **On-Call Engineer** (0-5 min) → Diagnose and attempt fix
2. **DevOps Lead** (5-15 min) → Authorize rollback if needed
3. **Engineering Lead** (15-30 min) → Strategic decisions
4. **CTO** (30-60 min) → Executive decisions, external communication

### Communication Channels

- **Urgent:** Phone call + Slack @channel
- **High Priority:** Slack #engineering
- **Normal:** Slack #engineering or email
- **Status Updates:** Slack #general + email to stakeholders

---

## 📝 APPENDIX

### A. Environment Variables Reference

```bash
# Required for ALL environments
VITE_SUPABASE_URL=https://ghbksqyioendvispcseu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=ghbksqyioendvispcseu

# Required for PRODUCTION only
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### B. Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm test                 # Run tests
npm run lint             # Run linter

# Git
git log --oneline -20    # View recent commits
git diff HEAD~1          # Compare with previous commit
git tag -l               # List all tags
git show v1.0.0          # Show tag details

# Database
# Use Supabase Dashboard SQL Editor
```

### C. Resources

- **Project Documentation:** `/docs` folder
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **Lovable Docs:** https://docs.lovable.dev

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-11-10  
**Next Review:** Post-first-deployment
