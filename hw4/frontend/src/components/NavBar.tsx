import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { useBag } from '../bag'

const SHOP_LINKS = [
  { to: '/products?collection=welcome', label: 'Welcome Collection' },
  { to: '/products?category=hoodie', label: 'Hoodies' },
  { to: '/products?category=crewneck+sweatshirt', label: 'Crewnecks' },
  { to: '/products?category=T-shirt', label: 'Tees' },
  { to: '/products?collection=colleges', label: 'Colleges' },
]

const ANNOUNCEMENTS = [
  'Welcome to Yale, Class of 2030. Shop the Welcome Collection.',
  'Officially licensed · Pick up in store at 57 Broadway, New Haven',
  'Questions about fit or stock? Our concierge answers in seconds.',
]

export default function NavBar() {
  const { user, logout } = useAuth()
  const { bag } = useBag()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [note, setNote] = useState(0)
  const [paused, setPaused] = useState(false)

  // Header shrinks once the shopper scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Rotating announcement (pauses on hover/focus).
  useEffect(() => {
    if (paused) return
    const t = window.setInterval(() => setNote((n) => (n + 1) % ANNOUNCEMENTS.length), 5000)
    return () => window.clearInterval(t)
  }, [paused])

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname, search])

  const isActive = (to: string) => `${pathname}${search}` === to

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div
        className="announce"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <p key={note} className="announce-text">
          {ANNOUNCEMENTS[note]}
        </p>
      </div>
      <div className="nav-inner">
        <button
          className="menu-btn"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="menu-icon" aria-hidden="true" />
          <span className="sr-only">Menu</span>
        </button>

        <nav id="site-menu" className={`nav-shop ${menuOpen ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/products" end className={() => (pathname === '/products' && !search ? 'active' : '')}>
            Shop All
          </NavLink>
          {SHOP_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={isActive(l.to) ? 'active' : ''} aria-current={isActive(l.to) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
          <NavLink to="/about" className="only-mobile">
            About Us
          </NavLink>
          {!user && (
            <NavLink to="/login" className="only-mobile">
              Log in
            </NavLink>
          )}
        </nav>

        <Link to="/" className="brand" aria-label="Campus Customs home">
          <span className="brand-name">Campus Customs</span>
          <span className="brand-sub">Yale · New Haven</span>
        </Link>

        <div className="nav-account">
          <NavLink to="/about" className="hide-mobile">
            About
          </NavLink>
          {user && (
            <NavLink to="/bag" className="nav-bag" aria-label={`Bag, ${bag?.count ?? 0} items`}>
              Bag <span className="bag-count">{bag?.count ?? 0}</span>
            </NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/account/password" className="nav-hello" title="Account and password">
                Hi, {user.first_name}
              </NavLink>
              <button
                className="nav-btn"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/create-account" className="nav-btn">
                Create account
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
