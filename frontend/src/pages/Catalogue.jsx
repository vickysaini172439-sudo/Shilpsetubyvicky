import { useRef, useState } from 'react'
import ProductPicker from '../components/ProductPicker.jsx'
import { generateCatalogue, updateProduct } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

const SUPPORTS_SPEECH =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export default function Catalogue() {
  const { token } = useAuth()
  const [product, setProduct] = useState(null)
  const [rawText, setRawText] = useState('')
  const [listening, setListening] = useState(false)
  const [speechLang, setSpeechLang] = useState('hi-IN')
  const recognitionRef = useRef(null)

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = speechLang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setRawText(transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
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
            <div className="flex gap-2 mb-3">
              <select
                className="p-2 rounded-lg border border-gray-300 text-sm"
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
              >
                <option value="hi-IN">Hindi</option>
                <option value="en-IN">English</option>
              </select>

              {SUPPORTS_SPEECH ? (
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`flex-1 rounded-full font-semibold py-2 ${listening ? 'bg-red-500 text-white' : 'bg-forest text-white'}`}
                >
                  {listening ? '⏹ Stop Recording' : '🎙️ Speak About Your Product'}
                </button>
              ) : (
                <p className="text-xs text-gray-500 flex-1 self-center">
                  Voice input isn't supported in this browser — please type instead.
                </p>
              )}
            </div>

            <label className={labelClass}>⌨️ Type About Your Product</label>
            <textarea
              className={inputClass}
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Describe your product in your own words (Hindi or English)..."
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
                  {result.ai_mode === 'real' ? 'AI Generated' : 'Demo Mode'}
                </span>
              </div>
              {result.ai_mode !== 'real' && (
                <p className="text-xs text-gray-500 mb-3">
                  No AI API key is configured yet, so this is a template-based draft, not a real
                  AI translation — please review the Hindi/English text carefully before publishing.
                </p>
              )}

              <label className={labelClass}>Title (English)</label>
              <input className={inputClass} value={result.title_english || ''} onChange={(e) => updateField('title_english', e.target.value)} />

              <label className={labelClass}>Title (Hindi)</label>
              <input className={inputClass} value={result.title_hindi || ''} onChange={(e) => updateField('title_hindi', e.target.value)} />

              <label className={labelClass}>Description (English)</label>
              <textarea className={inputClass} rows={3} value={result.description_english || ''} onChange={(e) => updateField('description_english', e.target.value)} />

              <label className={labelClass}>Description (Hindi)</label>
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
