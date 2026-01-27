# IP Logging & Rate Limiting Setup Guide

## Overview
This guide helps you set up IP logging and rate limiting for the Aimalyze API to prevent abuse and monitor usage patterns.

## Prerequisites
- Supabase account (free tier available at supabase.com)
- Netlify deployment
- Existing Gemini API key

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Wait for the project to initialize (2-3 minutes)
4. Get your credentials from **Project Settings → API**:
   - `SUPABASE_URL`: Copy the "Project URL"
   - `SUPABASE_ANON_KEY`: Copy the "anon" key

## Step 2: Set Up Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `netlify/functions/migrations/001_create_ip_logs.sql`
4. Paste it into the SQL Editor
5. Click **Run**
6. You should see:
   - `ip_logs` table created ✓
   - 3 indexes created ✓
   - Row Level Security enabled ✓
   - RLS policy for inserts created ✓
   - `ip_logs_summary` view created ✓

## Step 3: Add Environment Variables

### Local Development (.env)
Add these to your `.env` file:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Netlify Production
1. Go to your Netlify site settings
2. Go to **Build & deploy → Environment**
3. Add new environment variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon key

4. Redeploy your site to apply the variables

## Step 4: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Features Implemented

### ✅ IP Logging
- Captures client IP from multiple sources (direct, Cloudflare, proxies, load balancers)
- Stores IP + timestamp in Supabase
- Supports IPv4 and IPv6 addresses
- User agent and endpoint tracking

### ✅ Rate Limiting
- **Default**: 5 requests per 24 hours per IP
- Returns `429 Too Many Requests` status when exceeded
- Includes `Retry-After` header with reset time
- Configurable per limit window

### ✅ Request Validation
- File size validation (max 500MB)
- MIME type verification
- Proper error responses with status codes

### ✅ Comprehensive Logging
```
[REQUEST] IP: 192.168.1.1, Time: 2024-01-27T10:30:45.123Z
[RATE LIMIT] IP 192.168.1.1 exceeded limit. Count: 5, Remaining: 0
[VALIDATION] No file provided from IP 192.168.1.1
[PROCESSING] Starting analysis for video.mp4 (123.45MB) from IP 192.168.1.1
[API RESPONSE] Received response from Gemini API (1234 chars)
[SUCCESS] Analysis complete for IP 192.168.1.1. Verdict: Clean Gameplay, Confidence: 95%
[ERROR] Analysis failed for IP 192.168.1.1: Error message
```

### ✅ Automatic Cleanup
- Old logs automatically deleted (7+ days)
- Runs 10% of the time to avoid performance impact
- Configurable retention period

## Rate Limiting Configuration

To modify rate limits, edit `netlify/functions/analyze.js`:

```javascript
const RATE_LIMIT_REQUESTS = 5;        // Number of requests allowed
const RATE_LIMIT_WINDOW_HOURS = 24;   // Time window in hours
```

Common configurations:
- **Strict**: 2 requests per 24 hours
- **Standard**: 5 requests per 24 hours (default)
- **Generous**: 10 requests per 24 hours
- **Loose**: 20 requests per 24 hours

## Monitoring & Analytics

### View Request Statistics

In Supabase SQL Editor, run:

```sql
-- Top abusers in last 24 hours
SELECT ip_address, COUNT(*) as request_count, MAX(timestamp) as last_request
FROM ip_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY request_count DESC
LIMIT 10;

-- IPs blocked by rate limit
SELECT ip_address, COUNT(*) as request_count
FROM ip_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) >= 5
ORDER BY request_count DESC;

-- Requests by status
SELECT status_code, COUNT(*) as count
FROM ip_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY status_code
ORDER BY count DESC;
```

### View Summary View

The `ip_logs_summary` view provides quick analytics:

```sql
SELECT * FROM ip_logs_summary LIMIT 20;
```

Returns:
- `ip_address`: Client IP
- `request_count`: Number of requests in last 24h
- `error_count`: Failed requests
- `last_request`: Most recent request timestamp
- `first_request`: First request timestamp
- `active_duration`: How long IP has been active

## Error Responses

### Rate Limit Exceeded (429)
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 5 analysis requests per 24 hours exceeded",
  "remaining": 0,
  "resetTime": "2024-01-28T10:30:45.123Z",
  "retryAfter": 3600
}
```

**Headers**:
- `Retry-After: 3600` (seconds until reset)

### File Too Large (413)
```json
{
  "error": "File too large",
  "message": "Maximum file size is 500MB, received 512.34MB"
}
```

### Validation Error (400)
```json
{
  "error": "No file provided"
}
```

## Security Considerations

### ✅ Implemented
- RLS (Row Level Security) enabled on `ip_logs` table
- Anon key only allows inserts to `ip_logs`
- IP addresses stored in lowercase
- Supports IPv6 addresses
- Timestamp in UTC
- Rate limiting prevents API spam

### 🔐 Additional Recommendations

1. **Whitelist Legitimate IPs** (optional):
   ```sql
   -- Add to migrations
   ALTER TABLE ip_logs ADD COLUMN is_whitelisted BOOLEAN DEFAULT FALSE;
   ```

2. **Block Suspicious IPs** (optional):
   ```javascript
   // Add to analyze.js
   const blockedIPs = ['192.168.1.100', '10.0.0.1'];
   if (blockedIPs.includes(clientIP)) {
     return new Response('Blocked', { status: 403 });
   }
   ```

3. **CORS Configuration**:
   - Restrict API calls to your domain
   - Use environment-based URL validation

4. **API Key Rotation**:
   - Rotate Gemini API key periodically
   - Monitor for unusual usage patterns

## Troubleshooting

### Supabase Connection Error
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Check Supabase project is active
- Look for error logs in Netlify Functions tab

### Rate Limiting Not Working
- Ensure SQL migration ran successfully
- Check `ip_logs` table exists: `SELECT COUNT(*) FROM ip_logs;`
- Verify RLS policy is enabled

### IP Address Always "unknown"
- Netlify should provide IP automatically
- Check request headers in logs
- May need to wait a few requests for Netlify context

### Performance Issues
- Clean up function runs every 100 requests (10%)
- Consider adjusting cleanup frequency in analyze.js
- Monitor Supabase query performance in dashboard

## Production Checklist

- [ ] Supabase project created and verified
- [ ] SQL migration executed successfully
- [ ] Environment variables set in Netlify
- [ ] `@supabase/supabase-js` dependency installed
- [ ] Site redeployed after env changes
- [ ] Test rate limiting: 6 requests from same IP
- [ ] Verify logs appear in Supabase
- [ ] Monitor first 24 hours of usage
- [ ] Set up monitoring alerts (optional)

## Support

For issues or questions:
1. Check Netlify Function logs: **Functions → analyze → View logs**
2. Check Supabase database: **Table Editor → ip_logs**
3. Review error messages in console
4. Verify all credentials are correct
