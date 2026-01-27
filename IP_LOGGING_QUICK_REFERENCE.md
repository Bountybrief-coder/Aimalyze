# IP Logging & Rate Limiting - Quick Reference

## 📋 What Was Implemented

### Core Features
✅ **IP Logging**: Captures client IP address on every API call
✅ **Rate Limiting**: Max 5 requests per IP per 24 hours (configurable)
✅ **Database Integration**: Stores logs in Supabase for analysis
✅ **Automatic Cleanup**: Deletes logs older than 7 days
✅ **Comprehensive Logging**: Detailed console logs for monitoring

### Error Handling
✅ `429 Too Many Requests` - Rate limit exceeded
✅ `413 Payload Too Large` - File exceeds 500MB limit
✅ `400 Bad Request` - Missing or invalid file
✅ `405 Method Not Allowed` - Wrong HTTP method

## 🚀 Quick Setup (5 minutes)

### 1. Create Supabase Project
- Go to supabase.com → Create account
- Create new project
- Get `SUPABASE_URL` and `SUPABASE_ANON_KEY` from API settings

### 2. Run SQL Migration
- In Supabase SQL Editor, run `netlify/functions/migrations/001_create_ip_logs.sql`
- This creates `ip_logs` table + indexes + RLS policy

### 3. Add Environment Variables
Add to Netlify environment variables:
```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your_anon_key
GEMINI_API_KEY = your_existing_key
```

### 4. Deploy
```bash
npm install @supabase/supabase-js
git push  # Triggers Netlify redeploy
```

## 📁 New Files Created

| File | Purpose |
|------|---------|
| `netlify/functions/supabaseClient.js` | IP logging helper functions |
| `netlify/functions/migrations/001_create_ip_logs.sql` | Database setup |
| `IP_LOGGING_SETUP.md` | Detailed setup guide |
| `NETLIFY_DEPLOYMENT.md` | Deployment instructions |
| `.env.example` | Updated with Supabase vars |

## 🔧 Modified Files

| File | Changes |
|------|---------|
| `netlify/functions/analyze.js` | Added rate limiting & IP logging |
| `package.json` | Added @supabase/supabase-js |

## 📊 How It Works

```
Client Request
    ↓
Extract IP from headers/context
    ↓
Check rate limit (query Supabase)
    ↓
   [IF exceeded]
   └→ Return 429 error + reset time
   
   [IF allowed]
   └→ Log IP address to Supabase
      ↓
      Validate file size
      ↓
      Send to Gemini API
      ↓
      Return analysis result
      ↓
      (Random 10% chance) Clean up old logs
```

## 🔍 Monitoring & Querying

### See Recent Requests
```sql
SELECT ip_address, timestamp, status_code 
FROM ip_logs 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Find Rate Limited IPs
```sql
SELECT ip_address, COUNT(*) as requests
FROM ip_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) >= 5;
```

### Get Statistics
```sql
SELECT 
  COUNT(*) as total_requests,
  COUNT(DISTINCT ip_address) as unique_ips,
  MAX(timestamp) as latest_request
FROM ip_logs
WHERE timestamp > NOW() - INTERVAL '1 day';
```

## 📱 Testing Rate Limit

### Make 6 requests from same IP
```bash
# Request 1-5: Success
for i in {1..5}; do
  curl -X POST https://your-site.netlify.app/.netlify/functions/analyze \
    -F "file=@test.mp4"
done

# Request 6: Returns 429
curl -X POST https://your-site.netlify.app/.netlify/functions/analyze \
  -F "file=@test.mp4"
```

### Response when rate limited
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 5 analysis requests per 24 hours exceeded",
  "remaining": 0,
  "resetTime": "2024-01-28T10:30:45.123Z",
  "retryAfter": 3600
}
```

## ⚙️ Configuration

### Adjust Rate Limits
Edit `netlify/functions/analyze.js`:
```javascript
const RATE_LIMIT_REQUESTS = 5;      // Change this
const RATE_LIMIT_WINDOW_HOURS = 24; // Or this
```

### Adjust File Size Limit
Edit `netlify/functions/analyze.js`:
```javascript
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
```

### Adjust Log Retention
Edit `netlify/functions/supabaseClient.js`:
```javascript
cleanupOldLogs(7); // Change days from 7
```

## 🔐 Security Features

✅ Uses Supabase RLS (Row Level Security)
✅ Anon key restricted to `ip_logs` table only
✅ Timestamps in UTC timezone
✅ IP addresses stored in lowercase
✅ Supports IPv4 and IPv6
✅ File size validation
✅ No sensitive data logging
✅ Automatic old log cleanup

## 📝 Log Format

```
[REQUEST] IP: 203.0.113.42, Time: 2024-01-27T10:30:45.123Z
[PROCESSING] Starting analysis for video.mp4 (123.45MB) from IP 203.0.113.42
[API RESPONSE] Received response from Gemini API (1234 chars)
[SUCCESS] Analysis complete for IP 203.0.113.42. Verdict: Clean Gameplay, Confidence: 95%
```

### Log Levels
- `[REQUEST]` - New request received
- `[RATE LIMIT]` - Rate limit hit
- `[VALIDATION]` - File validation
- `[PROCESSING]` - Analysis started
- `[API RESPONSE]` - Gemini response received
- `[SUCCESS]` - Analysis completed
- `[ERROR]` - Error occurred

## 🎯 Expected Behavior

| Scenario | Response | Status |
|----------|----------|--------|
| 1st-5th request | Success | 200 |
| 6th+ request (same IP, 24h) | Rate limit error | 429 |
| No file | Error | 400 |
| File > 500MB | Error | 413 |
| Not POST | Error | 405 |
| Valid analysis | Result | 200 |

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Supabase not configured" | Add env variables to Netlify |
| "Table doesn't exist" | Run SQL migration in Supabase |
| Rate limit not working | Verify `ip_logs` table has data |
| Can't connect to Supabase | Check URL and key are correct |
| High latency | Normal (adds ~50-100ms per request) |

## 📚 Full Documentation

- **Setup**: See `IP_LOGGING_SETUP.md`
- **Deployment**: See `NETLIFY_DEPLOYMENT.md`
- **Code**: See `netlify/functions/analyze.js` and `supabaseClient.js`

## ✨ Next Steps (Optional)

1. **Whitelist IPs**: Add trusted IPs to bypass rate limit
2. **Block IPs**: Add malicious IPs to blacklist
3. **Analytics Dashboard**: Create Supabase dashboard for metrics
4. **Email Alerts**: Send alerts for unusual activity
5. **Gradual Scaling**: Increase limits for known good actors

## 📞 Support

If you encounter issues:
1. Check Netlify Function logs
2. Verify Supabase table exists
3. Test SQL migration ran
4. Check environment variables are set
5. Look for error messages in console
