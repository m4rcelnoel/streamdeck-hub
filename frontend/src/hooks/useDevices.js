import { useEffect } from 'react'
import { useStore } from '../store'

export function useDevices() {
  const {
    devices,
    devicesLoading,
    selectedDevice,
    fetchDevices,
    selectDevice,
    updateDevice,
  } = useStore()

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  return {
    devices,
    loading: devicesLoading,
    selectedDevice,
    selectDevice,
    updateDevice,
    refresh: fetchDevices,
  }
}
