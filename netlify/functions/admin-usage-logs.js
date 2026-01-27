import { supabase } from './supabaseClient.js';

export default async (req, context) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Only allow Clerk users with @aimalyze.com email
  const email = context?.clientContext?.user?.email || '';
  if (!email.endsWith('@aimalyze.com')) {
    return new Response('Forbidden', { status: 403 });
  }

  // Filters
  const url = new URL(req.url);
  const user_id = url.searchParams.get('user_id');
  const ip_address = url.searchParams.get('ip_address');
  const verdict = url.searchParams.get('verdict');
  const date = url.searchParams.get('date');

  let query = supabase.from('usage_logs').select('*').order('timestamp', { ascending: false }).limit(500);
  if (user_id) query = query.eq('user_id', user_id);
  if (ip_address) query = query.eq('ip_address', ip_address);
  if (verdict) query = query.ilike('verdict', `%${verdict}%`);
  if (date) query = query.gte('timestamp', `${date}T00:00:00Z`).lte('timestamp', `${date}T23:59:59Z`);

  const { data, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ logs: data }), { status: 200 });
};
