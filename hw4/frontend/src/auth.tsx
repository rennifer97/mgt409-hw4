import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  changePassword as apiChangePassword,
  fetchMe,
  login as apiLogin,
  signup as apiSignup,
  type ChangePasswordInput,
  type SignupInput,
  type User,
} from './api'

// Shares the logged-in user across the site. The browser keeps only the
// signed login token, never the password.
const TOKEN_KEY = 'cc_token'

type AuthState = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<User>
  signup: (input: SignupInput) => Promise<User>
  changePassword: (input: ChangePasswordInput) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage blocked: stay logged in for this tab only */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken)
  const [user, setUser] = useState<User | null>(null)

  // On page load, check the saved token is still valid.
  useEffect(() => {
    if (!token || user) return
    fetchMe(token)
      .then(setUser)
      .catch(() => {
        writeToken(null)
        setToken(null)
      })
  }, [token, user])

  function start(t: string, u: User) {
    writeToken(t)
    setToken(t)
    setUser(u)
    return u
  }

  const value: AuthState = {
    user,
    token,
    login: async (email, password) => {
      const res = await apiLogin(email, password)
      return start(res.token, res.user)
    },
    signup: async (input) => {
      const res = await apiSignup(input)
      return start(res.token, res.user)
    },
    changePassword: async (input) => {
      if (!token) throw new Error('Please log in again.')
      const res = await apiChangePassword(token, input)
      return start(res.token, res.user)
    },
    logout: () => {
      writeToken(null)
      setToken(null)
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
