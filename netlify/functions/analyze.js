import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
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
    let file = formData.get('file');
    let youtubeUrl = formData.get('youtubeUrl');
    let tempVideoPath = null;
    let tempFrames = [];

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

    // --- INPUT HANDLING: File or YouTube ---
    if (file && file.size > 0) {
      // Validate file size (max 200MB)
      const MAX_FILE_SIZE = 200 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        await logIPAddress(clientIP);
        await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success: false, verdict: 'BLOCKED: File too large' });
        return new Response(JSON.stringify({ 
          error: 'File too large',
          message: `Maximum file size is 200MB, received ${(file.size / 1024 / 1024).toFixed(2)}MB`
        }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success: false, verdict: 'BLOCKED: Invalid file type' });
        return new Response(JSON.stringify({ error: 'Invalid file type' }), { status: 400 });
      }
      // Save to temp file
      const buffer = Buffer.from(await file.arrayBuffer());
      tempVideoPath = path.join(os.tmpdir(), `aimalyze-upload-${Date.now()}.mp4`);
      fs.writeFileSync(tempVideoPath, buffer);
      videoType = 'upload';
    } else if (youtubeUrl && typeof youtubeUrl === 'string' && youtubeUrl.trim().length > 0) {
      // Validate YouTube URL
      if (!ytdl.validateURL(youtubeUrl)) {
        await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType: 'youtube', success: false, verdict: 'BLOCKED: Invalid YouTube URL' });
        return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), { status: 400 });
      }
      // Download up to 2 minutes
      const info = await ytdl.getInfo(youtubeUrl);
      const lengthSec = parseInt(info.videoDetails.lengthSeconds, 10);
      if (lengthSec > 120) {
        await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType: 'youtube', success: false, verdict: 'BLOCKED: YouTube video too long' });
        return new Response(JSON.stringify({ error: 'YouTube video too long (max 2 minutes)' }), { status: 400 });
      }
      tempVideoPath = path.join(os.tmpdir(), `aimalyze-youtube-${Date.now()}.mp4`);
      await new Promise((resolve, reject) => {
        ytdl(youtubeUrl, { quality: 'highest', filter: 'audioandvideo' })
          .pipe(fs.createWriteStream(tempVideoPath))
          .on('finish', resolve)
          .on('error', reject);
      });
      videoType = 'youtube';
    } else {
      await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success: false, verdict: 'BLOCKED: No input' });
      return new Response(JSON.stringify({ error: 'No video file or YouTube link provided' }), { status: 400 });
    }

    // --- FRAME EXTRACTION ---
    ffmpeg.setFfmpegPath(ffmpegPath);
    const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aimalyze-frames-'));
    await new Promise((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .outputOptions([
          '-vf', 'fps=0.5,scale=512:-1', // 1 frame every 2s, width 512px
          '-qscale:v', '2'
        ])
        .output(path.join(frameDir, 'frame-%02d.jpg'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    // Collect up to 20 frames
    tempFrames = fs.readdirSync(frameDir)
      .filter(f => f.endsWith('.jpg'))
      .sort()
      .slice(0, 20)
      .map(f => fs.readFileSync(path.join(frameDir, f)));
    if (tempFrames.length < 1) {
      await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success: false, verdict: 'BLOCKED: No frames extracted' });
      return new Response(JSON.stringify({ error: 'Failed to extract frames from video' }), { status: 500 });
    }

    // Call Gemini Vision API with all frames
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

Compare controller overlay (if visible) to movement. Respond ONLY with a JSON object in this exact format:
{
  "verdict": "Likely Cheating" | "Clean" | "Suspicious" | "Inconclusive",
  "confidence": "<percent, e.g. 91%>",
  "reasoning": "<1-2 sentence summary of the evidence and reasoning>"
}

Be extremely thorough, objective, and do not guess. If unsure, use "Inconclusive" with a low confidence.`;

    // Prepare frames for Gemini
    const geminiInputs = tempFrames.map(buf => ({ inlineData: { mimeType: 'image/jpeg', data: buf.toString('base64') } }));
    geminiInputs.push(prompt);

    let result = null;
    let verdict = null;
    let confidence = null;
    let reasoning = null;
    let success = false;
    try {
      const response = await model.generateContent(geminiInputs);
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
      reasoning = result.reasoning || null;
      success = true;
      console.log(`[SUCCESS] Analysis complete for IP ${clientIP}. Verdict: ${verdict}, Confidence: ${confidence}, Reasoning: ${reasoning}`);
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
      await logAnalysis(clerkUserId, videoType === 'upload' && file ? file.name : (youtubeUrl || 'YouTube'), 0, verdict, confidence, JSON.stringify(result));
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
      console.log(`[USAGE LOGGED] User: ${clerkUserId}, Input: ${videoType}, Plan: ${planType}`);
    }
    // Log usage for all attempts (success or fail)
    await logUsageAttempt({ userId: clerkUserId, ip: clientIP, videoType, success, verdict });

    // Clean up temp files
    try {
      if (tempVideoPath && fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      if (tempFrames && tempFrames.length > 0) {
        fs.rmSync(frameDir, { recursive: true, force: true });
      }
    } catch (e) { /* ignore */ }

    // Periodically clean up old logs
    if (Math.random() < 0.1) { // 10% chance to run cleanup
      cleanupOldLogs(7);
    }

    return new Response(JSON.stringify({
      verdict,
      confidence,
      reasoning,
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
