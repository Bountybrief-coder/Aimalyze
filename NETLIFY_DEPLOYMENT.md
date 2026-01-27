# Netlify Deployment Guide with IP Logging

## Quick Start

### 1. Connect to Netlify
```bash
# If not already deployed
npm install -g netlify-cli
netlify init
```

### 2. Configure Environment Variables

#### Option A: Via Netlify Dashboard
1. Go to your Netlify site settings
2. Click **Build & deploy → Environment**
3. Click **Edit variables**
4. Add three variables:
   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = your_anon_key
   GEMINI_API_KEY = your_gemini_key
   ```
5. Click **Save**

#### Option B: Via Netlify CLI
```bash
netlify env:set SUPABASE_URL "https://your-project.supabase.co"
netlify env:set SUPABASE_ANON_KEY "your_anon_key"
netlify env:set GEMINI_API_KEY "your_gemini_key"
```

### 3. Deploy
```bash
npm run build
netlify deploy --prod
```

## Verify Deployment

### Check Function Status
1. Go to **Functions** tab in Netlify dashboard
2. Look for **analyze** function
3. Click it to view recent logs
4. Test with a request to `.netlify/functions/analyze`

### Monitor Logs in Real-Time
```bash
netlify functions:log
```

### Test Rate Limiting
```bash
# Make 6 requests from your IP to exceed limit (5 allowed)
curl -X POST https://your-site.netlify.app/.netlify/functions/analyze \
  -F "file=@test-video.mp4"

# 6th request should return 429 error
```

## Production Configuration

### Environment Variables to Set
| Variable | Value | Example |
|----------|-------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abcdef.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGc...` |
| `GEMINI_API_KEY` | Your Google Gemini API key | `AIza...` |

### Function Settings

**netlify.toml** (if deploying advanced options):
```toml
[[functions]]
name = "analyze"
memory = 3008  # 3GB for video processing
timeout = 60    # 60 second timeout for analysis
```

## Monitoring & Logs

### View Function Logs
- **Dashboard**: Site → Functions → analyze → View logs
- **CLI**: `netlify functions:log`
- **Real-time**: `netlify functions:log --tail`

### Expected Log Output
```
[REQUEST] IP: 203.0.113.42, Time: 2024-01-27T10:30:45.123Z
[PROCESSING] Starting analysis for video.mp4 (123.45MB) from IP 203.0.113.42
[API RESPONSE] Received response from Gemini API (1234 chars)
[SUCCESS] Analysis complete for IP 203.0.113.42. Verdict: Clean Gameplay, Confidence: 95%
```

### View Rate Limit Events
Look for logs containing:
```
[RATE LIMIT] IP 203.0.113.42 exceeded limit
```

## Troubleshooting

### Function Not Found
- Ensure `netlify/functions/analyze.js` exists
- Redeploy with `netlify deploy --prod`
- Check build logs for errors

### "Cannot find module @supabase/supabase-js"
```bash
npm install @supabase/supabase-js
npm run build
netlify deploy --prod
```

### Supabase Connection Failed
- Verify environment variables are set correctly
- Check Supabase project is running
- Test connection: Check logs for "Supabase credentials not configured"

### Rate Limiting Not Working
- Verify `ip_logs` table exists in Supabase
- Run the SQL migration again
- Check `SUPABASE_ANON_KEY` has table access

### High Memory Usage
- Video processing is memory-intensive
- May need to increase function memory (up to 3008MB)
- Consider adding file size limits

## Performance Tips

1. **Cache Supabase Connection**
   - Client is created once at module load
   - Reused for all requests

2. **Async Cleanup**
   - Old logs cleaned up asynchronously (10% of requests)
   - Won't block main analysis

3. **Rate Limit Checks**
   - Quick index lookups in Supabase
   - ~50-100ms per check

4. **File Processing**
   - Base64 encoding is memory-intensive
   - Supabase streams large files efficiently

## Security Notes

### IP Address Sources (in order)
1. Netlify context (most accurate)
2. X-Forwarded-For header
3. Cloudflare IP
4. X-Real-IP header
5. X-Client-IP header
6. Remote-Addr header

### Rate Limit Reset
- Based on oldest request in 24-hour window
- Exact reset time returned in response
- Client can check `Retry-After` header

### Failed Requests
- All failed requests still logged
- Rate limiting applies even if analysis fails
- Prevents API spam from malformed requests

## Monitoring Checklist

- [ ] Function logs showing `[REQUEST]` entries
- [ ] Supabase `ip_logs` table has entries
- [ ] Rate limit working (429 after 5 requests)
- [ ] Cleanup function running (logs show cleanup)
- [ ] Error handling working (invalid requests return proper status)
- [ ] Performance acceptable (<5s per request)

## Next Steps

1. Test rate limiting with multiple requests
2. Monitor Supabase analytics for patterns
3. Set up alerts for unusual activity
4. Review logs daily for the first week
5. Adjust rate limits if needed based on usage
