"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, CalendarDays, ClipboardCheck, FileClock, Wrench } from "lucide-react"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { navigate } from "@/lib/router"
import { fmtDate, fmtTime, relTime, titleCase } from "@/lib/format"
import {
  ChartFrame, Column, DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton,
  PageHeader, SectionCard, StatusPill,
} from "@/components/glass/kit"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--glass-border)", borderRadius: "12px", fontSize: "12px", color: "var(--foreground)" },
  labelStyle: { color: "var(--muted-foreground)", fontSize: "11px" },
}

export default function AttendanceModule() {
  const { session } = useSession()
  const isSelf = session ? !session.permissions.some((p) => p.startsWith("attendance:read_all") || p.startsWith("attendance:read_dept")) || session.activeRoleKey === "FACULTY" || session.activeRoleKey === "NON_TEACHING_STAFF" || session.activeRoleKey === "TECHNICAL_STAFF" : false
  const [tab, setTab] = React.useState(isSelf ? "self" : "daily")

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance" subtitle="Daily records, monthly analytics, corrections and anomalies" icon={<FileClock />} />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="glass rounded-xl p-1">
          {!isSelf ? <TabsTrigger value="daily" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Daily register</TabsTrigger> : null}
          {!isSelf ? <TabsTrigger value="monthly" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Monthly</TabsTrigger> : null}
          <TabsTrigger value="self" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">My attendance</TabsTrigger>
          <TabsTrigger value="corrections" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Corrections</TabsTrigger>
        </TabsList>

        {!isSelf ? <TabsContent value="daily"><DailyRegister /></TabsContent> : null}
        {!isSelf ? <TabsContent value="monthly"><MonthlyView /></TabsContent> : null}
        <TabsContent value="self"><SelfView /></TabsContent>
        <TabsContent value="corrections"><CorrectionsView /></TabsContent>
      </Tabs>
    </div>
  )
}

/* ── Daily register ───────────────────────────────────────────── */

function DailyRegister() {
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const { data, isLoading } = useQuery({
    queryKey: ["attendance-day", date],
    queryFn: () => api.get<{
      date: string
      rows: { employeeCode: string; name: string; department: string | null; status: string; inTime: string | null; outTime: string | null; workedHours: number | null; isManual: boolean; source: string | null; punchCount: number }[]
      counts: Record<string, number>
      anomalies: { type: string; employeeCode: string; name: string; detail: string }[]
      total: number
    }>(`/attendance/day/${date}`),
  })

  return (
    <div className="space-y-5">
      <GlassCard hover={false} className="flex flex-wrap items-center gap-3 p-3">
        <CalendarDays className="size-4 text-[color:var(--chart-1)]" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass h-9 w-40 rounded-xl text-sm" />
        <span className="ml-auto text-xs text-muted-foreground">
          {data ? `${data.total} staff · ${Object.entries(data.counts).filter(([k]) => k !== "NO_RECORD").reduce((s, [, v]) => s + v, 0)} recorded` : ""}
        </span>
      </GlassCard>

      {isLoading || !data ? (
        <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading register" /></GlassCard>
      ) : (
        <React.Fragment>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {["PRESENT", "ON_LEAVE", "ABSENT", "HALF_DAY", "OFFICIAL_DUTY"].map((k) => (
              <KpiStat key={k} label={titleCase(k)} value={data.counts[k] ?? 0} tone={k === "ABSENT" ? "critical" : k === "ON_LEAVE" ? "warning" : "default"} />
            ))}
          </div>

          {data.anomalies.length > 0 ? (
            <SectionCard title="Anomalies" description="Missing punches and unmatched records" actions={<StatusPill status="RETURNED" className="border-orange-500/30 bg-orange-500/15 text-orange-500" />}>
              <ul className="grid gap-2 sm:grid-cols-2">
                {data.anomalies.slice(0, 8).map((a, i) => (
                  <li key={i} className="glass flex items-center gap-3 rounded-xl px-3 py-2 text-[12.5px]">
                    <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
                    <span className="min-w-0 flex-1 truncate">{a.name} — <span className="text-muted-foreground">{a.detail}</span></span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          <SectionCard title="Day register" description={`${data.date} · biometric and manual entries`}>
            <DataTable
              rows={data.rows}
              rowKey={(r) => r.employeeCode}
              columns={[
                { key: "n", header: "Employee", render: (r) => <div><div className="text-[13px] font-medium">{r.name}</div><div className="font-mono text-[10.5px] text-muted-foreground">{r.employeeCode} · {r.department ?? "—"}</div></div> },
                { key: "in", header: "In", render: (r) => <span className="font-mono text-[12px]">{fmtTime(r.inTime)}</span> },
                { key: "out", header: "Out", render: (r) => <span className="font-mono text-[12px]">{fmtTime(r.outTime)}</span> },
                { key: "h", header: "Hours", align: "right", render: (r) => <span className="text-[12.5px]">{r.workedHours ? `${r.workedHours}h` : "—"}</span> },
                { key: "p", header: "Punches", align: "center", render: (r) => <span className="text-[12px] text-muted-foreground">{r.punchCount}</span> },
                { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
                { key: "m", header: "", render: (r) => r.isManual ? <span className="text-[10px] text-muted-foreground" title="Manual entry">manual</span> : null },
              ]}
            />
          </SectionCard>
        </React.Fragment>
      )}
    </div>
  )
}

/* ── Monthly view ─────────────────────────────────────────────── */

function MonthlyView() {
  const now = new Date()
  const [month, setMonth] = React.useState(now.getUTCMonth() + 1)
  const [year, setYear] = React.useState(now.getUTCFullYear())
  const { data, isLoading } = useQuery({
    queryKey: ["attendance-monthly", month, year],
    queryFn: () => api.get<{
      days: { date: string; present: number; absent: number; onLeave: number; off: number; total: number }[]
      byDepartment: { department: string; present: number; absent: number; onLeave: number; total: number }[]
      averageRate: number
      lowAttendance: { employeeCode: string; name: string; department: string | null; rate: number; present: number; absent: number; onLeave: number }[]
    }>(`/attendance/monthly?month=${month}&year=${year}`),
  })

  return (
    <div className="space-y-5">
      <GlassCard hover={false} className="flex flex-wrap items-center gap-3 p-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="glass h-9 w-40 rounded-xl text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i} value={String(i + 1)} className="rounded-lg text-[13px]">
                {new Date(Date.UTC(2020, i, 1)).toLocaleString("en-IN", { month: "long" })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="glass h-9 w-28 rounded-xl text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            {[2026, 2025].map((y) => <SelectItem key={y} value={String(y)} className="rounded-lg text-[13px]">{y}</SelectItem>)}
          </SelectContent>
        </Select>
        {data ? <span className="ml-auto text-sm text-muted-foreground">Average rate <span className="font-semibold text-[color:var(--chart-1)]">{data.averageRate}%</span></span> : null}
      </GlassCard>

      {isLoading || !data ? <GlassCard hover={false} className="p-6"><LoadingBlock label="Aggregating" /></GlassCard> : (
        <React.Fragment>
          <ChartFrame title="Daily attendance" description={`Present · absent · on-leave — ${new Date(Date.UTC(year, month - 1)).toLocaleString("en-IN", { month: "long", year: "numeric" })}`}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(8)} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={34} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="present" name="Present" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="onLeave" name="On leave" stackId="a" fill="var(--chart-2)" />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="var(--destructive)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartFrame title="By department" description="Attendance health across departments">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.byDepartment.slice(0, 10)} layout="vertical" margin={{ left: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="department" tick={{ fontSize: 9.5, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={130} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="present" name="Present" stackId="a" fill="var(--chart-1)" />
                  <Bar dataKey="absent" name="Absent" stackId="a" fill="var(--destructive)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>

            <SectionCard title="Attention list" description="Below 80% attendance this month">
              {data.lowAttendance.length === 0 ? <EmptyState title="All above 80%" hint="No individual attendance concerns this month." /> : (
                <DataTable
                  rows={data.lowAttendance}
                  rowKey={(r) => r.employeeCode}
                  onRowClick={(r) => navigate(`#/employees/${r.employeeCode}`)}
                  columns={[
                    { key: "n", header: "Employee", render: (r) => <div><div className="text-[12.5px] font-medium">{r.name}</div><div className="text-[10px] text-muted-foreground">{r.employeeCode} · {r.department ?? "—"}</div></div> },
                    { key: "d", header: "P / A / L", render: (r) => <span className="text-[12px] text-muted-foreground">{r.present} / {r.absent} / {r.onLeave}</span> },
                    { key: "r", header: "Rate", align: "right", render: (r) => <span className={`text-[13px] font-semibold ${r.rate < 70 ? "text-[color:var(--destructive)]" : "text-amber-500/90"}`}>{r.rate}%</span> },
                  ]}
                />
              )}
            </SectionCard>
          </div>
        </React.Fragment>
      )}
    </div>
  )
}

/* ── Self view ─────────────────────────────────────────────────── */

function SelfView() {
  const { data, isLoading } = useQuery({
    queryKey: ["attendance-self"],
    queryFn: () => api.get<{
      records: { date: string; status: string; inTime: string | null; outTime: string | null; workedHours: number | null; isManual: boolean; source: string }[]
      punches: { timestamp: string; direction: string; source: string }[]
      corrections: { referenceNo: string; date: string; status: string; reason: string; appliedAt: string }[]
      monthStats: { month: string; presentDays: number; recordedDays: number }
    }>("/attendance/self"),
  })
  const [correctionOpen, setCorrectionOpen] = React.useState(false)

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading your attendance" /></GlassCard>

  const presentish = data.records.filter((r) => ["PRESENT", "HALF_DAY", "WFH", "OFFICIAL_DUTY"].includes(r.status)).length

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat label="Present days (month)" value={data.monthStats.presentDays} icon={<ClipboardCheck />} tone="success" />
        <KpiStat label="Recorded days" value={data.monthStats.recordedDays} icon={<CalendarDays />} />
        <KpiStat label="Present (60 days)" value={presentish} icon={<ClipboardCheck />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="My records — last 60 days">
          <DataTable
            rows={data.records.slice(0, 30)}
            rowKey={(r) => r.date}
            columns={[
              { key: "d", header: "Date", render: (r) => <span className="text-[12.5px]">{fmtDate(r.date)}</span> },
              { key: "i", header: "In", render: (r) => <span className="font-mono text-[12px]">{fmtTime(r.inTime)}</span> },
              { key: "o", header: "Out", render: (r) => <span className="font-mono text-[12px]">{fmtTime(r.outTime)}</span> },
              { key: "h", header: "Hours", align: "right", render: (r) => <span className="text-[12px]">{r.workedHours ? `${r.workedHours}h` : "—"}</span> },
              { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Recent punches" description="Biometric stream">
            <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {data.punches.slice(0, 12).map((p, i) => (
                <li key={i} className="glass flex items-center gap-3 rounded-lg px-3 py-1.5 text-[12px]">
                  <span className={`size-1.5 rounded-full ${p.direction === "IN" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className="flex-1">{new Date(p.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                  <span className="text-[10px] text-muted-foreground">{titleCase(p.direction)} · {titleCase(p.source)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
          <RequestCorrection open={correctionOpen} setOpen={setCorrectionOpen} />
        </div>
      </div>
    </div>
  )
}

function RequestCorrection({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState({ date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), requestedIn: "09:30", requestedOut: "17:30", reason: "" })
  const [saving, setSaving] = React.useState(false)

  const submit = async () => {
    if (form.reason.trim().length < 8) {
      toast.error("Give a reason of at least 8 characters")
      return
    }
    setSaving(true)
    try {
      const res = await api.post<{ referenceNo: string }>("/attendance/corrections", form)
      toast.success(`Correction ${res.referenceNo} submitted — routed to HOD, then HR`)
      setOpen(false)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit correction")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <GlassCard hover={false} className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold">Missing punch?</div>
          <div className="text-[10.5px] text-muted-foreground">Request an attendance correction</div>
        </div>
        <MetalButton onClick={() => setOpen(true)} className="shrink-0"><Wrench className="mr-1.5 size-4" /> Correct</MetalButton>
      </GlassCard>
      <DialogContent className="liquid rounded-2xl max-w-md">
        <DialogHeader><DialogTitle className="text-[15px]">Attendance correction</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="glass h-9 rounded-xl text-sm" /></div>
            <div><Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">In</Label><Input type="time" value={form.requestedIn} onChange={(e) => setForm({ ...form, requestedIn: e.target.value })} className="glass h-9 rounded-xl text-sm" /></div>
            <div><Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Out</Label><Input type="time" value={form.requestedOut} onChange={(e) => setForm({ ...form, requestedOut: e.target.value })} className="glass h-9 rounded-xl text-sm" /></div>
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Reason</Label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Biometric device was down; punch slip attached…"
              className="glass min-h-20 w-full rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <p className="text-[10.5px] text-muted-foreground">Corrections follow the standard approval workflow: HOD confirmation → HR application.</p>
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <MetalButton variant="ghost" onClick={() => setOpen(false)}>Cancel</MetalButton>
          <MetalButton onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit correction"}</MetalButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Corrections list ─────────────────────────────────────────── */

function CorrectionsView() {
  const { data, isLoading } = useQuery({
    queryKey: ["attendance-corrections"],
    queryFn: () => api.get<{
      id: string; referenceNo: string; employee: { code: string; name: string; department: string | null }
      date: string; requestedIn: string | null; requestedOut: string | null; reason: string
      status: string; appliedAt: string; decidedAt: string | null; decisionNote: string | null; approvalRequestId: string | null
    }[]>("/attendance/corrections"),
  })

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading corrections" /></GlassCard>

  return (
    <SectionCard title="Attendance corrections" description="Requests and their workflow outcomes">
      {data.length === 0 ? <EmptyState title="No correction requests" hint="When a punch is missed, request a correction from the My attendance tab." /> : (
        <DataTable
          rows={data}
          rowKey={(r) => r.referenceNo}
          columns={[
            { key: "n", header: "Employee", render: (r) => <div><div className="text-[12.5px] font-medium">{r.employee.name}</div><div className="text-[10px] text-muted-foreground">{r.employee.code} · {r.employee.department ?? "—"}</div></div> },
            { key: "d", header: "Date", render: (r) => <span className="text-[12px]">{fmtDate(r.date)}</span> },
            { key: "t", header: "Requested", render: (r) => <span className="font-mono text-[12px]">{r.requestedIn ? `${fmtTime(r.requestedIn)}–${fmtTime(r.requestedOut)}` : "—"}</span> },
            { key: "r", header: "Reason", render: (r) => <span className="block max-w-56 truncate text-[12px] text-muted-foreground" title={r.reason}>{r.reason}</span> },
            { key: "a", header: "Applied", render: (r) => <span className="text-[11px] text-muted-foreground">{relTime(r.appliedAt)}</span> },
            { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          ]}
        />
      )}
    </SectionCard>
  )
}
