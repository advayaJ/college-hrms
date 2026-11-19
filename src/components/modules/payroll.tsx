"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BadgeIndianRupee, BanknoteArrowUp, Calculator, ChevronLeft, FileSpreadsheet, Landmark, ReceiptText, Wallet } from "lucide-react"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { navigate } from "@/lib/router"
import { fmtDate, inr, monthName, titleCase } from "@/lib/format"
import {
  DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton, PageHeader, SectionCard,
  StatusPill, cn,
} from "@/components/glass/kit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PayrollRunRow {
  id: string; runNo: string; periodMonth: number; periodYear: number; status: string
  employeeCount: number; totalGross: number; totalDeductions: number; totalNet: number
  processedBy: string | null; processedAt: string | null; approvedAt: string | null
  remarks: string | null; approvalRequestId: string | null
}

export default function PayrollModule({ sub, id }: { sub?: string; id?: string }) {
  if (sub === "runs" && id) return <RunDetail runId={id} />
  if (sub === "payslip" && id) return <PayslipView payslipNo={id} />
  return <PayrollHome />
}

function PayrollHome() {
  const { session } = useSession()
  const canProcess = !!session?.permissions.includes("payroll:process")
  const canReadAll = !!session?.permissions.includes("payroll:read_all")
  const [tab, setTab] = React.useState(canReadAll ? "runs" : "mypayslips")

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payroll"
        subtitle={canReadAll ? "Monthly runs, approvals and payslips — demonstration slabs, not statutory advice" : "Your salary structure and payslips"}
        icon={<Wallet />}
      />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="glass rounded-xl p-1">
          {canReadAll ? <TabsTrigger value="runs" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Runs</TabsTrigger> : null}
          {canReadAll ? <TabsTrigger value="structures" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Structures</TabsTrigger> : null}
          <TabsTrigger value="mypayslips" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">My payslips</TabsTrigger>
        </TabsList>
        {canReadAll ? <TabsContent value="runs"><RunsView canProcess={canProcess} /></TabsContent> : null}
        {canReadAll ? <TabsContent value="structures"><StructuresView /></TabsContent> : null}
        <TabsContent value="mypayslips"><MyPayTab /></TabsContent>
      </Tabs>
    </div>
  )
}

/* ── Runs list ───────────────────────────────────────────────── */

function RunsView({ canProcess }: { canProcess: boolean }) {
  const queryClient = useQueryClient()
  const now = new Date()
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-runs"],
    queryFn: () => api.get<PayrollRunRow[]>("/payroll/runs"),
  })
  const [creating, setCreating] = React.useState(false)

  const createRun = async () => {
    setCreating(true)
    try {
      const res = await api.post<{ runNo: string; id: string }>("/payroll/runs", {
        month: now.getUTCMonth() + 1, year: now.getUTCFullYear(),
        remarks: "Current cycle",
      })
      toast.success(`${res.runNo} created as draft — compute it next`)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create run")
    } finally {
      setCreating(false)
    }
  }

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading runs" /></GlassCard>

  const latest = data[0]
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat label="Latest cycle" value={latest ? `${latest.periodMonth}/${latest.periodYear}` : "—"} hint={latest?.runNo} icon={<Calculator />} />
        <KpiStat label="Last net disbursed" value={inr(data.find((r) => r.status === "COMPLETED")?.totalNet ?? 0, true)} tone="gold" icon={<BanknoteArrowUp />} />
        <KpiStat label="Employees per run" value={latest?.employeeCount ?? "—"} icon={<Landmark />} />
      </div>

      {canProcess ? <NewRunCard onCreate={createRun} creating={creating} /> : null}

      <SectionCard title="Payroll runs" description="Every cycle with totals and workflow status">
        <DataTable
          rows={data}
          rowKey={(r) => r.runNo}
          onRowClick={(r) => navigate(`#/payroll/runs/${r.id}`)}
          columns={[
            { key: "r", header: "Run", render: (r) => <div><div className="font-mono text-[12.5px] font-medium">{r.runNo}</div><div className="text-[10.5px] text-muted-foreground">{monthName(r.periodMonth)} {r.periodYear}</div></div> },
            { key: "e", header: "Employees", align: "right", render: (r) => <span className="text-[12.5px]">{r.employeeCount || "—"}</span> },
            { key: "g", header: "Gross", align: "right", render: (r) => <span className="text-[12.5px]">{r.totalGross ? inr(r.totalGross, true) : "—"}</span> },
            { key: "d", header: "Deductions", align: "right", render: (r) => <span className="text-[12.5px] text-muted-foreground">{r.totalDeductions ? inr(r.totalDeductions, true) : "—"}</span> },
            { key: "n", header: "Net", align: "right", render: (r) => <span className="text-[12.5px] font-semibold text-[color:var(--chart-1)]">{r.totalNet ? inr(r.totalNet, true) : "—"}</span> },
            { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            { key: "p", header: "Processed by", render: (r) => <span className="text-[11px] text-muted-foreground">{r.processedBy ?? "—"}</span> },
          ]}
        />
      </SectionCard>
    </div>
  )
}

function NewRunCard({ onCreate, creating }: { onCreate: () => void; creating: boolean }) {
  const now = new Date()
  return (
    <SectionCard title={`Start ${monthName(now.getUTCMonth() + 1)} ${now.getUTCFullYear()} cycle`} description="Create a draft run → compute payslips → submit for dual review (HR + Accounts, parallel) → Principal approval → disburse">
      <MetalButton onClick={onCreate} disabled={creating}><Calculator className="mr-1.5 size-4" />{creating ? "Creating…" : "Create draft run"}</MetalButton>
    </SectionCard>
  )
}

/* ── Run detail ─────────────────────────────────────────────── */

function RunDetail({ runId }: { runId: string }) {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-run", runId],
    queryFn: () => api.get<{
      run: PayrollRunRow
      payslips: { payslipNo: string; employee: { employeeCode: string; fullName: string; department: { name: string | null } | null; designation: { title: string | null } | null }; grossEarnings: number; totalDeductions: number; netPay: number; paidDays: number; lopDays: number; arrearAmount: number; status: string }[]
    }>(`/payroll/runs/${runId}`),
  })
  const [busy, setBusy] = React.useState<string | null>(null)
  const canProcess = !!session?.permissions.includes("payroll:process")
  const canApprove = !!session?.permissions.includes("payroll:approve")

  const act = async (action: "compute" | "submit" | "disburse") => {
    setBusy(action)
    try {
      if (action === "compute") {
        const res = await api.post<{ employeeCount: number; totalNet: number }>(`/payroll/runs/${runId}/compute`)
        toast.success(`Computed ${res.employeeCount} payslips — net ${inr(res.totalNet, true)}`)
      } else if (action === "submit") {
        const res = await api.post<{ approvalRef: string }>(`/payroll/runs/${runId}/submit`)
        toast.success(`Submitted for approval — ${res.approvalRef}. HR & Accounts review in parallel, then the Principal.`)
      } else {
        await api.post(`/payroll/runs/${runId}/disburse`)
        toast.success("Payslips marked disbursed")
      }
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${action} run`)
    } finally {
      setBusy(null)
    }
  }

  if (isLoading || !data) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading run" /></GlassCard>
  const r = data.run

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("#/payroll")} className="glass glass-hover flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] text-muted-foreground">
        <ChevronLeft className="size-3.5" /> All runs
      </button>

      <PageHeader
        title={r.runNo}
        subtitle={`${monthName(r.periodMonth)} ${r.periodYear} · ${r.employeeCount} employees · processed by ${r.processedBy ?? "—"}`}
        icon={<BadgeIndianRupee />}
        actions={<StatusPill status={r.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <KpiStat label="Gross" value={inr(r.totalGross, true)} icon={<FileSpreadsheet />} />
        <KpiStat label="Deductions" value={inr(r.totalDeductions, true)} icon={<FileSpreadsheet />} />
        <KpiStat label="Net payable" value={inr(r.totalNet, true)} tone="gold" icon={<Wallet />} />
        <KpiStat label="Approved on" value={r.approvedAt ? fmtDate(r.approvedAt) : "—"} icon={<Calculator />} />
      </div>

      {canProcess ? (
        <SectionCard title="Run operations" description="Draft → compute → dual approval (HR+Accounts parallel) → Principal → disburse">
          <div className="flex flex-wrap gap-2">
            {r.status === "DRAFT" ? <MetalButton onClick={() => act("compute")} disabled={busy !== null}><Calculator className="mr-1.5 size-4" />{busy === "compute" ? "Computing…" : "Compute payslips"}</MetalButton> : null}
            {r.status === "DRAFT" && r.employeeCount > 0 ? <MetalButton onClick={() => act("submit")} disabled={busy !== null}><BanknoteArrowUp className="mr-1.5 size-4" />{busy === "submit" ? "Submitting…" : "Submit for approval"}</MetalButton> : null}
            {r.status === "COMPLETED" && canApprove ? <MetalButton onClick={() => act("disburse")} disabled={busy !== null}><ReceiptText className="mr-1.5 size-4" />Mark disbursed</MetalButton> : null}
          </div>
          {r.approvalRequestId ? (
            <div className="mt-3">
              <MetalButton variant="ghost" onClick={() => navigate(`#/approvals/${r.approvalRequestId}`)}>View approval workflow →</MetalButton>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Payslips" description={`${data.payslips.length} statements in this run`}>
        {data.payslips.length === 0 ? <EmptyState title="No payslips yet" hint={r.status === "DRAFT" ? "Compute the run to generate payslips." : undefined} /> : (
          <DataTable
            rows={data.payslips}
            rowKey={(p) => p.payslipNo}
            onRowClick={(p) => navigate(`#/payroll/payslip/${p.payslipNo}`)}
            columns={[
              {
                key: "e", header: "Employee",
                render: (p) => <div><div className="text-[12.5px] font-medium">{p.employee.fullName}</div><div className="text-[10px] text-muted-foreground">{p.employee.employeeCode} · {p.employee.department?.name ?? "—"}</div></div>,
              },
              { key: "d", header: "Designation", render: (p) => <span className="text-[11.5px] text-muted-foreground">{p.employee.designation?.title ?? "—"}</span> },
              { key: "pd", header: "Paid/LOP", render: (p) => <span className="text-[12px] text-muted-foreground">{p.paidDays} / {p.lopDays}</span> },
              { key: "g", header: "Gross", align: "right", render: (p) => <span className="text-[12.5px]">{inr(p.grossEarnings)}</span> },
              { key: "dd", header: "Deductions", align: "right", render: (p) => <span className="text-[12.5px] text-muted-foreground">{inr(p.totalDeductions)}</span> },
              { key: "n", header: "Net", align: "right", render: (p) => <span className="text-[13px] font-semibold text-[color:var(--chart-1)]">{inr(p.netPay)}</span> },
              { key: "s", header: "Status", render: (p) => <StatusPill status={p.status} /> },
            ]}
          />
        )}
      </SectionCard>
    </div>
  )
}

/* ── Structures ───────────────────────────────────────────────── */

function StructuresView() {
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-structures"],
    queryFn: () => api.get<{ employee: { employeeCode: string; fullName: string; designation: { title: string | null } | null; department: { name: string | null } | null }; basicMonthly: number; daPercent: number; hraPercent: number; grossPreview: number; components: { code: string; name: string; kind: string; calcType: string; value: number }[] }[]>("/payroll/structures"),
  })
  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading structures" /></GlassCard>
  return (
    <SectionCard title="Salary structures" description="Per-employee pay components (demonstration figures)">
      <DataTable
        rows={data}
        rowKey={(s) => s.employee.employeeCode}
        onRowClick={(s) => navigate(`#/employees/${s.employee.employeeCode}`)}
        columns={[
          { key: "e", header: "Employee", render: (s) => <div><div className="text-[12.5px] font-medium">{s.employee.fullName}</div><div className="text-[10px] text-muted-foreground">{s.employee.employeeCode} · {s.employee.designation?.title ?? "—"}</div></div> },
          { key: "d", header: "Department", render: (s) => <span className="text-[12px] text-muted-foreground">{s.employee.department?.name ?? "—"}</span> },
          { key: "b", header: "Basic", align: "right", render: (s) => <span className="text-[12.5px]">{inr(s.basicMonthly)}</span> },
          { key: "da", header: "DA / HRA", align: "right", render: (s) => <span className="text-[12px] text-muted-foreground">{s.daPercent}% / {s.hraPercent}%</span> },
          { key: "g", header: "Gross preview", align: "right", render: (s) => <span className="text-[13px] font-semibold text-[color:var(--chart-1)]">{inr(s.grossPreview)}</span> },
        ]}
      />
    </SectionCard>
  )
}

/* ── My payslips tab ─────────────────────────────────────────── */

function MyPayTab() {
  const { data: slips, isLoading } = useQuery({
    queryKey: ["my-payslips"],
    queryFn: () => api.get<{ payslipNo: string; periodMonth: number; periodYear: number; grossEarnings: number; totalDeductions: number; netPay: number; status: string; paidOn: string | null }[]>("/payroll/my-payslips"),
  })
  const { data: structure } = useQuery({
    queryKey: ["my-structure"],
    queryFn: () => api.get<null | { basicMonthly: number; daPercent: number; hraPercent: number; grossPreview: number; components: { code: string; name: string; kind: string; calcType: string; value: number }[]; effectiveFrom: string }>("/payroll/my-structure"),
  })

  if (isLoading) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading payslips" /></GlassCard>

  return (
    <div className="space-y-5">
      {structure ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiStat label="Basic pay" value={inr(structure.basicMonthly)} unit="/mo" icon={<Wallet />} />
          <KpiStat label="Gross preview" value={inr(structure.grossPreview)} tone="gold" icon={<BadgeIndianRupee />} />
          <KpiStat label="DA / HRA" value={`${structure.daPercent}% / ${structure.hraPercent}%`} icon={<Calculator />} />
        </div>
      ) : null}

      <SectionCard title="My payslips" description="Released statements (latest first)">
        {!slips || slips.length === 0 ? <EmptyState title="No payslips released yet" /> : (
          <DataTable
            rows={slips}
            rowKey={(p) => p.payslipNo}
            onRowClick={(p) => navigate(`#/payroll/payslip/${p.payslipNo}`)}
            columns={[
              { key: "p", header: "Period", render: (p) => <span className="text-[12.5px] font-medium">{monthName(p.periodMonth)} {p.periodYear}</span> },
              { key: "g", header: "Gross", align: "right", render: (p) => <span className="text-[12.5px]">{inr(p.grossEarnings)}</span> },
              { key: "d", header: "Deductions", align: "right", render: (p) => <span className="text-[12.5px] text-muted-foreground">{inr(p.totalDeductions)}</span> },
              { key: "n", header: "Net pay", align: "right", render: (p) => <span className="text-[13px] font-semibold text-[color:var(--chart-1)]">{inr(p.netPay)}</span> },
              { key: "s", header: "Status", render: (p) => <StatusPill status={p.status} /> },
            ]}
          />
        )}
      </SectionCard>
    </div>
  )
}

export function PayslipView({ payslipNo }: { payslipNo: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["payslip", payslipNo],
    queryFn: () => api.get<{
      payslipNo: string; periodMonth: number; periodYear: number; status: string
      employee: { employeeCode: string; fullName: string; designation: { title: string | null } | null; department: { name: string | null } | null }
      basic: number; grossEarnings: number; totalDeductions: number; netPay: number
      paidDays: number; lopDays: number; arrearAmount: number; adjustmentNote: string | null
      lines: { code: string; name: string; kind: string; amount: number; calcDetail: string | null }[]
      run: { runNo: string; status: string; approvedAt: string | null }
    }>(`/payroll/payslips/${payslipNo}`),
  })

  if (isLoading || !data) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading payslip" /></GlassCard>
  return (
    <div className="space-y-5">
      <button onClick={() => navigate("#/payroll")} className="glass glass-hover flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] text-muted-foreground">
        <ChevronLeft className="size-3.5" /> Payroll
      </button>
      <GlassCard hover={false} className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Aryavratt University</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Payslip — {monthName(data.periodMonth)} {data.periodYear}</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {data.employee.fullName} · {data.employee.designation?.title ?? "—"} · {data.employee.department?.name ?? "—"}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">{data.payslipNo} · run {data.run.runNo}</p>
          </div>
          <div className="text-right">
            <StatusPill status={data.status} />
            <div className="mt-2 text-[10.5px] text-muted-foreground">
              Paid days <span className="font-semibold text-foreground">{data.paidDays}</span> · LOP <span className="font-semibold text-foreground">{data.lopDays}</span>
            </div>
          </div>
        </div>

        <div className="champagne-line my-5" />

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">Earnings</h3>
            {data.lines.filter((l) => l.kind === "EARNING").map((l) => (
              <LineRow key={l.code} name={l.name} detail={l.calcDetail} amount={l.amount} />
            ))}
            {data.arrearAmount ? <LineRow name="Arrear / adjustment" detail={data.adjustmentNote ?? undefined} amount={data.arrearAmount} /> : null}
            <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-[13px] font-semibold">
              <span>Gross earnings</span><span>{inr(data.grossEarnings)}</span>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">Deductions</h3>
            {data.lines.filter((l) => l.kind === "DEDUCTION").map((l) => (
              <LineRow key={l.code} name={l.name} detail={l.calcDetail} amount={l.amount} />
            ))}
            <div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-[13px] font-semibold">
              <span>Total deductions</span><span>{inr(data.totalDeductions)}</span>
            </div>
          </div>
        </div>

        <div className="champagne-line my-5" />
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-muted-foreground">Net pay for the month</span>
          <span className="text-[28px] font-semibold tracking-tight text-[color:var(--chart-1)]">{inr(data.netPay)}</span>
        </div>
        <p className="mt-4 text-[10.5px] leading-relaxed text-muted-foreground">
          Computer-generated statement · figures use demonstration slabs (DA {data.basic ? "42" : "42"}% etc.) — verify statutory rates before production use. Approved {data.run.approvedAt ? fmtDate(data.run.approvedAt) : "—"}.
        </p>
      </GlassCard>
    </div>
  )
}

function LineRow({ name, detail, amount }: { name: string; detail?: string | null; amount: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/30 py-1.5">
      <div>
        <div className="text-[12.5px]">{name}</div>
        {detail ? <div className="text-[10px] text-muted-foreground">{detail}</div> : null}
      </div>
      <span className={cn("text-[12.5px] font-medium tabular-nums")}>{inr(amount)}</span>
    </div>
  )
}
