/**
 * Permission registry — single source of truth for module:action keys,
 * module labels and the predefined role templates. The seed script inserts
 * these rows into PostgreSQL; the registry service caches them at runtime.
 */

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employee Management',
  departments: 'Department Management',
  attendance: 'Attendance Management',
  leave: 'Leave Management',
  approvals: 'Approvals',
  payroll: 'Payroll',
  recruitment: 'Recruitment',
  workload: 'Faculty Workload',
  appraisal: 'Performance & Appraisal',
  documents: 'Document Management',
  reports: 'Reports & Analytics',
  settings: 'Settings & Administration',
  auth: 'Authentication',
}

export interface PermissionDef {
  key: string
  module: string
  action: string
  description: string
}

const P = (module: string, action: string, description: string): PermissionDef => ({
  key: `${module}:${action}`,
  module,
  action,
  description,
})

export const PERMISSIONS: PermissionDef[] = [
  P('dashboard', 'view', 'Access the role dashboard'),
  P('dashboard', 'view_all', 'Institution-wide dashboard analytics'),

  P('employees', 'read_all', 'View all employee records institution-wide'),
  P('employees', 'read_dept', 'View employee records within own department'),
  P('employees', 'read_self', 'View own employee record'),
  P('employees', 'create', 'Create employee records'),
  P('employees', 'update', 'Update employee records'),
  P('employees', 'separate', 'Record separation / separation processing'),

  P('departments', 'read', 'View departments, campuses, faculties, designations'),
  P('departments', 'manage', 'Create and edit departments, campuses, designations, assign HODs'),

  P('attendance', 'read_all', 'View attendance institution-wide'),
  P('attendance', 'read_dept', 'View attendance for own department'),
  P('attendance', 'read_self', 'View own attendance'),
  P('attendance', 'mark_manual', 'Manual attendance entry'),
  P('attendance', 'request_correction', 'Request attendance corrections'),
  P('attendance', 'manage_corrections', 'Decide attendance corrections'),

  P('leave', 'read_all', 'View leave data institution-wide'),
  P('leave', 'read_dept', 'View leave data for own department'),
  P('leave', 'read_self', 'View own leave records and balances'),
  P('leave', 'apply', 'Apply for leave'),
  P('leave', 'cancel', 'Cancel own pending leave'),
  P('leave', 'decide', 'Approve / reject / return leave applications'),
  P('leave', 'manage_types', 'Configure leave categories'),

  P('payroll', 'read_all', 'View payroll institution-wide'),
  P('payroll', 'read_self', 'View own payslips and salary structure'),
  P('payroll', 'process', 'Create, compute, adjust payroll runs'),
  P('payroll', 'approve', 'Final approval of payroll runs'),
  P('payroll', 'read_reports', 'Payroll cost reports'),

  P('recruitment', 'read', 'View vacancies and recruitment pipeline'),
  P('recruitment', 'manage', 'Create and manage vacancies and candidates'),
  P('recruitment', 'shortlist', 'Shortlist / reject candidates, schedule interviews'),
  P('recruitment', 'decide', 'Make offers and onboard selected candidates'),

  P('workload', 'read_all', 'View workload institution-wide'),
  P('workload', 'read_dept', 'View workload for own department'),
  P('workload', 'read_self', 'View own workload and academic contributions'),
  P('workload', 'manage_allocations', 'Allocate subjects and manage workload'),

  P('appraisal', 'read_all', 'View appraisals institution-wide'),
  P('appraisal', 'read_dept', 'View appraisals for own department'),
  P('appraisal', 'read_self', 'View own goals and appraisal records'),
  P('appraisal', 'self_assess', 'Submit self-assessment and goal progress'),
  P('appraisal', 'review', 'Review appraisals as reviewer / HOD'),
  P('appraisal', 'finalize', 'Finalize appraisals and cycles'),
  P('appraisal', 'manage_cycles', 'Create and manage appraisal cycles'),

  P('documents', 'read_all', 'View all employee documents'),
  P('documents', 'read_dept', 'View documents within own department'),
  P('documents', 'read_self', 'View own documents'),
  P('documents', 'upload', 'Upload documents'),
  P('documents', 'verify', 'Verify documents'),
  P('documents', 'read_confidential', 'Access confidential documents'),

  P('reports', 'read', 'Run and export reports'),
  P('reports', 'read_dept', 'Department-level reports'),
  P('reports', 'export', 'Export report data to CSV'),

  P('settings', 'read', 'View settings'),
  P('settings', 'manage', 'Manage institution settings and workflows'),
  P('settings', 'users_read', 'View user accounts'),
  P('settings', 'users_manage', 'Create and manage user accounts and role assignments'),
  P('settings', 'roles_manage', 'Manage roles and permission assignments'),
  P('settings', 'audit_read', 'Read the audit log'),
]

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key)

export const ROLE_KEYS = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  HR_ADMIN: 'HR_ADMIN',
  HOD: 'HOD',
  ACCOUNTANT: 'ACCOUNTANT',
  FACULTY: 'FACULTY',
  NON_TEACHING_STAFF: 'NON_TEACHING_STAFF',
  TECHNICAL_STAFF: 'TECHNICAL_STAFF',
}

const keys = (...parts: string[]) => parts

/** Role templates — permission keys granted to each predefined role. */
export const ROLE_TEMPLATES: Record<
  string,
  { name: string; description: string; scope: 'INSTITUTION' | 'DEPARTMENT'; permissions: string[] }
> = {
  [ROLE_KEYS.SUPER_ADMIN]: {
    name: 'Super Admin',
    description: 'Unrestricted system administration, user and role management',
    scope: 'INSTITUTION',
    permissions: PERMISSION_KEYS,
  },
  [ROLE_KEYS.PRINCIPAL]: {
    name: 'Principal / Director',
    description: 'Institutional oversight, final approvals and analytics',
    scope: 'INSTITUTION',
    permissions: keys(
      'dashboard:view', 'dashboard:view_all',
      'employees:read_all', 'employees:read_dept',
      'departments:read',
      'attendance:read_all', 'attendance:read_dept',
      'leave:read_all', 'leave:read_dept',
      'payroll:read_all', 'payroll:approve', 'payroll:read_reports',
      'recruitment:read', 'recruitment:decide',
      'workload:read_all', 'workload:read_dept',
      'appraisal:read_all', 'appraisal:read_dept', 'appraisal:finalize', 'appraisal:manage_cycles',
      'documents:read_all',
      'reports:read', 'reports:export',
      'settings:read', 'settings:users_read', 'settings:audit_read'
    ),
  },
  [ROLE_KEYS.HR_ADMIN]: {
    name: 'HR Admin',
    description: 'Full HR operations: employees, attendance, leave, recruitment, settings',
    scope: 'INSTITUTION',
    permissions: keys(
      'dashboard:view', 'dashboard:view_all',
      'employees:read_all', 'employees:create', 'employees:update', 'employees:separate',
      'departments:read', 'departments:manage',
      'attendance:read_all', 'attendance:read_dept', 'attendance:mark_manual', 'attendance:manage_corrections',
      'leave:read_all', 'leave:read_dept', 'leave:decide', 'leave:manage_types',
      'payroll:read_all', 'payroll:process',
      'recruitment:read', 'recruitment:manage', 'recruitment:shortlist',
      'workload:read_all', 'workload:read_dept',
      'appraisal:read_all', 'appraisal:read_dept', 'appraisal:manage_cycles', 'appraisal:finalize',
      'documents:read_all', 'documents:read_confidential', 'documents:verify', 'documents:upload',
      'reports:read', 'reports:export',
      'settings:read', 'settings:manage', 'settings:users_read', 'settings:users_manage', 'settings:roles_manage', 'settings:audit_read'
    ),
  },
  [ROLE_KEYS.HOD]: {
    name: 'HOD / Department Head',
    description: 'Department leadership: approvals, workload, appraisals',
    scope: 'DEPARTMENT',
    permissions: keys(
      'dashboard:view',
      'employees:read_dept',
      'departments:read',
      'attendance:read_dept', 'attendance:manage_corrections',
      'leave:read_dept', 'leave:decide',
      'recruitment:read', 'recruitment:shortlist',
      'workload:read_dept', 'workload:manage_allocations',
      'appraisal:read_dept', 'appraisal:review',
      'documents:read_dept',
      'reports:read_dept',
      'settings:read'
    ),
  },
  [ROLE_KEYS.ACCOUNTANT]: {
    name: 'Accountant',
    description: 'Payroll processing, salary structures and finance reports',
    scope: 'INSTITUTION',
    permissions: keys(
      'dashboard:view',
      'employees:read_all',
      'departments:read',
      'attendance:read_all',
      'leave:read_all',
      'payroll:read_all', 'payroll:process', 'payroll:read_reports',
      'reports:read', 'reports:export',
      'settings:read'
    ),
  },
  [ROLE_KEYS.FACULTY]: {
    name: 'Faculty Member',
    description: 'Teaching staff self-service: workload, leave, appraisal, documents',
    scope: 'INSTITUTION',
    permissions: keys(
      'dashboard:view',
      'employees:read_self',
      'departments:read',
      'attendance:read_self', 'attendance:request_correction',
      'leave:read_self', 'leave:apply', 'leave:cancel',
      'payroll:read_self',
      'recruitment:read',
      'workload:read_self',
      'appraisal:read_self', 'appraisal:self_assess',
      'documents:read_self', 'documents:upload'
    ),
  },
  [ROLE_KEYS.NON_TEACHING_STAFF]: {
    name: 'Non-teaching Staff',
    description: 'Administrative and support staff self-service',
    scope: 'INSTITUTION',
    permissions: keys(
      'dashboard:view',
      'employees:read_self',
      'attendance:read_self', 'attendance:request_correction',
      'leave:read_self', 'leave:apply', 'leave:cancel',
      'payroll:read_self',
      'documents:read_self', 'documents:upload'
    ),
  },
  [ROLE_KEYS.TECHNICAL_STAFF]: {
    name: 'Technical / Support Staff',
    description: 'Lab and technical staff self-service',
    scope: 'INSTITUTION',
    permissions: keys(
      'dashboard:view',
      'employees:read_self',
      'attendance:read_self', 'attendance:request_correction',
      'leave:read_self', 'leave:apply', 'leave:cancel',
      'payroll:read_self',
      'documents:read_self', 'documents:upload'
    ),
  },
}
