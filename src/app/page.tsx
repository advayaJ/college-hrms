"use client";

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Building2 } from "lucide-react"
import { useHashRoute } from "@/lib/router"
import { useSession } from "@/lib/session"
import { LoginScreen } from "@/components/layout/login-screen"
import { AppShell } from "@/components/layout/app-shell"
import { NotificationsPage } from "@/components/layout/notifications"

import DashboardModule from "@/components/modules/dashboard"
import EmployeesModule from "@/components/modules/employees"
import DepartmentsModule from "@/components/modules/departments"
import AttendanceModule from "@/components/modules/attendance"
import LeaveModule from "@/components/modules/leave"
import ApprovalsModule from "@/components/modules/approvals"
import PayrollModule from "@/components/modules/payroll"
import RecruitmentModule from "@/components/modules/recruitment"
import WorkloadModule from "@/components/modules/workload"
import AppraisalModule from "@/components/modules/appraisal"
import DocumentsModule from "@/components/modules/documents"
import ReportsModule from "@/components/modules/reports"
import SettingsModule from "@/components/modules/settings"
import ProfileModule from "@/components/modules/profile"

function BootSplash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <div className="glass kpi-glow flex size-16 animate-pulse items-center justify-center rounded-2xl">
        <Building2 className="size-7 text-[color:var(--chart-1)]" />
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-[color:var(--chart-1)]" />
        Preparing Aryavratt HRMS…
      </div>
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15000, refetchOnWindowFocus: false },
  },
})

export default function Home() {
  const { session, booting, boot } = useSession()
  const route = useHashRoute()

  React.useEffect(() => {
    void boot()
  }, [boot])

  let content: React.ReactNode = null
  if (booting) {
    content = <BootSplash />
  } else if (!session) {
    content = <LoginScreen />
  } else {
    const [root, second, third] = route.segments
    // The key includes the active role so every module REMOUNTS when the user
    // switches roles — permission-derived local state (e.g. payroll's default
    // tab) re-initialises instead of freezing at the old role's view.
    const key = `${root ?? "dashboard"}-${second ?? ""}-${third ?? ""}-${session.activeRoleKey}-${session.activeDepartmentId ?? ""}`
    let view: React.ReactNode = null
    switch (root) {
      case "dashboard": view = <DashboardModule />; break
      case "employees": view = <EmployeesModule employeeCode={second} />; break
      case "departments": view = <DepartmentsModule departmentId={second} />; break
      case "attendance": view = <AttendanceModule />; break
      case "leave": view = <LeaveModule />; break
      case "approvals": view = <ApprovalsModule requestId={second} />; break
      case "payroll": view = <PayrollModule sub={second} id={third} />; break
      case "recruitment": view = <RecruitmentModule vacancyId={second} />; break
      case "workload": view = <WorkloadModule />; break
      case "appraisal": view = <AppraisalModule />; break
      case "documents": view = <DocumentsModule />; break
      case "reports": view = <ReportsModule />; break
      case "settings": view = <SettingsModule initialTab={route.query.get("tab") ?? undefined} />; break
      case "notifications": view = <NotificationsPage />; break
      case "profile": view = <ProfileModule />; break
      default:
        view = <DashboardModule />
    }
    content = (
      <AppShell activeHash={`#/${root ?? "dashboard"}`}>
        <React.Suspense fallback={<BootSplash />}>
          <div key={key} className="rise-in">{view}</div>
        </React.Suspense>
      </AppShell>
    )
  }

  return <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
}
