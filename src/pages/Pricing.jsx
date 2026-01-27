import { useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { AiOutlineCheck } from 'react-icons/ai'
import { motion } from 'framer-motion'

export default function Pricing() {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Forever',
      description: 'Perfect for trying Aimalyze',
      scanLimit: '1 scan per day',
      features: [
        'AI-powered cheat detection',
        'Basic analysis reports',
        'Instant results',
        '7 GB storage',
        'Community support'
      ],
      cta: 'Start Free',
      highlighted: false,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Gamer',
      price: '$9',
      period: '/month',
      description: 'Most popular for competitive players',
      scanLimit: '50 scans per month',
      features: [
        'Unlimited monthly scans',
        'Advanced AI analysis',
        'Priority processing',
        '100 GB storage',
        'Email support',
        'Detailed analytics dashboard',
        'Export reports as PDF'
      ],
      cta: 'Get Started',
      highlighted: true,
      gradient: 'from-neon-cyan to-neon-pink'
    },
    {
      name: 'Wager Org',
      price: '$199',
      period: 'One-time',
      description: 'For teams and organizations',
      scanLimit: 'Unlimited scans',
      features: [
        'Lifetime license',
        'Unlimited scans forever',
        'Advanced AI analysis',
        'Unlimited storage',
        'Priority support 24/7',
        'Team management (up to 10 users)',
        'Custom integrations',
        'Detailed audit logs'
      ],
      cta: 'Get Lifetime Access',
      highlighted: false,
      gradient: 'from-neon-purple to-neon-pink'
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900 text-white p-6 sm:p-8"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/3 w-96 h-96 bg-neon-pink/5 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-40 left-1/4 w-80 h-80 bg-neon-cyan/5 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative z-10 max-w-5xl mx-auto text-center mb-16"
      >
        <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent drop-shadow-lg">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
          Choose the perfect plan for your gaming needs. No hidden fees, cancel anytime.
        </p>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, staggerChildren: 0.15 }}
        className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
      >
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.15, duration: 0.5 }}
            whileHover={!plan.highlighted ? { scale: 1.05, y: -8 } : { y: -8 }}
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
              plan.highlighted
                ? 'md:scale-105 md:row-span-2'
                : ''
            }`}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

            {/* Card Container */}
            <div
              className={`relative backdrop-blur-sm p-8 rounded-2xl h-full transition-all duration-300 group ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 border-neon-cyan shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60'
                  : 'bg-gray-800/50 border border-neon-cyan/30 hover:border-neon-cyan/60 hover:shadow-lg hover:shadow-cyan-500/20'
              }`}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-neon-cyan to-neon-pink text-gray-950 px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/50 flex items-center gap-2">
                    ⭐ Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <h2 className={`text-3xl font-bold mb-2 bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                  {plan.name}
                </h2>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <div className="inline-block px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                  <p className="text-neon-cyan font-semibold text-sm">{plan.scanLimit}</p>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigate('/upload')}
                className={`w-full py-3 px-4 rounded-lg font-bold text-base mb-8 transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-neon-cyan to-neon-pink hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105 text-gray-950 group-hover:scale-105'
                    : 'bg-transparent border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-lg hover:shadow-cyan-500/30'
                }`}
              >
                {plan.cta} →
              </button>

              {/* Features List */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.15 + 0.2 }}
                className="space-y-4"
              >
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-6">What's Included</p>
                {plan.features.map((feature, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.15 + 0.2 + idx * 0.05 }}
                    className="flex items-start gap-3 group/item"
                  >
                    <AiOutlineCheck className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5 group-hover/item:drop-shadow-[0_0_8px_rgba(0,255,198,0.6)] transition-all" />
                    <span className="text-gray-300 group-hover/item:text-white transition-colors text-sm">{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* FAQ Section */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative z-10 max-w-4xl mx-auto mb-20"
      >
        <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-400 mb-12">Everything you need to know about our pricing</p>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, staggerChildren: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {[
            {
              q: 'Can I upgrade or downgrade anytime?',
              a: 'Yes! You can change your plan at any time. Changes take effect immediately, and we'll prorate your billing.'
            },
            {
              q: 'What happens if I exceed my scan limit?',
              a: 'You can purchase additional scans as needed, or upgrade to a higher tier. No automatic charges.'
            },
            {
              q: 'Is there a free trial?',
              a: 'Yes! Start with our Free plan to test Aimalyze. Upgrade anytime with no credit card required initially.'
            },
            {
              q: 'Do you offer refunds?',
              a: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, we\'ll refund your payment, no questions asked.'
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for enterprise customers.'
            },
            {
              q: 'Is Wager Org truly lifetime?',
              a: 'Yes! With Wager Org, you get a one-time payment for unlimited scans forever. Free updates included.'
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + idx * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-gray-800/40 border border-neon-cyan/20 hover:border-neon-cyan/60 rounded-xl p-6 transition-all duration-300 hover:bg-gray-800/60 hover:shadow-lg hover:shadow-cyan-500/10 group"
            >
              <h3 className="text-lg font-bold mb-3 text-neon-cyan group-hover:text-neon-pink transition-colors">{item.q}</h3>
              <p className="text-gray-300 leading-relaxed text-sm">{item.a}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Final CTA Section */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 max-w-3xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-2xl p-12 md:p-16">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10 blur-xl"></div>
          <div className="absolute inset-0 border border-neon-cyan/30 rounded-2xl"></div>

          <div className="relative z-10 text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">
              Ready to elevate your gameplay? 🚀
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
              Join thousands of competitive gamers using Aimalyze to detect cheaters and maintain fair play.
            </p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <SignedIn>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/upload')}
                  className="px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-pink hover:shadow-lg hover:shadow-cyan-500/50 text-gray-950 font-bold rounded-lg transition-all duration-300 text-base"
                >
                  Get Started Now →
                </motion.button>
              </SignedIn>
              <SignedOut>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="px-8 py-4 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-lg hover:shadow-cyan-500/30 font-bold rounded-lg transition-all duration-300"
                >
                  Sign In First
                </motion.button>
              </SignedOut>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const element = document.querySelector('h2')
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-8 py-4 border-2 border-neon-purple/50 text-neon-purple/90 hover:border-neon-purple hover:bg-neon-purple/10 hover:shadow-lg hover:shadow-purple-500/30 font-bold rounded-lg transition-all duration-300"
              >
                Compare Plans
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
