import { useEffect, useState } from 'react'
import ProductPicker from '../components/ProductPicker.jsx'
import { enhanceImage, getImageCapabilities, updateProduct } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

export default function PhotoStudio() {
  const { token } = useAuth()

  const [product, setProduct] = useState(null)
  const [file, setFile] = useState(null)
  const [originalPreview, setOriginalPreview] = useState(null)

  const [brightness, setBrightness] = useState(1.15)
  const [contrast, setContrast] = useState(1.15)
  const [removeBg, setRemoveBg] = useState(false)
  const [bgAvailable, setBgAvailable] = useState(null)

  const [enhancedPreview, setEnhancedPreview] = useState(null)
  const [enhancedBlob, setEnhancedBlob] = useState(null)
  const [usedRealAi, setUsedRealAi] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getImageCapabilities(token)
      .then((c) => setBgAvailable(c.background_removal_available))
      .catch(() => setBgAvailable(false))
  }, [token])

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setOriginalPreview(URL.createObjectURL(f))
    setEnhancedPreview(null)
    setEnhancedBlob(null)
    setSaved(false)
  }

  async function handleEnhance() {
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const { blob, usedRealAi } = await enhanceImage(file, { removeBg, brightness, contrast }, token)
      setEnhancedBlob(blob)
      setEnhancedPreview(URL.createObjectURL(blob))
      setUsedRealAi(usedRealAi)
      setSaved(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!enhancedBlob || !product) return
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', product.name)
      formData.append('name_hindi', product.name_hindi || '')
      formData.append('description_english', product.description_english || '')
      formData.append('description_hindi', product.description_hindi || '')
      formData.append('material', product.material || '')
      formData.append('category', product.category || '')
      formData.append('craft_type', product.craft_type || '')
      formData.append('price', product.price ?? '')
      formData.append('status', product.status)
      formData.append('image', enhancedBlob, 'enhanced.jpg')

      const updated = await updateProduct(product.id, formData, token)
      setProduct(updated)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <ProductPicker selectedId={product?.id} onSelect={(p) => { setProduct(p); setEnhancedPreview(null); setSaved(false) }} />

      {product && (
        <div className="p-5">
          <label className="block text-sm font-medium text-charcoal mb-1">1. Choose a photo</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFileChange}
            className="text-sm mb-4 block"
          />

          {originalPreview && (
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <p className="text-sm font-medium text-charcoal mb-2">2. Adjust &amp; enhance</p>
              <img
                src={originalPreview}
                alt="Preview"
                className="w-full h-56 object-cover rounded-lg mb-3"
                style={{ filter: `brightness(${brightness}) contrast(${contrast})` }}
              />

              <label className="text-sm text-gray-600">Brightness</label>
              <input type="range" min="0.7" max="1.6" step="0.05" value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))} className="w-full mb-3" />

              <label className="text-sm text-gray-600">Contrast</label>
              <input type="range" min="0.7" max="1.6" step="0.05" value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))} className="w-full mb-3" />

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} />
                Remove background
              </label>
              {removeBg && bgAvailable === false && (
                <p className="text-xs text-sand font-medium mt-1">
                  Demo Mode: the background-removal engine isn't installed on this backend yet — the image will be enhanced but the background kept.
                </p>
              )}

              <button
                onClick={handleEnhance}
                disabled={loading}
                className="w-full bg-terracotta text-white font-semibold py-3 rounded-full mt-4 shadow-md disabled:opacity-60"
              >
                {loading ? 'Enhancing...' : '✨ Enhance with AI'}
              </button>
            </div>
          )}

          {enhancedPreview && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm font-medium text-charcoal mb-2">3. Before → After</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1 text-center">Before</p>
                  <img src={originalPreview} alt="Before" className="w-full h-40 object-cover rounded-lg" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 text-center">After</p>
                  <img src={enhancedPreview} alt="After" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                </div>
              </div>

              {removeBg && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {usedRealAi
                    ? '✅ Background removed using a local AI model'
                    : '⚠️ Demo Mode: background removal engine not installed — showing enhanced original.'}
                </p>
              )}

              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
              {saved && <p className="text-forest text-sm mt-3">Saved to product ✓</p>}

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-forest text-white font-semibold py-3 rounded-full mt-4 shadow-md disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save to Product'}
              </button>
            </div>
          )}

          {error && !enhancedPreview && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>
      )}
    </div>
  )
}
