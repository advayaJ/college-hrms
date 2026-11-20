"use client";

import { create } from "zustand"
import { api } from "./api"

export interface SessionRole {
  key: string
  name: string
  departmentId: string | null
  departmentName: string | null
}

export interface SessionView {
  user: {
    id: string
    email: string
    name: string
    employeeId: string
    employeeCode: string
    designationTitle: string | null
    departmentId: string | null
    departmentName: string | null
    campusId: string | null
    photoSeed: number
  }
  institution: { id: string; name: string; code: string; type: string }
  campuses: { id: string; name: string; code: string; isMain: boolean }[]
  roles: SessionRole[]
  activeRoleKey: string
  permissions: string[]
}

interface SessionState {
  session: SessionView | null
  loading: boolean
  booting: boolean
  error: string | null
  boot: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  switchRole: (roleKey: string) => Promise<void>
  clearError: () => void
}

export const useSession = create<SessionState>((set, get) => ({
  session: null,
  loading: false,
  booting: true,
  error: null,
  boot: async () => {
    try {
      const data = await api.get<SessionView>("/auth/me")
      set({ session: data, booting: false })
    } catch {
      set({ session: null, booting: false })
    }
  },
  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const data = await api.post<SessionView>("/auth/login", { email, password })
      set({ session: data, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed"
      set({ loading: false, error: message })
      throw err
    }
  },
  logout: async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // ignore
    }
    set({ session: null })
  },
  refresh: async () => {
    try {
      const data = await api.get<SessionView>("/auth/me")
      set({ session: data })
    } catch {
      set({ session: null })
    }
  },
  switchRole: async (roleKey: string) => {
    const data = await api.post<SessionView>("/auth/switch-role", { roleKey })
    set({ session: data })
  },
  clearError: () => set({ error: null }),
}))

export function hasPermission(session: SessionView | null, ...perms: string[]) {
  if (!session) return false
  return perms.some((p) => session.permissions.includes(p))
}
