# Signup Abuse Prevention - Quick Reference

## 🎯 What Was Implemented

✅ **IP Rate Limiting** - Max 2 accounts per IP per 24 hours
✅ **Temporary Email Blocking** - Blocks 12 disposable email services
✅ **Webhook Integration** - Automatic logging of all signups via Clerk
✅ **Pre-signup Verification** - Frontend can check before user attempts signup
✅ **Detailed Logging** - All signups tracked with IP, email domain, timestamp

## 📁 Files Created

| File | Purpose |
|------|---------|
| `netlify/functions/clerk-webhook.js` | Handles Clerk signup webhooks |
| `netlify/functions/signup-verify.js` | Pre-signup verification endpoint |
| `netlify/functions/migrations/002_create_account_tracking.sql` | Database setup |
| `src/hooks/useSignupVerification.js` | React hook for frontend checks |
| `SIGNUP_ABUSE_PREVENTION.md` | Complete setup guide |

## 🚀 Setup (10 minutes)

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor, run the SQL from:
-- netlify/functions/migrations/002_create_account_tracking.sql

-- Creates:
-- - account_signups table
-- - blocked_email_domains table (pre-populated with 12 services)
-- - Analytics views
```

### 2. Get Clerk Webhook Secret
- Go to Clerk Dashboard → Settings → Webhooks
- Create endpoint: `https://your-domain.netlify.app/.netlify/functions/clerk-webhook`
- Subscribe to: `user.created`
- Copy signing secret

### 3. Add Environment Variable
In Netlify Dashboard → Site Settings → Environment:
```
CLERK_WEBHOOK_SECRET = [your signing secret]
```

### 4. Deploy
```bash
npm install svix  # Already done
git push  # Already pushed
```

## 🔍 How It Works

```
User enters email on signup page
  ↓
Frontend calls signup-verify endpoint
  ↓
Function checks:
  ✓ Email domain not in blocklist?
  ✓ IP hasn't created 2+ accounts in 24h?
  ↓
If blocked:
  └→ Return error "Too many accounts from this IP"
  
If allowed:
  └→ User proceeds to Clerk signup
     ↓
     Clerk webhook triggers
     ↓
     clerk-webhook.js logs signup
     ↓
     Stored in account_signups table
```

## 📊 Testing

### Test Rate Limiting (3 requests)

```bash
# Request 1 - Allowed
curl -X POST https://your-domain.netlify.app/.netlify/functions/signup-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com"}'

# Request 2 - Allowed
curl -X POST https://your-domain.netlify.app/.netlify/functions/signup-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com"}'

# Request 3 - BLOCKED ❌
curl -X POST https://your-domain.netlify.app/.netlify/functions/signup-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test3@example.com"}'
# Response: { "allowed": false, "reason": "Too many accounts created..." }
```

### Test Temp Email Blocking

```bash
curl -X POST https://your-domain.netlify.app/.netlify/functions/signup-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mailinator.com"}'
# Response: { "allowed": false, "reason": "Temporary email domains..." }
```

## 💻 Frontend Usage

### With React Hook

```jsx
import { useSignupVerification } from '../hooks/useSignupVerification';

function SignupForm() {
  const { checkSignup, isLoading, error } = useSignupVerification();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await checkSignup(email);
    
    if (!result.allowed) {
      alert(result.reason);
      return;
    }
    
    // Proceed with Clerk signup
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button disabled={isLoading}>{isLoading ? 'Checking...' : 'Sign Up'}</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </form>
  );
}
```

### Direct API Call

```javascript
const result = await fetch('/.netlify/functions/signup-verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
}).then(r => r.json());

if (!result.allowed) {
  console.log(result.reason);
} else {
  console.log('Safe to signup');
}
```

## 📈 Monitoring Queries

### View Recent Signups
```sql
SELECT clerk_user_id, email, ip_address, blocked, created_at
FROM account_signups
ORDER BY created_at DESC
LIMIT 20;
```

### Find Suspicious IPs
```sql
SELECT ip_address, COUNT(*) as count
FROM account_signups
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) >= 2;
```

### View Blocked Signups
```sql
SELECT * FROM account_signups WHERE blocked = TRUE;
```

### Use Built-in Views
```sql
SELECT * FROM signup_analytics;      -- Quick overview
SELECT * FROM suspicious_ips;        -- IPs with multiple signups
```

## ⚙️ Configuration

### Change Rate Limits
Edit both files:
- `netlify/functions/clerk-webhook.js`
- `netlify/functions/signup-verify.js`

```javascript
const MAX_SIGNUPS_PER_IP = 2;      // Change this
const SIGNUP_WINDOW_HOURS = 24;    // Change this
```

### Add Temp Email Domains
```sql
INSERT INTO blocked_email_domains (domain, reason, active)
VALUES ('newtempmail.com', 'Temp email service', TRUE);
```

### Remove Domains
```sql
UPDATE blocked_email_domains SET active = FALSE WHERE domain = 'example.com';
```

## 🚫 Blocked Email Domains

Pre-populated list:
- mailinator.com, tempmail.com, yopmail.com
- 10minutemail.com, throwaway.email, temp-mail.org
- trashmail.com, fakeinbox.com, sharklasers.com
- spam4.me, tempmail.us, maildrop.cc

## 📊 Response Examples

### Allowed
```json
{
  "allowed": true,
  "message": "Signup check passed",
  "count": 1,
  "remaining": 1
}
```

### Rate Limited
```json
{
  "allowed": false,
  "reason": "Too many accounts created from this IP. Please try again later.",
  "rateLimited": true,
  "resetTime": "2024-01-28T10:30:45.123Z",
  "count": 2
}
```

### Temp Email Blocked
```json
{
  "allowed": false,
  "reason": "Temporary email domains are not allowed. Please use a permanent email address.",
  "blockedDomain": true
}
```

## 🔐 Security Features

✅ Clerk webhook signature verification (Svix)
✅ IP extraction from proxies (CF-Connecting-IP, X-Forwarded-For)
✅ Database RLS policies
✅ Supabase anon key restricted access
✅ Fail-safe (allows signup if service down)
✅ No sensitive data logged

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not triggering | Verify CLERK_WEBHOOK_SECRET in Netlify env |
| Rate limit not working | Verify account_signups table exists in Supabase |
| "Too many accounts" too aggressive | Reduce MAX_SIGNUPS_PER_IP from 2 |
| False positives | Add IP to whitelist (manual for now) |
| High latency | Normal (~100-200ms added), can't optimize much |

## 📚 Full Documentation

See `SIGNUP_ABUSE_PREVENTION.md` for:
- Step-by-step setup with screenshots
- Detailed configuration options
- Advanced monitoring queries
- Optional enhancements
- Production best practices

## ✨ Optional Enhancements

1. **Whitelist IPs** - Skip checks for known good sources
2. **IP Reputation** - Check MaxMind/AbuseIPDB for bad IPs
3. **Email Verification** - Send code for blocked signups
4. **Device Fingerprinting** - Track devices across IPs
5. **Manual Review Queue** - Flag suspicious for review
6. **Gradual Limits** - Increase based on account age

## 📞 What to Do Next

1. Run database migration ✓
2. Get Clerk webhook secret ✓
3. Add CLERK_WEBHOOK_SECRET to Netlify ✓
4. Deploy (happens automatically) ✓
5. Test rate limiting (see Testing section)
6. Monitor signup_analytics view
7. Adjust limits if needed
8. Consider optional enhancements
