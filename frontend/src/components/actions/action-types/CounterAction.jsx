export default function CounterAction({ config, onChange }) {
  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value })
  }

  const counterActions = [
    { value: 'increment', label: 'Increment (+)' },
    { value: 'decrement', label: 'Decrement (-)' },
    { value: 'reset', label: 'Reset to 0' },
    { value: 'set', label: 'Set to Value' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Action</label>
        <select
          value={config.action || 'increment'}
          onChange={(e) => updateConfig('action', e.target.value)}
          className="input"
        >
          {counterActions.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>
      </div>

      {(config.action === 'increment' || config.action === 'decrement') && (
        <div>
          <label className="label">Step</label>
          <input
            type="number"
            value={config.step || 1}
            onChange={(e) => updateConfig('step', parseInt(e.target.value) || 1)}
            min="1"
            className="input"
          />
          <p className="text-xs text-theme-muted mt-1">
            Amount to add or subtract each press
          </p>
        </div>
      )}

      {config.action === 'set' && (
        <div>
          <label className="label">Set Value</label>
          <input
            type="number"
            value={config.set_value ?? 0}
            onChange={(e) => updateConfig('set_value', parseInt(e.target.value) || 0)}
            className="input"
          />
        </div>
      )}

      <div className="border-t border-theme-secondary pt-4">
        <h4 className="text-sm font-medium text-theme-primary mb-3">Limits (Optional)</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Minimum</label>
            <input
              type="number"
              value={config.min_value ?? ''}
              onChange={(e) => updateConfig('min_value', e.target.value === '' ? null : parseInt(e.target.value))}
              placeholder="No limit"
              className="input"
            />
          </div>
          <div>
            <label className="label">Maximum</label>
            <input
              type="number"
              value={config.max_value ?? ''}
              onChange={(e) => updateConfig('max_value', e.target.value === '' ? null : parseInt(e.target.value))}
              placeholder="No limit"
              className="input"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.wrap || false}
              onChange={(e) => updateConfig('wrap', e.target.checked)}
              className="w-4 h-4 rounded border-theme-secondary bg-theme-tertiary text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-theme-secondary">
              Wrap around when hitting limits
            </span>
          </label>
          <p className="text-xs text-theme-muted mt-1 ml-6">
            When enabled, going past max wraps to min and vice versa
          </p>
        </div>
      </div>
    </div>
  )
}
