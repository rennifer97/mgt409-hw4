import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { PHOTOS } from '../lib/catalog'
import usePageTitle from '../usePageTitle'

const EMPTY = { first_name: '', last_name: '', email: '', password: '', confirm_password: '' }

export default function CreateAccount() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  usePageTitle('Create account')
  const described = (hint?: string) => ({
    'aria-describedby': [hint, error && 'signup-error'].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : undefined,
  })

  const set = (field: keyof typeof EMPTY) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirm_password) return setError('Passwords do not match.')
    setBusy(true)
    try {
      await signup(form)
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
        <img src={PHOTOS.team.src} alt="" />
        <p className="auth-quote display">{'Welcome to the family.'}</p>
      </div>
      <div className="auth-panel">
      <p className="eyebrow">Join Campus Customs</p>
      <h1 className="display">Create account</h1>
      <p className="muted">Save your chats with the concierge and pick up where you left off.</p>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-row">
          <label>
            First name
            <input name="first_name" autoComplete="given-name" value={form.first_name} onChange={set('first_name')} required />
          </label>
          <label>
            Last name
            <input name="last_name" autoComplete="family-name" value={form.last_name} onChange={set('last_name')} required />
          </label>
        </div>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" value={form.email} onChange={set('email')} required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={set('password')}
            required
            {...described('password-hint')}
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            name="confirm_password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={set('confirm_password')}
            required
            {...described()}
          />
        </label>
        <p className="muted small" id="password-hint">
          At least 8 characters. We store only a salted hash, never your password.</p>
        {error && (
          <p className="error" role="alert" id="signup-error">
            {error}
          </p>
        )}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already have one? <Link to="/login">Log in</Link>
      </p>
      </div>
    </section>
  )
}
