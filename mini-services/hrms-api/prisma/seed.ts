/**
 * College HRMS — demo data seed (Faker.js, en_IN locale).
 * All people, organisations and data are fictional.
 * Deterministic: faker.seed(20261120).
 * Run: bun prisma/seed.ts   (via: bun run db:seed)
 */
import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker/locale/en_IN'
import { hashSync } from 'bcryptjs'

const prisma = new PrismaClient()
faker.seed(20261120)

const NOW = new Date()
const YEAR = NOW.getUTCFullYear()
const DAY = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
const isoDate = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 3600 * 1000)
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const rint = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const DEMO_PASSWORD = 'Demo@2026'
const PASSWORD_HASH = hashSync(DEMO_PASSWORD, 10)

const INST = { id: '', name: 'Aryavratt University', code: 'ARYAVRATT-UNIV' }
const EMAIL_DOMAIN = 'aryavratt.edu.in'

// ───────────────────────────────────────────────────────── cleanup
const TABLES = [
  'auditLog', 'notification', 'userSession', 'userRole', 'rolePermission', 'institutionSetting',
  'employeeDocument', 'documentCategory', 'performanceReview', 'goal', 'appraisalCycle',
  'administrativeDuty', 'trainingRecord', 'mentoringEntry', 'researchOutput', 'workloadEntry',
  'subjectAllocation', 'academicTerm', 'interview', 'application', 'candidate', 'vacancy',
  'payslipLine', 'payslip', 'payrollRun', 'salaryRevision', 'salaryComponent', 'salaryStructure',
  'approvalAction', 'approvalRequest', 'approvalStage', 'approvalWorkflow',
  'leaveApplication', 'leaveBalance', 'leaveType', 'attendanceCorrection', 'punchRecord', 'attendanceRecord',
  'serviceEvent', 'experienceEntry', 'qualification', 'user', 'employee', 'designation',
  'department', 'faculty', 'campus', 'institution', 'role', 'permission',
]
async function wipe() {
  for (const t of TABLES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as unknown as Record<string, { deleteMany: (args: { where?: never }) => Promise<{ count: number }> }>)[t].deleteMany({})
  }
}

// ───────────────────────────────────────────────────────── structure
async function seedStructure() {
  const institution = await prisma.institution.create({
    data: {
      code: INST.code,
      name: INST.name,
      type: 'UNIVERSITY',
      establishedYear: 2001,
      affiliatingBody: 'UGC (State Private University Act, fictional)',
      naacGrade: 'A++ (demonstration)',
      addressLine: 'Aryavratt Vidyanagar, Pratap Nagar Road',
      city: 'Udaipur',
      state: 'Rajasthan',
      pincode: '313001',
      phone: '+91-291-2400000',
      email: `registrar@${EMAIL_DOMAIN}`,
      website: 'https://aryavratt.edu.in',
    },
  })
  INST.id = institution.id

  const campuses = {
    MAIN: await prisma.campus.create({ data: { institutionId: institution.id, code: 'MAIN', name: 'Main Campus (Vidyanagar)', city: 'Udaipur', state: 'Rajasthan', addressLine: 'Aryavratt Vidyanagar', isMain: true } }),
    CITY: await prisma.campus.create({ data: { institutionId: institution.id, code: 'CITY', name: 'City Campus', city: 'Udaipur', state: 'Rajasthan', addressLine: 'Sethji Ki Bari Road' } }),
    TECH: await prisma.campus.create({ data: { institutionId: institution.id, code: 'TECH', name: 'Technology Campus', city: 'Udaipur', state: 'Rajasthan', addressLine: 'N.H. 76, Pratap Nagar Extension' } }),
  }

  const faculties: Record<string, string> = {}
  for (const [code, name, kind] of [
    ['ENG', 'Faculty of Engineering & Technology', 'FACULTY'],
    ['SCI', 'Faculty of Sciences', 'FACULTY'],
    ['COM', 'Faculty of Commerce & Management', 'FACULTY'],
    ['HUM', 'Faculty of Humanities, Social Sciences & Education', 'FACULTY'],
    ['CA', 'School of Computer Applications', 'SCHOOL'],
    ['ADM', 'University Administration', 'CENTRE'],
  ] as const) {
    const f = await prisma.faculty.create({ data: { institutionId: institution.id, code, name, kind } })
    faculties[code] = f.id
  }

  interface DeptSpec { code: string; name: string; campus: keyof typeof campuses; faculty: string; teaching: number; labs?: number }
  const DEPTS: DeptSpec[] = [
    { code: 'CSE', name: 'Computer Science & Engineering', campus: 'TECH', faculty: 'ENG', teaching: 18, labs: 4 },
    { code: 'IT', name: 'Information Technology', campus: 'TECH', faculty: 'ENG', teaching: 12, labs: 2 },
    { code: 'ECE', name: 'Electronics & Communication Engineering', campus: 'TECH', faculty: 'ENG', teaching: 11, labs: 3 },
    { code: 'EEE', name: 'Electrical Engineering', campus: 'TECH', faculty: 'ENG', teaching: 10, labs: 2 },
    { code: 'ME', name: 'Mechanical Engineering', campus: 'TECH', faculty: 'ENG', teaching: 10, labs: 3 },
    { code: 'CE', name: 'Civil Engineering', campus: 'TECH', faculty: 'ENG', teaching: 10, labs: 2 },
    { code: 'AID', name: 'Artificial Intelligence & Data Science', campus: 'TECH', faculty: 'ENG', teaching: 9, labs: 2 },
    { code: 'PHY', name: 'Physics', campus: 'MAIN', faculty: 'SCI', teaching: 9 },
    { code: 'CHE', name: 'Chemistry', campus: 'MAIN', faculty: 'SCI', teaching: 9 },
    { code: 'MAT', name: 'Mathematics', campus: 'MAIN', faculty: 'SCI', teaching: 12 },
    { code: 'BOT', name: 'Botany', campus: 'MAIN', faculty: 'SCI', teaching: 7 },
    { code: 'ZOO', name: 'Zoology', campus: 'MAIN', faculty: 'SCI', teaching: 7 },
    { code: 'BT', name: 'Biotechnology', campus: 'MAIN', faculty: 'SCI', teaching: 8, labs: 1 },
    { code: 'STA', name: 'Statistics', campus: 'MAIN', faculty: 'SCI', teaching: 6 },
    { code: 'COM', name: 'Commerce', campus: 'CITY', faculty: 'COM', teaching: 10 },
    { code: 'MGT', name: 'Management Studies', campus: 'CITY', faculty: 'COM', teaching: 10 },
    { code: 'FIN', name: 'Finance & Accounting', campus: 'CITY', faculty: 'COM', teaching: 8 },
    { code: 'TTM', name: 'Tourism & Travel Management', campus: 'CITY', faculty: 'COM', teaching: 8 },
    { code: 'ENG-LIT', name: 'English', campus: 'MAIN', faculty: 'HUM', teaching: 8 },
    { code: 'HIN', name: 'Hindi', campus: 'MAIN', faculty: 'HUM', teaching: 7 },
    { code: 'POL', name: 'Political Science', campus: 'MAIN', faculty: 'HUM', teaching: 6 },
    { code: 'SOC', name: 'Sociology', campus: 'MAIN', faculty: 'HUM', teaching: 6 },
    { code: 'PSY', name: 'Psychology', campus: 'MAIN', faculty: 'HUM', teaching: 6 },
    { code: 'HIS', name: 'History', campus: 'MAIN', faculty: 'HUM', teaching: 6 },
    { code: 'EDU', name: 'Education', campus: 'MAIN', faculty: 'HUM', teaching: 7 },
    { code: 'PED', name: 'Physical Education', campus: 'MAIN', faculty: 'HUM', teaching: 5 },
    { code: 'MCA', name: 'Computer Applications', campus: 'CITY', faculty: 'CA', teaching: 9 },
  ]
  const adminDepts: DeptSpec[] = [
    { code: 'REG', name: "Registrar's Office", campus: 'MAIN', faculty: 'ADM', teaching: 0 },
    { code: 'EST', name: 'Establishment Section', campus: 'MAIN', faculty: 'ADM', teaching: 0 },
    { code: 'ACC', name: 'Accounts & Finance Section', campus: 'MAIN', faculty: 'ADM', teaching: 0 },
    { code: 'EXAM', name: 'Examination Section', campus: 'MAIN', faculty: 'ADM', teaching: 0 },
    { code: 'LIB', name: 'Library & Information Services', campus: 'MAIN', faculty: 'ADM', teaching: 0 },
    { code: 'STR', name: 'Stores & Procurement', campus: 'MAIN', faculty: 'ADM', teaching: 0 },
    { code: 'ESTATE', name: 'Estates & Maintenance', campus: 'TECH', faculty: 'ADM', teaching: 0 },
    { code: 'ITCELL', name: 'IT & Systems Cell', campus: 'TECH', faculty: 'ADM', teaching: 0 },
  ]
  const allDepts: Record<string, string> = {}
  for (const d of [...DEPTS, ...adminDepts]) {
    const row = await prisma.department.create({
      data: {
        institutionId: institution.id,
        campusId: campuses[d.campus].id,
        facultyId: faculties[d.faculty],
        code: d.code,
        name: d.name,
        establishedYear: rint(2001, 2018),
      },
    })
    allDepts[d.code] = row.id
  }

  interface DesigSpec { code: string; title: string; category: 'TEACHING' | 'NON_TEACHING' | 'TECHNICAL'; payLevel: number; min: number; max: number }
  const DESIGNS: DesigSpec[] = [
    { code: 'PRIN', title: 'Principal / Director', category: 'TEACHING', payLevel: 17, min: 155000, max: 215000 },
    { code: 'PROF', title: 'Professor', category: 'TEACHING', payLevel: 14, min: 105000, max: 160000 },
    { code: 'APROF', title: 'Associate Professor', category: 'TEACHING', payLevel: 13, min: 78800, max: 118000 },
    { code: 'ASST', title: 'Assistant Professor', category: 'TEACHING', payLevel: 10, min: 57700, max: 98200 },
    { code: 'GFAC', title: 'Guest Faculty', category: 'TEACHING', payLevel: 0, min: 28000, max: 40000 },
    { code: 'VPROF', title: 'Visiting Professor', category: 'TEACHING', payLevel: 0, min: 60000, max: 90000 },
    { code: 'DREG', title: 'Deputy Registrar', category: 'NON_TEACHING', payLevel: 13, min: 78800, max: 118000 },
    { code: 'AREG', title: 'Assistant Registrar', category: 'NON_TEACHING', payLevel: 10, min: 56100, max: 86000 },
    { code: 'OSUP', title: 'Office Superintendent', category: 'NON_TEACHING', payLevel: 8, min: 47600, max: 72000 },
    { code: 'SCLR', title: 'Senior Assistant', category: 'NON_TEACHING', payLevel: 6, min: 29200, max: 44900 },
    { code: 'JCLR', title: 'Junior Assistant', category: 'NON_TEACHING', payLevel: 4, min: 19900, max: 29200 },
    { code: 'LIBR', title: 'Librarian', category: 'NON_TEACHING', payLevel: 13, min: 78800, max: 118000 },
    { code: 'DLBR', title: 'Deputy Librarian', category: 'NON_TEACHING', payLevel: 10, min: 56100, max: 86000 },
    { code: 'LASS', title: 'Library Assistant', category: 'NON_TEACHING', payLevel: 5, min: 25500, max: 35400 },
    { code: 'AOFF', title: 'Accounts Officer', category: 'NON_TEACHING', payLevel: 10, min: 56100, max: 90000 },
    { code: 'JACC', title: 'Junior Accountant', category: 'NON_TEACHING', payLevel: 5, min: 25500, max: 42000 },
    { code: 'SKEEP', title: 'Store Keeper', category: 'NON_TEACHING', payLevel: 6, min: 29200, max: 44900 },
    { code: 'SYS', title: 'Systems Administrator', category: 'TECHNICAL', payLevel: 10, min: 56100, max: 98200 },
    { code: 'NETW', title: 'Network Engineer', category: 'TECHNICAL', payLevel: 8, min: 44900, max: 72000 },
    { code: 'ITSUP', title: 'IT Support Executive', category: 'TECHNICAL', payLevel: 6, min: 29200, max: 44900 },
    { code: 'LTEC', title: 'Senior Lab Technician', category: 'TECHNICAL', payLevel: 7, min: 35400, max: 54800 },
    { code: 'LBAT', title: 'Lab Technician', category: 'TECHNICAL', payLevel: 5, min: 29200, max: 44900 },
    { code: 'ELEC', title: 'Electrical Technician', category: 'TECHNICAL', payLevel: 4, min: 25500, max: 42000 },
  ]
  const designs: Record<string, string> = {}
  for (const d of DESIGNS) {
    const row = await prisma.designation.create({
      data: { institutionId: institution.id, code: d.code, title: d.title, category: d.category, payLevel: d.payLevel, minBasic: d.min, maxBasic: d.max },
    })
    designs[d.code] = row.id
  }
  return { campuses, faculties, allDepts, designs, DEPTS, adminDepts, DESIGNS }
}

// ───────────────────────────────────────────────────────── rbac
import { PERMISSIONS, ROLE_TEMPLATES, ROLE_KEYS } from '../src/core/rbac/permissions'
async function seedRbac() {
  const permIds: Record<string, string> = {}
  for (const p of PERMISSIONS) {
    const row = await prisma.permission.create({ data: { key: p.key, module: p.module, action: p.action, description: p.description } })
    permIds[p.key] = row.id
  }
  const roleIds: Record<string, string> = {}
  for (const [key, t] of Object.entries(ROLE_TEMPLATES)) {
    const role = await prisma.role.create({
      data: {
        key,
        name: t.name,
        description: t.description,
        isSystem: true,
        scope: t.scope,
        permissions: { create: t.permissions.map((p) => ({ permissionId: permIds[p] })) },
      },
    })
    roleIds[key] = role.id
  }
  // custom demonstration roles
  const placement = await prisma.role.create({
    data: {
      key: 'PLACEMENT_COORDINATOR',
      name: 'Placement Coordinator',
      description: 'Coordinates placement drives and student-industry interfaces',
      isSystem: false,
      scope: 'INSTITUTION',
      permissions: { create: ['recruitment:read', 'reports:read', 'dashboard:view'].map((p) => ({ permissionId: permIds[p] })) },
    },
  })
  const iqac = await prisma.role.create({
    data: {
      key: 'IQAC_COORDINATOR',
      name: 'IQAC Coordinator',
      description: 'Internal quality assurance cell coordination and NAAC documentation',
      isSystem: false,
      scope: 'INSTITUTION',
      permissions: { create: ['reports:read', 'reports:read_dept', 'employees:read_dept', 'documents:read_dept', 'dashboard:view'].map((p) => ({ permissionId: permIds[p] })) },
    },
  })
  roleIds['PLACEMENT_COORDINATOR'] = placement.id
  roleIds['IQAC_COORDINATOR'] = iqac.id
  return roleIds
}

// ───────────────────────────────────────────────────────── employees
const indianCities = ['Udaipur', 'Jaipur', 'Jodhpur', 'Kota', 'Ajmer', 'Bikaner', 'Bhilwara', 'Alwar', 'Sikar', 'Pali', 'Chittorgarh', 'Ahmedabad', 'Indore', 'Delhi']
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

interface EmpSeed {
  code: string
  firstName: string
  lastName: string
  gender: 'MALE' | 'FEMALE'
  deptCode: string | null
  campusId: string
  designationCode: string
  staffType: 'TEACHING' | 'NON_TEACHING' | 'TECHNICAL'
  employmentType: 'PERMANENT' | 'CONTRACT' | 'VISITING' | 'PART_TIME' | 'ADJUNCT'
  joining: Date
  officialEmail: string
  isDemo: boolean
}

async function seedEmployees(ctx: Awaited<ReturnType<typeof seedStructure>>) {
  const emps: EmpSeed[] = []
  let seq = 1001
  const mkEmail = (f: string, l: string, code: string) => `${f.toLowerCase().replace(/[^a-z]/g, '')}.${l.toLowerCase().replace(/[^a-z]/g, '')}${code.slice(-2)}@${EMAIL_DOMAIN}`

  // Principal (no department)
  {
    const f = 'Rajeshwari', l = 'Devpura'
    const code = `EMP-${seq++}`
    emps.push({ code, firstName: f, lastName: l, gender: 'FEMALE', deptCode: null, campusId: ctx.campuses.MAIN.id, designationCode: 'PRIN', staffType: 'TEACHING', employmentType: 'PERMANENT', joining: new Date('2015-06-01'), officialEmail: `principal@${EMAIL_DOMAIN}`, isDemo: true })
  }

  // teaching staff per department
  for (const d of ctx.DEPTS) {
    const n = d.teaching
    const guestCount = Math.max(0, Math.round(n * 0.12))
    for (let i = 0; i < n; i++) {
      const gender = faker.person.sex() === 'female' ? 'FEMALE' : 'MALE'
      const firstName = gender === 'FEMALE' ? faker.person.firstName('female') : faker.person.firstName('male')
      const lastName = faker.person.lastName()
      const code = `EMP-${seq++}`
      const isGuest = i >= n - guestCount
      const joiningYearsAgo = isGuest ? rint(0, 2) : rint(1, 22)
      const desig = isGuest ? (Math.random() < 0.3 ? 'VPROF' : 'GFAC') : i === 0 ? 'PROF' : i === 1 ? (n > 6 ? 'APROF' : 'ASST') : i <= 3 && Math.random() < 0.6 ? 'APROF' : 'ASST'
      emps.push({
        code, firstName, lastName, gender,
        deptCode: d.code,
        campusId: ctx.campuses[d.campus].id,
        designationCode: desig,
        staffType: 'TEACHING',
        employmentType: isGuest ? (desig === 'VPROF' ? 'VISITING' : 'CONTRACT') : 'PERMANENT',
        joining: addDays(NOW, -rint(30, joiningYearsAgo * 365)),
        officialEmail: mkEmail(firstName, lastName, code),
        isDemo: false,
      })
    }
    // lab technicians in engineering departments
    for (let i = 0; i < (d.labs ?? 0); i++) {
      const gender = faker.person.sex() === 'female' ? 'FEMALE' : 'MALE'
      const firstName = gender === 'FEMALE' ? faker.person.firstName('female') : faker.person.firstName('male')
      const lastName = faker.person.lastName()
      const code = `EMP-${seq++}`
      emps.push({
        code, firstName, lastName, gender, deptCode: d.code, campusId: ctx.campuses[d.campus].id,
        designationCode: Math.random() < 0.35 ? 'LTEC' : 'LBAT', staffType: 'TECHNICAL', employmentType: 'PERMANENT',
        joining: addDays(NOW, -rint(90, 15 * 365)), officialEmail: mkEmail(firstName, lastName, code), isDemo: false,
      })
    }
  }

  // administrative departments staffing
  const adminStaffing: [string, string, number][] = [
    ['REG', 'DREG', 1], ['REG', 'AREG', 2], ['REG', 'SCLR', 4], ['REG', 'JCLR', 6],
    ['EST', 'AREG', 1], ['EST', 'OSUP', 2], ['EST', 'SCLR', 3], ['EST', 'JCLR', 4],
    ['ACC', 'AOFF', 2], ['ACC', 'JACC', 5], ['ACC', 'SCLR', 3],
    ['EXAM', 'OSUP', 2], ['EXAM', 'SCLR', 4], ['EXAM', 'JCLR', 5],
    ['LIB', 'LIBR', 1], ['LIB', 'DLBR', 2], ['LIB', 'LASS', 7],
    ['STR', 'SKEEP', 3], ['STR', 'JCLR', 3],
    ['ESTATE', 'LTEC', 2], ['ESTATE', 'ELEC', 5],
    ['ITCELL', 'SYS', 3], ['ITCELL', 'NETW', 2], ['ITCELL', 'ITSUP', 6],
  ]
  for (const [deptCode, desig, count] of adminStaffing) {
    const d = ctx.adminDepts.find((x) => x.code === deptCode)!
    for (let i = 0; i < count; i++) {
      const gender = faker.person.sex() === 'female' ? 'FEMALE' : 'MALE'
      const firstName = gender === 'FEMALE' ? faker.person.firstName('female') : faker.person.firstName('male')
      const lastName = faker.person.lastName()
      const code = `EMP-${seq++}`
      const staffType = ctx.DESIGNS.find((x) => x.code === desig)!.category === 'TECHNICAL' ? 'TECHNICAL' : 'NON_TEACHING'
      emps.push({
        code, firstName, lastName, gender, deptCode, campusId: ctx.campuses[d.campus].id,
        designationCode: desig, staffType, employmentType: 'PERMANENT',
        joining: addDays(NOW, -rint(120, 20 * 365)), officialEmail: mkEmail(firstName, lastName, code), isDemo: false,
      })
    }
  }

  // designated demo accounts (override emails of chosen people)
  const byDept = (code: string) => emps.filter((e) => e.deptCode === code)
  const cseSenior = byDept('CSE')[0]
  const matSenior = byDept('MAT')[0]
  const cseFaculty = byDept('CSE')[4] ?? byDept('CSE')[1]
  const hrPerson = byDept('EST').find((e) => e.designationCode === 'AREG')!
  const hrPerson2 = byDept('EST').find((e) => e.designationCode === 'OSUP')!
  const accountsLead = byDept('ACC').find((e) => e.designationCode === 'AOFF')!
  const itLead = byDept('ITCELL').find((e) => e.designationCode === 'SYS')!
  const officeStaff = byDept('REG').find((e) => e.designationCode === 'SCLR')!
  const techStaff = byDept('ITCELL').find((e) => e.designationCode === 'ITSUP')!

  const overrides: [EmpSeed | undefined, string][] = [
    [cseSenior, `hod.cse@${EMAIL_DOMAIN}`],
    [matSenior, `hod.math@${EMAIL_DOMAIN}`],
    [cseFaculty, `faculty@${EMAIL_DOMAIN}`],
    [hrPerson, `hr.admin@${EMAIL_DOMAIN}`],
    [accountsLead, `accounts@${EMAIL_DOMAIN}`],
    [itLead, `superadmin@${EMAIL_DOMAIN}`],
    [officeStaff, `staff@${EMAIL_DOMAIN}`],
    [techStaff, `tech@${EMAIL_DOMAIN}`],
  ]
  for (const [emp, email] of overrides) {
    if (emp) {
      emp.officialEmail = email
      emp.isDemo = true
    }
  }

  // insert employees + users
  const idByCode: Record<string, string> = {}
  for (const e of emps) {
    const fullName = `${e.firstName} ${e.lastName}`
    const age = rint(26, 60)
    const dob = addDays(NOW, -age * 365 - rint(0, 364))
    const city = pick(indianCities)
    const emp = await prisma.employee.create({
      data: {
        employeeCode: e.code,
        institutionId: INST.id,
        campusId: e.campusId,
        departmentId: e.deptCode ? ctx.allDepts[e.deptCode] : null,
        designationId: ctx.designs[e.designationCode],
        staffType: e.staffType,
        employmentType: e.employmentType,
        status: e.employmentType === 'PERMANENT' && e.joining.getTime() > addDays(NOW, -365).getTime() ? 'PROBATION' : 'ACTIVE',
        title: e.staffType === 'TEACHING' && ['PROF', 'APROF', 'VPROF'].includes(e.designationCode) ? 'Dr./Prof.' : e.gender === 'FEMALE' ? 'Ms./Mrs.' : 'Mr.',
        firstName: e.firstName, lastName: e.lastName, fullName,
        gender: e.gender,
        dateOfBirth: dob,
        bloodGroup: pick(bloodGroups),
        maritalStatus: age > 28 ? (Math.random() < 0.85 ? 'MARRIED' : 'SINGLE') : 'SINGLE',
        reservationCategory: Math.random() < 0.5 ? 'GENERAL' : pick(['OBC', 'SC', 'ST', 'EWS', 'GENERAL'] as const),
        personalEmail: faker.internet.email({ firstName: e.firstName, lastName: e.lastName }).toLowerCase(),
        officialEmail: e.officialEmail,
        phone: faker.phone.number({ style: 'human' }),
        addressLine: `${faker.number.int({ min: 1, max: 400 })}, ${pick(['Shastri Colony', 'Vidya Nagar', 'Ambamata Scheme', 'Sector 4', 'Madhav Nagar', 'Ashok Nagar'])}`,
        city, state: 'Rajasthan',
        pincode: pick(['313001', '313002', '313003', '302001', '342001']),
        emergencyContactName: `${pick(['Shri', 'Smt'])} ${faker.person.lastName()}`,
        emergencyContactPhone: faker.phone.number({ style: 'human' }),
        joiningDate: e.joining,
        probationEndDate: e.employmentType === 'PERMANENT' ? addDays(e.joining, 365) : null,
        confirmationDate: e.employmentType === 'PERMANENT' && e.joining.getTime() < addDays(NOW, -400).getTime() ? addDays(e.joining, 365) : null,
        photoSeed: faker.number.int({ min: 0, max: 999 }),
        serviceEvents: { create: { eventType: 'JOINING', effectiveDate: e.joining, details: 'Joined service', referenceNo: `JOIN-${e.code}` } },
      },
    })
    idByCode[e.code] = emp.id

    // qualifications
    const quals: { degree: string; field: string; institutionName: string; university: string; yearOfPassing: number; percentage: number | null; mode: string }[] = []
    if (e.staffType === 'TEACHING') {
      const field = { CSE: 'Computer Science', IT: 'Computer Science', ECE: 'Electronics', EEE: 'Electrical Engineering', ME: 'Mechanical Engineering', CE: 'Civil Engineering', AID: 'Computer Science', MCA: 'Computer Applications' }[e.deptCode ?? ''] ?? pick(['Mathematics', 'Physics', 'Chemistry', 'Botany', 'Zoology', 'Commerce', 'Management', 'English', 'Hindi', 'Political Science', 'Sociology', 'Psychology', 'History', 'Education', 'Statistics', 'Biotechnology', 'Tourism'])
      const senior = ['PROF', 'APROF'].includes(e.designationCode)
      quals.push({ degree: senior ? 'M_TECH' : pick(['M_TECH', 'M_SC', 'MBA', 'MA', 'M_COM']), field, institutionName: 'Regional Institute', university: pick(['Rajasthan Technical University', 'MLS University', 'Panjab University']), yearOfPassing: dob.getUTCFullYear() + 24, percentage: rint(60, 92), mode: 'Full-time' })
      if (senior || Math.random() < 0.45) {
        quals.push({ degree: 'PHD', field: quals[0].field, institutionName: pick(['IIT Bombay', 'IIT Delhi', 'IISc Bengaluru', 'BITS Pilani', 'JNU', 'University of Rajasthan']), university: quals[0].university, yearOfPassing: dob.getUTCFullYear() + rint(27, 33), percentage: null, mode: 'Full-time' })
      }
    } else {
      quals.push({ degree: pick(['B_COM', 'BA', 'B_SC', 'B_ED', 'DIPLOMA', 'ITI', 'M_COM', 'PG_DIPLOMA']), field: pick(['Commerce', 'Office Management', 'Computer Science', 'Library Science', 'Electronics', 'Accounting', 'Public Administration']), institutionName: pick(['MLS University', 'Rajasthan Technical University', 'Govt. Polytechnic']), university: 'MLS University', yearOfPassing: dob.getUTCFullYear() + 22, percentage: rint(55, 88), mode: 'Full-time' })
    }
    for (const q of quals) {
      await prisma.qualification.create({ data: { employeeId: emp.id, ...q } as never })
    }

    // prior experience for seniors
    if (e.joining.getTime() < addDays(NOW, -8 * 365).getTime() && Math.random() < 0.7) {
      const from = new Date(dob.getUTCFullYear() + 25, rint(0, 11), 1)
      const to = addDays(from, rint(365, 2000))
      if (to < e.joining) {
        await prisma.experienceEntry.create({
          data: {
            employeeId: emp.id,
            organisation: pick(['GECS College', 'Modi Institute of Technology', 'Vidya Bharti College', 'Saraswati Vidya Mandir', ' Rajasthan Power Corp', 'Aravalli Infotech Pvt Ltd', 'Sethi & Co. Chartered Accountants']),
            designationTitle: pick(['Lecturer', 'Assistant Professor', 'Accountant', 'Technical Assistant', 'Office Superintendent']),
            fromDate: from, toDate: to,
            monthlySalary: rint(18000, 45000),
          } as never,
        })
      }
    }

    // user account
    await prisma.user.create({
      data: { email: e.officialEmail, employeeId: emp.id, passwordHash: PASSWORD_HASH, isDemo: e.isDemo },
    })
  }

  return { emps, idByCode }
}

// ───────────────────────────────────────────────────────── roles & salary
async function seedRoleAssignments(ctx: Awaited<ReturnType<typeof seedStructure>>, roleIds: Record<string, string>, emps: EmpSeed[], idByCode: Record<string, string>) {
  const hodCode: Record<string, EmpSeed> = {}
  // HOD per department: senior teaching member of academic depts; head for admin depts
  for (const d of ctx.DEPTS) {
    const senior = emps.find((e) => e.deptCode === d.code && e.staffType === 'TEACHING' && e.employmentType === 'PERMANENT')
    if (senior) hodCode[d.code] = senior
  }
  const adminHead: Record<string, string> = {
    REG: 'DREG', EST: 'AREG', ACC: 'AOFF', EXAM: 'OSUP', LIB: 'LIBR', STR: 'SKEEP', ESTATE: 'LTEC', ITCELL: 'SYS',
  }
  const hodAdminCode: Record<string, EmpSeed> = {}
  for (const d of ctx.adminDepts) {
    const head = emps.find((e) => e.deptCode === d.code && e.designationCode === adminHead[d.code])
    if (head) hodAdminCode[d.code] = head
  }

  // role assignments
  const assign: { email: string; roleKey: string; deptCode?: string }[] = []
  for (const e of emps) {
    if (e.staffType === 'TEACHING') assign.push({ email: e.officialEmail, roleKey: ROLE_KEYS.FACULTY })
    else if (e.staffType === 'NON_TEACHING') assign.push({ email: e.officialEmail, roleKey: ROLE_KEYS.NON_TEACHING_STAFF })
    else assign.push({ email: e.officialEmail, roleKey: ROLE_KEYS.TECHNICAL_STAFF })
  }
  for (const [code, senior] of Object.entries(hodCode)) {
    assign.push({ email: senior.officialEmail, roleKey: ROLE_KEYS.HOD, deptCode: code })
  }
  for (const [code, head] of Object.entries(hodAdminCode)) {
    assign.push({ email: head.officialEmail, roleKey: ROLE_KEYS.HOD, deptCode: code })
  }
  assign.push({ email: `principal@${EMAIL_DOMAIN}`, roleKey: ROLE_KEYS.PRINCIPAL })
  assign.push({ email: `hr.admin@${EMAIL_DOMAIN}`, roleKey: ROLE_KEYS.HR_ADMIN })
  const hrPerson2 = emps.find((e) => e.deptCode === 'EST' && e.designationCode === 'OSUP')
  if (hrPerson2) assign.push({ email: hrPerson2.officialEmail, roleKey: ROLE_KEYS.HR_ADMIN })
  assign.push({ email: `accounts@${EMAIL_DOMAIN}`, roleKey: ROLE_KEYS.ACCOUNTANT })
  for (const e of emps.filter((x) => x.deptCode === 'ACC' && x.designationCode === 'AOFF')) {
    if (e.officialEmail !== `accounts@${EMAIL_DOMAIN}`) assign.push({ email: e.officialEmail, roleKey: ROLE_KEYS.ACCOUNTANT })
  }
  assign.push({ email: `superadmin@${EMAIL_DOMAIN}`, roleKey: ROLE_KEYS.SUPER_ADMIN })
  assign.push({ email: `staff@${EMAIL_DOMAIN}`, roleKey: ROLE_KEYS.NON_TEACHING_STAFF }) // ensured
  // custom roles for two people
  const mgtSenior = emps.find((e) => e.deptCode === 'MGT' && e.designationCode === 'APROF')
  const eduSenior = emps.find((e) => e.deptCode === 'EDU')
  if (mgtSenior) assign.push({ email: mgtSenior.officialEmail, roleKey: 'PLACEMENT_COORDINATOR' })
  if (eduSenior) assign.push({ email: eduSenior.officialEmail, roleKey: 'IQAC_COORDINATOR' })

  const deptIdByCode = ctx.allDepts
  for (const a of assign) {
    const u = await prisma.user.findUnique({ where: { email: a.email } })
    if (!u) continue
    await prisma.userRole.create({
      data: { userId: u.id, roleId: roleIds[a.roleKey], departmentId: a.deptCode ? deptIdByCode[a.deptCode] : null },
    })
  }
  // set department HODs
  for (const [code, senior] of Object.entries(hodCode)) {
    await prisma.department.update({ where: { id: deptIdByCode[code] }, data: { hodId: idByCode[senior.code] } })
  }
  for (const [code, head] of Object.entries(hodAdminCode)) {
    await prisma.department.update({ where: { id: deptIdByCode[code] }, data: { hodId: idByCode[head.code] } })
  }
  return { hodCode, hodAdminCode }
}

// salary structures
async function seedSalaries(ctx: Awaited<ReturnType<typeof seedStructure>>, emps: EmpSeed[]) {
  for (const e of emps) {
    const d = ctx.DESIGNS.find((x) => x.code === e.designationCode)!
    const tenureYears = Math.min(25, Math.max(0, (NOW.getTime() - e.joining.getTime()) / (365 * 24 * 3600 * 1000)))
    const basic = Math.round((d.min + (d.max - d.min) * Math.min(0.8, tenureYears / 24)) / 100) * 100
    await prisma.salaryStructure.create({
      data: {
        employeeId: (await prisma.employee.findUnique({ where: { employeeCode: e.code } }))!.id,
        effectiveFrom: e.joining,
        basicMonthly: basic,
        hraPercent: 20,
        daPercent: 42,
        components: {
          create: [
            { code: 'BASIC', name: 'Basic Pay', kind: 'EARNING', calcType: 'FIXED', value: basic },
            { code: 'DA', name: 'Dearness Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 42 },
            { code: 'HRA', name: 'House Rent Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 20 },
            { code: 'CONVY', name: 'Conveyance Allowance', kind: 'EARNING', calcType: 'FIXED', value: 1600 },
            { code: 'MEDICAL', name: 'Medical Allowance', kind: 'EARNING', calcType: 'FIXED', value: 1250 },
            { code: 'SPECIAL', name: 'Special Allowance', kind: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 9 },
          ],
        },
      },
    })
    // a few revisions for seniors
    if (tenureYears > 10 && Math.random() < 0.35) {
      await prisma.salaryRevision.create({
        data: {
          employeeId: (await prisma.employee.findUnique({ where: { employeeCode: e.code } }))!.id,
          effectiveFrom: new Date(`${YEAR}-04-01`),
          reason: 'Annual Increment',
          oldBasic: Math.round(basic / 1.03 / 100) * 100,
          newBasic: basic,
          revisionLetterNo: `INC-${YEAR}-${e.code.replace('EMP-', '')}`,
        },
      })
      await prisma.serviceEvent.create({
        data: {
          employeeId: (await prisma.employee.findUnique({ where: { employeeCode: e.code } }))!.id,
          eventType: 'INCREMENT', effectiveDate: new Date(`${YEAR}-04-01`),
          details: `Annual increment (3% demonstration)`, referenceNo: `INC-${YEAR}-${e.code.replace('EMP-', '')}`,
        },
      })
    }
  }
}

// ───────────────────────────────────────────────────────── workflows
async function seedWorkflows(roleIds: Record<string, string>) {
  const mk = async (name: string, docType: string, description: string, isDefault: boolean, stages: { seq: number; name: string; approverRoleKey?: string; strategy?: string; minApprovals?: number; slaHours?: number; isFinal?: boolean }[]) => {
    return prisma.approvalWorkflow.create({
      data: {
        institutionId: INST.id, name, docType: docType as never, description, isDefault, isActive: true,
        stages: {
          create: stages.map((s) => ({
            seq: s.seq,
            name: s.name,
            approverType: 'ROLE',
            approverRoleId: s.approverRoleKey ? roleIds[s.approverRoleKey] : null,
            strategy: (s.strategy ?? 'ANY') as never,
            minApprovals: s.minApprovals ?? 1,
            slaHours: s.slaHours ?? null,
            isFinal: s.isFinal ?? false,
          })),
        },
      },
    })
  }
  await mk('Leave — Standard (HOD → HR)', 'LEAVE_APPLICATION', 'Two-stage review: department head verifies staffing impact, HR records final decision', true, [
    { seq: 1, name: 'HOD Review', approverRoleKey: 'HOD', slaHours: 48 },
    { seq: 2, name: 'HR Final Approval', approverRoleKey: 'HR_ADMIN', isFinal: true },
  ])
  await mk('Leave — Extended (HOD → HR → Principal)', 'LEAVE_APPLICATION', 'Three-stage review for long-duration leave (configurable alternative)', false, [
    { seq: 1, name: 'HOD Review', approverRoleKey: 'HOD' },
    { seq: 2, name: 'HR Verification', approverRoleKey: 'HR_ADMIN' },
    { seq: 3, name: 'Principal Sanction', approverRoleKey: 'PRINCIPAL', isFinal: true },
  ])
  await mk('Attendance Correction — Standard', 'ATTENDANCE_CORRECTION', 'HOD confirms, HR applies the correction', true, [
    { seq: 1, name: 'HOD Confirmation', approverRoleKey: 'HOD', slaHours: 24 },
    { seq: 2, name: 'HR Application', approverRoleKey: 'HR_ADMIN', isFinal: true },
  ])
  await mk('Payroll — Dual Review (Parallel HR+Accounts → Principal)', 'PAYROLL_RUN', 'HR and Accounts must BOTH clear the first stage (parallel), then the Principal gives final approval', true, [
    { seq: 1, name: 'HR & Accounts Review (parallel)', approverRoleKey: 'HR_ADMIN', strategy: 'ALL', minApprovals: 2 },
    { seq: 2, name: 'Principal Approval', approverRoleKey: 'PRINCIPAL', isFinal: true },
  ])
  await mk('Vacancy Requisition — Standard', 'VACANCY_REQUISITION', 'HOD justifies the post; Principal sanctions the recruitment', true, [
    { seq: 1, name: 'HOD Justification', approverRoleKey: 'HOD' },
    { seq: 2, name: 'Principal Sanction', approverRoleKey: 'PRINCIPAL', isFinal: true },
  ])
}

// ───────────────────────────────────────────────────────── leave
async function seedLeave(emps: EmpSeed[], idByCode: Record<string, string>, hodCode: Record<string, EmpSeed>) {
  const types = await Promise.all([
    prisma.leaveType.create({ data: { institutionId: INST.id, code: 'CL', name: 'Casual Leave', description: 'Short-duration personal leave', annualQuota: 12, paid: true, maxConsecutiveDays: 5 } }),
    prisma.leaveType.create({ data: { institutionId: INST.id, code: 'SL', name: 'Sick Leave', description: 'Medical leave with intimation', annualQuota: 10, paid: true, maxConsecutiveDays: 10, requiresAttachment: true } }),
    prisma.leaveType.create({ data: { institutionId: INST.id, code: 'EL', name: 'Earned Leave', description: 'Vacation-style earned leave', annualQuota: 18, paid: true, carryForward: true } }),
    prisma.leaveType.create({ data: { institutionId: INST.id, code: 'CO', name: 'Compensatory Off', description: 'Off against worked holidays', annualQuota: 12, paid: true, maxConsecutiveDays: 3 } }),
    prisma.leaveType.create({ data: { institutionId: INST.id, code: 'ML', name: 'Maternity Leave', description: 'As per central rules (demonstration)', annualQuota: 180, paid: true, applicableTo: 'NON_TEACHING_ONLY' } }),
    prisma.leaveType.create({ data: { institutionId: INST.id, code: 'PAT', name: 'Paternity Leave', description: 'Paternity leave (demonstration)', annualQuota: 15, paid: true, applicableTo: 'NON_TEACHING_ONLY' } }),
    prisma.leaveType.create({ data: { institutionId: INST.id, code: 'STL', name: 'Study Leave', description: 'For higher studies / research', annualQuota: 365, paid: false, applicableTo: 'TEACHING_ONLY' } }),
    prisma.leaveType.create({ data: { institutionId: INST.id, code: 'LWP', name: 'Leave Without Pay', description: 'Unpaid leave beyond entitlement', annualQuota: 90, paid: false } }),
  ])
  const typeByCode: Record<string, string> = {}
  for (const t of types) typeByCode[t.code] = t.id

  // balances for all employees (current + previous year)
  const balanceRows: { employeeId: string; leaveTypeId: string; year: number; entitled: number; carriedForward: number; usedDays: number; pendingDays: number }[] = []
  const usable = emps.filter((e) => e.staffType === 'TEACHING' || e.staffType === 'NON_TEACHING' || e.staffType === 'TECHNICAL')
  for (const e of usable) {
    const empId = idByCode[e.code]
    for (const t of types) {
      if (t.applicableTo === 'TEACHING_ONLY' && e.staffType !== 'TEACHING') continue
      if (t.applicableTo === 'NON_TEACHING_ONLY' && e.staffType === 'TEACHING') continue
      if (['ML', 'PAT', 'STL'].includes(t.code)) continue // no default balances for special categories
      balanceRows.push({ employeeId: empId, leaveTypeId: t.id, year: YEAR, entitled: t.annualQuota, carriedForward: t.code === 'EL' ? rint(0, 12) : 0, usedDays: 0, pendingDays: 0 })
      if (t.code === 'EL') {
        balanceRows.push({ employeeId: empId, leaveTypeId: t.id, year: YEAR - 1, entitled: t.annualQuota, carriedForward: 0, usedDays: rint(2, 14), pendingDays: 0 })
      }
    }
  }
  for (let i = 0; i < balanceRows.length; i += 500) {
    await prisma.leaveBalance.createMany({ data: balanceRows.slice(i, i + 500) })
  }

  // applications across the last 14 months
  const reasons = [
    'Family function at native place', 'Medical checkup advised by physician', 'Attending a wedding in the family',
    'Personal work at bank and municipal office', 'Fever and rest advised', 'Travel to attend a conference',
    'Children school admission work', 'House shifting', 'Pilgrimage with family', 'Village visit for land paperwork',
  ]
  const approvalTrail: { appId: string; status: string; deptCode: string | null; initiatorName: string; initiatedByEmail: string }[] = []
  let refSeq = 1
  const applications: { employeeId: string; empSeed: EmpSeed; typeCode: string; from: Date; to: Date; days: number; status: string; reason: string; year: number }[] = []
  for (const e of usable) {
    const count = rint(1, 6)
    for (let i = 0; i < count; i++) {
      const typeCode = pick(['CL', 'SL', 'CL', 'EL', 'CO', 'CL'])
      const from = addDays(NOW, -rint(10, 420))
      const days = rint(1, Math.min(6, typeCode === 'EL' ? 10 : 5))
      const to = addDays(from, days - 1)
      const future = from.getTime() > NOW.getTime()
      let status: string
      if (future) status = 'PENDING'
      else {
        const roll = Math.random()
        status = roll < 0.8 ? 'APPROVED' : roll < 0.88 ? 'REJECTED' : roll < 0.94 ? 'APPROVED' : 'CANCELLED'
      }
      applications.push({ employeeId: idByCode[e.code], empSeed: e, typeCode, from, to, days, status, reason: pick(reasons), year: from.getUTCFullYear() })
    }
  }
  // ensure some fresh PENDING (this month) for the approval demos
  const pendingPool = usable.slice(0, 40)
  for (const e of pendingPool.slice(0, 28)) {
    const from = addDays(NOW, rint(2, 18))
    const days = rint(1, 4)
    applications.push({ employeeId: idByCode[e.code], empSeed: e, typeCode: pick(['CL', 'SL', 'EL']), from, to: addDays(from, days - 1), days, status: 'PENDING', reason: pick(reasons), year: YEAR })
  }
  // a couple of RETURNED applications for the resubmit demo
  for (const e of pendingPool.slice(28, 31)) {
    applications.push({ employeeId: idByCode[e.code], empSeed: e, typeCode: 'CL', from: addDays(NOW, 6), to: addDays(NOW, 8), days: 3, status: 'RETURNED', reason: 'Attending a family function', year: YEAR })
  }

  for (const a of applications) {
    const type = types.find((t) => t.code === a.typeCode)!
    const refNo = `LVN-${a.year}-${String(refSeq++).padStart(4, '0')}`
    const decided = a.status === 'APPROVED' || a.status === 'REJECTED' ? addDays(a.from, -rint(0, 2)) : null
    const emp = await prisma.employee.findUnique({ where: { id: a.employeeId }, select: { id: true, departmentId: true, fullName: true } })
    const app = await prisma.leaveApplication.create({
      data: {
        referenceNo: refNo,
        employeeId: a.employeeId,
        leaveTypeId: type.id,
        fromDate: DAY(a.from),
        toDate: DAY(a.to),
        days: a.days,
        reason: a.reason,
        status: a.status as never,
        appliedAt: addDays(a.from, -rint(2, 6)),
        decidedAt: decided,
        decisionNote: a.status === 'REJECTED' ? 'Workload at this time — request alternate dates' : a.status === 'RETURNED' ? 'Dates overlap with department event; please revise' : null,
        balanceYear: a.year,
      },
    })
    if (a.status === 'APPROVED') {
      await prisma.leaveBalance.updateMany({
        where: { employeeId: a.employeeId, leaveTypeId: type.id, year: a.year },
        data: { usedDays: { increment: a.days } },
      })
    }
    if (a.status === 'PENDING') {
      await prisma.leaveBalance.updateMany({
        where: { employeeId: a.employeeId, leaveTypeId: type.id, year: a.year },
        data: { pendingDays: { increment: a.days } },
      })
    }
    // approval trail for decided / pending requests
    if (['APPROVED', 'REJECTED', 'RETURNED', 'PENDING'].includes(a.status)) {
      approvalTrail.push({ appId: app.id, status: a.status, deptCode: a.empSeed.deptCode, initiatorName: emp?.fullName ?? '', initiatedByEmail: a.empSeed.officialEmail })
    }
  }
  return { types, typeByCode, approvalTrail }
}

async function seedApprovalTrails(approvalTrail: { appId: string; status: string; deptCode: string | null; initiatorName: string; initiatedByEmail: string }[], roleIds: Record<string, string>, hodCode: Record<string, EmpSeed>, hrEmails: string[], principalEmail: string) {
  let seq = 1
  const hrUser = await prisma.user.findUnique({ where: { email: hrEmails[0] }, include: { employee: true } })
  const hrName = hrUser?.employee?.fullName ?? 'HR Admin'
  for (const t of approvalTrail) {
    const wf = await prisma.approvalWorkflow.findFirst({ where: { institutionId: INST.id, docType: 'LEAVE_APPLICATION', isDefault: true }, include: { stages: true } })
    if (!wf) continue
    const acts: { stageSeq: number; actorName: string; actorRoleKey?: string; action: string; comment?: string; actedAt: Date }[] = [
      { stageSeq: 1, actorName: t.initiatorName, action: 'SUBMITTED', comment: 'Submitted for approval', actedAt: addDays(NOW, -rint(1, 30)) },
    ]
    const hod = t.deptCode ? hodCode[t.deptCode] : undefined
    if (t.status === 'APPROVED') {
      if (hod) acts.push({ stageSeq: 1, actorName: hod.firstName + ' ' + hod.lastName, actorRoleKey: 'HOD', action: 'APPROVED', comment: 'No classes affected — approved at department level', actedAt: addDays(NOW, -rint(0, 4)) })
      acts.push({ stageSeq: 2, actorName: hrName, actorRoleKey: 'HR_ADMIN', action: 'APPROVED', comment: 'Balance verified — leave sanctioned', actedAt: addDays(NOW, -rint(0, 3)) })
    } else if (t.status === 'REJECTED') {
      if (hod) acts.push({ stageSeq: 1, actorName: hod.firstName + ' ' + hod.lastName, actorRoleKey: 'HOD', action: 'REJECTED', comment: 'Workload at this time — request alternate dates', actedAt: addDays(NOW, -rint(0, 5)) })
    } else if (t.status === 'RETURNED') {
      if (hod) acts.push({ stageSeq: 1, actorName: hod.firstName + ' ' + hod.lastName, actorRoleKey: 'HOD', action: 'RETURNED', comment: 'Dates overlap with department event; please revise', actedAt: addDays(NOW, -rint(0, 3)) })
    } else {
      // PENDING — waiting at stage 1
    }
    const req = await prisma.approvalRequest.create({
      data: {
        referenceNo: `APR-${YEAR}-${String(seq++).padStart(4, '0')}`,
        workflowId: wf.id,
        docType: 'LEAVE_APPLICATION',
        docId: t.appId,
        title: 'Leave application',
        initiatedByUserId: (await prisma.user.findUnique({ where: { email: t.initiatedByEmail } }))?.id ?? null,
        initiatorName: t.initiatorName,
        contextDepartmentId: t.deptCode ? (await prisma.department.findUnique({ where: { code: t.deptCode } }))?.id ?? null : null,
        currentStageSeq: t.status === 'APPROVED' ? 2 : 1,
        status: t.status as never,
        submittedAt: addDays(NOW, -rint(1, 30)),
        decidedAt: t.status === 'APPROVED' || t.status === 'REJECTED' ? addDays(NOW, -rint(0, 5)) : null,
        actions: { create: acts as never },
      },
    })
    await prisma.leaveApplication.update({ where: { id: t.appId }, data: { approvalRequestId: req.id } })
  }
}

// ───────────────────────────────────────────────────────── attendance
async function seedAttendance(emps: EmpSeed[], idByCode: Record<string, string>, approvedLeave: { employeeId: string; fromDate: Date; toDate: Date }[]) {
  const leaveMap = new Map<string, Set<string>>()
  for (const l of approvedLeave) {
    if (!leaveMap.has(l.employeeId)) leaveMap.set(l.employeeId, new Set())
    for (let d = new Date(l.fromDate); d <= l.toDate; d = addDays(d, 1)) {
      leaveMap.get(l.employeeId)!.add(isoDate(d))
    }
  }
  const rows: { employeeId: string; campusId: string; date: Date; status: string; inTime: Date | null; outTime: Date | null; workedHours: number | null; source: string }[] = []
  const HOLIDAYS = new Set(['2026-01-26', '2026-03-04', '2026-03-21', '2026-04-14', '2026-08-15', '2026-09-05', '2026-10-02', '2026-10-20', '2026-11-08', '2025-12-25', '2026-05-01', '2026-06-05', '2026-11-14'])
  const start = addDays(NOW, -420)
  for (const e of emps) {
    const empId = idByCode[e.code]
    const leaves = leaveMap.get(empId)
    for (let d = new Date(start); d <= NOW; d = addDays(d, 1)) {
      const key = isoDate(d)
      const dow = d.getUTCDay()
      if (dow === 0) continue // Sunday weekly off
      if (HOLIDAYS.has(key)) continue // holiday
      if (e.joining > d) continue
      const iso = key
      let status = 'PRESENT'
      let inT: Date | null = null
      let outT: Date | null = null
      const roll = Math.random()
      if (leaves?.has(iso)) status = 'ON_LEAVE'
      else if (roll < 0.025) status = 'ABSENT'
      else if (roll < 0.045) status = 'HALF_DAY'
      else if (roll < 0.055) status = 'WFH'
      else if (roll < 0.065) status = 'OFFICIAL_DUTY'
      if (['PRESENT', 'HALF_DAY', 'WFH', 'OFFICIAL_DUTY'].includes(status)) {
        const inHour = 9, inMin = rint(0, 35)
        const outHour = status === 'HALF_DAY' ? 13 : rint(17, 18)
        const dayBase = DAY(d).getTime()
        inT = new Date(dayBase + (inHour * 60 + inMin) * 60000)
        outT = new Date(dayBase + (outHour * 60 + rint(10, 55)) * 60000)
        rows.push({ employeeId: empId, campusId: e.campusId, date: DAY(d), status, inTime: inT, outTime: outT, workedHours: Math.round(((outT.getTime() - inT.getTime()) / 3600000) * 10) / 10, source: 'BIOMETRIC' })
      } else {
        rows.push({ employeeId: empId, campusId: e.campusId, date: DAY(d), status, inTime: null, outTime: null, workedHours: null, source: status === 'ON_LEAVE' ? 'SYSTEM' : 'BIOMETRIC' })
      }
    }
  }
  for (let i = 0; i < rows.length; i += 5000) {
    await prisma.attendanceRecord.createMany({ data: rows.slice(i, i + 5000) as never })
  }
  // punch records for the last 45 days
  const punches: { employeeId: string; timestamp: Date; direction: string; source: string; deviceId?: string }[] = []
  for (const e of emps) {
    const empId = idByCode[e.code]
    for (let d = addDays(NOW, -45); d <= NOW; d = addDays(d, 1)) {
      const dow = d.getUTCDay()
      if (dow === 0) continue
      const dayBase = DAY(d).getTime()
      punches.push({ employeeId: empId, timestamp: new Date(dayBase + (9 * 60 + rint(0, 30)) * 60000), direction: 'IN', source: 'BIOMETRIC', deviceId: 'BIO-NORTH-02' })
      punches.push({ employeeId: empId, timestamp: new Date(dayBase + (17 * 60 + rint(0, 60)) * 60000), direction: 'OUT', source: 'BIOMETRIC', deviceId: 'BIO-NORTH-02' })
    }
  }
  for (let i = 0; i < punches.length; i += 5000) {
    await prisma.punchRecord.createMany({ data: punches.slice(i, i + 5000) as never })
  }
  // attendance corrections: a few pending, a few decided
  const pendingCorr = emps.slice(0, 30).filter(() => Math.random() < 0.4)
  for (const e of pendingCorr.slice(0, 8)) {
    const date = addDays(NOW, -rint(1, 20))
    const c = await prisma.attendanceCorrection.create({
      data: {
        referenceNo: `COR-${YEAR}-${String(Math.random().toString(36).slice(2, 6).toUpperCase())}`,
        employeeId: idByCode[e.code],
        date: DAY(date),
        requestedIn: new Date(DAY(date).getTime() + 9.5 * 3600000),
        requestedOut: new Date(DAY(date).getTime() + 17.5 * 3600000),
        reason: 'Biometric device was down; punch slip attached',
        status: 'PENDING',
        appliedAt: addDays(NOW, -rint(0, 3)),
      },
    })
    const wf = await prisma.approvalWorkflow.findFirst({ where: { institutionId: INST.id, docType: 'ATTENDANCE_CORRECTION', isDefault: true } })
    const emp = await prisma.employee.findUnique({ where: { id: c.employeeId } })
    if (wf) {
      const req = await prisma.approvalRequest.create({
        data: {
          referenceNo: `APR-${YEAR}-${String(Math.random().toString(36).slice(2, 6).toUpperCase())}`,
          workflowId: wf.id,
          docType: 'ATTENDANCE_CORRECTION',
          docId: c.id,
          title: `Correction for ${isoDate(date)}`,
          initiatedByUserId: (await prisma.user.findUnique({ where: { email: e.officialEmail } }))?.id ?? null,
          initiatorName: emp?.fullName ?? '',
          contextDepartmentId: emp?.departmentId,
          status: 'PENDING',
          actions: { create: { stageSeq: 1, actorName: emp?.fullName ?? '', action: 'SUBMITTED', comment: 'Correction requested' } },
        },
      })
      await prisma.attendanceCorrection.update({ where: { id: c.id }, data: { approvalRequestId: req.id } })
    }
  }
}

// ───────────────────────────────────────────────────────── payroll
function monthlyTds(grossMonthly: number): number {
  const annual = grossMonthly * 12 - 50000
  if (annual <= 300000) return 0
  let tax = 0
  let prev = 300000
  for (const [limit, rate] of [[700000, 0.05], [1000000, 0.1], [1200000, 0.15], [1500000, 0.2]] as [number, number][]) {
    if (annual > limit) tax += (limit - prev) * rate
    else { tax += Math.max(annual - prev, 0) * rate; break }
    prev = limit
  }
  if (annual > 1500000) tax += (annual - 1500000) * 0.3
  return Math.round(tax / 12)
}

async function seedPayroll(emps: EmpSeed[], idByCode: Record<string, string>, accountantEmail: string, principalEmail: string, hrEmails: string[]) {
  const months: { month: number; year: number; status: string }[] = []
  for (let back = 13; back >= 1; back--) {
    const d = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - back, 1))
    months.push({ month: d.getUTCMonth() + 1, year: d.getUTCFullYear(), status: 'COMPLETED' })
  }
  // current month draft (for the live compute → approve → disburse demo)
  months.push({ month: NOW.getUTCMonth() + 1, year: NOW.getUTCFullYear(), status: 'DRAFT' })

  const structures = await prisma.salaryStructure.findMany({ include: { employee: true } })
  const basicByEmp = new Map(structures.map((s) => [s.employeeId, s.basicMonthly]))
  const campusByEmp = new Map(emps.map((e) => [idByCode[e.code], e.campusId]))
  const payrollAdmin = await prisma.user.findUnique({ where: { email: accountantEmail } })
  const principalUser = await prisma.user.findUnique({ where: { email: principalEmail } })

  for (const m of months) {
    const runNo = `PR-${m.year}-${String(m.month).padStart(2, '0')}`
    const from = new Date(Date.UTC(m.year, m.month - 1, 1))
    const to = new Date(Date.UTC(m.year, m.month, 1))
    const attendance = await prisma.attendanceRecord.groupBy({ by: ['employeeId', 'status'], where: { date: { gte: from, lt: to }, status: { in: ['PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'WFH', 'OFFICIAL_DUTY'] } }, _count: { _all: true } })
    const perEmp = new Map<string, Record<string, number>>()
    for (const a of attendance) {
      const rec = perEmp.get(a.employeeId) ?? {}
      rec[a.status] = a._count._all
      perEmp.set(a.employeeId, rec)
    }
    const run = await prisma.payrollRun.create({
      data: {
        runNo,
        institutionId: INST.id,
        periodMonth: m.month,
        periodYear: m.year,
        status: m.status as never,
        processedByUserId: payrollAdmin?.id ?? null,
        processedAt: m.status === 'COMPLETED' ? new Date(Date.UTC(m.year, m.month, 3)) : null,
        approvedAt: m.status === 'COMPLETED' ? new Date(Date.UTC(m.year, m.month, 5)) : null,
      },
    })
    if (m.status !== 'COMPLETED') continue

    let totalGross = 0, totalDed = 0, totalNet = 0, count = 0
    const slips: { payslipNo: string; payrollRunId: string; employeeId: string; periodMonth: number; periodYear: number; basic: number; grossEarnings: number; totalDeductions: number; netPay: number; paidDays: number; lopDays: number; status: string; paidOn: Date | null; lines: { code: string; name: string; kind: string; amount: number; calcDetail: string }[] }[] = []
    for (const s of structures) {
      const emp = s.employee
      if (['SEPARATED', 'ON_LONG_LEAVE'].includes(emp.status)) continue
      if (emp.joiningDate > to) continue
      const counts = perEmp.get(emp.id) ?? {}
      const working = (counts.PRESENT ?? 0) + (counts.HALF_DAY ?? 0) * 0.5 + (counts.ABSENT ?? 0) + (counts.ON_LEAVE ?? 0) + (counts.WFH ?? 0) + (counts.OFFICIAL_DUTY ?? 0)
      const lop = counts.ABSENT ?? 0
      const paidDays = working > 0 ? Math.max(working - lop, 0.5) : 0
      const factor = working > 0 ? paidDays / working : 1
      const basic = s.basicMonthly
      const gross = basic + (basic * 42) / 100 + (basic * 20) / 100 + 1600 + 1250 + (basic * 9) / 100
      const grossPr = Math.round(gross * factor)
      const epf = Math.round(Math.min(basic, 15000) * 0.12)
      const tds = monthlyTds(gross)
      const pt = gross >= 25000 ? 200 : 0
      const ded = epf + tds + pt
      const net = Math.max(0, grossPr - ded)
      const payslipNo = `PS-${m.year}${String(m.month).padStart(2, '0')}-${emp.employeeCode.replace('EMP-', '')}`
      slips.push({
        payslipNo, payrollRunId: run.id, employeeId: emp.id, periodMonth: m.month, periodYear: m.year,
        basic, grossEarnings: grossPr, totalDeductions: ded, netPay: net, paidDays, lopDays: lop,
        status: m.month === NOW.getUTCMonth() + 1 ? 'RELEASED' : 'PAID',
        paidOn: new Date(Date.UTC(m.year, m.month, 7)),
        lines: [
          { code: 'BASIC', name: 'Basic Pay', kind: 'EARNING', amount: Math.round(basic * factor), calcDetail: factor === 1 ? 'full basic' : `${(factor * 100).toFixed(1)}% of basic` },
          { code: 'DA', name: 'Dearness Allowance', kind: 'EARNING', amount: Math.round((basic * 42) / 100 * factor), calcDetail: '42% of basic' },
          { code: 'HRA', name: 'House Rent Allowance', kind: 'EARNING', amount: Math.round((basic * 20) / 100 * factor), calcDetail: '20% of basic' },
          { code: 'CONVY', name: 'Conveyance Allowance', kind: 'EARNING', amount: Math.round(1600 * factor), calcDetail: 'fixed' },
          { code: 'MEDICAL', name: 'Medical Allowance', kind: 'EARNING', amount: Math.round(1250 * factor), calcDetail: 'fixed' },
          { code: 'SPECIAL', name: 'Special Allowance', kind: 'EARNING', amount: Math.round((basic * 9) / 100 * factor), calcDetail: '9% of basic' },
          { code: 'EPF_EE', name: 'EPF (Employee Share)', kind: 'DEDUCTION', amount: epf, calcDetail: '12% of basic (ceiling ₹15,000)' },
          { code: 'TDS', name: 'Income Tax (TDS)', kind: 'DEDUCTION', amount: tds, calcDetail: 'demonstration slabs' },
          { code: 'PT', name: 'Professional Tax', kind: 'DEDUCTION', amount: pt, calcDetail: gross >= 25000 ? '₹200 above ₹25,000 gross' : 'below threshold' },
        ],
      })
      totalGross += grossPr
      totalDed += ded
      totalNet += net
      count++
    }
    for (const sl of slips) {
      const { lines, ...slipData } = sl
      const created = await prisma.payslip.create({ data: slipData as never })
      await prisma.payslipLine.createMany({ data: lines.map((l) => ({ ...l, payslipId: created.id })) as never })
    }
    await prisma.payrollRun.update({
      where: { id: run.id },
      data: { employeeCount: count, totalGross, totalDeductions: totalDed, totalNet },
    })
    await prisma.auditLog.create({
      data: {
        userId: payrollAdmin?.id ?? null,
        actorEmail: accountantEmail,
        action: 'PAYROLL_COMPLETED',
        module: 'payroll',
        entityType: 'PayrollRun',
        entityId: run.id,
        summary: `Payroll ${runNo} completed — ${count} employees, net ₹${totalNet.toLocaleString('en-IN')}`,
      },
    })
  }
  return { months }
}

// ───────────────────────────────────────────────────────── recruitment
async function seedRecruitment(ctx: Awaited<ReturnType<typeof seedStructure>>, hrEmail: string, principalEmail: string, hodCode: Record<string, EmpSeed>) {
  const deptIdByCode = ctx.allDepts
  const campuses = await prisma.campus.findMany({ where: { institutionId: INST.id } })
  const vacancySpecs: { deptCode: string; designation: string; title: string; openings: number; status: string; employmentType: string; pipeline: number; applications?: number }[] = [
    { deptCode: 'CSE', designation: 'ASST', title: 'Assistant Professor — Computer Science & Engineering', openings: 2, status: 'OPEN', employmentType: 'PERMANENT', pipeline: 20 },
    { deptCode: 'AID', designation: 'ASST', title: 'Assistant Professor — Artificial Intelligence & Data Science', openings: 2, status: 'OPEN', employmentType: 'PERMANENT', pipeline: 16 },
    { deptCode: 'MGT', designation: 'ASST', title: 'Assistant Professor — Management Studies', openings: 1, status: 'OPEN', employmentType: 'PERMANENT', pipeline: 12 },
    { deptCode: 'ITCELL', designation: 'NETW', title: 'Network Engineer', openings: 1, status: 'OPEN', employmentType: 'CONTRACT', pipeline: 10 },
    { deptCode: 'PHY', designation: 'APROF', title: 'Associate Professor — Physics', openings: 1, status: 'PENDING_APPROVAL', employmentType: 'PERMANENT', pipeline: 0 },
    { deptCode: 'COM', designation: 'AOFF', title: 'Assistant — Accounts (Commerce dept)', openings: 1, status: 'PENDING_APPROVAL', employmentType: 'PERMANENT', pipeline: 0 },
    { deptCode: 'ECE', designation: 'ASST', title: 'Assistant Professor — Electronics & Communication', openings: 2, status: 'CLOSED', employmentType: 'PERMANENT', pipeline: 14 },
    { deptCode: 'MAT', designation: 'ASST', title: 'Assistant Professor — Mathematics', openings: 1, status: 'CLOSED', employmentType: 'PERMANENT', pipeline: 12 },
    { deptCode: 'LIB', designation: 'LASS', title: 'Library Assistant', openings: 2, status: 'CLOSED', employmentType: 'PERMANENT', pipeline: 16 },
    { deptCode: 'ENG-LIT', designation: 'ASST', title: 'Assistant Professor — English', openings: 1, status: 'ON_HOLD', employmentType: 'PERMANENT', pipeline: 9 },
    { deptCode: 'STA', designation: 'ASST', title: 'Assistant Professor — Statistics', openings: 1, status: 'DRAFT', employmentType: 'PERMANENT', pipeline: 0 },
    { deptCode: 'PED', designation: 'ASST', title: 'Assistant Professor — Physical Education', openings: 1, status: 'DRAFT', employmentType: 'PERMANENT', pipeline: 0 },
  ]
  const vacancies: { id: string; deptCode: string; pipeline: number; status: string; designation: string }[] = []
  let reqSeq = 1
  for (const v of vacancySpecs) {
    const dept = await prisma.department.findUnique({ where: { code: v.deptCode } })
    const desig = await prisma.designation.findFirst({ where: { institutionId: INST.id, code: v.designation } })
    const row = await prisma.vacancy.create({
      data: {
        requisitionNo: `REQ-${YEAR}-${String(reqSeq++).padStart(3, '0')}`,
        institutionId: INST.id,
        departmentId: dept?.id ?? null,
        campusId: (await prisma.employee.findFirst({ where: { departmentId: dept?.id }, select: { campusId: true } }))?.campusId ?? campuses[0].id,
        designationId: desig?.id ?? null,
        title: v.title,
        employmentType: v.employmentType as never,
        openings: v.openings,
        filledCount: v.status === 'CLOSED' ? v.openings : 0,
        description: `Teach and mentor in the ${dept?.name ?? 'department'}; contribute to institutional research and administrative duties as per need.`,
        justification: `Faculty/student ratio and workload analysis supports ${v.openings} additional post(s).`,
        status: v.status as never,
        openedAt: v.status === 'OPEN' || v.status === 'CLOSED' ? addDays(NOW, -rint(30, 120)) : null,
        targetJoinBy: addDays(NOW, rint(30, 120)),
        closedAt: v.status === 'CLOSED' ? addDays(NOW, -rint(5, 25)) : null,
        createdByUserId: (await prisma.user.findUnique({ where: { email: hrEmail } }))?.id ?? null,
      },
    })
    vacancies.push({ id: row.id, deptCode: v.deptCode, pipeline: v.pipeline, status: v.status, designation: v.designation })
    // approval requests for PENDING_APPROVAL vacancies
    if (v.status === 'PENDING_APPROVAL') {
      const wf = await prisma.approvalWorkflow.findFirst({ where: { institutionId: INST.id, docType: 'VACANCY_REQUISITION', isDefault: true } })
      if (wf) {
        const req = await prisma.approvalRequest.create({
          data: {
            referenceNo: `APR-${YEAR}-${String(Math.random().toString(36).slice(2, 6).toUpperCase())}`,
            workflowId: wf.id,
            docType: 'VACANCY_REQUISITION',
            docId: row.id,
            title: `${v.title} (${v.openings} post${v.openings > 1 ? 's' : ''})`,
            initiatedByUserId: (await prisma.user.findUnique({ where: { email: hrEmail } }))?.id ?? null,
            initiatorName: 'HR Admin',
            contextDepartmentId: dept?.id ?? null,
            status: 'PENDING',
            actions: { create: { stageSeq: 1, actorName: 'HR Admin', actorRoleKey: 'HR_ADMIN', action: 'SUBMITTED', comment: 'Requisition for sanction' } },
          },
        })
        await prisma.vacancy.update({ where: { id: row.id }, data: { approvalRequestId: req.id } })
      }
    }
  }

  // candidates + applications
  let candSeq = 1
  const candidateApplications: { candidateCode: string; vacancyIdx: number; status: string }[] = []
  for (const v of vacancies) {
    for (let i = 0; i < v.pipeline; i++) {
      const gender = faker.person.sex() === 'female' ? 'FEMALE' : 'MALE'
      const firstName = gender === 'FEMALE' ? faker.person.firstName('female') : faker.person.firstName('male')
      const lastName = faker.person.lastName()
      const code = `CND-${YEAR}-${String(candSeq++).padStart(4, '0')}`
      const applied = addDays(NOW, -rint(3, 60))
      let status = 'APPLIED'
      const roll = Math.random()
      if (v.status === 'CLOSED') {
        status = i === 0 ? 'ONBOARDED' : roll < 0.7 ? 'REJECTED' : roll < 0.85 ? 'WITHDRAWN' : 'WAITLISTED'
      } else if (v.status === 'OPEN') {
        status = roll < 0.25 ? 'APPLIED' : roll < 0.55 ? 'SHORTLISTED' : roll < 0.75 ? 'INTERVIEW_SCHEDULED' : roll < 0.85 ? 'INTERVIEWED' : roll < 0.95 ? 'REJECTED' : 'WITHDRAWN'
      } else if (v.status === 'ON_HOLD') {
        status = roll < 0.5 ? 'APPLIED' : roll < 0.8 ? 'SHORTLISTED' : 'REJECTED'
      }
      const c = await prisma.candidate.create({
        data: {
          candidateCode: code,
          firstName, lastName,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          phone: faker.phone.number({ style: 'human' }),
          city: pick(indianCities),
          state: 'Rajasthan',
          highestQualification: pick(['PhD', 'M.Tech', 'M.Sc', 'MCA', 'MBA', 'M.Com', 'M.Ed']),
          specialization: pick(['Computer Science', 'Electronics', 'Mathematics', 'Commerce', 'Library Science', 'Network Administration']),
          experienceYears: rint(0, 12) + Math.round(Math.random() * 10) / 10,
          currentEmployer: Math.random() < 0.6 ? pick(['Vidya Bharti College', 'Saraswati Institute', 'Aravalli Infotech', 'Freelance', 'Modi Institute']) : null,
          currentCtc: rint(3, 12) * 100000,
          expectedCtc: rint(4, 15) * 100000,
          source: pick(['JOB_PORTAL', 'REFERRAL', 'WALK_IN', 'CAMPUS', 'CONSULTANT'] as const),
          notes: Math.random() < 0.3 ? 'Strong academic background; good communication.' : null,
        },
      })
      const app = await prisma.application.create({
        data: {
          vacancyId: v.id,
          candidateId: c.id,
          appliedAt: applied,
          status: status as never,
          rating: ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'].includes(status) ? rint(3, 5) : null,
          shortlistNote: status === 'SHORTLISTED' ? 'Profile matches the specialization requirement' : null,
          rejectReason: status === 'REJECTED' ? pick(['Qualification mismatch', 'Experience below bar', 'Already staffed', 'Salary expectation too high']) : null,
          offerCtc: status === 'ONBOARDED' ? rint(6, 10) * 100000 : null,
          offerSentAt: status === 'ONBOARDED' ? addDays(applied, 20) : null,
          joinedOn: status === 'ONBOARDED' ? addDays(applied, 35) : null,
          onboardedEmployeeCode: status === 'ONBOARDED' ? `EMP-${1000 + candSeq + 500}` : null,
        },
      })
      candidateApplications.push({ candidateCode: c.candidateCode, vacancyIdx: vacancies.indexOf(v), status })
      // interviews
      if (['INTERVIEW_SCHEDULED', 'INTERVIEWED', 'ONBOARDED'].includes(status)) {
        const rounds: { kind: string; daysOffset: number; status: string }[] = [
          { kind: 'SCREENING', daysOffset: 7, status: 'COMPLETED' },
          { kind: 'TEACHING_DEMO', daysOffset: 12, status: 'COMPLETED' },
        ]
        if (status === 'INTERVIEW_SCHEDULED') {
          rounds.length = 1
          rounds.push({ kind: 'TEACHING_DEMO', daysOffset: rint(1, 6), status: 'SCHEDULED' })
        } else if (status === 'INTERVIEWED') {
          rounds.push({ kind: 'HR_ROUND', daysOffset: -2, status: 'COMPLETED' })
        }
        if (status === 'ONBOARDED') rounds.push({ kind: 'MANAGEMENT', daysOffset: 16, status: 'COMPLETED' })
        let rn = 1
        for (const r of rounds) {
          const scheduled = addDays(applied, r.daysOffset)
          const hod = hodCode[v.deptCode]
          await prisma.interview.create({
            data: {
              applicationId: app.id,
              roundNo: rn++,
              kind: r.kind as never,
              mode: pick(['IN_PERSON', 'ONLINE']) as never,
              scheduledAt: scheduled,
              venueOrLink: r.kind === 'TEACHING_DEMO' ? 'Seminar Hall A, Technology Campus' : 'Conference Room, Admin Block',
              durationMin: rint(30, 60),
              status: r.status as never,
              panel: { members: [hod ? `${hod.firstName} ${hod.lastName} (HOD)` : 'Panel Chair', 'Dean of Faculty', 'HR Representative'] } as never,
              overallRating: r.status === 'COMPLETED' ? rint(3, 5) : null,
              feedback: r.status === 'COMPLETED' ? pick([
                'Clear fundamentals; engaging classroom delivery with good use of examples.',
                'Research orientation aligns with the department plan. Recommended.',
                'Sound subject knowledge; communication skills adequate.',
                'Practical demonstration of network design was hands-on and confident.',
              ]) : null,
              recommendation: r.status === 'COMPLETED' ? pick(['STRONG_HIRE', 'HIRE', 'HIRE']) as never : null,
              decidedAt: r.status === 'COMPLETED' ? scheduled : null,
              decidedBy: r.status === 'COMPLETED' ? hod ? `${hod.firstName} ${hod.lastName}` : 'Panel' : null,
            },
          })
        }
      }
    }
  }
  return { vacancies }
}

// ───────────────────────────────────────────────────────── academics
async function seedAcademics(ctx: Awaited<ReturnType<typeof seedStructure>>, emps: EmpSeed[], idByCode: Record<string, string>) {
  const terms = await Promise.all([
    prisma.academicTerm.create({ data: { institutionId: INST.id, name: 'Odd Semester 2026–27', kind: 'ODD_SEM', startDate: new Date('2026-07-15'), endDate: new Date('2026-11-30'), isActive: true } }),
    prisma.academicTerm.create({ data: { institutionId: INST.id, name: 'Even Semester 2025–26', kind: 'EVEN_SEM', startDate: new Date('2026-01-05'), endDate: new Date('2026-05-31') } }),
    prisma.academicTerm.create({ data: { institutionId: INST.id, name: 'Odd Semester 2025–26', kind: 'ODD_SEM', startDate: new Date('2025-07-15'), endDate: new Date('2025-11-30') } }),
  ])
  const activeTerm = terms[0]

  // subject allocations for teaching departments
  const teachingEmps = emps.filter((e) => e.staffType === 'TEACHING')
  const byDept = new Map<string, EmpSeed[]>()
  for (const e of teachingEmps) {
    const list = byDept.get(e.deptCode ?? 'NONE') ?? []
    list.push(e)
    byDept.set(e.deptCode ?? 'NONE', list)
  }
  const subjectTitles: Record<string, string[]> = {
    CSE: ['Data Structures & Algorithms', 'Operating Systems', 'Database Management Systems', 'Computer Networks', 'Software Engineering', 'Machine Learning', 'Compiler Design', 'Cloud Computing'],
    IT: ['Web Technologies', 'Information Security', 'Data Warehousing', 'Mobile Application Development'],
    ECE: ['Signals & Systems', 'Digital Electronics', 'VLSI Design', 'Embedded Systems'],
    EEE: ['Electrical Machines', 'Power Systems', 'Control Systems'],
    ME: ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing Processes'],
    CE: ['Structural Analysis', 'Geotechnical Engineering', 'Transportation Engineering'],
    AID: ['Deep Learning', 'Big Data Analytics', 'Natural Language Processing'],
    PHY: ['Classical Mechanics', 'Quantum Physics', 'Electrodynamics', 'Statistical Physics'],
    CHE: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry'],
    MAT: ['Real Analysis', 'Linear Algebra', 'Complex Analysis', 'Numerical Methods', 'Graph Theory'],
    BOT: ['Plant Physiology', 'Genetics', 'Ethnobotany'],
    ZOO: ['Animal Physiology', 'Evolutionary Biology'],
    BT: ['Molecular Biology', 'Genetic Engineering', 'Bioprocess Technology'],
    STA: ['Probability Theory', 'Statistical Inference', 'Regression Analysis'],
    COM: ['Financial Accounting', 'Corporate Accounting', 'Taxation', 'Auditing'],
    MGT: ['Organisational Behaviour', 'Human Resource Management', 'Marketing Management'],
    FIN: ['Financial Management', 'Investment Analysis'],
    TTM: ['Tourism Principles', 'Hospitality Operations'],
    'ENG-LIT': ['British Literature', 'American Literature', 'Literary Criticism'],
    HIN: ['हिंदी साहित्य', 'भाषा विज्ञान'],
    POL: ['International Relations', 'Political Theory'],
    SOC: ['Sociological Thought', 'Rural Sociology'],
    PSY: ['Cognitive Psychology', 'Social Psychology'],
    HIS: ['Modern Indian History', 'World History'],
    EDU: ['Educational Psychology', 'Pedagogy'],
    PED: ['Sports Science', 'Physical Education Methods'],
    MCA: ['Advanced Java', 'Cloud Architecture', 'Data Mining'],
  }
  let subjCount = 0
  for (const [deptCode, titles] of Object.entries(subjectTitles)) {
    const faculty = byDept.get(deptCode) ?? []
    const deptId = ctx.allDepts[deptCode]
    for (let i = 0; i < titles.length; i++) {
      const teacher = faculty.length ? faculty[i % faculty.length] : undefined
      const isLab = Math.random() < 0.3
      await prisma.subjectAllocation.create({
        data: {
          termId: activeTerm.id,
          departmentId: deptId,
          employeeId: teacher ? idByCode[teacher.code] : null,
          code: `${deptCode}-${300 + i * 10}`,
          title: titles[i],
          lectureHours: rint(3, 5),
          tutorialHours: Math.random() < 0.3 ? 1 : 0,
          labHours: isLab ? rint(2, 4) : 0,
          credits: rint(3, 4),
          groups: Math.random() < 0.2 ? 2 : 1,
          academicYear: `${YEAR}-${YEAR + 1}`,
        },
      })
      subjCount++
    }
  }

  // workload entries for teaching employees
  const subjects = await prisma.subjectAllocation.findMany({ where: { termId: activeTerm.id } })
  const loadByEmp = new Map<string, { teaching: number; lab: number; tutorial: number; subjects: number }>()
  for (const s of subjects) {
    if (!s.employeeId) continue
    const l = loadByEmp.get(s.employeeId) ?? { teaching: 0, lab: 0, tutorial: 0, subjects: 0 }
    l.teaching += s.lectureHours * s.groups
    l.tutorial += s.tutorialHours * s.groups
    l.lab += s.labHours * s.groups
    l.subjects++
    loadByEmp.set(s.employeeId, l)
  }
  // research + mentoring + duties
  const researchRows: { employeeId: string; outputType: string; title: string; venue: string; authors: string; year: number; indexedIn: string | null; rating: number | null; status: string; amountSanctioned: number | null; durationMonths: number | null }[] = []
  const mentoringRows: { employeeId: string; kind: string; studentOrTopic: string; count: number; year: number }[] = []
  const dutyRows: { employeeId: string; title: string; since: Date; until: Date | null; pointsPerWeek: number }[] = []
  const duties = ['Placement Coordinator', 'Exam Cell In-charge', 'IQAC Member', 'Cultural Committee Convenor', 'Sports Secretary', 'Alumni Coordinator', 'Hostel Warden (Boys)', 'Hostel Warden (Girls)', 'NAAC Steering Committee', 'Anti-Ragging Committee', 'Library Committee', 'Time-Table Coordinator']
  for (const e of teachingEmps) {
    const empId = idByCode[e.code]
    const outputCount = e.designationCode === 'PROF' ? rint(5, 9) : e.designationCode === 'APROF' ? rint(3, 6) : rint(1, 4)
    for (let i = 0; i < outputCount; i++) {
      const type = pick(['JOURNAL_ARTICLE', 'JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'CONFERENCE_PAPER', 'BOOK_CHAPTER', 'BOOK', 'PATENT', 'SPONSORED_PROJECT', 'CONSULTANCY'] as const)
      researchRows.push({
        employeeId: empId,
        outputType: type,
        title: pick([
          'A hybrid ensemble approach for intrusion detection', 'Fractional-order modelling of thermal systems',
          'Comparative study of tribal education policies', 'Machine learning for crop disease prediction',
          'Spectral analysis of variable stars', 'Green synthesis of nanoparticles',
          'Tourism livelihood linkages in Rajasthan', 'Sentiment analysis of vernacular social media',
          'Deep features for handwritten Devanagari recognition', 'Watershed management and community participation',
          'Curriculum interventions in teacher education', 'Quantum cryptography key distribution protocols',
        ]),
        venue: pick(['Elsevier Journal', 'Springer LNCS', 'IEEE Access', 'Taylor & Francis', 'UGC-CARE Listed Journal', 'Scopus Indexed Conference']),
        authors: `${e.firstName[0]}. ${e.lastName}; et al.`,
        year: rint(YEAR - 3, YEAR),
        indexedIn: pick(['Scopus', 'SCI', 'WoS', 'UGC-CARE']),
        rating: Math.round((Math.random() * 4 + 1) * 10) / 10,
        status: pick(['PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'IN_PRESS', 'ONGOING', 'COMPLETED']),
        amountSanctioned: ['SPONSORED_PROJECT', 'CONSULTANCY'].includes(type) ? rint(2, 30) * 100000 : null,
        durationMonths: ['SPONSORED_PROJECT', 'CONSULTANCY'].includes(type) ? rint(12, 36) : null,
      })
    }
    if (['PROF', 'APROF'].includes(e.designationCode)) {
      mentoringRows.push({ employeeId: empId, kind: 'PHD_SUPERVISION', studentOrTopic: pick(['Ms. Anjali Meena', 'Mr. Rakesh Jat', 'Ms. Priya Sharma', 'Mr. Devendra Sisodia']), count: rint(1, 4), year: YEAR })
    }
    mentoringRows.push({ employeeId: empId, kind: pick(['PG_PROJECT_GUIDE', 'UG_PROJECT_GUIDE']), studentOrTopic: 'Batch project groups', count: rint(2, 6), year: YEAR })
    if (Math.random() < 0.3) {
      dutyRows.push({ employeeId: empId, title: pick(duties), since: addDays(NOW, -rint(100, 700)), until: null, pointsPerWeek: rint(1, 3) })
    }
  }
  for (let i = 0; i < researchRows.length; i += 500) await prisma.researchOutput.createMany({ data: researchRows.slice(i, i + 500) as never })
  for (let i = 0; i < mentoringRows.length; i += 500) await prisma.mentoringEntry.createMany({ data: mentoringRows.slice(i, i + 500) as never })
  for (let i = 0; i < dutyRows.length; i += 500) await prisma.administrativeDuty.createMany({ data: dutyRows.slice(i, i + 500) as never })

  // workload entries
  const researchByEmp = new Map<string, number>()
  for (const r of researchRows) researchByEmp.set(r.employeeId, (researchByEmp.get(r.employeeId) ?? 0) + 1)
  const mentorByEmp = new Map<string, number>()
  for (const m of mentoringRows) mentorByEmp.set(m.employeeId, (mentorByEmp.get(m.employeeId) ?? 0) + m.count)
  const dutyPointsByEmp = new Map<string, number>()
  for (const d of dutyRows) dutyPointsByEmp.set(d.employeeId, (dutyPointsByEmp.get(d.employeeId) ?? 0) + d.pointsPerWeek)
  for (const e of teachingEmps) {
    const empId = idByCode[e.code]
    const l = loadByEmp.get(empId) ?? { teaching: 0, lab: 0, tutorial: 0, subjects: 0 }
    const deptId = ctx.allDepts[e.deptCode ?? 'CSE']
    const supervisions = mentorByEmp.get(empId) ?? 0
    const adminPoints = dutyPointsByEmp.get(empId) ?? 0
    const researchPoints = researchByEmp.get(empId) ?? 0
    const teachingHours = l.teaching + l.tutorial + l.lab * 0.5
    const total = teachingHours + supervisions * 0.5 + adminPoints + researchPoints * 0.5
    await prisma.workloadEntry.create({
      data: {
        termId: activeTerm.id, employeeId: empId, departmentId: deptId,
        teachingHours: l.teaching, tutorialHours: l.tutorial, labHours: l.lab,
        supervisions, adminPoints, researchPoints,
        totalLoadPoints: Math.round(total * 10) / 10, standardHours: 16,
        isOverloaded: l.teaching > 16, remarks: l.teaching > 16 ? 'Above norm — review allocation' : null,
      },
    })
  }
  return { activeTerm, subjCount }
}

// ───────────────────────────────────────────────────────── appraisal
async function seedAppraisal(emps: EmpSeed[], idByCode: Record<string, string>, hodCode: Record<string, EmpSeed>) {
  const prevCycle = await prisma.appraisalCycle.create({
    data: { institutionId: INST.id, name: 'Annual Appraisal 2025–26', periodFrom: new Date('2025-04-01'), periodTo: new Date('2026-03-31'), status: 'COMPLETED', dueDate: new Date('2026-05-31') },
  })
  const activeCycle = await prisma.appraisalCycle.create({
    data: { institutionId: INST.id, name: 'Annual Appraisal 2026–27', periodFrom: new Date('2026-04-01'), periodTo: new Date('2027-03-31'), status: 'ACTIVE', dueDate: new Date('2027-02-28') },
  })
  const grades = ['OUTSTANDING', 'VERY_GOOD', 'VERY_GOOD', 'GOOD', 'GOOD', 'SATISFACTORY', 'NEEDS_IMPROVEMENT'] as const
  const goalsTitles = [
    { category: 'TEACHING', title: 'Complete syllabus coverage with 2 internal assessments' },
    { category: 'TEACHING', title: 'Introduce 2 new lab experiments / case studies' },
    { category: 'RESEARCH', title: 'Publish one paper in a Scopus-indexed venue' },
    { category: 'RESEARCH', title: 'Submit one sponsored project proposal' },
    { category: 'MENTORING', title: 'Guide at least 4 UG/PG project students' },
    { category: 'ADMIN', title: 'Contribute to NAAC / accreditation documentation' },
    { category: 'DEVELOPMENT', title: 'Complete one FDP / certification ≥ 8 hours' },
    { category: 'OTHER', title: 'Mentor student chapter / club activity' },
  ]
  for (const e of emps) {
    const empId = idByCode[e.code]
    if (['SEPARATED'].includes(e.employmentType as string)) continue
    // previous cycle review — completed
    const score = rint(45, 96)
    await prisma.performanceReview.create({
      data: {
        cycleId: prevCycle.id, employeeId: empId,
        selfAssessmentScore: Math.min(100, score + rint(-5, 5)),
        selfComments: 'Completed planned academic and administrative responsibilities during the year.',
        reviewerScore: score,
        reviewerComments: 'Consistent performance; contributions noted in teaching and institutional activities.',
        strengths: 'Subject mastery and student feedback remain strong.',
        improvements: 'Increase research output pace in the coming cycle.',
        finalScore: score,
        grade: grades[score >= 90 ? 0 : score >= 75 ? 1 : score >= 60 ? 3 : score >= 45 ? 4 : 5],
        recommendation: score >= 90 ? (e.staffType === 'TEACHING' ? 'PROMOTION' : 'SALARY_REVISION') : score >= 75 ? 'TRAINING' : 'NONE',
        status: 'COMPLETED', submittedAt: new Date('2026-04-10'), completedAt: new Date('2026-05-20'),
      },
    })
    // active cycle: goals + review in a mix of statuses
    const goalCount = rint(2, 5)
    const chosen: typeof goalsTitles = []
    for (let i = 0; i < goalCount; i++) {
      const g = goalsTitles[(i + Math.random() * goalsTitles.length | 0) % goalsTitles.length]
      if (!chosen.find((c) => c.title === g.title)) chosen.push(g)
    }
    const completionAvg = () => Math.round(chosen.reduce((s, g, i) => s + rint(10, 95 - i * 5), 0) / chosen.length)
    for (const g of chosen) {
      await prisma.goal.create({
        data: {
          cycleId: activeCycle.id, employeeId: empId, title: g.title,
          description: 'Agreed at the start of the appraisal cycle with the reporting officer.',
          category: g.category as never,
          weightPercent: Math.round(100 / goalCount),
          agreedWithEmployee: true,
          status: pick(['AGREED', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED'] as const),
          completionPercent: rint(10, 100),
          evidenceNote: Math.random() < 0.3 ? 'Evidence documents attached in the document vault.' : null,
          setByUserId: (await prisma.user.findFirst({ where: { employee: { department: { hod: { employeeCode: e.code } } } } }))?.id ?? null,
        },
      })
    }
    const reviewer = e.deptCode ? hodCode[e.deptCode] : undefined
    const reviewerUser = reviewer ? await prisma.user.findUnique({ where: { email: reviewer.officialEmail } }) : null
    const roll = Math.random()
    await prisma.performanceReview.create({
      data: {
        cycleId: activeCycle.id, employeeId: empId,
        reviewerUserId: reviewerUser?.id ?? null,
        status: roll < 0.55 ? 'PENDING' : roll < 0.8 ? 'SELF_SUBMITTED' : 'UNDER_REVIEW',
        selfAssessmentScore: roll >= 0.55 ? rint(55, 92) : null,
        selfComments: roll >= 0.55 ? 'Goals progressing as planned; milestones on track for the current cycle.' : null,
        submittedAt: roll >= 0.55 ? addDays(NOW, -rint(1, 30)) : null,
      },
    })
  }
  return { activeCycle }
}

// ───────────────────────────────────────────────────────── documents
async function seedDocuments(emps: EmpSeed[], idByCode: Record<string, string>) {
  const categories = await Promise.all([
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'AADHAAR', name: 'Aadhaar Card', requiresExpiry: false, sensitivity: 'CONFIDENTIAL', description: 'Unique ID proof' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'PAN', name: 'PAN Card', requiresExpiry: false, sensitivity: 'CONFIDENTIAL', description: 'Tax account number' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'DEGREE', name: 'Highest Degree Certificate', requiresExpiry: false, sensitivity: 'INTERNAL', description: 'Qualification proof' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'EXPERIENCE', name: 'Experience Letter', requiresExpiry: false, sensitivity: 'INTERNAL', description: 'Prior employment proof' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'APPOINTMENT', name: 'Appointment Letter', requiresExpiry: false, sensitivity: 'CONFIDENTIAL', description: 'University appointment record' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'PHOTO', name: 'Passport Photograph', requiresExpiry: false, sensitivity: 'PUBLIC', description: 'Official photo' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'PUBLICATION', name: 'Publication Proof', requiresExpiry: false, sensitivity: 'INTERNAL', description: 'Paper/paper acceptance evidence' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'CONTRACT', name: 'Employment Contract', requiresExpiry: true, sensitivity: 'CONFIDENTIAL', description: 'Contractual engagement terms' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'MEDICAL', name: 'Medical Fitness Certificate', requiresExpiry: true, sensitivity: 'INTERNAL', description: 'Fitness at joining and renewals' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'NOC', name: 'No Objection Certificate', requiresExpiry: false, sensitivity: 'CONFIDENTIAL', description: 'NOC from previous employer' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'PHD_REG', name: 'PhD Registration Proof', requiresExpiry: false, sensitivity: 'INTERNAL', description: 'Research registration (teaching staff)' } }),
    prisma.documentCategory.create({ data: { institutionId: INST.id, key: 'RESIGNATION', name: 'Resignation Letter', requiresExpiry: false, sensitivity: 'CONFIDENTIAL', description: 'Separation documentation' } }),
  ])
  const catByKey: Record<string, string> = {}
  for (const c of categories) catByKey[c.key] = c.id

  const hrUser = await prisma.user.findUnique({ where: { email: `hr.admin@${EMAIL_DOMAIN}` } })
  const expiringDocs: { employeeId: string; title: string; expiresOn: Date; user: { email: string } | null }[] = []
  for (const e of emps) {
    const empId = idByCode[e.code]
    const docs: { categoryId: string; title: string; fileName: string; issuedOn: Date | null; expiresOn: Date | null; accessLevel: string; isVerified: boolean }[] = []
    docs.push({ categoryId: catByKey.AADHAAR, title: 'Aadhaar Card', fileName: `aadhaar-${e.code}.pdf`, issuedOn: null, expiresOn: null, accessLevel: 'CONFIDENTIAL', isVerified: true })
    docs.push({ categoryId: catByKey.DEGREE, title: 'Highest Degree Certificate', fileName: `degree-${e.code}.pdf`, issuedOn: addDays(e.joining, -rint(300, 2000)), expiresOn: null, accessLevel: 'INTERNAL', isVerified: true })
    docs.push({ categoryId: catByKey.APPOINTMENT, title: 'Appointment Letter', fileName: `appointment-${e.code}.pdf`, issuedOn: e.joining, expiresOn: null, accessLevel: 'CONFIDENTIAL', isVerified: true })
    if (Math.random() < 0.6) docs.push({ categoryId: catByKey.PAN, title: 'PAN Card', fileName: `pan-${e.code}.pdf`, issuedOn: null, expiresOn: null, accessLevel: 'CONFIDENTIAL', isVerified: Math.random() < 0.8 })
    if (e.employmentType === 'CONTRACT' || e.employmentType === 'VISITING') {
      const exp = addDays(NOW, rint(15, 50))
      docs.push({ categoryId: catByKey.CONTRACT, title: 'Employment Contract', fileName: `contract-${e.code}.pdf`, issuedOn: e.joining, expiresOn: exp, accessLevel: 'CONFIDENTIAL', isVerified: true })
      const user = await prisma.user.findUnique({ where: { employeeId: empId } })
      expiringDocs.push({ employeeId: empId, title: 'Employment Contract', expiresOn: exp, user: user ? { email: user.email } : null })
    }
    if (Math.random() < 0.12) {
      const exp = addDays(NOW, rint(5, 25))
      docs.push({ categoryId: catByKey.MEDICAL, title: 'Medical Fitness Certificate', fileName: `medical-${e.code}.pdf`, issuedOn: e.joining, expiresOn: exp, accessLevel: 'INTERNAL', isVerified: true })
      const user = await prisma.user.findUnique({ where: { employeeId: empId } })
      expiringDocs.push({ employeeId: empId, title: 'Medical Fitness Certificate', expiresOn: exp, user: user ? { email: user.email } : null })
    }
    for (const d of docs) {
      await prisma.employeeDocument.create({
        data: {
          employeeId: empId, categoryId: d.categoryId, title: d.title, fileName: d.fileName,
          fileExt: 'pdf', sizeKb: rint(80, 2400), version: 1,
          issuedBy: d.title.includes('Appointment') || d.title.includes('Contract') ? 'Registrar, Aryavratt University' : null,
          issuedOn: d.issuedOn, expiresOn: d.expiresOn,
          isVerified: d.isVerified, verifiedByUserId: d.isVerified ? hrUser?.id ?? null : null,
          uploadedByUserId: hrUser?.id ?? null,
          accessLevel: d.accessLevel as never,
          contentHash: Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
        } as never,
      })
    }
  }
  return { expiringDocs, catByKey }
}

// ───────────────────────────────────────────────────────── notifications & audit & settings
async function seedNotificationsAuditSettings(emps: EmpSeed[], expiringDocs: { employeeId: string; title: string; expiresOn: Date; user: { email: string } | null }[], hrEmails: string[], principalEmail: string) {
  const notifications: { userId: string; kind: string; title: string; body: string; link: string; severity: string; isRead: boolean; createdAt: Date }[] = []
  const allUsers = await prisma.user.findMany({ select: { id: true, employeeId: true } })
  const userByEmp = new Map(allUsers.map((u) => [u.employeeId, u]))

  // payslip ready (last month payroll) for everyone
  for (const u of allUsers) {
    notifications.push({
      userId: u.id, kind: 'PAYSLIP_READY',
      title: `Payslip for ${new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - 1, 1)).toLocaleString('en-IN', { month: 'long' })} is ready`,
      body: 'Your salary statement has been released. Net pay details are available in the payroll module.',
      link: '#/payroll', severity: 'SUCCESS', isRead: Math.random() < 0.7, createdAt: new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), 2)),
    })
  }
  // announcement for everyone
  for (const u of allUsers) {
    notifications.push({
      userId: u.id, kind: 'ANNOUNCEMENT',
      title: 'Founders Day celebration — 24 November',
      body: 'All departments are requested to join the flag-hoisting at 9:00 AM at the Main Campus lawns.',
      link: '#/notifications', severity: 'INFO', isRead: Math.random() < 0.4, createdAt: addDays(NOW, -2),
    })
  }
  // document expiry
  for (const d of expiringDocs) {
    const u = userByEmp.get(d.employeeId)
    if (u) {
      notifications.push({
        userId: u.id, kind: 'DOCUMENT_EXPIRY',
        title: `Document expiring soon: ${d.title}`,
        body: `Expires on ${isoDate(d.expiresOn)}. Please arrange renewal and upload the updated copy.`,
        link: '#/documents', severity: 'WARNING', isRead: false, createdAt: addDays(NOW, -1),
      })
    }
  }
  // approval pending for HODs / HR / principal (for the currently pending items)
  const pendingReqs = await prisma.approvalRequest.findMany({ where: { status: 'PENDING' }, include: { workflow: { include: { stages: true } } }, take: 80 })
  for (const r of pendingReqs) {
    const stage = r.workflow.stages.find((s) => s.seq === r.currentStageSeq)
    if (!stage?.approverRoleId) continue
    const holders = await prisma.userRole.findMany({ where: { roleId: stage.approverRoleId }, select: { userId: true } })
    for (const h of holders.slice(0, 6)) {
      notifications.push({
        userId: h.userId, kind: 'APPROVAL_PENDING',
        title: 'Request awaiting your approval',
        body: `${r.initiatorName} — ${r.title}. Reference ${r.referenceNo}.`,
        link: '#/approvals', severity: 'WARNING', isRead: false, createdAt: r.submittedAt,
      })
    }
  }
  for (let i = 0; i < notifications.length; i += 1000) {
    await prisma.notification.createMany({ data: notifications.slice(i, i + 1000) as never })
  }

  // audit log
  const audit: { userId: string | null; actorEmail: string; action: string; module: string; entityType: string | null; entityId: string | null; summary: string; createdAt: Date }[] = []
  const sample = emps.filter(() => Math.random() < 0.5)
  for (const e of sample) {
    const u = await prisma.user.findUnique({ where: { email: e.officialEmail } })
    if (!u) continue
    audit.push({ userId: u.id, actorEmail: e.officialEmail, action: 'LOGIN', module: 'auth', entityType: null, entityId: null, summary: `${e.firstName} ${e.lastName} signed in`, createdAt: addDays(NOW, -rint(0, 30)) })
    if (Math.random() < 0.4) audit.push({ userId: u.id, actorEmail: e.officialEmail, action: 'LEAVE_APPLIED', module: 'leave', entityType: 'LeaveApplication', entityId: null, summary: `${e.firstName} ${e.lastName} applied for leave`, createdAt: addDays(NOW, -rint(0, 40)) })
    if (Math.random() < 0.2) audit.push({ userId: u.id, actorEmail: e.officialEmail, action: 'DOCUMENT_UPLOADED', module: 'documents', entityType: 'EmployeeDocument', entityId: null, summary: 'Document uploaded to vault', createdAt: addDays(NOW, -rint(0, 50)) })
  }
  const hrU = await prisma.user.findUnique({ where: { email: hrEmails[0] } })
  for (let i = 0; i < 25; i++) {
    audit.push({ userId: hrU?.id ?? null, actorEmail: hrEmails[0], action: pick(['EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'ROLE_ASSIGNED', 'ATTENDANCE_MANUAL_ENTRY', 'LEAVE_DECIDED']), module: pick(['employees', 'settings', 'attendance', 'leave']), entityType: null, entityId: null, summary: 'HR operational event (demonstration)', createdAt: addDays(NOW, -rint(0, 60)) })
  }
  const principalU = await prisma.user.findUnique({ where: { email: principalEmail } })
  for (let i = 0; i < 12; i++) {
    audit.push({ userId: principalU?.id ?? null, actorEmail: principalEmail, action: pick(['APPROVAL_APPROVED', 'PAYROLL_DISBURSED', 'APPRAISAL_REVIEWED']), module: pick(['approvals', 'payroll', 'appraisal']), entityType: null, entityId: null, summary: 'Institutional decision recorded', createdAt: addDays(NOW, -rint(0, 60)) })
  }
  for (let i = 0; i < audit.length; i += 500) {
    await prisma.auditLog.createMany({ data: audit.slice(i, i + 500) as never })
  }

  // institution settings
  const settings: { key: string; value: unknown; category: string }[] = [
    { key: 'attendance.work_hours', value: { start: '09:30', end: '17:30', grace: 10 }, category: 'ATTENDANCE' },
    { key: 'attendance.late_threshold', value: { minutes: 20, markHalfDayAfter: 120 }, category: 'ATTENDANCE' },
    { key: 'payroll.da_percent', value: 42, category: 'PAYROLL' },
    { key: 'payroll.hra_percent', value: 20, category: 'PAYROLL' },
    { key: 'payroll.epf_employee_percent', value: 12, category: 'PAYROLL' },
    { key: 'payroll.pt_threshold', value: 25000, category: 'PAYROLL' },
    { key: 'payroll.disclaimer', value: 'Demonstration slabs only — verify statutory rates before production use.', category: 'PAYROLL' },
    { key: 'leave.max_pending_days', value: 45, category: 'LEAVE' },
    { key: 'notifications.document_expiry_days', value: 30, category: 'NOTIFICATIONS' },
    { key: 'security.session_days', value: 7, category: 'SECURITY' },
    { key: 'security.password_policy', value: 'Min 8 characters; demo accounts use Demo@2026', category: 'SECURITY' },
    { key: 'general.email_domain', value: EMAIL_DOMAIN, category: 'GENERAL' },
    { key: 'general.financial_year', value: 'April–March', category: 'GENERAL' },
  ]
  for (const s of settings) {
    await prisma.institutionSetting.create({ data: { institutionId: INST.id, key: s.key, value: s.value as never, category: s.category } })
  }
}

// ───────────────────────────────────────────────────────── separations
async function seedSeparations(emps: EmpSeed[], idByCode: Record<string, string>, protectedCodes: Set<string>) {
  // Never separate demo accounts or employees holding key roles (HODs,
  // admin leads, principal) — their logins must keep working and their
  // departments must keep their HOD link intact.
  const victims = emps
    .filter((e) => !e.isDemo && !protectedCodes.has(e.code))
    .filter((e) => e.employmentType === 'PERMANENT' && e.joining.getTime() < addDays(NOW, -365 * 3).getTime())
    .filter(() => Math.random() < 0.03)
  for (const e of victims.slice(0, 10)) {
    const empId = idByCode[e.code]
    const sepDate = addDays(NOW, -rint(10, 200))
    await prisma.employee.update({
      where: { id: empId },
      data: { status: 'SEPARATED', separationDate: sepDate, separationType: pick(['RESIGNATION', 'RETIREMENT', 'CONTRACT_ENDED'] as const), separationRemarks: 'Completed documentation and clearance formalities.' },
    })
    await prisma.serviceEvent.create({
      data: { employeeId: empId, eventType: 'SEPARATION', effectiveDate: sepDate, details: 'Separation processed with full and final settlement', referenceNo: `SEP-${e.code}` },
    })
    await prisma.user.updateMany({ where: { employeeId: empId }, data: { status: 'SUSPENDED' } })
  }
}

// ───────────────────────────────────────────────────────── main
async function main() {
  const t0 = Date.now()
  console.log(' wiping existing data…')
  await wipe()

  console.log(' structure: institution, campuses, faculties, departments, designations…')
  const ctx = await seedStructure()
  console.log(' rbac: permissions, roles…')
  const roleIds = await seedRbac()

  console.log(' employees, users, qualifications, experience…')
  const { emps, idByCode } = await seedEmployees(ctx)
  console.log(`   → ${emps.length} employees`)

  console.log(' role assignments & HODs…')
  const { hodCode, hodAdminCode } = await seedRoleAssignments(ctx, roleIds, emps, idByCode)

  console.log(' salary structures…')
  await seedSalaries(ctx, emps)

  console.log(' approval workflows…')
  await seedWorkflows(roleIds)

  console.log(' leave types, balances, applications…')
  const { approvalTrail } = await seedLeave(emps, idByCode, { ...hodCode, ...hodAdminCode })
  const hrEmails = [`hr.admin@${EMAIL_DOMAIN}`]
  const principalEmail = `principal@${EMAIL_DOMAIN}`
  console.log(' approval trails…')
  await seedApprovalTrails(approvalTrail, roleIds, { ...hodCode, ...hodAdminCode }, hrEmails, principalEmail)

  console.log(' attendance & punches…')
  const approved = await prisma.leaveApplication.findMany({ where: { status: 'APPROVED' }, select: { employeeId: true, fromDate: true, toDate: true } })
  await seedAttendance(emps, idByCode, approved)
  const attendanceCount = await prisma.attendanceRecord.count()
  console.log(`   → ${attendanceCount} attendance records`)

  console.log(' payroll history…')
  await seedPayroll(emps, idByCode, `accounts@${EMAIL_DOMAIN}`, principalEmail, hrEmails)

  console.log(' recruitment pipeline…')
  await seedRecruitment(ctx, `hr.admin@${EMAIL_DOMAIN}`, principalEmail, { ...hodCode, ...hodAdminCode })

  console.log(' academics: terms, subjects, workload, research…')
  await seedAcademics(ctx, emps, idByCode)

  console.log(' appraisal cycles…')
  await seedAppraisal(emps, idByCode, { ...hodCode, ...hodAdminCode })

  console.log(' documents…')
  const { expiringDocs } = await seedDocuments(emps, idByCode)

  console.log(' separations…')
  await seedSeparations(emps, idByCode, new Set([...Object.values(hodCode).map((h) => h.code), ...Object.values(hodAdminCode).map((h) => h.code)]))

  console.log(' notifications, audit, settings…')
  await seedNotificationsAuditSettings(emps, expiringDocs, hrEmails, principalEmail)

  const counts = {
    employees: await prisma.employee.count(),
    users: await prisma.user.count(),
    departments: await prisma.department.count(),
    designations: await prisma.designation.count(),
    attendance: await prisma.attendanceRecord.count(),
    punches: await prisma.punchRecord.count(),
    leaveApplications: await prisma.leaveApplication.count(),
    approvalRequests: await prisma.approvalRequest.count(),
    payslips: await prisma.payslip.count(),
    payrollRuns: await prisma.payrollRun.count(),
    candidates: await prisma.candidate.count(),
    applications: await prisma.application.count(),
    interviews: await prisma.interview.count(),
    subjects: await prisma.subjectAllocation.count(),
    researchOutputs: await prisma.researchOutput.count(),
    goals: await prisma.goal.count(),
    reviews: await prisma.performanceReview.count(),
    documents: await prisma.employeeDocument.count(),
    notifications: await prisma.notification.count(),
    auditLogs: await prisma.auditLog.count(),
  }
  console.log('──────────────────────────────────────────')
  console.log('SEED COMPLETE', counts)
  console.log(`elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  console.log(`Demo password for every account: ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
