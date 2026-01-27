import { useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

export default function Pricing() {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      features: [
        '5 videos per month',
        'Basic video analysis',
        'Standard processing speed',
        'Email support',
        '1 GB storage'
      ],
      cta: 'Get Started',
      highlighted: false
    },
    {
      name: 'Professional',
      price: '$29',
      period: '/month',
      features: [
        'Unlimited videos',
        'Advanced AI analysis with Gemini',
        'Priority processing',
        'Email & chat support',
        '100 GB storage',
        'Custom analytics reports',
        'API access'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'Priority support 24/7',
        'Unlimited storage',
        'Advanced security features',
        'Custom SLA'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent drop-shadow-lg">💸 Choose Your Plan</h1>
        <p className="text-xl text-gray-300">Flexible pricing for every need</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative rounded-lg p-10 transition-all hover:shadow-lg ${
              plan.highlighted
                ? 'bg-gray-900 border-2 border-neon-cyan shadow-lg shadow-cyan-500/40 lg:scale-105 hover:shadow-cyan-500/60'
                : 'bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 hover:shadow-cyan-500/20'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-neon-cyan to-neon-pink text-gray-950 px-4 py-1 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/50">
                Most Popular
              </div>
            )}
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">{plan.name}</h2>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">{plan.price}</span>
              {plan.period && <span className="text-gray-400">{plan.period}</span>}
            </div>
            <p className="text-gray-400 mb-6 h-6">
              {plan.name === 'Starter' && 'Perfect for trying Aimalyze'}
              {plan.name === 'Professional' && 'Best for content creators & teams'}
              {plan.name === 'Enterprise' && 'For large-scale operations'}
            </p>

            <button
              onClick={() => navigate('/upload')}
              className={`w-full py-3 px-4 rounded-lg font-bold text-lg mb-8 transition-all ${
                plan.highlighted
                  ? 'bg-gradient-to-r from-neon-cyan to-neon-pink hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105 text-gray-950'
                  : 'bg-transparent border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-lg hover:shadow-cyan-500/30'
              }`}
            >
              {plan.cta}
            </button>

            <div className="space-y-4">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 text-gray-300 group">
                  <span className="text-neon-cyan font-bold text-lg group-hover:drop-shadow-[0_0_8px_rgba(0,255,198,0.5)] transition-all">✓</span>
                  <span className="group-hover:text-white transition-colors">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-8 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">Can I switch plans anytime?</h3>
            <p className="text-gray-400 leading-relaxed">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div className="bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-8 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">Do you offer refunds?</h3>
            <p className="text-gray-400 leading-relaxed">
              We offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your payment.
            </p>
          </div>
          <div className="bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-8 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">Is there a free trial?</h3>
            <p className="text-gray-400 leading-relaxed">
              Yes! Professional and Enterprise plans come with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div className="bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-8 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">What if I need more storage?</h3>
            <p className="text-gray-400 leading-relaxed">
              Additional storage is available for $5/100GB. Contact our sales team for custom packages.
            </p>
          </div>
          <div className="bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-8 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">Do you have educational discounts?</h3>
            <p className="text-gray-400 leading-relaxed">
              Yes! Students and educational institutions get 50% off. Please contact our sales team.
            </p>
          </div>
          <div className="bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-8 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
            <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">What payment methods do you accept?</h3>
            <p className="text-gray-400 leading-relaxed">
              We accept all major credit cards, PayPal, and bank transfers for Enterprise customers.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto text-center bg-gray-900 border border-neon-cyan/30 rounded-lg p-12 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">Ready to get started?</h2>
        <p className="text-lg text-gray-300 mb-8">Join thousands of creators using Aimalyze</p>
        <SignedIn>
          <button 
            onClick={() => navigate('/upload')}
            className="px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-pink hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105 text-gray-950 font-bold rounded-lg transition-all duration-300 text-lg"
          >
            Upload Your First Video 🚀
          </button>
        </SignedIn>
        <SignedOut>
          <p className="text-lg text-gray-400">Sign in to get started with your chosen plan</p>
        </SignedOut>
      </section>
    </div>
  )
}
