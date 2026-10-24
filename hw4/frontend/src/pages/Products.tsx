import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchProducts, type Product } from '../api'
import { useChatResults } from '../chatResults'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, COLLECTIONS, WELCOME_IDS } from '../lib/catalog'
import usePageTitle from '../usePageTitle'

const SORTS = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  name: 'Name: A to Z',
} as const
type SortKey = keyof typeof SORTS

function sortProducts(list: Product[], sort: SortKey): Product[] {
  const out = [...list]
  if (sort === 'price-asc') out.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))
  else if (sort === 'price-desc') out.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name))
  else if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name))
  else {
    // Featured: Welcome picks first, then best-stocked items
    const rank = (p: Product) => (WELCOME_IDS.includes(p.product_id) ? 0 : 1)
    out.sort((a, b) => rank(a) - rank(b) || b.total_stock - a.total_stock)
  }
  return out
}

export default function Products() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const { results, clearResults } = useChatResults()
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? ''
  const collection = params.get('collection') ?? ''
  const q = params.get('q') ?? ''
  const sort = (params.get('sort') as SortKey) in SORTS ? (params.get('sort') as SortKey) : 'featured'
  const [query, setQuery] = useState(q)

  const coll = COLLECTIONS[collection]
  const catLabel = CATEGORIES.find((c) => c.key === category)?.label
  const title = coll?.label ?? catLabel ?? (q ? `“${q}”` : 'Shop all')
  usePageTitle(results ? 'Chat results' : title === 'Shop all' ? 'Products' : title.replace(/[“”]/g, ''))

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError('Could not load products. Is the backend running on port 8000?'))
  }, [])

  useEffect(() => setQuery(q), [q])

  // Choosing a filter or menu link (any URL params) leaves chat-results mode.
  useEffect(() => {
    if (results && params.toString()) clearResults()
  }, [params, results, clearResults])

  // New chat results: jump to the top so the shopper sees them.
  useEffect(() => {
    if (results) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [results])

  function update(next: Record<string, string>) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    setParams(p)
  }

  const shown = useMemo(() => {
    if (!products) return []
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const list = products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!coll || coll.match(p)) &&
        words.every((w) => `${p.name} ${p.description} ${p.colors.join(' ')} ${p.search_tags.join(' ')}`.toLowerCase().includes(w)),
    )
    return sortProducts(list, sort)
  }, [products, category, coll, q, sort])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const p of products ?? []) c[p.category] = (c[p.category] ?? 0) + 1
    return c
  }, [products])

  if (results)
    return (
      <section className="section shop">
        <p className="sr-only" role="status">
          {results.products.length} products from your chat are now shown on the Products page.
        </p>
        <div className="chat-results-banner">
          <div>
            <p className="eyebrow">From your chat with the concierge</p>
            <h1 className="display">
              {results.products.length} {results.products.length === 1 ? 'match' : 'matches'}
            </h1>
            <p className="muted">“{results.label}”</p>
          </div>
          <button className="btn btn-outline" onClick={clearResults}>
            Show all products
          </button>
        </div>
        <h2 className="sr-only">Matching products</h2>
        <div className="grid">
          {results.products.map((p) => (
            <ProductCard key={p.product_id} product={p} />
          ))}
        </div>
      </section>
    )

  return (
    <section className="section shop">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">/</span>{' '}
        {title === 'Shop all' ? <span aria-current="page">Shop</span> : <Link to="/products">Shop</Link>}
        {title !== 'Shop all' && (
          <>
            {' '}
            <span aria-hidden="true">/</span> <span aria-current="page">{title}</span>
          </>
        )}
      </nav>
      <header className="shop-head">
        <h1 className="display">{title}</h1>
        <p className="section-sub">{coll?.blurb ?? (catLabel ? `Our full range of ${catLabel.toLowerCase()}, ready for New Haven.` : 'Officially licensed Yale apparel.')}</p>
      </header>

      <div className="toolbar">
        <div className="filter-row" role="group" aria-label="Filter by category">
          <button className={`filter ${!category ? 'on' : ''}`} aria-pressed={!category} onClick={() => update({ category: '' })}>
            All
          </button>
          {CATEGORIES.map((c) =>
            counts[c.key] ? (
              <button
                key={c.key}
                className={`filter ${category === c.key ? 'on' : ''}`}
                aria-pressed={category === c.key}
                onClick={() => update({ category: category === c.key ? '' : c.key })}
              >
                {c.label} <span className="filter-count">{counts[c.key]}</span>
              </button>
            ) : null,
          )}
        </div>
        <div className="toolbar-right">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              update({ q: query.trim() })
            }}
          >
            <label htmlFor="shop-search" className="sr-only">
              Search products
            </label>
            <input
              id="shop-search"
              type="search"
              placeholder="Search: Saybrook, hockey, navy…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          <label className="sort">
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value === 'featured' ? '' : e.target.value })}>
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="collection-row" role="group" aria-label="Collections">
        {Object.entries(COLLECTIONS).map(([key, c]) => (
          <button
            key={key}
            className={`collection-pill ${collection === key ? 'on' : ''}`}
            aria-pressed={collection === key}
            onClick={() => update({ collection: collection === key ? '' : key })}
          >
            {c.label}
          </button>
        ))}
        {(category || collection || q) && (
          <button className="link-btn clear-all" onClick={() => setParams(new URLSearchParams())}>
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!products && !error && (
        <p className="muted" role="status">
          Loading the racks…
        </p>
      )}
      {products && (
        <p className="result-count" role="status">
          {shown.length} {shown.length === 1 ? 'item' : 'items'}
        </p>
      )}
      <h2 className="sr-only">Product list</h2>
      <div className="grid">
        {shown.map((p) => (
          <ProductCard key={p.product_id} product={p} />
        ))}
      </div>
      {products && shown.length === 0 && (
        <div className="empty">
          <p>Nothing matches that yet.</p>
          <button className="btn" onClick={() => setParams(new URLSearchParams())}>
            See everything
          </button>
        </div>
      )}
    </section>
  )
}
