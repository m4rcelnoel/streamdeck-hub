import { Monitor, Layers, Zap, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDevices } from '../hooks/useDevices'
import { useProfiles } from '../hooks/useProfiles'
import { useStore } from '../store'
import { useEffect } from 'react'
import DeviceList from '../components/devices/DeviceList'

export default function Dashboard() {
  const { t } = useTranslation()
  const { devices, loading: devicesLoading } = useDevices()
  const { profiles, loading: profilesLoading } = useProfiles()
  const { actions, fetchActions, actionsLoading } = useStore()

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  const connectedCount = devices.filter((d) => d.is_connected).length
  const stats = [
    {
      label: t('dashboard.connectedDevices'),
      value: connectedCount,
      total: devices.length,
      icon: Monitor,
      color: 'bg-blue-500',
    },
    {
      label: t('profiles.title'),
      value: profiles.length,
      icon: Layers,
      color: 'bg-purple-500',
    },
    {
      label: t('actions.title'),
      value: actions.length,
      icon: Zap,
      color: 'bg-amber-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-primary">{t('dashboard.title')}</h1>
        <p className="text-theme-muted mt-1">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-theme-muted text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-theme-primary">
                  {stat.value}
                  {stat.total !== undefined && (
                    <span className="text-theme-muted text-lg font-normal">
                      {' '}
                      / {stat.total}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary">{t('nav.devices')}</h2>
            <span className="text-sm text-theme-muted">
              {connectedCount} {t('common.connected').toLowerCase()}
            </span>
          </div>
          <DeviceList />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary">{t('dashboard.quickActions')}</h2>
          </div>
          <div className="space-y-2">
            <Link
              to="/profiles"
              className="flex items-center gap-3 p-3 rounded-lg bg-theme-tertiary hover:opacity-80 transition-colors"
            >
              <Layers className="w-5 h-5 text-primary-400" />
              <div>
                <p className="text-theme-primary font-medium">{t('profiles.title')}</p>
                <p className="text-theme-muted text-sm">
                  {t('profiles.subtitle')}
                </p>
              </div>
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 p-3 rounded-lg bg-theme-tertiary hover:opacity-80 transition-colors"
            >
              <Home className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-theme-primary font-medium">{t('settings.homeassistant.title')}</p>
                <p className="text-theme-muted text-sm">
                  {t('settings.homeassistant.description')}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
