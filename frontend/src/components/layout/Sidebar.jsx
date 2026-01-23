import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Layers, Zap, Monitor, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDevices } from '../../hooks/useDevices'

export default function Sidebar() {
  const { t } = useTranslation()
  const { devices } = useDevices()
  const connectedDevices = devices.filter((d) => d.is_connected)

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/profiles', icon: Layers, label: t('nav.profiles') },
    { to: '/actions', icon: Zap, label: t('nav.actions') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  return (
    <aside className="w-64 bg-theme-secondary border-r flex flex-col" style={{ borderColor: 'var(--color-border)' }}>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-theme-tertiary hover:bg-theme-tertiary hover:text-theme-primary'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-3">
          {t('dashboard.connectedDevices')}
        </h3>
        {connectedDevices.length === 0 ? (
          <p className="text-sm text-theme-muted">{t('dashboard.noDevices')}</p>
        ) : (
          <div className="space-y-2">
            {connectedDevices.map((device) => (
              <NavLink
                key={device.id}
                to={`/device/${device.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-theme-tertiary hover:bg-theme-tertiary hover:text-theme-primary'
                  }`
                }
              >
                <Monitor className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {device.name || device.deck_type}
                  </p>
                  <p className="text-xs text-theme-muted">
                    {device.key_count} {t('devices.keyCount').toLowerCase()}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
