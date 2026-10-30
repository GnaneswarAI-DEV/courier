import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { TOKEN_STORAGE_KEY } from '../services/api'
import { authService } from '../services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(token ? 'loading' : 'anonymous')

  useEffect(() => {
    let cancelled = false
    if (!token) {
      setUser(null)
      setStatus('anonymous')
      return undefined
    }

    setStatus('loading')
    authService
      .me()
      .then((profile) => {
        if (cancelled) return
        setUser(profile)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    const handleExpired = () => {
      setUser(null)
      setToken(null)
      setStatus('anonymous')
    }
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  const adoptSession = useCallback((session) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, session.access_token)
    setUser(session.user)
    setToken(session.access_token)
    setStatus('authenticated')
    return session.user
  }, [])

  const signIn = useCallback(
    async (credentials) => adoptSession(await authService.login(credentials)),
    [adoptSession],
  )

  const signUp = useCallback(
    async (payload) => adoptSession(await authService.register(payload)),
    [adoptSession],
  )

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'admin',
      isDriver: user?.role === 'driver',
      signIn,
      signUp,
      signOut,
      updateUser: setUser,
    }),
    [user, status, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
