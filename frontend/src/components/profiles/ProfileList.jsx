import { Layers, MoreVertical, Edit, Copy, Trash2, Download, Upload } from 'lucide-react'
import { useState, useRef } from 'react'
import { profilesApi } from '../../services/api'

export default function ProfileList({
  profiles,
  loading,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(null)
  const fileInputRef = useRef(null)

  const handleDuplicate = async (profile) => {
    try {
      await profilesApi.duplicate(profile.id)
      window.location.reload()
    } catch (error) {
      console.error('Failed to duplicate profile:', error)
    }
    setMenuOpen(null)
  }

  const handleExport = async (profile) => {
    try {
      const response = await profilesApi.export(profile.id)
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${profile.name}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export profile:', error)
    }
    setMenuOpen(null)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await profilesApi.import(data)
      window.location.reload()
    } catch (error) {
      console.error('Failed to import profile:', error)
      alert('Failed to import profile. Make sure the file is valid JSON.')
    }
    e.target.value = ''
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-theme-tertiary rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-theme-primary">All Profiles</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {profiles.length === 0 ? (
        <p className="text-theme-muted text-center py-8">
          No profiles yet. Create your first profile!
        </p>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`
                relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                ${
                  selectedId === profile.id
                    ? 'bg-primary-600/20 border border-primary-600'
                    : 'bg-theme-tertiary hover:opacity-80 border border-transparent'
                }
              `}
              onClick={() => onSelect(profile)}
            >
              <div className="p-2 rounded-lg bg-theme-secondary">
                <Layers className="w-5 h-5 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-theme-primary font-medium truncate">{profile.name}</p>
                {profile.description && (
                  <p className="text-theme-muted text-sm truncate">
                    {profile.description}
                  </p>
                )}
                <p className="text-theme-muted text-xs opacity-75">
                  {profile.buttons?.length || 0} buttons
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(menuOpen === profile.id ? null : profile.id)
                  }}
                  className="p-1 rounded hover:bg-theme-secondary transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-theme-muted" />
                </button>

                {menuOpen === profile.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-theme-secondary rounded-lg shadow-xl border py-1 z-20 min-w-[140px]" style={{ borderColor: 'var(--color-border)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(profile)
                          setMenuOpen(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:bg-theme-tertiary"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicate(profile)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:bg-theme-tertiary"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExport(profile)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:bg-theme-tertiary"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      <hr className="my-1" style={{ borderColor: 'var(--color-border)' }} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(profile.id)
                          setMenuOpen(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-theme-tertiary"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
