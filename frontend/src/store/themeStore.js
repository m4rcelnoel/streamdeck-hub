import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Button templates for quick styling
export const buttonTemplates = [
  {
    id: 'default',
    name: 'Default',
    preview: { background: '#1e293b', text: '#ffffff', border: '#334155' },
    config: {
      background_color: '#1e293b',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'primary',
    name: 'Primary',
    preview: { background: '#0284c7', text: '#ffffff', border: '#0369a1' },
    config: {
      background_color: '#0284c7',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'success',
    name: 'Success',
    preview: { background: '#16a34a', text: '#ffffff', border: '#15803d' },
    config: {
      background_color: '#16a34a',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'warning',
    name: 'Warning',
    preview: { background: '#d97706', text: '#ffffff', border: '#b45309' },
    config: {
      background_color: '#d97706',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'danger',
    name: 'Danger',
    preview: { background: '#dc2626', text: '#ffffff', border: '#b91c1c' },
    config: {
      background_color: '#dc2626',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'purple',
    name: 'Purple',
    preview: { background: '#7c3aed', text: '#ffffff', border: '#6d28d9' },
    config: {
      background_color: '#7c3aed',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'pink',
    name: 'Pink',
    preview: { background: '#db2777', text: '#ffffff', border: '#be185d' },
    config: {
      background_color: '#db2777',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    preview: { background: '#0f172a', text: '#94a3b8', border: '#1e293b' },
    config: {
      background_color: '#0f172a',
      icon_color: '#94a3b8',
    },
  },
  {
    id: 'light',
    name: 'Light',
    preview: { background: '#f1f5f9', text: '#1e293b', border: '#cbd5e1' },
    config: {
      background_color: '#f1f5f9',
      icon_color: '#1e293b',
    },
  },
  {
    id: 'gradient-blue',
    name: 'Ocean',
    preview: { background: 'linear-gradient(135deg, #0284c7, #7c3aed)', text: '#ffffff', border: '#0369a1' },
    config: {
      background_color: '#0284c7',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'gradient-fire',
    name: 'Fire',
    preview: { background: 'linear-gradient(135deg, #dc2626, #d97706)', text: '#ffffff', border: '#b91c1c' },
    config: {
      background_color: '#dc2626',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'gradient-nature',
    name: 'Nature',
    preview: { background: 'linear-gradient(135deg, #16a34a, #0d9488)', text: '#ffffff', border: '#15803d' },
    config: {
      background_color: '#16a34a',
      icon_color: '#ffffff',
    },
  },
]

// Profile theme presets
export const profileThemes = [
  {
    id: 'default',
    name: 'Default',
    deckBackground: '#0f172a',
    buttonDefaults: {
      background_color: '#1e293b',
      icon_color: '#ffffff',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    deckBackground: '#020617',
    buttonDefaults: {
      background_color: '#0f172a',
      icon_color: '#38bdf8',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    deckBackground: '#0c4a6e',
    buttonDefaults: {
      background_color: '#075985',
      icon_color: '#7dd3fc',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    deckBackground: '#14532d',
    buttonDefaults: {
      background_color: '#166534',
      icon_color: '#86efac',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    deckBackground: '#7c2d12',
    buttonDefaults: {
      background_color: '#9a3412',
      icon_color: '#fed7aa',
    },
  },
  {
    id: 'royal',
    name: 'Royal',
    deckBackground: '#4c1d95',
    buttonDefaults: {
      background_color: '#5b21b6',
      icon_color: '#c4b5fd',
    },
  },
  {
    id: 'light',
    name: 'Light',
    deckBackground: '#e2e8f0',
    buttonDefaults: {
      background_color: '#f8fafc',
      icon_color: '#1e293b',
    },
  },
]

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // App theme
      theme: 'dark', // 'dark' | 'light'

      // Preview mode
      previewMode: false,
      previewStates: {}, // { "profileId:position": { pressed: boolean, state: 'on'|'off' } }

      // Actions
      setTheme: (theme) => {
        set({ theme })
        // Apply theme to document
        if (theme === 'light') {
          document.documentElement.classList.add('light')
          document.documentElement.classList.remove('dark')
        } else {
          document.documentElement.classList.add('dark')
          document.documentElement.classList.remove('light')
        }
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(newTheme)
      },

      // Preview mode actions
      setPreviewMode: (enabled) => set({ previewMode: enabled }),

      togglePreviewMode: () => set((state) => ({ previewMode: !state.previewMode })),

      simulatePress: (profileId, position) => {
        const key = `${profileId}:${position}`
        set((state) => ({
          previewStates: {
            ...state.previewStates,
            [key]: { ...state.previewStates[key], pressed: true },
          },
        }))

        // Auto-release after 200ms
        setTimeout(() => {
          set((state) => ({
            previewStates: {
              ...state.previewStates,
              [key]: { ...state.previewStates[key], pressed: false },
            },
          }))
        }, 200)
      },

      togglePreviewState: (profileId, position) => {
        const key = `${profileId}:${position}`
        const currentState = get().previewStates[key]?.state || 'off'
        set((state) => ({
          previewStates: {
            ...state.previewStates,
            [key]: {
              ...state.previewStates[key],
              state: currentState === 'on' ? 'off' : 'on',
            },
          },
        }))
      },

      getPreviewState: (profileId, position) => {
        const key = `${profileId}:${position}`
        return get().previewStates[key] || { pressed: false, state: 'off' }
      },

      clearPreviewStates: () => set({ previewStates: {} }),
    }),
    {
      name: 'streamdeck-theme',
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
)

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('streamdeck-theme')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.theme === 'light') {
        document.documentElement.classList.add('light')
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}
