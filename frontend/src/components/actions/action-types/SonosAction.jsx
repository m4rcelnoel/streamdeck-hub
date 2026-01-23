import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { sonosApi } from '../../../services/api'

const sonosCommands = [
  { value: 'play', label: 'Play' },
  { value: 'pause', label: 'Pause' },
  { value: 'play_pause', label: 'Play/Pause Toggle' },
  { value: 'stop', label: 'Stop' },
  { value: 'next', label: 'Next Track' },
  { value: 'previous', label: 'Previous Track' },
  { value: 'volume_up', label: 'Volume Up' },
  { value: 'volume_down', label: 'Volume Down' },
  { value: 'set_volume', label: 'Set Volume' },
  { value: 'mute', label: 'Mute' },
  { value: 'unmute', label: 'Unmute' },
  { value: 'toggle_mute', label: 'Toggle Mute' },
]

export default function SonosAction({ config, onChange }) {
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
  const [discovering, setDiscovering] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSpeakers()
  }, [])

  const loadSpeakers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await sonosApi.status()
      if (!response.data.available) {
        setError('SoCo library not installed. Install with: pip install soco')
      } else {
        setSpeakers(response.data.speakers || [])
      }
    } catch (err) {
      setError('Failed to load Sonos status')
    } finally {
      setLoading(false)
    }
  }

  const discoverSpeakers = async () => {
    setDiscovering(true)
    try {
      const response = await sonosApi.discover()
      setSpeakers(response.data.speakers || [])
    } catch (err) {
      setError('Failed to discover speakers')
    } finally {
      setDiscovering(false)
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
        <button onClick={loadSpeakers} className="btn btn-secondary">
          Retry
        </button>
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
          {sonosCommands.map((cmd) => (
            <option key={cmd.value} value={cmd.value}>
              {cmd.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Speaker (Optional)</label>
          <button
            type="button"
            onClick={discoverSpeakers}
            disabled={discovering}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            {discovering && <RefreshCw className="w-3 h-3 animate-spin" />}
            {discovering ? 'Discovering...' : 'Discover Speakers'}
          </button>
        </div>
        <select
          value={config.speaker_uid || ''}
          onChange={(e) => updateConfig('speaker_uid', e.target.value)}
          className="input"
        >
          <option value="">Default speaker</option>
          {speakers.map((speaker) => (
            <option key={speaker.uid} value={speaker.uid}>
              {speaker.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-dark-500 mt-1">
          Leave empty to use the default speaker
        </p>
      </div>

      {(config.command === 'volume_up' || config.command === 'volume_down') && (
        <div>
          <label className="label">Volume Step</label>
          <input
            type="number"
            value={config.volume_step || 5}
            onChange={(e) => updateConfig('volume_step', parseInt(e.target.value) || 5)}
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
