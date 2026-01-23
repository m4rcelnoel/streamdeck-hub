import { Layers } from 'lucide-react'

export default function ProfileCard({ profile, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
        ${
          isSelected
            ? 'bg-primary-600/20 border border-primary-600'
            : 'bg-dark-700 hover:bg-dark-600 border border-transparent'
        }
      `}
    >
      <div className="p-2 rounded-lg bg-dark-600">
        <Layers className="w-5 h-5 text-primary-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{profile.name}</p>
        {profile.description && (
          <p className="text-dark-400 text-sm truncate">{profile.description}</p>
        )}
      </div>
      {profile.is_default && (
        <span className="px-2 py-0.5 text-xs bg-primary-600/20 text-primary-400 rounded">
          Default
        </span>
      )}
    </div>
  )
}
