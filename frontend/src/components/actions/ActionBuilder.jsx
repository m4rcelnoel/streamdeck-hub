import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../../store'
import ActionTypeSelector from './ActionTypeSelector'
import ScriptAction from './action-types/ScriptAction'
import HttpAction from './action-types/HttpAction'
import HomeAssistantAction from './action-types/HomeAssistantAction'
import SonosAction from './action-types/SonosAction'
import SpotifyAction from './action-types/SpotifyAction'
import CounterAction from './action-types/CounterAction'
import TimerAction from './action-types/TimerAction'
import HotkeyAction from './action-types/HotkeyAction'
import WakeOnLanAction from './action-types/WakeOnLanAction'
import DiscordAction from './action-types/DiscordAction'
import TwitchAction from './action-types/TwitchAction'
import { GoToPageAction, OpenFolderAction, EmptyNavAction } from './action-types/NavigationAction'

export default function ActionBuilder({ action, onSave, onClose }) {
  const { createAction, updateAction } = useStore()
  const [name, setName] = useState(action?.name || '')
  const [actionType, setActionType] = useState(action?.action_type || '')
  const [config, setConfig] = useState(action?.config || {})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data = { name, action_type: actionType, config }
      let result
      if (action) {
        result = await updateAction(action.id, data)
      } else {
        result = await createAction(data)
      }
      onSave(result)
    } catch (error) {
      console.error('Failed to save action:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderConfigEditor = () => {
    switch (actionType) {
      case 'script':
        return <ScriptAction config={config} onChange={setConfig} />
      case 'http':
        return <HttpAction config={config} onChange={setConfig} />
      case 'homeassistant':
        return <HomeAssistantAction config={config} onChange={setConfig} />
      case 'sonos':
        return <SonosAction config={config} onChange={setConfig} />
      case 'spotify':
        return <SpotifyAction config={config} onChange={setConfig} />
      case 'counter':
        return <CounterAction config={config} onChange={setConfig} />
      case 'timer':
        return <TimerAction config={config} onChange={setConfig} />
      case 'hotkey':
        return <HotkeyAction config={config} onChange={setConfig} />
      case 'wake_on_lan':
        return <WakeOnLanAction config={config} onChange={setConfig} />
      case 'discord':
        return <DiscordAction config={config} onChange={setConfig} />
      case 'twitch':
        return <TwitchAction config={config} onChange={setConfig} />
      case 'go_to_page':
        return <GoToPageAction config={config} onChange={setConfig} />
      case 'open_folder':
        return <OpenFolderAction config={config} onChange={setConfig} />
      case 'next_page':
      case 'prev_page':
      case 'go_back':
        return <EmptyNavAction />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-theme-secondary rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold text-theme-primary">
            {action ? 'Edit Action' : 'New Action'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-theme-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-theme-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="label">Action Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Action"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Action Type</label>
            <ActionTypeSelector
              value={actionType}
              onChange={(type) => {
                setActionType(type)
                setConfig({})
              }}
            />
          </div>

          {actionType && (
            <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              {renderConfigEditor()}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || !actionType || saving}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Saving...' : action ? 'Save Changes' : 'Create Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
