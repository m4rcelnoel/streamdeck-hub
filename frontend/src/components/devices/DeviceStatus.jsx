import { Monitor, Cpu, Hash } from 'lucide-react'

export default function DeviceStatus({ device }) {
  return (
    <div className="card">
      <h3 className="text-sm font-medium text-theme-secondary mb-3">Device Info</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Monitor className="w-4 h-4 text-theme-muted" />
          <div>
            <p className="text-xs text-theme-muted">Type</p>
            <p className="text-sm text-theme-primary">{device.deck_type}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Hash className="w-4 h-4 text-theme-muted" />
          <div>
            <p className="text-xs text-theme-muted">Serial</p>
            <p className="text-sm text-theme-primary font-mono">{device.serial_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Cpu className="w-4 h-4 text-theme-muted" />
          <div>
            <p className="text-xs text-theme-muted">Firmware</p>
            <p className="text-sm text-theme-primary">{device.firmware_version || 'Unknown'}</p>
          </div>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-theme-muted">Status</span>
            <span
              className={`px-2 py-0.5 text-xs rounded ${
                device.is_connected
                  ? 'bg-green-900/30 text-green-400'
                  : 'bg-theme-tertiary text-theme-muted'
              }`}
            >
              {device.is_connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
