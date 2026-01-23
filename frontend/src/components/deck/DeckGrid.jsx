import ButtonSlot from './ButtonSlot'
import { useStore } from '../../store'
import { useThemeStore } from '../../store/themeStore'

export default function DeckGrid({
  keyCount = 15,
  buttons = [],
  onButtonClick,
  readonly = false,
  profileId = null,
  deckBackground = null,
}) {
  const { buttonStates } = useStore()
  const { previewMode, previewStates, simulatePress, togglePreviewState } = useThemeStore()

  // Calculate grid dimensions based on key count
  const getGridDimensions = (count) => {
    if (count === 6) return { cols: 3, rows: 2 }
    if (count === 15) return { cols: 5, rows: 3 }
    if (count === 32) return { cols: 8, rows: 4 }
    // Default fallback
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    return { cols, rows }
  }

  const { cols, rows } = getGridDimensions(keyCount)
  const buttonMap = new Map(buttons.map((b) => [b.position, b]))

  const getButtonState = (position) => {
    if (!profileId) return null
    const key = `${profileId}:${position}`
    return buttonStates[key] || null
  }

  const getPreviewState = (position) => {
    if (!profileId) return null
    const key = `${profileId}:${position}`
    return previewStates[key] || null
  }

  const handlePreviewPress = (position) => {
    if (!profileId) return
    const button = buttonMap.get(position)

    // Simulate the press animation
    simulatePress(profileId, position)

    // If it's a toggle button, toggle its state
    if (button?.is_toggle) {
      togglePreviewState(profileId, position)
    }
  }

  return (
    <div
      className="inline-grid gap-2 p-4 rounded-xl transition-colors"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        backgroundColor: deckBackground || '#0f172a',
      }}
    >
      {Array.from({ length: keyCount }).map((_, index) => (
        <ButtonSlot
          key={index}
          position={index}
          button={buttonMap.get(index)}
          onClick={() => !readonly && onButtonClick?.(index)}
          readonly={readonly}
          buttonState={getButtonState(index)}
          previewMode={previewMode && readonly}
          previewState={getPreviewState(index)}
          onPreviewPress={handlePreviewPress}
          profileId={profileId}
        />
      ))}
    </div>
  )
}
