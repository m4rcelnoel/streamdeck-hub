import { useEffect, useCallback, useRef } from 'react'
import { useDataStore, dataSources, formatTime, formatDuration } from '../store/dataStore'
import { dataApi } from '../services/api'

export function useDataDisplay(buttonKey, config) {
  // Subscribe to the specific data cache entry for this button - this enables reactive updates
  const dataResult = useDataStore((state) => buttonKey ? state.dataCache[buttonKey] : null)
  const setData = useDataStore((state) => state.setData)
  const subscribe = useDataStore((state) => state.subscribe)
  const unsubscribe = useDataStore((state) => state.unsubscribe)
  const getCounter = useDataStore((state) => state.getCounter)
  const getTimer = useDataStore((state) => state.getTimer)

  const configRef = useRef(config)
  configRef.current = config

  const fetchData = useCallback(async () => {
    if (!buttonKey || !configRef.current?.data_source) return

    const { data_source, data_format, data_config } = configRef.current

    try {
      let value = ''

      switch (data_source) {
        case 'time': {
          const format = dataSources.time.formats.find(f => f.id === data_format)?.format || 'HH:mm'
          value = formatTime(new Date(), format)
          break
        }

        case 'system': {
          const response = await dataApi.getSystemInfo()
          const info = response.data
          switch (data_format) {
            case 'cpu':
              value = `${Math.round(info.cpu_percent)}%`
              break
            case 'memory':
              value = `${Math.round(info.memory_percent)}%`
              break
            case 'memory_used':
              value = `${(info.memory_used / 1024 / 1024 / 1024).toFixed(1)}GB`
              break
            case 'disk':
              value = `${Math.round(info.disk_percent)}%`
              break
            case 'cpu_temp':
              value = info.cpu_temp ? `${Math.round(info.cpu_temp)}°C` : 'N/A'
              break
            case 'uptime':
              value = formatDuration(info.uptime * 1000)
              break
            default:
              value = `${Math.round(info.cpu_percent)}%`
          }
          break
        }

        case 'weather': {
          const location = data_config?.location || 'auto'
          const response = await dataApi.getWeather(location)
          const weather = response.data
          switch (data_format) {
            case 'temp_c':
              value = `${Math.round(weather.temp_c)}°C`
              break
            case 'temp_f':
              value = `${Math.round(weather.temp_f)}°F`
              break
            case 'condition':
              value = weather.condition
              break
            case 'humidity':
              value = `${weather.humidity}%`
              break
            case 'wind':
              value = `${weather.wind_kph} km/h`
              break
            case 'full':
              value = `${Math.round(weather.temp_c)}° ${weather.condition}`
              break
            default:
              value = `${Math.round(weather.temp_c)}°C`
          }
          break
        }

        case 'media': {
          const response = await dataApi.getMediaStatus()
          const media = response.data
          if (!media.is_playing && data_format !== 'status') {
            value = '—'
          } else {
            switch (data_format) {
              case 'title':
                value = media.title || '—'
                break
              case 'artist':
                value = media.artist || '—'
                break
              case 'album':
                value = media.album || '—'
                break
              case 'title_artist':
                value = media.title ? `${media.title}\n${media.artist || ''}` : '—'
                break
              case 'progress':
                if (media.position && media.duration) {
                  value = `${formatDuration(media.position)} / ${formatDuration(media.duration)}`
                } else {
                  value = '—'
                }
                break
              case 'status':
                value = media.is_playing ? '▶' : '⏸'
                break
              default:
                value = media.title || '—'
            }
          }
          break
        }

        case 'counter': {
          const count = getCounter(buttonKey)
          const label = data_config?.label || ''
          if (data_format === 'value_label' && label) {
            value = `${label}\n${count}`
          } else {
            value = count.toString()
          }
          break
        }

        case 'timer': {
          const timer = getTimer(buttonKey)
          if (!timer) {
            if (data_format === 'countdown') {
              const duration = data_config?.duration || 300000 // 5 min default
              value = formatDuration(duration)
            } else {
              value = '0:00'
            }
          } else {
            const elapsed = timer.isRunning
              ? Date.now() - timer.startTime
              : (timer.pausedAt || Date.now()) - timer.startTime

            if (timer.isCountdown) {
              const remaining = Math.max(0, timer.duration - elapsed)
              value = formatDuration(remaining)
            } else {
              value = formatDuration(elapsed)
            }
          }
          break
        }

        case 'homeassistant_sensor': {
          const entityId = data_config?.entity_id
          if (entityId) {
            const response = await dataApi.getHASensor(entityId)
            const sensor = response.data
            switch (data_format) {
              case 'state':
                value = sensor.state
                break
              case 'state_unit':
                value = `${sensor.state}${sensor.unit || ''}`
                break
              case 'friendly_name':
                value = sensor.friendly_name || sensor.state
                break
              default:
                value = sensor.state
            }
          }
          break
        }

        default:
          value = '—'
      }

      setData(buttonKey, value)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setData(buttonKey, '—', error.message)
    }
  }, [buttonKey, setData, getCounter, getTimer])

  useEffect(() => {
    // Don't subscribe if we don't have a valid key or config
    if (!buttonKey || !config?.data_source) return

    const source = dataSources[config.data_source]
    const refreshInterval = config.refresh_interval ?? source?.defaultRefresh ?? 5000

    subscribe(buttonKey, fetchData, refreshInterval)

    return () => {
      unsubscribe(buttonKey)
    }
  }, [buttonKey, config?.data_source, config?.data_format, config?.refresh_interval, subscribe, unsubscribe, fetchData])

  return dataResult
}

// Hook for managing all data displays on a page
export function usePageDataDisplays(profileId, buttons) {
  const { clearAllSubscriptions } = useDataStore()

  useEffect(() => {
    return () => {
      // Clean up when unmounting
      clearAllSubscriptions()
    }
  }, [profileId, clearAllSubscriptions])

  return buttons.filter(b => b.data_source)
}
