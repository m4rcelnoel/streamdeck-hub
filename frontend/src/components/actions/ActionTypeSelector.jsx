import { Terminal, Globe, Home, ChevronRight, ChevronLeft, Layers, FolderOpen, Undo2, Speaker, Music, Hash, Timer, Keyboard, Power, MessageCircle, Twitch } from 'lucide-react'

const actionTypes = [
  {
    type: 'script',
    label: 'Script',
    description: 'Run a shell command or script',
    icon: Terminal,
    color: 'text-green-400',
    bg: 'bg-green-900/20',
    category: 'actions',
  },
  {
    type: 'http',
    label: 'HTTP Request',
    description: 'Send an HTTP request to a URL',
    icon: Globe,
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
    category: 'actions',
  },
  {
    type: 'homeassistant',
    label: 'Home Assistant',
    description: 'Control a Home Assistant entity',
    icon: Home,
    color: 'text-amber-400',
    bg: 'bg-amber-900/20',
    category: 'actions',
  },
  {
    type: 'sonos',
    label: 'Sonos',
    description: 'Control Sonos speakers',
    icon: Speaker,
    color: 'text-orange-400',
    bg: 'bg-orange-900/20',
    category: 'media',
  },
  {
    type: 'spotify',
    label: 'Spotify',
    description: 'Control Spotify playback',
    icon: Music,
    color: 'text-green-400',
    bg: 'bg-green-900/20',
    category: 'media',
  },
  {
    type: 'counter',
    label: 'Counter',
    description: 'Increment/decrement counter',
    icon: Hash,
    color: 'text-pink-400',
    bg: 'bg-pink-900/20',
    category: 'interactive',
  },
  {
    type: 'timer',
    label: 'Timer',
    description: 'Stopwatch or countdown timer',
    icon: Timer,
    color: 'text-rose-400',
    bg: 'bg-rose-900/20',
    category: 'interactive',
  },
  {
    type: 'hotkey',
    label: 'Keyboard Shortcut',
    description: 'Send keyboard hotkeys',
    icon: Keyboard,
    color: 'text-sky-400',
    bg: 'bg-sky-900/20',
    category: 'system',
  },
  {
    type: 'wake_on_lan',
    label: 'Wake-on-LAN',
    description: 'Wake up a computer on the network',
    icon: Power,
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
    category: 'system',
  },
  {
    type: 'discord',
    label: 'Discord',
    description: 'Send Discord messages via webhook or bot',
    icon: MessageCircle,
    color: 'text-indigo-400',
    bg: 'bg-indigo-900/20',
    category: 'streaming',
  },
  {
    type: 'twitch',
    label: 'Twitch',
    description: 'Control Twitch stream (clips, markers, chat)',
    icon: Twitch,
    color: 'text-violet-400',
    bg: 'bg-violet-900/20',
    category: 'streaming',
  },
  {
    type: 'next_page',
    label: 'Next Page',
    description: 'Go to the next page',
    icon: ChevronRight,
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
    category: 'navigation',
  },
  {
    type: 'prev_page',
    label: 'Previous Page',
    description: 'Go to the previous page',
    icon: ChevronLeft,
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
    category: 'navigation',
  },
  {
    type: 'go_to_page',
    label: 'Go to Page',
    description: 'Jump to a specific page',
    icon: Layers,
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
    category: 'navigation',
  },
  {
    type: 'open_folder',
    label: 'Open Folder',
    description: 'Open another profile as a folder',
    icon: FolderOpen,
    color: 'text-cyan-400',
    bg: 'bg-cyan-900/20',
    category: 'navigation',
  },
  {
    type: 'go_back',
    label: 'Go Back',
    description: 'Return to previous folder',
    icon: Undo2,
    color: 'text-cyan-400',
    bg: 'bg-cyan-900/20',
    category: 'navigation',
  },
]

export default function ActionTypeSelector({ value, onChange }) {
  const actionItems = actionTypes.filter(a => a.category === 'actions')
  const mediaItems = actionTypes.filter(a => a.category === 'media')
  const interactiveItems = actionTypes.filter(a => a.category === 'interactive')
  const systemItems = actionTypes.filter(a => a.category === 'system')
  const streamingItems = actionTypes.filter(a => a.category === 'streaming')
  const navigationItems = actionTypes.filter(a => a.category === 'navigation')

  const renderItem = ({ type, label, description, icon: Icon, color, bg }) => (
    <button
      key={type}
      type="button"
      onClick={() => onChange(type)}
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-colors text-left
        ${
          value === type
            ? 'border-primary-500 bg-primary-500/10'
            : 'bg-theme-tertiary hover:opacity-80'
        }
      `}
      style={{ borderColor: value === type ? undefined : 'var(--color-border)' }}
    >
      <div className={`p-2 rounded-lg ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-theme-primary font-medium">{label}</p>
        <p className="text-theme-muted text-sm">{description}</p>
      </div>
    </button>
  )

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-medium text-theme-muted uppercase mb-2">Actions</h4>
        <div className="grid grid-cols-1 gap-2">
          {actionItems.map(renderItem)}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-medium text-theme-muted uppercase mb-2">Media Control</h4>
        <div className="grid grid-cols-1 gap-2">
          {mediaItems.map(renderItem)}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-medium text-theme-muted uppercase mb-2">Interactive</h4>
        <div className="grid grid-cols-1 gap-2">
          {interactiveItems.map(renderItem)}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-medium text-theme-muted uppercase mb-2">System</h4>
        <div className="grid grid-cols-1 gap-2">
          {systemItems.map(renderItem)}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-medium text-theme-muted uppercase mb-2">Streaming</h4>
        <div className="grid grid-cols-1 gap-2">
          {streamingItems.map(renderItem)}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-medium text-theme-muted uppercase mb-2">Navigation (Optional)</h4>
        <div className="grid grid-cols-1 gap-2">
          {navigationItems.map(renderItem)}
        </div>
      </div>
    </div>
  )
}
