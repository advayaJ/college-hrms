"use client";

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, BellRing, CheckCheck } from "lucide-react"
import { api } from "@/lib/api"
import { navigate } from "@/lib/router"
import { useSession } from "@/lib/session"
import { cn, EmptyState, GlassCard, KpiStat, LoadingBlock, MetalButton, PageHeader, SectionCard, StatusPill } from "@/components/glass/kit"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface NotificationItem {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  severity: string
  isRead: boolean
  createdAt: string
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<{ unread: number; items: NotificationItem[] }>("/notifications"),
  })
  const markAll = async () => {
    await api.post("/notifications/read-all")
    queryClient.invalidateQueries({ queryKey: ["notifications"] })
  }
  const markOne = async (id: string) => {
    await api.post(`/notifications/${id}/read`)
    queryClient.invalidateQueries({ queryKey: ["notifications"] })
  }
  if (isLoading || !data) return <GlassCard hover={false} className="p-8"><LoadingBlock label="Loading notifications" /></GlassCard>
  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        subtitle="Approval queues, decisions, payslips, expiries and announcements"
        icon={<Bell />}
        actions={data.unread > 0 ? <MetalButton onClick={markAll}><CheckCheck className="mr-1.5 size-4" /> Mark all read</MetalButton> : undefined}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiStat label="Unread" value={data.unread} icon={<BellRing />} tone={data.unread > 0 ? "warning" : "default"} />
        <KpiStat label="Total" value={data.items.length} icon={<Bell />} />
        <KpiStat label="Latest" value={data.items[0]?.title.slice(0, 14) ?? "—"} hint={data.items[0]?.title} icon={<Bell />} />
      </div>
      <SectionCard title="Inbox">
        {data.items.length === 0 ? <EmptyState title="No notifications" /> : (
          <ul className="space-y-2">
            {data.items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => { if (!n.isRead) void markOne(n.id); if (n.link) navigate(n.link) }}
                  className={cn("glass glass-hover flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left", !n.isRead && "border-[color:var(--chart-1)]/35")}
                >
                  <StatusPill status={n.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{n.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">{n.body}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground/70">
                      {new Date(n.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                    </div>
                  </div>
                  {!n.isRead ? <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[color:var(--chart-1)]" /> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}

export function NotificationsPanel() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<{ unread: number; items: NotificationItem[] }>("/notifications"),
    refetchInterval: 30000,
    enabled: !!session,
  })

  const markAll = async () => {
    await api.post("/notifications/read-all")
    queryClient.invalidateQueries({ queryKey: ["notifications"] })
  }

  const markOne = async (id: string) => {
    await api.post(`/notifications/${id}/read`)
    queryClient.invalidateQueries({ queryKey: ["notifications"] })
  }

  const unread = data?.unread ?? 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Notifications" className="glass glass-hover relative flex size-9 items-center justify-center rounded-xl">
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--destructive)] px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="liquid w-[340px] rounded-2xl border-border/60 p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <BellRing className="size-3.5 text-[color:var(--chart-1)]" />
            Notifications
          </div>
          {unread > 0 ? (
            <button
              type="button"
              onClick={markAll}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="size-3" /> Mark all read
            </button>
          ) : null}
        </div>
        <div className="max-h-[380px] space-y-1 overflow-y-auto">
          {(data?.items ?? []).length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No notifications yet</div>
          ) : (
            data!.items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (!n.isRead) void markOne(n.id)
                  if (n.link) navigate(n.link)
                }}
                className={cn(
                  "w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/70",
                  !n.isRead && "bg-accent/45"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      n.severity === "SUCCESS" ? "bg-emerald-500"
                        : n.severity === "CRITICAL" ? "bg-[color:var(--destructive)]"
                        : n.severity === "WARNING" ? "bg-amber-500"
                        : "bg-muted-foreground/60"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium text-foreground">{n.title}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{n.body}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground/70">
                      {new Date(n.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
