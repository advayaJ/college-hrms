"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CalendarCheck2, CalendarDays, Plane, Scale, Send } from "lucide-react"
import { api } from "@/lib/api"
import { navigate } from "@/lib/router"
import { fmtDate, fmtDays, relTime, titleCase } from "@/lib/format"
import {
  Column, DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton, PageHeader,
  SectionCard, StatusPill,
} from "@/components/glass/kit"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface LeaveType { id: string; code: string; name: string; description: string; annualQuota: number; paid: boolean; carryForward: boolean; maxConsecutiveDays: number | null }
interface LeaveBalance { leaveTypeId: string; code: string; name: string; paid: boolean; entitled: number; carriedForward: number; used: number; pending: number; available: number }
interface LeaveApp {
  id: string; referenceNo: string
  employee: { employeeCode: string; fullName: string; department: { name: string | null } | null }
  leaveType: { name: string; code: string; paid: boolean }
  fromDate: string; toDate: string; days: number
  reason: string; status: string; appliedAt: string; decidedAt: string | null
  decisionNote: string | null; approvalRequestId: string | null
}

export default function LeaveModule() {
  const [tab, setTab] = React.useState("mine")
  return (
    <div className="space-y-5">
      <PageHeader
        title="Leave Management"
        subtitle="Balances, applications, team calendar and workflow outcomes"
        icon={<Scale />}
        actions={<ApplyLeaveDialog><MetalButton><Plane className="mr-1.5 size-4" /> Apply for leave</MetalButton></ApplyLeaveDialog>}
      />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="mine" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">My applications</TabsTrigger>
          <TabsTrigger value="balances" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Balances</TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Applications</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="mine"><MyApplications /></TabsContent>
        <TabsContent value="balances"><BalancesView /></TabsContent>
        <TabsContent value="team"><AllApplications /></TabsContent>
        <TabsContent value="calendar"><LeaveCalendar /></TabsContent>
      </Tabs>
    </div>
  )
}

function useLeaveBalances() {
  return useQuery({
    queryKey: ["leave-balances"],
    queryFn: () => api.get<{ year: number; balances: LeaveBalance[] }>("/leave/balances"),
  })
}

function BalancesView() {
  const { data, isLoading } = useLeaveBalances()
  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading balances" /></GlassCard>
  const totalAvailable = data.balances.reduce((s, b) => s + b.available, 0)
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat label="Total available" value={totalAvailable} unit="days" icon={<CalendarDays />} tone="gold" />
        <KpiStat label="Used this year" value={data.balances.reduce((s, b) => s + b.used, 0)} unit="days" icon={<CalendarCheck2 />} />
        <KpiStat label="Pending" value={data.balances.reduce((s, b) => s + b.pending, 0)} unit="days" icon={<Send />} tone="warning" />
      </div>
      <SectionCard title={`Leave entitlements — ${data.year}`} description="Carry-forward applies to earned leave only">
        <DataTable
          rows={data.balances}
          rowKey={(b) => b.leaveTypeId}
          columns={[
            { key: "n", header: "Category", render: (b) => <div><div className="text-[13px] font-medium">{b.name}</div><div className="text-[10.5px] text-muted-foreground">{b.code} · {b.paid ? "paid" : "unpaid"}</div></div> },
            { key: "e", header: "Entitled", align: "right", render: (b) => <span className="text-[12.5px]">{b.entitled}</span> },
            { key: "u", header: "Used", align: "right", render: (b) => <span className="text-[12.5px]">{b.used}</span> },
            { key: "p", header: "Pending", align: "right", render: (b) => <span className={`text-[12.5px] ${b.pending > 0 ? "text-amber-500/90" : ""}`}>{b.pending}</span> },
            { key: "a", header: "Available", align: "right", render: (b) => <span className="text-[13px] font-semibold text-[color:var(--chart-1)]">{b.available}</span> },
          ]}
        />
      </SectionCard>
    </div>
  )
}

function MyApplications() {
  const { data, isLoading } = useQuery({
    queryKey: ["leave-applications", "mine"],
    queryFn: () => api.get<{ items: LeaveApp[]; total: number }>("/leave/applications?mine=1&pageSize=25"),
  })
  const queryClient = useQueryClient()

  const cancel = async (refNo: string) => {
    try {
      await api.post(`/leave/applications/${refNo}/cancel`)
      toast.success(`${refNo} cancelled — balance restored`)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel")
    }
  }

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading applications" /></GlassCard>
  return (
    <SectionCard title="My applications" description="Full decision history per request">
      {data.items.length === 0 ? <EmptyState title="No applications yet" hint="Apply for leave using the button above." /> : (
        <DataTable
          rows={data.items}
          rowKey={(r) => r.referenceNo}
          columns={[
            { key: "r", header: "Reference", render: (r) => <span className="font-mono text-[11.5px]">{r.referenceNo}</span> },
            { key: "t", header: "Type", render: (r) => <span className="text-[12.5px] font-medium">{r.leaveType.name}</span> },
            { key: "d", header: "Dates", render: (r) => <span className="text-[12px]">{fmtDate(r.fromDate)} → {fmtDate(r.toDate)}</span> },
            { key: "n", header: "Duration", align: "right", render: (r) => <span className="text-[12.5px]">{fmtDays(r.days)}</span> },
            { key: "a", header: "Applied", render: (r) => <span className="text-[11px] text-muted-foreground">{relTime(r.appliedAt)}</span> },
            { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            {
              key: "act", header: "", align: "right",
              render: (r) => (
                <div className="flex justify-end gap-1.5">
                  {r.approvalRequestId ? (
                    <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => navigate(`#/approvals/${r.approvalRequestId}`)}>Workflow</MetalButton>
                  ) : null}
                  {["PENDING", "APPROVED"].includes(r.status) ? (
                    <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => cancel(r.referenceNo)}>Cancel</MetalButton>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}
    </SectionCard>
  )
}

function AllApplications() {
  const [status, setStatus] = React.useState<string | undefined>()
  const [page, setPage] = React.useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ["leave-applications", "all", status, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (status && status !== "all") params.set("status", status)
      return api.get<{ items: LeaveApp[]; total: number; pageSize: number }>(`/leave/applications?${params}`)
    },
  })

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading" /></GlassCard>

  return (
    <SectionCard
      title="Leave applications"
      description={`${data.total} in scope${status && status !== "all" ? ` · filtered to ${titleCase(status)}` : ""}`}
      actions={
        <Select value={status ?? "all"} onValueChange={(v) => { setStatus(v === "all" ? undefined : v); setPage(1) }}>
          <SelectTrigger className="glass h-8 w-36 rounded-xl text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            {["all", "PENDING", "APPROVED", "REJECTED", "RETURNED", "CANCELLED"].map((s) => (
              <SelectItem key={s} value={s} className="rounded-lg text-[13px]">{s === "all" ? "Any status" : titleCase(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <DataTable
        rows={data.items}
        rowKey={(r) => r.referenceNo}
        columns={[
          {
            key: "e", header: "Employee",
            render: (r) => (
              <div>
                <div className="text-[12.5px] font-medium">{r.employee.fullName}</div>
                <div className="text-[10px] text-muted-foreground">{r.employee.employeeCode} · {r.employee.department?.name ?? "—"}</div>
              </div>
            ),
          },
          { key: "t", header: "Type", render: (r) => <span className="text-[12px]">{r.leaveType.name}</span> },
          { key: "d", header: "Dates", render: (r) => <span className="text-[12px]">{fmtDate(r.fromDate)} → {fmtDate(r.toDate)}</span> },
          { key: "n", header: "Days", align: "right", render: (r) => <span className="text-[12.5px]">{fmtDays(r.days)}</span> },
          { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          { key: "w", header: "", align: "right", render: (r) => r.approvalRequestId ? <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => navigate(`#/approvals/${r.approvalRequestId}`)}>Workflow</MetalButton> : null },
        ]}
        footer={
          <div className="flex items-center justify-between border-t border-border/60 px-3.5 py-2 text-xs text-muted-foreground">
            <span>Page {page} of {Math.ceil(data.total / data.pageSize)}</span>
            <span className="flex gap-1">
              <MetalButton variant="ghost" className="px-2 py-0.5 text-[11px]" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</MetalButton>
              <MetalButton variant="ghost" className="px-2 py-0.5 text-[11px]" disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Next</MetalButton>
            </span>
          </div>
        }
      />
    </SectionCard>
  )
}

function LeaveCalendar() {
  const now = new Date()
  const [month, setMonth] = React.useState(now.getUTCMonth() + 1)
  const [year, setYear] = React.useState(now.getUTCFullYear())
  const { data, isLoading } = useQuery({
    queryKey: ["leave-calendar", month, year],
    queryFn: () => api.get<{ month: number; year: number; employees: number; dayMap: Record<string, { code: string; name: string; type: string }[]> }>(`/leave/calendar?month=${month}&year=${year}`),
  })

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading calendar" /></GlassCard>

  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div className="space-y-4">
      <GlassCard hover={false} className="flex flex-wrap items-center gap-3 p-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="glass h-9 w-40 rounded-xl text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i} value={String(i + 1)} className="rounded-lg text-[13px]">{new Date(Date.UTC(2020, i, 1)).toLocaleString("en-IN", { month: "long" })}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="glass h-9 w-28 rounded-xl text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            {[2026, 2025].map((y) => <SelectItem key={y} value={String(y)} className="rounded-lg text-[13px]">{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">{data.employees} employees on approved leave this month</span>
      </GlassCard>

      <SectionCard title={`Approved leave — ${new Date(Date.UTC(year, month - 1)).toLocaleString("en-IN", { month: "long", year: "numeric" })}`} description="Hover a date to see who is away">
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] tracking-widest text-muted-foreground uppercase">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day == null) return <div key={`e-${i}`} />
            const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const away = data.dayMap[key] ?? []
            const today = new Date().toISOString().slice(0, 10) === key
            return (
              <div
                key={key}
                title={away.map((a) => `${a.name} (${a.type})`).join("\n")}
                className={`glass relative flex min-h-16 flex-col rounded-xl p-1.5 ${today ? "border-[color:var(--chart-1)]/60" : ""}`}
              >
                <span className={`text-[11px] ${today ? "font-bold text-[color:var(--chart-1)]" : "text-muted-foreground"}`}>{day}</span>
                {away.length > 0 ? (
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {away.slice(0, 4).map((a, j) => (
                      <span key={j} className="rounded-full bg-[color:var(--chart-2)]/40 px-1.5 py-0.5 text-[8.5px] text-muted-foreground">{a.type}</span>
                    ))}
                    {away.length > 4 ? <span className="text-[8.5px] text-muted-foreground">+{away.length - 4}</span> : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

/* ── Apply dialog ─────────────────────────────────────────────── */

function ApplyLeaveDialog({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const { data: types } = useQuery({
    queryKey: ["leave-types"],
    queryFn: () => api.get<LeaveType[]>("/leave/types"),
    enabled: open,
  })
  const { data: balances } = useLeaveBalances()
  const [form, setForm] = React.useState({
    leaveTypeId: "", fromDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    toDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    reason: "", contactDuringLeave: "",
  })

  const days = Math.max(0, Math.round(((new Date(form.toDate).getTime() - new Date(form.fromDate).getTime()) / 86400000) + 1)) || 0
  const selectedBalance = balances?.balances.find((b) => b.leaveTypeId === form.leaveTypeId)

  const submit = async () => {
    if (!form.leaveTypeId) return toast.error("Pick a leave category")
    if (form.reason.trim().length < 10) return toast.error("Give a reason of at least 10 characters")
    setSaving(true)
    try {
      const res = await api.post<{ referenceNo: string; approvalRef: string; days: number; workflow: string }>("/leave/apply", form)
      toast.success(`${res.referenceNo} submitted — ${res.days} day(s) via ${res.workflow}`)
      setOpen(false)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit application")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="liquid rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Apply for leave</DialogTitle>
          <p className="text-xs text-muted-foreground">Validated against balance, overlaps and consecutive-day limits, then routed through the configured approval workflow.</p>
        </DialogHeader>
        <div className="grid gap-3.5">
          <div>
            <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Leave category</Label>
            <Select value={form.leaveTypeId} onValueChange={(v) => setForm({ ...form, leaveTypeId: v })}>
              <SelectTrigger className="glass h-9 w-full rounded-xl text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent className="liquid rounded-xl">
                {(types ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id} className="rounded-lg text-[13px]">
                    {t.name} <span className="ml-1 text-[10px] text-muted-foreground">({t.annualQuota}/yr)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBalance ? (
              <p className="mt-1.5 text-[10.5px] text-muted-foreground">
                Available balance: <span className="font-semibold text-[color:var(--chart-1)]">{selectedBalance.available}</span> days
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">From</Label><Input type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} className="glass h-9 rounded-xl text-sm" /></div>
            <div><Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">To</Label><Input type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} className="glass h-9 rounded-xl text-sm" /></div>
          </div>
          <div className="glass rounded-xl px-3 py-2 text-[11.5px] text-muted-foreground">
            Duration: <span className="font-semibold text-foreground">{days}</span> day(s)
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Reason</Label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Family function at native place…" className="glass min-h-20 w-full rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60" />
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Contact during leave</Label>
            <Input value={form.contactDuringLeave} onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })} placeholder="+91-… (optional)" className="glass h-9 rounded-xl text-sm" />
          </div>
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <MetalButton variant="ghost" onClick={() => setOpen(false)}>Cancel</MetalButton>
          <MetalButton onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit application"}</MetalButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
