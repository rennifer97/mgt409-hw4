import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import usePageTitle from '../usePageTitle'

const EMPTY = { current_password: '', new_password: '', confirm_password: '' }

// Problem 12: passwords must be refreshed once a year. Shoppers with an
// expired password are sent here after logging in; anyone can come here to change it.
export default function ChangePassword() {
  const { user, token, changePassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  usePageTitle('Change password')

  if (!user && !token) return <Navigate to="/login" replace />
  if (!user)
    return (
      <section className="section muted" role="status">
        Loading your account…
      </section>
    )

  const set = (field: keyof typeof EMPTY) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))
  const errorProps = error ? { 'aria-invalid': true, 'aria-describedby': 'pw-error' } : {}

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.new_password.length < 8) return setError('New password must be at least 8 characters.')
    if (form.new_password !== form.confirm_password) return setError('New passwords do not match.')
    setBusy(true)
    try {
      await changePassword(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section form-page account">
      <p className="eyebrow">Your account</p>
      <h1 className="display">Change password</h1>
      {user.password_expired ? (
        <p className="notice" role="alert">
          It’s been over a year since you set your password. To keep your account secure, please choose a new one
          to continue.
        </p>
      ) : (
        <p className="muted">
          Signed in as {user.email}. Passwords need refreshing every year; yours is good for {user.password_days_left}{' '}
          more days.
        </p>
      )}
      <form className="form" onSubmit={onSubmit}>
        <label>
          Current password
          <input type="password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} required {...errorProps} />
        </label>
        <label>
          New password
          <input type="password" autoComplete="new-password" minLength={8} value={form.new_password} onChange={set('new_password')} required aria-describedby="pw-hint" />
        </label>
        <label>
          Confirm new password
          <input type="password" autoComplete="new-password" value={form.confirm_password} onChange={set('confirm_password')} required {...errorProps} />
        </label>
        <p className="muted small" id="pw-hint">
          At least 8 characters, and different from your current one.
        </p>
        {error && (
          <p className="error" role="alert" id="pw-error">
            {error}
          </p>
        )}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </section>
  )
}
