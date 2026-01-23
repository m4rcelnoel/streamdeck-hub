import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Devices API
export const devicesApi = {
  list: () => api.get('/devices'),
  get: (id) => api.get(`/devices/${id}`),
  update: (id, data) => api.put(`/devices/${id}`, data),
  identify: (id) => api.post(`/devices/${id}/identify`),
}

// Profiles API
export const profilesApi = {
  list: () => api.get('/profiles'),
  get: (id) => api.get(`/profiles/${id}`),
  create: (data) => api.post('/profiles', data),
  update: (id, data) => api.put(`/profiles/${id}`, data),
  delete: (id) => api.delete(`/profiles/${id}`),
  duplicate: (id) => api.post(`/profiles/${id}/duplicate`),
  export: (id) => api.get(`/profiles/${id}/export`),
  import: (data) => api.post('/profiles/import', data),
}

// Buttons API
export const buttonsApi = {
  list: (profileId, page = null) => {
    const params = page !== null ? { page } : {}
    return api.get(`/profiles/${profileId}/buttons`, { params })
  },
  update: (profileId, position, data) =>
    api.put(`/profiles/${profileId}/buttons/${position}`, data),
  delete: (profileId, position, page = 0) =>
    api.delete(`/profiles/${profileId}/buttons/${position}`, { params: { page } }),
}

// Actions API
export const actionsApi = {
  list: () => api.get('/actions'),
  get: (id) => api.get(`/actions/${id}`),
  create: (data) => api.post('/actions', data),
  update: (id, data) => api.put(`/actions/${id}`, data),
  delete: (id) => api.delete(`/actions/${id}`),
  test: (id) => api.post(`/actions/${id}/test`),
}

// Home Assistant API
export const homeAssistantApi = {
  status: () => api.get('/homeassistant/status'),
  connect: (data) => api.post('/homeassistant/connect', data),
  entities: () => api.get('/homeassistant/entities'),
  services: () => api.get('/homeassistant/services'),
}

// Icons API
export const iconsApi = {
  list: () => api.get('/icons'),
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/icons/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (filename) => api.delete(`/icons/upload/${filename}`),
}

// Data API - for live data displays
export const dataApi = {
  // System information (CPU, memory, disk, etc.)
  getSystemInfo: () => api.get('/data/system'),

  // Weather information
  getWeather: (location = 'auto') => api.get('/data/weather', { params: { location } }),

  // Media playback status
  getMediaStatus: () => api.get('/data/media'),

  // Home Assistant sensor data
  getHASensor: (entityId) => api.get(`/data/homeassistant/${entityId}`),

  // Counter operations
  getCounters: () => api.get('/data/counters'),
  getCounter: (key) => api.get(`/data/counters/${key}`),
  updateCounter: (key, data) => api.post(`/data/counters/${key}`, data),

  // Timer operations
  getTimers: () => api.get('/data/timers'),
  getTimer: (key) => api.get(`/data/timers/${key}`),
  updateTimer: (key, data) => api.post(`/data/timers/${key}`, data),
}

// Sonos API
export const sonosApi = {
  status: () => api.get('/media/sonos/status'),
  discover: () => api.post('/media/sonos/discover'),
  speakers: () => api.get('/media/sonos/speakers'),
  setDefault: (uid) => api.post(`/media/sonos/speakers/${uid}/default`),
  nowPlaying: (uid = null) => api.get('/media/sonos/now-playing', { params: uid ? { uid } : {} }),
  command: (command, params = {}) => api.post(`/media/sonos/command/${command}`, null, { params }),
}

// Spotify API
export const spotifyApi = {
  status: () => api.get('/media/spotify/status'),
  configure: (data) => api.post('/media/spotify/configure', data),
  authUrl: () => api.get('/media/spotify/auth-url'),
  authenticate: (code) => api.post('/media/spotify/authenticate', { code }),
  devices: () => api.get('/media/spotify/devices'),
  nowPlaying: () => api.get('/media/spotify/now-playing'),
  command: (command, params = {}) => api.post(`/media/spotify/command/${command}`, null, { params }),
}

// Discord API
export const discordApi = {
  status: () => api.get('/streaming/discord/status'),
  configure: (data) => api.post('/streaming/discord/configure', data),
}

// Twitch API
export const twitchApi = {
  status: () => api.get('/streaming/twitch/status'),
  configure: (data) => api.post('/streaming/twitch/configure', data),
  authUrl: () => api.get('/streaming/twitch/auth-url'),
  authenticate: (code) => api.post('/streaming/twitch/authenticate', { code }),
  streamInfo: () => api.get('/streaming/twitch/stream-info'),
  searchGame: (query) => api.get('/streaming/twitch/search-game', { params: { query } }),
}

// Hotkey API
export const hotkeyApi = {
  status: () => api.get('/streaming/hotkey/status'),
}

// Wake-on-LAN API
export const wolApi = {
  validate: (mac_address) => api.post('/streaming/wol/validate', { mac_address }),
}

export default api
