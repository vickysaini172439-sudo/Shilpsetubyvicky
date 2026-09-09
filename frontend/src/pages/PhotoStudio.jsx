import { useEffect, useState } from 'react'
import ProductPicker from '../components/ProductPicker.jsx'
import PhotoPicker from '../components/PhotoPicker.jsx'
import VoiceInput from '../components/VoiceInput.jsx'
import DraftBanner from '../components/DraftBanner.jsx'
import { enhanceImage, getImageCapabilities, updateProduct } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'
import { CRAFT_CATEGORIES } from '../constants.js'
import { saveDraft, loadDraft, clearDraft } from '../services/drafts.js'

// Friendly names for whatever engine actually ran, so the artisan always
// knows what happened to their photo.
const ENGINE_LABELS = {
  openai: { text: 'Enhanced by OpenAI', style: 'bg-forest text-white' },
  gemini: { text: 'Enhanced by Gemini AI', style: 'bg-forest text-white' },
  'local-ai': { text: 'Background removed on this computer', style: 'bg-forest text-white' },
  basic: { text: 'Basic enhancement only', style: 'bg-sand text-charcoal' },
}

export default function PhotoStudio() {
  const { token, user } = useAuth()
  const speechLanguage = user?.preferred_language || 'Hindi'

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

  // What the artisan calls this exact item. The craft category can only
  // tell the AI "a metal craft object"; this tells it "a brass diya",
  // which is the difference between a good retouch and a redraw. Starts
  // from the product's saved name and stays editable, because the saved
  // name is often shorthand ("Diya 2") while the AI wants a description.
  const [productDesc, setProductDesc] = useState('')

  // The category that will be sent to the AI, and it is EDITABLE here.
  //
  // It used to be read straight off the selected product with no way to
  // correct it, which produced the worst output this app has shipped: an
  // artisan photographed silver jhumka earrings while the product on
  // screen was "Handmade Wool Cushion" in Textiles & Weaving, and the AI
  // returned the earrings lying on a shawl it had invented to satisfy the
  // category. The prompt no longer lets a category override the
  // photograph (see backend/app/services/photo_prompt.py) — but the
  // artisan still needs to be able to say "this one is jewellery",
  // because a right category genuinely does improve the result.
  const [category, setCategory] = useState('')

  // An unfinished session found on arrival, waiting for the artisan to say
  // whether to continue it. Deliberately NOT applied automatically:
  // silently reviving old work is its own kind of surprise.
  const [pendingDraft, setPendingDraft] = useState(null)

  const draftKey = product ? `photo-studio:${product.id}` : null

  useEffect(() => {
    getImageCapabilities(token)
      .then((c) => {
        setCaps(c)
        setEngine(c.default_engine === 'openai' || c.default_engine === 'gemini' ? c.default_engine : 'local')
      })
      .catch(() => setCaps({ openai_available: false, gemini_available: false, background_removal_available: false }))
  }, [token])

  function clearWork() {
    setFile(null)
    setOriginalPreview(null)
    setEnhancedPreview(null)
    setEnhancedBlob(null)
    setEngineUsed('')
    setInstruction('')
    setNote('')
    setSaved(false)
    setError('')
  }

  function handleSelectProduct(p) {
    setProduct(p)
    clearWork()
    // Start the description from the product's saved name so the field is
    // never empty, but leave it editable.
    setProductDesc(p?.name || '')
    setCategory(p?.category || user?.business?.craft_category || '')

    // Anything left unfinished for THIS product, from before they walked
    // away. Keyed per product so switching items cannot resurrect the
    // wrong one.
    const found = p ? loadDraft(`photo-studio:${p.id}`) : null
    const d = found?.data
    const worthOffering =
      d &&
      Boolean(
        d.enhancedBlob ||
          d.file ||
          (d.instruction || '').trim() ||
          ((d.productDesc || '').trim() && (d.productDesc || '').trim() !== (p?.name || '').trim()),
      )
    setPendingDraft(worthOffering ? found : null)
  }

  // Keep the unfinished session alive across navigation. Skipped while a
  // draft is waiting to be answered, because the fields are showing a
  // fresh reset at that moment and saving them would overwrite the very
  // draft being offered.
  const hasWork =
    Boolean(file || enhancedBlob || instruction.trim()) ||
    Boolean(productDesc.trim() && productDesc.trim() !== (product?.name || '').trim())

  useEffect(() => {
    if (!draftKey || pendingDraft || !hasWork) return
    saveDraft(draftKey, {
      file,
      enhancedBlob,
      productDesc,
      category,
      instruction,
      engine,
      engineUsed,
      note,
    })
  }, [draftKey, pendingDraft, hasWork, file, enhancedBlob, productDesc, category, instruction, engine, engineUsed, note])

  function continueDraft() {
    const d = pendingDraft?.data || {}
    setProductDesc(d.productDesc ?? productDesc)
    if (d.category) setCategory(d.category)
    setInstruction(d.instruction ?? '')
    if (d.engine) setEngine(d.engine)
    if (d.file) {
      setFile(d.file)
      setOriginalPreview(URL.createObjectURL(d.file))
    }
    if (d.enhancedBlob) {
      setEnhancedBlob(d.enhancedBlob)
      setEnhancedPreview(URL.createObjectURL(d.enhancedBlob))
      setEngineUsed(d.engineUsed || '')
      setNote(d.note || '')
    }
    setPendingDraft(null)
  }

  function discardDraft() {
    clearDraft(draftKey)
    setPendingDraft(null)
    clearWork()
    setProductDesc(product?.name || '')
  }

  function describeDraft(d) {
    if (d?.enhancedBlob) return 'An enhanced photo you had not saved to the product yet'
    if (d?.file) return 'A photo and the notes you gave the AI'
    return 'The notes you gave the AI'
  }

  function handlePickPhoto(f) {
    setFile(f)
    setOriginalPreview(URL.createObjectURL(f))
    setEnhancedPreview(null)
    setEnhancedBlob(null)
    setSaved(false)
    setNote('')
  }

  // Speech arrives phrase by phrase, so add to what is already there
  // rather than replacing it.
  function appendTo(setter) {
    return (text) => setter((current) => (current ? `${current} ${text}` : text))
  }

  async function handleEnhance() {
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const result = await enhanceImage(
        file,
        {
          engine,
          removeBg,
          brightness,
          contrast,
          instruction,
          // The category the artisan confirmed on this screen — not
          // whatever the selected product happened to be filed under.
          category,
          // Narrower still, and the strongest grounding we can give the
          // image model. Falls back to the product's saved name if the
          // artisan left the description box untouched.
          productName: (productDesc || product?.name || '').trim(),
        },
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

  const categoryChanged = Boolean(category && product && category !== product.category)

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
      // If they corrected the category to get a decent photo, the product
      // itself was filed wrong — so fix it here rather than making them
      // go and change it again on another screen. The button says so.
      formData.append('category', category || product.category || '')
      formData.append('craft_type', product.craft_type || '')
      formData.append('price', product.price ?? '')
      formData.append('status', product.status)
      formData.append('image', enhancedBlob, 'enhanced.png')

      const updated = await updateProduct(product.id, formData, token)
      setProduct(updated)
      setSaved(true)
      // The work is on the product now; there is nothing left unfinished.
      clearDraft(draftKey)
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
      <ProductPicker selectedId={product?.id} onSelect={handleSelectProduct} />

      {pendingDraft && (
        <DraftBanner
          savedAt={pendingDraft.savedAt}
          what={describeDraft(pendingDraft.data)}
          onContinue={continueDraft}
          onDiscard={discardDraft}
        />
      )}

      {product && (
        <div className="p-5">
          <label className="block text-sm font-medium text-charcoal mb-1">1. Add a photo</label>
          <PhotoPicker onPick={handlePickPhoto} className="mb-2" />

          {file ? (
            <p className="text-xs text-forest mb-4 truncate">✓ {file.name}</p>
          ) : (
            <p className="text-xs text-gray-500 mb-4">
              Take a fresh photo, or pick one you already have.
            </p>
          )}

          {/* Asking what the item is, before anything is sent. The image
              model's biggest failure mode is not knowing what it is
              looking at - it fills the gap by inventing something. The
              artisan's own words for this exact piece narrow it further
              than anything else we can give it. */}
          {originalPreview && (
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <label className="block text-sm font-medium text-charcoal mb-1">
                2. What is this? Tell the AI
              </label>
              <div className="flex gap-2 items-start">
                <input
                  className="flex-1 min-w-0 p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base"
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder="e.g. brass diya, kundan necklace, jute tote bag"
                />
                <VoiceInput
                  compact
                  language={speechLanguage}
                  label="Say what this is"
                  onTranscript={appendTo(setProductDesc)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-snug">
                Name the item in a few words. The AI photographs what you tell it, so
                "brass oil lamp with peacock handle" gives a much better result than "diya".
              </p>

              <label className="block text-sm font-medium text-charcoal mb-1 mt-4">
                What kind of craft is it?
              </label>
              <select
                className="w-full p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CRAFT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1 leading-snug">
                {categoryChanged
                  ? `Saving will also move this product to ${category}.`
                  : 'Change this if the photo is not the kind of craft shown here — it tells the AI what to look for.'}
              </p>
            </div>
          )}

          {originalPreview && (
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <p className="text-sm font-medium text-charcoal mb-2">3. Choose how to enhance</p>

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
                  Real AI re-shoots your photo on a soft off-white cloth in daylight, removes
                  everything that isn't your product, and sharpens the craft detail — while
                  keeping the piece itself exactly as it is.
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
                <span className="font-semibold text-forest">🛠️ Basic enhance (always works)</span>
                <span className="block text-xs text-gray-600 mt-1">
                  Brightness, contrast, colour and sharpness, done on our own server.
                  No AI service needed, so this one never fails - and it is the fastest.
                </span>
              </button>

              {/* ---- Engine-specific controls ---- */}
              {(engine === 'openai' || engine === 'gemini') && (
                <div className="mt-3">
                  <label className="text-sm text-gray-600">
                    Anything extra to tell the AI? (optional)
                  </label>
                  <div className="flex gap-2 items-start mt-1">
                    <input
                      className="flex-1 min-w-0 p-2 rounded-lg border border-gray-300 text-sm"
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="e.g. show it on a plain white background"
                    />
                    <VoiceInput
                      compact
                      language={speechLanguage}
                      label="Speak your instruction"
                      onTranscript={appendTo(setInstruction)}
                    />
                  </div>
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
                    <p className="text-xs text-gray-600 mt-1">
                      Background removal is not switched on for this server, so the
                      background will be kept as it is. The rest still runs - the photo
                      is brightened, sharpened and colour-corrected as usual.
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
                  This can take up to a minute — but you can leave this screen if you need to.
                  Your work is kept.
                </p>
              )}
            </div>
          )}

          {enhancedPreview && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-charcoal">4. Before → After</p>
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

              <p className="text-xs text-gray-500 mt-2 leading-snug">
                Not what you photographed? Correct the name and craft type in step 2 and enhance
                again — those two are what the AI uses to recognise your piece.
              </p>

              {note && <p className="text-xs text-gray-500 mt-2">{note}</p>}
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
              {saved && <p className="text-forest text-sm mt-3">Saved to product ✓</p>}

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-forest text-white font-semibold py-3 rounded-full mt-4 shadow-md disabled:opacity-60"
              >
                {loading
                  ? 'Saving...'
                  : categoryChanged
                    ? 'Save photo & fix category'
                    : 'Save to Product'}
              </button>
            </div>
          )}

          {error && !enhancedPreview && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>
      )}
    </div>
  )
}
