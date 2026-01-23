import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Play, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProfiles } from '../hooks/useProfiles'
import { profilesApi, buttonsApi } from '../services/api'
import { useThemeStore, profileThemes } from '../store/themeStore'
import ProfileList from '../components/profiles/ProfileList'
import ProfileEditor from '../components/profiles/ProfileEditor'
import DeckGrid from '../components/deck/DeckGrid'
import ButtonEditor from '../components/deck/ButtonEditor'

export default function Profiles() {
  const { t } = useTranslation()
  const { profileId } = useParams()
  const { profiles, loading, createProfile, deleteProfile, refresh } = useProfiles()
  const { previewMode, togglePreviewMode, clearPreviewStates } = useThemeStore()
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [allButtons, setAllButtons] = useState([])  // All buttons across all pages
  const [currentPage, setCurrentPage] = useState(0)
  const [editingButton, setEditingButton] = useState(null)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)

  // Get profile theme
  const profileTheme = useMemo(() => {
    const themeId = selectedProfile?.theme || 'default'
    return profileThemes.find(t => t.id === themeId) || profileThemes[0]
  }, [selectedProfile?.theme])

  // Filter buttons for current page
  const buttons = useMemo(() => {
    return allButtons.filter(b => (b.page || 0) === currentPage)
  }, [allButtons, currentPage])

  // Calculate max page number
  const maxPage = useMemo(() => {
    if (allButtons.length === 0) return 0
    return Math.max(...allButtons.map(b => b.page || 0))
  }, [allButtons])

  useEffect(() => {
    if (profileId) {
      const profile = profiles.find((p) => p.id === profileId)
      if (profile) {
        setSelectedProfile(profile)
        loadButtons(profileId)
      }
    }
  }, [profileId, profiles])

  const loadButtons = async (id) => {
    try {
      const response = await buttonsApi.list(id)  // Load all buttons for all pages
      setAllButtons(response.data)
    } catch (error) {
      console.error('Failed to load buttons:', error)
    }
  }

  const handleSelectProfile = async (profile) => {
    setSelectedProfile(profile)
    setCurrentPage(0)  // Reset to first page when selecting a new profile
    await loadButtons(profile.id)
  }

  const handleCreateProfile = async (data) => {
    await createProfile(data)
    setShowProfileEditor(false)
    refresh()
  }

  const handleEditProfile = (profile) => {
    setEditingProfile(profile)
    setShowProfileEditor(true)
  }

  const handleUpdateProfile = async (data) => {
    try {
      await profilesApi.update(editingProfile.id, data)
      setShowProfileEditor(false)
      setEditingProfile(null)
      refresh()
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleDeleteProfile = async (id) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      await deleteProfile(id)
      if (selectedProfile?.id === id) {
        setSelectedProfile(null)
        setAllButtons([])
      }
    }
  }

  const handleButtonClick = (position) => {
    const button = buttons.find((b) => b.position === position && (b.page || 0) === currentPage)
    setEditingButton({ position, page: currentPage, data: button || null })
  }

  const handleButtonSave = async (position, data) => {
    try {
      // Include the current page in the button data
      const buttonData = { ...data, page: currentPage }
      await buttonsApi.update(selectedProfile.id, position, buttonData)
      await loadButtons(selectedProfile.id)
      setEditingButton(null)
    } catch (error) {
      console.error('Failed to save button:', error)
    }
  }

  const handleButtonDelete = async (position) => {
    try {
      // Delete button on the current page
      await buttonsApi.delete(selectedProfile.id, position, currentPage)
      await loadButtons(selectedProfile.id)
      setEditingButton(null)
    } catch (error) {
      console.error('Failed to delete button:', error)
    }
  }

  const handleAddPage = () => {
    setCurrentPage(maxPage + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">{t('profiles.title')}</h1>
          <p className="text-theme-muted mt-1">
            {t('profiles.subtitle')}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProfile(null)
            setShowProfileEditor(true)
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('profiles.newProfile')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProfileList
            profiles={profiles}
            loading={loading}
            selectedId={selectedProfile?.id}
            onSelect={handleSelectProfile}
            onEdit={handleEditProfile}
            onDelete={handleDeleteProfile}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedProfile ? (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-theme-primary">
                      {selectedProfile.name}
                    </h2>

                    {/* Preview Mode Toggle */}
                    <button
                      onClick={() => {
                        if (previewMode) {
                          clearPreviewStates()
                        }
                        togglePreviewMode()
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        previewMode
                          ? 'bg-primary-600 text-white'
                          : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
                      }`}
                      title={previewMode ? t('profiles.stopPreview') : t('profiles.preview')}
                    >
                      {previewMode ? (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>{t('profiles.stopPreview')}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>{t('profiles.preview')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="p-1.5 rounded-lg bg-theme-tertiary hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: maxPage + 1 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === i
                              ? 'bg-primary-600 text-white'
                              : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={handleAddPage}
                        className="w-8 h-8 rounded-lg bg-theme-tertiary text-theme-muted hover:opacity-80 transition-colors text-lg"
                        title={t('profiles.addPage')}
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(maxPage, currentPage + 1))}
                      disabled={currentPage >= maxPage}
                      className="p-1.5 rounded-lg bg-theme-tertiary hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-theme-muted">
                    {t('profiles.pageOf', { current: currentPage + 1, total: maxPage + 1 })}
                    {maxPage > 0 && ` - ${t('profiles.pageNavHint')}`}
                  </p>
                  {previewMode && (
                    <p className="text-xs text-primary-400">
                      {t('profiles.previewHint')}
                    </p>
                  )}
                </div>

                <DeckGrid
                  keyCount={15} // Default to 15 for Stream Deck
                  buttons={buttons}
                  onButtonClick={previewMode ? null : handleButtonClick}
                  profileId={selectedProfile.id}
                  readonly={previewMode}
                  deckBackground={profileTheme.deckBackground}
                />
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-theme-muted">
                {t('profiles.selectProfile')}
              </p>
            </div>
          )}
        </div>
      </div>

      {showProfileEditor && (
        <ProfileEditor
          profile={editingProfile}
          onSave={editingProfile ? handleUpdateProfile : handleCreateProfile}
          onClose={() => {
            setShowProfileEditor(false)
            setEditingProfile(null)
          }}
        />
      )}

      {editingButton && (
        <ButtonEditor
          position={editingButton.position}
          button={editingButton.data}
          onSave={handleButtonSave}
          onDelete={handleButtonDelete}
          onClose={() => setEditingButton(null)}
        />
      )}
    </div>
  )
}
