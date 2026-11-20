export interface SessionRole {
  key: string
  departmentId?: string | null
}

export interface SessionUser {
  userId: string
  email: string
  employeeId: string
  employeeCode: string
  institutionId: string
  name: string
  roles: SessionRole[]
  activeRoleKey: string
  activeDepartmentId: string | null
  permissions: string[]
  designationTitle?: string | null
  departmentId?: string | null
  campusId?: string | null
}

export interface JwtPayload {
  sub: string // userId
  emp: string // employeeId
  empCode: string
  email: string
  name: string
  inst: string
  roles: SessionRole[]
  act: string // active role key
  dep?: string | null // active role scoped department
  desig?: string | null
  dept?: string | null
  campus?: string | null
  jti: string
  iat?: number
  exp?: number
}

export const AUTH_COOKIE = 'hrms_token'
