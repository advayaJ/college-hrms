"use client";

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight, Building2, Briefcase, ChartPie, CheckCircle2, ClipboardList, FileClock,
  FolderLock, GraduationCap, LayoutDashboard, Scale, Settings, UsersRound, Wallet,
} from "lucide-react"
import { api } from "@/lib/api"
import { navigate } from "@/lib/router"
import { useSession } from "@/lib/session"
import { Avatar } from "@/components/glass/kit"
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command"

const MODULES: { label: string; hash: string; icon: React.ReactNode }[] = [
  { label: "Dashboard", hash: "#/dashboard", icon: <LayoutDashboard /> },
  { label: "Approvals", hash: "#/approvals", icon: <ClipboardList /> },
  { label: "Employees", hash: "#/employees", icon: <UsersRound /> },
  { label: "Departments", hash: "#/departments", icon: <Building2 /> },
  { label: "Attendance", hash: "#/attendance", icon: <FileClock /> },
  { label: "Leave", hash: "#/leave", icon: <Scale /> },
  { label: "Payroll", hash: "#/payroll", icon: <Wallet /> },
  { label: "Recruitment", hash: "#/recruitment", icon: <Briefcase /> },
  { label: "Faculty Workload", hash: "#/workload", icon: <GraduationCap /> },
  { label: "Appraisal", hash: "#/appraisal", icon: <CheckCircle2 /> },
  { label: "Documents", hash: "#/documents", icon: <FolderLock /> },
  { label: "Reports", hash: "#/reports", icon: <ChartPie /> },
  { label: "Settings", hash: "#/settings", icon: <Settings /> },
]

interface EmployeeRow {
  employeeCode: string
  fullName: string
  designation: string | null
  department: string | null
  photoSeed: number
}

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { session } = useSession()
  const [search, setSearch] = React.useState("")
  const canSearchPeople = !!session && session.permissions.some((p) => p.startsWith("employees:read"))

  const { data: people } = useQuery({
    queryKey: ["palette-people", search],
    queryFn: () =>
      api.get<{ items: EmployeeRow[] }>("/employees?q=" + encodeURIComponent(search) + "&pageSize=6"),
    enabled: open && canSearchPeople && search.trim().length >= 2,
  })

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="liquid">
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search employees or jump to a module…"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Modules">
          {MODULES.map((m) => (
            <CommandItem
              key={m.hash}
              value={m.label}
              onSelect={() => {
                navigate(m.hash)
                setOpen(false)
                setSearch("")
              }}
              className="gap-2.5 [&>svg:first-child]:size-4"
            >
              <span className="text-muted-foreground [&>svg]:size-4">{m.icon}</span>
              {m.label}
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground/50" />
            </CommandItem>
          ))}
        </CommandGroup>
        {canSearchPeople && search.trim().length >= 2 ? (
          <React.Fragment>
            <CommandSeparator />
            <CommandGroup heading="Employees">
              {(people?.items ?? []).length === 0 ? (
                <CommandItem disabled className="text-xs text-muted-foreground">
                  No matching employees
                </CommandItem>
              ) : (
                people!.items.map((e) => (
                  <CommandItem
                    key={e.employeeCode}
                    value={`${e.fullName} ${e.employeeCode} ${e.designation ?? ""}`}
                    onSelect={() => {
                      navigate(`#/employees/${e.employeeCode}`)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Avatar name={e.fullName} seed={e.photoSeed} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{e.fullName}</div>
                      <div className="truncate text-[10.5px] text-muted-foreground">
                        {e.employeeCode} · {e.designation ?? "—"} · {e.department ?? "—"}
                      </div>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </React.Fragment>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
