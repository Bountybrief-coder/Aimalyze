/**
 * Netlify Function: Check User Quota
 * Returns user's current plan and daily usage for frontend quota display
 */

import { getUserPlan, getTodayUsage } from './supabaseClient.js';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[QUOTA CHECK] Checking quota for user: ${userId}`);

    const plan = await getUserPlan(userId);
    const usage = await getTodayUsage(userId);

    const limits = {
      'free': 1,
      'gamer': 50,
      'wager_org': 99999
    };

    const limit = limits[plan.plan_type] || 1;

    console.log(`[QUOTA CHECK] User: ${userId}, Plan: ${plan.plan_type}, Usage: ${usage.analysis_count}/${limit}`);

    return new Response(JSON.stringify({
      plan: plan.plan_type,
      status: plan.status,
      usage: usage.analysis_count,
      limit: limit,
      canAnalyze: usage.analysis_count < limit
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[QUOTA CHECK] Error:', error);
    
    // Return default free plan on error
    return new Response(JSON.stringify({
      plan: 'free',
      status: 'active',
      usage: 0,
      limit: 1,
      canAnalyze: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
