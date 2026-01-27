# Signup Abuse Prevention - Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ SignupForm Component                                 │  │
│  │ - Captures email address                             │  │
│  │ - Calls useSignupVerification hook                  │  │
│  │ - Shows error if blocked                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ useSignupVerification Hook                           │  │
│  │ - Sends email to signup-verify endpoint              │  │
│  │ - Returns { allowed, reason, resetTime }             │  │
│  │ - Handles loading and error states                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ HTTP POST
                         ↓
        ┌────────────────────────────────┐
        │  signup-verify Function        │
        │  (/netlify/functions/)         │
        │                                │
        │  1. Extract IP from headers    │
        │  2. Check email domain         │
        │  3. Check signup rate limit    │
        │  4. Return { allowed, reason } │
        └────────────────────────────────┘
                         │
                         ├─ IP Extraction
                         │  └─ X-Forwarded-For
                         │  └─ CF-Connecting-IP
                         │  └─ X-Real-IP, etc.
                         │
                         ├─ Domain Check
                         │  └─ Query blocked_email_domains
                         │
                         └─ Rate Limit Check
                            └─ Query account_signups
                               └─ WHERE ip = ? AND created_at > NOW - 24h


        ┌────────────────────────────────┐
        │   Clerk SignUp Component       │
        │  (User proceeds if allowed)    │
        └────────────────────────────────┘
                         │
                         │ User completes signup
                         ↓
        ┌────────────────────────────────┐
        │ Clerk Webhook Event            │
        │ (user.created)                 │
        │ - Sent to clerk-webhook.js     │
        │ - Signed with HMAC-SHA256      │
        └────────────────────────────────┘
                         │
                         │ Webhook POST request
                         ↓
        ┌────────────────────────────────┐
        │  clerk-webhook Function        │
        │  (/netlify/functions/)         │
        │                                │
        │  1. Verify Svix signature      │
        │  2. Check if user.created      │
        │  3. Check email domain (again) │
        │  4. Check signup rate (again)  │
        │  5. Log to account_signups     │
        └────────────────────────────────┘
                         │
                         ↓
        ┌────────────────────────────────┐
        │    Supabase Tables             │
        │                                │
        │ ┌──────────────────────────┐  │
        │ │ account_signups          │  │
        │ ├──────────────────────────┤  │
        │ │ id                       │  │
        │ │ clerk_user_id ⭐ (unique)│  │
        │ │ ip_address               │  │
        │ │ email                    │  │
        │ │ email_domain             │  │
        │ │ created_at               │  │
        │ │ blocked (T/F)            │  │
        │ │ block_reason             │  │
        │ │ user_agent               │  │
        │ └──────────────────────────┘  │
        │                                │
        │ ┌──────────────────────────┐  │
        │ │ blocked_email_domains    │  │
        │ ├──────────────────────────┤  │
        │ │ id                       │  │
        │ │ domain (unique)          │  │
        │ │ reason                   │  │
        │ │ active (T/F)             │  │
        │ └──────────────────────────┘  │
        │                                │
        │ VIEWS:                         │
        │ - signup_analytics             │
        │ - suspicious_ips               │
        └────────────────────────────────┘
```

## Data Flow - Signup Allowed

```
1. User enters email: john@gmail.com
   └─ From IP: 192.168.1.1

2. Frontend verifies with signup-verify
   ├─ Email domain (gmail.com) not in blocklist ✓
   ├─ IP has 0 signups in 24h (limit: 2) ✓
   └─ Return: { allowed: true }

3. Frontend shows success, user proceeds to Clerk signup

4. User completes signup in Clerk

5. Clerk sends webhook:
   ├─ Verify signature with CLERK_WEBHOOK_SECRET ✓
   ├─ Extract user ID, email, IP from headers
   ├─ Check domain again (gmail.com) ✓
   ├─ Check rate limit again (0 signups) ✓
   └─ Log to account_signups:
      └─ { user_id, email, ip, domain, created_at, blocked: false }

6. User account created successfully ✅
```

## Data Flow - Signup Blocked (Rate Limited)

```
1. User enters email: jane@gmail.com
   └─ From IP: 203.0.113.42

2. Previous signups from this IP:
   ├─ 2024-01-27 10:00 - john@gmail.com
   ├─ 2024-01-27 10:05 - mary@gmail.com
   └─ (2 accounts in 24h, limit reached)

3. Frontend verifies with signup-verify
   ├─ Email domain (gmail.com) not in blocklist ✓
   ├─ IP has 2 signups in 24h (limit: 2) ❌
   └─ Return: { 
        allowed: false, 
        reason: "Too many accounts created from this IP",
        resetTime: "2024-01-28T10:00:45.123Z"
      }

4. Frontend shows error message to user:
   └─ "Too many accounts created from this IP. Please try again later."

5. User cannot proceed ❌

6. If user somehow bypasses and completes Clerk signup anyway:
   ├─ Clerk webhook is still received
   ├─ Signature verified ✓
   ├─ Rate limit check fails again
   └─ Log to account_signups:
      └─ { user_id, email, ip, domain, created_at, 
           blocked: true, block_reason: "IP signup rate limit exceeded" }
```

## Data Flow - Signup Blocked (Temp Email)

```
1. User enters email: user@mailinator.com
   └─ From IP: 198.51.100.1

2. Frontend verifies with signup-verify
   ├─ Email domain (mailinator.com) IS in blocklist ❌
   └─ Return: {
        allowed: false,
        reason: "Temporary email domains are not allowed"
      }

3. Frontend shows error:
   └─ "Temporary email domains not allowed. Use permanent email."

4. User cannot proceed ❌
```

## Component Dependencies

```
useSignupVerification Hook
  └─ Calls: /.netlify/functions/signup-verify
     └─ Uses: getClientIP()
     └─ Uses: isBlockedEmailDomain()
     └─ Uses: checkSignupLimit()
     └─ Queries: account_signups table
     └─ Queries: blocked_email_domains table

clerk-webhook Function
  └─ Verifies: Svix signature
  └─ Uses: getClientIP()
  └─ Uses: isBlockedEmailDomain()
  └─ Uses: checkSignupLimit()
  └─ Uses: logAccountSignup()
  └─ Queries: blocked_email_domains table
  └─ Queries: account_signups table
  └─ Inserts: account_signups table

supabaseClient.js (Helper Module)
  ├─ getClientIP(req, context)
  │  └─ Extracts IP from Netlify context + headers
  ├─ isBlockedEmailDomain(email)
  │  └─ Queries: blocked_email_domains
  ├─ checkSignupLimit(ip, max, window)
  │  └─ Queries: account_signups
  └─ logAccountSignup(userId, ip, email, ...)
     └─ Inserts: account_signups
```

## Database Schema

### account_signups Table
```
Column              Type        Constraints
─────────────────────────────────────────────
id                  BIGSERIAL   PRIMARY KEY
clerk_user_id       VARCHAR(255) UNIQUE NOT NULL
ip_address          VARCHAR(45) NOT NULL
email               VARCHAR(255)
email_domain        VARCHAR(255)
user_agent          TEXT
created_at          TIMESTAMP   DEFAULT NOW()
blocked             BOOLEAN     DEFAULT FALSE
block_reason        VARCHAR(255)

Indexes:
  - ip_address
  - ip_address, created_at DESC (for rate limit queries)
  - email (for duplicate detection)
  - email_domain
  - created_at DESC
```

### blocked_email_domains Table
```
Column      Type        Constraints
──────────────────────────────────
id          BIGSERIAL   PRIMARY KEY
domain      VARCHAR(255) UNIQUE NOT NULL
reason      VARCHAR(255)
active      BOOLEAN     DEFAULT TRUE
created_at  TIMESTAMP   DEFAULT NOW()

Pre-populated with 12 domains:
  - mailinator.com, tempmail.com, yopmail.com
  - 10minutemail.com, throwaway.email, temp-mail.org
  - trashmail.com, fakeinbox.com, sharklasers.com
  - spam4.me, tempmail.us, maildrop.cc
```

### Views
```
signup_analytics
  - Aggregates signups by IP in last 24h
  - Shows signup count, blocked count, first/last times

suspicious_ips
  - IPs with 2+ signups in last 24h
  - Shows unique domains used from each IP
```

## Environment Variables Required

```
CLERK_WEBHOOK_SECRET
  - From Clerk Dashboard → Settings → Webhooks
  - Used to verify webhook signatures
  - Never expose publicly

SUPABASE_URL
  - From Supabase project settings
  - Used by Netlify functions to query/insert

SUPABASE_ANON_KEY
  - From Supabase project settings
  - Restricted to account_signups and blocked_email_domains
```

## Security Considerations

### ✅ What's Protected

1. **Signature Verification**
   - Webhooks verified with Svix HMAC-SHA256
   - Prevents spoofed webhooks

2. **IP Extraction**
   - Handles proxies (CF-Connecting-IP, X-Forwarded-For, etc.)
   - Doesn't trust client IP directly

3. **Rate Limiting**
   - Per-IP in 24-hour sliding window
   - Database queries are indexed for performance

4. **Domain Blocking**
   - Pre-populated with common temp services
   - Easily extensible

5. **Database Access**
   - Supabase RLS policies restrict access
   - Anon key limited to specific tables

### ⚠️ Limitations

1. **VPN/Proxy Bypass**
   - Users on same VPN see same IP
   - Could be bypassed by VPN hopping (but expensive)

2. **Domain Bypass**
   - Attacker could use legitimate email domain
   - Would hit rate limit instead

3. **Fail-Open**
   - If Supabase is down, signup is allowed
   - Better UX than blocking all signups

4. **No Device Fingerprinting**
   - Doesn't detect same device, different IP
   - Could be added as enhancement

## Performance Characteristics

```
signup-verify endpoint:
  - ~100-200ms latency (1-2 DB queries)
  - ~10KB request size
  - ~1KB response size
  - Scales to 1000s of signups/hour

clerk-webhook endpoint:
  - ~50-100ms latency (signature verification + 2-3 queries)
  - Async (doesn't block user)
  - ~5KB request size
  - ~1KB response size

Database queries:
  - Both rate limit checks use indexed columns
  - Full table scans avoided
  - 24-hour window limits result set
```

## Failure Modes & Recovery

| Failure | Impact | Recovery |
|---------|--------|----------|
| CLERK_WEBHOOK_SECRET missing | Webhooks rejected (401) | Add env var, redeploy |
| Supabase connection down | signup-verify allows all | Service recovers automatically |
| blocked_email_domains table missing | Domain check skipped | Run migration |
| account_signups table missing | Rate limit check fails, allows all | Run migration |
| IP extraction fails (ip="unknown") | All unknown IPs treated as new | Fix header forwarding |
| Webhook signature invalid | Webhook rejected (401) | Check secret, Clerk config |

## Monitoring & Observability

### Console Logs Generated

```
[SIGNUP DETECT] New user: user_xxx, Email: user@example.com, IP: 203.0.113.42
[SIGNUP BLOCKED] Rate limit exceeded for IP: 203.0.113.42
[SIGNUP ALLOWED] User user_xxx from IP 203.0.113.42
[SIGNUP VERIFY] Email: user@example.com, IP: 203.0.113.42
[SIGNUP VERIFY] Blocked - Temp email domain: mailinator.com
[EMAIL CHECK] Checking domain: example.com
```

### Queries for Monitoring

```sql
-- Real-time blocked signups
SELECT * FROM account_signups 
WHERE blocked = TRUE 
ORDER BY created_at DESC LIMIT 20;

-- Suspicious IPs (multiple signups)
SELECT * FROM suspicious_ips;

-- Stats for last 24 hours
SELECT 
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE blocked) as blocked,
  COUNT(DISTINCT ip_address) as unique_ips
FROM account_signups
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Most common block reasons
SELECT block_reason, COUNT(*) 
FROM account_signups
WHERE blocked = TRUE
GROUP BY block_reason
ORDER BY COUNT(*) DESC;
```

## Testing Strategy

### Unit Tests (Manual)

1. **Test Rate Limiting**
   - 2 requests from same IP: both allowed
   - 3rd request: blocked

2. **Test Temp Email**
   - mailinator.com: blocked
   - gmail.com: allowed

3. **Test Webhook**
   - Valid signature: processed
   - Invalid signature: rejected

### Integration Tests

1. **Create actual user in Clerk**
   - Verify webhook is received
   - Verify data in Supabase

2. **Create 2 users from same network**
   - Verify both in database
   - Verify 3rd blocked

### Load Tests

- Simulate 100 signups/minute
- Verify database handles queries
- Monitor response times

## Future Enhancements

1. **IP Whitelisting**
   - Allow specific IPs (corporate networks)
   - Bypass rate limits

2. **IP Reputation**
   - Check MaxMind GeoIP
   - Check AbuseIPDB
   - Block known bad IPs

3. **Device Fingerprinting**
   - Track devices across IPs
   - Detect same device + multiple IPs

4. **Gradual Limits**
   - New accounts: 1/IP
   - 7-day old: 2/IP
   - 30-day old: 5/IP

5. **Email Verification**
   - When IP limit hit, require email confirmation
   - User can still signup if they verify email

6. **Manual Review Queue**
   - Flag borderline cases
   - Manual approve/reject
   - Reduce false positives

7. **Dashboard**
   - Supabase-based analytics
   - Charts and trends
   - Alert configuration

8. **API Keys**
   - Restrict API access by IP
   - Different limits for different tiers
