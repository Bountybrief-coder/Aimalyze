import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

export default function Upload() {
  const { userId } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

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
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    setIsUploading(false)
    setUploadProgress(100)
    // Reset after a delay
    setTimeout(() => {
      setSelectedFile(null)
      setUploadProgress(0)
    }, 2000)
  }

  if (!userId) {
    return <div style={loadingStyle}>Please sign in to upload videos</div>
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={pageHeadingStyle}>📤 Upload a Video</h1>
        <p style={subtitleStyle}>Upload your video and let our AI analyze it</p>
      </div>

      <div style={uploadSectionStyle}>
        <div
          style={{...dropzoneStyle, ...(dragActive ? dropzoneActiveStyle : {})}}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div style={uploadIconStyle}>🎬</div>
          <h2 style={dropzoneHeadingStyle}>Drag and drop your video here</h2>
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
            Supported formats: MP4, WebM, Ogg, MOV (Max 500MB)
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

            {uploadProgress > 0 && (
              <div style={progressContainerStyle}>
                <div style={progressBarStyle}>
                  <div style={{...progressFillStyle, width: `${uploadProgress}%`}} />
                </div>
                <p style={progressTextStyle}>{uploadProgress}%</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={isUploading}
              style={{...uploadButtonStyle, ...(isUploading ? uploadButtonDisabledStyle : {})}}
            >
              {isUploading ? 'Uploading...' : 'Upload & Analyze'}
            </button>
          </div>
        )}
      </div>

      <section style={infoSectionStyle}>
        <h2 style={infoHeadingStyle}>What happens next?</h2>
        <div style={stepsStyle}>
          <div style={stepStyle}>
            <div style={stepNumberStyle}>1</div>
            <div>
              <h4 style={stepTitleStyle}>Upload</h4>
              <p style={stepTextStyle}>Upload your video file to our secure servers</p>
            </div>
          </div>
          <div style={stepStyle}>
            <div style={stepNumberStyle}>2</div>
            <div>
              <h4 style={stepTitleStyle}>Processing</h4>
              <p style={stepTextStyle}>Our AI analyzes the video content using Google Gemini</p>
            </div>
          </div>
          <div style={stepStyle}>
            <div style={stepNumberStyle}>3</div>
            <div>
              <h4 style={stepTitleStyle}>Results</h4>
              <p style={stepTextStyle}>View detailed analytics and insights in your dashboard</p>
            </div>
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
