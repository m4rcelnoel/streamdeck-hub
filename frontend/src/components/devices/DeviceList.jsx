import { Link } from 'react-router-dom'
import { Monitor, ChevronRight } from 'lucide-react'
import { useDevices } from '../../hooks/useDevices'

export default function DeviceList() {
  const { devices, loading } = useDevices()

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-theme-tertiary rounded-lg" />
        ))}
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-8">
        <Monitor className="w-12 h-12 text-theme-muted mx-auto mb-3 opacity-50" />
        <p className="text-theme-muted">No devices found</p>
        <p className="text-theme-muted text-sm mt-1 opacity-75">
          Connect a Stream Deck to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <Link
          key={device.id}
          to={`/device/${device.id}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-theme-tertiary hover:opacity-80 transition-colors"
        >
          <div className="p-2 rounded-lg bg-theme-secondary">
            <Monitor className="w-5 h-5 text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-theme-primary font-medium truncate">
                {device.name || device.deck_type}
              </p>
              <div
                className={`w-2 h-2 rounded-full ${
                  device.is_connected ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>
            <p className="text-theme-muted text-sm">
              {device.deck_type} - {device.key_count} keys
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-theme-muted" />
        </Link>
      ))}
    </div>
  )
}
