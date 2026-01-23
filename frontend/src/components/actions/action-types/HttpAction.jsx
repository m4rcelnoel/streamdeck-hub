import { useState } from 'react'

export default function HttpAction({ config, onChange }) {
  const [headersText, setHeadersText] = useState(
    JSON.stringify(config.headers || {}, null, 2)
  )
  const [bodyText, setBodyText] = useState(
    config.body ? JSON.stringify(config.body, null, 2) : ''
  )

  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value })
  }

  const handleHeadersChange = (text) => {
    setHeadersText(text)
    try {
      const parsed = JSON.parse(text)
      updateConfig('headers', parsed)
    } catch {
      // Invalid JSON, keep the text but don't update config
    }
  }

  const handleBodyChange = (text) => {
    setBodyText(text)
    if (!text.trim()) {
      updateConfig('body', null)
      return
    }
    try {
      const parsed = JSON.parse(text)
      updateConfig('body', parsed)
    } catch {
      // Invalid JSON, keep the text but don't update config
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">HTTP Method</label>
        <select
          value={config.method || 'POST'}
          onChange={(e) => updateConfig('method', e.target.value)}
          className="input"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div>
        <label className="label">URL</label>
        <input
          type="url"
          value={config.url || ''}
          onChange={(e) => updateConfig('url', e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="input"
          required
        />
      </div>

      <div>
        <label className="label">Headers (JSON)</label>
        <textarea
          value={headersText}
          onChange={(e) => handleHeadersChange(e.target.value)}
          placeholder='{"Authorization": "Bearer token"}'
          className="input font-mono text-sm"
          rows={3}
        />
      </div>

      <div>
        <label className="label">Body (JSON, optional)</label>
        <textarea
          value={bodyText}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder='{"key": "value"}'
          className="input font-mono text-sm"
          rows={4}
        />
      </div>
    </div>
  )
}
