"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { BookMarked, GraduationCap, Microscope, PenLine, UserRoundCheck } from "lucide-react"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { titleCase } from "@/lib/format"
import {
  ChartFrame, DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, PageHeader, SectionCard, StatusPill,
} from "@/components/glass/kit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--glass-border)", borderRadius: "12px", fontSize: "12px", color: "var(--foreground)" },
  labelStyle: { color: "var(--muted-foreground)", fontSize: "11px" },
}

export default function WorkloadModule() {
  const { session } = useSession()
  const isSelf = session ? !session.permissions.some((p) => p.startsWith("workload:read_all") || p.startsWith("workload:read_dept")) : false
  const [tab, setTab] = React.useState(isSelf ? "self" : "overview")
  const { data: terms } = useQuery({
    queryKey: ["terms"],
    queryFn: () => api.get<{ id: string; name: string; isActive: boolean }[]>("/workload/terms"),
  })
  const [termId, setTermId] = React.useState<string | undefined>(undefined)
  const effectiveTermId = termId ?? terms?.find((t) => t.isActive)?.id ?? terms?.[0]?.id

  const { data, isLoading } = useQuery({
    queryKey: ["workload", effectiveTermId],
    queryFn: () => api.get<{
      term: { name: string } | null
      entries: { employee: { employeeCode: string; fullName: string; designation: { title: string | null } | null }; department: string | null; teachingHours: number; labHours: number; tutorialHours: number; supervisions: number; adminPoints: number; researchPoints: number; totalLoadPoints: number; standardHours: number; isOverloaded: boolean }[]
      subjects: { id: string; code: string; title: string; department: string | null; employee: { code: string; name: string } | null; lectureHours: number; tutorialHours: number; labHours: number; credits: number; groups: number }[]
      byDepartment: { department: string; faculty: number; teachingHours: number; overloaded: number; avgLoad: number }[]
      summary: { faculty: number; overloaded: number; totalTeachingHours: number; subjects: number; unassignedSubjects: number } | null
    }>(`/workload/overview${effectiveTermId ? `?termId=${effectiveTermId}` : ""}`),
    enabled: !isSelf,
  })

  const { data: self, isLoading: selfLoading } = useQuery({
    queryKey: ["workload-self"],
    queryFn: () => api.get<{
      term: { name: string } | null
      subjects: { code: string; title: string; department: string | null; lectureHours: number; tutorialHours: number; labHours: number; credits: number; groups: number }[]
      workload: { teachingHours: number; labHours: number; tutorialHours: number; supervisions: number; adminPoints: number; researchPoints: number; totalLoadPoints: number; standardHours: number; isOverloaded: boolean } | null
      research: { outputType: string; title: string; venue: string; year: number; indexedIn: string | null; status: string; amountSanctioned: number | null }[]
      mentoring: { kind: string; studentOrTopic: string; count: number; year: number }[]
      trainings: { kind: string; programTitle: string; organiser: string; hours: number; fromDate: string; toDate: string }[]
      adminDuties: { title: string; since: string; pointsPerWeek: number }[]
      totals: { publications: number; projects: number; trainingHours: number; supervisions: number }
    }>("/workload/self"),
  })

  if (isSelf) return <SelfWorkload />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Faculty Workload & Academics"
        subtitle={`Subject allocation, load norms (16h/week) and academic contributions${data?.term ? ` — ${data.term.name}` : ""}`}
        icon={<GraduationCap />}
        actions={
          terms && terms.length > 1 ? (
            <select
              value={effectiveTermId ?? ""}
              onChange={(e) => setTermId(e.target.value)}
              className="glass h-9 rounded-xl px-3 text-xs text-foreground outline-none"
            >
              {terms.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isActive ? " · active" : ""}</option>)}
            </select>
          ) : undefined
        }
      />

      {isLoading || !data ? <GlassCard hover={false} className="p-6"><LoadingBlock label="Aggregating workload" /></GlassCard> : (
        <React.Fragment>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiStat label="Teaching faculty" value={data.summary?.faculty ?? 0} icon={<UserRoundCheck />} />
            <KpiStat label="Total contact hours" value={data.summary?.totalTeachingHours ?? 0} unit="/wk" icon={<BookMarked />} tone="gold" />
            <KpiStat label="Overloaded" value={data.summary?.overloaded ?? 0} icon={<BookMarked />} tone={data.summary?.overloaded ? "warning" : "default"} />
            <KpiStat label="Subjects" value={`${data.summary?.subjects ?? 0}${data.summary?.unassignedSubjects ? ` · ${data.summary.unassignedSubjects} unassigned` : ""}`} icon={<PenLine />} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartFrame title="Teaching hours by department" description="Weekly contact hours">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.byDepartment.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 8.5, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={0} angle={-22} textAnchor="end" height={52} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="teachingHours" name="Hours/week" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>

            <SectionCard title="Load distribution" description="Top weekly loads against the norm">
              <DataTable
                rows={data.entries.slice(0, 12)}
                rowKey={(e) => e.employee.employeeCode}
                columns={[
                  { key: "n", header: "Faculty", render: (e) => <div><div className="text-[12.5px] font-medium">{e.employee.fullName}</div><div className="text-[10px] text-muted-foreground">{e.employee.designation?.title ?? "—"} · {e.department ?? "—"}</div></div> },
                  { key: "t", header: "Load", align: "right", render: (e) => <span className={`text-[13px] font-semibold ${e.isOverloaded ? "text-amber-500/90" : "text-[color:var(--chart-1)]"}`}>{e.teachingHours + e.labHours}h</span> },
                  { key: "p", header: "Points", align: "right", render: (e) => <span className="text-[12px] text-muted-foreground">{e.totalLoadPoints}</span> },
                  { key: "s", header: "State", render: (e) => <StatusPill status={e.isOverloaded ? "ON_HOLD" : "COMPLETED"} /> },
                ]}
              />
            </SectionCard>
          </div>

          <SectionCard title="Subject allocation" description="Current term allocations">
            <DataTable
              rows={data.subjects}
              rowKey={(s) => s.id}
              columns={[
                { key: "c", header: "Code", render: (s) => <span className="font-mono text-[11.5px]">{s.code}</span> },
                { key: "t", header: "Subject", render: (s) => <span className="text-[12.5px] font-medium">{s.title}</span> },
                { key: "d", header: "Department", render: (s) => <span className="text-[12px] text-muted-foreground">{s.department ?? "—"}</span> },
                { key: "e", header: "Assigned", render: (s) => s.employee ? <span className="text-[12px]">{s.employee.name}</span> : <span className="text-[11px] text-amber-500/90">unassigned</span> },
                { key: "h", header: "L/T/L", align: "center", render: (s) => <span className="text-[12px] text-muted-foreground">{s.lectureHours}/{s.tutorialHours}/{s.labHours}</span> },
                { key: "cr", header: "Credits", align: "right", render: (s) => <span className="text-[12px]">{s.credits}</span> },
              ]}
            />
          </SectionCard>
        </React.Fragment>
      )}
    </div>
  )
}

function SelfWorkload() {
  const { data, isLoading } = useQuery({
    queryKey: ["workload-self"],
    queryFn: () => api.get<{
      term: { name: string } | null
      subjects: { code: string; title: string; department: string | null; lectureHours: number; tutorialHours: number; labHours: number; credits: number; groups: number }[]
      workload: { teachingHours: number; labHours: number; tutorialHours: number; supervisions: number; adminPoints: number; researchPoints: number; totalLoadPoints: number; standardHours: number; isOverloaded: boolean } | null
      research: { outputType: string; title: string; venue: string; year: number; indexedIn: string | null; status: string; amountSanctioned: number | null }[]
      mentoring: { kind: string; studentOrTopic: string; count: number; year: number }[]
      trainings: { kind: string; programTitle: string; organiser: string; hours: number; fromDate: string; toDate: string }[]
      adminDuties: { title: string; since: string; pointsPerWeek: number }[]
      totals: { publications: number; projects: number; trainingHours: number; supervisions: number }
    }>("/workload/self"),
  })

  if (isLoading || !data) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading your academic profile" /></GlassCard>
  const w = data.workload

  return (
    <div className="space-y-5">
      <PageHeader title="My Workload & Academics" subtitle={`${data.term?.name ?? "Current term"} · contributions and load`} icon={<GraduationCap />} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Teaching load" value={w ? `${w.teachingHours + w.labHours}h` : "—"} unit="/wk" tone={w?.isOverloaded ? "warning" : "default"} icon={<BookMarked />} />
        <KpiStat label="Publications" value={data.totals.publications} icon={<Microscope />} />
        <KpiStat label="Projects / consultancy" value={data.totals.projects} icon={<Microscope />} />
        <KpiStat label="Supervisions" value={data.totals.supervisions} icon={<UserRoundCheck />} />
      </div>

      <SectionCard title="Allocated subjects" description="Current term teaching allocation">
        {data.subjects.length === 0 ? <EmptyState title="No subjects allocated" /> : (
          <DataTable
            rows={data.subjects}
            rowKey={(s) => s.code}
            columns={[
              { key: "c", header: "Code", render: (s) => <span className="font-mono text-[11.5px]">{s.code}</span> },
              { key: "t", header: "Subject", render: (s) => <span className="text-[12.5px] font-medium">{s.title}</span> },
              { key: "h", header: "L/T/L", align: "center", render: (s) => <span className="text-[12px] text-muted-foreground">{s.lectureHours}/{s.tutorialHours}/{s.labHours}</span> },
              { key: "cr", header: "Credits", align: "right", render: (s) => <span className="text-[12px]">{s.credits}</span> },
              { key: "g", header: "Groups", align: "right", render: (s) => <span className="text-[12px]">{s.groups}</span> },
            ]}
          />
        )}
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Research output" description="Publications, patents and projects">
          {data.research.length === 0 ? <EmptyState title="No research records" /> : (
            <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {data.research.map((r, i) => (
                <li key={i} className="glass rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <StatusPill status={r.status} />
                    <span className="ml-auto text-[10.5px] text-muted-foreground">{r.year}{r.amountSanctioned ? ` · ${inrCompact(r.amountSanctioned)}` : ""}</span>
                  </div>
                  <div className="mt-1 text-[12.5px] font-medium">{r.title}</div>
                  <div className="mt-0.5 text-[10.5px] text-muted-foreground">{titleCase(r.outputType)} · {r.venue}{r.indexedIn ? ` · ${r.indexedIn}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Mentoring & supervision">
            {data.mentoring.length === 0 ? <EmptyState title="No mentoring entries" /> : (
              <DataTable
                rows={data.mentoring}
                rowKey={(m, i) => String(i)}
                columns={[
                  { key: "k", header: "Kind", render: (m) => <span className="text-[12px]">{titleCase(m.kind)}</span> },
                  { key: "s", header: "Student / topic", render: (m) => <span className="text-[12px] text-muted-foreground">{m.studentOrTopic}</span> },
                  { key: "c", header: "Count", align: "right", render: (m) => <span className="text-[12.5px] font-semibold">{m.count}</span> },
                  { key: "y", header: "Year", align: "right", render: (m) => <span className="text-[12px] text-muted-foreground">{m.year}</span> },
                ]}
              />
            )}
          </SectionCard>
          <SectionCard title="Training & development" description={`FDPs, workshops, MOOCs — ${data.totals.trainingHours} hours`}>
            {data.trainings.length === 0 ? <EmptyState title="No training records" /> : (
              <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                {data.trainings.map((t, i) => (
                  <li key={i} className="glass flex items-center gap-3 rounded-xl px-3 py-2 text-[12px]">
                    <span className="size-1.5 shrink-0 rounded-full bg-[color:var(--chart-1)]" />
                    <span className="min-w-0 flex-1 truncate">{t.programTitle}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{titleCase(t.kind)} · {t.hours}h</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          {data.adminDuties.length ? (
            <SectionCard title="Administrative responsibilities">
              <ul className="space-y-1.5">
                {data.adminDuties.map((d, i) => (
                  <li key={i} className="glass flex items-center gap-3 rounded-xl px-3 py-2 text-[12px]">
                    <span className="size-1.5 shrink-0 rounded-full bg-[color:var(--chart-2)]" />
                    <span className="min-w-0 flex-1 truncate">{d.title}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{d.pointsPerWeek} pt/wk</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function inrCompact(v: number) {
  return `₹${(v / 100000).toFixed(1)}L`
}
