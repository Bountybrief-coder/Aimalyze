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

/**
 * Check if email domain is on blocklist (temporary email services)
 */
export async function isBlockedEmailDomain(email) {
  if (!supabase) {
    console.log('[EMAIL CHECK] Supabase not configured - allowing all domains');
    return false;
  }

  try {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    const { data, error } = await supabase
      .from('blocked_email_domains')
      .select('id')
      .eq('domain', domain)
      .eq('active', true)
      .limit(1);

    if (error) {
      console.error('Error checking blocked email domains:', error);
      return false; // Fail open - allow if we can't verify
    }

    return data && data.length > 0;
  } catch (err) {
    console.error('Error in isBlockedEmailDomain:', err);
    return false;
  }
}

/**
 * Check if IP has exceeded signup limit
 * Returns { allowed: boolean, reason?: string, count: number }
 */
export async function checkSignupLimit(ip, maxSignups = 2, windowHours = 24) {
  if (!supabase) {
    console.warn('[SIGNUP LIMIT] Supabase not configured - signup limiting disabled');
    return { allowed: true, count: 0 };
  }

  try {
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

    // Get count of signups from this IP in the window
    const { data, error, count } = await supabase
      .from('account_signups')
      .select('id, created_at', { count: 'exact' })
      .eq('ip_address', ip)
      .eq('blocked', false)
      .gte('created_at', windowStart);

    if (error) {
      console.error('Error checking signup limit:', error);
      return { allowed: true, count: 0 }; // Fail open
    }

    const signupCount = count || 0;
    const isExceeded = signupCount >= maxSignups;

    if (isExceeded) {
      // Calculate reset time based on oldest signup
      const oldestSignup = data && data.length > 0 
        ? new Date(data[0].created_at)
        : new Date();
      const resetTime = new Date(oldestSignup.getTime() + windowHours * 60 * 60 * 1000);

      return {
        allowed: false,
        reason: `Too many accounts created from this IP (${signupCount}/${maxSignups} in 24 hours)`,
        count: signupCount,
        resetTime
      };
    }

    return {
      allowed: true,
      count: signupCount
    };
  } catch (err) {
    console.error('Error in checkSignupLimit:', err);
    return { allowed: true, count: 0 };
  }
}

/**
 * Log a new account signup
 */
export async function logAccountSignup(clerkUserId, ip, email, userAgent = null, blocked = false, blockReason = null) {
  if (!supabase) {
    console.log(`[SIGNUP LOG] User: ${clerkUserId}, IP: ${ip}, Email: ${email}`);
    return { success: true };
  }

  try {
    const domain = email.split('@')[1]?.toLowerCase() || 'unknown';

    const { data, error } = await supabase
      .from('account_signups')
      .insert([
        {
          clerk_user_id: clerkUserId,
          ip_address: ip,
          email: email,
          email_domain: domain,
          user_agent: userAgent,
          blocked,
          block_reason: blockReason
        }
      ])
      .select();

    if (error) {
      console.error('Error logging account signup:', error);
      return { success: false, error };
    }

    const action = blocked ? 'BLOCKED' : 'ALLOWED';
    console.log(`[SIGNUP] ${action} - User: ${clerkUserId}, IP: ${ip}, Email: ${email}, Domain: ${domain}`);

    return { success: true, data };
  } catch (err) {
    console.error('Error in logAccountSignup:', err);
    return { success: false, error: err };
  }
}

/**
 * Get signup history for an IP
 */
export async function getIPSignupHistory(ip, hours = 24) {
  if (!supabase) {
    return { signups: [], count: 0 };
  }

  try {
    const windowStart = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error, count } = await supabase
      .from('account_signups')
      .select('clerk_user_id, email, email_domain, created_at, blocked, block_reason', { count: 'exact' })
      .eq('ip_address', ip)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting signup history:', error);
      return { signups: [], count: 0 };
    }

    return {
      signups: data || [],
      count: count || 0
    };
  } catch (err) {
    console.error('Error in getIPSignupHistory:', err);
    return { signups: [], count: 0 };
  }
}
