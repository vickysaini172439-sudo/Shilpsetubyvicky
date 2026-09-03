import { useEffect, useState } from 'react'
import { listProducts } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

// A shared "pick which of your products this applies to" dropdown -
// used by both the AI Photo Studio and the AI Catalogue screens, since
// both features enhance/describe one specific product at a time.
export default function ProductPicker({ selectedId, onSelect }) {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listProducts(token)
      .then((data) => {
        setProducts(data)
        if (data.length > 0 && !selectedId) onSelect(data[0])
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <p className="text-gray-500 p-5">Loading your products...</p>

  if (products.length === 0) {
    return (
      <div className="p-5 text-center text-gray-500">
        <p className="mb-2">You need to add a product first.</p>
        <a href="/products" className="text-forest underline font-medium">Go to My Products</a>
      </div>
    )
  }

  return (
    <div className="p-5 pb-0">
      <label className="block text-sm font-medium text-charcoal mb-1">Select Product</label>
      <select
        className="w-full p-3 rounded-lg border border-gray-300 text-base"
        value={selectedId || ''}
        onChange={(e) => onSelect(products.find((p) => p.id === Number(e.target.value)))}
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  )
}
