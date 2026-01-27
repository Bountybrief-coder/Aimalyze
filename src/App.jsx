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
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              🎯 Aimalyze
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Dashboard
              </Link>
              <Link 
                to="/upload" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Upload
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Pricing
              </Link>
              
              {/* Auth Button */}
              <SignedIn>
                <div className="pl-6 border-l border-gray-700">
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
