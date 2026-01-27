import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import {
  getClientIP,
  checkRateLimit,
  logIPAddress,
  cleanupOldLogs,
  logAnalysis,
  supabase
} from './supabaseClient.js';

// Helper to log usage for every scan attempt
async function logUsageAttempt({ userId, ip, videoType, success, verdict }) {
  try {
    await supabase.from('usage_logs').insert({
      user_id: userId || null,
      ip_address: ip,
      video_type: videoType,
      success,
      verdict: verdict || null,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to log usage attempt:', e);
  }
}

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limit configuration
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_HOURS = 24;

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const clientIP = getClientIP(req, context);
  console.log(`[REQUEST] IP: ${clientIP}, Time: ${new Date().toISOString()}`);

  try {
    // Get Clerk user ID from request (sent by frontend)
    const formData = await req.formData();
    const clerkUserId = formData.get('userId');
    let videoType = 'upload';

    // PAID ACCESS ENFORCEMENT
    let planType = 'free';
    let lastScanAt = null;
    if (clerkUserId) {
      // 1. Check user_plans table for plan_type
      const { data: planRow, error: planError } = await supabase
        .from('user_plans')
        .select('plan_type, last_scan_at')
        .eq('user_id', clerkUserId)
        .single();
      if (planRow) {
        planType = planRow.plan_type;
        lastScanAt = planRow.last_scan_at;
      }
      // 2. If paid plan, allow unlimited
      if (planType === 'monthly' || planType === 'lifetime') {
        // allow
      } else {
        // 3. If free, check scan_usage for prior use
        const { data: usageRows, error: usageError } = await supabase
          .from('scan_usage')
          .select('id')
          .eq('user_id', clerkUserId)
          .eq('used_free_scan', true);
        if (usageRows && usageRows.length > 0) {
          await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success: false, verdict: 'BLOCKED: Free scan used' });
          return new Response(
            JSON.stringify({ error: 'Upgrade required', message: 'Your free scan has already been used. Please upgrade to continue.' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Check rate limit before processing (IP-based, for anonymous users)
    const rateLimitCheck = await checkRateLimit(clientIP, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_HOURS);
    if (rateLimitCheck.limited) {
      console.warn(`[RATE LIMIT] IP ${clientIP} exceeded limit. Count: ${rateLimitCheck.count}, Remaining: ${rateLimitCheck.remaining}`);
      const resetTime = rateLimitCheck.resetTime ? rateLimitCheck.resetTime.toISOString() : 'unknown';
      await logIPAddress(clientIP);
      await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success: false, verdict: 'BLOCKED: Rate limit' });
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Maximum ${RATE_LIMIT_REQUESTS} analysis requests per ${RATE_LIMIT_WINDOW_HOURS} hours exceeded`,
        remaining: rateLimitCheck.remaining,
        resetTime: resetTime,
        retryAfter: rateLimitCheck.resetTime ? Math.ceil((rateLimitCheck.resetTime - new Date()) / 1000) : null
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitCheck.resetTime ? Math.ceil((rateLimitCheck.resetTime - new Date()) / 1000) : '3600'
        }
      });
    }

    // If user is logged in, check pricing quota
    if (clerkUserId) {
      console.log(`[PRICING CHECK] User: ${clerkUserId}`);
      
      const quotaCheck = await checkAnalysisQuota(clerkUserId);
      
      if (!quotaCheck.allowed) {
        console.warn(`[QUOTA EXCEEDED] User: ${clerkUserId}, Plan: ${quotaCheck.plan}, Usage: ${quotaCheck.usage}/${quotaCheck.limit}`);
        
        return new Response(JSON.stringify({
          error: 'Usage limit reached',
          message: quotaCheck.reason,
          usage: quotaCheck.usage,
          limit: quotaCheck.limit,
          plan: quotaCheck.plan,
          upgradeUrl: '/pricing'
        }), {
          status: 402,  // Payment Required
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log(`[PRICING OK] User: ${clerkUserId}, Usage: ${quotaCheck.usage}/${quotaCheck.limit}, Plan: ${quotaCheck.plan}`);
    }

    const file = formData.get('file');

    if (!file) {
      console.warn(`[VALIDATION] No file provided from IP ${clientIP}`);
      await logIPAddress(clientIP);
      await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success: false, verdict: 'BLOCKED: No file' });
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (max 500MB)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`[VALIDATION] File too large from IP ${clientIP}: ${file.size} bytes`);
      await logIPAddress(clientIP);
      await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success: false, verdict: 'BLOCKED: File too large' });
      return new Response(JSON.stringify({ 
        error: 'File too large',
        message: `Maximum file size is 500MB, received ${(file.size / 1024 / 1024).toFixed(2)}MB`
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[PROCESSING] Starting analysis for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) from IP ${clientIP}`);

    // Log the IP address for this successful analysis request
    await logIPAddress(clientIP);

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Determine MIME type
    const mimeType = file.type || 'video/mp4';

    // Call Gemini API with vision capabilities
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an advanced esports anti-cheat analyst. Analyze this gameplay footage to determine if the player is using any unfair devices or unauthorized input methods (Cronus Zen, Cronus Max, Titan One, Titan Two, XIM Apex, XIM Matrix, mouse & keyboard emulators, strike packs, macros, anti-recoil scripts, etc).

Look for:
- Cronus Zen or Cronus Max usage
- Titan One/Titan Two mods
- XIM Apex or XIM Matrix (mouse/keyboard emulation)
- Keyboard and mouse on console gameplay
- Unnatural flicking or auto-tracking (aimbot)
- Rapid recoil compensation (anti-recoil scripts)
- Perfect input timing (strike packs, macros)
- Input method mismatches (controller overlay vs actual aim behavior)

Pay special attention to:
- Micro-movements and frame-by-frame aim precision
- Inconsistent movement that doesn't match human/controller behavior
- Mouse-like aim on console
- Recoil patterns that are too perfect
- Signs of hardware mods or input spoofing

Respond ONLY with a JSON object in this exact format:
{
  "verdict": "Cheating Likely" | "Clean Gameplay" | "Suspicious" | "Inconclusive",
  "confidence": "<percent, e.g. 91%>",
  "summary": "<1-2 sentence summary of the evidence and reasoning>"
}

Be extremely thorough, objective, and do not guess. If unsure, use "Inconclusive" with a low confidence.`;

    let result = null;
    let verdict = null;
    let confidence = null;
    let summary = null;
    let success = false;
    try {
      const response = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64
          }
        },
        prompt
      ]);
      const text = response.response.text();
      console.log(`[API RESPONSE] Received response from Gemini API (${text.length} chars)`);
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse Gemini response');
      }
      result = JSON.parse(jsonMatch[0]);
      verdict = result.verdict || null;
      confidence = result.confidence || null;
      summary = result.summary || null;
      success = true;
      console.log(`[SUCCESS] Analysis complete for IP ${clientIP}. Verdict: ${verdict}, Confidence: ${confidence}, Summary: ${summary}`);
    } catch (err) {
      await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success: false, verdict: 'FAIL: Gemini error' });
      return new Response(JSON.stringify({ 
        error: 'Failed to analyze video',
        details: err.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log analysis and increment usage if user is logged in
    if (clerkUserId) {
      const fileSizeMb = (file.size / 1024 / 1024).toFixed(2);
      await logAnalysis(clerkUserId, file.name, fileSizeMb, verdict, confidence, JSON.stringify(result));
      if (planType === 'free') {
        // Mark free scan as used
        await supabase.from('scan_usage').insert({
          user_id: clerkUserId,
          ip_address: clientIP,
          used_free_scan: true,
          created_at: new Date().toISOString()
        });
        // Update last_scan_at in user_plans
        await supabase.from('user_plans').upsert({
          user_id: clerkUserId,
          plan_type: 'free',
          last_scan_at: new Date().toISOString()
        });
      } else {
        // Paid: update last_scan_at
        await supabase.from('user_plans').upsert({
          user_id: clerkUserId,
          plan_type: planType,
          last_scan_at: new Date().toISOString()
        });
      }
      // Log to usage_logs as well
      await supabase.from('usage_logs').insert({
        user_id: clerkUserId,
        ip_address: clientIP,
        video_type: videoType,
        success: true,
        verdict: `${verdict} – ${confidence}`,
        timestamp: new Date().toISOString()
      });
      console.log(`[USAGE LOGGED] User: ${clerkUserId}, File: ${file.name}, Plan: ${planType}`);
    }
    // Log usage for all attempts (success or fail)
    await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success, verdict });

    // Periodically clean up old logs
    if (Math.random() < 0.1) { // 10% chance to run cleanup
      cleanupOldLogs(7);
    }

    return new Response(JSON.stringify({
      verdict,
      confidence,
      summary,
      ...result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[ERROR] Analysis failed for IP ${clientIP}:`, error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze video',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
