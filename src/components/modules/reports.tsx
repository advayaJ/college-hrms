"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartPie, Download, TrendingUp, Users } from "lucide-react"
import { api } from "@/lib/api"
import { inr, titleCase } from "@/lib/format"
import { ChartFrame, DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton, PageHeader, SectionCard } from "@/components/glass/kit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CH = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--glass-border)", borderRadius: "12px", fontSize: "12px", color: "var(--foreground)" },
  labelStyle: { color: "var(--muted-foreground)", fontSize: "11px" },
}

export default function ReportsModule() {
  const [tab, setTab] = React.useState("workforce")
  const canPayroll = true // payroll tab renders only if data loads; server enforces permission
  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Workforce, attendance, leave and payroll analytics with CSV export"
        icon={<ChartPie />}
        actions={
          <MetalButton variant="ghost" onClick={() => exportDirectory()}>
            <Download className="mr-1.5 size-4" /> Employee directory CSV
          </MetalButton>
        }
      />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="workforce" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Workforce</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Attendance</TabsTrigger>
          <TabsTrigger value="leave" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Leave</TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Payroll</TabsTrigger>
        </TabsList>
        <TabsContent value="workforce"><WorkforceTab /></TabsContent>
        <TabsContent value="attendance"><AttendanceReportTab /></TabsContent>
        <TabsContent value="leave"><LeaveReportTab /></TabsContent>
        <TabsContent value="payroll"><PayrollReportTab /></TabsContent>
      </Tabs>
    </div>
  )
}

async function exportDirectory() {
  try {
    await api.download("/reports/employee-directory.csv", "employee-directory.csv")
    toast.success("Directory exported — check your downloads")
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Export failed")
  }
}

function WorkforceTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["report-headcount"],
    queryFn: () => api.get<{
      byDepartment: { department: string; count: number }[]
      byCampus: { campus: string; count: number }[]
      byStaffType: { staffType: string; count: number }[]
      byStatus: { status: string; count: number }[]
      byDesignationCategory: { title: string; count: number }[]
      byGender: { gender: string; count: number }[]
      ageBands: Record<string, number>
      tenureBands: Record<string, number>
      flow: { month: string; joined: number; separated: number }[]
    }>("/reports/headcount"),
  })
  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Composing analytics" /></GlassCard>

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="On roll" value={data.byStatus.filter((s) => s.status !== "SEPARATED").reduce((s, x) => s + x.count, 0)} icon={<Users />} />
        <KpiStat label="Departments" value={data.byDepartment.length} icon={<ChartPie />} />
        <KpiStat label="Joinings (12m)" value={data.flow.reduce((s, f) => s + f.joined, 0)} icon={<TrendingUp />} tone="success" />
        <KpiStat label="Separations (12m)" value={data.flow.reduce((s, f) => s + f.separated, 0)} icon={<TrendingUp />} tone="critical" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartFrame title="Headcount by department" description="Top departments by strength">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.byDepartment.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 8.5, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} angle={-22} textAnchor="end" height={54} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={28} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" name="Employees" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <ChartFrame title="Staff composition" description="Teaching / non-teaching / technical">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.byStaffType.map((s) => ({ name: titleCase(s.staffType), value: s.count }))} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} strokeWidth={0}>
                {data.byStaffType.map((_, i) => <Cell key={i} fill={CH[i % CH.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartFrame title="Joinings vs separations" description="Rolling 12 months">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.flow}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(v: string) => v.slice(2)} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={26} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="joined" name="Joined" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="separated" name="Separated" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <div className="space-y-5">
          <SectionCard title="Age distribution">
            <ul className="grid grid-cols-2 gap-2">
              {Object.entries(data.ageBands).map(([band, count]) => (
                <li key={band} className="glass flex items-center justify-between rounded-xl px-3 py-2 text-[12px]">
                  <span className="text-muted-foreground">{band}</span><span className="font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Tenure bands">
            <ul className="grid grid-cols-2 gap-2">
              {Object.entries(data.tenureBands).map(([band, count]) => (
                <li key={band} className="glass flex items-center justify-between rounded-xl px-3 py-2 text-[12px]">
                  <span className="text-muted-foreground">{band} yrs</span><span className="font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function AttendanceReportTab() {
  const now = new Date()
  const [month, setMonth] = React.useState(now.getUTCMonth() + 1)
  const [year, setYear] = React.useState(now.getUTCFullYear())
  const { data, isLoading } = useQuery({
    queryKey: ["report-attendance", month, year],
    queryFn: () => api.get<{ totals: Record<string, number>; series: { date: string; present: number; absent: number; onLeave: number; off: number }[] }>(`/reports/attendance?month=${month}&year=${year}`),
  })
  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Aggregating" /></GlassCard>
  const presentRate = data.totals.PRESENT ? Math.round(((data.totals.PRESENT + (data.totals.HALF_DAY ?? 0) + (data.totals.WFH ?? 0)) / Object.entries(data.totals).filter(([k]) => k !== "WEEKLY_OFF" && k !== "HOLIDAY").reduce((s, [, v]) => s + v, 1)) * 100) : 0

  return (
    <div className="space-y-5">
      <GlassCard hover={false} className="flex flex-wrap items-center gap-3 p-3">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="glass h-9 rounded-xl px-3 text-sm outline-none">
          {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(Date.UTC(2020, i, 1)).toLocaleString("en-IN", { month: "long" })}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="glass h-9 rounded-xl px-3 text-sm outline-none">
          {[2026, 2025].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </GlassCard>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Present days" value={data.totals.PRESENT ?? 0} tone="success" />
        <KpiStat label="Absent days" value={data.totals.ABSENT ?? 0} tone="critical" />
        <KpiStat label="On-leave days" value={data.totals.ON_LEAVE ?? 0} tone="warning" />
        <KpiStat label="Present rate" value={presentRate} unit="%" tone="gold" />
      </div>
      <ChartFrame title="Daily breakdown" description={`${new Date(Date.UTC(year, month - 1)).toLocaleString("en-IN", { month: "long", year: "numeric" })}`}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.series}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(8)} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={34} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="present" name="Present" stackId="a" fill="var(--chart-1)" />
            <Bar dataKey="onLeave" name="On leave" stackId="a" fill="var(--chart-2)" />
            <Bar dataKey="absent" name="Absent" stackId="a" fill="var(--destructive)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  )
}

function LeaveReportTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["report-leave"],
    queryFn: () => api.get<{
      byType: { type: string; applications: number; days: number; approved: number; pending: number }[]
      top: { employee: string; employeeCode: string; department: string | null; type: string; days: number; fromDate: string }[]
      monthly: { month: string; applications: number; days: number }[]
    }>("/reports/leave"),
  })
  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Aggregating" /></GlassCard>

  return (
    <div className="space-y-5">
      <ChartFrame title="Leave usage by category" description="Days consumed across the year">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.byType}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="type" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={30} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="days" name="Days" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <SectionCard title="Longest approved leave (this year)">
        <DataTable
          rows={data.top}
          rowKey={(t) => t.employeeCode + t.fromDate}
          columns={[
            { key: "e", header: "Employee", render: (t) => <span className="text-[12.5px] font-medium">{t.employee}</span> },
            { key: "d", header: "Department", render: (t) => <span className="text-[12px] text-muted-foreground">{t.department ?? "—"}</span> },
            { key: "t", header: "Type", render: (t) => <span className="text-[12px]">{t.type}</span> },
            { key: "n", header: "Days", align: "right", render: (t) => <span className="text-[12.5px] font-semibold">{t.days}</span> },
          ]}
        />
      </SectionCard>
    </div>
  )
}

function PayrollReportTab() {
  const year = new Date().getUTCFullYear()
  const { data, isLoading, error } = useQuery({
    queryKey: ["report-payroll"],
    queryFn: () => api.get<{
      year: number
      runs: { periodMonth: number; status: string; employeeCount: number; totalGross: number; totalDeductions: number; totalNet: number }[]
      totals: { gross: number; net: number; deductions: number }
    }>("/reports/payroll"),
  })
  if (isLoading) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Aggregating" /></GlassCard>
  if (error || !data) return <GlassCard hover={false} className="p-8"><EmptyState title="Payroll reports need the Accountant or HR permission" /></GlassCard>

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat label={`Gross paid ${data.year}`} value={inr(data.totals.gross, true)} />
        <KpiStat label={`Net paid ${data.year}`} value={inr(data.totals.net, true)} tone="gold" />
        <KpiStat label="Deductions" value={inr(data.totals.deductions, true)} />
      </div>
      <ChartFrame title="Monthly payroll" description="Completed runs for the year">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.runs.filter((r) => r.status === "COMPLETED").map((r) => ({ month: r.periodMonth, net: r.totalNet / 100000 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v: number) => `₹${v}L`} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={44} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => inr(v * 100000)} />
            <Bar dataKey="net" name="Net payout" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  )
}
