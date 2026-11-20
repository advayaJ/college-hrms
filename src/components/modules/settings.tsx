"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCheck, KeyRound, Landmark, ScrollText, Settings2, UserCog, Workflow } from "lucide-react"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { fmtDateTime, relTime, titleCase } from "@/lib/format"
import {
  Avatar, DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton, PageHeader, SectionCard, StatusPill, cn,
} from "@/components/glass/kit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsModule({ initialTab }: { initialTab?: string }) {
  const { session } = useSession()
  const canManage = !!session?.permissions.includes("settings:manage")
  const canUsers = !!session?.permissions.includes("settings:users_read") || !!session?.permissions.includes("settings:users_manage")
  const canRoles = !!session?.permissions.includes("settings:roles_manage")
  const canAudit = !!session?.permissions.includes("settings:audit_read")
  const [tab, setTab] = React.useState(initialTab ?? (canManage ? "institution" : canUsers ? "users" : canAudit ? "audit" : "account"))

  return (
    <div className="space-y-5">
      <PageHeader title="Settings & Administration" subtitle="Institution, workflows, users, roles, audit and your account" icon={<Settings2 />} />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="glass flex-wrap rounded-xl p-1">
          {canManage ? <TabsTrigger value="institution" className="rounded-lg px-3.5 py-1.5 text-[12px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Institution</TabsTrigger> : null}
          {canManage ? <TabsTrigger value="workflows" className="rounded-lg px-3.5 py-1.5 text-[12px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Workflows</TabsTrigger> : null}
          {canUsers ? <TabsTrigger value="users" className="rounded-lg px-3.5 py-1.5 text-[12px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Users</TabsTrigger> : null}
          {canRoles ? <TabsTrigger value="roles" className="rounded-lg px-3.5 py-1.5 text-[12px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Roles</TabsTrigger> : null}
          {canAudit ? <TabsTrigger value="audit" className="rounded-lg px-3.5 py-1.5 text-[12px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Audit log</TabsTrigger> : null}
          <TabsTrigger value="account" className="rounded-lg px-3.5 py-1.5 text-[12px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">My account</TabsTrigger>
        </TabsList>
        {canManage ? <TabsContent value="institution"><InstitutionTab /></TabsContent> : null}
        {canManage ? <TabsContent value="workflows"><WorkflowsTab /></TabsContent> : null}
        {canUsers ? <TabsContent value="users"><UsersTab /></TabsContent> : null}
        {canRoles ? <TabsContent value="roles"><RolesTab /></TabsContent> : null}
        {canAudit ? <TabsContent value="audit"><AuditTab /></TabsContent> : null}
        <TabsContent value="account"><AccountTab /></TabsContent>
      </Tabs>
    </div>
  )
}

/* ── Institution ─────────────────────────────────────────────── */

function InstitutionTab() {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ["institution"],
    queryFn: () => api.get<{ id: string; name: string; type: string; establishedYear: number; naacGrade: string | null; city: string; state: string; phone: string; email: string; website: string | null; campuses: { id: string; name: string; city: string }[] }>("/settings/institution"),
  })
  const { data: settings } = useQuery({
    queryKey: ["institution-settings"],
    queryFn: () => api.get<{ key: string; value: unknown; category: string; label: string; updatedAt: string | null }[]>("/settings/settings"),
  })
  const [form, setForm] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (data) setForm({ name: data.name, naacGrade: data.naacGrade ?? "", phone: data.phone, email: data.email, website: data.website ?? "" })
  }, [data])

  const save = async () => {
    try {
      await api.put("/settings/institution", {
        name: form.name, naacGrade: form.naacGrade || undefined,
        phone: form.phone, email: form.email, website: form.website || undefined,
      })
      toast.success("Institution profile updated")
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <div className="space-y-5">
      {data ? (
        <SectionCard title="Institution profile" description={`${data.type.replace(/_/g, " ")} · est. ${data.establishedYear} · ${data.city}, ${data.state} · ${data.campuses.length} campuses`}>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {[["name", "Institution name"], ["naacGrade", "NAAC grade"], ["phone", "Phone"], ["email", "Email"], ["website", "Website"]].map(([k, label]) => (
              <div key={k}>
                <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">{label}</Label>
                <Input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="glass h-9 rounded-xl text-sm" />
              </div>
            ))}
          </div>
          <MetalButton className="mt-4" onClick={save}>Save profile</MetalButton>
        </SectionCard>
      ) : null}

      <SectionCard title="Operational settings" description="Attendance, payroll, leave and security configuration">
        {!settings ? <LoadingBlock /> : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {settings.map((s) => (
              <div key={s.key} className="glass flex items-center justify-between gap-4 rounded-xl px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium">{s.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{s.key} · {s.category}</div>
                </div>
                <div className="shrink-0 rounded-lg border border-border/60 bg-muted px-2.5 py-1 font-mono text-[11px] text-foreground">
                  {typeof s.value === "object" ? JSON.stringify(s.value) : String(s.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ── Workflows ──────────────────────────────────────────────── */

function WorkflowsTab() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["settings-workflows"],
    queryFn: () => api.get<{
      id: string; name: string; docType: string; description: string; isActive: boolean; isDefault: boolean
      stages: { id: string; seq: number; name: string; approverType: string; approverRole: { key: string; name: string } | null; approverUser: { email: string; name: string } | null; strategy: string; minApprovals: number; slaHours: number | null; isFinal: boolean }[]
    }[]>("/settings/workflows"),
  })

  const updateStage = async (stageId: string, strategy: string, minApprovals?: number) => {
    try {
      await api.put(`/settings/workflows/stages/${stageId}`, { strategy, minApprovals })
      toast.success(`Stage strategy set to ${titleCase(strategy)}${minApprovals ? ` · quorum ${minApprovals}` : ""}`)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock /></GlassCard>

  return (
    <div className="space-y-5">
      <KpiStat label="Configured workflows" value={data.length} hint={`${data.filter((w) => w.isDefault).length} active defaults · parallel and quorum stages supported`} icon={<Workflow />} />
      {data.map((w) => (
        <SectionCard key={w.id} title={w.name} description={`${titleCase(w.docType)} · ${w.description}`} actions={<StatusPill status={w.isDefault ? "APPROVED" : "DRAFT"} />}>
          <ol className="space-y-2">
            {w.stages.map((s) => (
              <li key={s.id} className="glass flex flex-wrap items-center gap-3 rounded-xl px-3.5 py-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/70 text-[11px] font-semibold">{s.seq}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium">{s.name}</div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {s.approverRole ? `Role: ${s.approverRole.name}` : s.approverUser ? `User: ${s.approverUser.name}` : "—"}
                    {s.slaHours ? ` · SLA ${s.slaHours}h` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {["ANY", "ALL", "QUORUM"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateStage(s.id, st, st === "QUORUM" ? 2 : undefined)}
                      className={cn(
                        "glass rounded-lg px-2.5 py-1 text-[10.5px] transition-colors",
                        s.strategy === st ? "border-[color:var(--chart-1)]/60 text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {titleCase(st)}
                    </button>
                  ))}
                </div>
                {s.isFinal ? <span className="text-[9px] tracking-widest text-muted-foreground uppercase">final</span> : null}
              </li>
            ))}
          </ol>
        </SectionCard>
      ))}
    </div>
  )
}

/* ── Users ───────────────────────────────────────────────────── */

function UsersTab() {
  const queryClient = useQueryClient()
  const [q, setQ] = React.useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["settings-users", q],
    queryFn: () => api.get<{ total: number; items: { id: string; email: string; status: string; isDemo: boolean; lastLoginAt: string | null; employee: { employeeCode: string; fullName: string; photoSeed: number; designation: { title: string | null } | null } | null; roles: { key: string; name: string; department: string | null }[] }[] }>(`/settings/users?q=${encodeURIComponent(q)}`),
  })
  const { data: roles } = useQuery({
    queryKey: ["settings-roles-list"],
    queryFn: () => api.get<{ roles: { key: string; name: string }[] }>("/settings/roles"),
  })

  const assign = async (email: string, roleKey: string) => {
    try {
      await api.post("/settings/users/assign-role", { email, roleKey })
      toast.success(`Role ${titleCase(roleKey)} assigned to ${email}`)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assign failed")
    }
  }

  const reset = async (userId: string, name: string) => {
    try {
      const res = await api.post<{ temporaryPassword: string }>(`/settings/users/${userId}/reset-password`)
      toast.success(`Temporary password for ${name}: ${res.temporaryPassword}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed")
    }
  }

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock /></GlassCard>

  return (
    <div className="space-y-5">
      <GlassCard hover={false} className="flex flex-wrap items-center gap-3 p-3">
        <UserCog className="size-4 text-[color:var(--chart-1)]" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users by email or name…" className="glass h-9 flex-1 rounded-xl text-sm" />
        <span className="text-xs text-muted-foreground">{data.total} accounts</span>
      </GlassCard>

      <SectionCard title="User accounts" description="Roles, status and account operations">
        <DataTable
          rows={data.items}
          rowKey={(u) => u.id}
          columns={[
            {
              key: "u", header: "User",
              render: (u) => (
                <div className="flex items-center gap-3">
                  <Avatar name={u.employee?.fullName ?? u.email} seed={u.employee?.photoSeed ?? 0} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium">{u.employee?.fullName ?? "—"}</div>
                    <div className="truncate text-[10.5px] text-muted-foreground">{u.email}</div>
                  </div>
                </div>
              ),
            },
            { key: "r", header: "Roles", render: (u) => <span className="flex flex-wrap gap-1">{u.roles.map((r) => <StatusPill key={r.key} status={r.key} className="border-border bg-muted text-muted-foreground" />)}</span> },
            { key: "l", header: "Last login", render: (u) => <span className="text-[11.5px] text-muted-foreground">{u.lastLoginAt ? relTime(u.lastLoginAt) : "never"}</span> },
            { key: "s", header: "Status", render: (u) => <StatusPill status={u.status} /> },
            {
              key: "a", header: "", align: "right",
              render: (u) => (
                <div className="flex justify-end gap-1">
                  {roles ? (
                    <select className="glass h-7 rounded-lg px-1.5 text-[10.5px] outline-none" defaultValue="" onChange={(e) => e.target.value && assign(u.email, e.target.value)}>
                      <option value="" disabled>assign…</option>
                      {roles.roles.filter((r) => !u.roles.some((x) => x.key === r.key)).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
                    </select>
                  ) : null}
                  <MetalButton variant="ghost" className="px-2 py-0.5 text-[10.5px]" onClick={() => reset(u.id, u.employee?.fullName ?? u.email)}>Reset pwd</MetalButton>
                </div>
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  )
}

/* ── Roles ──────────────────────────────────────────────────── */

function RolesTab() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["settings-roles"],
    queryFn: () => api.get<{
      roles: { key: string; name: string; description: string; isSystem: boolean; scope: string; userCount: number; permissionCount: number; permissions: string[] }[]
      allPermissions: { key: string; module: string; action: string; description: string }[]
      modules: Record<string, string>
    }>("/settings/roles"),
  })
  const [editing, setEditing] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<string[]>([])

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock /></GlassCard>

  const save = async (roleKey: string, permissions: string[]) => {
    try {
      await api.put("/settings/roles/permissions", { roleKey, permissions })
      toast.success(`${titleCase(roleKey)} now grants ${permissions.length} permissions`)
      setEditing(null)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  return (
    <div className="space-y-5">
      {data.roles.map((r) => (
        <SectionCard
          key={r.key}
          title={`${r.name}${r.isSystem ? " · system" : " · custom"}`}
          description={`${r.description} · ${r.scope} scope · ${r.userCount} holders`}
          actions={
            editing === r.key ? (
              <div className="flex gap-1.5">
                <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => setEditing(null)}>Cancel</MetalButton>
                <MetalButton className="px-2.5 py-1 text-[11px]" onClick={() => save(r.key, draft)}>Save ({draft.length})</MetalButton>
              </div>
            ) : (
              <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => { setEditing(r.key); setDraft(r.permissions) }}>
                Edit permissions
              </MetalButton>
            )
          }
        >
          {editing === r.key ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.modules).map(([module, label]) => {
                const perms = data.allPermissions.filter((p) => p.module === module)
                if (perms.length === 0) return null
                return (
                  <div key={module} className="glass rounded-xl p-3">
                    <div className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
                    <div className="space-y-1">
                      {perms.map((p) => (
                        <label key={p.key} className="flex cursor-pointer items-center gap-2 text-[11.5px]">
                          <input
                            type="checkbox"
                            checked={draft.includes(p.key)}
                            onChange={(e) => setDraft(e.target.checked ? [...draft, p.key] : draft.filter((x) => x !== p.key))}
                            className="size-3.5 accent-[color:var(--chart-1)]"
                          />
                          <span className="truncate" title={p.description}>{p.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {r.permissions.length === 0 ? <span className="text-xs text-muted-foreground">No permissions granted</span> : null}
              {Object.entries(data.modules).map(([module, label]) => {
                const count = r.permissions.filter((p) => p.startsWith(module + ":")).length
                if (count === 0) return null
                return <span key={module} className="glass rounded-full px-2.5 py-1 text-[10.5px] text-muted-foreground">{label} · {count}</span>
              })}
            </div>
          )}
        </SectionCard>
      ))}
    </div>
  )
}

/* ── Audit ──────────────────────────────────────────────────── */

function AuditTab() {
  const [page, setPage] = React.useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ["audit", page],
    queryFn: () => api.get<{ total: number; items: { id: string; action: string; module: string; summary: string; actorEmail: string; entityType: string | null; createdAt: string }[] }>(`/settings/audit?page=${page}`),
  })
  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock /></GlassCard>

  return (
    <div className="space-y-5">
      <KpiStat label="Audit entries" value={data.total} icon={<ScrollText />} />
      <SectionCard title="Audit trail" description="Every significant action, module and actor">
        <DataTable
          rows={data.items}
          rowKey={(a) => a.id}
          columns={[
            { key: "t", header: "Time", render: (a) => <span className="text-[11.5px] text-muted-foreground">{fmtDateTime(a.createdAt)}</span> },
            { key: "a", header: "Action", render: (a) => <StatusPill status={a.action} className="border-border bg-muted text-muted-foreground" /> },
            { key: "m", header: "Module", render: (a) => <span className="text-[12px]">{titleCase(a.module)}</span> },
            { key: "s", header: "Summary", render: (a) => <span className="block max-w-80 truncate text-[12px]">{a.summary}</span> },
            { key: "e", header: "Actor", render: (a) => <span className="text-[11.5px] text-muted-foreground">{a.actorEmail}</span> },
          ]}
          footer={
            <div className="flex items-center justify-between border-t border-border/60 px-3.5 py-2 text-xs text-muted-foreground">
              <span>Page {page} · {data.total} entries</span>
              <span className="flex gap-1">
                <MetalButton variant="ghost" className="px-2 py-0.5 text-[11px]" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</MetalButton>
                <MetalButton variant="ghost" className="px-2 py-0.5 text-[11px]" disabled={page * 30 >= data.total} onClick={() => setPage(page + 1)}>Next</MetalButton>
              </span>
            </div>
          }
        />
      </SectionCard>
    </div>
  )
}

/* ── My account ─────────────────────────────────────────────── */

function AccountTab() {
  const { session } = useSession()
  const [current, setCurrent] = React.useState("")
  const [next, setNext] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const changePassword = async () => {
    if (next.length < 8) return toast.error("New password must be at least 8 characters")
    setBusy(true)
    try {
      await api.post("/auth/change-password", { currentPassword: current, newPassword: next })
      toast.success("Password updated")
      setCurrent(""); setNext("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Change failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Account & security" description="Your identity, roles and session">
        {!session ? null : (
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={session.user.name} seed={session.user.photoSeed} size={56} />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold">{session.user.name}</div>
              <div className="text-[12px] text-muted-foreground">{session.user.email} · {session.user.employeeCode}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {session.roles.map((r) => <StatusPill key={r.key} status={r.key} className="border-border bg-muted text-muted-foreground" />)}
              </div>
            </div>
          </div>
        )}
        <div className="champagne-line my-4" />
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Current password</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="glass h-9 rounded-xl text-sm" />
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">New password</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="glass h-9 rounded-xl text-sm" />
          </div>
        </div>
        <MetalButton className="mt-4" onClick={changePassword} disabled={busy}><KeyRound className="mr-1.5 size-4" />{busy ? "Updating…" : "Change password"}</MetalButton>
      </SectionCard>
    </div>
  )
}
