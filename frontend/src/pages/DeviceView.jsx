import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Eye } from 'lucide-react'
import { useDevices } from '../hooks/useDevices'
import { useProfiles } from '../hooks/useProfiles'
import { devicesApi, buttonsApi } from '../services/api'
import DeckGrid from '../components/deck/DeckGrid'
import DeviceStatus from '../components/devices/DeviceStatus'

export default function DeviceView() {
  const { deviceId } = useParams()
  const navigate = useNavigate()
  const { devices, updateDevice, refresh: refreshDevices } = useDevices()
  const { profiles } = useProfiles()
  const [device, setDevice] = useState(null)
  const [buttons, setButtons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const d = devices.find((dev) => dev.id === deviceId)
    if (d) {
      setDevice(d)
      if (d.active_profile_id) {
        loadButtons(d.active_profile_id)
      }
      setLoading(false)
    }
  }, [deviceId, devices])

  const loadButtons = async (profileId) => {
    try {
      const response = await buttonsApi.list(profileId)
      setButtons(response.data)
    } catch (error) {
      console.error('Failed to load buttons:', error)
    }
  }

  const handleProfileChange = async (profileId) => {
    try {
      await updateDevice(device.id, { active_profile_id: profileId })
      if (profileId) {
        await loadButtons(profileId)
      } else {
        setButtons([])
      }
    } catch (error) {
      console.error('Failed to update device profile:', error)
    }
  }

  const handleBrightnessChange = async (brightness) => {
    try {
      await updateDevice(device.id, { brightness: parseInt(brightness) })
    } catch (error) {
      console.error('Failed to update brightness:', error)
    }
  }

  const handleIdentify = async () => {
    try {
      await devicesApi.identify(device.id)
    } catch (error) {
      console.error('Failed to identify device:', error)
    }
  }

  if (loading || !device) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-theme-muted animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-theme-tertiary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-theme-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">
            {device.name || device.deck_type}
          </h1>
          <p className="text-theme-muted mt-1">{device.deck_type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme-primary">Button Layout</h2>
              {device.active_profile_id && (
                <span className="text-sm text-theme-muted">
                  {profiles.find((p) => p.id === device.active_profile_id)?.name}
                </span>
              )}
            </div>
            <DeckGrid
              keyCount={device.key_count}
              buttons={buttons}
              onButtonClick={() => {}}
              readonly
              profileId={device.active_profile_id}
            />
          </div>
        </div>

        <div className="space-y-4">
          <DeviceStatus device={device} />

          <div className="card">
            <h3 className="text-sm font-medium text-theme-secondary mb-3">
              Active Profile
            </h3>
            <select
              value={device.active_profile_id || ''}
              onChange={(e) => handleProfileChange(e.target.value || null)}
              className="input"
            >
              <option value="">No profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-theme-secondary mb-3">
              Brightness: {device.brightness}%
            </h3>
            <input
              type="range"
              min="0"
              max="100"
              value={device.brightness}
              onChange={(e) => handleBrightnessChange(e.target.value)}
              className="w-full"
            />
          </div>

          <button
            onClick={handleIdentify}
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Identify Device
          </button>
        </div>
      </div>
    </div>
  )
}
