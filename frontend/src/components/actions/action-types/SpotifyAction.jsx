import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { spotifyApi } from '../../../services/api'

const spotifyCommands = [
  { value: 'play', label: 'Play' },
  { value: 'pause', label: 'Pause' },
  { value: 'play_pause', label: 'Play/Pause Toggle' },
  { value: 'next', label: 'Next Track' },
  { value: 'previous', label: 'Previous Track' },
  { value: 'volume_up', label: 'Volume Up' },
  { value: 'volume_down', label: 'Volume Down' },
  { value: 'set_volume', label: 'Set Volume' },
  { value: 'shuffle_on', label: 'Enable Shuffle' },
  { value: 'shuffle_off', label: 'Disable Shuffle' },
  { value: 'repeat_off', label: 'Repeat Off' },
  { value: 'repeat_track', label: 'Repeat Track' },
  { value: 'repeat_context', label: 'Repeat Playlist/Album' },
]

export default function SpotifyAction({ config, onChange }) {
  const [status, setStatus] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await spotifyApi.status()
      setStatus(response.data)

      if (response.data.authenticated) {
        const devicesResponse = await spotifyApi.devices()
        setDevices(devicesResponse.data.devices || [])
      }
    } catch (err) {
      setError('Failed to load Spotify status')
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 text-dark-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-400 mb-4">{error}</p>
        <button onClick={loadStatus} className="btn btn-secondary">
          Retry
        </button>
      </div>
    )
  }

  if (!status?.available) {
    return (
      <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Spotipy Not Installed</span>
        </div>
        <p className="text-sm text-dark-400">
          Install the Spotipy library to use Spotify integration:
        </p>
        <code className="block mt-2 p-2 bg-dark-800 rounded text-sm">
          pip install spotipy
        </code>
      </div>
    )
  }

  if (!status?.configured) {
    return (
      <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Spotify Not Configured</span>
        </div>
        <p className="text-sm text-dark-400">
          Configure your Spotify API credentials in Settings to use Spotify actions.
        </p>
      </div>
    )
  }

  if (!status?.authenticated) {
    return (
      <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Spotify Not Authenticated</span>
        </div>
        <p className="text-sm text-dark-400 mb-3">
          Complete Spotify authentication in Settings to use Spotify actions.
        </p>
        {status.auth_url && (
          <a
            href={status.auth_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-sm"
          >
            Authorize with Spotify
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Command</label>
        <select
          value={config.command || ''}
          onChange={(e) => updateConfig('command', e.target.value)}
          className="input"
          required
        >
          <option value="">Select command...</option>
          {spotifyCommands.map((cmd) => (
            <option key={cmd.value} value={cmd.value}>
              {cmd.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Device (Optional)</label>
        <select
          value={config.device_id || ''}
          onChange={(e) => updateConfig('device_id', e.target.value)}
          className="input"
        >
          <option value="">Active device</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name} {device.is_active && '(Active)'}
            </option>
          ))}
        </select>
        <p className="text-xs text-dark-500 mt-1">
          Leave empty to use the currently active device
        </p>
      </div>

      {(config.command === 'volume_up' || config.command === 'volume_down') && (
        <div>
          <label className="label">Volume Step</label>
          <input
            type="number"
            value={config.volume_step || 10}
            onChange={(e) => updateConfig('volume_step', parseInt(e.target.value) || 10)}
            min="1"
            max="100"
            className="input"
          />
        </div>
      )}

      {config.command === 'set_volume' && (
        <div>
          <label className="label">Volume Level</label>
          <input
            type="number"
            value={config.volume || 50}
            onChange={(e) => updateConfig('volume', parseInt(e.target.value) || 50)}
            min="0"
            max="100"
            className="input"
          />
        </div>
      )}
    </div>
  )
}
