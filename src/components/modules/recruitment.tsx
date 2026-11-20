"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Briefcase, CalendarClock, ChevronLeft, FileUser, Sparkles, Trophy } from "lucide-react"
import { api } from "@/lib/api"
import { navigate } from "@/lib/router"
import { fmtDate, fmtDateTime, inr, relTime, titleCase } from "@/lib/format"
import {
  Avatar, DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton, PageHeader,
  SectionCard, StatusPill,
} from "@/components/glass/kit"

interface VacancyRow {
  id: string; requisitionNo: string; title: string; department: string | null; designation: string | null
  campus: string; employmentType: string; openings: number; filledCount: number; status: string
  openedAt: string | null; targetJoinBy: string | null; approvalRequestId: string | null
  applicationCount: number; stages: Record<string, number>; salaryRangeMin: number | null; salaryRangeMax: number | null
}

export default function RecruitmentModule({ vacancyId }: { vacancyId?: string }) {
  if (vacancyId) return <VacancyDetail id={vacancyId} />
  return <RecruitmentHome />
}

function RecruitmentHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["vacancies"],
    queryFn: () => api.get<VacancyRow[]>("/recruitment/vacancies"),
  })
  const { data: pipeline } = useQuery({
    queryKey: ["recruitment-pipeline"],
    queryFn: () => api.get<{ stages: Record<string, number>; openVacancies: number; upcomingInterviews: { id: number; roundNo: number; kind: string; mode: string; scheduledAt: string; candidate: string; vacancy: string }[] }>("/recruitment/pipeline"),
  })

  if (isLoading || !data) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading recruitment" /></GlassCard>

  return (
    <div className="space-y-5">
      <PageHeader title="Recruitment" subtitle="Requisitions, candidate pipeline, interviews and onboarding" icon={<Briefcase />} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat label="Open vacancies" value={pipeline?.openVacancies ?? data.filter((v) => v.status === "OPEN").length} icon={<Briefcase />} />
        <KpiStat label="In pipeline" value={(pipeline?.stages.SHORTLISTED ?? 0) + (pipeline?.stages.INTERVIEW_SCHEDULED ?? 0) + (pipeline?.stages.INTERVIEWED ?? 0)} icon={<FileUser />} tone="gold" />
        <KpiStat label="Offers out" value={(pipeline?.stages.OFFERED ?? 0) + (pipeline?.stages.OFFER_ACCEPTED ?? 0)} icon={<Sparkles />} />
        <KpiStat label="Onboarded" value={pipeline?.stages.ONBOARDED ?? 0} icon={<Trophy />} tone="success" />
      </div>

      {pipeline && pipeline.upcomingInterviews.length > 0 ? (
        <SectionCard title="Upcoming interviews" description="Scheduled rounds across open positions">
          <ul className="grid gap-2 sm:grid-cols-2">
            {pipeline.upcomingInterviews.map((i) => (
              <li key={i.id} className="glass flex items-center gap-3 rounded-xl px-3 py-2.5">
                <CalendarClock className="size-4 shrink-0 text-[color:var(--chart-1)]" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium">{i.candidate} — round {i.roundNo}</div>
                  <div className="truncate text-[10.5px] text-muted-foreground">{titleCase(i.kind)} · {i.vacancy} · {fmtDateTime(i.scheduledAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard title="Vacancies" description="Requisitions and their pipelines">
        {data.length === 0 ? <EmptyState title="No vacancies" /> : (
          <DataTable
            rows={data}
            rowKey={(v) => v.requisitionNo}
            onRowClick={(v) => navigate(`#/recruitment/${v.id}`)}
            columns={[
              {
                key: "t", header: "Position",
                render: (v) => <div><div className="text-[12.5px] font-medium">{v.title}</div><div className="font-mono text-[10px] text-muted-foreground">{v.requisitionNo} · {v.department ?? "—"} · {v.campus}</div></div>,
              },
              { key: "o", header: "Openings", align: "center", render: (v) => <span className="text-[12.5px]">{v.filledCount}/{v.openings}</span> },
              { key: "a", header: "Applications", align: "center", render: (v) => <span className="text-[12.5px] font-semibold text-[color:var(--chart-1)]">{v.applicationCount}</span> },
              { key: "s", header: "Pipeline", render: (v) => <span className="text-[10.5px] text-muted-foreground">{Object.entries(v.stages).map(([k, n]) => `${titleCase(k)} ${n}`).join(" · ") || "—"}</span> },
              { key: "st", header: "Status", render: (v) => <StatusPill status={v.status} /> },
            ]}
          />
        )}
      </SectionCard>
    </div>
  )
}

function VacancyDetail({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["vacancy", id],
    queryFn: () => api.get<{
      vacancy: { requisitionNo: string; title: string; description: string; department: string | null; designation: string | null; campus: string; employmentType: string; openings: number; filledCount: number; status: string; openedAt: string | null; targetJoinBy: string | null; salaryRangeMin: number | null; salaryRangeMax: number | null; justification: string | null; approvalRequestId: string | null }
      applications: {
        id: string; status: string; appliedAt: string; rating: number | null; shortlistNote: string | null
        offerCtc: number | null; offerSentAt: string | null; joinedOn: string | null; onboardedEmployeeCode: string | null; rejectReason: string | null
        candidate: { candidateCode: string; name: string; email: string; phone: string; city: string; highestQualification: string; specialization: string | null; experienceYears: number; expectedCtc: number | null; currentCtc: number | null; source: string }
        interviews: { id: string; roundNo: number; kind: string; mode: string; scheduledAt: string; venueOrLink: string; status: string; overallRating: number | null; recommendation: string | null; feedback: string | null }[]
      }[]
    }>(`/recruitment/vacancies/${id}`),
  })

  if (isLoading || !data) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading vacancy" /></GlassCard>
  const v = data.vacancy

  const act = async (appId: string, action: string, body?: unknown) => {
    try {
      await api.post(`/recruitment/applications/${appId}/${action}`, body)
      toast.success(`Application ${action.replace(/[-_]/g, " ")} — pipeline updated`)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${action}`)
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("#/recruitment")} className="glass glass-hover flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] text-muted-foreground">
        <ChevronLeft className="size-3.5" /> All vacancies
      </button>

      <PageHeader
        title={v.title}
        subtitle={`${v.requisitionNo} · ${v.department ?? "—"} · ${v.designation ?? "—"} · ${titleCase(v.employmentType)}`}
        actions={<StatusPill status={v.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <KpiStat label="Openings" value={`${v.filledCount}/${v.openings}`} icon={<Briefcase />} />
        <KpiStat label="Applications" value={data.applications.length} icon={<FileUser />} />
        <KpiStat label="Salary range" value={v.salaryRangeMin && v.salaryRangeMax ? `${inr(v.salaryRangeMin, true)}–${inr(v.salaryRangeMax, true)}` : "—"} icon={<Sparkles />} tone="gold" />
        <KpiStat label="Target joining" value={v.targetJoinBy ? fmtDate(v.targetJoinBy) : "—"} icon={<CalendarClock />} />
      </div>

      {v.approvalRequestId ? (
        <MetalButton variant="ghost" onClick={() => navigate(`#/approvals/${v.approvalRequestId}`)}>View requisition approval →</MetalButton>
      ) : null}

      <SectionCard title="Candidate pipeline" description="Applications from applied through onboarded">
        {data.applications.length === 0 ? <EmptyState title="No applications yet" /> : (
          <div className="space-y-3">
            {data.applications.map((a) => (
              <GlassCard key={a.id} hover={false} className="p-4">
                <div className="flex flex-wrap items-center gap-3.5">
                  <Avatar name={a.candidate.name} seed={a.candidate.candidateCode.length * 13} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-semibold">{a.candidate.name}</span>
                      <StatusPill status={a.status} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[10.5px] text-muted-foreground">
                      <span>{a.candidate.candidateCode}</span>
                      <span>{a.candidate.highestQualification}{a.candidate.specialization ? ` · ${a.candidate.specialization}` : ""}</span>
                      <span>{a.candidate.experienceYears} yr exp</span>
                      <span>{titleCase(a.candidate.source)}</span>
                    </div>
                  </div>
                  <div className="text-right text-[10.5px] text-muted-foreground">
                    <div>Expected {a.candidate.expectedCtc ? inr(a.candidate.expectedCtc, true) : "—"}</div>
                    <div>Applied {relTime(a.appliedAt)}</div>
                  </div>
                </div>

                {a.interviews.length > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    {a.interviews.map((i) => (
                      <div key={i.id} className="glass flex flex-wrap items-center gap-2.5 rounded-xl px-3 py-1.5 text-[11.5px]">
                        <span className="font-semibold">R{i.roundNo}</span>
                        <span>{titleCase(i.kind)}</span>
                        <span className="text-muted-foreground">{fmtDateTime(i.scheduledAt)} · {titleCase(i.mode)}</span>
                        {i.overallRating ? <span className="text-[color:var(--chart-1)]">★ {i.overallRating}/5</span> : null}
                        {i.recommendation ? <StatusPill status={i.recommendation === "STRONG_HIRE" ? "APPROVED" : i.recommendation === "NO_HIRE" ? "REJECTED" : "PENDING"} /> : null}
                        <span className="ml-auto">{titleCase(i.status)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.status === "APPLIED" ? <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => act(a.id, "shortlist", { note: "Matches the specialization requirement" })}>Shortlist</MetalButton> : null}
                  {["APPLIED", "WAITLISTED"].includes(a.status) ? (
                    <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => act(a.id, "reject", { reason: "Qualification mismatch" })}>Reject</MetalButton>
                  ) : null}
                  {a.status === "INTERVIEWED" ? (
                    <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => act(a.id, "offer", { offerCtc: a.candidate.expectedCtc ?? 600000 })}>Make offer</MetalButton>
                  ) : null}
                  {a.status === "OFFERED" ? (
                    <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => act(a.id, "offer-response", { accepted: true })}>Record acceptance</MetalButton>
                  ) : null}
                  {a.status === "OFFER_ACCEPTED" ? (
                    <MetalButton className="px-2.5 py-1 text-[11px]" onClick={() => act(a.id, "onboard", { joiningDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) })}>Onboard as employee</MetalButton>
                  ) : null}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
