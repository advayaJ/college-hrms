"use client";

import { useCallback, useEffect, useState } from "react";

export interface HashRoute {
  path: string // e.g. "/employees/EMP-1002"
  segments: string[] // ["employees", "EMP-1002"]
  query: URLSearchParams
}

const DEFAULT_ROUTE: HashRoute = { path: "/dashboard", segments: ["dashboard"], query: new URLSearchParams() }

function parse(): HashRoute {
  if (typeof window === "undefined") return DEFAULT_ROUTE
  const raw = window.location.hash.replace(/^#/, "") || "/dashboard"
  const [path, qs] = raw.split("?")
  const clean = path.startsWith("/") ? path : `/${path}`
  return {
    path: clean,
    segments: clean.split("/").filter(Boolean),
    query: new URLSearchParams(qs ?? ""),
  }
}

export function navigate(to: string) {
  const target = to.startsWith("#") ? to.slice(1) : to
  if (typeof window !== "undefined" && window.location.hash === `#${target}`) return
  if (typeof window !== "undefined") window.location.hash = target
}

export function useHashRoute(): HashRoute {
  const [route, setRoute] = useState<HashRoute>(DEFAULT_ROUTE)
  useEffect(() => {
    const onChange = () => {
      setRoute(parse())
      // scroll main content to top on navigation
      const main = document.getElementById("hrms-main")
      if (main) main.scrollTop = 0
    }
    // sync with any deep link present at mount
    onChange()
    window.addEventListener("hashchange", onChange)
    if (!window.location.hash) window.location.hash = "/dashboard"
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  const go = useCallback((to: string) => navigate(to), [])
  return { ...route, go } as HashRoute & { go: (to: string) => void }
}
