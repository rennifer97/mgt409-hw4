import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts, type Product } from '../api'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'
import { CATEGORIES, COLLECTIONS, COLLEGES, PHOTOS, WELCOME_IDS } from '../lib/catalog'
import { askConcierge } from '../lib/concierge'
import usePageTitle from '../usePageTitle'

const MOTTO = ['Lux et Veritas', 'Class of 2030', 'Boola Boola', 'Bulldogs', 'Fourteen colleges, one blue', 'New Haven, CT']

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  usePageTitle('')

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => setProducts([]))
  }, [])

  const welcome = useMemo(
    () => WELCOME_IDS.map((id) => products.find((p) => p.product_id === id)).filter((p): p is Product => !!p),
    [products],
  )
  const family = useMemo(() => products.filter(COLLECTIONS.family.match).slice(0, 4), [products])
  const categoryTiles = useMemo(
    () =>
      CATEGORIES.slice(0, 5).map((c) => {
        const items = products.filter((p) => p.category === c.key)
        const cover =
          items.find((p) => WELCOME_IDS.includes(p.product_id)) ?? items.find((p) => p.total_stock > 40) ?? items[0]
        return { ...c, count: items.length, cover }
      }),
    [products],
  )

  return (
    <>
      {/* 1. Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <img className="hero-img" src={PHOTOS.team.src} alt={PHOTOS.team.alt} />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy">
          <p className="kicker">The Class of 2030 · Welcome to Yale</p>
          <h1 id="hero-title">
            You made it.
            <br />
            <em>Now wear it.</em>
          </h1>
          <p className="hero-sub">
            Four years start with one hoodie. Officially licensed Yale gear, picked out on Broadway for the newest
            Bulldogs and everyone cheering them on.
          </p>
          <div className="hero-actions">
            <Link to="/products?collection=welcome" className="btn btn-light">
              Shop the Welcome Collection
            </Link>
            <a href="#colleges" className="btn btn-outline-light">
              Find your college
            </a>
          </div>
        </div>
      </section>

      {/* 2. Motto band */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...MOTTO, ...MOTTO, ...MOTTO].map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>

      {/* 3. Shop by category */}
      <section className="section" aria-labelledby="cat-title">
        <Reveal>
          <div className="section-head">
            <div>
              <p className="eyebrow">Shop by category</p>
              <h2 id="cat-title" className="display">The essentials</h2>
            </div>
            <Link to="/products" className="link-arrow">
              Shop all <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
        <div className="cat-grid">
          {categoryTiles.map((c, i) => (
            <Reveal key={c.key} delay={i * 70}>
              <Link to={`/products?category=${encodeURIComponent(c.key)}`} className="cat-tile">
                <span className="cat-img">{c.cover && <img src={c.cover.image_url} alt="" loading="lazy" />}</span>
                <span className="cat-label">
                  {c.label}
                  <span className="cat-count">{c.count || ''}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4. Welcome Collection carousel */}
      <section className="section section-tint" aria-labelledby="welcome-title">
        <Reveal>
          <div className="section-head">
            <div>
              <p className="eyebrow">Move-In ready</p>
              <h2 id="welcome-title" className="display">
                The Welcome Collection
              </h2>
              <p className="section-sub">Ten first-week essentials we’d pack for Old Campus.</p>
            </div>
            <Link to="/products?collection=welcome" className="link-arrow">
              View the collection <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
        <div className="rail" role="list" aria-label="Welcome Collection products">
          {welcome.map((p) => (
            <div className="rail-item" role="listitem" key={p.product_id}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* 5. Residential colleges */}
      <section id="colleges" className="colleges" aria-labelledby="colleges-title">
        <div className="colleges-copy">
          <Reveal>
            <p className="eyebrow eyebrow-light">Residential Colleges</p>
            <h2 id="colleges-title" className="display">
              Your college is your <em>family.</em>
            </h2>
            <p>
              You’ll be sorted into one of fourteen colleges before you unpack, and you’ll root for it for life. Find
              yours and wear the name.
            </p>
            <Link to="/products?collection=colleges" className="btn btn-light">
              Shop all colleges
            </Link>
          </Reveal>
        </div>
        <ul className="college-grid" aria-label="Shop by residential college">
          {COLLEGES.map((c) => (
            <li key={c.code}>
              <Link to={`/products?q=${encodeURIComponent(c.name)}`} className="college-tile">
                <span className="college-mono" aria-hidden="true">
                  {c.code}
                </span>
                <span className="college-name">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Game day story */}
      <section className="story" aria-labelledby="gameday-title">
        <Reveal className="story-photo">
          <img src={PHOTOS.cheer.src} alt={PHOTOS.cheer.alt} loading="lazy" />
        </Reveal>
        <Reveal className="story-copy" delay={100}>
          <p className="eyebrow">Game Day</p>
          <h2 id="gameday-title" className="display">
            Saturdays at <em>the Bowl.</em>
          </h2>
          <p>
            Sixty-one thousand seats, one shade of blue. From intramural spikeball on Old Campus to The Game in
            November, show up in the colors.
          </p>
          <Link to="/products?collection=sports" className="btn">
            Shop Game Day
          </Link>
        </Reveal>
      </section>

      {/* 7. Family */}
      <section className="section" aria-labelledby="family-title">
        <div className="family">
          <Reveal className="family-photo">
            <img src={PHOTOS.dan.src} alt={PHOTOS.dan.alt} loading="lazy" />
          </Reveal>
          <div className="family-copy">
            <Reveal>
              <p className="eyebrow">Yale Family</p>
              <h2 id="family-title" className="display">
                For the proud ones <em>who got you here.</em>
              </h2>
              <p className="section-sub">Mom, Dad, Grandpa, and the cousin who drove you to Move-In.</p>
            </Reveal>
            <div className="family-grid">
              {family.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
            <Link to="/products?collection=family" className="link-arrow">
              Shop all family gear <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Concierge */}
      <section className="concierge" aria-labelledby="concierge-title">
        <img src={PHOTOS.hockey.src} alt="" className="concierge-bg" loading="lazy" />
        <Reveal className="concierge-card">
          <p className="eyebrow">Campus Customs Concierge</p>
          <h2 id="concierge-title" className="display">
            Not sure what size?
            <br />
            <em>Just ask.</em>
          </h2>
          <p>Our shop assistant checks real stock, finds your size, and suggests what’s still on the shelf.</p>
          <div className="chip-row">
            {['What hoodies come in medium?', 'Gift ideas for my parents', 'Show me Saybrook gear'].map((q) => (
              <button key={q} className="chip" onClick={() => askConcierge(q)}>
                {q}
              </button>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  )
}
