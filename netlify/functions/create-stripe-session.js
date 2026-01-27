import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { userId, planType } = await req.json();
  if (!userId || !['monthly', 'lifetime'].includes(planType)) {
    return new Response('Invalid request', { status: 400 });
  }

  const priceId = planType === 'monthly'
    ? process.env.STRIPE_PRICE_ID_MONTHLY
    : process.env.STRIPE_PRICE_ID_LIFETIME;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: planType === 'monthly' ? 'subscription' : 'payment',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/upload?success=1`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=1`,
    metadata: {
      user_id: userId,
      plan_type: planType,
    },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
