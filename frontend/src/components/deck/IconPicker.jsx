import { useState, useEffect, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react'
import { iconsApi } from '../../services/api'

export default function IconPicker({ value, onChange, onClose }) {
  const [icons, setIcons] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadIcons()
  }, [])

  const loadIcons = async () => {
    setLoading(true)
    try {
      const response = await iconsApi.list()
      setIcons(response.data.icons || [])
    } catch (error) {
      console.error('Failed to load icons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const response = await iconsApi.upload(file)
      setIcons([...icons, response.data])
      onChange(response.data.path)
    } catch (error) {
      console.error('Failed to upload icon:', error)
      alert('Failed to upload icon')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (icon, e) => {
    e.stopPropagation()
    if (!confirm('Delete this icon?')) return

    try {
      const filename = icon.path.split('/').pop()
      await iconsApi.delete(filename)
      setIcons(icons.filter((i) => i.path !== icon.path))
      if (value === icon.path) {
        onChange('')
      }
    } catch (error) {
      console.error('Failed to delete icon:', error)
    }
  }

  const filteredIcons = icons.filter((icon) =>
    icon.name.toLowerCase().includes(filter.toLowerCase())
  )

  const assetIcons = filteredIcons.filter((i) => i.source === 'asset')
  const uploadedIcons = filteredIcons.filter((i) => i.source === 'upload')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
      <div className="bg-theme-secondary rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold text-theme-primary">Select Icon</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-theme-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-theme-muted" />
          </button>
        </div>

        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search icons..."
              className="input flex-1"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-theme-muted">Loading icons...</div>
          ) : (
            <div className="space-y-6">
              {/* No icon option */}
              <div>
                <button
                  onClick={() => {
                    onChange('')
                    onClose()
                  }}
                  className={`
                    w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all
                    ${!value ? 'border-primary-500 bg-primary-500/10' : 'bg-theme-tertiary hover:opacity-80'}
                  `}
                  style={{ borderColor: !value ? undefined : 'var(--color-border)' }}
                >
                  <X className="w-6 h-6 text-theme-muted" />
                </button>
                <p className="text-xs text-theme-muted mt-1">No icon</p>
              </div>

              {/* Uploaded Icons */}
              {uploadedIcons.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-theme-secondary mb-2">
                    Uploaded Icons
                  </h3>
                  <div className="grid grid-cols-6 gap-2">
                    {uploadedIcons.map((icon) => (
                      <div key={icon.path} className="relative group">
                        <button
                          onClick={() => {
                            onChange(icon.path)
                            onClose()
                          }}
                          className={`
                            w-16 h-16 rounded-lg border-2 p-1 transition-all
                            ${value === icon.path ? 'border-primary-500 bg-primary-500/10' : 'bg-theme-tertiary hover:opacity-80'}
                          `}
                          style={{ borderColor: value === icon.path ? undefined : 'var(--color-border)' }}
                        >
                          <img
                            src={icon.path}
                            alt={icon.name}
                            className="w-full h-full object-contain"
                          />
                        </button>
                        <button
                          onClick={(e) => handleDelete(icon, e)}
                          className="absolute -top-1 -right-1 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                        <p className="text-xs text-theme-muted truncate mt-1 text-center">
                          {icon.name.substring(9)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Asset Icons */}
              {assetIcons.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-theme-secondary mb-2">
                    Built-in Icons
                  </h3>
                  <div className="grid grid-cols-6 gap-2">
                    {assetIcons.map((icon) => (
                      <div key={icon.path}>
                        <button
                          onClick={() => {
                            onChange(icon.path)
                            onClose()
                          }}
                          className={`
                            w-16 h-16 rounded-lg border-2 p-1 transition-all
                            ${value === icon.path ? 'border-primary-500 bg-primary-500/10' : 'bg-theme-tertiary hover:opacity-80'}
                          `}
                          style={{ borderColor: value === icon.path ? undefined : 'var(--color-border)' }}
                        >
                          <img
                            src={icon.path}
                            alt={icon.name}
                            className="w-full h-full object-contain"
                          />
                        </button>
                        <p className="text-xs text-theme-muted truncate mt-1 text-center">
                          {icon.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredIcons.length === 0 && !loading && (
                <div className="text-center py-8 text-theme-muted">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No icons found</p>
                  <p className="text-sm mt-1">Upload an icon to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
