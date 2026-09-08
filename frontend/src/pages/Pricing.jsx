import { useState } from 'react'
import ProductPicker from '../components/ProductPicker.jsx'
import { getPricingSuggestion } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

export default function Pricing() {
  const { token } = useAuth()
  const [product, setProduct] = useState(null)
  const [costs, setCosts] = useState({
    material_cost: '',
    labour_cost: '',
    packaging_cost: '',
    other_cost: '',
    // Artisans price a batch, not one abstract unit - "I'm making twenty
    // for the mela". Quantity drives the batch totals and the wholesale
    // rate a shop would expect.
    quantity: '1',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)

  function handleChange(e) {
    setCosts({ ...costs, [e.target.name]: e.target.value })
    setApplied(false)
  }

  function buildPayload(save) {
    return {
      product_id: product?.id,
      material_cost: Number(costs.material_cost) || 0,
      labour_cost: Number(costs.labour_cost) || 0,
      packaging_cost: Number(costs.packaging_cost) || 0,
      other_cost: Number(costs.other_cost) || 0,
      quantity: Math.max(1, Number(costs.quantity) || 1),
      category: product?.category || 'Other',
      save,
    }
  }

  async function handleCalculate() {
    setError('')
    setLoading(true)
    try {
      setResult(await getPricingSuggestion(buildPayload(false), token))
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
      await getPricingSuggestion(buildPayload(true), token)
      setApplied(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full p-3 rounded-lg border border-gray-300 focus:border-forest focus:outline-none text-base'
  const labelClass = 'block text-sm font-medium text-charcoal mb-1 mt-3'
  const qty = result?.quantity ?? 1

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

            <label className={labelClass}>How many pieces are you making?</label>
            <input className={inputClass} type="number" min="1" step="1" name="quantity" value={costs.quantity} onChange={handleChange} />
            <p className="text-xs text-gray-500 mt-1">
              We'll show your total cost and profit for the whole batch, and a fair wholesale
              rate if a shop wants to buy them together.
            </p>

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="press w-full bg-terracotta text-white font-semibold py-3 rounded-full mt-4 shadow-md disabled:opacity-60"
            >
              {loading ? 'Calculating…' : '💰 Suggest a Price'}
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              {/* Per-piece headline numbers */}
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div>
                  <p className="text-xs text-gray-500">Cost / piece</p>
                  <p className="text-lg font-bold text-charcoal">₹{result.production_cost}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fair range</p>
                  <p className="text-lg font-bold text-charcoal">₹{result.suggested_min}–₹{result.suggested_max}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recommended</p>
                  <p className="text-lg font-bold text-terracotta">₹{result.recommended_price}</p>
                </div>
              </div>

              {/* Profit - the number artisans actually care about */}
              <div className="bg-ivory rounded-lg p-3 mb-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Profit per piece</p>
                  <p className="text-base font-semibold text-forest">
                    ₹{result.profit_per_unit}
                    <span className="text-xs font-normal text-gray-500"> ({result.margin_percent}%)</span>
                  </p>
                </div>
                {qty > 1 && (
                  <div>
                    <p className="text-xs text-gray-500">Profit on {qty} pieces</p>
                    <p className="text-base font-semibold text-forest">₹{result.total_profit}</p>
                  </div>
                )}
              </div>

              {qty > 1 && (
                <div className="grid grid-cols-2 gap-3 mb-3 text-center">
                  <div className="border border-gray-200 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Batch cost</p>
                    <p className="text-sm font-semibold text-charcoal">₹{result.total_production_cost}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Batch earns</p>
                    <p className="text-sm font-semibold text-charcoal">₹{result.total_revenue}</p>
                  </div>
                </div>
              )}

              {result.is_bulk_batch && (
                <div className="border border-sand rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-charcoal mb-1">🏪 If a shop buys all {qty}</p>
                  <p className="text-sm text-gray-700">
                    Charge ₹{result.bulk_price_min}–₹{result.bulk_price_max} per piece. Less per piece
                    than retail, but the whole batch sells at once.
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-700 bg-ivory rounded-lg p-3 mb-3">{result.explanation}</p>

              {/* The AI's honest second opinion on whether this price is
                  realistic. Absent when no AI key is configured - the
                  numbers above stand on their own either way. */}
              {result.ai_reasoning && (
                <div
                  className="rounded-lg p-3 mb-3 text-white"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #4C7A4F 100%)' }}
                >
                  <p className="text-[10px] uppercase tracking-wide text-white/70 font-semibold mb-1">
                    ✨ Is this price realistic?
                    {result.ai_provider_label ? ` · ${result.ai_provider_label}` : ''}
                  </p>
                  <p className="text-sm leading-snug whitespace-pre-line">{result.ai_reasoning}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 mb-4">
                Reference data source: {result.data_source} ({result.reference_sample_size} sample prices considered)
              </p>

              {applied && <p className="text-forest text-sm mb-3">Applied ₹{result.recommended_price} to this product ✓</p>}

              <button
                onClick={handleApply}
                disabled={loading}
                className="press w-full bg-forest text-white font-semibold py-3 rounded-full shadow-md disabled:opacity-60"
              >
                {loading ? 'Applying…' : `Use ₹${result.recommended_price} as this product's price`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
