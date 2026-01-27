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
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={pageHeadingStyle}>💸 Choose Your Plan</h1>
        <p style={subtitleStyle}>Flexible pricing for every need</p>
      </div>

      <div style={plansGridStyle}>
        {plans.map((plan, index) => (
          <div
            key={index}
            style={{...planCardStyle, ...(plan.highlighted ? planCardHighlightedStyle : {})}}
          >
            {plan.highlighted && <div style={badgeStyle}>Most Popular</div>}
            <h2 style={planNameStyle}>{plan.name}</h2>
            <div style={priceStyle}>
              <span style={priceNumberStyle}>{plan.price}</span>
              {plan.period && <span style={periodStyle}>{plan.period}</span>}
            </div>
            <p style={descriptionStyle}>
              {plan.name === 'Starter' && 'Perfect for trying Aimalyze'}
              {plan.name === 'Professional' && 'Best for content creators & teams'}
              {plan.name === 'Enterprise' && 'For large-scale operations'}
            </p>

            <button
              onClick={() => navigate('/upload')}
              style={{...ctaButtonStyle, ...(plan.highlighted ? ctaButtonPrimaryStyle : ctaButtonSecondaryStyle)}}
            >
              {plan.cta}
            </button>

            <div style={featuresListStyle}>
              {plan.features.map((feature, idx) => (
                <div key={idx} style={featureItemStyle}>
                  <span style={checkmarkStyle}>✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <section style={faqStyle}>
        <h2 style={faqHeadingStyle}>Frequently Asked Questions</h2>
        <div style={faqContainerStyle}>
          <div style={faqItemStyle}>
            <h3 style={faqQuestionStyle}>Can I switch plans anytime?</h3>
            <p style={faqAnswerStyle}>
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div style={faqItemStyle}>
            <h3 style={faqQuestionStyle}>Do you offer refunds?</h3>
            <p style={faqAnswerStyle}>
              We offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your payment.
            </p>
          </div>
          <div style={faqItemStyle}>
            <h3 style={faqQuestionStyle}>Is there a free trial?</h3>
            <p style={faqAnswerStyle}>
              Yes! Professional and Enterprise plans come with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div style={faqItemStyle}>
            <h3 style={faqQuestionStyle}>What if I need more storage?</h3>
            <p style={faqAnswerStyle}>
              Additional storage is available for $5/100GB. Contact our sales team for custom packages.
            </p>
          </div>
          <div style={faqItemStyle}>
            <h3 style={faqQuestionStyle}>Do you have educational discounts?</h3>
            <p style={faqAnswerStyle}>
              Yes! Students and educational institutions get 50% off. Please contact our sales team.
            </p>
          </div>
          <div style={faqItemStyle}>
            <h3 style={faqQuestionStyle}>What payment methods do you accept?</h3>
            <p style={faqAnswerStyle}>
              We accept all major credit cards, PayPal, and bank transfers for Enterprise customers.
            </p>
          </div>
        </div>
      </section>

      <section style={ctaFinalStyle}>
        <h2 style={ctaHeadingStyle}>Ready to get started?</h2>
        <p style={ctaTextStyle}>Join thousands of creators using Aimalyze</p>
        <SignedIn>
          <button 
            onClick={() => navigate('/upload')}
            style={ctaFinalButtonStyle}
          >
            Upload Your First Video 🚀
          </button>
        </SignedIn>
        <SignedOut>
          <p style={signInPromptStyle}>Sign in to get started with your chosen plan</p>
        </SignedOut>
      </section>
    </div>
  )
}

const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#0f0f0f',
  color: '#fff',
  padding: '2rem'
}

const headerStyle = {
  maxWidth: '1200px',
  margin: '0 auto 4rem',
  textAlign: 'center'
}

const pageHeadingStyle = {
  fontSize: '2.8rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem'
}

const subtitleStyle = {
  fontSize: '1.2rem',
  color: '#aaa'
}

const plansGridStyle = {
  maxWidth: '1200px',
  margin: '0 auto 4rem',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '2rem'
}

const planCardStyle = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '12px',
  padding: '2.5rem',
  position: 'relative',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
}

const planCardHighlightedStyle = {
  backgroundColor: '#1a1a1a',
  border: '2px solid #667eea',
  transform: 'scale(1.05)',
  boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)'
}

const badgeStyle = {
  position: 'absolute',
  top: '-12px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#667eea',
  color: '#fff',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  fontSize: '0.85rem',
  fontWeight: 'bold'
}

const planNameStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '1rem'
}

const priceStyle = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.5rem',
  marginBottom: '1rem'
}

const priceNumberStyle = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: '#667eea'
}

const periodStyle = {
  color: '#aaa'
}

const descriptionStyle = {
  color: '#aaa',
  marginBottom: '1.5rem',
  height: '1.5rem'
}

const ctaButtonStyle = {
  width: '100%',
  padding: '1rem',
  borderRadius: '8px',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '1rem',
  marginBottom: '2rem',
  transition: 'all 0.3s ease'
}

const ctaButtonPrimaryStyle = {
  backgroundColor: '#667eea',
  color: '#fff'
}

const ctaButtonSecondaryStyle = {
  backgroundColor: 'transparent',
  color: '#667eea',
  border: '2px solid #667eea'
}

const featuresListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
}

const featureItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  color: '#aaa'
}

const checkmarkStyle = {
  color: '#10b981',
  fontWeight: 'bold',
  fontSize: '1.2rem'
}

const faqStyle = {
  maxWidth: '1000px',
  margin: '4rem auto'
}

const faqHeadingStyle = {
  fontSize: '2.2rem',
  textAlign: 'center',
  marginBottom: '3rem'
}

const faqContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem'
}

const faqItemStyle = {
  backgroundColor: '#1a1a1a',
  padding: '2rem',
  borderRadius: '12px',
  border: '1px solid #333'
}

const faqQuestionStyle = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  color: '#667eea'
}

const faqAnswerStyle = {
  color: '#aaa',
  lineHeight: '1.6'
}

const ctaFinalStyle = {
  maxWidth: '800px',
  margin: '4rem auto',
  textAlign: 'center',
  backgroundColor: '#1a1a1a',
  padding: '3rem',
  borderRadius: '12px',
  border: '1px solid #333'
}

const ctaHeadingStyle = {
  fontSize: '2rem',
  marginBottom: '0.5rem'
}

const ctaTextStyle = {
  fontSize: '1.1rem',
  color: '#aaa',
  marginBottom: '2rem'
}

const ctaFinalButtonStyle = {
  padding: '1rem 2rem',
  fontSize: '1rem',
  backgroundColor: '#667eea',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease'
}

const signInPromptStyle = {
  fontSize: '1.1rem',
  color: '#aaa'
}
