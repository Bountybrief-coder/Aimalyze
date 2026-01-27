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
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white text-lg">Loading...</div>
  }

  if (!userId) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white text-lg">Please sign in to view your dashboard</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-2">📊 Your Dashboard</h1>
        <p className="text-lg text-gray-400">Manage and analyze your video uploads</p>
      </div>

      <div className="max-w-6xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center shadow-lg">
          <div className="text-4xl font-bold text-primary mb-2">3</div>
          <div className="text-gray-400">Total Videos</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center shadow-lg">
          <div className="text-4xl font-bold text-primary mb-2">2</div>
          <div className="text-gray-400">Analyzed</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center shadow-lg">
          <div className="text-4xl font-bold text-primary mb-2">1</div>
          <div className="text-gray-400">Processing</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center shadow-lg">
          <div className="text-4xl font-bold text-primary mb-2">12.5 min</div>
          <div className="text-gray-400">Total Duration</div>
        </div>
      </div>

      <section className="max-w-6xl mx-auto mb-12 bg-gray-900 border border-gray-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-white">Your Videos</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-950">
              <tr>
                <th className="px-4 py-3 text-left font-bold border-b-2 border-gray-800 text-gray-300">Title</th>
                <th className="px-4 py-3 text-left font-bold border-b-2 border-gray-800 text-gray-300">Upload Date</th>
                <th className="px-4 py-3 text-left font-bold border-b-2 border-gray-800 text-gray-300">Duration</th>
                <th className="px-4 py-3 text-left font-bold border-b-2 border-gray-800 text-gray-300">Status</th>
                <th className="px-4 py-3 text-left font-bold border-b-2 border-gray-800 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => (
                <tr key={video.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{video.title}</td>
                  <td className="px-4 py-3 text-gray-400">{video.uploadDate}</td>
                  <td className="px-4 py-3 text-gray-400">{video.duration}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-md font-bold text-sm ${
                      video.status === 'analyzed' 
                        ? 'bg-green-600/30 text-green-400' 
                        : 'bg-amber-600/30 text-amber-400'
                    }`}>
                      {video.status === 'analyzed' ? '✓ Analyzed' : '⏳ Analyzing'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-3 py-1 bg-primary hover:bg-blue-600 text-white rounded-md text-sm mr-2 transition-colors">
                      View
                    </button>
                    <button className="px-3 py-1 bg-primary hover:bg-blue-600 text-white rounded-md text-sm transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">Recent Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-lg">
            <h3 className="text-lg font-bold mb-2 text-primary">Most Common Topics</h3>
            <p className="text-gray-400">Technology, AI, Machine Learning</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-lg">
            <h3 className="text-lg font-bold mb-2 text-primary">Average Video Length</h3>
            <p className="text-gray-400">4 minutes 10 seconds</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-lg">
            <h3 className="text-lg font-bold mb-2 text-primary">Last Analysis</h3>
            <p className="text-gray-400">2 hours ago</p>
          </div>
        </div>
      </section>
    </div>
  )
}
