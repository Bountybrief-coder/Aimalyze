import { useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="bg-gray-950">
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🎯 Welcome to Aimalyze
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-6">
            AI-powered video analytics at your fingertips
          </p>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto">
            Upload your videos and let our AI analyze them. Get insights, summaries, 
            and detailed analytics powered by Google Gemini.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedIn>
              <button 
                onClick={() => navigate('/upload')} 
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-200 transform hover:scale-105"
              >
                Start Analyzing 🚀
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="px-8 py-3 border-2 border-blue-500 text-blue-400 font-bold rounded-lg hover:bg-blue-500/10 transition-all duration-200"
              >
                View Dashboard 📊
              </button>
            </SignedIn>

            <SignedOut>
              <p className="text-lg text-gray-400">Sign in to get started with Aimalyze</p>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-bold mb-2">Video Upload</h3>
              <p className="text-gray-400">Upload videos in any format and get instant AI analysis</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
              <p className="text-gray-400">Powered by Google Gemini for accurate insights</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Analytics Dashboard</h3>
              <p className="text-gray-400">View detailed analytics and summaries of your videos</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Fast Processing</h3>
              <p className="text-gray-400">Get results in seconds with our optimized processing</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

