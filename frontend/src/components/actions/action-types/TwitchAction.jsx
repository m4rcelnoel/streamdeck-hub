import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, ExternalLink } from 'lucide-react'
import { twitchApi } from '../../../services/api'

const twitchActions = [
  { value: 'create_clip', label: 'Create Clip', description: 'Clip the last 30 seconds of your stream' },
  { value: 'create_marker', label: 'Create Marker', description: 'Add a stream marker for easy editing' },
  { value: 'send_chat', label: 'Send Chat Message', description: 'Send a message in your chat' },
  { value: 'announcement', label: 'Send Announcement', description: 'Send a highlighted announcement' },
  { value: 'update_title', label: 'Update Stream Title', description: 'Change your stream title' },
  { value: 'run_ad', label: 'Run Ad Break', description: 'Start a commercial break' },
]

const announcementColors = [
  { value: 'primary', label: 'Primary (Purple)' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
]

const adLengths = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 90, label: '1.5 minutes' },
  { value: 120, label: '2 minutes' },
  { value: 150, label: '2.5 minutes' },
  { value: 180, label: '3 minutes' },
]

export default function TwitchAction({ config, onChange }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const response = await twitchApi.status()
      setStatus(response.data)
    } catch (error) {
      console.error('Failed to load Twitch status:', error)
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
        <RefreshCw className="w-6 h-6 text-theme-muted animate-spin" />
      </div>
    )
  }

  if (!status?.configured) {
    return (
      <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Twitch Not Configured</span>
        </div>
        <p className="text-sm text-theme-muted mb-3">
          Configure your Twitch API credentials in Settings to use Twitch actions.
        </p>
        <a
          href="https://dev.twitch.tv/console/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
        >
          <ExternalLink className="w-4 h-4" />
          Twitch Developer Console
        </a>
      </div>
    )
  }

  if (!status?.authenticated) {
    return (
      <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Twitch Not Authenticated</span>
        </div>
        <p className="text-sm text-theme-muted mb-3">
          Complete Twitch authentication in Settings to use Twitch actions.
        </p>
        {status.auth_url && (
          <a
            href={status.auth_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Authorize with Twitch
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Action</label>
        <select
          value={config.action || ''}
          onChange={(e) => updateConfig('action', e.target.value)}
          className="input"
          required
        >
          <option value="">Select action...</option>
          {twitchActions.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>
        {config.action && (
          <p className="text-xs text-theme-muted mt-1">
            {twitchActions.find(a => a.value === config.action)?.description}
          </p>
        )}
      </div>

      {config.action === 'create_marker' && (
        <div>
          <label className="label">Description (Optional)</label>
          <input
            type="text"
            value={config.message || ''}
            onChange={(e) => updateConfig('message', e.target.value)}
            placeholder="Important moment"
            className="input"
            maxLength={140}
          />
          <p className="text-xs text-theme-muted mt-1">
            Max 140 characters. Shows in VOD markers.
          </p>
        </div>
      )}

      {config.action === 'send_chat' && (
        <div>
          <label className="label">Message</label>
          <textarea
            value={config.message || ''}
            onChange={(e) => updateConfig('message', e.target.value)}
            placeholder="Hello chat!"
            className="input"
            rows={2}
            required
          />
        </div>
      )}

      {config.action === 'announcement' && (
        <>
          <div>
            <label className="label">Message</label>
            <textarea
              value={config.message || ''}
              onChange={(e) => updateConfig('message', e.target.value)}
              placeholder="Important announcement!"
              className="input"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="label">Color</label>
            <select
              value={config.color || 'primary'}
              onChange={(e) => updateConfig('color', e.target.value)}
              className="input"
            >
              {announcementColors.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {config.action === 'update_title' && (
        <div>
          <label className="label">New Title</label>
          <input
            type="text"
            value={config.title || ''}
            onChange={(e) => updateConfig('title', e.target.value)}
            placeholder="My awesome stream!"
            className="input"
            required
          />
        </div>
      )}

      {config.action === 'run_ad' && (
        <div>
          <label className="label">Ad Length</label>
          <select
            value={config.ad_length || 30}
            onChange={(e) => updateConfig('ad_length', parseInt(e.target.value))}
            className="input"
          >
            {adLengths.map((length) => (
              <option key={length.value} value={length.value}>
                {length.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-theme-muted mt-1">
            Requires Affiliate or Partner status
          </p>
        </div>
      )}

      <div className="bg-theme-tertiary rounded-lg p-3 text-sm">
        <p className="text-theme-secondary font-medium mb-1">Note:</p>
        <p className="text-xs text-theme-muted">
          Actions are performed on your authenticated Twitch account.
          Make sure you're live for clip/marker creation.
        </p>
      </div>
    </div>
  )
}
