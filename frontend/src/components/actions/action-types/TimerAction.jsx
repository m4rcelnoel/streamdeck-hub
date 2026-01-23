export default function TimerAction({ config, onChange }) {
  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value })
  }

  const timerActions = [
    { value: 'toggle', label: 'Toggle Start/Pause' },
    { value: 'start', label: 'Start' },
    { value: 'pause', label: 'Pause' },
    { value: 'resume', label: 'Resume' },
    { value: 'reset', label: 'Reset' },
  ]

  const timerModes = [
    { value: 'stopwatch', label: 'Stopwatch', description: 'Count up from 0' },
    { value: 'countdown', label: 'Countdown', description: 'Count down to 0' },
  ]

  // Parse duration into hours, minutes, seconds for the UI
  const duration = config.duration || 0
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60

  const updateDuration = (h, m, s) => {
    const totalSeconds = (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0)
    updateConfig('duration', totalSeconds)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Action</label>
        <select
          value={config.action || 'toggle'}
          onChange={(e) => updateConfig('action', e.target.value)}
          className="input"
        >
          {timerActions.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-theme-muted mt-1">
          What happens when the button is pressed
        </p>
      </div>

      <div>
        <label className="label">Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {timerModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => updateConfig('mode', mode.value)}
              className={`
                p-3 rounded-lg border text-left transition-colors
                ${
                  (config.mode || 'stopwatch') === mode.value
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-theme-secondary bg-theme-tertiary hover:opacity-80'
                }
              `}
            >
              <p className="text-theme-primary font-medium">{mode.label}</p>
              <p className="text-xs text-theme-muted">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {(config.mode === 'countdown') && (
        <div>
          <label className="label">Countdown Duration</label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={hours}
                onChange={(e) => updateDuration(e.target.value, minutes, seconds)}
                min="0"
                max="99"
                className="input text-center"
                placeholder="0"
              />
              <p className="text-xs text-theme-muted text-center mt-1">Hours</p>
            </div>
            <span className="text-theme-secondary text-xl">:</span>
            <div className="flex-1">
              <input
                type="number"
                value={minutes}
                onChange={(e) => updateDuration(hours, e.target.value, seconds)}
                min="0"
                max="59"
                className="input text-center"
                placeholder="0"
              />
              <p className="text-xs text-theme-muted text-center mt-1">Minutes</p>
            </div>
            <span className="text-theme-secondary text-xl">:</span>
            <div className="flex-1">
              <input
                type="number"
                value={seconds}
                onChange={(e) => updateDuration(hours, minutes, e.target.value)}
                min="0"
                max="59"
                className="input text-center"
                placeholder="0"
              />
              <p className="text-xs text-theme-muted text-center mt-1">Seconds</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-theme-tertiary rounded-lg p-3 text-sm text-theme-muted">
        <p className="font-medium text-theme-secondary mb-1">How it works:</p>
        {(config.mode || 'stopwatch') === 'stopwatch' ? (
          <p>The timer will count up from 0:00. The display on the button will show the elapsed time.</p>
        ) : (
          <p>The timer will count down from the set duration. When it reaches 0, the timer will stop.</p>
        )}
      </div>
    </div>
  )
}
