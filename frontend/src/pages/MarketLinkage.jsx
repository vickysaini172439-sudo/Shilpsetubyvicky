import { useEffect, useState } from 'react'
import { getMarketOpportunities } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

export default function MarketLinkage() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getMarketOpportunities(token).then(setData).catch((err) => setError(err.message))
  }, [token])

  if (error) return <p className="text-red-600 p-5 text-center">{error}</p>
  if (!data) return <p className="text-gray-500 p-5 text-center">Loading...</p>

  return (
    <div className="p-5">
      <p className="text-xs text-gray-400 bg-white rounded-lg p-3 mb-4">{data.note}</p>

      {data.product_suggestions.length > 0 && (
        <>
          <h3 className="font-semibold text-charcoal mb-2">Based on your products</h3>
          <div className="space-y-3 mb-6">
            {data.product_suggestions.map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">{s.category} · e.g. "{s.example_product}"</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {s.suggested_channels.map((c) => (
                    <span key={c} className="text-xs bg-ivory border border-sand text-charcoal px-3 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="font-semibold text-charcoal mb-2">General Market Opportunities</h3>
      <div className="space-y-3">
        {data.general_opportunities.map((op) => (
          <div key={op.title} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="font-semibold text-forest">{op.title}</p>
            <p className="text-sm text-gray-600 mt-1">{op.description}</p>
            <p className="text-xs text-gray-400 mt-2">Needs: {op.requires.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
