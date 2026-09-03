import { useState } from 'react'
import { createProduct, updateProduct, imageUrl } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'
import { CRAFT_CATEGORIES } from '../constants.js'

// Handles both "Add Product" and "Edit Product" - if an existing
// product is passed in, its values pre-fill the form and Save calls
// the update endpoint instead of create.
export default function ProductForm({ existingProduct, onSaved, onCancel }) {
  const { token } = useAuth()
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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function save(status) {
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value ?? ''))
      formData.append('status', status)
      if (imageFile) formData.append('image', imageFile)

      const saved = existingProduct
        ? await updateProduct(existingProduct.id, formData, token)
        : await createProduct(formData, token)

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
      {preview && (
        <img src={preview} alt="Product preview" className="w-full h-48 object-cover rounded-lg mb-2" />
      )}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="text-sm" />

      <label className={labelClass}>Product Name (English)</label>
      <input className={inputClass} name="name" value={form.name} onChange={handleChange} required />

      <label className={labelClass}>Product Name (Hindi)</label>
      <input className={inputClass} name="name_hindi" value={form.name_hindi} onChange={handleChange} placeholder="हिंदी में नाम (optional)" />

      <label className={labelClass}>Description (English)</label>
      <textarea className={inputClass} name="description_english" rows={3} value={form.description_english} onChange={handleChange} />

      <label className={labelClass}>Description (Hindi)</label>
      <textarea className={inputClass} name="description_hindi" rows={3} value={form.description_hindi} onChange={handleChange} placeholder="हिंदी में विवरण (optional)" />

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
    </div>
  )
}
