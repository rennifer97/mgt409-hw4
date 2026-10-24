import { Link } from 'react-router-dom'
import { formatPrice } from '../api'
import { useAuth } from '../auth'
import { useBag } from '../bag'
import usePageTitle from '../usePageTitle'

// The bag is a saved list to bring to the store (the site has no online checkout).
export default function Bag() {
  const { user } = useAuth()
  const { bag, remove, setReminders } = useBag()
  usePageTitle('Your bag')

  if (!user)
    return (
      <section className="section bag-page">
        <h1 className="display">Your bag</h1>
        <p className="muted">
          <Link to="/login">Log in</Link> or <Link to="/create-account">create an account</Link> to save items to your bag.
        </p>
      </section>
    )

  return (
    <section className="section bag-page">
      <p className="eyebrow">Saved for you</p>
      <h1 className="display">Your bag</h1>
      {!bag ? (
        <p className="muted" role="status">
          Loading your bag…
        </p>
      ) : bag.items.length === 0 ? (
        <div className="empty">
          <p>Your bag is empty.</p>
          <Link to="/products?collection=welcome" className="btn">
            Shop the Welcome Collection
          </Link>
        </div>
      ) : (
        <div className="bag-layout">
          <ul className="bag-list">
            {bag.items.map((it) => (
              <li key={it.id} className="bag-item">
                <Link to={`/products/${it.product_id}`} className="bag-img" tabIndex={-1} aria-hidden="true">
                  <img src={it.image_url} alt="" />
                </Link>
                <div className="bag-info">
                  <Link to={`/products/${it.product_id}`} className="bag-name">
                    {it.name}
                  </Link>
                  <p className="muted">
                    Size {it.size} · Qty {it.quantity}
                  </p>
                  <p className={it.in_stock <= 5 ? 'stock-low' : 'muted'}>
                    {it.in_stock === 0
                      ? `Sold out in ${it.size} since you saved it`
                      : it.in_stock <= 5
                        ? `Only ${it.in_stock} left in ${it.size}`
                        : `In stock in ${it.size}`}
                  </p>
                </div>
                <div className="bag-right">
                  <p className="price">{formatPrice(it.price * it.quantity)}</p>
                  <button className="link-btn" onClick={() => void remove(it.id)} aria-label={`Remove ${it.name}, size ${it.size}`}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <aside className="bag-summary" aria-label="Bag summary">
            <p className="bag-total">
              <span>Total</span> <strong>{formatPrice(bag.subtotal)}</strong>
            </p>
            <p className="muted small">
              Checkout happens in store. Show this bag at <strong>57 Broadway</strong> and we’ll have your sizes ready.
            </p>
            <label className="reminder-toggle">
              <input type="checkbox" checked={bag.reminders_on} onChange={(e) => void setReminders(e.target.checked)} />
              Email me a reminder if I leave items here
            </label>
          </aside>
        </div>
      )}
    </section>
  )
}
