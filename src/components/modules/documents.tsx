"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FolderLock, ShieldAlert, Upload, FileDown } from "lucide-react"
import { api } from "@/lib/api"
import { fmtDate, relTime, titleCase } from "@/lib/format"
import {
  DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton, PageHeader, SectionCard, StatusPill,
} from "@/components/glass/kit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export default function DocumentsModule() {
  const [tab, setTab] = React.useState("vault")
  return (
    <div className="space-y-5">
      <PageHeader title="Document Vault" subtitle="Employee documents with expiry tracking and permission-guarded access" icon={<FolderLock />} />
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="vault" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Vault</TabsTrigger>
          <TabsTrigger value="expiring" className="rounded-lg px-4 py-1.5 text-[12.5px] data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-foreground">Expiring</TabsTrigger>
        </TabsList>
        <TabsContent value="vault"><VaultTab /></TabsContent>
        <TabsContent value="expiring"><ExpiringTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function VaultTab() {
  const queryClient = useQueryClient()
  const [q, setQ] = React.useState("")
  const [categoryId, setCategoryId] = React.useState<string | undefined>()
  const [expiring, setExpiring] = React.useState<string | undefined>()
  const [page, setPage] = React.useState(1)
  const [uploadOpen, setUploadOpen] = React.useState(false)

  const { data: categories } = useQuery({
    queryKey: ["doc-categories"],
    queryFn: () => api.get<{ id: string; key: string; name: string; sensitivity: string; requiresExpiry: boolean }[]>("/documents/categories"),
  })

  const { data, isLoading } = useQuery({
    queryKey: ["documents", q, categoryId, expiring, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (q.trim()) params.set("q", q.trim())
      if (categoryId && categoryId !== "all") params.set("categoryId", categoryId)
      if (expiring && expiring !== "all") params.set("expiringInDays", expiring)
      return api.get<{ total: number; page: number; items: { id: string; title: string; fileName: string; sizeKb: number; category: string; employee: { employeeCode: string; fullName: string; department: { name: string | null } | null }; accessLevel: string; issuedOn: string | null; expiresOn: string | null; isVerified: boolean; uploadedAt: string; version: number; expiringInDays: number | null }[] }>(`/documents?${params}`)
    },
  })

  const download = async (id: string, fileName: string) => {
    try {
      await api.download(`/documents/${id}/download`, `${fileName.replace(/\.pdf$/, "")}-vault.txt`)
      toast.success("Vault attestation downloaded — access logged in the audit trail")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Access denied")
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat label="Documents in scope" value={data?.total ?? "…"} icon={<FolderLock />} />
        <KpiStat label="Categories" value={categories?.length ?? "…"} icon={<FolderLock />} />
        <KpiStat label="Confidential items" value={data?.items.filter((d) => d.accessLevel === "CONFIDENTIAL").length ?? "…"} icon={<ShieldAlert />} />
      </div>

      <GlassCard hover={false} className="flex flex-wrap items-center gap-3 p-3">
        <div className="glass flex h-9 min-w-52 flex-1 items-center gap-2.5 rounded-xl px-3">
          <span className="text-[12px] text-muted-foreground">🔎</span>
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search document titles…" className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
        </div>
        <Select value={categoryId ?? "all"} onValueChange={(v) => { setCategoryId(v === "all" ? undefined : v); setPage(1) }}>
          <SelectTrigger className="glass h-9 w-44 rounded-xl text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            <SelectItem value="all" className="rounded-lg text-[13px]">All categories</SelectItem>
            {(categories ?? []).map((c) => <SelectItem key={c.id} value={c.id} className="rounded-lg text-[13px]">{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={expiring ?? "all"} onValueChange={(v) => { setExpiring(v === "all" ? undefined : v); setPage(1) }}>
          <SelectTrigger className="glass h-9 w-36 rounded-xl text-sm"><SelectValue placeholder="Expiry" /></SelectTrigger>
          <SelectContent className="liquid rounded-xl">
            <SelectItem value="all" className="rounded-lg text-[13px]">Any expiry</SelectItem>
            <SelectItem value="30" className="rounded-lg text-[13px]">≤ 30 days</SelectItem>
            <SelectItem value="90" className="rounded-lg text-[13px]">≤ 90 days</SelectItem>
          </SelectContent>
        </Select>
      </GlassCard>

      {isLoading || !data ? (
        <GlassCard hover={false} className="p-6"><LoadingBlock label="Loading vault" /></GlassCard>
      ) : (
        <SectionCard title="Vault records" description={`${data.total} documents${categoryId ? " · category filtered" : ""}`}>
          {data.items.length === 0 ? <EmptyState title="No documents match" /> : (
            <DataTable
              rows={data.items}
              rowKey={(d) => d.id}
              columns={[
                { key: "t", header: "Document", render: (d) => <div><div className="text-[12.5px] font-medium">{d.title}</div><div className="text-[10px] text-muted-foreground">{d.category} · {d.sizeKb}KB · v{d.version}</div></div> },
                { key: "e", header: "Owner", render: (d) => <div><div className="text-[12px]">{d.employee.fullName}</div><div className="text-[10px] text-muted-foreground">{d.employee.employeeCode} · {d.employee.department?.name ?? "—"}</div></div> },
                { key: "a", header: "Access", render: (d) => <StatusPill status={d.accessLevel} /> },
                { key: "i", header: "Issued", render: (d) => <span className="text-[11.5px] text-muted-foreground">{d.issuedOn ? fmtDate(d.issuedOn) : "—"}</span> },
                { key: "x", header: "Expires", render: (d) => d.expiresOn ? <span className={`text-[11.5px] ${d.expiringInDays !== null && d.expiringInDays <= 30 ? "text-amber-500/90" : ""}`}>{fmtDate(d.expiresOn)}</span> : <span className="text-[11px] text-muted-foreground">—</span> },
                { key: "v", header: "Verified", render: (d) => <StatusPill status={d.isVerified ? "APPROVED" : "PENDING"} /> },
                {
                  key: "d", header: "", align: "right",
                  render: (d) => (
                    <MetalButton variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => download(d.id, d.fileName)}>
                      <FileDown className="mr-1 size-3" /> Access
                    </MetalButton>
                  ),
                },
              ]}
              footer={
                <div className="flex items-center justify-between border-t border-border/60 px-3.5 py-2 text-xs text-muted-foreground">
                  <span>Page {page} of {Math.ceil(data.total / 15)}</span>
                  <span className="flex gap-1">
                    <MetalButton variant="ghost" className="px-2 py-0.5 text-[11px]" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</MetalButton>
                    <MetalButton variant="ghost" className="px-2 py-0.5 text-[11px]" disabled={page * 15 >= data.total} onClick={() => setPage(page + 1)}>Next</MetalButton>
                  </span>
                </div>
              }
            />
          )}
        </SectionCard>
      )}
    </div>
  )
}

function ExpiringTab() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["docs-expiring"],
    queryFn: () => api.get<{ id: string; title: string; category: string; employee: { employeeCode: string; fullName: string }; expiresOn: string; daysLeft: number }[]>("/documents/expiring?days=45"),
  })
  const [notifying, setNotifying] = React.useState(false)

  const notify = async () => {
    setNotifying(true)
    try {
      const res = await api.post<{ sent: number }>("/documents/expiring/notify?days=45")
      toast.success(`Expiry reminders sent to ${res.sent} document owners`)
      queryClient.invalidateQueries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not notify")
    } finally {
      setNotifying(false)
    }
  }

  if (isLoading || !data) return <GlassCard hover={false} className="p-6"><LoadingBlock label="Checking expiries" /></GlassCard>

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiStat label="Expiring ≤ 45 days" value={data.length} icon={<ShieldAlert />} tone="warning" />
        <KpiStat label="Within 10 days" value={data.filter((d) => d.daysLeft <= 10).length} icon={<ShieldAlert />} tone="critical" />
      </div>
      <SectionCard
        title="Expiry watchlist"
        description="Documents approaching renewal"
        actions={<MetalButton onClick={notify} disabled={notifying}>{notifying ? "Sending…" : "Send reminders"}</MetalButton>}
      >
        {data.length === 0 ? <EmptyState title="Nothing expiring soon" /> : (
          <DataTable
            rows={data}
            rowKey={(d) => d.id}
            columns={[
              { key: "t", header: "Document", render: (d) => <div><div className="text-[12.5px] font-medium">{d.title}</div><div className="text-[10px] text-muted-foreground">{d.category}</div></div> },
              { key: "e", header: "Owner", render: (d) => <span className="text-[12px]">{d.employee.fullName} · {d.employee.employeeCode}</span> },
              { key: "x", header: "Expires", render: (d) => <span className="text-[12px]">{fmtDate(d.expiresOn)}</span> },
              { key: "d", header: "Days left", align: "right", render: (d) => <span className={`text-[13px] font-semibold ${d.daysLeft <= 10 ? "text-[color:var(--destructive)]" : "text-amber-500/90"}`}>{d.daysLeft}</span> },
            ]}
          />
        )}
      </SectionCard>
    </div>
  )
}
