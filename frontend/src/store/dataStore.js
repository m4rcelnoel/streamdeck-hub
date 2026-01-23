import { create } from 'zustand'

// Data source types and their configurations
export const dataSources = {
  time: {
    id: 'time',
    name: 'Time',
    description: 'Current time',
    icon: 'Clock',
    formats: [
      { id: 'time_12h', label: '12-hour (3:45 PM)', format: 'h:mm A' },
      { id: 'time_24h', label: '24-hour (15:45)', format: 'HH:mm' },
      { id: 'time_seconds', label: 'With seconds (15:45:30)', format: 'HH:mm:ss' },
      { id: 'date_short', label: 'Date short (Jan 17)', format: 'MMM D' },
      { id: 'date_full', label: 'Date full (Jan 17, 2026)', format: 'MMM D, YYYY' },
      { id: 'day', label: 'Day name (Friday)', format: 'dddd' },
      { id: 'datetime', label: 'Date & Time', format: 'MM/DD HH:mm' },
    ],
    defaultRefresh: 1000, // 1 second
  },
  weather: {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather conditions',
    icon: 'Cloud',
    formats: [
      { id: 'temp_c', label: 'Temperature (°C)' },
      { id: 'temp_f', label: 'Temperature (°F)' },
      { id: 'condition', label: 'Condition (Sunny)' },
      { id: 'humidity', label: 'Humidity (%)' },
      { id: 'wind', label: 'Wind speed' },
      { id: 'full', label: 'Temp + Condition' },
    ],
    defaultRefresh: 300000, // 5 minutes
    requiresConfig: true,
  },
  system: {
    id: 'system',
    name: 'System',
    description: 'CPU, memory, disk usage',
    icon: 'Cpu',
    formats: [
      { id: 'cpu', label: 'CPU Usage (%)' },
      { id: 'memory', label: 'Memory Usage (%)' },
      { id: 'memory_used', label: 'Memory Used (GB)' },
      { id: 'disk', label: 'Disk Usage (%)' },
      { id: 'cpu_temp', label: 'CPU Temperature' },
      { id: 'uptime', label: 'System Uptime' },
    ],
    defaultRefresh: 2000, // 2 seconds
  },
  media: {
    id: 'media',
    name: 'Media',
    description: 'Currently playing media',
    icon: 'Music',
    formats: [
      { id: 'title', label: 'Track Title' },
      { id: 'artist', label: 'Artist' },
      { id: 'album', label: 'Album' },
      { id: 'title_artist', label: 'Title - Artist' },
      { id: 'progress', label: 'Progress (1:23 / 3:45)' },
      { id: 'status', label: 'Play/Pause Status' },
    ],
    defaultRefresh: 1000, // 1 second
  },
  counter: {
    id: 'counter',
    name: 'Counter',
    description: 'Increment/decrement counter',
    icon: 'Hash',
    formats: [
      { id: 'value', label: 'Counter Value' },
      { id: 'value_label', label: 'Label: Value' },
    ],
    defaultRefresh: 0, // No auto-refresh needed
    interactive: true,
  },
  timer: {
    id: 'timer',
    name: 'Timer',
    description: 'Countdown/stopwatch',
    icon: 'Timer',
    formats: [
      { id: 'countdown', label: 'Countdown Timer' },
      { id: 'stopwatch', label: 'Stopwatch' },
    ],
    defaultRefresh: 1000,
    interactive: true,
  },
  homeassistant_sensor: {
    id: 'homeassistant_sensor',
    name: 'HA Sensor',
    description: 'Home Assistant sensor value',
    icon: 'Home',
    formats: [
      { id: 'state', label: 'Sensor State' },
      { id: 'state_unit', label: 'State with Unit' },
      { id: 'friendly_name', label: 'Friendly Name' },
    ],
    defaultRefresh: 5000,
    requiresConfig: true,
  },
}

// Refresh interval presets
export const refreshIntervals = [
  { id: 'realtime', label: 'Real-time (1s)', value: 1000 },
  { id: 'fast', label: 'Fast (2s)', value: 2000 },
  { id: 'normal', label: 'Normal (5s)', value: 5000 },
  { id: 'slow', label: 'Slow (10s)', value: 10000 },
  { id: 'minute', label: '1 minute', value: 60000 },
  { id: '5min', label: '5 minutes', value: 300000 },
  { id: 'manual', label: 'Manual only', value: 0 },
]

export const useDataStore = create((set, get) => ({
  // Cached data values: { [buttonKey]: { value, lastUpdate, error } }
  dataCache: {},

  // Active subscriptions: { [buttonKey]: intervalId }
  subscriptions: {},

  // Counter values (persisted separately)
  counters: {},

  // Timer states
  timers: {},

  // Update cached data for a button
  setData: (buttonKey, value, error = null) => {
    set((state) => ({
      dataCache: {
        ...state.dataCache,
        [buttonKey]: {
          value,
          error,
          lastUpdate: Date.now(),
        },
      },
    }))
  },

  // Get cached data for a button
  getData: (buttonKey) => {
    return get().dataCache[buttonKey] || null
  },

  // Subscribe to data updates for a button
  subscribe: (buttonKey, fetchFn, interval) => {
    const { subscriptions } = get()

    // Clear existing subscription
    if (subscriptions[buttonKey]) {
      clearInterval(subscriptions[buttonKey])
    }

    // Fetch immediately
    fetchFn()

    // Set up interval if needed
    if (interval > 0) {
      const intervalId = setInterval(fetchFn, interval)
      set((state) => ({
        subscriptions: {
          ...state.subscriptions,
          [buttonKey]: intervalId,
        },
      }))
    }
  },

  // Unsubscribe from data updates
  unsubscribe: (buttonKey) => {
    const { subscriptions } = get()
    if (subscriptions[buttonKey]) {
      clearInterval(subscriptions[buttonKey])
      set((state) => {
        const newSubs = { ...state.subscriptions }
        delete newSubs[buttonKey]
        return { subscriptions: newSubs }
      })
    }
  },

  // Counter operations
  incrementCounter: (buttonKey, step = 1) => {
    set((state) => ({
      counters: {
        ...state.counters,
        [buttonKey]: (state.counters[buttonKey] || 0) + step,
      },
    }))
  },

  decrementCounter: (buttonKey, step = 1) => {
    set((state) => ({
      counters: {
        ...state.counters,
        [buttonKey]: (state.counters[buttonKey] || 0) - step,
      },
    }))
  },

  resetCounter: (buttonKey) => {
    set((state) => ({
      counters: {
        ...state.counters,
        [buttonKey]: 0,
      },
    }))
  },

  getCounter: (buttonKey) => {
    return get().counters[buttonKey] || 0
  },

  // Timer operations
  startTimer: (buttonKey, duration = 0, isCountdown = false) => {
    const timer = {
      startTime: Date.now(),
      duration,
      isCountdown,
      isRunning: true,
      pausedAt: null,
    }
    set((state) => ({
      timers: { ...state.timers, [buttonKey]: timer },
    }))
  },

  pauseTimer: (buttonKey) => {
    const { timers } = get()
    if (timers[buttonKey]) {
      set((state) => ({
        timers: {
          ...state.timers,
          [buttonKey]: {
            ...state.timers[buttonKey],
            isRunning: false,
            pausedAt: Date.now(),
          },
        },
      }))
    }
  },

  resumeTimer: (buttonKey) => {
    const { timers } = get()
    if (timers[buttonKey] && timers[buttonKey].pausedAt) {
      const pauseDuration = Date.now() - timers[buttonKey].pausedAt
      set((state) => ({
        timers: {
          ...state.timers,
          [buttonKey]: {
            ...state.timers[buttonKey],
            startTime: state.timers[buttonKey].startTime + pauseDuration,
            isRunning: true,
            pausedAt: null,
          },
        },
      }))
    }
  },

  resetTimer: (buttonKey) => {
    set((state) => {
      const newTimers = { ...state.timers }
      delete newTimers[buttonKey]
      return { timers: newTimers }
    })
  },

  getTimer: (buttonKey) => {
    return get().timers[buttonKey] || null
  },

  // Clear all subscriptions
  clearAllSubscriptions: () => {
    const { subscriptions } = get()
    Object.values(subscriptions).forEach((intervalId) => {
      clearInterval(intervalId)
    })
    set({ subscriptions: {} })
  },
}))

// Helper function to format time
export function formatTime(date, format) {
  const d = date instanceof Date ? date : new Date()
  const hours24 = d.getHours()
  const hours12 = hours24 % 12 || 12
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')
  const ampm = hours24 >= 12 ? 'PM' : 'AM'
  const day = d.getDate()
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year = d.getFullYear()
  const dayName = d.toLocaleString('en-US', { weekday: 'long' })

  switch (format) {
    case 'h:mm A':
      return `${hours12}:${minutes} ${ampm}`
    case 'HH:mm':
      return `${hours24.toString().padStart(2, '0')}:${minutes}`
    case 'HH:mm:ss':
      return `${hours24.toString().padStart(2, '0')}:${minutes}:${seconds}`
    case 'MMM D':
      return `${month} ${day}`
    case 'MMM D, YYYY':
      return `${month} ${day}, ${year}`
    case 'dddd':
      return dayName
    case 'MM/DD HH:mm':
      return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')} ${hours24.toString().padStart(2, '0')}:${minutes}`
    default:
      return `${hours24.toString().padStart(2, '0')}:${minutes}`
  }
}

// Helper function to format duration
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
