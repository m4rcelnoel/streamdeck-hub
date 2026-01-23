import { useState, useEffect } from 'react'
import { X, Plus, AlertCircle } from 'lucide-react'
import { hotkeyApi } from '../../../services/api'

const MODIFIER_KEYS = ['ctrl', 'alt', 'shift', 'cmd']
const COMMON_KEYS = [
  { group: 'Function', keys: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'] },
  { group: 'Navigation', keys: ['up', 'down', 'left', 'right', 'home', 'end', 'pageup', 'pagedown'] },
  { group: 'Editing', keys: ['enter', 'tab', 'space', 'backspace', 'delete', 'escape'] },
  { group: 'Media', keys: ['playpause', 'next', 'previous', 'mute', 'volumeup', 'volumedown'] },
]

export default function HotkeyAction({ config, onChange }) {
  const [status, setStatus] = useState(null)
  const [customKey, setCustomKey] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const response = await hotkeyApi.status()
      setStatus(response.data)
    } catch (error) {
      console.error('Failed to load hotkey status:', error)
    }
  }

  const keys = config.keys || []

  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value })
  }

  const addKey = (key) => {
    if (!keys.includes(key)) {
      updateConfig('keys', [...keys, key])
    }
  }

  const removeKey = (index) => {
    const newKeys = [...keys]
    newKeys.splice(index, 1)
    updateConfig('keys', newKeys)
  }

  const handleCustomKeyAdd = () => {
    if (customKey && !keys.includes(customKey.toLowerCase())) {
      addKey(customKey.toLowerCase())
      setCustomKey('')
    }
  }

  const toggleModifier = (mod) => {
    if (keys.includes(mod)) {
      updateConfig('keys', keys.filter(k => k !== mod))
    } else {
      // Add modifiers at the beginning
      const modifiers = MODIFIER_KEYS.filter(m => keys.includes(m) || m === mod)
      const otherKeys = keys.filter(k => !MODIFIER_KEYS.includes(k))
      updateConfig('keys', [...modifiers, ...otherKeys])
    }
  }

  if (status && !status.available) {
    return (
      <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Pynput Not Installed</span>
        </div>
        <p className="text-sm text-theme-muted">
          Install the pynput library to use keyboard shortcuts:
        </p>
        <code className="block mt-2 p-2 bg-dark-800 rounded text-sm">
          pip install pynput
        </code>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current keys display */}
      <div>
        <label className="label">Keyboard Shortcut</label>
        <div className="min-h-[48px] p-3 bg-theme-tertiary rounded-lg border border-theme-secondary flex flex-wrap items-center gap-2">
          {keys.length === 0 ? (
            <span className="text-theme-muted text-sm">No keys selected</span>
          ) : (
            keys.map((key, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600/20 text-primary-400 rounded text-sm font-medium"
              >
                {key.toUpperCase()}
                <button
                  type="button"
                  onClick={() => removeKey(index)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        {keys.length > 0 && (
          <p className="text-xs text-theme-muted mt-1">
            Will press: {keys.join(' + ').toUpperCase()}
          </p>
        )}
      </div>

      {/* Modifier keys */}
      <div>
        <label className="label">Modifiers</label>
        <div className="flex flex-wrap gap-2">
          {MODIFIER_KEYS.map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => toggleModifier(mod)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                keys.includes(mod)
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                  : 'border-theme-secondary bg-theme-tertiary text-theme-secondary hover:border-primary-500/50'
              }`}
            >
              {mod.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Common keys */}
      <div>
        <label className="label">Common Keys</label>
        <div className="space-y-3">
          {COMMON_KEYS.map(({ group, keys: groupKeys }) => (
            <div key={group}>
              <p className="text-xs text-theme-muted mb-1">{group}</p>
              <div className="flex flex-wrap gap-1">
                {groupKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => addKey(key)}
                    disabled={keys.includes(key)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      keys.includes(key)
                        ? 'bg-primary-500/20 text-primary-400 cursor-not-allowed'
                        : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary'
                    }`}
                  >
                    {key.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom key input */}
      <div>
        <label className="label">Custom Key</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomKeyAdd())}
            placeholder="e.g., a, 1, printscreen"
            className="input flex-1"
            maxLength={20}
          />
          <button
            type="button"
            onClick={handleCustomKeyAdd}
            disabled={!customKey}
            className="btn btn-secondary"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-theme-muted mt-1">
          Single letters (a-z), numbers (0-9), or special key names
        </p>
      </div>

      {/* Hold time */}
      <div>
        <label className="label">Hold Time (ms)</label>
        <input
          type="number"
          value={config.hold_time || 0}
          onChange={(e) => updateConfig('hold_time', parseInt(e.target.value) || 0)}
          min="0"
          max="5000"
          step="100"
          className="input"
        />
        <p className="text-xs text-theme-muted mt-1">
          How long to hold the keys (0 for instant press)
        </p>
      </div>
    </div>
  )
}
