# Signup Abuse Prevention - Setup Guide

This guide covers the complete setup of the IP-based signup abuse prevention system to prevent fake accounts via Clerk.

## 📋 Overview

The system prevents signup abuse through:

1. **IP Rate Limiting**: Max 2 accounts per IP per 24 hours (configurable)
2. **Temporary Email Blocking**: Blocks disposable email services (mailinator, yopmail, etc.)
3. **Webhook Tracking**: Logs all signups with IP + email for analytics
4. **Pre-signup Verification**: Frontend can check before user submits signup

## 🗂️ Files Created

### Backend Functions
- `netlify/functions/clerk-webhook.js` - Handles Clerk signup webhooks
- `netlify/functions/signup-verify.js` - Pre-signup verification endpoint
- `netlify/functions/migrations/002_create_account_tracking.sql` - Database schema

### Frontend
- `src/hooks/useSignupVerification.js` - React hook for pre-signup checks

### Configuration
- `package.json` - Added `svix` dependency (Clerk's webhook library)

## ⚙️ Setup Steps

### Step 1: Create Database Tables

1. Go to your Supabase dashboard
2. Open **SQL Editor**
3. Create new query
4. Copy and run the SQL from `netlify/functions/migrations/002_create_account_tracking.sql`

**This creates:**
- `account_signups` table - Tracks all account creation attempts
- `blocked_email_domains` table - Pre-populated with 12 temporary email services
- Indexes for efficient queries
- Analytics views for monitoring

### Step 2: Get Clerk Webhook Secret

1. Go to **Clerk Dashboard** (dashboard.clerk.com)
2. Navigate to **Settings → Webhooks**
3. Click **Create Endpoint**
4. Enter webhook URL: `https://your-domain.netlify.app/.netlify/functions/clerk-webhook`
5. Subscribe to: **user.created**
6. Copy the **Signing Secret**

### Step 3: Add Environment Variables to Netlify

In your Netlify Dashboard:

1. Go to **Site Settings → Environment**
2. Add new environment variable:

```
CLERK_WEBHOOK_SECRET = [paste the signing secret from Step 2]
```

**Must also have (should already exist):**
```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your_anon_key
```

### Step 4: Install Dependencies

```bash
npm install svix
```

The `svix` package is needed for validating Clerk webhook signatures.

### Step 5: Deploy

```bash
git add -A
git commit -m "Add signup abuse prevention with IP tracking and email domain blocking"
git push
```

Netlify will automatically deploy the new functions.

### Step 6: Test the Setup

#### Test 1: Verify Webhook is Working

1. Create a test user in Clerk
2. Check your Netlify function logs (Functions tab → click clerk-webhook)
3. You should see: `[SIGNUP DETECT] New user: ...`

#### Test 2: Test Rate Limiting

Use curl to simulate multiple signups from the same IP:

```bash
# Request 1 - Should succeed
curl -X POST https://your-domain.netlify.app/.netlify/functions/signup-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com"}'
# Response: {"allowed": true}

# Request 2 - Should succeed
curl -X POST https://your-domain.netlify.app/.netlify/functions/signup-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com"}'
# Response: {"allowed": true}

# Request 3 - Should be blocked
curl -X POST https://your-domain.netlify.app/.netlify/functions/signup-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test3@example.com"}'
# Response: {"allowed": false, "reason": "Too many accounts created from this IP..."}
```

#### Test 3: Test Temp Email Blocking

```bash
curl -X POST https://your-domain.netlify.app/.netlify/functions/signup-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mailinator.com"}'
# Response: {"allowed": false, "reason": "Temporary email domains are not allowed..."}
```

## 🎨 Frontend Integration

### Using the Hook in Your Signup Component

```jsx
import { useSignupVerification } from '../hooks/useSignupVerification';

function SignupForm() {
  const { checkSignup, isLoading, error } = useSignupVerification();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check before attempting signup
    const result = await checkSignup(email);
    
    if (!result.allowed) {
      // Show error message
      alert(result.reason);
      return;
    }

    // Proceed with Clerk signup
    // SignUp component will handle the rest
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Checking...' : 'Sign Up'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

### Direct API Call

If not using React, call the endpoint directly:

```javascript
async function verifySignup(email) {
  const response = await fetch('/.netlify/functions/signup-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const result = await response.json();
  return result;
}

// Usage
const result = await verifySignup('user@example.com');
if (result.allowed) {
  console.log('Safe to signup');
} else {
  console.log('Blocked:', result.reason);
}
```

## 📊 Monitoring & Analytics

### View Recent Signups

```sql
SELECT 
  clerk_user_id, 
  email, 
  ip_address, 
  email_domain,
  blocked,
  created_at
FROM account_signups
ORDER BY created_at DESC
LIMIT 20;
```

### Find Suspicious IPs (multiple signups)

```sql
SELECT ip_address, COUNT(*) as signup_count
FROM account_signups
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) >= 2
ORDER BY signup_count DESC;
```

### View Blocked Signups

```sql
SELECT 
  clerk_user_id,
  email,
  ip_address,
  block_reason,
  created_at
FROM account_signups
WHERE blocked = TRUE
ORDER BY created_at DESC;
```

### Get Signup Analytics (use the view)

```sql
SELECT * FROM signup_analytics;
```

### Find Suspicious IPs (use the view)

```sql
SELECT * FROM suspicious_ips;
```

## ⚙️ Configuration

### Adjust Rate Limits

Edit `netlify/functions/clerk-webhook.js` and `netlify/functions/signup-verify.js`:

```javascript
const MAX_SIGNUPS_PER_IP = 2; // Change this
const SIGNUP_WINDOW_HOURS = 24; // Change this
```

**Note:** Must update both files to keep them in sync.

### Add/Remove Temporary Email Domains

In Supabase SQL Editor:

```sql
-- Add a new domain
INSERT INTO blocked_email_domains (domain, reason, active)
VALUES ('example-temp.com', 'Temporary email service', TRUE);

-- Remove a domain
UPDATE blocked_email_domains
SET active = FALSE
WHERE domain = 'example-temp.com';
```

### Allow Specific IPs (Whitelist)

```sql
-- Create a whitelist table
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id BIGSERIAL PRIMARY KEY,
  ip_address VARCHAR(45) UNIQUE,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Then update the signup checks to skip whitelisted IPs
-- (Would need code changes to implement)
```

## 🔍 How It Works

```
User visits signup page
  ↓
Frontend calls POST /.netlify/functions/signup-verify with email
  ↓
Function checks:
  1. Is email domain blocked (mailinator, yopmail, etc)?
  2. Has IP created 2+ accounts in last 24h?
  ↓
If either check fails:
  └→ Return { allowed: false, reason: "..." }
     Frontend shows error: "Too many accounts created from this IP"
     User cannot proceed

If checks pass:
  └→ Return { allowed: true }
     User can proceed with Clerk signup
     ↓
User completes Clerk signup
  ↓
Clerk sends user.created webhook
  ↓
clerk-webhook.js receives event
  ↓
Checks again (optional - double verification)
  ↓
Logs signup to account_signups table
  └→ { clerk_user_id, email, ip_address, email_domain, ... }
```

## 🚨 Error Responses

### Rate Limited

```json
{
  "allowed": false,
  "reason": "Too many accounts created from this IP. Please try again later.",
  "details": "Too many accounts created from this IP (2/2 in 24 hours)",
  "rateLimited": true,
  "resetTime": "2024-01-28T10:30:45.123Z",
  "count": 2
}
```

### Temporary Email Domain

```json
{
  "allowed": false,
  "reason": "Temporary email domains are not allowed. Please use a permanent email address.",
  "blockedDomain": true
}
```

### Allowed

```json
{
  "allowed": true,
  "message": "Signup check passed",
  "count": 1,
  "remaining": 1
}
```

## 🔐 Security Notes

✅ **IP Extraction**: Supports proxies and load balancers (CF-Connecting-IP, X-Forwarded-For, etc.)
✅ **Webhook Verification**: Uses Svix to verify Clerk signature (no spoofing)
✅ **Database Security**: Uses Supabase RLS to restrict table access
✅ **Fail Safe**: If verification service is down, signup is allowed (fail open)
✅ **No Email Verification**: Doesn't send emails, just blocks IPs
✅ **Automatic Cleanup**: Doesn't mention (but could add) to keep logs manageable

## 📝 Temporary Email Domains Blocked

Pre-populated blocklist includes:
- mailinator.com
- tempmail.com
- yopmail.com
- 10minutemail.com
- throwaway.email
- temp-mail.org
- trashmail.com
- fakeinbox.com
- sharklasers.com
- spam4.me
- tempmail.us
- maildrop.cc

Add more in Supabase as needed.

## 🐛 Troubleshooting

### Webhook Not Triggering

1. Verify CLERK_WEBHOOK_SECRET is set in Netlify
2. Check Clerk webhook endpoint is: `https://your-domain.netlify.app/.netlify/functions/clerk-webhook`
3. Check Netlify function logs for errors
4. Ensure user.created event is enabled in Clerk

### Rate Limiting Not Working

1. Verify account_signups table exists in Supabase
2. Run: `SELECT * FROM account_signups LIMIT 1;` - should not error
3. Check that SUPABASE_URL and SUPABASE_ANON_KEY are set
4. Look at Netlify function logs for SQL errors

### Frontend Verification Not Working

1. Test endpoint: `curl -X POST https://your-domain/.netlify/functions/signup-verify`
2. Check browser console for fetch errors
3. Verify endpoint returns JSON with `allowed` field

### High Latency

- Normal: Signup-verify adds ~100-200ms (one DB query)
- Webhook: Async, doesn't affect user experience
- Optimize: Add caching for blocked domains if needed

## 📞 Next Steps

1. **Monitor**: Check signup_analytics view daily
2. **Adjust**: Tune MAX_SIGNUPS_PER_IP based on abuse patterns
3. **Whitelist**: Add known good IPs (corporate, universities) if false positives
4. **Dashboard**: Build Supabase dashboard for visual monitoring
5. **Alerts**: Set up email alerts for spike in blocked signups
6. **Extend**: Add IP blocking (manual blacklist) for repeat offenders

## 💡 Optional Enhancements

### Email Verification for Blocked IPs

When signup is blocked, require email verification:
- Send confirmation code to email
- User enters code to bypass IP limit

### IP Reputation Scoring

Check IP against known lists:
- MaxMind GeoIP (geolocation validation)
- AbuseIPDB (check if IP is known for abuse)

### Device Fingerprinting

Add browser fingerprinting to detect device reuse:
- Track multiple accounts from same device
- Even if IP changes

### Gradual Signup Limits

Increase limit based on account age:
- New accounts: 1 per IP
- 7-day old: 2 per IP
- 30-day old: 5 per IP

### Manual Review Queue

For borderline cases:
- Flag suspicious signups for manual review
- Approve/reject manually before full access
