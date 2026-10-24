import { Link } from 'react-router-dom'
import { formatPrice, type Product, type ProductCard as ChatCard } from '../api'
import { LOW_STOCK, WELCOME_IDS, categoryLabel, swatch } from '../lib/catalog'

// Works for catalogue products (Products page) and chat cards (Problem 7).
// Either way, clicking opens the same single-item page.
export default function ProductCard({ product }: { product: Product | ChatCard }) {
  const full = 'category' in product ? product : null
  const blurb = 'short_description' in product ? product.short_description : product.description
  const badge = full
    ? full.total_stock <= LOW_STOCK
      ? 'Low stock'
      : WELCOME_IDS.includes(full.product_id)
        ? 'Class of 2030 pick'
        : null
    : null

  return (
    <Link to={`/products/${product.product_id}`} className="card">
      <div className="card-img">
        <img src={product.image_url} alt="" loading="lazy" />
        {badge && <span className={`badge ${badge === 'Low stock' ? 'badge-alert' : ''}`}>{badge}</span>}
        {full && full.sizes_in_stock.length > 0 && (
          <span className="card-sizes" aria-hidden="true">
            {full.sizes_in_stock.join(' · ')}
          </span>
        )}
      </div>
      <div className="card-body">
        {full && <p className="card-cat">{categoryLabel(full.category)}</p>}
        <h3>{product.name}</h3>
        <p className="price">{formatPrice(product.price)}</p>
        {full && full.colors.length > 0 && (
          <p className="swatches">
            {full.colors.slice(0, 4).map((c) => (
              <span key={c} className="swatch" style={{ background: swatch(c) }} title={c} />
            ))}
            <span className="sr-only">Colors: {full.colors.join(', ')}</span>
          </p>
        )}
        <p className="card-desc">{blurb}</p>
        {full && <span className="sr-only">In stock in sizes {full.sizes_in_stock.join(', ') || 'none'}.</span>}
      </div>
    </Link>
  )
}
