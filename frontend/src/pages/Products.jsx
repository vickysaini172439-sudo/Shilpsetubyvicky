import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listProducts, deleteProduct, imageUrl } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'
import ProductForm from '../components/ProductForm.jsx'
import { themeFor } from '../theme/categoryTheme.js'

function StatusBadge({ status }) {
  const isPublished = status === 'published'
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${
        isPublished ? 'bg-forest text-white' : 'bg-sand text-charcoal'
      }`}
    >
      {isPublished ? 'Published' : 'Draft'}
    </span>
  )
}

export default function Products() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Support jumping straight to the add-product form via the "+" floating
  // button elsewhere in the app (/products?new=1), not just the in-page button.
  const [view, setView] = useState(searchParams.get('new') === '1' ? 'form' : 'list') // 'list' | 'form'
  const [editingProduct, setEditingProduct] = useState(null)

  async function loadProducts() {
    setLoading(true)
    setError('')
    try {
      const data = await listProducts(token)
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    if (searchParams.get('new') === '1') {
      setSearchParams({}, { replace: true }) // clean the URL once we've consumed it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAddNew() {
    setEditingProduct(null)
    setView('form')
  }

  function handleEdit(product) {
    setEditingProduct(product)
    setView('form')
  }

  function handleSaved() {
    setView('list')
    setEditingProduct(null)
    loadProducts()
  }

  async function handleDelete(product) {
    const sure = window.confirm(`Delete "${product.name}"? This cannot be undone.`)
    if (!sure) return
    try {
      await deleteProduct(product.id, token)
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  if (view === 'form') {
    return (
      <ProductForm
        existingProduct={editingProduct}
        onSaved={handleSaved}
        onCancel={() => setView('list')}
      />
    )
  }

  return (
    <div className="p-5">
      <button
        onClick={handleAddNew}
        className="w-full bg-terracotta text-white font-semibold py-3 rounded-full shadow-md mb-5"
      >
        + Add Product
      </button>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-3 flex gap-3">
              <div className="skeleton w-24 h-24 rounded-xl flex-shrink-0" />
              <div className="flex-1 py-1 space-y-2">
                <div className="skeleton h-4 rounded-full w-3/4" />
                <div className="skeleton h-3 rounded-full w-1/2" />
                <div className="skeleton h-3 rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-red-600 text-center">{error}</p>}

      {!loading && products.length === 0 && (
        <div className="text-center mt-10 text-gray-500">
          <div className="text-4xl mb-2">📦</div>
          <p>You haven't added any products yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="fade-in bg-white rounded-2xl shadow-sm p-3 flex gap-3">
            {p.image_url ? (
              <img src={imageUrl(p.image_url)} alt={p.name} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
            ) : (
              <div
                className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ backgroundColor: themeFor(p.category).color }}
              >
                {themeFor(p.category).emoji}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-charcoal truncate">{p.name}</h3>
                <StatusBadge status={p.status} />
              </div>
              {p.price != null && <p className="text-terracotta font-semibold">₹{p.price}</p>}
              <p className="text-xs text-gray-500 truncate">{p.category}</p>

              <div className="flex gap-3 mt-2">
                <button onClick={() => handleEdit(p)} className="text-sm text-forest font-medium">Edit</button>
                <button onClick={() => handleDelete(p)} className="text-sm text-red-600 font-medium">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
