import { Link } from 'react-router-dom'
import { PHOTOS } from '../lib/catalog'

export default function Footer() {
  return (
    <footer className="footer" aria-label="Store info">
      <div className="footer-grid">
        <div className="footer-brand">
          <p className="footer-logo">Campus Customs</p>
          <p>Officially licensed Yale apparel, steps from Old Campus.</p>
          <p className="footer-motto" lang="la">
            Lux et Veritas
          </p>
        </div>
        <div>
          <h2>Shop</h2>
          <ul>
            <li><Link to="/products?collection=welcome">Welcome Collection</Link></li>
            <li><Link to="/products?category=hoodie">Hoodies</Link></li>
            <li><Link to="/products?category=crewneck+sweatshirt">Crewnecks</Link></li>
            <li><Link to="/products?category=T-shirt">Tees</Link></li>
            <li><Link to="/products">Shop all</Link></li>
          </ul>
        </div>
        <div>
          <h2>Collections</h2>
          <ul>
            <li><Link to="/products?collection=colleges">Residential Colleges</Link></li>
            <li><Link to="/products?collection=family">Yale Family</Link></li>
            <li><Link to="/products?collection=sports">Game Day</Link></li>
          </ul>
        </div>
        <div>
          <h2>Visit</h2>
          <address>
            57 Broadway
            <br />
            New Haven, CT 06511
          </address>
          <p>
            <Link to="/about">About us</Link>
          </p>
        </div>
      </div>
      <div className="footer-legal">
        <p>© Campus Customs · A class project for MGT409 at Yale SOM.</p>
        <p className="credits">
          Photos via Wikimedia Commons:{' '}
          {Object.values(PHOTOS).map((p, i, all) => (
            <span key={p.page}>
              {p.title}:{' '}
              <a href={p.page} target="_blank" rel="noreferrer">
                {p.credit}
              </a>{' '}
              ({p.license}){i < all.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      </div>
    </footer>
  )
}
