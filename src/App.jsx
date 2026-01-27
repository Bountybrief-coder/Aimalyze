import { Routes, Route, Link } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react'
import { AiOutlineDashboard, AiOutlineCloudUpload, AiOutlineDollarCircle, AiOutlineMenu, AiOutlineClose } from 'react-icons/ai'
import { useState } from 'react'

// Pages
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './pages/Upload.jsx'
import Pricing from './pages/Pricing.jsx'

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: AiOutlineDashboard },
    { path: '/upload', label: 'Upload', icon: AiOutlineCloudUpload },
    { path: '/pricing', label: 'Pricing', icon: AiOutlineDollarCircle },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation Bar */}
      <nav className="bg-gray-950 border-b border-neon-cyan/20 sticky top-0 z-50 backdrop-blur-sm bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 min-w-[40px]"
              aria-label="Aimalyze Home"
            >
              <img 
                src="/logo.png" 
                alt="Aimalyze logo: AI brain with eye" 
                className="h-10 w-auto sm:h-12 md:h-14 object-contain" 
                style={{ maxWidth: '56px' }}
                loading="eager"
                draggable="false"
              />
              <span className="hidden sm:inline text-2xl font-bold bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple bg-clip-text text-transparent hover:drop-shadow-[0_0_8px_rgba(255,0,128,0.6)] transition-all duration-300">Aimalyze</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link 
                    key={link.path}
                    to={link.path} 
                    className="text-gray-300 hover:text-neon-cyan transition-all duration-200 font-medium relative group flex items-center gap-2"
                  >
                    <Icon className="text-lg group-hover:drop-shadow-[0_0_8px_rgba(0,255,198,0.5)]" />
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-neon-cyan to-neon-pink group-hover:w-full transition-all duration-300"></span>
                  </Link>
                )
              })}
              
              {/* Auth Button */}
              <SignedIn>
                <div className="pl-6 border-l border-neon-cyan/30">
                  <UserButton 
                    appearance={{
                      elements: {
                        rootBox: "w-10 h-10",
                        avatarBox: "w-10 h-10 rounded-full border-2 border-neon-cyan/50 hover:border-neon-cyan transition-all"
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      rootBox: "w-8 h-8",
                      avatarBox: "w-8 h-8 rounded-full border border-neon-cyan/50"
                    }
                  }}
                />
              </SignedIn>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-neon-cyan hover:text-neon-pink transition-colors p-2 rounded-lg hover:bg-gray-900/50"
              >
                {mobileMenuOpen ? (
                  <AiOutlineClose size={24} />
                ) : (
                  <AiOutlineMenu size={24} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t border-neon-cyan/10 mt-4 pt-4">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-neon-cyan hover:bg-gray-900/50 rounded-lg transition-all duration-200 font-medium group"
                  >
                    <Icon className="text-lg group-hover:drop-shadow-[0_0_8px_rgba(0,255,198,0.5)]" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-4">404 - Page Not Found</h2>
                  <p className="text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
                  <Link 
                    to="/" 
                    className="inline-block px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Go Home
                  </Link>
                </div>
              </div>
            } 
          />
        </Routes>
      </main>

      {/* Sign In Modal */}
      <SignedOut>
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <SignIn />
        </div>
      </SignedOut>
    </div>
  )
}
