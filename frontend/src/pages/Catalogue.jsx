import { useEffect, useState } from 'react'
import ProductPicker from '../components/ProductPicker.jsx'
import VoiceInput from '../components/VoiceInput.jsx'
import DraftBanner from '../components/DraftBanner.jsx'
import { generateCatalogue, updateProduct } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'
import { saveDraft, loadDraft, clearDraft } from '../services/drafts.js'

export default function Catalogue() {
  const { token, user } = useAuth()
  const language = user?.preferred_language || 'Hindi'

  const [product, setProduct] = useState(null)
  const [rawText, setRawText] = useState('')

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Work left unfinished last time, waiting for the artisan to say whether
  // to pick it up. This screen is the one that hurt most: an artisan spoke
  // about their product, waited for the AI to write the whole catalogue,
  // then tapped Home for a second - and every word of it was gone, with no
  // warning and no way back. Everything here is plain text, so it is kept
  // in localStorage too and survives a full refresh, not just navigation.
  const [pendingDraft, setPendingDraft] = useState(null)

  const draftKey = product ? `catalogue:${product.id}` : null

  // Speech arrives phrase by phrase, so we add to what is already there
  // instead of overwriting it.
  function appendSpoken(text) {
    setRawText((current) => (current ? `${current} ${text}` : text))
  }

  function handleSelectProduct(p) {
    setProduct(p)
    setResult(null)
    setRawText('')
    setSaved(false)
    setError('')

    // Keyed per product, so switching items cannot resurrect the wrong
    // draft onto the wrong piece.
    const found = p ? loadDraft(`catalogue:${p.id}`) : null
    const d = found?.data
    setPendingDraft(d && (d.result || (d.rawText || '').trim()) ? found : null)
  }

  // Skipped while a draft is waiting to be answered - the fields have just
  // been reset to show a clean screen, and saving them now would overwrite
  // the very draft being offered.
  useEffect(() => {
    if (!draftKey || pendingDraft) return
    if (!result && !rawText.trim()) return
    saveDraft(draftKey, { rawText, result })
  }, [draftKey, pendingDraft, rawText, result])

  function continueDraft() {
    const d = pendingDraft?.data || {}
    setRawText(d.rawText || '')
    setResult(d.result || null)
    setPendingDraft(null)
  }

  function discardDraft() {
    clearDraft(draftKey)
    setPendingDraft(null)
    setRawText('')
    setResult(null)
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

      // The AI writes features and a marketing caption on every run, and
      // until now both were shown on this screen and then thrown away on
      // save. They are the two things that make the public store page look
      // like a real shop instead of a grid of thumbnails, so they are now
      // stored on the product.
      //
      // Features go one per line - that is the format the backend and the
      // storefront both expect (see models/product.py).
      formData.append(
        'features',
        Array.isArray(result.features) ? result.features.filter(Boolean).join('\n') : (result.features || ''),
      )
      formData.append('caption', result.marketing_caption || '')

      formData.append('status', product.status)

      const updated = await updateProduct(product.id, formData, token)
      setProduct(updated)
      setSaved(true)
      // It is on the product now; nothing is left unfinished.
      clearDraft(draftKey)
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
      <ProductPicker selectedId={product?.id} onSelect={handleSelectProduct} />

      {pendingDraft && (
        <DraftBanner
          savedAt={pendingDraft.savedAt}
          what={
            pendingDraft.data?.result
              ? 'A catalogue the AI wrote that you had not saved yet'
              : 'What you told the AI about this product'
          }
          onContinue={continueDraft}
          onDiscard={discardDraft}
        />
      )}

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
            {loading && (
              <p className="text-xs text-gray-500 text-center mt-2">
                You can leave this screen if you need to — your work is kept.
              </p>
            )}
          </div>

          {result && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-forest">Review &amp; Edit</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${result.ai_mode === 'real' ? 'bg-forest text-white' : 'bg-sand text-charcoal'}`}>
                  {result.ai_mode === 'real' ? `${result.ai_provider_label || 'AI'} Generated` : 'Demo Mode'}
                </span>
              </div>
              {/* Be honest about WHY this is a template draft. This used to
                  always say "no API key is configured", which was wrong
                  whenever a key was configured and the call had failed -
                  and that wrong message sent debugging in the wrong
                  direction for hours. */}
              {result.ai_mode !== 'real' && (
                <div className="mb-3">
                  {result.ai_error ? (
                    <>
                      <p className="text-xs text-terracotta font-medium">
                        The AI is set up, but the call failed — so this is a template draft.
                      </p>
                      <p className="text-xs text-gray-500 mt-1 break-words">{result.ai_error}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">
                      No AI API key is configured yet, so this is a template-based draft, not a real
                      AI translation — please review the text carefully before publishing.
                    </p>
                  )}
                </div>
              )}

              <label className={labelClass}>Title (English)</label>
              <input className={inputClass} value={result.title_english || ''} onChange={(e) => updateField('title_english', e.target.value)} />

              <label className={labelClass}>Title ({language})</label>
              <input className={inputClass} value={result.title_hindi || ''} onChange={(e) => updateField('title_hindi', e.target.value)} />

              <label className={labelClass}>Description (English)</label>
              <textarea className={inputClass} rows={8} value={result.description_english || ''} onChange={(e) => updateField('description_english', e.target.value)} />

              <label className={labelClass}>Description ({language})</label>
              <textarea className={inputClass} rows={8} value={result.description_hindi || ''} onChange={(e) => updateField('description_hindi', e.target.value)} />

              <label className={labelClass}>Key Features</label>
              {/* One per line. The AI now writes 5-7 full descriptive
                  features rather than two-word fragments, and joining
                  those onto a single line made them unreadable. */}
              <ul className="text-sm text-gray-700 bg-ivory rounded-lg p-3 space-y-1.5">
                {(result.features || []).map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-forest flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

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
