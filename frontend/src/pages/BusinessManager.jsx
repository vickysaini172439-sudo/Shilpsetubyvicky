import { useEffect, useRef, useState } from 'react'
import { listProducts } from '../services/api.js'
import VoiceInput from '../components/VoiceInput.jsx'
import { sendBusinessMessage, getChatHistory } from '../services/api.js'
import { useAuth } from '../services/AuthContext.jsx'

const SUGGESTED_QUESTIONS = [
  'How should I promote this product?',
  'Who could be my customers?',
  'How should I package this product?',
  'What makes my product unique?',
  'How can I sell this product online?',
  'How should I prepare for B2B selling?',
]

export default function BusinessManager() {
  const { token, user } = useAuth()
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    listProducts(token).then(setProducts).catch(() => {})
  }, [token])

  useEffect(() => {
    getChatHistory(token, productId || undefined)
      .then((history) => setMessages(history.map((m) => ({ role: m.role, text: m.message }))))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const message = text ?? input
    if (!message.trim()) return

    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setInput('')
    setError('')
    setLoading(true)
    try {
      const data = await sendBusinessMessage({ message, product_id: productId || undefined }, token)
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply, aiMode: data.ai_mode, aiProviderLabel: data.ai_provider_label }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px - 64px)' }}>
      <div className="p-3 bg-white border-b border-gray-200">
        <label className="text-xs text-gray-500 block mb-1">Talking about (optional)</label>
        <select
          className="w-full p-2 rounded-lg border border-gray-300 text-sm"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          <option value="">General business advice</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-6">
            👋 Ask me anything about promoting, pricing or selling your craft.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user' ? 'bg-forest text-white' : 'bg-white shadow-sm text-charcoal'
              }`}
            >
              {m.text}
              {m.role === 'assistant' && m.aiMode === 'demo' && (
                <p className="text-[10px] text-sand font-semibold mt-1">Demo Mode reply</p>
              )}
              {m.role === 'assistant' && m.aiMode === 'real' && m.aiProviderLabel && (
                <p className="text-[10px] text-gray-400 mt-1">Answered by {m.aiProviderLabel}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="whitespace-nowrap text-xs bg-ivory border border-sand text-charcoal px-3 py-1.5 rounded-full"
            >
              {q}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 text-xs mb-2">{error}</p>}

        <VoiceInput
          language={user?.preferred_language || 'Hindi'}
          label="Ask by voice"
          showLanguagePicker={false}
          onTranscript={(t) => setInput((current) => (current ? `${current} ${t}` : t))}
          className="mb-2"
        />

        <div className="flex gap-2">
          <input
            className="flex-1 p-3 rounded-full border border-gray-300 text-base"
            placeholder="Type or speak your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="bg-terracotta text-white px-5 rounded-full font-semibold disabled:opacity-60"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
