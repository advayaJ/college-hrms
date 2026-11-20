"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import {
  Bell, Building2, ChevronsLeft, ChevronsRight, FileClock, GraduationCap, LayoutDashboard,
  LogOut, Menu, MoonStar, Search, Settings, Sun, UsersRound, UserRoundCog, ClipboardList,
  Wallet, Briefcase, Scale, FolderLock, ChartPie, CheckCircle2,
} from "lucide-react"
import { api } from "@/lib/api"
import { navigate } from "@/lib/router"
import { useSession } from "@/lib/session"
import { Avatar, cn } from "@/components/glass/kit"
import { CommandPalette } from "./command-palette"
import { NotificationsPanel } from "./notifications"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface NavItemDef {
  label: string
  hash: string
  icon: React.ReactNode
  show: (p: string[]) => boolean
}

const NAV_GROUPS: { title: string; items: NavItemDef[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", hash: "#/dashboard", icon: <LayoutDashboard />, show: (p) => p.includes("dashboard:view") },
      { label: "Approvals", hash: "#/approvals", icon: <ClipboardList />, show: () => true },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Employees", hash: "#/employees", icon: <UsersRound />, show: (p) => p.includes("employees:read_all") || p.includes("employees:read_dept") || p.includes("employees:read_self") },
      { label: "Departments", hash: "#/departments", icon: <Building2 />, show: (p) => p.includes("departments:read") },
      { label: "Recruitment", hash: "#/recruitment", icon: <Briefcase />, show: (p) => p.includes("recruitment:read") || p.includes("recruitment:manage") },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Attendance", hash: "#/attendance", icon: <FileClock />, show: (p) => p.includes("attendance:read_all") || p.includes("attendance:read_dept") || p.includes("attendance:read_self") },
      { label: "Leave", hash: "#/leave", icon: <Scale />, show: (p) => p.includes("leave:read_all") || p.includes("leave:read_dept") || p.includes("leave:read_self") },
      { label: "Payroll", hash: "#/payroll", icon: <Wallet />, show: (p) => p.includes("payroll:read_all") || p.includes("payroll:read_self") },
      { label: "Documents", hash: "#/documents", icon: <FolderLock />, show: (p) => p.includes("documents:read_all") || p.includes("documents:read_dept") || p.includes("documents:read_self") },
    ],
  },
  {
    title: "Academics",
    items: [
      { label: "Faculty Workload", hash: "#/workload", icon: <GraduationCap />, show: (p) => p.includes("workload:read_all") || p.includes("workload:read_dept") || p.includes("workload:read_self") },
      { label: "Appraisal", hash: "#/appraisal", icon: <CheckCircle2 />, show: (p) => p.includes("appraisal:read_all") || p.includes("appraisal:read_dept") || p.includes("appraisal:read_self") },
    ],
  },
  {
    title: "Insight & Admin",
    items: [
      { label: "Reports", hash: "#/reports", icon: <ChartPie />, show: (p) => p.includes("reports:read") || p.includes("reports:read_dept") },
      { label: "Settings", hash: "#/settings", icon: <Settings />, show: (p) => p.includes("settings:read") },
    ],
  },
]

export function AppShell({ children, activeHash }: { children: React.ReactNode; activeHash: string }) {
  const { session, switchRole, logout } = useSession()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [paletteOpen, setPaletteOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!session) return null
  const permissions = session.permissions
  const activeRole = session.roles.find((r) => r.key === session.activeRoleKey)

  const onSwitchRole = async (key: string) => {
    try {
      await switchRole(key)
      queryClient.clear()
      toast.success("Active role switched — dashboards and data rescoped")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch role")
    }
  }

  const signOut = async () => {
    await logout()
    queryClient.clear()
    toast("Signed out — see you soon")
  }

  const sidebar = (
    <aside
      className={cn(
        "sidebar-frost flex h-full flex-col border-r border-sidebar-border/70 transition-[width] duration-300 ease-out",
        collapsed ? "w-[78px]" : "w-[268px]"
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="glass kpi-glow flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Building2 className="size-5 text-[color:var(--chart-1)]" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold tracking-tight">{session.institution.name}</div>
            <div className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">HRMS · Spatial Glass</div>
          </div>
        ) : null}
      </div>

      <div className="champagne-line mx-4" />

      {/* Nav */}
      <nav className="mt-3 flex-1 space-y-4 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => i.show(permissions))
          if (items.length === 0) return null
          return (
            <div key={group.title}>
              {!collapsed ? (
                <div className="mb-1.5 px-3 text-[9.5px] font-semibold tracking-[0.22em] text-muted-foreground/80 uppercase">
                  {group.title}
                </div>
              ) : null}
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = activeHash === item.hash
                  return (
                    <li key={item.hash}>
                      <a
                        href={item.hash}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "nav-item flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-sidebar-foreground/85",
                          active && "nav-item-active",
                          collapsed && "justify-center px-0"
                        )}
                      >
                        <span className="flex size-[18px] shrink-0 items-center justify-center [&>svg]:size-[18px]">{item.icon}</span>
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Profile — bottom left */}
      <div className="border-t border-sidebar-border/70 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "glass-hover glass flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left",
                collapsed && "justify-center px-0"
              )}
            >
              <Avatar name={session.user.name} seed={session.user.photoSeed} size={collapsed ? 30 : 34} />
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-foreground">{session.user.name}</div>
                  <div className="truncate text-[10.5px] text-muted-foreground">
                    {activeRole?.name ?? session.activeRoleKey}
                    {activeRole?.departmentName ? ` · ${activeRole.departmentName}` : ""}
                  </div>
                </div>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="liquid w-60 rounded-xl border-border/60">
            <DropdownMenuLabel className="text-xs">
              <div className="text-[13px] font-semibold text-foreground">{session.user.name}</div>
              <div className="mt-0.5 text-[10.5px] font-normal text-muted-foreground">{session.user.email}</div>
              <div className="mt-1 text-[10.5px] font-normal text-muted-foreground">
                {session.user.designationTitle ?? "—"}
                {session.user.departmentName ? ` · ${session.user.departmentName}` : ""}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="border-border/60" />
            <DropdownMenuItem onClick={() => navigate("#/profile")} className="gap-2.5 rounded-lg text-[13px]">
              <UserRoundCog className="size-4" /> My profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("#/settings?tab=account")} className="gap-2.5 rounded-lg text-[13px]">
              <Settings className="size-4" /> Account & security
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="gap-2.5 rounded-lg text-[13px]"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <MoonStar className="size-4" />}
              Switch to {theme === "dark" ? "graphite light" : "obsidian dark"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-border/60" />
            <DropdownMenuItem onClick={signOut} className="gap-2.5 rounded-lg text-[13px] text-[color:var(--destructive)]">
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{sidebar}</div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-[272px]">{sidebar}</div>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="glass-strong z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 px-4 sm:px-5">
          <button
            type="button"
            aria-label="Open navigation"
            className="glass flex size-9 items-center justify-center rounded-xl md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="glass glass-hover flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 text-left sm:max-w-md"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-[13px] text-muted-foreground">
              Search employees, modules…
            </span>
            <kbd className="ml-auto hidden rounded-md border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
              Ctrl K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Institution / campus selector */}
            <CampusSelector />

            {/* Role switcher (multi-role users) */}
            {session.roles.length > 1 ? <RoleSwitcher onSwitch={onSwitchRole} activeKey={session.activeRoleKey} roles={session.roles} /> : null}

            {/* Notifications */}
            <NotificationsPanel />

            {/* Theme toggle */}
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="glass glass-hover flex size-9 items-center justify-center rounded-xl"
            >
              {theme === "dark" ? <MoonStar className="size-4 text-[color:var(--chart-1)]" /> : <Sun className="size-4" />}
            </button>

            {/* Sidebar collapse */}
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((c) => !c)}
              className="glass glass-hover hidden size-9 items-center justify-center rounded-xl md:flex"
            >
              {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main id="hrms-main" className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl space-y-5">{children}</div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </div>
  )
}

function CampusSelector() {
  const { session } = useSession()
  if (!session) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="glass glass-hover hidden items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] font-medium lg:flex">
          <Building2 className="size-3.5 text-[color:var(--chart-1)]" />
          <span className="max-w-36 truncate">
            {session.campuses.find((c) => c.id === session.user.campusId)?.name ?? "All campuses"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="liquid w-56 rounded-xl border-border/60">
        <DropdownMenuLabel className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Campuses</DropdownMenuLabel>
        {session.campuses.map((c) => (
          <DropdownMenuItem key={c.id} className="gap-2 rounded-lg text-[13px]">
            <span className={cn("size-1.5 rounded-full", c.id === session.user.campusId ? "bg-[color:var(--chart-1)]" : "bg-muted-foreground/40")} />
            <span className="flex-1">{c.name}</span>
            {c.isMain ? <span className="text-[9px] text-muted-foreground uppercase">Main</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RoleSwitcher({ roles, activeKey, onSwitch }: { roles: { key: string; name: string; departmentName: string | null }[]; activeKey: string; onSwitch: (key: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="glass glass-hover flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] font-medium">
          <span className="size-1.5 rounded-full bg-[color:var(--chart-1)]" />
          <span className="max-w-32 truncate">{roles.find((r) => r.key === activeKey)?.name ?? activeKey}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="liquid w-60 rounded-xl border-border/60">
        <DropdownMenuLabel className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Switch active role</DropdownMenuLabel>
        {roles.map((r) => (
          <DropdownMenuItem key={r.key} onClick={() => onSwitch(r.key)} className="gap-2.5 rounded-lg text-[13px]">
            <span className={cn("size-1.5 rounded-full", r.key === activeKey ? "bg-[color:var(--chart-1)]" : "bg-muted-foreground/40")} />
            <span className="flex-1">{r.name}</span>
            {r.departmentName ? <span className="text-[10px] text-muted-foreground">{r.departmentName}</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// NotificationsPanel lives in its own file; re-exported for convenience
export { NotificationsPanel } from "./notifications"
