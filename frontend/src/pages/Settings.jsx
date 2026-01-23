import { useState, useEffect } from 'react'
import { Home, Check, X, RefreshCw, Sun, Moon, Palette, Music, ExternalLink, MessageCircle, Twitch, Globe, Wifi, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { homeAssistantApi, spotifyApi, discordApi, twitchApi } from '../services/api'
import { useThemeStore, buttonTemplates } from '../store/themeStore'
import { useStore } from '../store'
import { languages } from '../i18n'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useThemeStore()
  const { wsConnected } = useStore()
  const [haStatus, setHaStatus] = useState(null)
  const [haUrl, setHaUrl] = useState('')
  const [haToken, setHaToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState(null)

  // Spotify state
  const [spotifyStatus, setSpotifyStatus] = useState(null)
  const [spotifyClientId, setSpotifyClientId] = useState('')
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('')
  const [spotifyRedirectUri, setSpotifyRedirectUri] = useState('http://localhost:8888/callback')
  const [spotifyConnecting, setSpotifyConnecting] = useState(false)
  const [spotifyMessage, setSpotifyMessage] = useState(null)
  const [spotifyAuthCode, setSpotifyAuthCode] = useState('')

  // Discord state
  const [discordStatus, setDiscordStatus] = useState(null)
  const [discordBotToken, setDiscordBotToken] = useState('')
  const [discordConnecting, setDiscordConnecting] = useState(false)
  const [discordMessage, setDiscordMessage] = useState(null)

  // Twitch state
  const [twitchStatus, setTwitchStatus] = useState(null)
  const [twitchClientId, setTwitchClientId] = useState('')
  const [twitchClientSecret, setTwitchClientSecret] = useState('')
  const [twitchConnecting, setTwitchConnecting] = useState(false)
  const [twitchMessage, setTwitchMessage] = useState(null)
  const [twitchAuthCode, setTwitchAuthCode] = useState('')

  useEffect(() => {
    loadHaStatus()
    loadSpotifyStatus()
    loadDiscordStatus()
    loadTwitchStatus()
  }, [])

  const loadHaStatus = async () => {
    try {
      const response = await homeAssistantApi.status()
      setHaStatus(response.data)
      if (response.data.url) {
        setHaUrl(response.data.url)
      }
    } catch (error) {
      console.error('Failed to load HA status:', error)
    }
  }

  const handleConnect = async (e) => {
    e.preventDefault()
    setConnecting(true)
    setMessage(null)

    try {
      const response = await homeAssistantApi.connect({
        url: haUrl,
        token: haToken,
      })

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Connected to Home Assistant!' })
        setHaToken('')
        loadHaStatus()
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to connect' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to Home Assistant' })
    } finally {
      setConnecting(false)
    }
  }

  const loadSpotifyStatus = async () => {
    try {
      const response = await spotifyApi.status()
      setSpotifyStatus(response.data)
    } catch (error) {
      console.error('Failed to load Spotify status:', error)
    }
  }

  const handleSpotifyConfigure = async (e) => {
    e.preventDefault()
    setSpotifyConnecting(true)
    setSpotifyMessage(null)

    try {
      const response = await spotifyApi.configure({
        client_id: spotifyClientId,
        client_secret: spotifyClientSecret,
        redirect_uri: spotifyRedirectUri,
      })

      if (response.data.success) {
        setSpotifyMessage({ type: 'success', text: 'Spotify credentials saved! Click "Authorize" to complete setup.' })
        loadSpotifyStatus()
      } else {
        setSpotifyMessage({ type: 'error', text: 'Failed to save credentials' })
      }
    } catch (error) {
      setSpotifyMessage({ type: 'error', text: 'Failed to configure Spotify' })
    } finally {
      setSpotifyConnecting(false)
    }
  }

  const handleSpotifyAuth = async (e) => {
    e.preventDefault()
    if (!spotifyAuthCode) return

    setSpotifyConnecting(true)
    setSpotifyMessage(null)

    try {
      const response = await spotifyApi.authenticate(spotifyAuthCode)

      if (response.data.success) {
        setSpotifyMessage({ type: 'success', text: 'Spotify authenticated successfully!' })
        setSpotifyAuthCode('')
        loadSpotifyStatus()
      } else {
        setSpotifyMessage({ type: 'error', text: 'Authentication failed. Check the code and try again.' })
      }
    } catch (error) {
      setSpotifyMessage({ type: 'error', text: 'Failed to authenticate with Spotify' })
    } finally {
      setSpotifyConnecting(false)
    }
  }

  const loadDiscordStatus = async () => {
    try {
      const response = await discordApi.status()
      setDiscordStatus(response.data)
    } catch (error) {
      console.error('Failed to load Discord status:', error)
    }
  }

  const handleDiscordConfigure = async (e) => {
    e.preventDefault()
    setDiscordConnecting(true)
    setDiscordMessage(null)

    try {
      await discordApi.configure({ bot_token: discordBotToken })
      setDiscordMessage({ type: 'success', text: 'Discord bot token saved!' })
      setDiscordBotToken('')
      loadDiscordStatus()
    } catch (error) {
      setDiscordMessage({ type: 'error', text: 'Failed to save bot token' })
    } finally {
      setDiscordConnecting(false)
    }
  }

  const loadTwitchStatus = async () => {
    try {
      const response = await twitchApi.status()
      setTwitchStatus(response.data)
    } catch (error) {
      console.error('Failed to load Twitch status:', error)
    }
  }

  const handleTwitchConfigure = async (e) => {
    e.preventDefault()
    setTwitchConnecting(true)
    setTwitchMessage(null)

    try {
      const response = await twitchApi.configure({
        client_id: twitchClientId,
        client_secret: twitchClientSecret,
      })

      if (response.data.success) {
        setTwitchMessage({ type: 'success', text: 'Twitch credentials saved! Click "Authorize" to complete setup.' })
        loadTwitchStatus()
      } else {
        setTwitchMessage({ type: 'error', text: 'Failed to save credentials' })
      }
    } catch (error) {
      setTwitchMessage({ type: 'error', text: 'Failed to configure Twitch' })
    } finally {
      setTwitchConnecting(false)
    }
  }

  const handleTwitchAuth = async (e) => {
    e.preventDefault()
    if (!twitchAuthCode) return

    setTwitchConnecting(true)
    setTwitchMessage(null)

    try {
      const response = await twitchApi.authenticate(twitchAuthCode)

      if (response.data.success) {
        setTwitchMessage({ type: 'success', text: 'Twitch authenticated successfully!' })
        setTwitchAuthCode('')
        loadTwitchStatus()
      } else {
        setTwitchMessage({ type: 'error', text: 'Authentication failed. Check the code and try again.' })
      }
    } catch (error) {
      setTwitchMessage({ type: 'error', text: 'Failed to authenticate with Twitch' })
    } finally {
      setTwitchConnecting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">{t('settings.title')}</h1>
        <p className="text-theme-muted mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-900/30">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-primary">
              {t('settings.language.title')}
            </h2>
            <p className="text-sm text-theme-muted">
              {t('settings.language.description')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                i18n.language === lang.code
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-transparent bg-theme-tertiary hover:border-primary-500/50'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="text-theme-primary font-medium">{lang.name}</span>
              {i18n.language === lang.code && (
                <Check className="w-4 h-4 text-primary-400 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Server Connection Status */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${wsConnected ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
            {wsConnected ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-primary">
              {t('settings.server.title')}
            </h2>
            <p className="text-sm text-theme-muted">
              {t('settings.server.description')}
            </p>
          </div>
        </div>

        <div
          className={`p-3 rounded-lg ${
            wsConnected
              ? 'bg-green-900/20 border border-green-800'
              : 'bg-red-900/20 border border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {wsConnected ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">{t('header.serverConnected')}</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{t('header.serverDisconnected')}</span>
              </>
            )}
          </div>
          {wsConnected && (
            <p className="text-sm text-theme-muted mt-1">
              {t('settings.server.realtimeActive')}
            </p>
          )}
          {!wsConnected && (
            <p className="text-sm text-theme-muted mt-1">
              {t('settings.server.checkBackend')}
            </p>
          )}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-900/30">
            <Palette className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-primary">
              {t('header.theme')}
            </h2>
            <p className="text-sm text-theme-muted">
              {t('settings.general')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">{t('header.theme')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-transparent bg-theme-tertiary hover:border-primary-500/50'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  theme === 'light'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-transparent bg-theme-tertiary hover:border-primary-500/50'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>Light</span>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Button Templates</label>
            <p className="text-xs text-theme-muted mb-3">
              Quick-apply styles when editing buttons
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {buttonTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="w-10 h-10 rounded-lg border border-dark-600"
                    style={{
                      background: template.preview.background,
                    }}
                  />
                  <span className="text-xs text-theme-muted truncate w-full text-center">
                    {template.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Home Assistant Integration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-green-900/30">
            <Home className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-primary">
              {t('settings.homeassistant.title')}
            </h2>
            <p className="text-sm text-theme-muted">
              {t('settings.homeassistant.description')}
            </p>
          </div>
        </div>

        {haStatus && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              haStatus.connected
                ? 'bg-green-900/20 border border-green-800'
                : 'bg-dark-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {haStatus.connected ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">{t('settings.homeassistant.connected')}</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-dark-400" />
                  <span className="text-dark-400 text-sm">{t('settings.homeassistant.notConnected')}</span>
                </>
              )}
            </div>
            {haStatus.url && (
              <p className="text-sm text-dark-400 mt-1">{haStatus.url}</p>
            )}
          </div>
        )}

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-900/20 border border-green-800 text-green-400'
                : 'bg-red-900/20 border border-red-800 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="label">Home Assistant URL</label>
            <input
              type="url"
              value={haUrl}
              onChange={(e) => setHaUrl(e.target.value)}
              placeholder="http://homeassistant.local:8123"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Long-Lived Access Token</label>
            <input
              type="password"
              value={haToken}
              onChange={(e) => setHaToken(e.target.value)}
              placeholder="Enter your access token"
              className="input"
              required
            />
            <p className="text-xs text-dark-500 mt-1">
              Generate a token in Home Assistant: Profile → Long-Lived Access Tokens
            </p>
          </div>

          <button
            type="submit"
            disabled={connecting}
            className="btn btn-primary flex items-center gap-2"
          >
            {connecting && <RefreshCw className="w-4 h-4 animate-spin" />}
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>

      {/* Spotify Integration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-green-900/30">
            <Music className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-primary">
              {t('settings.spotify.title')}
            </h2>
            <p className="text-sm text-theme-muted">
              {t('settings.spotify.description')}
            </p>
          </div>
        </div>

        {spotifyStatus && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              spotifyStatus.authenticated
                ? 'bg-green-900/20 border border-green-800'
                : spotifyStatus.configured
                ? 'bg-amber-900/20 border border-amber-800'
                : 'bg-dark-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {spotifyStatus.authenticated ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Authenticated</span>
                </>
              ) : spotifyStatus.configured ? (
                <>
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm">Configured - Authorization needed</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-dark-400" />
                  <span className="text-dark-400 text-sm">Not configured</span>
                </>
              )}
            </div>
          </div>
        )}

        {!spotifyStatus?.available && (
          <div className="mb-4 p-3 rounded-lg bg-amber-900/20 border border-amber-800">
            <p className="text-amber-400 text-sm">
              Spotipy library not installed. Install with: <code className="bg-dark-700 px-1 rounded">pip install spotipy</code>
            </p>
          </div>
        )}

        {spotifyMessage && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              spotifyMessage.type === 'success'
                ? 'bg-green-900/20 border border-green-800 text-green-400'
                : 'bg-red-900/20 border border-red-800 text-red-400'
            }`}
          >
            {spotifyMessage.text}
          </div>
        )}

        {/* Step 1: Configure credentials */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-theme-secondary mb-3">
            Step 1: Configure Spotify API Credentials
          </h3>
          <form onSubmit={handleSpotifyConfigure} className="space-y-4">
            <div>
              <label className="label">Client ID</label>
              <input
                type="text"
                value={spotifyClientId}
                onChange={(e) => setSpotifyClientId(e.target.value)}
                placeholder="Your Spotify Client ID"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Client Secret</label>
              <input
                type="password"
                value={spotifyClientSecret}
                onChange={(e) => setSpotifyClientSecret(e.target.value)}
                placeholder="Your Spotify Client Secret"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Redirect URI</label>
              <input
                type="text"
                value={spotifyRedirectUri}
                onChange={(e) => setSpotifyRedirectUri(e.target.value)}
                placeholder="http://localhost:8888/callback"
                className="input"
              />
              <p className="text-xs text-dark-500 mt-1">
                Must match the redirect URI in your Spotify app settings
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={spotifyConnecting}
                className="btn btn-primary flex items-center gap-2"
              >
                {spotifyConnecting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Save Credentials
              </button>
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Spotify Dashboard
              </a>
            </div>
          </form>
        </div>

        {/* Step 2: Authorize */}
        {spotifyStatus?.configured && !spotifyStatus?.authenticated && (
          <div className="border-t border-theme-secondary pt-4">
            <h3 className="text-sm font-medium text-theme-secondary mb-3">
              Step 2: Authorize with Spotify
            </h3>

            {spotifyStatus.auth_url && (
              <div className="space-y-4">
                <p className="text-sm text-theme-muted">
                  Click the button below to authorize with Spotify. After authorizing, copy the code from the redirect URL and paste it below.
                </p>

                <a
                  href={spotifyStatus.auth_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Authorize with Spotify
                </a>

                <form onSubmit={handleSpotifyAuth} className="space-y-3">
                  <div>
                    <label className="label">Authorization Code</label>
                    <input
                      type="text"
                      value={spotifyAuthCode}
                      onChange={(e) => setSpotifyAuthCode(e.target.value)}
                      placeholder="Paste the code from the redirect URL"
                      className="input"
                      required
                    />
                    <p className="text-xs text-dark-500 mt-1">
                      After authorizing, the URL will contain <code className="bg-dark-700 px-1 rounded">?code=...</code> - paste that code here
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={spotifyConnecting || !spotifyAuthCode}
                    className="btn btn-primary"
                  >
                    Complete Authentication
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Discord Integration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-indigo-900/30">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-primary">
              {t('settings.discord.title')}
            </h2>
            <p className="text-sm text-theme-muted">
              {t('settings.discord.description')}
            </p>
          </div>
        </div>

        {discordStatus && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              discordStatus.bot_configured
                ? 'bg-green-900/20 border border-green-800'
                : 'bg-dark-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {discordStatus.bot_configured ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Bot token configured</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-dark-400" />
                  <span className="text-dark-400 text-sm">Bot token not configured (webhooks still work)</span>
                </>
              )}
            </div>
          </div>
        )}

        {discordMessage && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              discordMessage.type === 'success'
                ? 'bg-green-900/20 border border-green-800 text-green-400'
                : 'bg-red-900/20 border border-red-800 text-red-400'
            }`}
          >
            {discordMessage.text}
          </div>
        )}

        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-4">
          <p className="text-blue-400 text-sm">
            <strong>Tip:</strong> Discord webhooks work without any configuration.
            Only configure a bot token if you need to send messages to specific channels via bot.
          </p>
        </div>

        <form onSubmit={handleDiscordConfigure} className="space-y-4">
          <div>
            <label className="label">Bot Token (Optional)</label>
            <input
              type="password"
              value={discordBotToken}
              onChange={(e) => setDiscordBotToken(e.target.value)}
              placeholder="Your Discord bot token"
              className="input"
            />
            <p className="text-xs text-dark-500 mt-1">
              Create a bot at Discord Developer Portal → Applications → Bot
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={discordConnecting || !discordBotToken}
              className="btn btn-primary flex items-center gap-2"
            >
              {discordConnecting && <RefreshCw className="w-4 h-4 animate-spin" />}
              Save Bot Token
            </button>
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Developer Portal
            </a>
          </div>
        </form>
      </div>

      {/* Twitch Integration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-violet-900/30">
            <Twitch className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-primary">
              {t('settings.twitch.title')}
            </h2>
            <p className="text-sm text-theme-muted">
              {t('settings.twitch.description')}
            </p>
          </div>
        </div>

        {twitchStatus && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              twitchStatus.authenticated
                ? 'bg-green-900/20 border border-green-800'
                : twitchStatus.configured
                ? 'bg-amber-900/20 border border-amber-800'
                : 'bg-dark-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {twitchStatus.authenticated ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Authenticated</span>
                </>
              ) : twitchStatus.configured ? (
                <>
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm">Configured - Authorization needed</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-dark-400" />
                  <span className="text-dark-400 text-sm">Not configured</span>
                </>
              )}
            </div>
          </div>
        )}

        {twitchMessage && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              twitchMessage.type === 'success'
                ? 'bg-green-900/20 border border-green-800 text-green-400'
                : 'bg-red-900/20 border border-red-800 text-red-400'
            }`}
          >
            {twitchMessage.text}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium text-theme-secondary mb-3">
            Step 1: Configure Twitch API Credentials
          </h3>
          <form onSubmit={handleTwitchConfigure} className="space-y-4">
            <div>
              <label className="label">Client ID</label>
              <input
                type="text"
                value={twitchClientId}
                onChange={(e) => setTwitchClientId(e.target.value)}
                placeholder="Your Twitch Client ID"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Client Secret</label>
              <input
                type="password"
                value={twitchClientSecret}
                onChange={(e) => setTwitchClientSecret(e.target.value)}
                placeholder="Your Twitch Client Secret"
                className="input"
                required
              />
            </div>

            <p className="text-xs text-dark-500">
              Redirect URI: <code className="bg-dark-700 px-1 rounded">http://localhost:8888/twitch/callback</code>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={twitchConnecting}
                className="btn btn-primary flex items-center gap-2"
              >
                {twitchConnecting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Save Credentials
              </button>
              <a
                href="https://dev.twitch.tv/console/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Twitch Console
              </a>
            </div>
          </form>
        </div>

        {twitchStatus?.configured && !twitchStatus?.authenticated && (
          <div className="border-t border-theme-secondary pt-4">
            <h3 className="text-sm font-medium text-theme-secondary mb-3">
              Step 2: Authorize with Twitch
            </h3>

            {twitchStatus.auth_url && (
              <div className="space-y-4">
                <p className="text-sm text-theme-muted">
                  Click the button below to authorize with Twitch. After authorizing, copy the code from the redirect URL.
                </p>

                <a
                  href={twitchStatus.auth_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Authorize with Twitch
                </a>

                <form onSubmit={handleTwitchAuth} className="space-y-3">
                  <div>
                    <label className="label">Authorization Code</label>
                    <input
                      type="text"
                      value={twitchAuthCode}
                      onChange={(e) => setTwitchAuthCode(e.target.value)}
                      placeholder="Paste the code from the redirect URL"
                      className="input"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={twitchConnecting || !twitchAuthCode}
                    className="btn btn-primary"
                  >
                    Complete Authentication
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-theme-primary mb-4">{t('settings.about.title')}</h2>
        <div className="space-y-2 text-sm text-theme-muted">
          <p>
            <span className="text-theme-secondary">{t('settings.about.version')}:</span> 1.0.0
          </p>
          <p>
            <span className="text-theme-secondary">Backend:</span> FastAPI + SQLite
          </p>
          <p>
            <span className="text-theme-secondary">Frontend:</span> React + Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  )
}
