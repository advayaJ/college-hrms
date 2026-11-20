"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Award, CheckCircle2, ClipboardCheck, Target, TrendingUp } from "lucide-react"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { fmtDate, relTime, titleCase } from "@/lib/format"
import {
  DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton, PageHeader, SectionCard, StatusPill,
} from "@/components/glass/kit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function AppraisalModule() {
  const { session } = useSession()
  const canReview = !!session?.permissions.includes("appraisal:review")
  const [tab, setTab] = React.useState(canReview ? "self" : "self")
  return (
    <div className="space-y-5">
      <PageHeader title="Performance & Appraisal" subtitle="Goals, self-assessment, reviews and outcomes" icon={<CheckCircle2 />} />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="self" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">My appraisal</TabsTrigger>
          {canReview ? <TabsTrigger value="team" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Team reviews</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="self"><SelfAppraisal /></TabsContent>
        {canReview ? <TabsContent value="team"><TeamReviews /></TabsContent> : null}
      </Tabs>
    </div>
  )
}

function SelfAppraisal() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["appraisal-self"],
    queryFn: () => api.get<{
      cycle: { id: string; name: string; periodFrom: string; periodTo: string; status: string; dueDate: string | null } | null
      goals: { id: string; title: string; description: string; category: string; weightPercent: number; status: string; completionPercent: number; agreedWithEmployee: boolean; evidenceNote: string | null }[]
      review: { status: string; selfAssessmentScore: number | null; reviewerScore: number | null; finalScore: number | null; grade: string | null; recommendation: string; reviewerComments: string | null; strengths: string | null; improvements: string | null; submittedAt: string | null; completedAt: string | null } | null
      history: { cycle: string; grade: string | null; finalScore: number | null; recommendation: string; completedAt: string }[]
    }>("/appraisal/self"),
  })
  const [selfOpen, setSelfOpen] = React.useState(false)
  const [selfForm, setSelfForm] = React.useState({ score: "75", comments: "" })
  const [busy, setBusy] = React.useState(false)

  if (isLoading || !data) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading appraisal" /></GlassCard>
  if (!data.cycle) return <GlassCard hover={false} className="p-8"><EmptyState title="No active appraisal cycle" hint="HR starts cycles from Settings → Appraisal." /></GlassCard>

  const submitSelf = async () => {
    setBusy(true)
    try {
      await api.post("/appraisal/self/submit", { selfAssessmentScore: Number(selfForm.score), selfComments: selfForm.comments })
      toast.success("Self-assessment submitted — your reviewer has been notified")
      setSelfOpen(false)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit")
    } finally {
      setBusy(false)
    }
  }

  const updateProgress = async (goalId: string, pct: number) => {
    try {
      await api.post(`/appraisal/goals/${goalId}/progress`, { completionPercent: pct })
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  return (
    <div className="space-y-5">
      <GlassCard hover={false} className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Active cycle</div>
          <div className="mt-1 text-[16px] font-semibold">{data.cycle.name}</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            {fmtDate(data.cycle.periodFrom)} → {fmtDate(data.cycle.periodTo)}{data.cycle.dueDate ? ` · due ${fmtDate(data.cycle.dueDate)}` : ""}
          </div>
        </div>
        {data.review && data.review.status === "PENDING" ? (
          <MetalButton onClick={() => setSelfOpen(true)}>Submit self-assessment</MetalButton>
        ) : <StatusPill status={data.review?.status ?? "PENDING"} />}
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat label="Goals" value={data.goals.length} icon={<Target />} />
        <KpiStat label="Goal progress" value={data.goals.length ? Math.round(data.goals.reduce((s, g) => s + g.completionPercent, 0) / data.goals.length) : 0} unit="%" icon={<TrendingUp />} tone="gold" />
        <KpiStat label="Final score" value={data.review?.finalScore ?? "—"} hint={data.review?.grade ? titleCase(data.review.grade) : "awaiting review"} icon={<Award />} />
      </div>

      <SectionCard title="My goals" description="Agreed targets for this cycle — update progress as work completes">
        {data.goals.length === 0 ? <EmptyState title="No goals set" hint="Your reporting officer assigns goals at cycle start." /> : (
          <div className="space-y-3">
            {data.goals.map((g) => (
              <GlassCard key={g.id} hover={false} className="p-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusPill status={g.category} className="border-border bg-muted text-muted-foreground" />
                  <span className="text-[13px] font-medium">{g.title}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{g.weightPercent}% weight</span>
                  <StatusPill status={g.status} />
                </div>
                {g.description ? <p className="mt-1.5 text-[12px] text-muted-foreground">{g.description}</p> : null}
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all" style={{ width: `${g.completionPercent}%`, background: "linear-gradient(90deg, var(--chart-1), var(--chart-3))" }} />
                  </div>
                  <span className="w-10 text-right text-[12px] font-semibold">{g.completionPercent}%</span>
                  <div className="flex gap-1">
                    {[25, 50, 75, 100].map((p) => (
                      <button key={p} type="button" onClick={() => updateProgress(g.id, p)} className="glass rounded-lg px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </SectionCard>

      {data.review?.reviewerComments ? (
        <SectionCard title="Reviewer feedback" description={`Reviewed ${data.review.completedAt ? fmtDate(data.review.completedAt) : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-xl p-3"><div className="text-[10px] tracking-widest text-muted-foreground uppercase">Strengths</div><p className="mt-1 text-[12.5px]">{data.review.strengths ?? "—"}</p></div>
            <div className="glass rounded-xl p-3"><div className="text-[10px] tracking-widest text-muted-foreground uppercase">Improvements</div><p className="mt-1 text-[12.5px]">{data.review.improvements ?? "—"}</p></div>
          </div>
          <p className="glass mt-3 rounded-xl p-3 text-[12.5px] leading-relaxed">{data.review.reviewerComments}</p>
        </SectionCard>
      ) : null}

      {data.history.length ? (
        <SectionCard title="Past cycles" description="Grades and recommendations">
          <DataTable
            rows={data.history}
            rowKey={(h) => h.cycle}
            columns={[
              { key: "c", header: "Cycle", render: (h) => <span className="text-[12.5px]">{h.cycle}</span> },
              { key: "g", header: "Grade", render: (h) => <StatusPill status={h.grade ?? "PENDING"} /> },
              { key: "s", header: "Score", align: "right", render: (h) => <span className="text-[12.5px] font-semibold">{h.finalScore ?? "—"}</span> },
              { key: "r", header: "Recommendation", render: (h) => <span className="text-[12px] text-muted-foreground">{titleCase(h.recommendation)}</span> },
            ]}
          />
        </SectionCard>
      ) : null}

      <Dialog open={selfOpen} onOpenChange={setSelfOpen}>
        <DialogContent className="liquid rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Submit self-assessment</DialogTitle></DialogHeader>
          <div className="grid gap-3.5">
            <div>
              <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Self score (0–100)</Label>
              <Input type="number" min={0} max={100} value={selfForm.score} onChange={(e) => setSelfForm({ ...selfForm, score: e.target.value })} className="glass h-9 rounded-xl text-sm" />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Self comments</Label>
              <textarea value={selfForm.comments} onChange={(e) => setSelfForm({ ...selfForm, comments: e.target.value })} placeholder="Goals progressing as planned; milestones on track…" className="glass min-h-28 w-full rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60" />
            </div>
            <p className="text-[10.5px] text-muted-foreground">Your HOD is notified to complete the review after submission.</p>
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <MetalButton variant="ghost" onClick={() => setSelfOpen(false)}>Cancel</MetalButton>
            <MetalButton onClick={submitSelf} disabled={busy || selfForm.comments.trim().length < 30}>{busy ? "Submitting…" : "Submit"}</MetalButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TeamReviews() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["appraisal-team"],
    queryFn: () => api.get<{
      cycle: { name: string; status: string; dueDate: string | null } | null
      reviews: { id: string; employee: { employeeCode: string; fullName: string; designation: { title: string | null } | null; department: { name: string | null } | null }; status: string; selfAssessmentScore: number | null; reviewerScore: number | null; finalScore: number | null; grade: string | null; recommendation: string; goals: { count: number; avg: number }; submittedAt: string | null; completedAt: string | null }[]
    }>("/appraisal/team"),
  })
  const [reviewFor, setReviewFor] = React.useState<{ id: string; name: string; selfScore: number | null } | null>(null)
  const [form, setForm] = React.useState({ score: "70", comments: "", strengths: "", improvements: "", recommendation: "NONE" })
  const [busy, setBusy] = React.useState(false)

  const submitReview = async () => {
    if (!reviewFor) return
    if (form.comments.trim().length < 30) {
      toast.error("Reviewer comments need at least 30 characters")
      return
    }
    setBusy(true)
    try {
      const res = await api.post<{ finalScore: number; grade: string }>(`/appraisal/reviews/${reviewFor.id}/review`, {
        reviewerScore: Number(form.score),
        reviewerComments: form.comments,
        strengths: form.strengths || undefined,
        improvements: form.improvements || undefined,
        recommendation: form.recommendation,
      })
      toast.success(`${reviewFor.name}: grade ${titleCase(res.grade)} (${res.finalScore}/100) — employee notified`)
      setReviewFor(null)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit review")
    } finally {
      setBusy(false)
    }
  }

  if (isLoading || !data) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading team reviews" /></GlassCard>

  return (
    <SectionCard title={`Team reviews — ${data.cycle?.name ?? ""}`} description="Self-submitted appraisals awaiting your review">
      {data.reviews.length === 0 ? <EmptyState title="No reviews in scope" /> : (
        <DataTable
          rows={data.reviews}
          rowKey={(r) => r.id}
          columns={[
            { key: "e", header: "Employee", render: (r) => <div><div className="text-[12.5px] font-medium">{r.employee.fullName}</div><div className="text-[10px] text-muted-foreground">{r.employee.employeeCode} · {r.employee.designation?.title ?? "—"}</div></div> },
            { key: "g", header: "Goals", align: "center", render: (r) => <span className="text-[12px] text-muted-foreground">{r.goals.count} · {Math.round(r.goals.avg)}%</span> },
            { key: "s", header: "Self score", align: "right", render: (r) => <span className="text-[12.5px]">{r.selfAssessmentScore ?? "—"}</span> },
            { key: "r", header: "Review score", align: "right", render: (r) => <span className="text-[12.5px]">{r.reviewerScore ?? "—"}</span> },
            { key: "f", header: "Final", align: "right", render: (r) => <span className="text-[12.5px] font-semibold">{r.finalScore ?? "—"}</span> },
            { key: "st", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            {
              key: "a", header: "", align: "right",
              render: (r) => r.status === "SELF_SUBMITTED" || r.status === "UNDER_REVIEW" ? (
                <MetalButton className="px-2.5 py-1 text-[11px]" onClick={() => { setReviewFor({ id: r.id, name: r.employee.fullName, selfScore: r.selfAssessmentScore }); setForm({ ...form, score: String(r.selfAssessmentScore ?? 70) }) }}>
                  Review
                </MetalButton>
              ) : null,
            },
          ]}
        />
      )}

      <Dialog open={!!reviewFor} onOpenChange={(v) => !v && setReviewFor(null)}>
        <DialogContent className="liquid max-h-[85vh] overflow-y-auto rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Review — {reviewFor?.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">Final score = average of reviewer and self-assessment; recommendation feeds promotions and training plans.</p>
          </DialogHeader>
          <div className="grid gap-3.5">
            <div>
              <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Reviewer score (0–100)</Label>
              <Input type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} className="glass h-9 rounded-xl text-sm" />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Reviewer comments</Label>
              <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} placeholder="Consistent performance; contributions noted…" className="glass min-h-24 w-full rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Strengths</Label>
                <Input value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} className="glass h-9 rounded-xl text-sm" />
              </div>
              <div>
                <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Improvements</Label>
                <Input value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} className="glass h-9 rounded-xl text-sm" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Recommendation</Label>
              <div className="flex flex-wrap gap-1.5">
                {["NONE", "TRAINING", "SALARY_REVISION", "PROMOTION"].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, recommendation: r })}
                    className={`glass rounded-xl px-3 py-1.5 text-[11.5px] ${form.recommendation === r ? "border-[color:var(--chart-1)]/60 text-foreground" : "text-muted-foreground"}`}>
                    {titleCase(r)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <MetalButton variant="ghost" onClick={() => setReviewFor(null)}>Cancel</MetalButton>
            <MetalButton onClick={submitReview} disabled={busy}>{busy ? "Submitting…" : "Complete review"}</MetalButton>
          </div>
        </DialogContent>
      </Dialog>
    </SectionCard>
  )
}
