import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import ScriptEditor from './ScriptEditor'

export default function ScriptAction({ config, onChange }) {
  const [showEditor, setShowEditor] = useState(false)

  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value })
  }

  const lineCount = (config.command || '').split('\n').length

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">Command</label>
          <button
            type="button"
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            Expand Editor
          </button>
        </div>
        <div className="relative">
          <textarea
            value={config.command || ''}
            onChange={(e) => updateConfig('command', e.target.value)}
            placeholder="#!/bin/bash&#10;echo 'Hello World'"
            className="input font-mono text-sm pr-16"
            rows={5}
            required
            style={{ tabSize: 2 }}
          />
          <div className="absolute right-2 bottom-2 text-xs text-dark-500">
            {lineCount} line{lineCount !== 1 ? 's' : ''}
          </div>
        </div>
        <p className="text-xs text-dark-500 mt-1">
          The shell command to execute when the button is pressed
        </p>
      </div>

      <div>
        <label className="label">Working Directory (optional)</label>
        <input
          type="text"
          value={config.working_dir || ''}
          onChange={(e) => updateConfig('working_dir', e.target.value)}
          placeholder="/home/user/scripts"
          className="input"
        />
      </div>

      <div>
        <label className="label">Timeout (seconds)</label>
        <input
          type="number"
          value={config.timeout || 30}
          onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
          min={1}
          max={300}
          className="input"
        />
      </div>

      {showEditor && (
        <ScriptEditor
          value={config.command || ''}
          onChange={(value) => updateConfig('command', value)}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}
