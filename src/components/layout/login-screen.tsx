"use client";

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Building2, KeyRound, Loader2, Lock, Mail, ShieldAlert, Sparkles } from "lucide-react"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { Avatar, GlassCard, MetalButton, StatusPill } from "@/components/glass/kit"

interface DemoAccount {
  email: string
  name: string
  roleKey: string
  roleName: string
  designation: string | null
  departmentName: string | null
  photoSeed: number
}

export function LoginScreen() {
  const { login, loading, error } = useSession()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const { data: accounts } = useQuery({
    queryKey: ["demo-accounts"],
    queryFn: () => api.get<DemoAccount[]>("/auth/demo-accounts"),
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email.trim(), password)
      toast.success("Signed in — welcome back")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed")
    }
  }

  const quickPick = async (account: DemoAccount) => {
    setEmail(account.email)
    setPassword("Demo@2026")
    try {
      await login(account.email, "Demo@2026")
      toast.success(`Signed in as ${account.roleName}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brand / identity panel */}
        <GlassCard hover={false} className="relative overflow-hidden p-8 sm:p-10">
          <div className="metal-sheen absolute -top-24 -right-24 size-64 rounded-full opacity-25 blur-3xl" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <div className="glass kpi-glow flex size-12 items-center justify-center rounded-2xl">
              <Building2 className="size-6 text-[color:var(--chart-1)]" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Aryavratt University</div>
              <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">HRMS · Spatial Glass</div>
            </div>
          </div>
          <h1 className="mt-8 text-3xl leading-tight font-semibold tracking-tight sm:text-[34px]">
            College Human Resource
            <br />
            <span className="metal-sheen bg-clip-text text-transparent">Management System</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            One platform for the complete institutional lifecycle — employees, attendance, leave,
            configurable approvals, payroll, recruitment, faculty workload, appraisals, documents
            and analytics. Built for Indian universities and colleges.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {["Employees", "Approvals", "Payroll", "Recruitment", "Workload", "Analytics"].map((tag) => (
              <span key={tag} className="glass rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-8 text-[11px] text-muted-foreground">
            <Sparkles className="mr-1 inline size-3 text-[color:var(--chart-1)]" />
            All data is fictional demonstration data · PostgreSQL + NestJS + Next.js
          </div>
        </GlassCard>

        {/* Sign-in panel */}
        <GlassCard hover={false} className="p-8 sm:p-10">
          <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use a demo role account or your institutional credentials.</p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">Email</span>
              <div className="glass flex items-center gap-2.5 rounded-xl px-3.5 focus-within:border-[color:var(--chart-1)]/60">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aryavratt.edu.in"
                  className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">Password</span>
              <div className="glass flex items-center gap-2.5 rounded-xl px-3.5 focus-within:border-[color:var(--chart-1)]/60">
                <Lock className="size-4 shrink-0 text-muted-foreground" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>

            {error ? (
              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/10 px-3 py-2 text-xs text-[color:var(--destructive)]">
                <ShieldAlert className="size-3.5 shrink-0" />
                {error}
              </div>
            ) : null}

            <MetalButton type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin inline" /> : <KeyRound className="mr-2 size-4 inline" />}
              Sign in
            </MetalButton>

            <div className="flex items-center gap-3 pt-1">
              <div className="champagne-line flex-1" />
              <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">or</span>
              <div className="champagne-line flex-1" />
            </div>

            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Google OAuth is not configured in this sandbox demo (no real credentials exist). The auth service reserves a config slot for production."
              className="glass flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium opacity-55 cursor-not-allowed"
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" opacity=".9" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.91C3.99 20.53 7.7 23 12 23Z" opacity=".6" />
                <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.02H2.18C1.43 8.24 1 9.6 1 11s.43 2.76 1.18 3.98l3.66-2.88Z" opacity=".8" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.02l3.66 2.88C6.71 7.31 9.14 5.38 12 5.38Z" />
              </svg>
              Continue with Google (disabled in sandbox)
            </button>
          </form>

          {/* Demo quick-pick */}
          <div className="mt-7">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Demo accounts — one click
              </span>
              <StatusPill status="Demo@2026" className="border-border bg-muted text-muted-foreground" />
            </div>
            {accounts ? (
              <div className="grid max-h-72 gap-1.5 overflow-y-auto pr-1">
                {accounts.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => quickPick(a)}
                    disabled={loading}
                    className="glass glass-hover flex items-center gap-3 rounded-xl px-3 py-2 text-left disabled:opacity-50"
                  >
                    <Avatar name={a.name} seed={a.photoSeed} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{a.roleName}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {a.name} {a.designation ? `· ${a.designation}` : ""}
                      </div>
                    </div>
                    <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:block">{a.email.split("@")[0]}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-sheen h-11 rounded-xl" />
                ))}
              </div>
            )}
            <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">
              Every account uses the password <span className="font-mono text-[color:var(--chart-1)]">Demo@2026</span>.
              Multi-role users (e.g. HOD) can switch roles after signing in.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
