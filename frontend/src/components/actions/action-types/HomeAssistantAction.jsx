import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { homeAssistantApi } from '../../../services/api'

export default function HomeAssistantAction({ config, onChange }) {
  const [entities, setEntities] = useState([])
  const [services, setServices] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [entitiesRes, servicesRes] = await Promise.all([
        homeAssistantApi.entities(),
        homeAssistantApi.services(),
      ])
      setEntities(entitiesRes.data.entities || [])
      setServices(servicesRes.data.services || {})
    } catch (err) {
      setError('Failed to load Home Assistant data. Is it configured?')
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value })
  }

  const domains = Object.keys(services).sort()
  const selectedDomain = config.domain || ''
  const domainServices = services[selectedDomain] || []

  // Filter entities by domain
  const domainEntities = entities.filter(
    (e) => e.domain === selectedDomain
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 text-dark-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-400 mb-4">{error}</p>
        <button onClick={loadData} className="btn btn-secondary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Domain</label>
        <select
          value={selectedDomain}
          onChange={(e) => {
            updateConfig('domain', e.target.value)
            updateConfig('service', '')
            updateConfig('entity_id', '')
          }}
          className="input"
          required
        >
          <option value="">Select domain...</option>
          {domains.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>

      {selectedDomain && (
        <div>
          <label className="label">Service</label>
          <select
            value={config.service || ''}
            onChange={(e) => updateConfig('service', e.target.value)}
            className="input"
            required
          >
            <option value="">Select service...</option>
            {domainServices.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedDomain && (
        <div>
          <label className="label">Entity</label>
          <select
            value={config.entity_id || ''}
            onChange={(e) => updateConfig('entity_id', e.target.value)}
            className="input"
            required
          >
            <option value="">Select entity...</option>
            {domainEntities.map((entity) => (
              <option key={entity.entity_id} value={entity.entity_id}>
                {entity.friendly_name} ({entity.entity_id})
              </option>
            ))}
          </select>
          {domainEntities.length === 0 && (
            <p className="text-xs text-dark-500 mt-1">
              No entities found for this domain. You can enter an entity ID manually.
            </p>
          )}
        </div>
      )}

      {domainEntities.length === 0 && selectedDomain && (
        <div>
          <label className="label">Entity ID (manual)</label>
          <input
            type="text"
            value={config.entity_id || ''}
            onChange={(e) => updateConfig('entity_id', e.target.value)}
            placeholder={`${selectedDomain}.example`}
            className="input"
          />
        </div>
      )}
    </div>
  )
}
