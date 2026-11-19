"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft, CheckCircle2, ChevronLeft, ClipboardList, Clock, History, Undo2, XCircle,
} from "lucide-react"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { navigate } from "@/lib/router"
import { fmtDate, fmtDateTime, fmtDays, relTime, titleCase } from "@/lib/format"
import {
  Avatar, DataTable, EmptyState, GlassCard, LoadingBlock, MetalButton, PageHeader, SectionCard, StatusPill, cn,
} from "@/components/glass/kit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface PendingItem {
  id: string
  referenceNo: string
  docType: string
  title: string
  initiatorName: string
  submittedAt: string
  currentStageSeq: number
  workflowName: string
  stage: { seq: number; name: string; strategy: string; minApprovals: number; approvalsSoFar: number }
  doc: null | Record<string, never>
}

interface ApprovalDetail {
  request: { id: string; referenceNo: string; docType: string; docId: string; title: string; initiatorName: string; status: string; currentStageSeq: number; submittedAt: string; decidedAt: string | null }
  workflow: { name: string; stages: { seq: number; name: string; strategy: string; minApprovals: number; approverType: string; slaHours: number | null; isFinal: boolean }[] }
  currentStage: null | { seq: number; name: string; strategy: string; minApprovals: number; actors: { id: string; name: string; email: string }[] }
  timeline: { stageSeq: number; actorName: string; actorRoleKey: string | null; action: string; comment: string | null; actedAt: string }[]
  doc: null | Record<string, never>
}

export default function ApprovalsModule({ requestId }: { requestId?: string }) {
  if (requestId) return <ApprovalDetailPage id={requestId} />
  return <ApprovalsHome />
}

function ApprovalsHome() {
  const [tab, setTab] = React.useState("pending")
  const { data: pending, isLoading } = useQuery({
    queryKey: ["approvals-pending"],
    queryFn: () => api.get<PendingItem[]>("/approvals/pending"),
    refetchInterval: 30000,
  })
  const { data: history } = useQuery({
    queryKey: ["approvals-history"],
    queryFn: () => api.get<{ id: string; referenceNo: string; docType: string; title: string; initiatorName: string; workflowName: string; status: string; currentStageSeq: number; submittedAt: string; decidedAt: string | null }[]>("/approvals/history"),
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Approval Workflows" subtitle="Your queue, routed requests and complete decision history" icon={<ClipboardList />} />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="pending" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">
            My queue {pending ? `(${pending.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {isLoading ? (
            <GlassCard hover={false} className="p-6"><LoadingBlock label="Resolving your queue" /></GlassCard>
          ) : (pending ?? []).length === 0 ? (
            <GlassCard hover={false} className="p-8">
              <EmptyState title="Your approval queue is clear" hint="Requests routed to your role appear here with stage context." />
            </GlassCard>
          ) : (
            <div className="grid gap-3">
              {pending!.map((p) => (
                <GlassCard key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                  <Avatar name={p.initiatorName || "?"} seed={p.initiatorName.length} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-semibold">{p.title}</span>
                      <StatusPill status={p.docType} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                      <span>{p.initiatorName}</span>
                      <span className="font-mono">{p.referenceNo}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" />{relTime(p.submittedAt)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] tracking-widest text-muted-foreground uppercase">Stage {p.currentStageSeq}</div>
                    <div className="text-[12.5px] font-medium">{p.stage.name}</div>
                    {p.stage.strategy !== "ANY" ? (
                      <div className="text-[10px] text-amber-500/90">{titleCase(p.stage.strategy)} · {p.stage.approvalsSoFar}/{p.stage.strategy === "ALL" ? "all" : p.stage.minApprovals}</div>
                    ) : null}
                  </div>
                  <MetalButton onClick={() => navigate(`#/approvals/${p.id}`)}>
                    Review <ArrowLeft className="ml-1 size-3.5 rotate-180" />
                  </MetalButton>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <SectionCard title="Decision history" description="Recent requests and outcomes across your scope">
            {(history ?? []).length === 0 ? <EmptyState title="No history yet" /> : (
              <DataTable
                rows={history!}
                rowKey={(r) => r.referenceNo}
                columns={[
                  { key: "r", header: "Reference", render: (r) => <span className="font-mono text-[11.5px]">{r.referenceNo}</span> },
                  { key: "t", header: "Request", render: (r) => <div className="max-w-72 truncate text-[12.5px]">{r.title}</div> },
                  { key: "i", header: "Initiator", render: (r) => <span className="text-[12px] text-muted-foreground">{r.initiatorName}</span> },
                  { key: "w", header: "Workflow", render: (r) => <span className="text-[11px] text-muted-foreground">{r.workflowName}</span> },
                  { key: "d", header: "Submitted", render: (r) => <span className="text-[11px] text-muted-foreground">{fmtDate(r.submittedAt)}</span> },
                  { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
                  { key: "a", header: "", align: "right", render: (r) => <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => navigate(`#/approvals/${r.id}`)}>Timeline</MetalButton> },
                ]}
              />
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ── Detail page ─────────────────────────────────────────────── */

function ApprovalDetailPage({ id }: { id: string }) {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["approval", id],
    queryFn: () => api.get<ApprovalDetail>(`/approvals/${id}`),
  })
  const [decideOpen, setDecideOpen] = React.useState<"APPROVE" | "REJECT" | "RETURN" | null>(null)
  const [comment, setComment] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [note, setNote] = React.useState("")

  if (isLoading || !data) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading request" /></GlassCard>

  const decide = async (decision: "APPROVE" | "REJECT" | "RETURN") => {
    setBusy(true)
    try {
      const res = await api.post<{ outcome: string }>(`/approvals/${id}/decide`, { decision, comment: comment || undefined })
      const message =
        res.outcome === "APPROVED" ? "Request fully approved — document updated and owner notified"
        : res.outcome === "ADVANCED" ? "Stage cleared — routed to the next approver"
        : res.outcome === "AWAITING_CO_APPROVERS" ? "Your approval recorded — waiting for parallel co-approvers"
        : res.outcome === "REJECTED" ? "Request rejected — initiator notified"
        : "Returned for correction — initiator can revise and resubmit"
      toast.success(message)
      setDecideOpen(null)
      setComment("")
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Decision failed")
    } finally {
      setBusy(false)
    }
  }

  const resubmit = async () => {
    setBusy(true)
    try {
      await api.post(`/approvals/${id}/resubmit`, { note: note || undefined })
      toast.success("Resubmitted — workflow restarted from stage 1")
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resubmit")
    } finally {
      setBusy(false)
    }
  }

  const isReturned = data.request.status === "RETURNED"

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("#/approvals")} className="glass glass-hover flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] text-muted-foreground">
        <ChevronLeft className="size-3.5" /> Approval queue
      </button>

      <PageHeader
        title={data.request.title}
        subtitle={`${data.request.referenceNo} · ${data.workflow.name} · initiated by ${data.request.initiatorName}`}
        actions={<StatusPill status={data.request.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Document preview */}
          <SectionCard title="Request document" description={titleCase(data.request.docType)}>
            <DocPreview docType={data.request.docType} doc={data.doc} />
          </SectionCard>

          {/* Timeline */}
          <SectionCard title="Decision timeline" description="Every action with actor, role, comment and timestamp">
            <ol className="relative space-y-4 pl-6">
              <span className="absolute top-1 bottom-1 left-2.5 w-px bg-border" aria-hidden="true" />
              {data.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span
                    className={cn(
                      "absolute top-1 -left-4 flex size-3.5 items-center justify-center rounded-full border-2",
                      t.action === "APPROVED" ? "border-emerald-500 bg-emerald-500/40"
                        : t.action === "REJECTED" ? "border-[color:var(--destructive)] bg-[color:var(--destructive)]/40"
                        : t.action === "RETURNED" ? "border-orange-500 bg-orange-500/40"
                        : "border-[color:var(--chart-2)] bg-muted"
                    )}
                  />
                  <div className="glass rounded-xl px-3.5 py-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                      <span className="font-semibold">{t.actorName}</span>
                      {t.actorRoleKey ? <StatusPill status={t.actorRoleKey} className="border-border bg-muted text-muted-foreground" /> : null}
                      <span className="text-muted-foreground">· stage {t.stageSeq}</span>
                      <StatusPill status={t.action} className="ml-auto" />
                    </div>
                    {t.comment ? <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{t.comment}</p> : null}
                    <div className="mt-1 text-[10px] text-muted-foreground/70">{fmtDateTime(t.actedAt)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>

          {isReturned ? (
            <SectionCard title="Resubmit for approval" description="Revise the document, then restart the workflow">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-56 flex-1">
                  <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Resubmission note</Label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dates corrected as advised…" className="glass h-9 rounded-xl text-sm" />
                </div>
                <MetalButton onClick={resubmit} disabled={busy}><Undo2 className="mr-1.5 size-4" /> Resubmit</MetalButton>
              </div>
            </SectionCard>
          ) : null}
        </div>

        {/* Side: workflow stages + actions */}
        <div className="space-y-5">
          <SectionCard title="Workflow" description={data.workflow.name}>
            <ol className="space-y-2">
              {data.workflow.stages.map((s) => {
                const active = s.seq === data.request.currentStageSeq && data.request.status === "PENDING"
                const passed = data.request.currentStageSeq > s.seq || data.request.status === "APPROVED"
                return (
                  <li key={s.seq} className={cn("glass rounded-xl px-3 py-2.5", active && "border-[color:var(--chart-1)]/60")}>
                    <div className="flex items-center gap-2.5">
                      {passed ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" /> : active ? <Clock className="size-4 shrink-0 text-amber-500" /> : <History className="size-4 shrink-0 text-muted-foreground/60" />}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium">
                          Stage {s.seq} · {s.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {titleCase(s.approverType === "ROLE" ? "role-based" : "named approver")}
                          {s.strategy !== "ANY" ? ` · ${titleCase(s.strategy)}` : ""}
                          {s.slaHours ? ` · SLA ${s.slaHours}h` : ""}
                        </div>
                      </div>
                      {s.isFinal ? <span className="text-[9px] tracking-widest text-muted-foreground uppercase">final</span> : null}
                    </div>
                  </li>
                )
              })}
            </ol>
            {data.currentStage ? (
              <div className="mt-3 text-[11px] text-muted-foreground">
                Current approvers: {data.currentStage.actors.map((a) => a.name).join(", ") || "—"}
              </div>
            ) : null}
          </SectionCard>

          {data.request.status === "PENDING" && data.currentStage && isStageActor(data, session?.user.name) ? (
            <SectionCard title="Your decision" description={`Stage ${data.currentStage.seq} — ${data.currentStage.name}`}>
              <div className="grid gap-2">
                <MetalButton onClick={() => setDecideOpen("APPROVE")}><CheckCircle2 className="mr-1.5 size-4" /> Approve</MetalButton>
                <MetalButton variant="ghost" onClick={() => setDecideOpen("RETURN")}><Undo2 className="mr-1.5 size-4" /> Return for correction</MetalButton>
                <MetalButton variant="ghost" className="text-[color:var(--destructive)]" onClick={() => setDecideOpen("REJECT")}><XCircle className="mr-1.5 size-4" /> Reject</MetalButton>
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>

      {/* Decision dialog */}
      <Dialog open={decideOpen !== null} onOpenChange={(v) => !v && setDecideOpen(null)}>
        <DialogContent className="liquid rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {decideOpen === "APPROVE" ? "Approve this request" : decideOpen === "REJECT" ? "Reject this request" : "Return for correction"}
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label className="mb-1.5 text-[11px] uppercase text-muted-foreground">Comment</Label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={decideOpen === "APPROVE" ? "Balance verified — leave sanctioned…" : decideOpen === "REJECT" ? "Workload at this time — request alternate dates…" : "Dates overlap with the department event; please revise…"}
              className="glass min-h-24 w-full rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <p className="mt-2 text-[10.5px] text-muted-foreground">
              Comments are recorded on the timeline and notified to the initiator.
            </p>
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <MetalButton variant="ghost" onClick={() => setDecideOpen(null)}>Cancel</MetalButton>
            <MetalButton onClick={() => decide(decideOpen!)} disabled={busy}>
              {busy ? "Recording…" : decideOpen === "APPROVE" ? "Confirm approval" : decideOpen === "REJECT" ? "Confirm rejection" : "Return request"}
            </MetalButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function isStageActor(data: ApprovalDetail, userName: string | undefined): boolean {
  if (!userName) return false
  return (data.currentStage?.actors ?? []).some((a) => a.name === userName)
}

function DocPreview({ docType, doc }: { docType: string; doc: Record<string, never> | null }) {
  if (!doc) return <EmptyState title="Document preview unavailable" />
  const d = doc as Record<string, unknown>
  if (docType === "LEAVE_APPLICATION") {
    const emp = d.employee as { fullName: string; employeeCode: string; department: { name: string | null } | null } | undefined
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar name={emp?.fullName ?? "?"} seed={(d.referenceNo as string)?.length ?? 7} size={40} />
          <div>
            <div className="text-[14px] font-semibold">{emp?.fullName}</div>
            <div className="text-[11px] text-muted-foreground">{emp?.employeeCode} · {emp?.department?.name ?? "—"}</div>
          </div>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">{String(d.referenceNo ?? "")}</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
          <Field label="Type" value={String(d.leaveTypeName ?? "—")} />
          <Field label="From" value={fmtDate(d.fromDate as string)} />
          <Field label="To" value={fmtDate(d.toDate as string)} />
          <Field label="Duration" value={fmtDays(d.days as number)} />
        </dl>
        <p className="glass rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed text-foreground/90">{String(d.reason ?? "")}</p>
      </div>
    )
  }
  if (docType === "ATTENDANCE_CORRECTION") {
    const emp = d.employee as { fullName: string; employeeCode: string } | undefined
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar name={emp?.fullName ?? "?"} seed={(d.referenceNo as string)?.length ?? 5} size={40} />
          <div>
            <div className="text-[14px] font-semibold">{emp?.fullName}</div>
            <div className="text-[11px] text-muted-foreground">{emp?.employeeCode}</div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
          <Field label="Date" value={fmtDate(d.date as string)} />
          <Field label="Requested in" value={d.requestedIn ? new Date(d.requestedIn as string).toISOString().slice(11, 16) : "—"} />
          <Field label="Requested out" value={d.requestedOut ? new Date(d.requestedOut as string).toISOString().slice(11, 16) : "—"} />
          <Field label="Reference" value={String(d.referenceNo ?? "—")} />
        </dl>
        <p className="glass rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed">{String(d.reason ?? "")}</p>
      </div>
    )
  }
  if (docType === "PAYROLL_RUN") {
    return (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
        <Field label="Run" value={String(d.runNo ?? "—")} />
        <Field label="Period" value={`${d.periodMonth ?? "—"}/${d.periodYear ?? "—"}`} />
        <Field label="Employees" value={String(d.employeeCount ?? "—")} />
        <Field label="Gross" value={`₹${(d.totalGross as number ?? 0).toLocaleString("en-IN")}`} />
        <Field label="Deductions" value={`₹${(d.totalDeductions as number ?? 0).toLocaleString("en-IN")}`} />
        <Field label="Net" value={`₹${(d.totalNet as number ?? 0).toLocaleString("en-IN")}`} />
      </dl>
    )
  }
  if (docType === "VACANCY_REQUISITION") {
    return (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
        <Field label="Requisition" value={String(d.requisitionNo ?? "—")} />
        <Field label="Post" value={String(d.title ?? "—")} />
        <Field label="Department" value={String(d.department ?? "—")} />
        <Field label="Designation" value={String(d.designation ?? "—")} />
        <Field label="Openings" value={String(d.openings ?? "—")} />
        <Field label="Type" value={titleCase(String(d.employmentType ?? "—"))} />
      </dl>
    )
  }
  return <EmptyState title="Unknown document" />
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border/40 pb-1.5">
      <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-[12.5px] font-medium">{value}</dd>
    </div>
  )
}
