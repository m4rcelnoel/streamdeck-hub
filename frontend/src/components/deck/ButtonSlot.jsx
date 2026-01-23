import { Plus, Loader2 } from 'lucide-react'
import { useDataDisplay } from '../../hooks/useDataDisplay'

export default function ButtonSlot({
  position,
  button,
  onClick,
  readonly,
  buttonState,
  previewMode = false,
  previewState = null,
  onPreviewPress = null,
  profileId = null,
}) {
  // Check if button has basic content first
  const hasLabel = !!button?.label
  const hasIcon = !!button?.icon_path
  const hasDataSource = !!button?.data_source
  const hasContent = button && (hasLabel || hasIcon || hasDataSource)
  const isToggle = button?.is_toggle

  // Create a unique key for data display - only if we have a data source
  const buttonKey = (profileId && hasDataSource) ? `${profileId}:${position}` : null

  // Use the data display hook - only active when buttonKey is set
  const dataConfig = hasDataSource ? {
    data_source: button.data_source,
    data_format: button.data_format,
    refresh_interval: button.refresh_interval,
    data_config: button.data_config,
  } : null

  const dataResult = useDataDisplay(buttonKey, dataConfig)

  // Get the display text - prefer live data over static label
  const isDataLoading = hasDataSource && !dataResult?.value && !dataResult?.error
  const displayText = dataResult?.value || (isDataLoading ? '...' : '') || button?.label || ''
  const hasDataDisplay = hasDataSource && !!dataResult?.value

  // Use preview state if in preview mode, otherwise use real state
  const state = previewMode && previewState
    ? previewState.state
    : (buttonState?.state || 'unknown')
  const isLoading = buttonState?.loading || false
  const isOn = state === 'on'
  const isPressed = previewMode && previewState?.pressed

  // Determine background color based on state for toggle buttons
  const getBackgroundColor = () => {
    if (!hasContent) return undefined
    if (isToggle && state !== 'unknown') {
      return isOn
        ? (button.on_color || '#22c55e')  // Green when on
        : (button.off_color || '#374151') // Gray when off
    }
    return button?.background_color || undefined
  }

  // Determine border style based on state
  const getBorderClass = () => {
    if (isLoading) return 'border-primary-500 animate-pulse'
    if (isToggle && state !== 'unknown') {
      return isOn ? 'border-green-500' : 'border-dark-600'
    }
    return hasContent ? 'border-dark-600' : 'border-dashed border-dark-600'
  }

  // Get animation classes based on button config and state
  const getAnimationClass = () => {
    if (!button?.animation || button.animation === 'none') return ''

    const trigger = button.animation_trigger || 'always'
    const speed = button.animation_speed || 'normal'

    // Check if animation should be active based on trigger
    let shouldAnimate = false
    switch (trigger) {
      case 'always':
        shouldAnimate = true
        break
      case 'on_press':
        shouldAnimate = isPressed
        break
      case 'on_state_on':
        shouldAnimate = isToggle && isOn
        break
      case 'on_state_off':
        shouldAnimate = isToggle && !isOn && state !== 'unknown'
        break
      default:
        shouldAnimate = true
    }

    if (!shouldAnimate) return ''

    const animClass = `anim-${button.animation.replace('_', '-')}`
    const speedClass = `anim-${speed}`

    return `${animClass} ${speedClass}`
  }

  const handleClick = () => {
    if (previewMode && hasContent) {
      // In preview mode, simulate a button press
      onPreviewPress?.(position)
    } else if (!readonly) {
      onClick?.()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={readonly && !previewMode}
      className={`
        w-16 h-16 rounded-lg border-2 transition-all duration-200
        flex items-center justify-center relative
        ${readonly && !previewMode ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
        ${getBorderClass()}
        ${hasContent ? 'bg-dark-700' : 'bg-dark-800'}
        ${isPressed ? 'button-pressed' : ''}
        ${previewMode && hasContent ? 'ring-2 ring-primary-500/30' : ''}
        ${getAnimationClass()}
      `}
      style={{
        backgroundColor: getBackgroundColor(),
        '--glow-color': button?.background_color ? `${button.background_color}80` : undefined,
      }}
    >
      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg z-10">
          <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
        </div>
      )}

      {hasContent ? (
        <div className="flex flex-col items-center justify-center p-1 w-full h-full overflow-hidden">
          {button.icon_path && !hasDataDisplay && (
            <img
              src={button.icon_path}
              alt=""
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          )}
          {/* Show icon smaller when we have data display */}
          {button.icon_path && hasDataDisplay && (
            <img
              src={button.icon_path}
              alt=""
              className="w-4 h-4 object-contain mb-0.5"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          )}
          {/* Display text - handles multi-line content */}
          {displayText && (
            <div
              className={`text-center w-full ${hasDataDisplay ? 'text-[10px] leading-tight' : 'text-xs'}`}
              style={{ color: button?.icon_color || 'white' }}
            >
              {displayText.split('\n').map((line, i) => (
                <div key={i} className="truncate">{line}</div>
              ))}
            </div>
          )}
          {/* ON/OFF state indicator for toggles */}
          {isToggle && state !== 'unknown' && (
            <span
              className={`text-[10px] font-bold mt-0.5 px-1 rounded ${
                isOn
                  ? 'bg-green-500/30 text-green-300'
                  : 'bg-dark-600/50 text-dark-400'
              }`}
            >
              {isOn ? 'ON' : 'OFF'}
            </span>
          )}
          {/* Data error indicator */}
          {dataResult?.error && (
            <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" title={dataResult.error} />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center text-dark-500">
          {!readonly && <Plus className="w-4 h-4" />}
          <span className="text-xs mt-1">{position}</span>
        </div>
      )}

      {/* State dot indicator in corner */}
      {hasContent && isToggle && state !== 'unknown' && (
        <div
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
            isOn ? 'bg-green-400' : 'bg-dark-500'
          }`}
        />
      )}
    </button>
  )
}
