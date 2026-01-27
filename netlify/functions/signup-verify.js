/**
 * Netlify Function: Pre-signup Verification
 * Allows frontend to check if a signup will be allowed BEFORE user attempts it
 * This provides better UX with immediate feedback
 */

import {
  isBlockedEmailDomain,
  checkSignupLimit,
  getClientIP
} from './supabaseClient.js';

// Configuration - must match clerk-webhook.js
const MAX_SIGNUPS_PER_IP = 2;
const SIGNUP_WINDOW_HOURS = 24;
const BLOCK_TEMP_EMAIL_DOMAINS = true;

export default async (req, context) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse request body
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: 'Email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get client IP
    const ip = getClientIP(req, context);
    console.log(`[SIGNUP VERIFY] Email: ${email}, IP: ${ip}`);

    // Check email domain
    if (BLOCK_TEMP_EMAIL_DOMAINS) {
      const isBlocked = await isBlockedEmailDomain(email);
      if (isBlocked) {
        const domain = email.split('@')[1];
        console.log(`[SIGNUP VERIFY] Blocked - Temp email domain: ${domain}`);

        return new Response(JSON.stringify({
          allowed: false,
          reason: `Temporary email domains are not allowed. Please use a permanent email address.`,
          blockedDomain: true
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check signup rate limit for IP
    const signupCheck = await checkSignupLimit(ip, MAX_SIGNUPS_PER_IP, SIGNUP_WINDOW_HOURS);

    if (!signupCheck.allowed) {
      console.log(`[SIGNUP VERIFY] Blocked - ${signupCheck.reason}`);

      return new Response(JSON.stringify({
        allowed: false,
        reason: `Too many accounts created from this IP. Please try again later.`,
        details: signupCheck.reason,
        rateLimited: true,
        resetTime: signupCheck.resetTime,
        count: signupCheck.count
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Signup is allowed
    console.log(`[SIGNUP VERIFY] Allowed - Email: ${email}, IP: ${ip}`);

    return new Response(JSON.stringify({
      allowed: true,
      message: 'Signup check passed',
      count: signupCheck.count,
      remaining: MAX_SIGNUPS_PER_IP - signupCheck.count
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[SIGNUP VERIFY] Error:', error);

    // Fail open on error (allow signup if verification fails)
    return new Response(JSON.stringify({
      allowed: true,
      message: 'Verification service unavailable',
      warning: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
