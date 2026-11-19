"use client";

import * as React from "react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react"
import { avatarGradient, initials } from "@/lib/format"

export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs as never))
}

/* ── Glass surfaces ─────────────────────────────────────────────── */

export function GlassCard({
  className,
  hover = true,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn("glass rounded-2xl", hover && "glass-hover", className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rise-in">
      <div className="flex items-center gap-3.5">
        {icon ? (
          <div className="glass kpi-glow flex size-11 items-center justify-center rounded-xl [&>svg]:size-5">
            {icon}
          </div>
        ) : null}
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <GlassCard className={cn("p-5", className)} hover={false}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </GlassCard>
  )
}

/* ── KPI stat ─────────────────────────────────────────────────── */

export function KpiStat({
  label,
  value,
  hint,
  icon,
  unit,
  tone = "default",
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ReactNode
  unit?: string
  tone?: "default" | "gold" | "warning" | "critical" | "success"
}) {
  const toneClass =
    tone === "gold"
      ? "text-[color:var(--chart-1)]"
      : tone === "warning"
        ? "text-amber-500/90"
        : tone === "critical"
          ? "text-[color:var(--destructive)]"
          : tone === "success"
            ? "text-emerald-500/90"
            : "text-foreground"
  return (
    <GlassCard className="flex items-center gap-4 p-4">
      {icon ? (
        <div className="glass kpi-glow flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-[18px]">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
        <div className={cn("mt-1 flex items-baseline gap-1 text-[26px] leading-none font-semibold tracking-tight", toneClass)}>
          <span className="truncate">{value}</span>
          {unit ? <span className="text-sm font-medium text-muted-foreground">{unit}</span> : null}
        </div>
        {hint ? <div className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</div> : null}
      </div>
    </GlassCard>
  )
}

/* ── Avatar with deterministic gradient ────────────────────────── */

export function Avatar({
  name,
  seed = 0,
  size = 36,
  className,
}: {
  name: string
  seed?: number
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn("flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white/95", className)}
      style={{
        width: size,
        height: size,
        background: avatarGradient(seed || name.charCodeAt(0) * 7 + name.length),
        fontSize: size * 0.38,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px -6px rgba(0,0,0,0.5)",
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}

/* ── Status pill ──────────────────────────────────────────────── */

const PILL_TONES: Record<string, string> = {
  APPROVED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  RELEASED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  PAID: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  SELECTED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  ONBOARDED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  ACTIVE: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  PRESENT: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  OPEN: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  SUCCESS: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  PENDING: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  PENDING_APPROVAL: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  DRAFT: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  WAITLISTED: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  ON_HOLD: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  ON_NOTICE: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  PROBATION: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  INTERVIEW_SCHEDULED: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  RETURNED: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  REJECTED: "bg-[color:var(--destructive)]/15 text-[color:var(--destructive)] border-[color:var(--destructive)]/30",
  ABSENT: "bg-[color:var(--destructive)]/15 text-[color:var(--destructive)] border-[color:var(--destructive)]/30",
  CRITICAL: "bg-[color:var(--destructive)]/15 text-[color:var(--destructive)] border-[color:var(--destructive)]/30",
  SEPARATED: "bg-[color:var(--destructive)]/15 text-[color:var(--destructive)] border-[color:var(--destructive)]/30",
  CANCELLED: "text-muted-foreground border-border bg-muted",
  WITHDRAWN: "text-muted-foreground border-border bg-muted",
}

export function StatusPill({ status, className }: { status: string | null | undefined; className?: string }) {
  const key = (status ?? "NONE").toUpperCase()
  const tone = PILL_TONES[key] ?? "text-muted-foreground border-border bg-muted"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold tracking-wide whitespace-nowrap",
        tone,
        className
      )}
    >
      {key.replace(/_/g, " ")}
    </span>
  )
}

/* ── Empty & loading states ───────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  hint,
  className,
}: {
  icon?: React.ReactNode
  title: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl px-6 py-10 text-center", className)}>
      <div className="glass flex size-11 items-center justify-center rounded-xl text-muted-foreground [&>svg]:size-5">
        {icon ?? <Inbox />}
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {hint ? <div className="max-w-sm text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-sheen h-9 rounded-lg" />
      ))}
    </div>
  )
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
      <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-[color:var(--chart-1)]" />
      {label}…
    </div>
  )
}

/* ── DataTable ───────────────────────────────────────────────── */

export interface Column<T> {
  key: string
  header: React.ReactNode
  render: (row: T) => React.ReactNode
  className?: string
  align?: "left" | "right" | "center"
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty = "No records found",
  footer,
  dense = false,
  className,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey?: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  empty?: string | React.ReactNode
  footer?: React.ReactNode
  dense?: boolean
  className?: string
}) {
  if (rows.length === 0) {
    return <EmptyState title={typeof empty === "string" ? empty : "No records"} className={className} />
  }
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border/60", className)}>
      <table className="glass-table w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center",
                  c.className
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const k = rowKey ? rowKey(row, i) : String(i)
            return (
              <tr
                key={k}
                className={cn(
                  "border-b border-border/40 last:border-0",
                  onRowClick && "cursor-pointer hover:bg-accent/60"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      dense ? "px-3.5 py-1.5" : "px-3.5 py-2.5",
                      "align-middle",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      {footer}
    </div>
  )
}

export function Pager({
  page,
  totalPages,
  onPage,
  total,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
  total?: number
}) {
  return (
    <div className="flex items-center justify-between border-t border-border/60 px-3.5 py-2 text-xs text-muted-foreground">
      <span>
        Page {page} of {Math.max(totalPages, 1)}
        {total !== undefined ? ` · ${total.toLocaleString("en-IN")} records` : ""}
      </span>
      <span className="flex gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="glass flex size-7 items-center justify-center rounded-lg disabled:opacity-35 [&>svg]:size-3.5"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="glass flex size-7 items-center justify-center rounded-lg disabled:opacity-35 [&>svg]:size-3.5"
        >
          <ChevronRight />
        </button>
      </span>
    </div>
  )
}

/* ── Charts frame ─────────────────────────────────────────────── */

export function ChartFrame({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <GlassCard className={cn("p-5", className)} hover={false}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </GlassCard>
  )
}

/* ── Buttons with metallic gradient ─────────────────────────────── */

export function MetalButton({
  children,
  className,
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  if (variant === "ghost") {
    return (
      <button
        className={cn(
          "glass rounded-xl px-3.5 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-[color:var(--chart-1)]/50 hover:-translate-y-px disabled:opacity-50",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    )
  }
  return (
    <button
      className={cn(
        "btn-metal rounded-xl px-4 py-2 text-sm font-semibold tracking-tight disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
