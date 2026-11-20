#!/usr/bin/env python3
"""Chapters 3-4: Member 1 (Introduction) and Member 2 (Technical & Functional Core)."""
from engine import (h1_block, h2_block, h3_block, para, bullets, stat_row,
                    callout, make_table, qa_block, quote_block, Spacer)


def chapter3(story):
    story += h1_block(
        "3. Member 1 — Introduction and Problem Statement",
        para("Member 1 owns the first three minutes, and their job is precise: make judges who may never have "
             "touched an HR system care about the problem before anyone mentions technology. Every point below is "
             "framed in plain language; the only place a technical word appears is the single sentence that names "
             "the solution. Keep the energy conversational, and keep the total under three minutes so the demo "
             "inside Member 2\u2019s segment has room."))
    story += bullets([
        "<b>Project title and one-line introduction.</b> \u201cOur project is a College Human Resource Management "
        "System — a single web platform that runs the entire HR lifecycle of an institution, from joining to "
        "separation, for teaching and non-teaching staff alike.\u201d",
        "<b>What an HRMS is.</b> One sentence: a system that stores every employee record in one place and "
        "automates the processes around it — attendance, leave, salary, recruitment, appraisal and reporting.",
        "<b>Why colleges specifically need one.</b> Colleges are unusual employers: multiple campuses, dozens of "
        "departments, teaching and non-teaching staff with different rules, approval-heavy culture, and mandatory "
        "documentation for accreditation. Generic HR software is built for companies, not for this structure.",
        "<b>The manual status quo and its pain.</b> Attendance in registers, leave requests on paper chits, salary "
        "calculated in spreadsheets, approvals chased corridor-by-corridor, and records scattered across filing "
        "cabinets — all slow, error-prone and unauditable.",
        "<b>Vision and objectives.</b> One source of truth for every employee; processes that move digitally with "
        "proper approvals; information visible to the right role instead of the right office; and decision data "
        "for management instead of guesswork.",
        "<b>One-paragraph solution overview.</b> \u201cWe built a web application where every role — principal, HR, "
        "HOD, accountant, faculty, staff — signs in and sees exactly their world: their approvals to clear, their "
        "team\u2019s attendance, their salary, their workload. Behind one clean interface sit twelve modules that "
        "cover the complete HR lifecycle, and the processes between them are configurable.\u201d",
        "<b>Team introduction and handoff.</b> Introduce all four members by name and role in one line each, then "
        "hand over with the scripted transition sentence.",
    ])
    story += h2_block("3.1 Suggested opening line", None)
    story += quote_block(
        "\u201cGood morning. Think of the HR office of any college you know — one register for attendance, a "
        "notebook of leave applications, a salary spreadsheet that one person alone understands, and approvals "
        "that walk the corridors for days. Our project removes all of that paper, and I will show you how in the "
        "next twenty minutes.\u201d")
    story += h2_block("3.2 Questions Member 1 should be ready for", None)
    story += qa_block(
        "Why did your team pick an HRMS rather than another college system such as an admission or exam module?",
        "Because HR touches every single employee every single day — attendance, leave and salary are daily "
        "transactions for all 323 people in our demo institution — so the automation benefit is immediate and "
        "measurable, and it is the area where manual processes hurt most.")
    story += qa_block(
        "Is this not just a database with forms?",
        "It becomes a database with forms the moment processes are missing. Ours carries the processes: leave "
        "routes through approval stages, salary is computed from attendance, workload feeds appraisal — that is "
        "the difference between storing data and running an institution.")
    story += qa_block(
        "Who is this presentation for — developers or administrators?",
        "Our team splits the answer in two: my colleague will explain the engineering, and the other two members "
        "will explain what it means for a principal and an HR office. Both audiences are covered by design.")


def chapter4(story):
    story += h1_block(
        "4. Member 2 — Technical and Functional Core (Primary Developer)",
        para("This is the heart of the presentation: eight minutes in which the developer explains how the system "
             "is engineered, what the twelve modules do, how the three tiers cooperate, and — crucially — proves "
             "it live. The structure below paces the segment: two and a half minutes of architecture and stack, "
             "three minutes across the modules with depth on the four strongest ones, and a two-and-a-half-minute "
             "guided demonstration. The material is technically detailed because the panel will probe it; every "
             "figure in it comes from the running build."))
    story += h2_block("4.1 How the frontend, backend and database work together", para(
        "Open with the request lifecycle, told as one sentence before any component name: <i>a user action in the "
        "browser becomes an HTTPS call carrying a signed session cookie; the API verifies the session, asks the "
        "permission registry whether this role may perform this action, executes the domain logic — including the "
        "approval engine when a request changes state — and reads or writes PostgreSQL through Prisma with "
        "parameterised queries; the JSON response updates the screen through a client cache that refreshes "
        "only the affected queries.</i> Only then name the pieces: Next.js 16 with React 19 on the client, "
        "state split between TanStack Query for server data and Zustand for session state; NestJS 11 as the API; "
        "PostgreSQL 17 behind Prisma. Close with the two design decisions worth defending: the API is the single "
        "gatekeeper of every rule (the client never computes salaries or permissions), and the database is purely "
        "relational so referential integrity — employee to department, payslip to run, action to request — is "
        "enforced by constraints, not by application code."))
    story += make_table(
        ["Concern", "Decision in the build", "One-line justification for judges"],
        [
            ["Client-server split", "All business rules in the NestJS services; the SPA only renders and submits", "Rules live behind one gatekeeper, so they cannot be bypassed from the browser"],
            ["Auth model", "bcrypt password hashes plus JWT-signed session cookies, validated by a global guard", "Passwords are never stored; every request is re-authenticated"],
            ["Authorization", "68 permission keys across 8 predefined roles, scoped per institution or department", "Least privilege per module action, verified with 403 tests"],
            ["Data access", "Prisma ORM with parameterised queries over PostgreSQL 17", "No hand-written SQL to inject; integrity enforced by 44 related models"],
            ["Process logic", "Configurable approval engine driven by workflow definitions stored in the database", "Institutional policy is data, not code — changeable without redeployment"],
            ["State handling", "TanStack Query cache on the client with role-keyed module remounting", "Every role switch re-initialises views — no stale permissions on screen"],
            ["Auditability", "Persistent audit log plus per-request approval timeline with every action and comment", "Any decision can be reconstructed later — essential for institutions"],
        ],
        [0.16, 0.46, 0.38],
        caption="Table 4 — Technical decisions the developer should be able to defend in one line each.",
    )
    story += h2_block("4.2 The twelve modules, prioritised for speaking time", para(
        "Do not walk twelve modules screen-by-screen; judges lose interest by module four. Instead present the "
        "inventory as one slide (Table 2 of Chapter 1 is the source), then spend depth on the four modules that "
        "show engineering substance: approvals, payroll, workload and appraisal. The rest get one fluent sentence "
        "each, grouped by the employee lifecycle: joining (recruitment), daily operations (attendance, leave), "
        "monthly cycle (payroll), academic life (workload, appraisal), records (employees, departments, "
        "documents) and oversight (reports, settings, notifications)."))
    story += make_table(
        ["Module", "The one highlight to say out loud"],
        [
            ["Approvals", "Workflows are configuration data: stages, ANY/ALL/QUORUM strategies, SLA hours, role or named approvers — the institution reshapes process without touching code"],
            ["Payroll", "Statutory Indian salary engine: EPF at 12% of basic with the wage ceiling applied, monthly TDS after the standard deduction, and loss-of-pay pro-rating driven by attendance data"],
            ["Faculty Workload", "Subject allocations checked against the 16-hour weekly contact norm with overload flags, plus academic contributions — research, mentoring, training, administrative duties — feeding the appraisal story"],
            ["Appraisal", "Full cycle flow: goals set, self-assessment submitted, HOD review with grade and recommendation, cycle finalisation — the chain a college actually runs"],
            ["Recruitment", "Pipeline stages from application through shortlist, interview scheduling with mode and recommendation, offer and onboarding — the front door of the employee lifecycle"],
            ["Attendance", "Punch records plus a correction workflow that itself goes through approval, so even fixes are governed"],
            ["Leave", "Balances per type, applications routed through the configurable approval chain, and a calendar view for planning"],
            ["Employees", "Service-event history and separation processing — the master record every other module joins to"],
            ["Departments", "Campus, faculty, department and designation hierarchy with HOD assignment — the institutional skeleton"],
            ["Documents", "Sensitivity levels including confidential, verification workflow, and expiry tracking with an expiring view"],
            ["Reports", "Headcount, attendance, leave and payroll analytics with CSV export for further analysis"],
            ["Settings", "Where roles, permissions and the approval workflows themselves are administered — the control plane"],
        ],
        [0.18, 0.82],
        caption="Table 5 — Module speaking priorities: one line per module, depth reserved for the top four.",
    )
    story += h2_block("4.3 Suggested live demonstration sequence", para(
        "The demonstration is the strongest evidence the team owns, so script it. The sequence below runs the "
        "system\u2019s most convincing working features in a deliberate arc: identity and permission first (the "
        "login screen with nine one-click demo accounts), then the depth modules, then the proof that the "
        "perimeter is real (a 403), and finally the wow layer — live role switching that reshapes the dashboard. "
        "Rehearse it end-to-end on the preview link; keep the browser warm and the login page preloaded before "
        "the presentation starts."))
    story += make_table(
        ["#", "Where", "What to show and say", "Why it lands"],
        [
            ["1", "Login screen", "Nine one-click demo accounts across every role — \u201cthe same product, nine different experiences\u201d; log in as Super Admin", "Shows breadth in five seconds without clicking anything"],
            ["2", "Dashboard (Super Admin)", "KPI tiles (323 employees, 332 user accounts, 35 departments) and the two charts — workforce mix and monthly joinings", "Numbers and charts from a real database, not mockups"],
            ["3", "Employees", "Search the directory, open one profile with service history; mention separation handling", "Proves a real master record behind every other module"],
            ["4", "Approvals", "Open the pending queue, then one request\u2019s stage timeline with strategies and SLA; then Settings to show the workflow builder", "The configurable engine — the deepest technical differentiator"],
            ["5", "Payroll", "Open a payslip: walk BASIC, DA, HRA, EPF, TDS lines and explain the attendance-driven pro-rating on the payslip\u2019s LOP days", "Statutory detail that judges can check against known Indian rules"],
            ["6", "Faculty Workload", "Department load distribution against the 16-hour norm with overload flags", "Academic specificity no generic HRMS has"],
            ["7", "Reports", "Headcount or attendance report, then the CSV export download", "Ends the functional tour with output the institution would consume"],
            ["8", "RBAC proof", "Open a private browser window as a faculty account and attempt the payroll or user-administration route — the 403 is the point; say \u201cthe guard rejects it before any data leaves the server\u201d", "Turns a security claim into an observed fact"],
            ["9", "Role switch", "Back as Super Admin, switch role to HOD of a department; the header, navigation and dashboard remount to department-scoped KPIs", "The single most memorable moment — one user, multiple hats"],
            ["10", "Close", "Return to the dashboard in dark theme, toggle to light in one click, and hand off to Member 3", "Calm, controlled finish with the design system on display"],
        ],
        [0.05, 0.15, 0.53, 0.27],
        caption="Table 6 — Ten-step demonstration script (about two and a half minutes when rehearsed).",
        center_cols=[0],
    )
    story += h2_block("4.4 Questions Member 2 should expect", None)
    story += qa_block(
        "Where exactly does authorization happen — frontend or backend?",
        "In the backend guard, on every request. The navigation also hides what a role cannot use, but that is "
        "cosmetic convenience: the API independently checks the session\u2019s active role against the 68-key "
        "permission registry and returns 403 before data is touched. We verified this by calling forbidden "
        "endpoints as a faculty session and observing the rejections.")
    story += qa_block(
        "How does a leave request actually become approved?",
        "Submission creates an approval request bound to the active workflow for that document type. The engine "
        "walks stage by stage; each stage resolves per its strategy — ANY of the listed approvers, ALL of them, or "
        "a QUORUM of at least N approvals — records every action with actor and comment, honours SLA hours as "
        "metadata, and on final approval writes the leave state. A rejection can return the request to the "
        "initiator, who edits and resubmits along the same chain.")
    story += qa_block(
        "Show me the salary computation is real, not hard-coded numbers.",
        "The structure is data: every component — BASIC, DA at 42% of basic, HRA, conveyance, medical — is a row "
        "with a calc type of fixed or percent-of-basic, so changing policy is editing data. Statutory parts are "
        "engine rules: EPF is 12% of basic capped at the wage ceiling, TDS uses the slab computation after the "
        "standard deduction, and the run pro-rates pay using attendance counts, deducting loss-of-pay days. The "
        "payslip you saw is generated line by line from those inputs.")
    story += qa_block(
        "What happens if two people approve in parallel at a QUORUM stage?",
        "Both approvals are recorded as separate actions with timestamps; the stage is satisfied the moment the "
        "count reaches the minimum, and the request advances. Because every action is persisted, a later audit "
        "can see exactly who approved, when, and in which order — nothing is lost to concurrency.")
    story += qa_block(
        "Why PostgreSQL and an ORM instead of something simpler?",
        "Because HR data is relational by nature — employees join departments, payslips join runs, actions join "
        "requests — and referential integrity belongs in the database, not in application code. The ORM issues "
        "parameterised queries, which removes hand-written SQL injection risk, and gives typed models that the "
        "NestJS services compile against.")
