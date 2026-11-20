"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import {
  ArrowRight, BadgeIndianRupee, BellRing, Briefcase, CalendarDays, CheckCircle2, ClipboardList,
  FileClock, GraduationCap, Landmark, ShieldCheck, UserRoundCog, UsersRound, Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api"
import { useSession } from "@/lib/session"
import { navigate } from "@/lib/router"
import { fmtDate, fmtDays, inr, relTime, titleCase } from "@/lib/format"
import { Avatar, ChartFrame, EmptyState, GlassCard, KpiStat, LoadingBlock, SectionCard, StatusPill, MetalButton } from "@/components/glass/kit"

interface DashboardData {
  roleKey: string
  unreadNotifications: number
  pendingApprovals: { count: number; top: { id: string; referenceNo: string; docType: string; title: string; initiatorName: string; stage: string; submittedAt: string }[] }
  kpis?: { key: string; label: string; value: unknown; hint?: string; unit?: string; format?: string }[]
  charts?: Record<string, unknown>
  [k: string]: unknown
}

interface ActivityItem {
  id: string
  action: string
  module: string
  summary: string
  actorEmail: string
  createdAt: string
  photoSeed: number
}

const CH = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--glass-border)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--foreground)",
    backdropFilter: "blur(18px)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontSize: "11px" },
}

function formatKpi(v: unknown, format?: string): string {
  if (format === "INR") return inr(Number(v))
  return String(v)
}

export default function DashboardModule() {
  const { session } = useSession()
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/dashboard"),
    enabled: !!session,
  })
  const { data: activity } = useQuery({
    queryKey: ["activity"],
    queryFn: () => api.get<ActivityItem[]>("/notifications/activity"),
    enabled: !!session,
  })

  if (isLoading) return <LoadingBlock label="Composing your dashboard" />
  if (error || !data) {
    const message = error instanceof ApiError ? error.message : "Could not load the dashboard"
    return (
      <GlassCard className="p-8" hover={false}>
        <EmptyState title="Dashboard unavailable" hint={message} />
      </GlassCard>
    )
  }

  const role = data.roleKey
  const greeting = `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${session?.user.name.split(" ")[0]}`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 rise-in">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{greeting}</h1>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            <span className="text-muted-foreground/50">·</span>
            <span className="text-[color:var(--chart-1)]">{titleCase(role)}</span>
            {session?.roles.length ? <span className="text-muted-foreground/50">({session.roles.length} roles)</span> : null}
          </p>
        </div>
        <div className="flex gap-2">
          <MetalButton variant="ghost" onClick={() => navigate("#/approvals")}>
            <ClipboardList className="mr-1.5 size-4" /> Approvals
            {data.pendingApprovals.count > 0 ? (
              <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">{data.pendingApprovals.count}</span>
            ) : null}
          </MetalButton>
          <MetalButton onClick={() => navigate(quickLink(role))}>
            {quickLabel(role)} <ArrowRight className="ml-1 size-3.5" />
          </MetalButton>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data.kpis ?? []).map((k) => (
          <KpiStat
            key={k.key}
            label={k.label}
            value={formatKpi(k.value, k.format)}
            unit={k.unit}
            hint={k.hint}
            tone={role === "ACCOUNTANT" && k.key === "lastNet" ? "gold" : "default"}
          />
        ))}
      </div>

      {/* Charts + approvals column */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">{chartsForRole(role, data)}</div>

        <div className="space-y-5">
          <SectionCard
            title="Pending approvals"
            description={data.pendingApprovals.count > 0 ? `${data.pendingApprovals.count} awaiting your action` : "Your queue is clear"}
            actions={<StatusPill status={data.pendingApprovals.count > 0 ? "PENDING" : "COMPLETED"} />}
          >
            {data.pendingApprovals.top.length === 0 ? (
              <EmptyState title="Nothing pending" hint="Approvals routed to you appear here." className="py-6" />
            ) : (
              <ul className="space-y-2">
                {data.pendingApprovals.top.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`#/approvals/${a.id}`)}
                      className="glass glass-hover flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                    >
                      <Avatar name={a.initiatorName || "?"} seed={a.initiatorName.length} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{a.title}</div>
                        <div className="truncate text-[10.5px] text-muted-foreground">
                          {a.initiatorName} · stage: {a.stage} · {relTime(a.submittedAt)}
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Recent activity */}
          <SectionCard title="Recent activity" description="Institution-wide events from the audit trail">
            {!activity || activity.length === 0 ? (
              <EmptyState title="No recent activity" className="py-6" />
            ) : (
              <ul className="max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
                {activity.slice(0, 10).map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <Avatar name={a.summary.slice(0, 2)} seed={a.photoSeed || a.summary.length} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] leading-snug text-foreground/90">{a.summary}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {titleCase(a.module)} · {relTime(a.createdAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function quickLink(role: string): string {
  switch (role) {
    case "HR_ADMIN": return "#/employees"
    case "ACCOUNTANT": return "#/payroll"
    case "HOD": return "#/workload"
    case "PRINCIPAL": return "#/reports"
    case "SUPER_ADMIN": return "#/settings"
    case "FACULTY": return "#/leave"
    default: return "#/attendance"
  }
}

function quickLabel(role: string): string {
  switch (role) {
    case "HR_ADMIN": return "Employee directory"
    case "ACCOUNTANT": return "Run payroll"
    case "HOD": return "Workload"
    case "PRINCIPAL": return "Analytics"
    case "SUPER_ADMIN": return "Administration"
    case "FACULTY": return "My leave"
    default: return "My attendance"
  }
}

/* ── Charts per role ───────────────────────────────────────────── */

function chartsForRole(role: string, data: DashboardData): React.ReactNode {
  const charts = (data.charts ?? {}) as Record<string, never[] | Record<string, unknown>[] | undefined>

  if (role === "SUPER_ADMIN") {
    const staffType = (charts.staffType ?? []) as { name: string; value: number }[]
    const joinings = (charts.joiningsByMonth ?? []) as { month: string; value: number }[]
    const workflowLoad = (data.workflowLoad ?? []) as { docType: string; count: number }[]
    return (
      <React.Fragment>
        <div className="grid gap-5 md:grid-cols-2">
          <ChartFrame title="Workforce mix" description="Teaching · non-teaching · technical">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={staffType} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} strokeWidth={0} label={{ fontSize: 11 }}>
                  {staffType.map((_, i) => <Cell key={i} fill={CH[i % CH.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartFrame>
          <ChartFrame title="Joinings by month" description="Last 12 months">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={joinings}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={26} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" name="Joined" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </div>
        <SectionCard title="System activity" description="Live events across the platform">
          {(data.systemActivity as { action: string; module: string; summary: string; createdAt: string; actor: string }[] | undefined)?.length ? (
            <ul className="space-y-2">
              {(data.systemActivity ?? []).slice(0, 8).map((a, i) => (
                <li key={i} className="glass flex items-center gap-3 rounded-xl px-3 py-2 text-[12.5px]">
                  <ShieldCheck className="size-3.5 shrink-0 text-[color:var(--chart-1)]" />
                  <span className="flex-1 truncate">{a.summary}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{relTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No system activity" />
          )}
        </SectionCard>
      </React.Fragment>
    )
  }

  if (role === "PRINCIPAL") {
    const staffMix = (charts.staffMix ?? []) as { name: string; value: number }[]
    const departments = (data.departments ?? []) as { name: string; hod: string; employeeCount: number }[]
    const approvals = (data.approvalsNeeded ?? []) as { id: string; referenceNo: string; title: string; docType: string; stage: string }[]
    return (
      <React.Fragment>
        <div className="grid gap-5 md:grid-cols-2">
          <ChartFrame title="Staff composition" description="Institution-wide">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={staffMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {staffMix.map((_, i) => <Cell key={i} fill={CH[i % CH.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartFrame>
          <SectionCard title="Department snapshot" description="Strength & leadership">
            <ul className="space-y-1.5">
              {departments.map((d) => (
                <li key={d.name} className="glass flex items-center gap-3 rounded-xl px-3 py-2">
                  <Landmark className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium">{d.name}</div>
                    <div className="truncate text-[10.5px] text-muted-foreground">HOD: {d.hod}</div>
                  </div>
                  <span className="shrink-0 text-[12px] font-semibold text-[color:var(--chart-1)]">{d.employeeCount}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
        <SectionCard title="Awaiting your sanction" description="Items that reach the Principal stage">
          {approvals.length === 0 ? (
            <EmptyState title="Nothing awaits you" hint="Approvals reach the Principal after departmental and HR stages." className="py-5" />
          ) : (
            <ul className="space-y-2">
              {approvals.map((a) => (
                <li key={a.id} className="glass flex items-center gap-3 rounded-xl px-3 py-2.5">
                  <StatusPill status={a.docType} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{a.title}</span>
                  <MetalButton variant="ghost" onClick={() => navigate(`#/approvals/${a.id}`)} className="px-2.5 py-1 text-xs">
                    Review
                  </MetalButton>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </React.Fragment>
    )
  }

  if (role === "HR_ADMIN") {
    const trend = (charts.attendanceTrend ?? []) as { date: string; present: number; absent: number; leave: number }[]
    const probation = (data.probationExpiring ?? []) as { code: string; name: string; date: string }[]
    const today = (charts.today ?? {}) as Record<string, number>
    return (
      <React.Fragment>
        <ChartFrame title="Attendance trend — 14 days" description="Present · absent · on-leave">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={30} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="present" name="Present" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gPresent)" />
              <Area type="monotone" dataKey="absent" name="Absent" stroke="var(--destructive)" strokeWidth={1.5} fill="url(#gAbsent)" />
              <Area type="monotone" dataKey="leave" name="On leave" stroke="var(--chart-2)" strokeWidth={1.5} fillOpacity={0.05} fill="var(--chart-2)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
        <div className="grid gap-5 md:grid-cols-2">
          <SectionCard title="Probation endings — 45 days" description="Confirmation due">
            {probation.length === 0 ? (
              <EmptyState title="No probations ending soon" />
            ) : (
              <ul className="space-y-1.5">
                {probation.map((p) => (
                  <li key={p.code} className="glass flex items-center gap-3 rounded-xl px-3 py-2 text-[12.5px]">
                    <Avatar name={p.name} seed={p.code.length * 31} size={26} />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="shrink-0 text-[10.5px] text-muted-foreground">{fmtDate(p.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          <SectionCard title="Today at a glance" description="Attendance statuses across the university">
            <ul className="grid grid-cols-2 gap-2">
              {Object.entries(today).map(([status, count]) => (
                <li key={status} className="glass flex items-center justify-between rounded-xl px-3 py-2.5">
                  <StatusPill status={status} />
                  <span className="text-lg font-semibold">{count as number}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-[11px] text-muted-foreground">
              {data.docExpiring as number} documents expire within 30 days —{" "}
              <button className="text-[color:var(--chart-1)] underline-offset-2 hover:underline" onClick={() => navigate("#/documents")}>
                review in the document vault
              </button>
            </div>
          </SectionCard>
        </div>
      </React.Fragment>
    )
  }

  if (role === "HOD") {
    const workloadTop = (charts.workloadTop ?? []) as { name: string; hours: number }[]
    const team = (data.team ?? []) as { code: string; name: string; designation: string; photoSeed: number }[]
    return (
      <React.Fragment>
        <ChartFrame title="Teaching workload — top of department" description="Weekly contact hours (norm 16h)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={workloadTop} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10.5, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={110} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="hours" name="Hours" radius={[0, 6, 6, 0]} fill="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <SectionCard title="My department" description={data.department ? `${(data.department as { name: string }).name} · ${(data.department as { campus: string }).campus}` : ""}>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {team.map((t) => (
              <li key={t.code}>
                <button onClick={() => navigate(`#/employees/${t.code}`)} className="glass glass-hover flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left">
                  <Avatar name={t.name} seed={t.photoSeed} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium">{t.name}</div>
                    <div className="truncate text-[10.5px] text-muted-foreground">{t.designation}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      </React.Fragment>
    )
  }

  if (role === "ACCOUNTANT") {
    const costTrend = (charts.costTrend ?? []) as { month: string; gross: number; net: number }[]
    const runs = (data.recentRuns ?? []) as { id: string; runNo: string; periodMonth: number; periodYear: number; status: string; totalNet: number; employeeCount: number }[]
    return (
      <React.Fragment>
        <ChartFrame title="Payroll cost trend" description="Gross vs net (completed runs)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(v: string) => v.slice(2)} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v: number) => `${Math.round(v / 100000)}L`} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={34} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => inr(v)} />
              <Line type="monotone" dataKey="gross" name="Gross" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="net" name="Net" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
        <SectionCard title="Recent runs" description="Latest payroll cycles">
          <ul className="space-y-2">
            {runs.map((r) => (
              <li key={r.id}>
                <button onClick={() => navigate(`#/payroll/runs/${r.id}`)} className="glass glass-hover flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left">
                  <BadgeIndianRupee className="size-4 shrink-0 text-[color:var(--chart-1)]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{r.runNo}</div>
                    <div className="text-[10.5px] text-muted-foreground">{r.employeeCount} employees · net {inr(r.totalNet, true)}</div>
                  </div>
                  <StatusPill status={r.status} />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      </React.Fragment>
    )
  }

  // FACULTY / NON_TEACHING / TECHNICAL — self-service
  const balances = (charts.leaveBalances ?? []) as { name: string; available: number; used: number }[]
  const myRequests = (data.myRequests ?? []) as { referenceNo: string; type: string; fromDate: string; toDate: string; days: number; status: string }[]
  const workload = data.workloadSummary as { term: string; subjects: number; teachingHours: number; overloaded: boolean } | null
  const appraisal = data.appraisalStatus as { name: string; status: string; goals: number; goalProgress: number } | null
  return (
    <React.Fragment>
      <div className="grid gap-5 md:grid-cols-2">
        <ChartFrame title="Leave balance" description="Available vs used (days)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={balances}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={26} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="available" name="Available" stackId="a" fill="var(--chart-1)" radius={[5, 5, 0, 0]} />
              <Bar dataKey="used" name="Used" stackId="b" fill="var(--chart-2)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <div className="space-y-5">
          {workload ? (
            <SectionCard title="Teaching workload" description={`${workload.term} · norm 16h/week`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[26px] font-semibold leading-none">{workload.teachingHours}<span className="ml-1 text-sm text-muted-foreground">h/wk</span></div>
                  <div className="mt-1.5 text-xs text-muted-foreground">{workload.subjects} subjects allocated</div>
                </div>
                <StatusPill status={workload.overloaded ? "RETURNED" : "COMPLETED"} className={workload.overloaded ? "" : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"} />
                {workload.overloaded ? <span className="text-[10px] text-amber-500">above norm</span> : null}
              </div>
              <MetalButton variant="ghost" className="mt-4 w-full" onClick={() => navigate("#/workload")}>
                <GraduationCap className="mr-1.5 size-4" /> Open workload
              </MetalButton>
            </SectionCard>
          ) : null}
          {appraisal ? (
            <SectionCard title="Appraisal cycle" description={appraisal.name}>
              <div className="flex items-center justify-between">
                <StatusPill status={appraisal.status} />
                <span className="text-xs text-muted-foreground">{appraisal.goals} goals · {appraisal.goalProgress}% complete</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${appraisal.goalProgress}%`, background: "linear-gradient(90deg, var(--chart-1), var(--chart-3))" }} />
              </div>
              <MetalButton variant="ghost" className="mt-4 w-full" onClick={() => navigate("#/appraisal")}>
                <CheckCircle2 className="mr-1.5 size-4" /> Open appraisal
              </MetalButton>
            </SectionCard>
          ) : null}
        </div>
      </div>
      <SectionCard title="My leave requests" description="Pending and returned applications" actions={<MetalButton variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => navigate("#/leave")}>Apply for leave</MetalButton>}>
        {myRequests.length === 0 ? (
          <EmptyState title="No pending requests" hint="Your recent applications and their outcomes live in the Leave module." className="py-5" />
        ) : (
          <ul className="space-y-2">
            {myRequests.map((r) => (
              <li key={r.referenceNo} className="glass flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px]">
                <FileClock className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{r.type}</span> · {fmtDays(r.days)} · {fmtDate(r.fromDate)}
                </span>
                <StatusPill status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </React.Fragment>
  )
}
