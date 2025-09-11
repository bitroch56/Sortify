import React from "react"
import { NavLink } from "react-router"

export function GradientButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "outline"
    asChild?: boolean
  },
) {
  const {
    className = "",
    variant = "primary",
    children,
    asChild,
    ...rest
  } = props
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-spotify-accent/50"
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-spotify to-spotify-accent text-white shadow-lg shadow-spotify/30 hover:shadow-xl",
    outline:
      "border border-white/20 bg-white/5 hover:bg-white/10 text-foreground/80 backdrop-blur-sm",
  }
  if (asChild) {
    return (
      <span className={`${base} ${variants[variant]} ${className}`}>
        {children}
      </span>
    )
  }
  return (
    <button {...rest} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props
  return (
    <div
      {...rest}
      className={`relative rounded-2xl border border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl ${className}`}
    ></div>
  )
}

export function NavTabs() {
  const tabClass = (isActive: boolean) =>
    `px-4 py-1.5 rounded-full text-xs font-medium transition ${isActive ? "bg-gradient-to-r from-spotify to-spotify-accent text-white shadow" : "text-foreground/60 hover:text-foreground"}`
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10 backdrop-blur">
      <NavLink to="/app" className={({ isActive }) => tabClass(isActive)}>
        Dashboard
      </NavLink>
    </div>
  )
}
