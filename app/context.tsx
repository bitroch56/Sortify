import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type FC,
  type ReactNode,
} from "react"

interface AuthContextValue {
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
  authenticated: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Key for local storage
const TOKEN_KEY = "spotify_access_token"

function parseHashForToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  if (!window.location.hash) {
    return null
  }
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const token = params.get("access_token")
  if (token) {
    // Clean the hash to avoid re-parsing
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    )
  }
  return token
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null)

  useEffect(() => {
    const hashToken = parseHashForToken()
    const stored = localStorage.getItem(TOKEN_KEY)
    if (hashToken) {
      localStorage.setItem(TOKEN_KEY, hashToken)
      setTokenState(hashToken)
    } else if (stored) {
      setTokenState(stored)
    }
  }, [])

  const setToken = useCallback((t: string | null) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    setTokenState(t)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
  }, [setToken])

  const authValue = useMemo<AuthContextValue>(
    () => ({
      token,
      setToken,
      logout,
      authenticated: !!token,
    }),
    [token, setToken, logout],
  )

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}

// Theme context (light / dark system) with toggle
interface ThemeContextValue {
  theme: "light" | "dark" | "system"
  resolvedTheme: "light" | "dark"
  toggle: () => void
  setTheme: (theme: "light" | "dark" | "system") => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light"
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

const THEME_KEY = "ui_theme"

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") {
      return "system"
    }
    const saved = localStorage.getItem(THEME_KEY) as
      | ThemeContextValue["theme"]
      | null
    return saved || "system"
  })
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    getSystemTheme(),
  )

  useEffect(() => {
    const system = getSystemTheme()
    setResolvedTheme(theme === "system" ? system : theme)
  }, [theme])

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const listener = () => {
      if (theme === "system") {
        setResolvedTheme(getSystemTheme())
      }
    }
    mql.addEventListener("change", listener)
    return () => {
      mql.removeEventListener("change", listener)
    }
  }, [theme])

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(resolvedTheme)
    }
  }, [resolvedTheme])

  const setTheme = useCallback((t: "light" | "dark" | "system") => {
    setThemeState(t)
    localStorage.setItem(THEME_KEY, t)
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev): "light" | "dark" | "system" => {
      const current = prev === "system" ? getSystemTheme() : prev
      const next: "light" | "dark" = current === "dark" ? "light" : "dark"
      localStorage.setItem(THEME_KEY, next)
      return next
    })
  }, [])

  const themeValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      toggle,
      setTheme,
    }),
    [theme, resolvedTheme, toggle, setTheme],
  )

  return (
    <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return ctx
}
