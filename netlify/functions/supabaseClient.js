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

/**
 * Get user's current plan
 */
export async function getUserPlan(clerkUserId) {
  if (!supabase) {
    console.log('[PLAN] Supabase not configured - allowing analysis');
    return { plan_type: 'free', status: 'active' };
  }

  try {
    const { data, error } = await supabase
      .from('user_plans')
      .select('plan_type, status, created_at')
      .eq('clerk_user_id', clerkUserId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting user plan:', error);
      // Default to free plan if error
      return { plan_type: 'free', status: 'active' };
    }

    // If no plan exists, create default free plan
    if (!data) {
      console.log(`[PLAN] Creating default free plan for user ${clerkUserId}`);
      const { data: newPlan, error: insertError } = await supabase
        .from('user_plans')
        .insert([{ clerk_user_id: clerkUserId, plan_type: 'free', status: 'active' }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default plan:', insertError);
        return { plan_type: 'free', status: 'active' };
      }
      return newPlan;
    }

    return data;
  } catch (err) {
    console.error('Error in getUserPlan:', err);
    return { plan_type: 'free', status: 'active' };
  }
}

/**
 * Get today's usage for a user
 */
export async function getTodayUsage(clerkUserId) {
  if (!supabase) {
    return { analysis_count: 0, usage_date: new Date().toISOString().split('T')[0] };
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_usage')
      .select('analysis_count, usage_date')
      .eq('clerk_user_id', clerkUserId)
      .eq('usage_date', today)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting today usage:', error);
      return { analysis_count: 0, usage_date: today };
    }

    return data || { analysis_count: 0, usage_date: today };
  } catch (err) {
    console.error('Error in getTodayUsage:', err);
    return { analysis_count: 0, usage_date: new Date().toISOString().split('T')[0] };
  }
}

/**
 * Check if user can perform analysis based on plan and usage
 * Returns { allowed: boolean, reason?: string, usage: number, limit: number }
 */
export async function checkAnalysisQuota(clerkUserId) {
  if (!supabase) {
    return { allowed: true, usage: 0, limit: 1 };
  }

  try {
    const plan = await getUserPlan(clerkUserId);
    const usage = await getTodayUsage(clerkUserId);

    // Determine daily limit based on plan
    const limits = {
      'free': 1,
      'gamer': 50,
      'wager_org': 99999  // Unlimited
    };

    const dailyLimit = limits[plan.plan_type] || 1;
    const hasReachedLimit = usage.analysis_count >= dailyLimit;

    console.log(`[QUOTA CHECK] User: ${clerkUserId}, Plan: ${plan.plan_type}, Usage: ${usage.analysis_count}/${dailyLimit}`);

    if (hasReachedLimit) {
      return {
        allowed: false,
        reason: plan.plan_type === 'free' 
          ? 'Free plan limited to 1 analysis per day. Upgrade to continue.'
          : `Daily limit of ${dailyLimit} analyses reached for ${plan.plan_type} plan`,
        usage: usage.analysis_count,
        limit: dailyLimit,
        plan: plan.plan_type
      };
    }

    return {
      allowed: true,
      usage: usage.analysis_count,
      limit: dailyLimit,
      plan: plan.plan_type
    };
  } catch (err) {
    console.error('Error in checkAnalysisQuota:', err);
    // Fail open - allow if verification fails
    return { allowed: true, usage: 0, limit: 1 };
  }
}

/**
 * Increment daily usage for a user
 */
export async function incrementDailyUsage(clerkUserId) {
  if (!supabase) {
    console.log(`[USAGE] Would increment usage for ${clerkUserId}`);
    return true;
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Try to update existing record
    const { data: existing, error: selectError } = await supabase
      .from('daily_usage')
      .select('id, analysis_count')
      .eq('clerk_user_id', clerkUserId)
      .eq('usage_date', today)
      .limit(1)
      .single();

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('daily_usage')
        .update({ analysis_count: existing.analysis_count + 1, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error incrementing usage:', updateError);
        return false;
      }
    } else {
      // Create new record for today
      const { error: insertError } = await supabase
        .from('daily_usage')
        .insert([{ 
          clerk_user_id: clerkUserId, 
          usage_date: today,
          analysis_count: 1
        }]);

      if (insertError && insertError.code !== '23505') { // Ignore unique constraint errors
        console.error('Error creating usage record:', insertError);
        return false;
      }
    }

    console.log(`[USAGE] Incremented usage for ${clerkUserId}`);
    return true;
  } catch (err) {
    console.error('Error in incrementDailyUsage:', err);
    return false;
  }
}

/**
 * Log analysis request with details
 */
export async function logAnalysis(clerkUserId, fileName, fileSizeMb, verdict, confidence, result) {
  if (!supabase) {
    console.log(`[ANALYSIS LOG] User: ${clerkUserId}, File: ${fileName}`);
    return true;
  }

  try {
    const { error } = await supabase
      .from('analysis_logs')
      .insert([{
        clerk_user_id: clerkUserId,
        file_name: fileName,
        file_size_mb: fileSizeMb,
        verdict: verdict,
        confidence: confidence,
        analysis_result: result
      }]);

    if (error) {
      console.error('Error logging analysis:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in logAnalysis:', err);
    return false;
  }
}
