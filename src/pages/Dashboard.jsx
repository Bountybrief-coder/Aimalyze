import { useAuth } from '@clerk/clerk-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { PulseLoader } from 'react-spinners'

export default function Dashboard() {
  const { isLoaded, userId } = useAuth()
  const [videos] = useState([
    { id: 1, title: 'Sample Video 1', uploadDate: '2025-01-20', duration: '5:32', status: 'analyzed' },
    { id: 2, title: 'Sample Video 2', uploadDate: '2025-01-19', duration: '8:15', status: 'analyzing' },
    { id: 3, title: 'Sample Video 3', uploadDate: '2025-01-18', duration: '3:45', status: 'analyzed' }
  ])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
        <PulseLoader color="#00FFC6" size={15} />
        <p className="mt-4 text-gray-400">Loading dashboard...</p>
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
        Please sign in to view your dashboard
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-950 text-white p-4 sm:p-8"
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="max-w-6xl mx-auto mb-12"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">📊 Your Dashboard</h1>
        <p className="text-base sm:text-lg text-gray-400">Manage and analyze your video uploads</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, staggerChildren: 0.1 }}
        className="max-w-6xl mx-auto mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        {[
          { label: 'Total Videos', value: '3', emoji: '📹' },
          { label: 'Analyzed', value: '2', emoji: '✅' },
          { label: 'Processing', value: '1', emoji: '⏳' },
          { label: 'Total Duration', value: '12.5 min', emoji: '⏱️' }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-8 text-center shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            <div className="text-4xl mb-2">{stat.emoji}</div>
            <div className="text-4xl font-bold text-neon-cyan mb-2">{stat.value}</div>
            <div className="text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="max-w-6xl mx-auto mb-12 bg-gray-900 border border-neon-cyan/30 rounded-lg p-8 shadow-lg shadow-cyan-500/10"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">Your Videos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            <thead className="bg-gray-950">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold border-b-2 border-neon-cyan/30 text-gray-300">Title</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold border-b-2 border-neon-cyan/30 text-gray-300">Upload Date</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold border-b-2 border-neon-cyan/30 text-gray-300">Duration</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold border-b-2 border-neon-cyan/30 text-gray-300">Status</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold border-b-2 border-neon-cyan/30 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video, idx) => (
                <motion.tr 
                  key={video.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  whileHover={{ backgroundColor: 'rgba(0, 255, 198, 0.05)', x: 4 }}
                  className="border-b border-gray-800 transition-colors"
                >
                  <td className="px-2 sm:px-4 py-3 text-gray-400 text-xs sm:text-sm truncate">{video.title}</td>
                  <td className="px-2 sm:px-4 py-3 text-gray-400 text-xs sm:text-sm">{video.uploadDate}</td>
                  <td className="px-2 sm:px-4 py-3 text-gray-400 text-xs sm:text-sm">{video.duration}</td>
                  <td className="px-2 sm:px-4 py-3">
                    <motion.span 
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className={`px-2 sm:px-3 py-1 rounded-md font-bold text-xs sm:text-sm inline-block ${
                        video.status === 'analyzed' 
                          ? 'bg-green-600/30 text-green-400' 
                          : 'bg-amber-600/30 text-amber-400'
                      }`}
                    >
                      {video.status === 'analyzed' ? '✓ Analyzed' : '⏳ Analyzing'}
                    </motion.span>
                  </td>
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-2 sm:px-3 py-1 bg-gradient-to-r from-neon-cyan to-neon-pink hover:shadow-lg hover:shadow-cyan-500/50 text-gray-950 font-bold rounded-md text-xs sm:text-sm transition-all"
                      >
                      View
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-2 sm:px-3 py-1 border border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold rounded-md text-xs sm:text-sm transition-all"
                    >
                      Delete
                    </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">Recent Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Most Common Topics', value: 'Technology, AI, Machine Learning' },
            { title: 'Average Video Length', value: '4 minutes 10 seconds' },
            { title: 'Last Analysis', value: '2 hours ago' }
          ].map((insight, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gray-900 border border-neon-cyan/30 hover:border-neon-cyan/60 rounded-lg p-8 shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">{insight.title}</h3>
              <p className="text-gray-400">{insight.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
