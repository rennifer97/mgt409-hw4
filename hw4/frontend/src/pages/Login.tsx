import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { PHOTOS } from '../lib/catalog'
import usePageTitle from '../usePageTitle'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  usePageTitle('Log in')
  const errorProps = error ? { 'aria-invalid': true, 'aria-describedby': 'login-error' } : {}

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/products')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth">
      <div className="auth-photo">
        <img src={PHOTOS.cheer.src} alt="" />
        <p className="auth-quote display">{'Welcome back, Bulldog.'}</p>
      </div>
      <div className="auth-panel">
      <p className="eyebrow">Your account</p>
      <h1 className="display">Log in</h1>
      <p className="muted">Pick up your saved chats and where you left off.</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            {...errorProps}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            {...errorProps}
          />
        </label>
        {error && (
          <p className="error" role="alert" id="login-error">
            {error}
          </p>
        )}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p>
        New here? <Link to="/create-account">Create an account</Link>
      </p>
      </div>
    </section>
  )
}
