import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'

export function useWebSocket() {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const {
    setWsConnected,
    handleDeviceConnected,
    handleDeviceDisconnected,
    handleStateChanged,
    setButtonLoading,
  } = useStore()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      console.log('WebSocket connected')
      setWsConnected(true)
    }

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected')
      setWsConnected(false)

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 3000)
    }

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
  }, [setWsConnected])

  const handleMessage = useCallback((message) => {
    const { event, data } = message

    switch (event) {
      case 'device_connected':
        handleDeviceConnected(data)
        break
      case 'device_disconnected':
        handleDeviceDisconnected(data.device_id)
        break
      case 'button_pressed':
        // Set loading state when button is pressed
        if (data.profile_id && data.position !== undefined) {
          setButtonLoading(data.profile_id, data.position, true)
        }
        break
      case 'button_released':
        console.log('Button released:', data)
        break
      case 'state_changed':
        handleStateChanged(data)
        break
      case 'action_complete':
        // Clear loading state when action completes
        if (data.profile_id && data.position !== undefined) {
          setButtonLoading(data.profile_id, data.position, false)
        }
        break
      default:
        console.log('Unknown WebSocket event:', event)
    }
  }, [handleDeviceConnected, handleDeviceDisconnected, handleStateChanged, setButtonLoading])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { sendMessage }
}
