import { useState } from 'react'
import ProductPicker from '../components/ProductPicker.jsx'
import { getPricingSuggestion, updateProduct } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

export default function Pricing() {
  const { token } = useAuth()
  const [product, setProduct] = useState(null)
  const [costs, setCosts] = useState({ material_cost: '', labour_cost: '', packaging_cost: '', other_cost: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)

  function handleChange(e) {
    setCosts({ ...costs, [e.target.name]: e.target.value })
    setApplied(false)
  }

  async function handleCalculate() {
    setError('')
    setLoading(true)
    try {
      const data = await getPricingSuggestion(
        {
          product_id: product?.id,
          material_cost: Number(costs.material_cost) || 0,
          labour_cost: Number(costs.labour_cost) || 0,
          packaging_cost: Number(costs.packaging_cost) || 0,
          other_cost: Number(costs.other_cost) || 0,
          category: product?.category || 'Other',
          save: false,
        },
        token
      )
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    if (!result || !product) return
    setLoading(true)
    setError('')
    try {
      await getPricingSuggestion(
        {
          product_id: product.id,
          material_cost: Number(costs.material_cost) || 0,
          labour_cost: Number(costs.labour_cost) || 0,
          packaging_cost: Number(costs.packaging_cost) || 0,
          other_cost: Number(costs.other_cost) || 0,
          category: product.category || 'Other',
          save: true,
        },
        token
      )
      setApplied(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base'
  const labelClass = 'block text-sm font-medium text-charcoal mb-1 mt-3'

  return (
    <div>
      <ProductPicker selectedId={product?.id} onSelect={(p) => { setProduct(p); setResult(null) }} />

      {product && (
        <div className="p-5">
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <p className="text-sm text-gray-500 mb-2">Enter your costs to make ONE {product.name}</p>

            <label className={labelClass}>Raw Material Cost (₹)</label>
            <input className={inputClass} type="number" min="0" name="material_cost" value={costs.material_cost} onChange={handleChange} />

            <label className={labelClass}>Labour Cost (₹)</label>
            <input className={inputClass} type="number" min="0" name="labour_cost" value={costs.labour_cost} onChange={handleChange} />

            <label className={labelClass}>Packaging Cost (₹)</label>
            <input className={inputClass} type="number" min="0" name="packaging_cost" value={costs.packaging_cost} onChange={handleChange} />

            <label className={labelClass}>Other Cost (transport, etc.) (₹)</label>
            <input className={inputClass} type="number" min="0" name="other_cost" value={costs.other_cost} onChange={handleChange} />

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full bg-terracotta text-white font-semibold py-3 rounded-full mt-4 shadow-md disabled:opacity-60"
            >
              {loading ? 'Calculating...' : '💰 Suggest a Price'}
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div>
                  <p className="text-xs text-gray-500">Production Cost</p>
                  <p className="text-lg font-bold text-charcoal">₹{result.production_cost}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Suggested Range</p>
                  <p className="text-lg font-bold text-charcoal">₹{result.suggested_min}–₹{result.suggested_max}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recommended</p>
                  <p className="text-lg font-bold text-terracotta">₹{result.recommended_price}</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 bg-ivory rounded-lg p-3 mb-3">{result.explanation}</p>
              <p className="text-xs text-gray-400 mb-4">
                Reference data source: {result.data_source} ({result.reference_sample_size} sample prices considered)
              </p>

              {applied && <p className="text-forest text-sm mb-3">Applied ₹{result.recommended_price} to this product ✓</p>}

              <button
                onClick={handleApply}
                disabled={loading}
                className="w-full bg-forest text-white font-semibold py-3 rounded-full shadow-md disabled:opacity-60"
              >
                {loading ? 'Applying...' : `Use ₹${result.recommended_price} as this product's price`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
