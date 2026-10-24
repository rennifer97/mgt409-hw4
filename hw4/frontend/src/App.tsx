import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import NavBar from './components/NavBar'
import ChatWidget from './components/ChatWidget'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductPage from './pages/ProductPage'
import About from './pages/About'
import Login from './pages/Login'
import CreateAccount from './pages/CreateAccount'
import NotFound from './pages/NotFound'
import ChangePassword from './pages/ChangePassword'
import Bag from './pages/Bag'

export default function App() {
  const { pathname, state } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const { user } = useAuth()
  // Problem 12: an expired password (over a year old) must be changed before shopping on.
  const mustChangePassword = !!user?.password_expired && pathname !== '/account/password'

  // Each new page starts at the top. Keyboard and screen-reader users are
  // moved to the new page's content (not left on the link they clicked), except
  // when the chat opened the page, so they can keep typing in the chat.
  useEffect(() => {
    window.scrollTo(0, 0)
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (!(state as { fromChat?: boolean } | null)?.fromChat) mainRef.current?.focus({ preventScroll: true })
  }, [pathname, state])

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <NavBar />
      <main id="main" ref={mainRef} tabIndex={-1}>
        {mustChangePassword && <Navigate to="/account/password" replace />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<ProductPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/account/password" element={<ChangePassword />} />
          <Route path="/bag" element={<Bag />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}
