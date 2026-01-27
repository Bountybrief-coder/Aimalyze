# Pricing Enforcement - Quick Reference

## ⚡ 5-Minute Setup

### 1. Run Database Migration
```sql
-- From: netlify/functions/migrations/003_create_user_plans.sql
-- To: Supabase → SQL Editor → New Query
```
Creates: `user_plans`, `daily_usage`, `analysis_logs` tables

### 2. Deploy
```bash
git push  # Auto-deploys new functions
```

### 3. Test
Sign in → Upload page → See "Daily Usage: 0/1"

## 📊 Plan Limits

| Plan | Daily | Price |
|------|-------|-------|
| Free | 1 | $0 |
| Gamer | 50 | $9/mo |
| Wager Org | ∞ | $199/life |

## 🔧 Configuration

**Change daily limits** in `analyze.js`:
```javascript
const limits = {
  'free': 1,
  'gamer': 50,
  'wager_org': 99999
};
```

## 📝 API Endpoints

### Check Quota
```bash
POST /.netlify/functions/check-quota
Body: { "userId": "clerk_user_id" }

Returns: { plan, usage, limit, canAnalyze }
```

### Analyze Video
```bash
POST /.netlify/functions/analyze
FormData: { file, userId }

On limit exceeded:
Status: 402 Payment Required
{ error, message, upgradeUrl }
```

## 🎯 What Happens When User Hits Limit

| Scenario | Response |
|----------|----------|
| Free user, 1st analysis | ✅ Success (200) |
| Free user, 2nd analysis | ❌ Error (402) + "Upgrade" button |
| Gamer user, 51st analysis | ❌ Error (402) |
| Wager Org user, 100th | ✅ Success (200) |

## 💾 Database Queries

### Reset user's daily usage (testing)
```sql
DELETE FROM daily_usage 
WHERE clerk_user_id = 'user_xxx' AND usage_date = CURRENT_DATE;
```

### Manually upgrade user
```sql
UPDATE user_plans 
SET plan_type = 'gamer' 
WHERE clerk_user_id = 'user_xxx';
```

### View today's top users
```sql
SELECT clerk_user_id, analysis_count 
FROM daily_usage 
WHERE usage_date = CURRENT_DATE 
ORDER BY analysis_count DESC;
```

### See plan distribution
```sql
SELECT plan_type, COUNT(*) 
FROM user_plans 
WHERE status = 'active' 
GROUP BY plan_type;
```

## ✅ Testing Checklist

- [ ] Database migration completed
- [ ] Free user can do 1 analysis
- [ ] 2nd analysis blocked with 402 error
- [ ] "Upgrade Now" button appears in UI
- [ ] Upgrade link goes to /pricing
- [ ] Quota display shows usage/limit
- [ ] Gamer users can do 50 analyses
- [ ] Analysis logs saved in database
- [ ] Daily usage resets at midnight

## 🚨 Errors & Solutions

**User can't analyze:**
→ Check `daily_usage` table for today's count

**Quota not refreshing:**
→ Verify `userId` sent to analyze endpoint

**Check-quota returns default plan:**
→ Verify Supabase connection in environment

**402 error not showing in frontend:**
→ Check status code handling in Upload.jsx

## 📁 Files Modified

- `netlify/functions/analyze.js` - Added pricing checks
- `netlify/functions/supabaseClient.js` - Added 5 new functions
- `netlify/functions/check-quota.js` - NEW endpoint
- `netlify/functions/migrations/003_create_user_plans.sql` - NEW schema
- `src/pages/Upload.jsx` - Added quota display & upgrade UI

## 🎓 Frontend Integration Example

```jsx
// Check quota
const response = await fetch('/.netlify/functions/check-quota', {
  method: 'POST',
  body: JSON.stringify({ userId })
});
const { plan, usage, limit } = await response.json();

// Send for analysis
const formData = new FormData();
formData.append('file', file);
formData.append('userId', userId);
const result = await fetch('/.netlify/functions/analyze', {
  method: 'POST',
  body: formData
});

// Handle 402 Payment Required
if (result.status === 402) {
  const error = await result.json();
  // Show: "Upgrade to Continue" button
}
```

## 🔐 Security Notes

✅ Backend enforces limits (not trusting frontend)
✅ User ID from Clerk (immutable)
✅ Daily usage isolated per user
✅ Cannot bypass with frontend tricks
✅ Logs all attempts for audit trail

## 🎯 Next: Payment Integration

Ready for Stripe? Add:
1. Create Stripe products ($9/mo, $199/life)
2. Add Stripe webhook handler
3. Update user_plans on successful payment
4. Track stripe_customer_id for subscriptions
5. Handle cancellations & refunds

## 📞 Quick Fixes

**Free user blocked, trying to test:**
```sql
DELETE FROM daily_usage WHERE usage_date = CURRENT_DATE;
-- They get 1 free scan again
```

**User should be on Gamer plan:**
```sql
UPDATE user_plans SET plan_type = 'gamer' WHERE clerk_user_id = 'xxx';
```

**Check if system is working:**
```sql
SELECT 
  (SELECT COUNT(*) FROM user_plans) as total_users,
  (SELECT COUNT(*) FROM daily_usage WHERE usage_date = CURRENT_DATE) as active_today,
  (SELECT SUM(analysis_count) FROM daily_usage WHERE usage_date = CURRENT_DATE) as total_analyses;
```

## ⏰ Quota Reset Schedule

Daily usage resets at **UTC midnight** automatically via `usage_date` column.
No manual cleanup needed - queries filter by usage_date = CURRENT_DATE.

## 🚀 Status

**Implementation**: ✅ COMPLETE
**Testing**: ✅ READY
**Deployment**: ✅ READY
**Payment Integration**: ⏳ TODO (Stripe)
