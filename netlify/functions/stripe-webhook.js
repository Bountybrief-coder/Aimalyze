import { buffer } from 'micro';
import Stripe from 'stripe';
import { supabase } from './supabaseClient.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  const rawBody = await buffer(req.body);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const planType = session.metadata?.plan_type;
    if (userId && planType) {
      await supabase.from('user_plans').upsert({
        user_id: userId,
        plan_type: planType,
        stripe_customer_id: session.customer,
        last_scan_at: new Date().toISOString(),
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
