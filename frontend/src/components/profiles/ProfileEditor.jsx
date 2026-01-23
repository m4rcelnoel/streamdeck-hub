import { useState, useEffect } from 'react'
import { X, Palette } from 'lucide-react'
import { profileThemes } from '../../store/themeStore'

export default function ProfileEditor({ profile, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    device_type: '',
    is_default: false,
    is_folder: false,
    theme: 'default',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        description: profile.description || '',
        device_type: profile.device_type || '',
        is_default: profile.is_default || false,
        is_folder: profile.is_folder || false,
        theme: profile.theme || 'default',
      })
    }
  }, [profile])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-theme-secondary rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold text-theme-primary">
            {profile ? 'Edit Profile' : 'New Profile'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-theme-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-theme-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="My Profile"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description"
              className="input"
              rows={3}
            />
          </div>

          <div>
            <label className="label">Device Type</label>
            <select
              value={formData.device_type}
              onChange={(e) =>
                setFormData({ ...formData, device_type: e.target.value })
              }
              className="input"
            >
              <option value="">Any device</option>
              <option value="Stream Deck">Stream Deck (6 keys)</option>
              <option value="Stream Deck MK.2">Stream Deck MK.2 (15 keys)</option>
              <option value="Stream Deck XL">Stream Deck XL (32 keys)</option>
            </select>
          </div>

          {/* Profile Theme */}
          <div>
            <label className="label flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Deck Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {profileThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, theme: theme.id })}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    formData.theme === theme.id
                      ? 'border-primary-500'
                      : 'border-transparent hover:border-primary-500/50'
                  }`}
                >
                  <div
                    className="w-full h-8 rounded mb-1"
                    style={{ backgroundColor: theme.deckBackground }}
                  >
                    <div className="flex gap-1 p-1 justify-center">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: theme.buttonDefaults.background_color }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-theme-secondary">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData({ ...formData, is_default: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-400 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_default" className="text-sm text-theme-secondary">
                Set as default profile
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_folder"
                checked={formData.is_folder}
                onChange={(e) =>
                  setFormData({ ...formData, is_folder: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-400 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_folder" className="text-sm text-theme-secondary">
                Use as folder (can be opened from other profiles)
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {profile ? 'Save Changes' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
