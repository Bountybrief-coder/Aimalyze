import { useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { AiOutlineCheckCircle, AiOutlineRocket, AiOutlineShield, AiOutlineBars } from 'react-icons/ai'

export default function Landing() {
  const navigate = useNavigate()

  const features = [
    {
      icon: AiOutlineShield,
      title: 'Advanced Detection',
      description: 'Uses cutting-edge AI to detect suspicious gameplay patterns and anomalies'
    },
    {
      icon: AiOutlineRocket,
      title: 'Lightning Fast',
      description: 'Get analysis results in seconds with our optimized processing pipeline'
    },
    {
      icon: AiOutlineBars,
      title: 'Detailed Reports',
      description: 'Comprehensive analysis with confidence scores and detailed explanations'
    },
    {
      icon: AiOutlineCheckCircle,
      title: 'Trusted by Gamers',
      description: 'Join thousands of competitive gamers using Aimalyze for fair play'
    },
  ]

  const mockResults = [
    { label: 'Cheating Detected', value: '🚫', color: 'red' },
    { label: 'Confidence', value: '87%', color: 'orange' },
    { label: 'Analysis Type', value: 'Comprehensive', color: 'green' },
  ]

  return (
    <div className="bg-gray-950 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center relative px-4 py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/50 rounded-full text-neon-cyan text-sm font-semibold">
            🎮 AI-Powered Cheat Detection
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent drop-shadow-lg">
            Detect Cheaters in Seconds
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            Advanced AI analysis for competitive gamers who demand fair play
          </p>

          <p className="text-lg text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto">
            Upload your gameplay footage and let Aimalyze's powerful AI instantly detect suspicious patterns, aim-lock exploits, and unfair advantages. Protect your competitive integrity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <SignedIn>
              <button 
                onClick={() => navigate('/upload')} 
                className="group px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-pink text-gray-950 font-bold text-lg rounded-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>🔍</span> Scan My Gameplay
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="px-8 py-4 border-2 border-neon-cyan text-neon-cyan font-bold text-lg rounded-lg hover:bg-neon-cyan/10 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>📊</span> View Results
              </button>
            </SignedIn>

            <SignedOut>
              <button 
                onClick={() => navigate('/upload')} 
                className="group px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-pink text-gray-950 font-bold text-lg rounded-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>🔍</span> Get Started Free
              </button>
            </SignedOut>
          </div>

          {/* Trust Badge */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-neon-cyan">✓</span> 10,000+ Gamers Analyzed
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neon-cyan">✓</span> 99.2% Accuracy Rate
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neon-cyan">✓</span> Sub-Second Results
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-gray-900 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
              Why Choose Aimalyze?
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Built for competitive gamers who take fair play seriously
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className="group relative bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-8 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  {/* Gradient accent on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-pink/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    <div className="text-4xl mb-4 text-neon-cyan group-hover:drop-shadow-[0_0_8px_rgba(0,255,198,0.5)] transition-all">
                      <Icon />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-neon-cyan transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mock Results Section */}
      <section className="py-20 px-4 bg-gray-950 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
              See It In Action
            </h2>
            <p className="text-lg text-gray-400">
              Real-time analysis with detailed insights
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Screenshot Mock */}
            <div className="relative">
              <div className="bg-gradient-to-br from-neon-cyan/20 to-neon-pink/20 rounded-lg p-1">
                <div className="bg-gray-900 rounded-lg p-8 border border-neon-cyan/30">
                  <div className="space-y-6">
                    {/* Result Header */}
                    <div className="flex items-center justify-between pb-6 border-b border-neon-cyan/20">
                      <h3 className="text-2xl font-bold">Analysis Results</h3>
                      <span className="text-sm bg-neon-cyan/20 text-neon-cyan px-3 py-1 rounded-full">
                        Completed
                      </span>
                    </div>

                    {/* Result Items */}
                    {mockResults.map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-neon-cyan/20 hover:border-neon-cyan/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full bg-neon-cyan"></div>
                          <span className="text-gray-300">{result.label}</span>
                        </div>
                        <span className="text-2xl font-bold text-neon-cyan">{result.value}</span>
                      </div>
                    ))}

                    {/* Analysis Details */}
                    <div className="mt-8 pt-6 border-t border-neon-cyan/20">
                      <p className="text-sm text-gray-400 mb-4">
                        <span className="text-neon-cyan font-semibold">Analysis Details:</span> Multiple suspicious patterns detected including rapid aim adjustments, unnatural mouse movements, and reaction times below human capability.
                      </p>
                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded-lg font-semibold transition-colors">
                          View Full Report
                        </button>
                        <button className="flex-1 px-4 py-2 bg-neon-pink/20 hover:bg-neon-pink/30 text-neon-pink rounded-lg font-semibold transition-colors">
                          Share Result
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-neon-cyan to-neon-pink text-gray-950 px-6 py-3 rounded-lg font-bold shadow-xl shadow-cyan-500/50 animate-bounce">
                ✨ 87% Confidence
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-white mb-8">
                Comprehensive Analysis Dashboard
              </h3>

              <div className="space-y-4">
                {[
                  'Real-time detection with AI-powered analysis',
                  'Confidence scoring system for accuracy',
                  'Detailed behavioral pattern analysis',
                  'Multi-factor cheat detection methods',
                  'Exportable reports for evidence',
                  'Historical tracking and comparisons'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-gray-900 border border-neon-cyan/20 hover:border-neon-cyan/50 rounded-lg transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                    <div className="mt-1 text-neon-cyan text-xl flex-shrink-0">
                      ✓
                    </div>
                    <p className="text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-gray-900 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-neon-cyan/5 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-neon-pink/5 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">
            Ready to Protect Your Competitive Integrity?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Start analyzing gameplay footage with Aimalyze today. First scan is always free.
          </p>

          <SignedIn>
            <button 
              onClick={() => navigate('/upload')}
              className="px-10 py-4 bg-gradient-to-r from-neon-cyan to-neon-pink text-gray-950 font-bold text-lg rounded-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
            >
              🚀 Scan Your First Video
            </button>
          </SignedIn>

          <SignedOut>
            <button 
              onClick={() => navigate('/upload')}
              className="px-10 py-4 bg-gradient-to-r from-neon-cyan to-neon-pink text-gray-950 font-bold text-lg rounded-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
            >
              🚀 Get Started Free
            </button>
          </SignedOut>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neon-cyan/10 bg-gray-950 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">
                Aimalyze
              </h3>
              <p className="text-gray-400 text-sm">
                AI-powered cheat detection for competitive gamers
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-neon-cyan transition-colors">About</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-neon-cyan transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-neon-cyan/10 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>&copy; 2026 Aimalyze. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-neon-cyan transition-colors">Twitter</a>
              <a href="#" className="hover:text-neon-cyan transition-colors">Discord</a>
              <a href="#" className="hover:text-neon-cyan transition-colors">YouTube</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
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

