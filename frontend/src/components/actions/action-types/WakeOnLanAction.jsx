import { useState } from 'react'
import { Check, X, RefreshCw } from 'lucide-react'
import { wolApi } from '../../../services/api'

export default function WakeOnLanAction({ config, onChange }) {
  const [validating, setValidating] = useState(false)
  const [validation, setValidation] = useState(null)

  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value })
    // Clear validation when MAC changes
    if (key === 'mac_address') {
      setValidation(null)
    }
  }

  const validateMac = async () => {
    if (!config.mac_address) return

    setValidating(true)
    try {
      const response = await wolApi.validate(config.mac_address)
      setValidation(response.data)

      // If valid, update with formatted version
      if (response.data.valid) {
        updateConfig('mac_address', response.data.formatted)
      }
    } catch (error) {
      setValidation({ valid: false, error: 'Validation failed' })
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-sm">
        <p className="text-blue-400">
          Wake-on-LAN sends a magic packet to wake up a computer on your network.
          The target computer must have WOL enabled in BIOS and network settings.
        </p>
      </div>

      <div>
        <label className="label">MAC Address</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={config.mac_address || ''}
              onChange={(e) => updateConfig('mac_address', e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              className={`input pr-10 ${
                validation?.valid === true
                  ? 'border-green-500'
                  : validation?.valid === false
                  ? 'border-red-500'
                  : ''
              }`}
              required
            />
            {validation && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {validation.valid ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={validateMac}
            disabled={!config.mac_address || validating}
            className="btn btn-secondary"
          >
            {validating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Validate'
            )}
          </button>
        </div>
        <p className="text-xs text-theme-muted mt-1">
          Formats: AA:BB:CC:DD:EE:FF, AA-BB-CC-DD-EE-FF, or AABBCCDDEEFF
        </p>
        {validation?.valid === false && (
          <p className="text-xs text-red-400 mt-1">{validation.error}</p>
        )}
      </div>

      <div>
        <label className="label">Broadcast IP (Optional)</label>
        <input
          type="text"
          value={config.ip_address || ''}
          onChange={(e) => updateConfig('ip_address', e.target.value)}
          placeholder="255.255.255.255"
          className="input"
        />
        <p className="text-xs text-theme-muted mt-1">
          Leave empty for default broadcast. Use subnet broadcast (e.g., 192.168.1.255) for specific networks.
        </p>
      </div>

      <div>
        <label className="label">Port</label>
        <select
          value={config.port || 9}
          onChange={(e) => updateConfig('port', parseInt(e.target.value))}
          className="input"
        >
          <option value={9}>9 (Standard)</option>
          <option value={7}>7 (Alternative)</option>
        </select>
        <p className="text-xs text-theme-muted mt-1">
          Most devices use port 9
        </p>
      </div>

      <div className="bg-theme-tertiary rounded-lg p-3">
        <h4 className="text-sm font-medium text-theme-secondary mb-2">How to find MAC address:</h4>
        <ul className="text-xs text-theme-muted space-y-1">
          <li><strong>Windows:</strong> ipconfig /all → Physical Address</li>
          <li><strong>macOS:</strong> System Preferences → Network → Advanced → Hardware</li>
          <li><strong>Linux:</strong> ip link show or ifconfig</li>
          <li><strong>Router:</strong> Check connected devices list</li>
        </ul>
      </div>
    </div>
  )
}
