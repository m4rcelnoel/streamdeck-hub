import { useEffect, useState } from 'react'
import { profilesApi } from '../../../services/api'

export function GoToPageAction({ config, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Page Number</label>
        <input
          type="number"
          value={config.page ?? 0}
          onChange={(e) => onChange({ ...config, page: parseInt(e.target.value) || 0 })}
          min={0}
          className="input"
        />
        <p className="text-xs text-dark-500 mt-1">
          Page numbers start at 0 (first page)
        </p>
      </div>
    </div>
  )
}

export function OpenFolderAction({ config, onChange }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const response = await profilesApi.list()
      setProfiles(response.data || [])
    } catch (error) {
      console.error('Failed to load profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter to show profiles marked as folders, or all profiles
  const folderProfiles = profiles.filter(p => p.is_folder || true)

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Folder Profile</label>
        {loading ? (
          <p className="text-dark-400 text-sm">Loading profiles...</p>
        ) : (
          <select
            value={config.profile_id || ''}
            onChange={(e) => onChange({ ...config, profile_id: e.target.value })}
            className="input"
            required
          >
            <option value="">Select a profile...</option>
            {folderProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} {profile.is_folder ? '(folder)' : ''}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-dark-500 mt-1">
          Select the profile to open when this button is pressed.
          Add a "Go Back" button in that profile to return.
        </p>
      </div>
    </div>
  )
}

export function EmptyNavAction() {
  return (
    <div className="text-dark-400 text-sm py-2">
      No additional configuration needed.
    </div>
  )
}
