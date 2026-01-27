import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

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
    return <div style={loadingStyle}>Loading...</div>
  }

  if (!userId) {
    return <div style={loadingStyle}>Please sign in to upload and analyze videos</div>
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={pageHeadingStyle}>🎮 Gameplay Analysis</h1>
        <p style={subtitleStyle}>Upload a gameplay video to analyze for potential cheating</p>
      </div>

      {!analysisResult ? (
        <div style={uploadSectionStyle}>
          <div
            style={{...dropzoneStyle, ...(dragActive ? dropzoneActiveStyle : {})}}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div style={uploadIconStyle}>🎬</div>
            <h2 style={dropzoneHeadingStyle}>Drag and drop your gameplay video here</h2>
            <p style={dropzoneTextStyle}>or</p>
            <label htmlFor="fileInput" style={fileInputLabelStyle}>
              Browse Files
            </label>
            <input
              id="fileInput"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={hiddenInputStyle}
            />
            <p style={supportedFormatsStyle}>
              Supported formats: MP4, MOV, WebM (Max 500MB)
            </p>
          </div>

          {selectedFile && (
            <div style={filePreviewStyle}>
              <h3 style={previewHeadingStyle}>Selected File</h3>
              <div style={fileDetailsStyle}>
                <div style={fileNameStyle}>
                  <span style={fileIconStyle}>📄</span>
                  <span>{selectedFile.name}</span>
                </div>
                <div style={fileSizeStyle}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                style={{...analyzeButtonStyle, ...(isAnalyzing ? analyzeButtonDisabledStyle : {})}}
              >
                {isAnalyzing ? (
                  <>
                    <span style={spinnerStyle}>⏳</span> Analyzing...
                  </>
                ) : (
                  'Analyze with Gemini 🤖'
                )}
              </button>

              {error && <div style={errorMessageStyle}>{error}</div>}
            </div>
          )}
        </div>
      ) : (
        <div style={resultSectionStyle}>
          <div style={{...resultCardStyle, ...(analysisResult.cheatingDetected ? resultCardCheatingStyle : resultCardCleanStyle)}}>
            <div style={resultHeaderStyle}>
              <div style={resultIconStyle}>
                {analysisResult.cheatingDetected ? '⚠️' : '✅'}
              </div>
              <h2 style={resultVerdictStyle}>
                {analysisResult.verdict}
              </h2>
            </div>

            <div style={confidenceContainerStyle}>
              <div style={confidenceLabelStyle}>
                Confidence Score: <span style={confidencePercentStyle}>{analysisResult.confidence}%</span>
              </div>
              <div style={confidenceBarStyle}>
                <div 
                  style={{
                    ...confidenceFillStyle,
                    width: `${analysisResult.confidence}%`,
                    backgroundColor: analysisResult.cheatingDetected ? '#ef4444' : '#10b981'
                  }} 
                />
              </div>
            </div>

            <div style={explanationStyle}>
              <h3 style={explanationHeadingStyle}>Analysis Details</h3>
              <p style={explanationTextStyle}>{analysisResult.explanation}</p>
            </div>

            <div style={actionButtonsStyle}>
              <button
                onClick={resetAnalysis}
                style={analyzeAnotherButtonStyle}
              >
                Analyze Another Video
              </button>
            </div>
          </div>
        </div>
      )}

      {!analysisResult && (
        <section style={infoSectionStyle}>
          <h2 style={infoHeadingStyle}>How it works</h2>
          <div style={stepsStyle}>
            <div style={stepStyle}>
              <div style={stepNumberStyle}>1</div>
              <div>
                <h4 style={stepTitleStyle}>Upload</h4>
                <p style={stepTextStyle}>Upload your gameplay video file</p>
              </div>
            </div>
            <div style={stepStyle}>
              <div style={stepNumberStyle}>2</div>
              <div>
                <h4 style={stepTitleStyle}>Analysis</h4>
                <p style={stepTextStyle}>Our Gemini AI analyzes the video for cheating indicators</p>
              </div>
            </div>
            <div style={stepStyle}>
              <div style={stepNumberStyle}>3</div>
              <div>
                <h4 style={stepTitleStyle}>Results</h4>
                <p style={stepTextStyle}>Get a confidence score and detailed analysis report</p>
              </div>
            </div>
          </div>
        </section>
      )}
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
  maxWidth: '900px',
  margin: '0 auto 3rem',
  textAlign: 'center'
}

const pageHeadingStyle = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem'
}

const subtitleStyle = {
  fontSize: '1.1rem',
  color: '#aaa'
}

const uploadSectionStyle = {
  maxWidth: '900px',
  margin: '0 auto 3rem'
}

const dropzoneStyle = {
  border: '2px dashed #667eea',
  borderRadius: '12px',
  padding: '3rem',
  textAlign: 'center',
  backgroundColor: '#1a1a1a',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
}

const dropzoneActiveStyle = {
  borderColor: '#764ba2',
  backgroundColor: '#2a1a3a'
}

const uploadIconStyle = {
  fontSize: '3.5rem',
  marginBottom: '1rem'
}

const dropzoneHeadingStyle = {
  fontSize: '1.5rem',
  marginBottom: '0.5rem',
  color: '#fff'
}

const dropzoneTextStyle = {
  color: '#aaa',
  marginBottom: '1rem'
}

const fileInputLabelStyle = {
  display: 'inline-block',
  padding: '0.75rem 2rem',
  backgroundColor: '#667eea',
  color: '#fff',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease'
}

const hiddenInputStyle = {
  display: 'none'
}

const supportedFormatsStyle = {
  marginTop: '1rem',
  fontSize: '0.9rem',
  color: '#888'
}

const filePreviewStyle = {
  marginTop: '2rem',
  backgroundColor: '#1a1a1a',
  padding: '2rem',
  borderRadius: '12px',
  border: '1px solid #333'
}

const previewHeadingStyle = {
  fontSize: '1.3rem',
  marginBottom: '1rem',
  color: '#fff'
}

const fileDetailsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem',
  backgroundColor: '#111',
  borderRadius: '8px',
  marginBottom: '1rem'
}

const fileNameStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: '#fff'
}

const fileIconStyle = {
  fontSize: '1.5rem'
}

const fileSizeStyle = {
  color: '#aaa',
  fontSize: '0.9rem'
}

const analyzeButtonStyle = {
  width: '100%',
  padding: '1rem',
  fontSize: '1.1rem',
  backgroundColor: '#667eea',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem'
}

const analyzeButtonDisabledStyle = {
  opacity: 0.6,
  cursor: 'not-allowed'
}

const spinnerStyle = {
  display: 'inline-block',
  animation: 'spin 2s linear infinite'
}

const errorMessageStyle = {
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: '#7f1d1d',
  color: '#fca5a5',
  borderRadius: '8px',
  border: '1px solid #dc2626'
}

const resultSectionStyle = {
  maxWidth: '900px',
  margin: '0 auto 3rem'
}

const resultCardStyle = {
  backgroundColor: '#1a1a1a',
  padding: '3rem',
  borderRadius: '12px',
  border: '1px solid #333',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
}

const resultCardCheatingStyle = {
  borderColor: '#dc2626',
  boxShadow: '0 8px 30px rgba(220, 38, 38, 0.2)'
}

const resultCardCleanStyle = {
  borderColor: '#10b981',
  boxShadow: '0 8px 30px rgba(16, 185, 129, 0.2)'
}

const resultHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  marginBottom: '2rem'
}

const resultIconStyle = {
  fontSize: '3rem'
}

const resultVerdictStyle = {
  fontSize: '2.2rem',
  fontWeight: 'bold',
  margin: 0
}

const confidenceContainerStyle = {
  marginBottom: '2rem'
}

const confidenceLabelStyle = {
  fontSize: '1rem',
  marginBottom: '0.75rem',
  color: '#ccc'
}

const confidencePercentStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#667eea'
}

const confidenceBarStyle = {
  width: '100%',
  height: '12px',
  backgroundColor: '#333',
  borderRadius: '6px',
  overflow: 'hidden'
}

const confidenceFillStyle = {
  height: '100%',
  transition: 'width 0.5s ease'
}

const explanationStyle = {
  marginBottom: '2rem',
  padding: '1.5rem',
  backgroundColor: '#111',
  borderRadius: '8px',
  border: '1px solid #333'
}

const explanationHeadingStyle = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  color: '#667eea'
}

const explanationTextStyle = {
  color: '#ccc',
  lineHeight: '1.6',
  margin: 0
}

const actionButtonsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center'
}

const analyzeAnotherButtonStyle = {
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

const infoSectionStyle = {
  maxWidth: '900px',
  margin: '0 auto'
}

const infoHeadingStyle = {
  fontSize: '1.8rem',
  marginBottom: '2rem',
  textAlign: 'center'
}

const stepsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
}

const stepStyle = {
  display: 'flex',
  gap: '1.5rem',
  backgroundColor: '#1a1a1a',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #333'
}

const stepNumberStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '50px',
  height: '50px',
  backgroundColor: '#667eea',
  borderRadius: '50%',
  fontWeight: 'bold',
  fontSize: '1.5rem',
  flexShrink: 0
}

const stepTitleStyle = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
  color: '#fff'
}

const stepTextStyle = {
  color: '#aaa',
  fontSize: '0.95rem'
}

const loadingStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#0f0f0f',
  color: '#fff',
  fontSize: '1.2rem'
}

const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#0f0f0f',
  color: '#fff',
  padding: '2rem'
}

const headerStyle = {
  maxWidth: '900px',
  margin: '0 auto 3rem',
  textAlign: 'center'
}

const pageHeadingStyle = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem'
}

const subtitleStyle = {
  fontSize: '1.1rem',
  color: '#aaa'
}

const uploadSectionStyle = {
  maxWidth: '900px',
  margin: '0 auto 3rem'
}

const dropzoneStyle = {
  border: '2px dashed #667eea',
  borderRadius: '12px',
  padding: '3rem',
  textAlign: 'center',
  backgroundColor: '#1a1a1a',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
}

const dropzoneActiveStyle = {
  borderColor: '#764ba2',
  backgroundColor: '#2a1a3a'
}

const uploadIconStyle = {
  fontSize: '3.5rem',
  marginBottom: '1rem'
}

const dropzoneHeadingStyle = {
  fontSize: '1.5rem',
  marginBottom: '0.5rem',
  color: '#fff'
}

const dropzoneTextStyle = {
  color: '#aaa',
  marginBottom: '1rem'
}

const fileInputLabelStyle = {
  display: 'inline-block',
  padding: '0.75rem 2rem',
  backgroundColor: '#667eea',
  color: '#fff',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease'
}

const hiddenInputStyle = {
  display: 'none'
}

const supportedFormatsStyle = {
  marginTop: '1rem',
  fontSize: '0.9rem',
  color: '#888'
}

const filePreviewStyle = {
  marginTop: '2rem',
  backgroundColor: '#1a1a1a',
  padding: '2rem',
  borderRadius: '12px',
  border: '1px solid #333'
}

const previewHeadingStyle = {
  fontSize: '1.3rem',
  marginBottom: '1rem',
  color: '#fff'
}

const fileDetailsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem',
  backgroundColor: '#111',
  borderRadius: '8px',
  marginBottom: '1rem'
}

const fileNameStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: '#fff'
}

const fileIconStyle = {
  fontSize: '1.5rem'
}

const fileSizeStyle = {
  color: '#aaa',
  fontSize: '0.9rem'
}

const progressContainerStyle = {
  marginBottom: '1.5rem'
}

const progressBarStyle = {
  width: '100%',
  height: '8px',
  backgroundColor: '#333',
  borderRadius: '4px',
  overflow: 'hidden',
  marginBottom: '0.5rem'
}

const progressFillStyle = {
  height: '100%',
  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  transition: 'width 0.3s ease'
}

const progressTextStyle = {
  textAlign: 'center',
  fontSize: '0.9rem',
  color: '#aaa'
}

const uploadButtonStyle = {
  width: '100%',
  padding: '1rem',
  fontSize: '1.1rem',
  backgroundColor: '#667eea',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease'
}

const uploadButtonDisabledStyle = {
  opacity: 0.6,
  cursor: 'not-allowed'
}

const infoSectionStyle = {
  maxWidth: '900px',
  margin: '0 auto'
}

const infoHeadingStyle = {
  fontSize: '1.8rem',
  marginBottom: '2rem',
  textAlign: 'center'
}

const stepsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
}

const stepStyle = {
  display: 'flex',
  gap: '1.5rem',
  backgroundColor: '#1a1a1a',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #333'
}

const stepNumberStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '50px',
  height: '50px',
  backgroundColor: '#667eea',
  borderRadius: '50%',
  fontWeight: 'bold',
  fontSize: '1.5rem',
  flexShrink: 0
}

const stepTitleStyle = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
  color: '#fff'
}

const stepTextStyle = {
  color: '#aaa',
  fontSize: '0.95rem'
}

const loadingStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#0f0f0f',
  color: '#fff',
  fontSize: '1.2rem'
}
