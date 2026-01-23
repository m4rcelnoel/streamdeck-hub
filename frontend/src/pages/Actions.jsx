import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Play, Terminal, Globe, Home, ChevronRight, ChevronLeft, Layers, FolderOpen, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'
import { actionsApi } from '../services/api'
import ActionBuilder from '../components/actions/ActionBuilder'

const actionTypeIcons = {
  script: { icon: Terminal, color: 'text-green-400', bg: 'bg-green-900/20' },
  http: { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-900/20' },
  homeassistant: { icon: Home, color: 'text-amber-400', bg: 'bg-amber-900/20' },
  next_page: { icon: ChevronRight, color: 'text-purple-400', bg: 'bg-purple-900/20' },
  prev_page: { icon: ChevronLeft, color: 'text-purple-400', bg: 'bg-purple-900/20' },
  go_to_page: { icon: Layers, color: 'text-purple-400', bg: 'bg-purple-900/20' },
  open_folder: { icon: FolderOpen, color: 'text-cyan-400', bg: 'bg-cyan-900/20' },
  go_back: { icon: Undo2, color: 'text-cyan-400', bg: 'bg-cyan-900/20' },
}

export default function Actions() {
  const { t } = useTranslation()
  const { actions, fetchActions, deleteAction, actionsLoading } = useStore()
  const [showActionBuilder, setShowActionBuilder] = useState(false)
  const [editingAction, setEditingAction] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(null)

  const actionTypeLabels = {
    script: t('actions.types.script'),
    http: t('actions.types.http'),
    homeassistant: t('actions.types.homeassistant'),
    next_page: t('actions.navigation.nextPage'),
    prev_page: t('actions.navigation.prevPage'),
    go_to_page: t('actions.navigation.goToPage'),
    open_folder: t('actions.navigation.openFolder'),
    go_back: t('actions.navigation.goBack'),
  }

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  const handleCreate = () => {
    setEditingAction(null)
    setShowActionBuilder(true)
  }

  const handleEdit = (action) => {
    setEditingAction(action)
    setShowActionBuilder(true)
  }

  const handleDelete = async (action) => {
    if (confirm(t('actions.deleteConfirm'))) {
      try {
        await deleteAction(action.id)
      } catch (error) {
        console.error('Failed to delete action:', error)
      }
    }
  }

  const handleTest = async (action) => {
    setTesting(action.id)
    setTestResult(null)
    try {
      const response = await actionsApi.test(action.id)
      setTestResult({ actionId: action.id, ...response.data })
    } catch (error) {
      setTestResult({ actionId: action.id, success: false, error: error.message })
    } finally {
      setTesting(null)
    }
  }

  const handleSave = () => {
    setShowActionBuilder(false)
    setEditingAction(null)
    fetchActions()
  }

  const getActionIcon = (type) => {
    const config = actionTypeIcons[type] || actionTypeIcons.script
    const Icon = config.icon
    return (
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
    )
  }

  const getConfigSummary = (action) => {
    const config = action.config || {}
    switch (action.action_type) {
      case 'script':
        return config.command ? `$ ${config.command.substring(0, 50)}${config.command.length > 50 ? '...' : ''}` : t('actions.script.command')
      case 'http':
        return config.url ? `${config.method || 'GET'} ${config.url.substring(0, 40)}${config.url.length > 40 ? '...' : ''}` : 'No URL'
      case 'homeassistant':
        return config.entity_id ? `${config.domain}.${config.service} → ${config.entity_id}` : t('settings.homeassistant.notConnected')
      case 'go_to_page':
        return `${t('profiles.page')} ${(config.page || 0) + 1}`
      case 'open_folder':
        return config.profile_id ? `${t('profiles.title')}: ${config.profile_id.substring(0, 8)}...` : t('devices.noProfile')
      default:
        return ''
    }
  }

  // Group actions by type
  const groupedActions = actions.reduce((acc, action) => {
    const type = action.action_type
    if (!acc[type]) acc[type] = []
    acc[type].push(action)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">{t('actions.title')}</h1>
          <p className="text-theme-muted mt-1">
            {t('actions.subtitle')}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('actions.newAction')}
        </button>
      </div>

      {actionsLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-theme-tertiary rounded-lg" />
            ))}
          </div>
        </div>
      ) : actions.length === 0 ? (
        <div className="card text-center py-12">
          <Terminal className="w-12 h-12 text-theme-muted mx-auto mb-3 opacity-50" />
          <p className="text-theme-muted">{t('actions.noActions')}</p>
          <p className="text-theme-muted text-sm mt-1 opacity-75">
            {t('actions.createFirst')}
          </p>
          <button
            onClick={handleCreate}
            className="btn btn-primary mt-4"
          >
            {t('actions.newAction')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActions).map(([type, typeActions]) => (
            <div key={type} className="card">
              <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wider mb-3">
                {actionTypeLabels[type] || type} ({typeActions.length})
              </h2>
              <div className="space-y-2">
                {typeActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-theme-tertiary hover:opacity-90 transition-colors group"
                  >
                    {getActionIcon(action.action_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-theme-primary font-medium">{action.name}</p>
                      <p className="text-theme-muted text-sm truncate">
                        {getConfigSummary(action)}
                      </p>
                    </div>

                    {testResult?.actionId === action.id && (
                      <div
                        className={`px-2 py-1 rounded text-xs ${
                          testResult.success
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {testResult.success ? t('common.success') : t('common.error')}
                      </div>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {['script', 'http', 'homeassistant'].includes(action.action_type) && (
                        <button
                          onClick={() => handleTest(action)}
                          disabled={testing === action.id}
                          className="p-2 rounded-lg hover:bg-theme-secondary transition-colors"
                          title={t('actions.testAction')}
                        >
                          <Play className={`w-4 h-4 ${testing === action.id ? 'text-primary-400 animate-pulse' : 'text-theme-muted'}`} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(action)}
                        className="p-2 rounded-lg hover:bg-theme-secondary transition-colors"
                        title={t('common.edit')}
                      >
                        <Pencil className="w-4 h-4 text-theme-muted" />
                      </button>
                      <button
                        onClick={() => handleDelete(action)}
                        className="p-2 rounded-lg hover:bg-theme-secondary transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showActionBuilder && (
        <ActionBuilder
          action={editingAction}
          onSave={handleSave}
          onClose={() => {
            setShowActionBuilder(false)
            setEditingAction(null)
          }}
        />
      )}
    </div>
  )
}
