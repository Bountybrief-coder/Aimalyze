/**
 * Netlify Function: Clerk Webhook Handler for Signup Abuse Prevention
 * Handles clerk.user.created events to track and prevent signup abuse
 * 
 * Set this up in your Clerk Dashboard:
 * 1. Go to Webhooks (Settings → Webhooks)
 * 2. Add new endpoint: https://your-domain.netlify.app/.netlify/functions/clerk-webhook
 * 3. Subscribe to: user.created
 * 4. Copy signing secret to CLERK_WEBHOOK_SECRET env var
 */

import { Webhook } from 'svix';
import {
  supabase,
  getClientIP,
  isBlockedEmailDomain,
  checkSignupLimit,
  logAccountSignup
} from './supabaseClient.js';

// Configuration
const MAX_SIGNUPS_PER_IP = 2; // Allow 2 accounts per IP
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
    // Get the signing secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[CLERK WEBHOOK] CLERK_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the webhook signature
    const payload = await req.text();
    const headers = {
      'svix-id': req.headers.get('svix-id'),
      'svix-timestamp': req.headers.get('svix-timestamp'),
      'svix-signature': req.headers.get('svix-signature')
    };

    console.log('[CLERK WEBHOOK] Received webhook from Clerk');

    let evt;
    try {
      const wh = new Webhook(webhookSecret);
      evt = wh.verify(payload, headers);
    } catch (err) {
      console.error('[CLERK WEBHOOK] Invalid signature:', err.message);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle user.created event
    if (evt.type === 'user.created') {
      return await handleUserCreated(evt.data, req, context);
    }

    // Ignore other event types
    console.log(`[CLERK WEBHOOK] Ignoring event type: ${evt.type}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[CLERK WEBHOOK] Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Handle user.created event from Clerk
 */
async function handleUserCreated(userData, req, context) {
  const clerkUserId = userData.id;
  const primaryEmail = userData.email_addresses?.[0]?.email_address;
  const userAgent = req.headers.get('user-agent');

  // Extract IP address - Clerk webhook doesn't always provide it in context
  // So we use the request headers
  const ip = getClientIP(req, context);

  console.log(`[SIGNUP DETECT] New user: ${clerkUserId}, Email: ${primaryEmail}, IP: ${ip}`);

  if (!primaryEmail) {
    console.warn(`[SIGNUP DETECT] No email found for user ${clerkUserId}`);
    return new Response(JSON.stringify({ error: 'No email provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if email domain is blocked
  if (BLOCK_TEMP_EMAIL_DOMAINS) {
    const isBlocked = await isBlockedEmailDomain(primaryEmail);
    if (isBlocked) {
      const domain = primaryEmail.split('@')[1];
      console.log(`[SIGNUP BLOCKED] Temporary email domain: ${domain}`);

      // Log the blocked signup
      await logAccountSignup(clerkUserId, ip, primaryEmail, userAgent, true, 'Temporary email domain');

      // Return success to acknowledge the webhook (but the account was logged as blocked)
      return new Response(JSON.stringify({
        ok: true,
        blocked: true,
        reason: 'Temporary email domains not allowed'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Check signup rate limit
  const signupCheck = await checkSignupLimit(ip, MAX_SIGNUPS_PER_IP, SIGNUP_WINDOW_HOURS);

  if (!signupCheck.allowed) {
    console.log(`[SIGNUP BLOCKED] Rate limit exceeded for IP: ${ip}, Reason: ${signupCheck.reason}`);

    // Log the blocked signup
    await logAccountSignup(clerkUserId, ip, primaryEmail, userAgent, true, 'IP signup rate limit exceeded');

    // Return success to acknowledge the webhook (but the account was logged as blocked)
    return new Response(JSON.stringify({
      ok: true,
      blocked: true,
      reason: signupCheck.reason,
      resetTime: signupCheck.resetTime
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Signup is allowed - log it
  console.log(`[SIGNUP ALLOWED] User ${clerkUserId} from IP ${ip}`);
  await logAccountSignup(clerkUserId, ip, primaryEmail, userAgent, false);

  return new Response(JSON.stringify({
    ok: true,
    blocked: false,
    message: 'Signup logged successfully'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
