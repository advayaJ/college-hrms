#!/bin/bash
# API smoke test: login with each demo role and hit the REAL backend endpoints
# (mirroring what the frontend modules actually call).
BASE="http://localhost:81/api/v1"
Q="XTransformPort=3001"
PASS="Demo@2026"
FAILED=0

url() { # url <path-with-optional-query>
  local p="$1"
  if [[ "$p" == *"?"* ]]; then echo "$BASE$p&$Q"; else echo "$BASE$p?$Q"; fi
}

login() {
  local email="$1" jar="/tmp/smoke-$2.jar"
  rm -f "$jar"
  curl -s -m 10 -c "$jar" -X POST "$BASE/auth/login?$Q" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$PASS\"}" > /tmp/smoke-login.json
  if grep -q '"ok":true' /tmp/smoke-login.json; then
    echo "OK   login $email"
  else
    echo "LOGIN FAIL: $email -> $(head -c 300 /tmp/smoke-login.json)"; FAILED=1; return 1
  fi
}

check() {
  local jar="$1" path="$2" name="$3"
  local code=$(curl -s -m 15 -b "$jar" -o /tmp/smoke-out.json -w "%{http_code}" "$(url "$path")")
  if [ "$code" = "200" ] && grep -q '"ok":true' /tmp/smoke-out.json; then
    echo "OK   [$code] $name"
  else
    echo "FAIL [$code] $name -> $(head -c 200 /tmp/smoke-out.json)"; FAILED=1
  fi
}

echo "== superadmin =="
login superadmin@aryavratt.edu.in sa || exit 1
check /tmp/smoke-sa.jar "/auth/me" "auth/me"
check /tmp/smoke-sa.jar "/dashboard" "dashboard"
check /tmp/smoke-sa.jar "/employees?page=1&limit=5" "employees list"
check /tmp/smoke-sa.jar "/employees/form-data" "employee form data"
check /tmp/smoke-sa.jar "/settings/users" "settings users"
check /tmp/smoke-sa.jar "/settings/roles" "settings roles"
check /tmp/smoke-sa.jar "/settings/audit?limit=5" "audit log"
check /tmp/smoke-sa.jar "/settings/workflows" "workflows"
check /tmp/smoke-sa.jar "/notifications" "notifications"
check /tmp/smoke-sa.jar "/notifications/activity" "notification activity"
check /tmp/smoke-sa.jar "/approvals/pending" "approvals pending"
check /tmp/smoke-sa.jar "/approvals/history" "approvals history"
check /tmp/smoke-sa.jar "/recruitment/vacancies" "vacancies"
check /tmp/smoke-sa.jar "/recruitment/pipeline" "recruitment pipeline"
check /tmp/smoke-sa.jar "/recruitment/candidates" "candidates"
check /tmp/smoke-sa.jar "/payroll/runs" "payroll runs"
check /tmp/smoke-sa.jar "/payroll/structures" "payroll structures"
check /tmp/smoke-sa.jar "/payroll/cost-trend" "payroll cost trend"
check /tmp/smoke-sa.jar "/reports/headcount" "headcount report"
check /tmp/smoke-sa.jar "/reports/attendance" "attendance report"
check /tmp/smoke-sa.jar "/reports/leave" "leave report"
check /tmp/smoke-sa.jar "/reports/payroll" "payroll report"
check /tmp/smoke-sa.jar "/documents/categories" "doc categories"
check /tmp/smoke-sa.jar "/documents?limit=5" "documents list"
check /tmp/smoke-sa.jar "/documents/expiring" "expiring docs"
check /tmp/smoke-sa.jar "/workload/terms" "workload terms"
check /tmp/smoke-sa.jar "/workload/overview" "workload overview"
check /tmp/smoke-sa.jar "/appraisal/summary" "appraisal summary"
check /tmp/smoke-sa.jar "/appraisal/cycles" "appraisal cycles"
check /tmp/smoke-sa.jar "/attendance/overview" "attendance overview"
check /tmp/smoke-sa.jar "/attendance/monthly" "attendance monthly"
check /tmp/smoke-sa.jar "/leave/applications?limit=5" "leave applications"
check /tmp/smoke-sa.jar "/leave/types" "leave types"
check /tmp/smoke-sa.jar "/leave/calendar" "leave calendar"
check /tmp/smoke-sa.jar "/departments" "departments"
check /tmp/smoke-sa.jar "/auth/demo-accounts" "demo accounts"
check /tmp/smoke-sa.jar "/auth/sessions" "auth sessions"

echo "== hr.admin =="
login hr.admin@aryavratt.edu.in hr || exit 1
check /tmp/smoke-hr.jar "/dashboard" "dashboard"
check /tmp/smoke-hr.jar "/employees?page=1&limit=5" "employees"
check /tmp/smoke-hr.jar "/leave/applications?limit=5" "leave applications"
check /tmp/smoke-hr.jar "/attendance/overview" "attendance overview"
check /tmp/smoke-hr.jar "/payroll/runs" "payroll runs"

echo "== hod.cse (multi-role) =="
login hod.cse@aryavratt.edu.in hod || exit 1
check /tmp/smoke-hod.jar "/dashboard" "dashboard"
check /tmp/smoke-hod.jar "/appraisal/team" "appraisal team"
check /tmp/smoke-hod.jar "/attendance/day/2026-11-19" "attendance day register"

echo "== faculty =="
login faculty@aryavratt.edu.in fac || exit 1
check /tmp/smoke-fac.jar "/dashboard" "dashboard"
check /tmp/smoke-fac.jar "/leave/balances" "leave balances"
check /tmp/smoke-fac.jar "/appraisal/self" "appraisal self (goals)"
check /tmp/smoke-fac.jar "/payroll/my-payslips" "my payslips"
check /tmp/smoke-fac.jar "/payroll/my-structure" "my structure"
check /tmp/smoke-fac.jar "/attendance/self" "attendance self"
check /tmp/smoke-fac.jar "/workload/self" "workload self"
check /tmp/smoke-fac.jar "/notifications" "notifications"

echo "== accounts =="
login accounts@aryavratt.edu.in acc || exit 1
check /tmp/smoke-acc.jar "/dashboard" "dashboard"
check /tmp/smoke-acc.jar "/payroll/runs" "payroll runs"

echo "== RBAC negative tests =="
CODE=$(curl -s -m 10 -b /tmp/smoke-fac.jar -o /tmp/smoke-out.json -w "%{http_code}" "$(url "/settings/users")")
[ "$CODE" = "403" ] && echo "OK   [403] RBAC blocks faculty from /settings/users" || { echo "FAIL [$CODE] RBAC negative test"; FAILED=1; }
CODE=$(curl -s -m 10 -b /tmp/smoke-fac.jar -o /tmp/smoke-out.json -w "%{http_code}" "$(url "/payroll/runs")")
[ "$CODE" = "403" ] && echo "OK   [403] RBAC blocks faculty from /payroll/runs" || { echo "FAIL [$CODE] RBAC payroll negative"; FAILED=1; }

echo "== unauthenticated (expect 401) =="
CODE=$(curl -s -m 10 -o /tmp/smoke-out.json -w "%{http_code}" "$(url "/employees")")
[ "$CODE" = "401" ] && echo "OK   [401] unauthenticated request rejected" || { echo "FAIL [$CODE] unauthenticated test"; FAILED=1; }

echo "== wrong password (expect 401) =="
CODE=$(curl -s -m 10 -o /tmp/smoke-out.json -w "%{http_code}" -X POST "$BASE/auth/login?$Q" -H 'Content-Type: application/json' -d '{"email":"faculty@aryavratt.edu.in","password":"WrongPass"}')
[ "$CODE" = "401" ] && echo "OK   [401] wrong password rejected" || { echo "FAIL [$CODE] wrong-password test"; FAILED=1; }

echo ""
if [ "$FAILED" = "0" ]; then echo "ALL SMOKE TESTS PASSED"; else echo "SMOKE TESTS FAILED"; exit 1; fi
