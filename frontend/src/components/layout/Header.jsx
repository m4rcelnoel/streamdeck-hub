import { Link } from 'react-router-dom'
import { Settings, Sun, Moon, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../../store/themeStore'
import { useDevices } from '../../hooks/useDevices'

export default function Header() {
  const { t } = useTranslation()
  const { devices } = useDevices()
  const { theme, toggleTheme } = useThemeStore()

  const connectedDevices = devices.filter(d => d.is_connected)

  return (
    <header className="h-16 bg-theme-secondary border-b flex items-center justify-between px-6" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-theme-primary">
          {t('header.title')}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Device Connection Status */}
        <Link
          to="/"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors hover:opacity-80 ${
            connectedDevices.length > 0
              ? 'bg-green-900/30 text-green-400'
              : 'bg-zinc-700/50 text-zinc-400'
          }`}
          title={t('dashboard.connectedDevices')}
        >
          <Monitor className="w-4 h-4" />
          <span>
            {connectedDevices.length} {connectedDevices.length === 1 ? t('header.device') : t('header.devices')}
          </span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-theme-tertiary transition-colors"
          title={t('header.theme')}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-theme-tertiary" />
          ) : (
            <Moon className="w-5 h-5 text-theme-tertiary" />
          )}
        </button>

        {/* Settings */}
        <Link
          to="/settings"
          className="p-2 rounded-lg hover:bg-theme-tertiary transition-colors"
          title={t('common.settings')}
        >
          <Settings className="w-5 h-5 text-theme-tertiary" />
        </Link>
      </div>
    </header>
  )
}
