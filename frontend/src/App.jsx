import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Profiles from './pages/Profiles'
import Actions from './pages/Actions'
import DeviceView from './pages/DeviceView'
import Settings from './pages/Settings'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  // Initialize WebSocket connection
  useWebSocket()

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/profiles/:profileId" element={<Profiles />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/device/:deviceId" element={<DeviceView />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App
