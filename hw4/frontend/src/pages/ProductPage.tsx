import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProduct, fetchProducts, formatPrice, type Product, type ProductDetail } from '../api'
import ProductCard from '../components/ProductCard'
import { categoryLabel, LOW_STOCK, swatch } from '../lib/catalog'
import { askConcierge } from '../lib/concierge'
import { useAuth } from '../auth'
import { useBag } from '../bag'
import usePageTitle from '../usePageTitle'

export default function ProductPage() {
  const { productId = '' } = useParams()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [all, setAll] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [size, setSize] = useState('')
  const { user } = useAuth()
  const { add } = useBag()
  const [bagMsg, setBagMsg] = useState('')
  usePageTitle(product?.name ?? (error ? 'Product not found' : 'Loading product'))

  useEffect(() => {
    setProduct(null)
    setError('')
    setSize('')
    setBagMsg('')
    fetchProduct(productId)
      .then(setProduct)
      .catch(() => setError('We could not find that product.'))
  }, [productId])

  useEffect(() => {
    fetchProducts().then(setAll).catch(() => setAll([]))
  }, [])

  // "You might also like": same category, in stock, closest in price.
  const related = useMemo(() => {
    if (!product) return []
    const cat = all.find((p) => p.product_id === product.product_id)?.category
    return all
      .filter((p) => p.category === cat && p.product_id !== product.product_id && p.total_stock > 0)
      .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price) || b.total_stock - a.total_stock)
      .slice(0, 4)
  }, [all, product])

  if (error)
    return (
      <section className="section">
        <p className="error" role="alert">
          {error}
        </p>
        <Link to="/products">← Back to shop</Link>
      </section>
    )
  if (!product)
    return (
      <section className="section muted" role="status">
        Loading…
      </section>
    )

  const category = all.find((p) => p.product_id === product.product_id)?.category ?? ''
  const picked = product.inventory.find((s) => s.size === size)

  return (
    <>
      <section className="section pdp">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span aria-hidden="true">/</span> <Link to="/products">Shop</Link>
          {category && (
            <>
              {' '}
              <span aria-hidden="true">/</span>{' '}
              <Link to={`/products?category=${encodeURIComponent(category)}`}>{categoryLabel(category)}</Link>
            </>
          )}{' '}
          <span aria-hidden="true">/</span> <span aria-current="page">{product.name}</span>
        </nav>

        <div className="detail">
          <div className="detail-img">
            <img src={product.image_url} alt={`${product.name}, product photo`} />
          </div>

          <div className="detail-info">
            <p className="eyebrow">{product.garment_type}</p>
            <h1 className="display">{product.name}</h1>
            <p className="price big">
              {formatPrice(product.price)}
              {product.total_stock <= LOW_STOCK && <span className="tag-low">Low stock</span>}
            </p>
            <p className="detail-desc">{product.description}</p>

            <div className="detail-block">
              <p className="detail-label">
                <strong>Colors:</strong> {product.colors.length ? product.colors.join(', ') : 'Not listed'}
              </p>
              {product.colors.length > 0 && (
                <p className="swatches big" aria-hidden="true">
                  {product.colors.map((c) => (
                    <span key={c} className="swatch" style={{ background: swatch(c) }} title={c} />
                  ))}
                </p>
              )}
            </div>

            <div className="detail-block">
              <h2 id="sizes-title" className="detail-label">
                <strong>Size</strong>
                <span className="muted"> · {product.total_stock} in stock across all sizes</span>
              </h2>
              <ul className="size-grid" aria-labelledby="sizes-title">
                {product.inventory.map((s) => (
                  <li key={s.size}>
                    <button
                      className={`size-btn ${size === s.size ? 'on' : ''}`}
                      disabled={s.quantity === 0}
                      aria-pressed={size === s.size}
                      aria-label={`Size ${s.size}: ${s.quantity === 0 ? 'sold out' : `${s.quantity} left`}`}
                      onClick={() => setSize(s.size)}
                    >
                      {s.size}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="stock-note" role="status">
                {picked
                  ? picked.quantity <= 5
                    ? `Only ${picked.quantity} left in ${picked.size}. Going fast.`
                    : `${picked.quantity} in stock in ${picked.size}.`
                  : product.inventory.some((s) => s.quantity === 0)
                    ? `Sold out in ${product.inventory.filter((s) => s.quantity === 0).map((s) => s.size).join(', ')}.`
                    : 'Every size in stock.'}
              </p>
            </div>

            {user ? (
              <button
                className="btn btn-block"
                disabled={!size}
                onClick={() =>
                  add(product.product_id, size)
                    .then(() => setBagMsg(`Added ${product.name} (${size}) to your bag.`))
                    .catch((err: Error) => setBagMsg(err.message))
                }
              >
                {size ? `Add ${size} to bag` : 'Select a size'}
              </button>
            ) : (
              <Link to="/login" className="btn btn-block">
                Log in to add to bag
              </Link>
            )}
            <p className="bag-msg" role="status">
              {bagMsg && (
                <>
                  {bagMsg} <Link to="/bag">View bag</Link>
                </>
              )}
            </p>
            <button
              className="btn btn-outline btn-block"
              onClick={() =>
                askConcierge(
                  size
                    ? `Is the ${product.name} in stock in ${size}? Anything similar I should look at?`
                    : `What size should I get in the ${product.name}, and what's in stock?`,
                )
              }
            >
              {size ? `Ask the concierge about ${size}` : 'Ask the concierge about sizing'}
            </button>
            <p className="pickup">
              <span aria-hidden="true">◎</span> Pick up in store at 57 Broadway, New Haven
            </p>

            <details className="accordion" open>
              <summary>Details</summary>
              <ul>
                <li>{product.garment_type}</li>
                <li>Colors: {product.colors.join(', ') || 'see photo'}</li>
                <li>Officially licensed Yale apparel</li>
              </ul>
            </details>
            <details className="accordion">
              <summary>Size & fit</summary>
              <p>Unisex sizing from XS to XXL. Between sizes? Ask the concierge and it will check what’s on the shelf.</p>
            </details>
            <details className="accordion">
              <summary>Store pickup</summary>
              <p>Find us at 57 Broadway, a few steps from Old Campus.</p>
            </details>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section-tint" aria-labelledby="related-title">
          <h2 id="related-title" className="display small">
            You might also like
          </h2>
          <div className="grid">
            {related.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
