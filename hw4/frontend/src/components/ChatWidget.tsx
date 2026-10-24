import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  clearChatHistory,
  fetchChatHistory,
  fetchWelcome,
  formatPrice,
  sendChat,
  type ChatTurn,
  type PageContext,
  type ProductCard,
  type SavedMessage,
} from '../api'
import { useAuth } from '../auth'
import { useChatResults } from '../chatResults'

// products: cards that came with an assistant reply (shown on the Products page).
// welcome: the "pick up where you left off" message (not sent to the agent).
type Message = ChatTurn & { products?: ProductCard[]; label?: string; welcome?: boolean }

const GUEST_GREETING: Message = {
  role: 'assistant',
  text: "Hey there, Bulldog! I'm your Campus Customs shopping buddy. Ask me about hoodies, tees, sizes, or what's in stock.",
}

const SUGGESTIONS = ['What hoodies do you have?', 'Gift ideas for my parents', "What's in stock in medium?", 'Show me Saybrook gear']

// Saved rows -> chat bubbles. Each reply's cards are labeled with the question before it.
function fromSaved(saved: SavedMessage[]): Message[] {
  return saved.map((m, i) => ({
    role: m.role,
    text: m.text,
    products: m.products,
    label: i > 0 && saved[i - 1].role === 'user' ? saved[i - 1].text : undefined,
  }))
}

// Shows **bold** from the model as bold instead of raw asterisks.
function renderText(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  )
}

// Which page the shopper is on, so "this" can mean the product they're viewing.
function pageContext(pathname: string): PageContext {
  const match = pathname.match(/^\/products\/([^/]+)$/)
  return { path: pathname, product_id: match ? decodeURIComponent(match[1]) : null }
}

function welcomedKey(userId: number) {
  return `cc_welcomed_${userId}`
}

// Open the chat with the welcome-back message once per browser session.
function shouldAutoOpen(userId: number) {
  try {
    if (sessionStorage.getItem(welcomedKey(userId))) return false
    sessionStorage.setItem(welcomedKey(userId), '1')
    return true
  } catch {
    return false
  }
}

// Floating chat panel. Sends each message to /api/chat, where the PydanticAI
// agent answers. Product cards in a reply are shown on the Products page
// (Problem 7). Logged-in chats are saved and reloaded (Problem 8), and returning
// customers get a "pick up where you left off" welcome (Problem 9).
export default function ChatWidget() {
  const { user, token } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GUEST_GREETING])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const autoOpened = useRef(false) // opened by welcome-back, not by the shopper
  const { showResults } = useChatResults()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Log in: reload saved chat, then add the welcome-back message.
  // Log out: start a fresh guest chat.
  useEffect(() => {
    if (!user || !token) {
      setMessages([GUEST_GREETING])
      return
    }
    let cancelled = false
    Promise.all([fetchChatHistory(token).catch(() => []), fetchWelcome(token).catch(() => null)]).then(
      ([saved, welcome]) => {
        if (cancelled) return
        const hello: Message = {
          role: 'assistant',
          welcome: true,
          text: welcome?.text ?? `Hey ${user.first_name}, welcome back!`,
          products: welcome?.products,
          label: welcome?.topic,
        }
        setMessages([...fromSaved(saved), hello])
        if (welcome?.products.length && shouldAutoOpen(user.id)) {
          autoOpened.current = true
          setOpen(true)
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [user, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Keyboard users land in the message box when they open the panel. An
  // automatic welcome-back open doesn't steal focus from the page.
  useEffect(() => {
    if (open && !autoOpened.current) inputRef.current?.focus({ preventScroll: true })
    autoOpened.current = false
  }, [open])

  function close() {
    setOpen(false)
    toggleRef.current?.focus()
  }

  function onPanelKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  function openResults(label: string, products: ProductCard[]) {
    showResults({ label, products })
    navigate('/products', { state: { fromChat: true } })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  // Other parts of the site (product page, homepage chips) can ask a question.
  useEffect(() => {
    const onAsk = (e: Event) => {
      setOpen(true)
      void send((e as CustomEvent<string>).detail)
    }
    window.addEventListener('cc:ask', onAsk)
    return () => window.removeEventListener('cc:ask', onAsk)
  })

  async function send(raw: string) {
    const text = raw.trim()
    if (!text || busy) return
    setDraft('')
    // Earlier turns for guests (logged-in history comes from the database). Skip the greeting.
    const history = messages.filter((m) => !m.welcome && m !== GUEST_GREETING).map(({ role, text }) => ({ role, text }))
    setMessages((m) => [...m, { role: 'user', text }])
    setBusy(true)
    try {
      const { reply, products } = await sendChat(text, history, pageContext(pathname), token)
      setMessages((m) => [...m, { role: 'assistant', text: reply, products, label: text }])
      if (products.length > 0) openResults(text, products)
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: "Hmm, I couldn't reach the shop server just now. Mind trying again in a sec?" },
      ])
    } finally {
      setBusy(false)
    }
  }

  async function onClear() {
    if (!token || !window.confirm('Delete your saved chat with Campus Customs?')) return
    await clearChatHistory(token).catch(() => undefined)
    setMessages([{ role: 'assistant', welcome: true, text: `All cleared, ${user?.first_name}! What are we shopping for?` }])
  }

  return (
    <div className="chat">
      {open && (
        <section
          id="chat-panel"
          className="chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-title"
          onKeyDown={onPanelKeyDown}
        >
          <div className="chat-head">
            <span className="chat-avatar" aria-hidden="true">
              CC
            </span>
            <div className="chat-title-wrap">
              <h2 id="chat-title">Campus Customs Concierge</h2>
              <p className="chat-status">
                <span className="dot" aria-hidden="true" /> Online · checks real stock
              </p>
            </div>
            <button onClick={close} aria-label="Close chat">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="chat-note">
            {user ? (
              <>
                Chat saved to your account.{' '}
                <button className="link-btn" onClick={onClear}>
                  Clear chat history
                </button>
              </>
            ) : (
              'Guest chat. Log in to save it.'
            )}
          </div>
          {/* role="log" + aria-live: screen readers read each new message aloud */}
          <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Chat messages">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}${m.welcome ? ' welcome' : ''}`}>
                <span className="sr-only">{m.role === 'user' ? 'You said: ' : 'Assistant: '}</span>
                {renderText(m.text)}
                {m.welcome && m.products && m.products.length > 0 && (
                  <ul className="mini-cards" aria-label="Where you left off">
                    {m.products.slice(0, 3).map((p) => (
                      <li key={p.product_id}>
                        <Link to={`/products/${p.product_id}`} className="mini-card">
                          <img src={p.image_url} alt="" />
                          <span>
                            <span className="mini-name">{p.name}</span>
                            <span className="mini-price">{formatPrice(p.price)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {m.products && m.products.length > (m.welcome ? 3 : 0) && (
                  <button className="bubble-link" onClick={() => openResults(m.label ?? '', m.products!)}>
                    {m.welcome ? `Show all ${m.products.length} again →` : `View ${m.products.length} ${m.products.length === 1 ? 'item' : 'items'} on the page →`}
                  </button>
                )}
              </div>
            ))}
            {busy && (
              <div className="bubble assistant typing">
                <span className="typing-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="sr-only">Assistant is typing</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {!busy && messages.filter((m) => m.role === 'user').length === 0 && (
            <div className="chat-suggest" role="group" aria-label="Suggested questions">
              {SUGGESTIONS.map((q) => (
                <button key={q} className="chip small" onClick={() => void send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <form className="chat-form" onSubmit={onSubmit}>
            <label htmlFor="chat-input" className="sr-only">
              Message the shop assistant
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a product…"
              autoComplete="off"
            />
            <button type="submit" disabled={busy || !draft.trim()}>
              Send
            </button>
          </form>
        </section>
      )}
      <button
        ref={toggleRef}
        className="chat-toggle"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="chat-panel"
      >
        <span className="chat-toggle-icon" aria-hidden="true">
          {open ? '×' : '✦'}
        </span>
        {open ? 'Close chat' : 'Ask the concierge'}
      </button>
    </div>
  )
}
