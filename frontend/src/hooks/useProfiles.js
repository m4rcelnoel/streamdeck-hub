import { useEffect } from 'react'
import { useStore } from '../store'

export function useProfiles() {
  const {
    profiles,
    profilesLoading,
    selectedProfile,
    fetchProfiles,
    selectProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useStore()

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  return {
    profiles,
    loading: profilesLoading,
    selectedProfile,
    selectProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    refresh: fetchProfiles,
  }
}
