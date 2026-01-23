import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { discordApi } from '../../../services/api'

const discordActions = [
  { value: 'webhook', label: 'Send Webhook Message', description: 'Send a message via webhook URL' },
  { value: 'bot_message', label: 'Send Bot Message', description: 'Send a message as a bot (requires bot token)' },
]

export default function DiscordAction({ config, onChange }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const response = await discordApi.status()
      setStatus(response.data)
    } catch (error) {
      console.error('Failed to load Discord status:', error)
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

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Action</label>
        <div className="space-y-2">
          {discordActions.map((action) => (
            <button
              key={action.value}
              type="button"
              onClick={() => updateConfig('action', action.value)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                config.action === action.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-theme-secondary bg-theme-tertiary hover:border-primary-500/50'
              }`}
            >
              <p className="text-theme-primary font-medium">{action.label}</p>
              <p className="text-xs text-theme-muted">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {config.action === 'webhook' && (
        <>
          <div>
            <label className="label">Webhook URL</label>
            <input
              type="url"
              value={config.webhook_url || ''}
              onChange={(e) => updateConfig('webhook_url', e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="input"
              required
            />
            <p className="text-xs text-theme-muted mt-1">
              Create a webhook in Discord: Server Settings → Integrations → Webhooks
            </p>
          </div>

          <div>
            <label className="label">Message</label>
            <textarea
              value={config.message || ''}
              onChange={(e) => updateConfig('message', e.target.value)}
              placeholder="Hello from Stream Deck!"
              className="input"
              rows={3}
              required
            />
          </div>

          <div className="bg-theme-tertiary rounded-lg p-3 text-sm">
            <p className="text-theme-secondary font-medium mb-1">Webhook Tips:</p>
            <ul className="text-xs text-theme-muted space-y-1">
              <li>• Webhooks work without any authentication setup</li>
              <li>• Each webhook is tied to a specific channel</li>
              <li>• You can customize the bot name and avatar per webhook</li>
            </ul>
          </div>
        </>
      )}

      {config.action === 'bot_message' && (
        <>
          {!status?.bot_configured && (
            <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Bot Not Configured</span>
              </div>
              <p className="text-xs text-theme-muted">
                Configure your Discord bot token in Settings to use bot messages.
              </p>
            </div>
          )}

          <div>
            <label className="label">Channel ID</label>
            <input
              type="text"
              value={config.channel_id || ''}
              onChange={(e) => updateConfig('channel_id', e.target.value)}
              placeholder="123456789012345678"
              className="input"
              required
            />
            <p className="text-xs text-theme-muted mt-1">
              Enable Developer Mode in Discord, then right-click a channel → Copy ID
            </p>
          </div>

          <div>
            <label className="label">Message</label>
            <textarea
              value={config.message || ''}
              onChange={(e) => updateConfig('message', e.target.value)}
              placeholder="Hello from Stream Deck!"
              className="input"
              rows={3}
              required
            />
          </div>

          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
          >
            <ExternalLink className="w-4 h-4" />
            Discord Developer Portal
          </a>
        </>
      )}
    </div>
  )
}
