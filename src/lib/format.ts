export function inr(amount: number | null | undefined, compact = false): string {
  if (amount == null) return "—"
  if (compact) {
    if (Math.abs(amount) >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`
    if (Math.abs(amount) >= 1e5) return `₹${(amount / 1e5).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export function fmtTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  return `${fmtDate(d)} · ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}`
}

export function relTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const t = new Date(value).getTime()
  const diff = Date.now() - t
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`
  return fmtDate(value)
}

export function fmtDays(days: number | null | undefined): string {
  if (days == null) return "—"
  const rounded = Math.round(days * 10) / 10
  return `${rounded} ${rounded === 1 ? "day" : "days"}`
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

/** Deterministic avatar gradient from a photoSeed */
export function avatarGradient(seed: number): string {
  const hue = (seed * 137.508) % 360
  const hue2 = (hue + 42) % 360
  return `linear-gradient(135deg, hsl(${hue} 38% 46%), hsl(${hue2} 34% 34%))`
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function monthName(m: number): string {
  return MONTHS[m - 1] ?? String(m)
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "—"
  return s
    .toLowerCase()
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ")
}
