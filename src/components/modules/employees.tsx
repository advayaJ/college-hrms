"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Award, BookOpen, BriefcaseBusiness, ChevronLeft, FileText, Landmark, Mail, MapPin, Phone,
  Search, ShieldCheck, UserPlus, UsersRound, Wallet,
} from "lucide-react"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { navigate } from "@/lib/router"
import { fmtDate, inr, titleCase } from "@/lib/format"
import {
  Avatar, Column, DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton,
  PageHeader, Pager, SectionCard, StatusPill,
} from "@/components/glass/kit"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface DirectoryRow {
  id: string
  employeeCode: string
  fullName: string
  gender: string
  staffType: string
  status: string
  employmentType: string
  designation: string | null
  department: string | null
  departmentId: string | null
  campus: string | null
  joiningDate: string
  photoSeed: number
  phone?: string
  officialEmail?: string
}

interface EmployeeProfile {
  employee: Record<string, unknown> & { photoSeed: number }
  qualifications: unknown[]
  experiences: unknown[]
  serviceEvents: unknown[]
  salaryStructure: null | {
    effectiveFrom: string; basicMonthly: number; daPercent: number; hraPercent: number
    components: { code: string; name: string; kind: string; calcType: string; value: number }[]
  }
  documents: { id: string; title: string; category: string; accessLevel: string; expiresOn: string | null; isVerified: boolean; sizeKb: number; uploadedAt: string }[]
  stats: Record<string, number> | null
  leaveBalances: { type: string; code: string; entitled: number; used: number; pending: number; available: number }[] | null
  latestPayslip: { payslipNo: string; periodMonth: number; periodYear: number; netPay: number; status: string } | null
  visibility: string
}

export default function EmployeesModule({ employeeCode }: { employeeCode?: string }) {
  if (employeeCode) return <EmployeeProfileView code={employeeCode} />
  return <EmployeeDirectory />
}

/* ── Directory ─────────────────────────────────────────────────── */

function EmployeeDirectory() {
  const { session } = useSession()
  const [q, setQ] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [departmentId, setDepartmentId] = React.useState<string | undefined>()
  const [staffType, setStaffType] = React.useState<string | undefined>()
  const [status, setStatus] = React.useState<string | undefined>()

  const { data: formData } = useQuery({
    queryKey: ["employees-form"],
    queryFn: () => api.get<{ campuses: { id: string; name: string }[]; departments: { id: string; name: string; campus: { name: string } }[]; designations: { id: string; title: string; category: string }[] }>("/employees/form-data"),
  })

  const { data, isLoading } = useQuery({
    queryKey: ["employees", q, page, departmentId, staffType, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "12" })
      if (q.trim()) params.set("q", q.trim())
      if (departmentId && departmentId !== "all") params.set("departmentId", departmentId)
      if (staffType && staffType !== "all") params.set("staffType", staffType)
      if (status && status !== "all") params.set("status", status)
      return api.get<{ items: DirectoryRow[]; total: number; page: number; pageSize: number; scope: string }>(`/employees?${params}`)
    },
  })

  const canCreate = !!session?.permissions.includes("employees:create")

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employee Directory"
        subtitle={
          data
            ? `${data.total.toLocaleString("en-IN")} employees${data.scope === "DEPT" ? " · your department scope" : data.scope === "SELF" ? " · your record" : ""}`
            : "Institutional workforce"
        }
        icon={<UsersRound />}
        actions={
          canCreate ? (
            <AddEmployeeDialog>
              <MetalButton>
                <UserPlus className="mr-1.5 size-4" /> Add employee
              </MetalButton>
            </AddEmployeeDialog>
          ) : undefined
        }
      />

      <GlassCard hover={false} className="flex flex-wrap items-center gap-3 p-3">
        <div className="glass flex h-9 min-w-52 flex-1 items-center gap-2.5 rounded-xl px-3">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search name or employee code…"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <Select value={departmentId ?? "all"} onValueChange={(v) => { setDepartmentId(v === "all" ? undefined : v); setPage(1) }}>
          <SelectTrigger className="glass h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            <SelectItem value="all" className="rounded-lg text-[13px]">All departments</SelectItem>
            {(formData?.departments ?? []).map((d) => (
              <SelectItem key={d.id} value={d.id} className="rounded-lg text-[13px]">
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={staffType ?? "all"} onValueChange={(v) => { setStaffType(v === "all" ? undefined : v); setPage(1) }}>
          <SelectTrigger className="glass h-9 w-36 rounded-xl text-sm"><SelectValue placeholder="Staff type" /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            <SelectItem value="all" className="rounded-lg text-[13px]">All types</SelectItem>
            {["TEACHING", "NON_TEACHING", "TECHNICAL"].map((t) => (
              <SelectItem key={t} value={t} className="rounded-lg text-[13px]">{titleCase(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status ?? "all"} onValueChange={(v) => { setStatus(v === "all" ? undefined : v); setPage(1) }}>
          <SelectTrigger className="glass h-9 w-32 rounded-xl text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            <SelectItem value="all" className="rounded-lg text-[13px]">Any status</SelectItem>
            {["ACTIVE", "PROBATION", "ON_NOTICE", "SEPARATED"].map((s) => (
              <SelectItem key={s} value={s} className="rounded-lg text-[13px]">{titleCase(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </GlassCard>

      {isLoading ? (
        <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading directory" /></GlassCard>
      ) : (data?.items.length ?? 0) === 0 ? (
        <GlassCard hover={false} className="p-6">
          <EmptyState title="No employees match" hint="Adjust the filters or search term." />
        </GlassCard>
      ) : (
        <DataTable
          rows={data!.items}
          onRowClick={(row) => navigate(`#/employees/${row.employeeCode}`)}
          rowKey={(r) => r.employeeCode}
          columns={[
            {
              key: "employee", header: "Employee",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <Avatar name={r.fullName} seed={r.photoSeed} size={34} />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-medium">{r.fullName}</div>
                    <div className="truncate text-[10.5px] text-muted-foreground">{r.employeeCode} · {titleCase(r.employmentType)}</div>
                  </div>
                </div>
              ),
            },
            { key: "designation", header: "Designation", render: (r) => <span className="text-[12.5px]">{r.designation ?? "—"}</span> },
            { key: "department", header: "Department", render: (r) => <span className="text-[12.5px] text-muted-foreground">{r.department ?? "—"}</span> },
            { key: "campus", header: "Campus", render: (r) => <span className="text-[12.5px] text-muted-foreground">{r.campus ?? "—"}</span> },
            { key: "joining", header: "Joined", render: (r) => <span className="text-[12.5px]">{fmtDate(r.joiningDate)}</span> },
            { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          ]}
          footer={
            <Pager
              page={page}
              totalPages={Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 12))}
              total={data?.total}
              onPage={setPage}
            />
          }
        />
      )}
    </div>
  )
}

/* ── Add employee dialog ───────────────────────────────────────── */

function AddEmployeeDialog({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { data: formData } = useQuery({
    queryKey: ["employees-form"],
    queryFn: () => api.get<{ campuses: { id: string; name: string }[]; departments: { id: string; name: string }[]; designations: { id: string; title: string; category: string }[] }>("/employees/form-data"),
  })
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    firstName: "", lastName: "", gender: "MALE", dateOfBirth: "1995-06-01",
    personalEmail: "", phone: "", addressLine: "", city: "Udaipur", state: "Rajasthan", pincode: "313001",
    campusId: "", departmentId: "", designationId: "", staffType: "TEACHING", employmentType: "PERMANENT",
    joiningDate: new Date().toISOString().slice(0, 10), basicMonthly: "57700",
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const designations = (formData?.designations ?? []).filter((d) => d.category === form.staffType)

  const submit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.personalEmail || !form.campusId || !form.designationId) {
      toast.error("First name, last name, email, campus and designation are required")
      return
    }
    setSaving(true)
    try {
      const res = await api.post<{ employeeCode: string }>("/employees", {
        ...form,
        basicMonthly: Number(form.basicMonthly) || undefined,
      })
      toast.success(`Employee ${res.employeeCode} created — account: ${form.firstName.toLowerCase()}.${form.lastName.toLowerCase()}…@aryavratt.edu.in`)
      setOpen(false)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create employee")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="liquid max-h-[85vh] max-w-xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Add employee</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Creates the employee record, salary structure and a login account (default password Welcome@2026).
          </p>
        </DialogHeader>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <LabeledInput label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} />
          <LabeledInput label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} />
          <div>
            <Label className="mb-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger className="glass h-9 w-full rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="liquid rounded-xl">
                {["MALE", "FEMALE", "OTHER"].map((g) => <SelectItem key={g} value={g} className="rounded-lg text-[13px]">{titleCase(g)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <LabeledInput label="Date of birth" type="date" value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
          <LabeledInput label="Personal email" value={form.personalEmail} onChange={(v) => set("personalEmail", v)} />
          <LabeledInput label="Phone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+91-98…" />
          <LabeledInput label="Address" value={form.addressLine} onChange={(v) => set("addressLine", v)} className="sm:col-span-2" />
          <LabeledInput label="City" value={form.city} onChange={(v) => set("city", v)} />
          <LabeledInput label="Pincode" value={form.pincode} onChange={(v) => set("pincode", v)} />
          <div>
            <Label className="mb-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">Campus</Label>
            <Select value={form.campusId} onValueChange={(v) => set("campusId", v)}>
              <SelectTrigger className="glass h-9 w-full rounded-xl text-sm"><SelectValue placeholder="Select campus" /></SelectTrigger>
              <SelectContent className="liquid rounded-xl">
                {(formData?.campuses ?? []).map((c) => <SelectItem key={c.id} value={c.id} className="rounded-lg text-[13px]">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">Department</Label>
            <Select value={form.departmentId || "none"} onValueChange={(v) => set("departmentId", v === "none" ? "" : v)}>
              <SelectTrigger className="glass h-9 w-full rounded-xl text-sm"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent className="liquid rounded-xl">
                <SelectItem value="none" className="rounded-lg text-[13px]">— none —</SelectItem>
                {(formData?.departments ?? []).map((d) => <SelectItem key={d.id} value={d.id} className="rounded-lg text-[13px]">{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">Staff type</Label>
            <Select value={form.staffType} onValueChange={(v) => set("staffType", v)}>
              <SelectTrigger className="glass h-9 w-full rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="liquid rounded-xl">
                {["TEACHING", "NON_TEACHING", "TECHNICAL"].map((t) => <SelectItem key={t} value={t} className="rounded-lg text-[13px]">{titleCase(t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">Designation</Label>
            <Select value={form.designationId} onValueChange={(v) => set("designationId", v)}>
              <SelectTrigger className="glass h-9 w-full rounded-xl text-sm"><SelectValue placeholder="Select designation" /></SelectTrigger>
              <SelectContent className="liquid rounded-xl">
                {designations.map((d) => <SelectItem key={d.id} value={d.id} className="rounded-lg text-[13px]">{d.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">Employment type</Label>
            <Select value={form.employmentType} onValueChange={(v) => set("employmentType", v)}>
              <SelectTrigger className="glass h-9 w-full rounded-xl text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="liquid rounded-xl">
                {["PERMANENT", "CONTRACT", "VISITING", "PART_TIME", "ADJUNCT"].map((t) => <SelectItem key={t} value={t} className="rounded-lg text-[13px]">{titleCase(t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <LabeledInput label="Joining date" type="date" value={form.joiningDate} onChange={(v) => set("joiningDate", v)} />
          <LabeledInput label="Basic pay (₹/month)" value={form.basicMonthly} onChange={(v) => set("basicMonthly", v)} />
        </div>
        <div className="mt-1.5 flex justify-end gap-2">
          <MetalButton variant="ghost" onClick={() => setOpen(false)} type="button">Cancel</MetalButton>
          <MetalButton onClick={submit} disabled={saving} type="button">
            {saving ? "Saving…" : "Create employee"}
          </MetalButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LabeledInput({ label, value, onChange, type = "text", className, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string; placeholder?: string
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="glass h-9 rounded-xl text-sm" />
    </div>
  )
}

/* ── Profile view ─────────────────────────────────────────────── */

function EmployeeProfileView({ code }: { code: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["employee", code],
    queryFn: () => api.get<EmployeeProfile>(`/employees/${code}`),
  })

  if (isLoading) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading profile" /></GlassCard>
  if (error || !data) return <GlassCard hover={false} className="p-8"><EmptyState title="Profile unavailable" hint={error instanceof Error ? error.message : undefined} /></GlassCard>

  const e = data.employee
  const canSeeSensitive = data.visibility === "full"
  return (
    <div className="space-y-5">
      <button onClick={() => navigate("#/employees")} className="glass glass-hover flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] text-muted-foreground">
        <ChevronLeft className="size-3.5" /> Back to directory
      </button>

      <GlassCard hover={false} className="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={String(e.fullName)} seed={e.photoSeed} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-semibold tracking-tight">{String(e.fullName)}</h1>
              <StatusPill status={String(e.status)} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><Award className="size-3.5" />{String(e.designation ?? "—")}</span>
              <span className="flex items-center gap-1.5"><Landmark className="size-3.5" />{String(e.department ?? "—")}</span>
              <span className="font-mono">{String(e.employeeCode)}</span>
            </div>
          </div>
        </div>
        {data.stats ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <KpiStat label="Attendance (90d)" value={data.stats.attendanceRate90d ?? "—"} unit="%" icon={<ShieldCheck />} />
            <KpiStat label="Leave used (year)" value={data.stats.leaveUsedYear ?? "—"} unit="days" icon={<FileText />} />
            <KpiStat label="Service" value={(data.stats.serviceYears ?? 0).toFixed(1)} unit="years" icon={<BriefcaseBusiness />} />
          </div>
        ) : null}
      </GlassCard>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg px-3.5 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Overview</TabsTrigger>
          <TabsTrigger value="qualifications" className="rounded-lg px-3.5 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Qualifications</TabsTrigger>
          <TabsTrigger value="service" className="rounded-lg px-3.5 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Service record</TabsTrigger>
          {data.salaryStructure ? <TabsTrigger value="salary" className="rounded-lg px-3.5 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Salary</TabsTrigger> : null}
          {data.leaveBalances ? <TabsTrigger value="leave" className="rounded-lg px-3.5 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Leave</TabsTrigger> : null}
          <TabsTrigger value="documents" className="rounded-lg px-3.5 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard title="Employment">
              <InfoRows items={[
                ["Staff type", titleCase(String(e.staffType))],
                ["Employment type", titleCase(String(e.employmentType))],
                ["Campus", String(e.campus ?? "—")],
                ["Joined", fmtDate(e.joiningDate as string)],
                ["Probation ends", e.probationEndDate ? fmtDate(e.probationEndDate as string) : "—"],
                ["Confirmed on", e.confirmationDate ? fmtDate(e.confirmationDate as string) : "—"],
                ...(e.separationDate ? [["Separated", `${fmtDate(e.separationDate as string)} (${titleCase(String(e.separationType))})`]] : []),
              ]} />
            </SectionCard>
            <SectionCard title={canSeeSensitive ? "Personal information" : "Contact (limited)"} description={canSeeSensitive ? undefined : "Full details require institution/department scope"}>
              <InfoRows items={[
                ...(canSeeSensitive
                  ? [
                      ["Date of birth", fmtDate(e.dateOfBirth as string)],
                      ["Blood group", String(e.bloodGroup ?? "—")],
                      ["Marital status", e.maritalStatus ? titleCase(String(e.maritalStatus)) : "—"],
                      ["Personal email", String(e.personalEmail ?? "—")],
                    ]
                  : []),
                ["Official email", String(e.officialEmail ?? "—")],
                ["Phone", canSeeSensitive ? String(e.phone ?? "—") : "restricted"],
                ...(canSeeSensitive
                  ? [
                      ["Address", `${String(e.addressLine ?? "—")}, ${String(e.city ?? "")} ${String(e.pincode ?? "")}`],
                      ["Emergency contact", e.emergencyContactName ? `${String(e.emergencyContactName)} · ${String(e.emergencyContactPhone ?? "")}` : "—"],
                    ]
                  : []),
              ]} />
            </SectionCard>
          </div>
          {data.experiences.length > 0 ? (
            <SectionCard title="Prior experience">
              <DataTable
                rows={data.experiences as { organisation: string; designationTitle: string; fromDate: string; toDate: string | null; monthlySalary: number | null }[]}
                columns={[
                  { key: "o", header: "Organisation", render: (r) => <span className="text-[12.5px]">{r.organisation}</span> },
                  { key: "d", header: "Role", render: (r) => <span className="text-[12.5px] text-muted-foreground">{r.designationTitle}</span> },
                  { key: "p", header: "Period", render: (r) => <span className="text-[12px]">{fmtDate(r.fromDate)} → {r.toDate ? fmtDate(r.toDate) : "current"}</span> },
                  { key: "s", header: "Salary", align: "right", render: (r) => <span className="text-[12.5px]">{r.monthlySalary ? inr(r.monthlySalary) : "—"}</span> },
                ]}
              />
            </SectionCard>
          ) : null}
        </TabsContent>

        <TabsContent value="qualifications">
          <SectionCard title="Qualifications">
            {data.qualifications.length === 0 ? <EmptyState title="No qualification records" /> : (
              <DataTable
                rows={data.qualifications as { degree: string; field: string; institutionName: string; university: string; yearOfPassing: number; percentage: number | null; mode: string }[]}
                columns={[
                  { key: "deg", header: "Degree", render: (r) => <span className="text-[12.5px] font-medium">{r.degree.replace("_", " ")}</span> },
                  { key: "f", header: "Field", render: (r) => <span className="text-[12.5px]">{r.field}</span> },
                  { key: "i", header: "Institution", render: (r) => <span className="text-[12.5px] text-muted-foreground">{r.institutionName}, {r.university}</span> },
                  { key: "y", header: "Year", align: "right", render: (r) => <span className="text-[12.5px]">{r.yearOfPassing}</span> },
                  { key: "p", header: "Score", align: "right", render: (r) => <span className="text-[12.5px]">{r.percentage ? `${r.percentage}%` : "—"}</span> },
                ]}
              />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="service">
          <SectionCard title="Service history" description="Joining, promotions, transfers, revisions and separation">
            <DataTable
              rows={data.serviceEvents as { eventType: string; effectiveDate: string; referenceNo: string | null; details: string; remarks: string | null }[]}
              columns={[
                { key: "t", header: "Event", render: (r) => <StatusPill status={r.eventType} /> },
                { key: "d", header: "Details", render: (r) => <span className="text-[12.5px]">{r.details}</span> },
                { key: "e", header: "Effective", render: (r) => <span className="text-[12.5px]">{fmtDate(r.effectiveDate)}</span> },
                { key: "r", header: "Reference", render: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.referenceNo ?? "—"}</span> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        {data.salaryStructure ? (
          <TabsContent value="salary">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <SectionCard title="Salary structure" description={`Effective from ${fmtDate(data.salaryStructure.effectiveFrom)} · demonstration figures`}>
                <DataTable
                  rows={data.salaryStructure.components}
                  columns={[
                    { key: "n", header: "Component", render: (r) => <span className="text-[12.5px] font-medium">{r.name}</span> },
                    { key: "k", header: "Kind", render: (r) => <StatusPill status={r.kind} /> },
                    { key: "c", header: "Rule", render: (r) => <span className="text-[12px] text-muted-foreground">{r.calcType === "FIXED" ? "fixed amount" : `${r.value}% of basic`}</span> },
                  ]}
                />
              </SectionCard>
              <div className="space-y-4">
                <KpiStat label="Basic pay" value={inr(data.salaryStructure.basicMonthly)} unit="/mo" icon={<Wallet />} tone="gold" />
                {data.latestPayslip ? (
                  <KpiStat label={`Net pay (${data.latestPayslip.periodMonth}/${data.latestPayslip.periodYear})`} value={inr(data.latestPayslip.netPay)} icon={<Wallet />} />
                ) : null}
              </div>
            </div>
          </TabsContent>
        ) : null}

        {data.leaveBalances ? (
          <TabsContent value="leave">
            <SectionCard title="Leave balances (current year)">
              <DataTable
                rows={data.leaveBalances}
                columns={[
                  { key: "t", header: "Type", render: (r) => <span className="text-[12.5px] font-medium">{r.type}</span> },
                  { key: "e", header: "Entitled", align: "right", render: (r) => <span className="text-[12.5px]">{r.entitled}</span> },
                  { key: "u", header: "Used", align: "right", render: (r) => <span className="text-[12.5px]">{r.used}</span> },
                  { key: "p", header: "Pending", align: "right", render: (r) => <span className="text-[12.5px] text-amber-500/90">{r.pending}</span> },
                  { key: "a", header: "Available", align: "right", render: (r) => <span className="text-[12.5px] font-semibold text-[color:var(--chart-1)]">{r.available}</span> },
                ]}
              />
            </SectionCard>
          </TabsContent>
        ) : null}

        <TabsContent value="documents">
          <SectionCard title="Documents" description="Vault records for this employee">
            {data.documents.length === 0 ? <EmptyState title="No documents" /> : (
              <DataTable
                rows={data.documents}
                columns={[
                  { key: "t", header: "Document", render: (r) => <span className="text-[12.5px] font-medium">{r.title}</span> },
                  { key: "c", header: "Category", render: (r) => <span className="text-[12px] text-muted-foreground">{r.category}</span> },
                  { key: "a", header: "Access", render: (r) => <StatusPill status={r.accessLevel} /> },
                  { key: "e", header: "Expires", render: (r) => <span className="text-[12px]">{r.expiresOn ? fmtDate(r.expiresOn) : "—"}</span> },
                  { key: "v", header: "Verified", render: (r) => <StatusPill status={r.isVerified ? "APPROVED" : "PENDING"} /> },
                ]}
              />
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRows({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-1.5">
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{k}</dt>
          <dd className="truncate text-right text-[12.5px] font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
