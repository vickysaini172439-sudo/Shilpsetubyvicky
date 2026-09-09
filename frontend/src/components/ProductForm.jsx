import { useState } from 'react'
import VoiceInput from './VoiceInput.jsx'
import PhotoPicker from './PhotoPicker.jsx'
import {
  createProduct,
  updateProduct,
  imageUrl,
  addProductImages,
  deleteProductImage,
} from '../services/api.js'
import ImageLightbox from './ImageLightbox.jsx'
import { useAuth } from '../services/AuthContext.jsx'
import { CRAFT_CATEGORIES } from '../constants.js'

// Matches MAX_GALLERY_PHOTOS on the backend. Enough for any craft to show
// itself properly - front, back, detail, scale, in use - without letting
// one product fill the database.
const MAX_EXTRA_PHOTOS = 8

// Handles both "Add Product" and "Edit Product" - if an existing
// product is passed in, its values pre-fill the form and Save calls
// the update endpoint instead of create.
export default function ProductForm({ existingProduct, onSaved, onCancel }) {
  const { token, user } = useAuth()
  const language = user?.preferred_language || 'Hindi'
  const [form, setForm] = useState({
    name: existingProduct?.name || '',
    name_hindi: existingProduct?.name_hindi || '',
    description_english: existingProduct?.description_english || '',
    description_hindi: existingProduct?.description_hindi || '',
    material: existingProduct?.material || '',
    category: existingProduct?.category || CRAFT_CATEGORIES[0],
    craft_type: existingProduct?.craft_type || '',
    price: existingProduct?.price ?? '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(imageUrl(existingProduct?.image_url))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Extra views already saved on this product.
  const [gallery, setGallery] = useState(existingProduct?.gallery || [])
  // Extra views chosen but not yet uploaded. They cannot be sent until the
  // product has an id, which a brand-new one does not have until it is
  // saved - so they wait here and go up the moment it exists.
  const [queued, setQueued] = useState([])
  const [zoomAt, setZoomAt] = useState(null)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Adds a spoken phrase to the end of a field instead of replacing it,
  // so the artisan can dictate in several short bursts.
  function appendSpoken(field, text) {
    setForm((current) => ({
      ...current,
      [field]: current[field] ? `${current[field]} ${text}` : text,
    }))
  }

  function handlePickPhoto(file) {
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function handlePickExtra(file) {
    // The object URL is kept alongside the file rather than made during
    // render, so a re-render cannot leak a new one on every pass.
    setQueued((current) => [...current, { file, url: URL.createObjectURL(file) }])
  }

  function removeQueued(url) {
    setQueued((current) => current.filter((item) => item.url !== url))
  }

  async function removeSaved(imageId) {
    if (!existingProduct) return
    setError('')
    try {
      const updated = await deleteProductImage(existingProduct.id, imageId, token)
      setGallery(updated.gallery || [])
    } catch (err) {
      setError(err.message)
    }
  }

  async function save(status) {
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value ?? ''))
      formData.append('status', status)
      if (imageFile) formData.append('image', imageFile)

      let saved = existingProduct
        ? await updateProduct(existingProduct.id, formData, token)
        : await createProduct(formData, token)

      // Now that the product certainly has an id, attach any extra views.
      // This returns the whole updated product, so what gets handed back
      // already includes them.
      if (queued.length > 0) {
        saved = await addProductImages(saved.id, queued.map((item) => item.file), token)
        setQueued([])
        setGallery(saved.gallery || [])
      }

      onSaved(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base'
  const labelClass = 'block text-sm font-medium text-charcoal mb-1 mt-4'

  return (
    <div className="p-5">
      <h2 className="text-lg font-semibold text-forest mb-4">
        {existingProduct ? 'Edit Product' : 'Add Product'}
      </h2>

      <label className={labelClass}>Product Photo</label>
      {/* onError: a stored photo that no longer loads (an old filesystem
          URL from before photos moved into the database) leaves the form
          looking like a product with no photo yet, not like a bug. */}
      {preview && (
        <img
          src={preview}
          alt="Product preview"
          className="w-full h-48 object-cover rounded-lg mb-2"
          onError={() => setPreview(null)}
        />
      )}
      {/* Camera as well as gallery. This screen had only a plain file
          input, so an artisan holding the piece in one hand had to
          photograph it, leave the app, and come back to find the file -
          while Photo Studio, one screen away, offered the camera directly. */}
      <PhotoPicker onPick={handlePickPhoto} />

      <label className={labelClass}>More views of this piece</label>
      <p className="text-xs text-gray-500 mb-2 leading-snug">
        The back, the base, a close-up of the work, or it being held so the size is
        clear. One photo cannot answer "what does it actually look like" - and a buyer
        who cannot pick it up has only these.
      </p>

      {(gallery.length > 0 || queued.length > 0) && (
        <div className="flex gap-2 flex-wrap mb-2">
          {gallery.map((photo, i) => (
            <div key={photo.id} className="relative w-20 h-20">
              <img
                src={imageUrl(photo.url)}
                alt=""
                onClick={() => setZoomAt(i)}
                className="w-full h-full object-cover rounded-lg cursor-zoom-in"
              />
              <button
                type="button"
                onClick={() => removeSaved(photo.id)}
                aria-label="Remove this photo"
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white text-red-600 shadow text-xs font-bold"
              >
                x
              </button>
            </div>
          ))}

          {queued.map((item) => (
            <div key={item.url} className="relative w-20 h-20">
              <img src={item.url} alt="" className="w-full h-full object-cover rounded-lg opacity-70" />
              <button
                type="button"
                onClick={() => removeQueued(item.url)}
                aria-label="Remove this photo"
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white text-red-600 shadow text-xs font-bold"
              >
                x
              </button>
              <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[9px] text-center py-0.5 rounded-b-lg">
                on save
              </span>
            </div>
          ))}
        </div>
      )}

      {gallery.length + queued.length < MAX_EXTRA_PHOTOS ? (
        <PhotoPicker onPick={handlePickExtra} />
      ) : (
        <p className="text-xs text-gray-500">
          That is {MAX_EXTRA_PHOTOS} extra photos - the most one product can have.
        </p>
      )}

      <label className={labelClass}>Product Name (English)</label>
      <input className={inputClass} name="name" value={form.name} onChange={handleChange} required />

      <label className={labelClass}>Product Name ({language})</label>
      <input
        className={inputClass}
        name="name_hindi"
        value={form.name_hindi}
        onChange={handleChange}
        placeholder="Speak it instead of typing (optional)"
      />
      <VoiceInput
        language={language}
        label="Speak the name"
        showLanguagePicker={false}
        onTranscript={(t) => appendSpoken('name_hindi', t)}
        className="mt-2"
      />

      <label className={labelClass}>Description (English)</label>
      <textarea className={inputClass} name="description_english" rows={3} value={form.description_english} onChange={handleChange} />
      <VoiceInput
        language="English"
        label="Speak in English"
        showLanguagePicker={false}
        onTranscript={(t) => appendSpoken('description_english', t)}
        className="mt-2"
      />

      <label className={labelClass}>Description ({language})</label>
      <textarea
        className={inputClass}
        name="description_hindi"
        rows={3}
        value={form.description_hindi}
        onChange={handleChange}
        placeholder="Speak it instead of typing (optional)"
      />
      <VoiceInput
        language={language}
        label="Speak the description"
        onTranscript={(t) => appendSpoken('description_hindi', t)}
        className="mt-2"
      />

      <label className={labelClass}>Category</label>
      <select className={inputClass} name="category" value={form.category} onChange={handleChange}>
        {CRAFT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label className={labelClass}>Material</label>
      <input className={inputClass} name="material" value={form.material} onChange={handleChange} placeholder="e.g. Wood, Cotton, Clay" />

      <label className={labelClass}>Craft Type</label>
      <input className={inputClass} name="craft_type" value={form.craft_type} onChange={handleChange} placeholder="e.g. Hand-carved, Hand-woven" />

      <label className={labelClass}>Price (₹)</label>
      <input className={inputClass} type="number" min="0" name="price" value={form.price} onChange={handleChange} />

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => save('draft')}
          disabled={loading || !form.name}
          className="flex-1 border border-forest text-forest font-semibold py-3 rounded-full disabled:opacity-60"
        >
          Save Draft
        </button>
        <button
          onClick={() => save('published')}
          disabled={loading || !form.name}
          className="flex-1 bg-terracotta text-white font-semibold py-3 rounded-full shadow-md disabled:opacity-60"
        >
          Publish
        </button>
      </div>
      <button onClick={onCancel} className="w-full text-gray-500 mt-3 py-2">
        Cancel
      </button>

      {zoomAt !== null && (
        <ImageLightbox
          photos={gallery.map((photo) => ({ id: photo.id, url: imageUrl(photo.url) }))}
          startIndex={zoomAt}
          onClose={() => setZoomAt(null)}
          caption={form.name}
        />
      )}
    </div>
  )
}
