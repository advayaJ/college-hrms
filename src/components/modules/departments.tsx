"use client";

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Building2, ChevronLeft, GraduationCap, Landmark, MapPin, UserRoundSearch } from "lucide-react"
import { api } from "@/lib/api"
import { navigate } from "@/lib/router"
import { fmtDate, titleCase } from "@/lib/format"
import { Avatar, DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, PageHeader, SectionCard, StatusPill } from "@/components/glass/kit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DepartmentsData {
  departments: { id: string; code: string; name: string; establishedYear: number | null; campus: string; campusId: string; faculty: string | null; hod: { code: string; name: string } | null; employeeCount: number; isActive: boolean }[]
  campuses: { id: string; code: string; name: string; city: string; state: string; isMain: boolean; departmentCount: number; employeeCount: number }[]
  faculties: { id: string; code: string; name: string; kind: string; departmentCount: number }[]
}

export default function DepartmentsModule({ departmentId }: { departmentId?: string }) {
  if (departmentId) return <DepartmentDetail id={departmentId} />
  return <DirectoryHome />
}

function DirectoryHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<DepartmentsData>("/departments"),
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Departments & Structure" subtitle="Faculties, schools, campuses and departmental leadership" icon={<Building2 />} />
      {isLoading || !data ? (
        <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading structure" /></GlassCard>
      ) : (
        <Tabs defaultValue="departments" className="space-y-4">
          <TabsList className="glass rounded-xl p-1">
            {["departments", "campuses", "faculties"].map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">
                {titleCase(t)} ({t === "departments" ? data.departments.length : t === "campuses" ? data.campuses.length : data.faculties.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="departments">
            <DataTable
              rows={data.departments}
              onRowClick={(d) => navigate(`#/departments/${d.id}`)}
              rowKey={(d) => d.id}
              columns={[
                {
                  key: "n", header: "Department",
                  render: (d) => (
                    <div>
                      <div className="text-[13.5px] font-medium">{d.name}</div>
                      <div className="font-mono text-[10.5px] text-muted-foreground">{d.code} · est. {d.establishedYear ?? "—"}</div>
                    </div>
                  ),
                },
                { key: "c", header: "Campus", render: (d) => <span className="text-[12.5px]">{d.campus}</span> },
                { key: "f", header: "Faculty / School", render: (d) => <span className="text-[12.5px] text-muted-foreground">{d.faculty ?? "—"}</span> },
                {
                  key: "h", header: "Head",
                  render: (d) => d.hod ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={d.hod.name} seed={d.hod.code.length * 17} size={26} />
                      <span className="text-[12.5px]">{d.hod.name}</span>
                    </div>
                  ) : <span className="text-[12px] text-muted-foreground">vacant</span>,
                },
                { key: "e", header: "Strength", align: "right", render: (d) => <span className="text-[13px] font-semibold text-[color:var(--chart-1)]">{d.employeeCount}</span> },
                { key: "s", header: "State", render: (d) => <StatusPill status={d.isActive ? "ACTIVE" : "ON_HOLD"} /> },
              ]}
            />
          </TabsContent>

          <TabsContent value="campuses">
            <div className="grid gap-4 md:grid-cols-3">
              {data.campuses.map((c) => (
                <GlassCard key={c.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="glass kpi-glow flex size-10 items-center justify-center rounded-xl"><MapPin className="size-4" /></div>
                      <div>
                        <div className="text-[14px] font-semibold">{c.name}</div>
                        <div className="text-[10.5px] text-muted-foreground">{c.city}, {c.state} {c.isMain ? "· main" : ""}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div className="glass rounded-xl px-3 py-2">
                      <div className="text-xl font-semibold text-[color:var(--chart-1)]">{c.departmentCount}</div>
                      <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Departments</div>
                    </div>
                    <div className="glass rounded-xl px-3 py-2">
                      <div className="text-xl font-semibold text-[color:var(--chart-1)]">{c.employeeCount}</div>
                      <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Employees</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faculties">
            <DataTable
              rows={data.faculties}
              columns={[
                {
                  key: "n", header: "Faculty / School",
                  render: (f) => (
                    <div className="flex items-center gap-3">
                      <div className="glass flex size-9 items-center justify-center rounded-xl"><GraduationCap className="size-4" /></div>
                      <div>
                        <div className="text-[13.5px] font-medium">{f.name}</div>
                        <div className="text-[10.5px] text-muted-foreground">{titleCase(f.kind)} · {f.code}</div>
                      </div>
                    </div>
                  ),
                },
                { key: "d", header: "Departments", align: "right", render: (f) => <span className="text-[13px] font-semibold text-[color:var(--chart-1)]">{f.departmentCount}</span> },
              ]}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function DepartmentDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["department", id],
    queryFn: () => api.get<{
      department: { id: string; code: string; name: string; establishedYear: number | null; campus: string; faculty: string | null; hod: { code: string; name: string; email: string } | null; isActive: boolean }
      employees: { code: string; name: string; designation: string | null; staffType: string; status: string; joiningDate: string; photoSeed: number }[]
      workloadSummary: { term: string; teachingHours: number; overloadedCount: number; facultyCount: number } | null
    }>(`/departments/${id}`),
  })

  if (isLoading) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading department" /></GlassCard>
  if (!data) return <GlassCard hover={false} className="p-8"><EmptyState title="Department not found" /></GlassCard>

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("#/departments")} className="glass glass-hover flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] text-muted-foreground">
        <ChevronLeft className="size-3.5" /> All departments
      </button>
      <PageHeader title={data.department.name} subtitle={`${data.department.campus}${data.department.faculty ? ` · ${data.department.faculty}` : ""}`} icon={<Landmark />} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Strength" value={data.employees.length} icon={<UserRoundSearch />} />
        <KpiStat label="Head of department" value={data.department.hod?.name.split(" ").slice(-1)[0] ?? "Vacant"} hint={data.department.hod?.name ?? "Not assigned"} icon={<UserRoundSearch />} />
        {data.workloadSummary ? (
          <KpiStat label="Teaching hours" value={data.workloadSummary.teachingHours} hint={`${data.workloadSummary.term}`} icon={<GraduationCap />} />
        ) : null}
        {data.workloadSummary ? (
          <KpiStat label="Overloaded faculty" value={data.workloadSummary.overloadedCount} hint="norm 16h/week" icon={<GraduationCap />} tone={data.workloadSummary.overloadedCount > 0 ? "warning" : "default"} />
        ) : null}
      </div>

      <SectionCard title="Faculty & staff" description="Active members of the department">
        <DataTable
          rows={data.employees}
          rowKey={(e) => e.code}
          onRowClick={(e) => navigate(`#/employees/${e.code}`)}
          columns={[
            {
              key: "n", header: "Member",
              render: (e) => (
                <div className="flex items-center gap-3">
                  <Avatar name={e.name} seed={e.photoSeed} size={30} />
                  <div>
                    <div className="text-[13px] font-medium">{e.name}</div>
                    <div className="font-mono text-[10.5px] text-muted-foreground">{e.code}</div>
                  </div>
                </div>
              ),
            },
            { key: "d", header: "Designation", render: (e) => <span className="text-[12.5px]">{e.designation ?? "—"}</span> },
            { key: "t", header: "Type", render: (e) => <span className="text-[12px] text-muted-foreground">{titleCase(e.staffType)}</span> },
            { key: "j", header: "Joined", render: (e) => <span className="text-[12px]">{fmtDate(e.joiningDate)}</span> },
            { key: "s", header: "Status", render: (e) => <StatusPill status={e.status} /> },
          ]}
        />
      </SectionCard>
    </div>
  )
}
