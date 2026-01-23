import { useState, useEffect } from 'react'
import { X, Trash2, Image as ImageIcon, ToggleLeft, Palette, Activity, Clock, Cloud, Cpu, Music, Hash, Timer, Home, Sparkles } from 'lucide-react'
import { useStore } from '../../store'
import { buttonTemplates } from '../../store/themeStore'
import { dataSources, refreshIntervals } from '../../store/dataStore'
import ActionBuilder from '../actions/ActionBuilder'
import IconPicker from './IconPicker'

// Animation types
const animationTypes = [
  { id: 'none', label: 'None', description: 'No animation' },
  { id: 'pulse', label: 'Pulse', description: 'Scale up and down' },
  { id: 'flash', label: 'Flash', description: 'Fade in and out' },
  { id: 'glow', label: 'Glow', description: 'Glowing shadow effect' },
  { id: 'color_cycle', label: 'Color Cycle', description: 'Cycle through hue colors' },
  { id: 'bounce', label: 'Bounce', description: 'Bounce up and down' },
  { id: 'shake', label: 'Shake', description: 'Shake left and right' },
  { id: 'breathe', label: 'Breathe', description: 'Subtle scale with brightness' },
]

const animationSpeeds = [
  { id: 'slow', label: 'Slow' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Fast' },
]

const animationTriggers = [
  { id: 'always', label: 'Always', description: 'Animation runs continuously' },
  { id: 'on_press', label: 'On Press', description: 'Animate when pressed' },
  { id: 'on_state_on', label: 'When ON', description: 'Animate when toggle is ON' },
  { id: 'on_state_off', label: 'When OFF', description: 'Animate when toggle is OFF' },
]

// Icon mapping for data sources
const dataSourceIcons = {
  time: Clock,
  weather: Cloud,
  system: Cpu,
  media: Music,
  counter: Hash,
  timer: Timer,
  homeassistant_sensor: Home,
}

export default function ButtonEditor({
  position,
  button,
  onSave,
  onDelete,
  onClose,
}) {
  const { actions, fetchActions } = useStore()
  const [formData, setFormData] = useState({
    label: '',
    icon_path: '',
    icon_color: '#ffffff',
    background_color: '#000000',
    action_id: '',
    is_toggle: false,
    on_color: '#22c55e',
    off_color: '#374151',
    // Data display fields
    data_source: '',
    data_format: '',
    refresh_interval: null,
    data_config: {},
    // Animation fields
    animation: '',
    animation_speed: 'normal',
    animation_trigger: 'always',
  })
  const [showActionBuilder, setShowActionBuilder] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  useEffect(() => {
    if (button) {
      setFormData({
        label: button.label || '',
        icon_path: button.icon_path || '',
        icon_color: button.icon_color || '#ffffff',
        background_color: button.background_color || '#000000',
        action_id: button.action_id || '',
        is_toggle: button.is_toggle || false,
        on_color: button.on_color || '#22c55e',
        off_color: button.off_color || '#374151',
        data_source: button.data_source || '',
        data_format: button.data_format || '',
        refresh_interval: button.refresh_interval ?? null,
        data_config: button.data_config || {},
        animation: button.animation || '',
        animation_speed: button.animation_speed || 'normal',
        animation_trigger: button.animation_trigger || 'always',
      })
    }
  }, [button])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...formData }
    if (!data.action_id) delete data.action_id
    if (!data.icon_path) delete data.icon_path
    onSave(position, data)
  }

  const handleActionCreated = (action) => {
    setFormData({ ...formData, action_id: action.id })
    setShowActionBuilder(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-theme-secondary rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold text-theme-primary">
            Edit Button {position}
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
            <label className="label">Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="Button label"
              className="input"
            />
          </div>

          <div>
            <label className="label">Icon</label>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowIconPicker(true)}
                className="flex items-center gap-2 px-3 py-2 bg-theme-tertiary border rounded-lg hover:opacity-80 transition-colors"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {formData.icon_path ? (
                  <img
                    src={formData.icon_path}
                    alt="Selected icon"
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-theme-muted" />
                )}
                <span className="text-theme-secondary">
                  {formData.icon_path ? 'Change Icon' : 'Select Icon'}
                </span>
              </button>
              {formData.icon_path && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, icon_path: '' })}
                  className="p-2 text-theme-muted hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Button Templates */}
          <div>
            <label className="label flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Style Template
            </label>
            <div className="grid grid-cols-6 gap-2">
              {buttonTemplates.slice(0, 12).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      background_color: template.config.background_color,
                      icon_color: template.config.icon_color,
                    })
                  }
                  className="group flex flex-col items-center gap-1 p-1 rounded hover:bg-theme-tertiary transition-colors"
                  title={template.name}
                >
                  <div
                    className="w-8 h-8 rounded border group-hover:border-primary-500 transition-colors"
                    style={{ background: template.preview.background, borderColor: 'var(--color-border)' }}
                  />
                  <span className="text-[10px] text-theme-muted truncate w-full text-center">
                    {template.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.icon_color}
                  onChange={(e) =>
                    setFormData({ ...formData, icon_color: e.target.value })
                  }
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.icon_color}
                  onChange={(e) =>
                    setFormData({ ...formData, icon_color: e.target.value })
                  }
                  className="input flex-1"
                />
              </div>
            </div>

            <div>
              <label className="label">Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.background_color}
                  onChange={(e) =>
                    setFormData({ ...formData, background_color: e.target.value })
                  }
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.background_color}
                  onChange={(e) =>
                    setFormData({ ...formData, background_color: e.target.value })
                  }
                  className="input flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Action</label>
            <div className="flex gap-2">
              <select
                value={formData.action_id}
                onChange={(e) =>
                  setFormData({ ...formData, action_id: e.target.value })
                }
                className="input flex-1"
              >
                <option value="">No action</option>
                {actions.map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.name} ({action.action_type})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowActionBuilder(true)}
                className="btn btn-secondary"
              >
                New
              </button>
            </div>
          </div>

          {/* Toggle Button Configuration */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_toggle}
                onChange={(e) =>
                  setFormData({ ...formData, is_toggle: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-400 text-primary-500 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2">
                <ToggleLeft className="w-4 h-4 text-theme-muted" />
                <span className="text-theme-primary">Toggle Button</span>
              </div>
            </label>
            <p className="text-xs text-theme-muted mt-1 ml-7">
              Shows ON/OFF state and changes color based on state
            </p>
          </div>

          {formData.is_toggle && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-theme-tertiary rounded-lg">
              <div>
                <label className="label text-xs">ON Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.on_color}
                    onChange={(e) =>
                      setFormData({ ...formData, on_color: e.target.value })
                    }
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.on_color}
                    onChange={(e) =>
                      setFormData({ ...formData, on_color: e.target.value })
                    }
                    className="input flex-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs">OFF Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.off_color}
                    onChange={(e) =>
                      setFormData({ ...formData, off_color: e.target.value })
                    }
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.off_color}
                    onChange={(e) =>
                      setFormData({ ...formData, off_color: e.target.value })
                    }
                    className="input flex-1 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Button Animation Configuration */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <label className="label flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Animation
            </label>
            <p className="text-xs text-theme-muted mb-3">
              Add visual effects to make buttons stand out
            </p>

            {/* Animation Type Selection */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {animationTypes.map((anim) => (
                <button
                  key={anim.id}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      animation: anim.id === 'none' ? '' : anim.id,
                    })
                  }
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                    (formData.animation || 'none') === anim.id ||
                    (!formData.animation && anim.id === 'none')
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-transparent bg-theme-tertiary hover:opacity-80'
                  }`}
                  title={anim.description}
                >
                  <span className="text-xs text-theme-secondary">{anim.label}</span>
                </button>
              ))}
            </div>

            {/* Animation Settings (only show if animation selected) */}
            {formData.animation && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-theme-tertiary rounded-lg">
                <div>
                  <label className="label text-xs">Speed</label>
                  <div className="flex gap-1">
                    {animationSpeeds.map((speed) => (
                      <button
                        key={speed.id}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, animation_speed: speed.id })
                        }
                        className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                          formData.animation_speed === speed.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-theme-secondary text-theme-secondary hover:opacity-80'
                        }`}
                      >
                        {speed.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label text-xs">Trigger</label>
                  <select
                    value={formData.animation_trigger}
                    onChange={(e) =>
                      setFormData({ ...formData, animation_trigger: e.target.value })
                    }
                    className="input text-xs"
                  >
                    {animationTriggers.map((trigger) => (
                      <option key={trigger.id} value={trigger.id}>
                        {trigger.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Animation Preview */}
                <div className="col-span-2 flex items-center justify-center pt-2">
                  <div
                    className={`w-12 h-12 rounded-lg bg-primary-600 anim-${formData.animation.replace('_', '-')} anim-${formData.animation_speed}`}
                    style={{
                      '--glow-color': 'rgba(124, 58, 237, 0.6)',
                    }}
                  />
                  <span className="text-xs text-theme-muted ml-3">Preview</span>
                </div>
              </div>
            )}
          </div>

          {/* Data Display Configuration */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <label className="label flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Data Display
            </label>
            <p className="text-xs text-theme-muted mb-3">
              Show dynamic data like time, system stats, or media info on this button
            </p>

            {/* Data Source Selection */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    data_source: '',
                    data_format: '',
                    data_config: {},
                  })
                }
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                  !formData.data_source
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-transparent bg-theme-tertiary hover:opacity-80'
                }`}
              >
                <X className="w-5 h-5 text-theme-muted" />
                <span className="text-xs text-theme-secondary">None</span>
              </button>
              {Object.values(dataSources).map((source) => {
                const Icon = dataSourceIcons[source.id] || Activity
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        data_source: source.id,
                        data_format: source.formats[0]?.id || '',
                        refresh_interval: source.defaultRefresh,
                        data_config: {},
                      })
                    }
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                      formData.data_source === source.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-transparent bg-theme-tertiary hover:opacity-80'
                    }`}
                    title={source.description}
                  >
                    <Icon className="w-5 h-5 text-theme-muted" />
                    <span className="text-xs text-theme-secondary">{source.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Format & Refresh Configuration */}
            {formData.data_source && dataSources[formData.data_source] && (
              <div className="space-y-3 p-3 bg-theme-tertiary rounded-lg">
                <div>
                  <label className="label text-xs">Display Format</label>
                  <select
                    value={formData.data_format}
                    onChange={(e) =>
                      setFormData({ ...formData, data_format: e.target.value })
                    }
                    className="input text-sm"
                  >
                    {dataSources[formData.data_source].formats.map((format) => (
                      <option key={format.id} value={format.id}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs">Refresh Interval</label>
                  <select
                    value={formData.refresh_interval ?? dataSources[formData.data_source].defaultRefresh}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        refresh_interval: parseInt(e.target.value),
                      })
                    }
                    className="input text-sm"
                  >
                    {refreshIntervals.map((interval) => (
                      <option key={interval.id} value={interval.value}>
                        {interval.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weather-specific config */}
                {formData.data_source === 'weather' && (
                  <div>
                    <label className="label text-xs">Location</label>
                    <input
                      type="text"
                      value={formData.data_config?.location || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_config: {
                            ...formData.data_config,
                            location: e.target.value,
                          },
                        })
                      }
                      placeholder="City name or 'auto' for automatic"
                      className="input text-sm"
                    />
                  </div>
                )}

                {/* Home Assistant sensor config */}
                {formData.data_source === 'homeassistant_sensor' && (
                  <div>
                    <label className="label text-xs">Entity ID</label>
                    <input
                      type="text"
                      value={formData.data_config?.entity_id || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_config: {
                            ...formData.data_config,
                            entity_id: e.target.value,
                          },
                        })
                      }
                      placeholder="sensor.temperature"
                      className="input text-sm"
                    />
                  </div>
                )}

                {/* Counter config */}
                {formData.data_source === 'counter' && (
                  <div>
                    <label className="label text-xs">Counter Label</label>
                    <input
                      type="text"
                      value={formData.data_config?.label || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_config: {
                            ...formData.data_config,
                            label: e.target.value,
                          },
                        })
                      }
                      placeholder="Count"
                      className="input text-sm"
                    />
                  </div>
                )}

                {/* Timer config */}
                {formData.data_source === 'timer' && formData.data_format === 'countdown' && (
                  <div>
                    <label className="label text-xs">Countdown Duration (seconds)</label>
                    <input
                      type="number"
                      value={Math.floor((formData.data_config?.duration || 300000) / 1000)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_config: {
                            ...formData.data_config,
                            duration: parseInt(e.target.value) * 1000,
                          },
                        })
                      }
                      min="1"
                      className="input text-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            {button && (
              <button
                type="button"
                onClick={() => onDelete(position)}
                className="btn btn-danger flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>

      {showActionBuilder && (
        <ActionBuilder
          onSave={handleActionCreated}
          onClose={() => setShowActionBuilder(false)}
        />
      )}

      {showIconPicker && (
        <IconPicker
          value={formData.icon_path}
          onChange={(path) => setFormData({ ...formData, icon_path: path })}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  )
}
