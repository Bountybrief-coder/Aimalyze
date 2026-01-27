import { useAuth } from '@clerk/clerk-react'
import { useState } from 'react'

export default function Dashboard() {
  const { isLoaded, userId } = useAuth()
  const [videos] = useState([
    { id: 1, title: 'Sample Video 1', uploadDate: '2025-01-20', duration: '5:32', status: 'analyzed' },
    { id: 2, title: 'Sample Video 2', uploadDate: '2025-01-19', duration: '8:15', status: 'analyzing' },
    { id: 3, title: 'Sample Video 3', uploadDate: '2025-01-18', duration: '3:45', status: 'analyzed' }
  ])

  if (!isLoaded) {
    return <div style={loadingStyle}>Loading...</div>
  }

  if (!userId) {
    return <div style={loadingStyle}>Please sign in to view your dashboard</div>
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={pageHeadingStyle}>📊 Your Dashboard</h1>
        <p style={subtitleStyle}>Manage and analyze your video uploads</p>
      </div>

      <div style={statsContainerStyle}>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>3</div>
          <div style={statLabelStyle}>Total Videos</div>
        </div>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>2</div>
          <div style={statLabelStyle}>Analyzed</div>
        </div>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>1</div>
          <div style={statLabelStyle}>Processing</div>
        </div>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>12.5 min</div>
          <div style={statLabelStyle}>Total Duration</div>
        </div>
      </div>

      <section style={tableContainerStyle}>
        <h2 style={sectionHeadingStyle}>Your Videos</h2>
        <table style={tableStyle}>
          <thead style={tableHeadStyle}>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Upload Date</th>
              <th style={thStyle}>Duration</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map(video => (
              <tr key={video.id} style={trStyle}>
                <td style={tdStyle}>{video.title}</td>
                <td style={tdStyle}>{video.uploadDate}</td>
                <td style={tdStyle}>{video.duration}</td>
                <td style={tdStyle}>
                  <span style={getStatusBadgeStyle(video.status)}>
                    {video.status === 'analyzed' ? '✓ Analyzed' : '⏳ Analyzing'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button style={actionButtonStyle}>View</button>
                  <button style={actionButtonStyle}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={insightsStyle}>
        <h2 style={sectionHeadingStyle}>Recent Insights</h2>
        <div style={insightGridStyle}>
          <div style={insightCardStyle}>
            <h3 style={insightTitleStyle}>Most Common Topics</h3>
            <p style={insightTextStyle}>Technology, AI, Machine Learning</p>
          </div>
          <div style={insightCardStyle}>
            <h3 style={insightTitleStyle}>Average Video Length</h3>
            <p style={insightTextStyle}>4 minutes 10 seconds</p>
          </div>
          <div style={insightCardStyle}>
            <h3 style={insightTitleStyle}>Last Analysis</h3>
            <p style={insightTextStyle}>2 hours ago</p>
          </div>
        </div>
      </section>
    </div>
  )
}

const getStatusBadgeStyle = (status) => ({
  padding: '0.4rem 0.8rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  backgroundColor: status === 'analyzed' ? '#10b981' : '#f59e0b',
  color: '#fff'
})

const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#0f0f0f',
  color: '#fff',
  padding: '2rem'
}

const headerStyle = {
  maxWidth: '1200px',
  margin: '0 auto 3rem'
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

const statsContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto 3rem',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem'
}

const statCardStyle = {
  backgroundColor: '#1a1a1a',
  padding: '2rem',
  borderRadius: '12px',
  textAlign: 'center',
  border: '1px solid #333',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
}

const statNumberStyle = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: '#667eea',
  marginBottom: '0.5rem'
}

const statLabelStyle = {
  fontSize: '1rem',
  color: '#aaa'
}

const tableContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto 3rem',
  backgroundColor: '#1a1a1a',
  borderRadius: '12px',
  padding: '2rem',
  border: '1px solid #333',
  overflowX: 'auto'
}

const sectionHeadingStyle = {
  fontSize: '1.8rem',
  marginBottom: '1.5rem',
  color: '#fff'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
}

const tableHeadStyle = {
  backgroundColor: '#111'
}

const thStyle = {
  padding: '1rem',
  textAlign: 'left',
  fontWeight: 'bold',
  borderBottom: '2px solid #333',
  color: '#ccc'
}

const trStyle = {
  borderBottom: '1px solid #333',
  transition: 'background-color 0.2s ease'
}

const tdStyle = {
  padding: '1rem',
  color: '#aaa'
}

const actionButtonStyle = {
  padding: '0.4rem 0.8rem',
  marginRight: '0.5rem',
  backgroundColor: '#667eea',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.3s ease'
}

const insightsStyle = {
  maxWidth: '1200px',
  margin: '0 auto'
}

const insightGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1.5rem'
}

const insightCardStyle = {
  backgroundColor: '#1a1a1a',
  padding: '2rem',
  borderRadius: '12px',
  border: '1px solid #333',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
}

const insightTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
  color: '#667eea'
}

const insightTextStyle = {
  fontSize: '0.95rem',
  color: '#aaa'
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
