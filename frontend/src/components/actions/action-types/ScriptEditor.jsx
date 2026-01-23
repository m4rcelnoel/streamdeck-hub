import { useState, useRef, useEffect } from 'react'
import { X, Maximize2, Minimize2, Copy, Check } from 'lucide-react'

export default function ScriptEditor({ value, onChange, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef(null)
  const lineNumbersRef = useRef(null)

  const lines = (value || '').split('\n')
  const lineCount = lines.length

  useEffect(() => {
    // Focus textarea on mount
    if (textareaRef.current) {
      textareaRef.current.focus()
      // Move cursor to end
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = value?.length || 0
    }
  }, [])

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleKeyDown = (e) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd

      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)

      // Move cursor after the inserted spaces
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2
      }, 0)
    }

    // Escape to close
    if (e.key === 'Escape') {
      onClose()
    }

    // Ctrl/Cmd + S to save and close
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      onClose()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]">
      <div
        className={`bg-[#1e1e1e] rounded-xl flex flex-col transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full m-0 rounded-none'
            : 'w-full max-w-4xl mx-4 h-[80vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-gray-200">Script Editor</h3>
            <span className="text-xs text-gray-500">
              {lineCount} line{lineCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-2 rounded hover:bg-[#333] text-gray-400 hover:text-gray-200 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded hover:bg-[#333] text-gray-400 hover:text-gray-200 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-[#333] text-gray-400 hover:text-gray-200 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* Line numbers */}
          <div
            ref={lineNumbersRef}
            className="w-12 flex-shrink-0 bg-[#1e1e1e] border-r border-[#333] overflow-hidden select-none"
          >
            <div className="py-3 text-right pr-3">
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i}
                  className="text-xs leading-6 text-gray-600 font-mono"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-[#1e1e1e] text-gray-200 font-mono text-sm leading-6 p-3 resize-none outline-none"
            style={{
              tabSize: 2,
            }}
            placeholder="#!/bin/bash&#10;&#10;# Your script here..."
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#333]">
          <div className="text-xs text-gray-500">
            <span className="mr-4">Tab to indent</span>
            <span className="mr-4">Ctrl+S to save</span>
            <span>Esc to close</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-secondary text-sm">
              Cancel
            </button>
            <button onClick={onClose} className="btn btn-primary text-sm">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
