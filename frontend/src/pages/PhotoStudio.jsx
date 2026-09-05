import { useEffect, useState } from 'react'
import ProductPicker from '../components/ProductPicker.jsx'
import { enhanceImage, getImageCapabilities, updateProduct } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

// Friendly names for whatever engine actually ran, so the artisan always
// knows what happened to their photo.
const ENGINE_LABELS = {
  openai: { text: 'Enhanced by OpenAI', style: 'bg-forest text-white' },
  gemini: { text: 'Enhanced by Gemini AI', style: 'bg-forest text-white' },
  'local-ai': { text: 'Background removed on this computer', style: 'bg-forest text-white' },
  basic: { text: 'Basic enhancement only', style: 'bg-sand text-charcoal' },
}

export default function PhotoStudio() {
  const { token } = useAuth()

  const [product, setProduct] = useState(null)
  const [file, setFile] = useState(null)
  const [originalPreview, setOriginalPreview] = useState(null)

  const [engine, setEngine] = useState('auto')
  const [instruction, setInstruction] = useState('')
  const [brightness, setBrightness] = useState(1.15)
  const [contrast, setContrast] = useState(1.15)
  const [removeBg, setRemoveBg] = useState(true)

  const [caps, setCaps] = useState(null)

  const [enhancedPreview, setEnhancedPreview] = useState(null)
  const [enhancedBlob, setEnhancedBlob] = useState(null)
  const [engineUsed, setEngineUsed] = useState('')
  const [note, setNote] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getImageCapabilities(token)
      .then((c) => {
        setCaps(c)
        setEngine(c.default_engine === 'openai' || c.default_engine === 'gemini' ? c.default_engine : 'local')
      })
      .catch(() => setCaps({ openai_available: false, gemini_available: false, background_removal_available: false }))
  }, [token])

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setOriginalPreview(URL.createObjectURL(f))
    setEnhancedPreview(null)
    setEnhancedBlob(null)
    setSaved(false)
    setNote('')
  }

  async function handleEnhance() {
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const result = await enhanceImage(
        file,
        { engine, removeBg, brightness, contrast, instruction },
        token
      )
      setEnhancedBlob(result.blob)
      setEnhancedPreview(URL.createObjectURL(result.blob))
      setEngineUsed(result.engineUsed)
      setNote(result.note)
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
      formData.append('image', enhancedBlob, 'enhanced.png')

      const updated = await updateProduct(product.id, formData, token)
      setProduct(updated)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openaiReady = caps?.openai_available
  const geminiReady = caps?.gemini_available
  const aiReady = openaiReady || geminiReady
  const aiEngine = openaiReady ? 'openai' : 'gemini'
  const badge = ENGINE_LABELS[engineUsed]

  return (
    <div>
      <ProductPicker
        selectedId={product?.id}
        onSelect={(p) => { setProduct(p); setEnhancedPreview(null); setSaved(false); setNote('') }}
      />

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
              <p className="text-sm font-medium text-charcoal mb-2">2. Choose how to enhance</p>

              {/* ---- Engine choice ---- */}
              <button
                type="button"
                onClick={() => aiReady && setEngine(aiEngine)}
                disabled={!aiReady}
                className={`w-full text-left p-3 rounded-lg border mb-2 ${
                  engine === 'openai' || engine === 'gemini'
                    ? 'border-forest bg-ivory'
                    : 'border-gray-300 bg-white'
                } ${!aiReady ? 'opacity-60' : ''}`}
              >
                <span className="font-semibold text-forest">✨ AI Photo Studio</span>
                <span className="block text-xs text-gray-600 mt-1">
                  Real AI re-shoots your photo: clean studio background, correct lighting,
                  sharper craft detail — while keeping the product exactly as it is.
                </span>
                {aiReady && (
                  <span className="block text-xs text-gray-400 mt-1">
                    Powered by {openaiReady ? 'OpenAI' : 'Gemini'}
                  </span>
                )}
                {!aiReady && (
                  <span className="block text-xs text-terracotta font-medium mt-1">
                    Needs an OpenAI or Google AI key in backend/.env — see SETUP_GUIDE.md
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setEngine('local')}
                className={`w-full text-left p-3 rounded-lg border ${
                  engine === 'local' ? 'border-forest bg-ivory' : 'border-gray-300 bg-white'
                }`}
              >
                <span className="font-semibold text-forest">🛠️ Basic enhance (works offline)</span>
                <span className="block text-xs text-gray-600 mt-1">
                  Background removal and brightness/contrast on this computer. No internet needed.
                </span>
              </button>

              {/* ---- Engine-specific controls ---- */}
              {(engine === 'openai' || engine === 'gemini') && (
                <div className="mt-3">
                  <label className="text-sm text-gray-600">
                    Anything extra to tell the AI? (optional)
                  </label>
                  <input
                    className="w-full p-2 rounded-lg border border-gray-300 text-sm mt-1"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="e.g. show it on a plain white background"
                  />
                </div>
              )}

              {engine === 'local' && (
                <div className="mt-3">
                  <img
                    src={originalPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg mb-3"
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
                  {removeBg && caps?.background_removal_available === false && (
                    <p className="text-xs text-terracotta font-medium mt-1">
                      The background-removal engine isn't loading on this backend, so the photo
                      will be brightened but the background kept.
                      {caps?.unavailable_reason ? ` (${caps.unavailable_reason})` : ''}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleEnhance}
                disabled={loading}
                className="w-full bg-terracotta text-white font-semibold py-3 rounded-full mt-4 shadow-md disabled:opacity-60"
              >
                {loading
                  ? ((engine === 'openai' || engine === 'gemini') ? 'AI is re-shooting your photo…' : 'Enhancing…')
                  : '✨ Enhance Photo'}
              </button>
              {loading && (engine === 'openai' || engine === 'gemini') && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  This can take up to a minute. Please keep this screen open.
                </p>
              )}
            </div>
          )}

          {enhancedPreview && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-charcoal">3. Before → After</p>
                {badge && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.style}`}>
                    {badge.text}
                  </span>
                )}
              </div>

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

              {note && <p className="text-xs text-gray-500 mt-2">{note}</p>}
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
