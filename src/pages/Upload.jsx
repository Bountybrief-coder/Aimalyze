import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { BeatLoader, PulseLoader } from 'react-spinners'

export default function Upload() {
  const { userId, isLoaded } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isValidVideoFile(file)) {
        setSelectedFile(file)
        setError(null)
        setAnalysisResult(null)
      } else {
        setError('Please upload a valid video file (MP4, MOV, or WebM)')
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isValidVideoFile(file)) {
        setSelectedFile(file)
        setError(null)
        setAnalysisResult(null)
      } else {
        setError('Please upload a valid video file (MP4, MOV, or WebM)')
      }
    }
  }

  const isValidVideoFile = (file) => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
    const validExtensions = ['mp4', 'mov', 'webm', 'avi']
    const fileName = file.name.toLowerCase()
    const extension = fileName.split('.').pop()
    return validTypes.includes(file.type) || validExtensions.includes(extension)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze video')
      }

      const result = await response.json()
      setAnalysisResult(result)
      setSelectedFile(null)
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'An error occurred while analyzing the video. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setAnalysisResult(null)
    setSelectedFile(null)
    setError(null)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
        <PulseLoader color="#00FFC6" size={15} />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gray-950 text-white text-lg"
      >
        Please sign in to upload and analyze videos
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-950 text-white p-8"
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="max-w-2xl mx-auto text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent drop-shadow-lg">🎮 Gameplay Analysis</h1>
        <p className="text-base sm:text-lg text-gray-300">Upload a gameplay video to analyze for potential cheating</p>
      </motion.div>

      {!analysisResult ? (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer ${
              dragActive
                ? 'border-neon-pink bg-pink-900/20 shadow-lg shadow-pink-500/50 scale-105'
                : 'border-neon-cyan bg-gray-900 hover:border-neon-cyan/80 hover:shadow-lg hover:shadow-cyan-500/20'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <motion.div 
              animate={{ y: dragActive ? -5 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-4xl sm:text-5xl mb-4"
            >
              🎬
            </motion.div>
            <h2 className="text-lg sm:text-2xl mb-2 text-white">Drag and drop your gameplay video here</h2>
            <p className="text-gray-400 mb-4 text-sm sm:text-base">or</p>
            <label htmlFor="fileInput" className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-neon-cyan to-neon-pink hover:shadow-lg hover:shadow-cyan-500/50 text-gray-950 rounded-lg font-bold text-sm sm:text-base cursor-pointer transition-all duration-300 hover:scale-105">
              Browse Files
            </label>
            <input
              id="fileInput"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="mt-4 text-xs sm:text-sm text-gray-500">
              Supported formats: MP4, MOV, WebM (Max 500MB)
            </p>
          </motion.div>

          {selectedFile && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 bg-gray-900 border border-neon-cyan/30 rounded-lg p-8 shadow-lg shadow-cyan-500/10"
            >
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">Selected File</h3>
              <motion.div 
                whileHover={{ scale: 1.02, borderColor: 'rgb(0, 255, 198)' }}
                className="flex justify-between items-center flex-col sm:flex-row gap-4 sm:gap-0 p-4 bg-gray-950 rounded-lg mb-6 border border-neon-cyan/20 transition-colors"
              >
                <div className="flex items-center gap-2 text-white text-sm sm:text-base">
                  <span className="text-xl sm:text-2xl">📄</span>
                  <span className="truncate">{selectedFile.name}</span>
                </div>
                <div className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </motion.div>

              <motion.button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                whileHover={!isAnalyzing ? { scale: 1.05 } : {}}
                whileTap={!isAnalyzing ? { scale: 0.95 } : {}}
                className={`w-full py-3 px-4 font-bold rounded-lg text-base sm:text-lg flex items-center justify-center gap-2 transition-all ${
                  isAnalyzing
                    ? 'bg-gradient-to-r from-neon-cyan to-neon-pink/60 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-neon-cyan to-neon-pink hover:shadow-lg hover:shadow-cyan-500/50'
                } text-gray-950 font-bold`}
              >
                {isAnalyzing ? (
                  <>
                    <BeatLoader color="#1a1a2e" size={8} /> Analyzing...
                  </>
                ) : (
                  'Analyze with Gemini 🤖'
                )}
              </motion.button>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-900/40 text-red-300 rounded-lg border border-red-600/60 shadow-lg shadow-red-500/20"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className={`bg-gray-900 p-12 rounded-lg border shadow-2xl transition-all ${
            analysisResult.cheatingDetected
              ? 'border-red-500 shadow-red-500/30'
              : 'border-neon-cyan shadow-cyan-500/30'
          }`}>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-6 mb-8"
            >
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-5xl"
              >
                {analysisResult.cheatingDetected ? '⚠️' : '✅'}
              </motion.div>
              <h2 className="text-3xl font-bold">
                {analysisResult.verdict}
              </h2>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="mb-3 text-gray-300">
                Confidence Score: <span className="text-2xl font-bold text-primary">{analysisResult.confidence}%</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisResult.confidence}%` }}
                  transition={{ delay: 0.4, duration: 1 }}
                  className={`h-full ${
                    analysisResult.cheatingDetected ? 'bg-red-500' : 'bg-green-500'
                  }`}
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8 p-4 bg-gray-950 rounded-lg border border-neon-cyan/30"
            >
              <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">Analysis Details</h3>
              <p className="text-gray-300 leading-relaxed">{analysisResult.explanation}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center"
            >
              <button
                onClick={resetAnalysis}
                className="px-8 py-3 bg-gradient-to-r from-neon-cyan to-neon-pink hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105 text-gray-950 font-bold rounded-lg transition-all duration-300"
              >
                Analyze Another Video
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {!analysisResult && (
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">How it works</h2>
          <div className="space-y-6">
            {[0, 1, 2].map((idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.4 }}
                whileHover={{ x: 8, borderColor: 'rgb(0, 255, 198)' }}
                className="flex gap-6 bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-6 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <motion.div 
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: idx * 0.3 }}
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-neon-cyan to-neon-pink rounded-full font-bold text-xl flex-shrink-0 text-gray-950 shadow-lg shadow-cyan-500/50"
                >
                  {idx + 1}
                </motion.div>
                <div>
                  <h4 className="text-lg font-bold mb-1 text-white">
                    {idx === 0 ? 'Upload' : idx === 1 ? 'Analysis' : 'Results'}
                  </h4>
                  <p className="text-gray-400">
                    {idx === 0 && 'Upload your gameplay video file'}
                    {idx === 1 && 'Our Gemini AI analyzes the video for cheating indicators'}
                    {idx === 2 && 'Get a confidence score and detailed analysis report'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  )
}
