import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. IP logging will be disabled.');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Extract client IP from request context
 * Handles proxies and load balancers
 */
export function getClientIP(req, context) {
  // Check Netlify context first
  if (context?.clientContext?.ip) {
    return context.clientContext.ip;
  }

  // Check common proxy headers
  const headers = req.headers;
  const ip = 
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-client-ip') ||
    headers.get('remote-addr') ||
    'unknown';

  return ip.toLowerCase();
}

/**
 * Log IP address with timestamp to Supabase
 */
export async function logIPAddress(ip) {
  if (!supabase) {
    console.log(`[IP LOG] ${ip} - ${new Date().toISOString()}`);
    return true;
  }

  try {
    const { error } = await supabase
      .from('ip_logs')
      .insert([
        {
          ip_address: ip,
          timestamp: new Date().toISOString(),
          user_agent: 'supabase-insert'
        }
      ]);

    if (error) {
      console.error('Error logging IP:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in logIPAddress:', err);
    return false;
  }
}

/**
 * Check if IP has exceeded rate limit
 * Returns { limited: boolean, remaining: number, resetTime: Date }
 */
export async function checkRateLimit(ip, maxRequests = 5, windowHours = 24) {
  if (!supabase) {
    // If Supabase not configured, allow requests but log warning
    console.warn('[RATE LIMIT] Supabase not configured - rate limiting disabled');
    return { limited: false, remaining: maxRequests, resetTime: null };
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

    // Get count of requests from this IP in the window
    const { data, error, count } = await supabase
      .from('ip_logs')
      .select('id', { count: 'exact' })
      .eq('ip_address', ip)
      .gte('timestamp', twentyFourHoursAgo);

    if (error) {
      console.error('Error checking rate limit:', error);
      // Fail open - allow request if we can't verify
      return { limited: false, remaining: maxRequests, resetTime: null };
    }

    const requestCount = count || 0;
    const isLimited = requestCount >= maxRequests;
    const remaining = Math.max(0, maxRequests - requestCount);

    // Calculate reset time (24 hours from oldest request in window)
    let resetTime = null;
    if (isLimited && data && data.length > 0) {
      const oldestRequest = new Date(data[0].timestamp);
      resetTime = new Date(oldestRequest.getTime() + windowHours * 60 * 60 * 1000);
    }

    return {
      limited: isLimited,
      remaining,
      resetTime,
      count: requestCount
    };
  } catch (err) {
    console.error('Error in checkRateLimit:', err);
    return { limited: false, remaining: maxRequests, resetTime: null };
  }
}

/**
 * Clean up old IP logs (older than 7 days)
 */
export async function cleanupOldLogs(olderThanDays = 7) {
  if (!supabase) return;

  try {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

    const { error, count } = await supabase
      .from('ip_logs')
      .delete()
      .lt('timestamp', cutoffDate);

    if (error) {
      console.error('Error cleaning up old logs:', error);
      return;
    }

    if (count > 0) {
      console.log(`Cleaned up ${count} old IP logs`);
    }
  } catch (err) {
    console.error('Error in cleanupOldLogs:', err);
  }
}
