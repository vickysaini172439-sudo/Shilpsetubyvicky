import { useState } from 'react'
import ProductPicker from '../components/ProductPicker.jsx'
import VoiceInput from '../components/VoiceInput.jsx'
import { generateCatalogue, updateProduct } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

export default function Catalogue() {
  const { token, user } = useAuth()
  const language = user?.preferred_language || 'Hindi'

  const [product, setProduct] = useState(null)
  const [rawText, setRawText] = useState('')

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Speech arrives phrase by phrase, so we add to what is already there
  // instead of overwriting it.
  function appendSpoken(text) {
    setRawText((current) => (current ? `${current} ${text}` : text))
  }

  async function handleGenerate() {
    if (!rawText.trim()) {
      setError('Please speak or type something about your product first.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await generateCatalogue(
        {
          raw_text: rawText,
          product_name: product?.name,
          category: product?.category,
          material: product?.material,
          craft_type: product?.craft_type,
          language,
        },
        token
      )
      setResult(data)
      setSaved(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function updateField(field, value) {
    setResult({ ...result, [field]: value })
  }

  async function handleSave() {
    if (!result || !product) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('name', result.title_english || product.name)
      formData.append('name_hindi', result.title_hindi || product.name_hindi || '')
      formData.append('description_english', result.description_english || '')
      formData.append('description_hindi', result.description_hindi || '')
      formData.append('material', result.material || product.material || '')
      formData.append('category', result.category || product.category || '')
      formData.append('craft_type', product.craft_type || '')
      formData.append('price', product.price ?? '')
      formData.append('status', product.status)

      const updated = await updateProduct(product.id, formData, token)
      setProduct(updated)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base'
  const labelClass = 'block text-sm font-medium text-charcoal mb-1 mt-4'

  return (
    <div>
      <ProductPicker selectedId={product?.id} onSelect={(p) => { setProduct(p); setResult(null) }} />

      {product && (
        <div className="p-5">
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <p className="text-sm font-medium text-charcoal mb-2">
              🎙️ Speak about your product — no typing needed
            </p>
            <VoiceInput
              language={language}
              label="Speak About Your Product"
              onTranscript={appendSpoken}
              className="mb-3"
            />

            <label className={labelClass}>⌨️ Type About Your Product</label>
            <textarea
              className={inputClass}
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Or type here in Hindi, Hinglish or English..."
            />

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-terracotta text-white font-semibold py-3 rounded-full mt-4 shadow-md disabled:opacity-60"
            >
              {loading ? 'Generating catalogue...' : '✨ Create Catalogue with AI'}
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-forest">Review &amp; Edit</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${result.ai_mode === 'real' ? 'bg-forest text-white' : 'bg-sand text-charcoal'}`}>
                  {result.ai_mode === 'real' ? `${result.ai_provider_label || 'AI'} Generated` : 'Demo Mode'}
                </span>
              </div>
              {result.ai_mode !== 'real' && (
                <p className="text-xs text-gray-500 mb-3">
                  No AI API key is configured yet, so this is a template-based draft, not a real
                  AI translation — please review the text carefully before publishing.
                </p>
              )}

              <label className={labelClass}>Title (English)</label>
              <input className={inputClass} value={result.title_english || ''} onChange={(e) => updateField('title_english', e.target.value)} />

              <label className={labelClass}>Title ({language})</label>
              <input className={inputClass} value={result.title_hindi || ''} onChange={(e) => updateField('title_hindi', e.target.value)} />

              <label className={labelClass}>Description (English)</label>
              <textarea className={inputClass} rows={3} value={result.description_english || ''} onChange={(e) => updateField('description_english', e.target.value)} />

              <label className={labelClass}>Description ({language})</label>
              <textarea className={inputClass} rows={3} value={result.description_hindi || ''} onChange={(e) => updateField('description_hindi', e.target.value)} />

              <label className={labelClass}>Key Features</label>
              <p className="text-sm text-gray-700 bg-ivory rounded-lg p-3">{(result.features || []).join(' • ')}</p>

              <label className={labelClass}>Marketing Caption</label>
              <input className={inputClass} value={result.marketing_caption || ''} onChange={(e) => updateField('marketing_caption', e.target.value)} />

              <label className={labelClass}>Social Media Caption</label>
              <input className={inputClass} value={result.social_caption || ''} onChange={(e) => updateField('social_caption', e.target.value)} />

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
        </div>
      )}
    </div>
  )
}
