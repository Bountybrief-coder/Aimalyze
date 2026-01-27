# Pricing Logic Enforcement - Setup & Implementation Guide

## 📋 Overview

A complete pricing enforcement system has been implemented to:
- Track user subscription plans (Free, Gamer, Wager Org)
- Enforce daily usage limits per plan
- Block users who exceed their free quota
- Show frontend UI prompting upgrade
- Log all analysis requests for analytics

## 🎯 Features Implemented

### Plan Tiers & Daily Limits
| Plan | Daily Limit | Cost |
|------|-------------|------|
| **Free** | 1 analysis | Free |
| **Gamer** | 50 analyses | $9/month |
| **Wager Org** | Unlimited | $199 lifetime |

### Enforcement Points
✅ **Backend**: Analyze endpoint checks plan + usage before processing
✅ **Frontend**: Upload page shows current quota and upgrade CTA
✅ **Database**: Tracks daily usage per user per day
✅ **Logging**: All analyses logged with file, verdict, confidence
✅ **Error Handling**: Returns 402 Payment Required when limit exceeded

### How It Works

```
1. User uploads video
   ↓
2. Frontend calls check-quota endpoint
   ├─ Returns: plan, current_usage, daily_limit
   └─ Shows quota display in UI
   ↓
3. User clicks "Analyze"
   ├─ Frontend checks: usage < limit?
   └─ If false, shows "Upgrade to Continue"
   ↓
4. If allowed, send to analyze endpoint
   ├─ Backend re-checks user plan & quota
   ├─ If exceeded, returns 402 error
   ├─ If allowed, processes analysis
   ├─ Logs result to database
   └─ Increments daily usage
   ↓
5. Frontend updates quota display
```

## 📁 Files Created/Modified

### New Backend Functions
- `netlify/functions/check-quota.js` - Returns user's current quota
- `netlify/functions/migrations/003_create_user_plans.sql` - Database schema

### Extended Modules
- `netlify/functions/supabaseClient.js` - Added 5 new functions
- `netlify/functions/analyze.js` - Added pricing checks

### Frontend Updates
- `src/pages/Upload.jsx` - Added quota display and upgrade UI

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Migration
```sql
-- Copy from: netlify/functions/migrations/003_create_user_plans.sql
-- Paste in: Supabase → SQL Editor → New Query
-- Execute
```

This creates:
- `user_plans` table - Stores user subscription plans
- `daily_usage` table - Tracks daily analysis count per user
- `analysis_logs` table - Detailed analysis request logs
- 6 indexes for performance
- 2 views for analytics
- PostgreSQL function for plan checking

### Step 2: Deploy
```bash
git push  # Netlify auto-deploys new functions
```

### Step 3: Test the Setup

#### Test User Sign-up & Default Plan
1. Create new account in Clerk
2. Check Supabase: `SELECT * FROM user_plans WHERE clerk_user_id = 'user_xxx';`
3. Should show: `plan_type: 'free', status: 'active'`

#### Test Free Tier Limit
1. Sign in with free account
2. Go to Upload page
3. Should show: "Daily Usage: 0/1"
4. Upload and analyze one video → Success ✓
5. Try to analyze second video → Error ✗ "Upgrade to Continue"

#### Test Quota Check Endpoint
```bash
curl -X POST https://your-domain/.netlify/functions/check-quota \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_xxx"}'

# Response:
# {
#   "plan": "free",
#   "usage": 1,
#   "limit": 1,
#   "canAnalyze": false
# }
```

#### Test Analyze Endpoint
```bash
# Create FormData with file and userId
# POST to /.netlify/functions/analyze

# When quota exceeded, returns:
# {
#   "error": "Usage limit reached",
#   "message": "Free plan limited to 1 analysis per day. Upgrade to continue.",
#   "usage": 1,
#   "limit": 1,
#   "plan": "free",
#   "upgradeUrl": "/pricing"
# }
# Status: 402 Payment Required
```

## 🗄️ Database Schema

### user_plans Table
```sql
clerk_user_id    VARCHAR(255) PRIMARY KEY
plan_type        VARCHAR(50) - 'free', 'gamer', 'wager_org'
status           VARCHAR(50) - 'active', 'paused', 'cancelled'
created_at       TIMESTAMP
stripe_customer_id VARCHAR(255) - For future Stripe integration
stripe_subscription_id VARCHAR(255) - For future Stripe integration
```

### daily_usage Table
```sql
clerk_user_id    VARCHAR(255)
usage_date       DATE - Today's date
analysis_count   INT - Number of analyses done today
created_at       TIMESTAMP
updated_at       TIMESTAMP
UNIQUE(clerk_user_id, usage_date)
```

### analysis_logs Table
```sql
clerk_user_id    VARCHAR(255)
file_name        VARCHAR(255)
file_size_mb     NUMERIC
analysis_result  TEXT - JSON string of full result
verdict          VARCHAR(255) - 'Cheating Likely', 'Clean Gameplay'
confidence       INT - 0-100
created_at       TIMESTAMP
```

## 🔌 API Endpoints

### GET/POST /.netlify/functions/check-quota

**Request:**
```json
{
  "userId": "clerk_user_id"
}
```

**Response (200 OK):**
```json
{
  "plan": "free|gamer|wager_org",
  "status": "active|paused|cancelled",
  "usage": 0,
  "limit": 1|50|99999,
  "canAnalyze": true|false
}
```

### POST /.netlify/functions/analyze

**Request:** FormData with:
- `file` - Video file
- `userId` - Clerk user ID

**Response (200 OK) - Success:**
```json
{
  "cheatingDetected": true|false,
  "confidence": 95,
  "verdict": "Clean Gameplay",
  "explanation": "..."
}
```

**Response (402 Payment Required) - Quota Exceeded:**
```json
{
  "error": "Usage limit reached",
  "message": "Free plan limited to 1 analysis per day. Upgrade to continue.",
  "usage": 1,
  "limit": 1,
  "plan": "free",
  "upgradeUrl": "/pricing"
}
```

## 💻 Frontend Integration

### Upload Component Changes
```jsx
// Now includes:
- userPlan state (fetched from check-quota)
- usage state (current daily usage)
- Quota display showing: "Daily Usage: 1/1"
- Upgrade button if free plan limit reached
- Error handling for 402 Payment Required

// Calls check-quota on mount to display quota
// Calls analyze with userId for backend tracking
// Refreshes quota after successful analysis
```

### Quota Display UI
Shows colored badge with:
- Current plan (Free, Gamer, Wager Org)
- Daily usage (0/1, 25/50, 45/∞)
- "Upgrade Now" button if limit reached
- Remaining scans counter if within limit

## 🔒 Security & Validation

### Backend Enforcement (Backend is Source of Truth)
✅ User plan checked in analyze.js before processing
✅ Daily usage re-checked from database (not trusting frontend)
✅ Cannot be bypassed by frontend manipulation
✅ Logs all attempts (allowed and blocked)

### Frontend Validation (Better UX)
✅ Pre-checks quota before allowing upload
✅ Shows immediate feedback to user
✅ Prevents unnecessary processing
✅ Smooth upgrade experience

### Data Protection
✅ Clerk user IDs used (unique, immutable)
✅ UTC timestamps for consistency
✅ User isolation via RLS policies
✅ No sensitive data logged

## 📊 Monitoring Queries

### View User Plans
```sql
SELECT clerk_user_id, plan_type, status, created_at
FROM user_plans
WHERE status = 'active'
ORDER BY created_at DESC;
```

### View Today's Usage
```sql
SELECT clerk_user_id, analysis_count
FROM daily_usage
WHERE usage_date = CURRENT_DATE
ORDER BY analysis_count DESC;
```

### Find Users Who Hit Limit
```sql
SELECT 
  up.clerk_user_id,
  up.plan_type,
  du.analysis_count,
  du.usage_date
FROM user_plans up
JOIN daily_usage du ON up.clerk_user_id = du.clerk_user_id
WHERE du.usage_date = CURRENT_DATE
  AND ((up.plan_type = 'free' AND du.analysis_count >= 1)
       OR (up.plan_type = 'gamer' AND du.analysis_count >= 50))
ORDER BY du.analysis_count DESC;
```

### View Analysis Logs
```sql
SELECT 
  clerk_user_id,
  file_name,
  verdict,
  confidence,
  created_at
FROM analysis_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Get Plan Statistics
```sql
SELECT 
  plan_type,
  COUNT(*) as user_count,
  AVG(daily_usage.analysis_count) as avg_usage
FROM user_plans
LEFT JOIN daily_usage ON user_plans.clerk_user_id = daily_usage.clerk_user_id
WHERE user_plans.status = 'active'
GROUP BY plan_type;
```

## ⚙️ Configuration

### Change Daily Limits
Edit in `netlify/functions/analyze.js` and `netlify/functions/check-quota.js`:

```javascript
const limits = {
  'free': 1,          // Change this
  'gamer': 50,        // Change this
  'wager_org': 99999  // Change this
};
```

### Change Limit Enforcement Response
Edit the 402 error response in `analyze.js`:

```javascript
return new Response(JSON.stringify({
  error: 'Custom error message',
  message: 'Custom user-facing message',
  upgradeUrl: '/custom-upgrade-page'
}), { status: 402 });
```

## 🎯 Upgrade Path (Future Integration)

### With Stripe Payment
```
1. User clicks "Upgrade Now" button
2. Redirected to Stripe checkout
3. Payment processed
4. Stripe webhook received
5. Update user_plans table: plan_type = 'gamer'
6. User can immediately analyze more
```

### Manual Plan Updates (For Now)
```sql
-- Manually upgrade user to Gamer plan
UPDATE user_plans
SET plan_type = 'gamer'
WHERE clerk_user_id = 'user_xxx';

-- Upgrade to Wager Org (lifetime)
UPDATE user_plans
SET plan_type = 'wager_org'
WHERE clerk_user_id = 'user_xxx';
```

## 🐛 Troubleshooting

### Quota Always Shows 0/1 Even After Analysis
1. Check that user ID is being sent to analyze endpoint
2. Verify daily_usage table has an entry:
   ```sql
   SELECT * FROM daily_usage WHERE clerk_user_id = 'user_xxx' AND usage_date = CURRENT_DATE;
   ```
3. Check Netlify function logs for `[USAGE LOGGED]` message

### User Can't Analyze on Free Plan
1. Check their usage: `SELECT * FROM daily_usage WHERE clerk_user_id = 'user_xxx' AND usage_date = CURRENT_DATE;`
2. If usage >= 1, they've hit the limit (working as intended!)
3. To reset manually:
   ```sql
   DELETE FROM daily_usage WHERE clerk_user_id = 'user_xxx' AND usage_date = CURRENT_DATE;
   ```

### analyze.js Throwing Errors
1. Check that supabaseClient functions are imported correctly
2. Verify Supabase credentials are set in environment
3. Check Netlify function logs for detailed error messages

### Quota Display Not Showing in Frontend
1. Check browser console for fetch errors
2. Verify check-quota endpoint is deployed
3. Check that userId is being passed correctly from Clerk
4. Monitor network tab to see request/response

## 📚 Testing Checklist

- [ ] Database migration runs without errors
- [ ] Free user can analyze 1 video per day
- [ ] Free user blocked on 2nd analysis
- [ ] Error message shown in frontend: "Upgrade to continue"
- [ ] Quota display shows correct usage
- [ ] Upgrade button visible when limit reached
- [ ] Gamer plan users can do 50 analyses
- [ ] Wager Org users have unlimited analyses
- [ ] Analysis logs appear in database
- [ ] Each analysis increments daily usage by 1
- [ ] Quota resets at midnight UTC
- [ ] Manual plan upgrade works

## 🎓 Code Examples

### Check Quota in Frontend
```jsx
const response = await fetch('/.netlify/functions/check-quota', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId })
});
const { plan, usage, limit } = await response.json();
```

### Send Analysis Request
```jsx
const formData = new FormData();
formData.append('file', file);
formData.append('userId', userId);

const response = await fetch('/.netlify/functions/analyze', {
  method: 'POST',
  body: formData
});

if (response.status === 402) {
  // Quota exceeded - show upgrade UI
} else if (response.ok) {
  // Success - show results
}
```

### Check User Plan (Backend)
```javascript
import { getUserPlan, getTodayUsage, checkAnalysisQuota } from './supabaseClient.js';

// Get plan
const plan = await getUserPlan(clerkUserId);
console.log(plan.plan_type); // 'free', 'gamer', or 'wager_org'

// Get usage
const usage = await getTodayUsage(clerkUserId);
console.log(usage.analysis_count); // 0, 1, 25, etc.

// Check if can analyze (all in one)
const quota = await checkAnalysisQuota(clerkUserId);
if (!quota.allowed) {
  // Show error
}
```

## 🚀 Next Steps

1. **Run database migration** - Copy SQL from 003_create_user_plans.sql
2. **Deploy** - `git push` triggers Netlify redeploy
3. **Test free tier limit** - Create account, upload 2 videos
4. **Monitor quota** - Check Supabase daily_usage table
5. **Integrate payment** - Add Stripe for real revenue
6. **Track analytics** - Monitor plan distribution in Supabase
7. **Optimize tiers** - Adjust limits based on usage patterns

## 📞 Support

### Common Tasks

**Manually upgrade a user:**
```sql
UPDATE user_plans SET plan_type = 'gamer' WHERE clerk_user_id = 'user_xxx';
```

**Reset daily usage for testing:**
```sql
DELETE FROM daily_usage WHERE usage_date = CURRENT_DATE;
```

**View all active users:**
```sql
SELECT COUNT(*) FROM user_plans WHERE status = 'active';
```

**See revenue potential:**
```sql
SELECT 
  plan_type,
  COUNT(*) as users,
  CASE WHEN plan_type = 'gamer' THEN 9 * COUNT(*)
       WHEN plan_type = 'wager_org' THEN 199
       ELSE 0
  END as monthly_revenue
FROM user_plans
WHERE status = 'active'
GROUP BY plan_type;
```
