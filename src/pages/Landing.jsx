import { useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={containerStyle}>
      <section style={heroStyle}>
        <h1 style={headingStyle}>🎯 Welcome to Aimalyze</h1>
        <p style={subtitleStyle}>AI-powered video analytics at your fingertips</p>
        <p style={descriptionStyle}>
          Upload your videos and let our AI analyze them. Get insights, summaries, 
          and detailed analytics powered by Google Gemini.
        </p>

        <div style={ctaContainerStyle}>
          <SignedIn>
            <button 
              onClick={() => navigate('/upload')} 
              style={primaryButtonStyle}
            >
              Start Analyzing 🚀
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={secondaryButtonStyle}
            >
              View Dashboard 📊
            </button>
          </SignedIn>

          <SignedOut>
            <p style={signInPromptStyle}>Sign in to get started with Aimalyze</p>
          </SignedOut>
        </div>
      </section>

      <section style={featuresStyle}>
        <h2 style={featuresHeadingStyle}>Features</h2>
        <div style={featureGridStyle}>
          <div style={featureCardStyle}>
            <div style={featureIconStyle}>🎬</div>
            <h3 style={featureTitleStyle}>Video Upload</h3>
            <p style={featureTextStyle}>Upload videos in any format and get instant AI analysis</p>
          </div>
          <div style={featureCardStyle}>
            <div style={featureIconStyle}>🤖</div>
            <h3 style={featureTitleStyle}>AI-Powered</h3>
            <p style={featureTextStyle}>Powered by Google Gemini for accurate insights</p>
          </div>
          <div style={featureCardStyle}>
            <div style={featureIconStyle}>📊</div>
            <h3 style={featureTitleStyle}>Analytics Dashboard</h3>
            <p style={featureTextStyle}>View detailed analytics and summaries of your videos</p>
          </div>
          <div style={featureCardStyle}>
            <div style={featureIconStyle}>⚡</div>
            <h3 style={featureTitleStyle}>Fast Processing</h3>
            <p style={featureTextStyle}>Get results in seconds with our optimized processing</p>
          </div>
        </div>
      </section>
    </div>
  )
}

const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#0f0f0f',
  color: '#fff',
  paddingTop: '2rem'
}

const heroStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '3rem 2rem',
  textAlign: 'center'
}

const headingStyle = {
  fontSize: '3.5rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
}

const subtitleStyle = {
  fontSize: '1.5rem',
  marginBottom: '1rem',
  color: '#ccc'
}

const descriptionStyle = {
  fontSize: '1.1rem',
  color: '#aaa',
  marginBottom: '2rem',
  lineHeight: '1.6'
}

const ctaContainerStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  flexWrap: 'wrap',
  marginTop: '2rem'
}

const primaryButtonStyle = {
  padding: '0.75rem 2rem',
  fontSize: '1rem',
  backgroundColor: '#667eea',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
}

const secondaryButtonStyle = {
  padding: '0.75rem 2rem',
  fontSize: '1rem',
  backgroundColor: 'transparent',
  color: '#667eea',
  border: '2px solid #667eea',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease'
}

const signInPromptStyle = {
  fontSize: '1.1rem',
  color: '#aaa'
}

const featuresStyle = {
  maxWidth: '1200px',
  margin: '4rem auto',
  padding: '2rem'
}

const featuresHeadingStyle = {
  fontSize: '2.5rem',
  textAlign: 'center',
  marginBottom: '3rem',
  color: '#fff'
}

const featureGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '2rem'
}

const featureCardStyle = {
  backgroundColor: '#1a1a1a',
  padding: '2rem',
  borderRadius: '12px',
  textAlign: 'center',
  border: '1px solid #333',
  transition: 'all 0.3s ease',
  cursor: 'pointer'
}

const featureIconStyle = {
  fontSize: '3rem',
  marginBottom: '1rem'
}

const featureTitleStyle = {
  fontSize: '1.3rem',
  marginBottom: '0.5rem',
  color: '#fff'
}

const featureTextStyle = {
  fontSize: '0.95rem',
  color: '#aaa',
  lineHeight: '1.5'
}
