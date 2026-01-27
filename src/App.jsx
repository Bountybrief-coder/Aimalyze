import { Routes, Route, Link } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react'

// Pages
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './pages/Upload.jsx'
import Pricing from './pages/Pricing.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation Bar */}
      <nav className="bg-gray-950 border-b border-neon-cyan/20 sticky top-0 z-50 backdrop-blur-sm bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="text-2xl font-bold bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple bg-clip-text text-transparent hover:drop-shadow-[0_0_8px_rgba(255,0,128,0.6)] transition-all duration-300"
            >
              🎯 Aimalyze
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className="text-gray-300 hover:text-neon-cyan transition-all duration-200 font-medium relative group"
              >
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-neon-cyan to-neon-pink group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/upload" 
                className="text-gray-300 hover:text-neon-cyan transition-all duration-200 font-medium relative group"
              >
                Upload
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-neon-cyan to-neon-pink group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-300 hover:text-neon-cyan transition-all duration-200 font-medium relative group"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-neon-cyan to-neon-pink group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {/* Auth Button */}
              <SignedIn>
                <div className="pl-6 border-l border-neon-cyan/30">
                  <UserButton 
                    appearance={{
                      elements: {
                        rootBox: "w-10 h-10",
                        avatarBox: "w-10 h-10"
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </div>

            {/* Mobile Menu (simplified) */}
            <div className="md:hidden">
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
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
