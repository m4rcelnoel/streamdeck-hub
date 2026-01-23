import { create } from 'zustand'
import { devicesApi, profilesApi, actionsApi } from '../services/api'

export const useStore = create((set, get) => ({
  // Devices state
  devices: [],
  devicesLoading: false,
  selectedDevice: null,

  // Profiles state
  profiles: [],
  profilesLoading: false,
  selectedProfile: null,

  // Actions state
  actions: [],
  actionsLoading: false,

  // WebSocket state
  wsConnected: false,

  // Button states (key: "profileId:position", value: { state: 'on'|'off'|'unknown', loading: boolean })
  buttonStates: {},

  // Device actions
  fetchDevices: async () => {
    set({ devicesLoading: true })
    try {
      const response = await devicesApi.list()
      set({ devices: response.data, devicesLoading: false })
    } catch (error) {
      console.error('Failed to fetch devices:', error)
      set({ devicesLoading: false })
    }
  },

  selectDevice: (device) => set({ selectedDevice: device }),

  updateDevice: async (id, data) => {
    try {
      const response = await devicesApi.update(id, data)
      const devices = get().devices.map(d =>
        d.id === id ? response.data : d
      )
      set({ devices })
      if (get().selectedDevice?.id === id) {
        set({ selectedDevice: response.data })
      }
      return response.data
    } catch (error) {
      console.error('Failed to update device:', error)
      throw error
    }
  },

  // Profile actions
  fetchProfiles: async () => {
    set({ profilesLoading: true })
    try {
      const response = await profilesApi.list()
      set({ profiles: response.data, profilesLoading: false })
    } catch (error) {
      console.error('Failed to fetch profiles:', error)
      set({ profilesLoading: false })
    }
  },

  selectProfile: (profile) => set({ selectedProfile: profile }),

  createProfile: async (data) => {
    try {
      const response = await profilesApi.create(data)
      set({ profiles: [...get().profiles, response.data] })
      return response.data
    } catch (error) {
      console.error('Failed to create profile:', error)
      throw error
    }
  },

  updateProfile: async (id, data) => {
    try {
      const response = await profilesApi.update(id, data)
      const profiles = get().profiles.map(p =>
        p.id === id ? response.data : p
      )
      set({ profiles })
      if (get().selectedProfile?.id === id) {
        set({ selectedProfile: response.data })
      }
      return response.data
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  },

  deleteProfile: async (id) => {
    try {
      await profilesApi.delete(id)
      const profiles = get().profiles.filter(p => p.id !== id)
      set({ profiles })
      if (get().selectedProfile?.id === id) {
        set({ selectedProfile: null })
      }
    } catch (error) {
      console.error('Failed to delete profile:', error)
      throw error
    }
  },

  // Action actions
  fetchActions: async () => {
    set({ actionsLoading: true })
    try {
      const response = await actionsApi.list()
      set({ actions: response.data, actionsLoading: false })
    } catch (error) {
      console.error('Failed to fetch actions:', error)
      set({ actionsLoading: false })
    }
  },

  createAction: async (data) => {
    try {
      const response = await actionsApi.create(data)
      set({ actions: [...get().actions, response.data] })
      return response.data
    } catch (error) {
      console.error('Failed to create action:', error)
      throw error
    }
  },

  updateAction: async (id, data) => {
    try {
      const response = await actionsApi.update(id, data)
      const actions = get().actions.map(a =>
        a.id === id ? response.data : a
      )
      set({ actions })
      return response.data
    } catch (error) {
      console.error('Failed to update action:', error)
      throw error
    }
  },

  deleteAction: async (id) => {
    try {
      await actionsApi.delete(id)
      const actions = get().actions.filter(a => a.id !== id)
      set({ actions })
    } catch (error) {
      console.error('Failed to delete action:', error)
      throw error
    }
  },

  // WebSocket actions
  setWsConnected: (connected) => set({ wsConnected: connected }),

  handleDeviceConnected: (device) => {
    const devices = get().devices
    const existing = devices.find(d => d.id === device.id)
    if (existing) {
      set({ devices: devices.map(d => d.id === device.id ? { ...d, is_connected: true } : d) })
    } else {
      get().fetchDevices()
    }
  },

  handleDeviceDisconnected: (deviceId) => {
    const devices = get().devices.map(d =>
      d.id === deviceId ? { ...d, is_connected: false } : d
    )
    set({ devices })
  },

  // Button state actions
  setButtonState: (profileId, position, state) => {
    const key = `${profileId}:${position}`
    set({
      buttonStates: {
        ...get().buttonStates,
        [key]: { ...get().buttonStates[key], state, loading: false },
      },
    })
  },

  setButtonLoading: (profileId, position, loading) => {
    const key = `${profileId}:${position}`
    set({
      buttonStates: {
        ...get().buttonStates,
        [key]: { ...get().buttonStates[key], loading },
      },
    })
  },

  getButtonState: (profileId, position) => {
    const key = `${profileId}:${position}`
    return get().buttonStates[key] || { state: 'unknown', loading: false }
  },

  handleStateChanged: (data) => {
    const { profile_id, position, state } = data
    if (profile_id && position !== undefined) {
      get().setButtonState(profile_id, position, state)
    }
  },
}))
