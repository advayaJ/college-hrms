"use client";

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { UserRoundCog } from "lucide-react"
import { api } from "@/lib/api"
import { useSession } from "@/lib/session"
import { navigate } from "@/lib/router"
import { fmtDate } from "@/lib/format"
import { Avatar, DataTable, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton, PageHeader, SectionCard, StatusPill } from "@/components/glass/kit"

export default function ProfileModule() {
  const { session } = useSession()
  const profile = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.get<{
      employee: { fullName: string; employeeCode: string; designation: string | null; department: string | null; campus: string | null; joiningDate: string; status: string; photoSeed: number; dateOfBirth: string; personalEmail: string; officialEmail: string; phone: string; addressLine: string; city: string; state: string; pincode: string }
      qualifications: { degree: string; field: string; institutionName: string; yearOfPassing: number }[]
      serviceEvents: { eventType: string; effectiveDate: string; details: string }[]
      stats: Record<string, number> | null
      leaveBalances: { type: string; available: number }[] | null
      latestPayslip: { netPay: number; periodMonth: number; periodYear: number } | null
    }>(`/employees/${session?.user.employeeCode ?? ""}`),
    enabled: !!session,
  })

  if (!session) return null
  if (profile.isLoading) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading profile" /></GlassCard>
  if (!profile.data) return <GlassCard hover={false} className="p-8"><EmptyState title="Profile unavailable" /></GlassCard>

  const e = profile.data.employee
  return (
    <div className="space-y-5">
      <PageHeader
        title="My Profile"
        subtitle="Your employee record, service history and quick links"
        icon={<UserRoundCog />}
        actions={<MetalButton variant="ghost" onClick={() => navigate("#/settings?tab=account")}>Account & security</MetalButton>}
      />

      <GlassCard hover={false} className="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={e.fullName} seed={e.photoSeed} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-semibold tracking-tight">{e.fullName}</h1>
              <StatusPill status={e.status} />
            </div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">
              {e.designation ?? "—"} · {e.department ?? "—"} · {e.campus ?? "—"} · <span className="font-mono">{e.employeeCode}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {profile.data.stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiStat label="Attendance (90d)" value={profile.data.stats.attendanceRate90d ?? "—"} unit="%" />
          <KpiStat label="Leave used" value={profile.data.stats.leaveUsedYear ?? "—"} unit="days" />
          <KpiStat label="Service" value={(profile.data.stats.serviceYears ?? 0).toFixed(1)} unit="years" />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Personal information">
          <dl className="grid gap-2.5">
            {[
              ["Date of birth", fmtDate(e.dateOfBirth)],
              ["Personal email", e.personalEmail],
              ["Official email", e.officialEmail],
              ["Phone", e.phone],
              ["Address", `${e.addressLine}, ${e.city}, ${e.state} ${e.pincode}`],
              ["Joined", fmtDate(e.joiningDate)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border/40 pb-1.5 text-[12.5px]">
                <dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Service record">
          <DataTable
            rows={profile.data.serviceEvents}
            rowKey={(s, i) => String(i)}
            columns={[
              { key: "t", header: "Event", render: (s) => <StatusPill status={s.eventType} /> },
              { key: "d", header: "Details", render: (s) => <span className="text-[12px]">{s.details}</span> },
              { key: "e", header: "Effective", render: (s) => <span className="text-[11.5px] text-muted-foreground">{fmtDate(s.effectiveDate)}</span> },
            ]}
          />
        </SectionCard>
      </div>

      {profile.data.leaveBalances ? (
        <SectionCard title="Leave balances">
          <div className="flex flex-wrap gap-2">
            {profile.data.leaveBalances.map((b) => (
              <span key={b.type} className="glass rounded-full px-3 py-1 text-[11.5px]">
                {b.type}: <span className="font-semibold text-[color:var(--chart-1)]">{b.available}</span>
              </span>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
