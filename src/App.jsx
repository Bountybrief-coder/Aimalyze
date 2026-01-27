import { Routes, Route, Link } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react'

// Pages (you'll add them next)
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './pages/Upload.jsx'
import Pricing from './pages/Pricing.jsx'

export default function App() {
  return (
    <>
      <nav style={navStyle}>
        <Link to="/" style={logoStyle}>🎯 Aimalyze</Link>
        <div style={linkContainer}>
          <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
          <Link to="/upload" style={linkStyle}>Upload</Link>
          <Link to="/pricing" style={linkStyle}>Pricing</Link>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<h2 style={{ textAlign: 'center' }}>404 - Page Not Found</h2>} />
      </Routes>

      <SignedOut>
        <SignIn />
      </SignedOut>
    </>
  )
}

const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 2rem',
  backgroundColor: '#111',
  color: '#fff'
}
const logoStyle = { fontSize: '1.5rem', color: '#fff', textDecoration: 'none' }
const linkContainer = { display: 'flex', gap: '1rem', alignItems: 'center' }
const linkStyle = { color: '#ccc', textDecoration: 'none', fontSize: '1rem' }
