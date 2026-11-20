#!/usr/bin/env python3
"""Chapters 1-2: Project Overview (verified implementation), Team Distribution."""
from engine import (h1_block, h2_block, h3_block, para, bullets, stat_row,
                    callout, make_table, embed_image, qa_block, quote_block,
                    Spacer, Paragraph, S)


def chapter1(story):
    story += h1_block(
        "1. Project Overview — Verified Implementation",
        para("This guide is written from the <b>actual, running application</b>, not from the original requirements "
             "document. Every module, number and workflow described here was exercised against the live system: the "
             "full API surface was smoke-tested with every demo role, eighty-two automated role switches were executed "
             "and verified, and the screens were driven in a real browser from login through dashboard to role "
             "switching. The presentation team should therefore speak about these features with confidence — they are "
             "implemented and demonstrable, and this guide marks the few items that are not. The application is a "
             "College Human Resource Management System (HRMS) for a fictional institution, Aryavratt University, "
             "seeded with a complete demonstration dataset covering three campuses and every staff category."))
    story += stat_row([
        ("323", "employees on roll"),
        ("35 / 3", "departments / campuses"),
        ("44", "database models"),
        ("68", "permission keys, 8 roles"),
    ])

    story += h2_block("1.1 What the system actually is", para(
        "The College HRMS is a full-stack web application that unifies the complete institutional HR lifecycle — "
        "employees, attendance, leave, approvals, payroll, recruitment, faculty workload, appraisals, documents and "
        "reporting — behind one role-aware interface. It is built as two cooperating services: a Next.js single-page "
        "frontend and a NestJS REST API over PostgreSQL. The demonstration institution includes teaching faculty, "
        "non-teaching administrative staff and technical or support staff, so the system is exercised across all three "
        "staff categories rather than only faculty. Every user can hold multiple roles and switch between them live, "
        "and each active role reshapes what the dashboard, navigation and data show."))
    story += para(
        "The user interface uses a custom design system called <b>SPATIAL GLASS</b>: glass-styled cards, glowing KPI "
        "tiles, chart frames and a two-theme model — an \u201cobsidian\u201d dark theme and a \u201cgraphite light\u201d theme — that the "
        "user can toggle in place. Practical conveniences verified in the browser include a command palette (Ctrl+K) "
        "for jumping between modules, a notifications drawer (Alt+T), and one-click demo accounts on the login screen "
        "that let a presenter enter any of nine seeded roles without typing credentials.")

    story += h2_block("1.2 Architecture and technology", para(
        "The system follows a strict three-tier architecture, and the strongest technical story of the presentation is "
        "precisely how the three tiers cooperate: the browser application never touches the database; it calls the "
        "NestJS API with JSON over HTTPS carrying a signed session cookie; the API authenticates the request, checks "
        "the caller\u2019s permissions against the RBAC registry, runs the domain logic (including the configurable "
        "approval engine), and reads or writes PostgreSQL through Prisma ORM using parameterised queries. The diagram "
        "below is the reference picture Member 2 should draw on the whiteboard if asked."))
    story.append(embed_image("/home/z/my-project/scripts/pdf-build/diagram.png",
                             max_width=None, max_height=445))
    story.append(Paragraph("Figure 1 — Verified three-tier architecture of the College HRMS build.", S["caption"]))
    story.append(Spacer(1, 8))

    story += make_table(
        ["Layer", "Verified technology", "What it does in this build"],
        [
            ["Frontend", "Next.js 16 (App Router, standalone build), React 19, TypeScript, Tailwind CSS 4, shadcn/ui on Radix primitives, TanStack Query, Zustand, next-themes, Recharts",
             "Single-page UI with hash routing, role-aware navigation, dual themes, charts, command palette; served as a production bundle"],
            ["Backend", "NestJS 11 (modular controllers and services), class-validator DTOs, JWT-signed session cookies, bcryptjs password hashing, cookie-parser",
             "REST API under /api/v1 with a global auth guard and RBAC checks, per-module services, configurable approval engine, audit logging"],
            ["Database", "PostgreSQL 17 via Prisma 6 ORM (44 models), embedded-postgres for the demo",
             "Relational schema from Institution down to Payslip lines, with indexes, constraints and a persistent audit log"],
        ],
        [0.12, 0.40, 0.48],
        caption="Table 1 — Verified technology stack, confirmed from the deployed build and its source.",
    )

    story += h2_block("1.3 The twelve modules that exist and work", para(
        "Twelve functional modules plus three supporting areas make up the product surface. The table below is the "
        "honest inventory the team should present: it lists what each module actually does in the running build, "
        "verified through the API suite and the browser. Nothing in this table is planned or mocked; each row was "
        "exercised during verification. Use it as the single authoritative answer whenever a judge asks \u201cwhat exactly "
        "is implemented?\u201d"))
    story += make_table(
        ["Module", "What it does (verified)", "Status"],
        [
            ["Dashboard", "Role-specific KPI tiles and charts: institution-wide workforce mix and monthly joinings for super admins; department strength, 30-day attendance and weekly load for HODs; personal view for faculty", "Implemented"],
            ["Employees", "Directory with search, employee profiles with service history, institutional form data, separation processing", "Implemented"],
            ["Departments", "Institutional structure: campuses, faculties, 35 departments, designations, HOD assignment", "Implemented"],
            ["Attendance", "Overview and monthly statistics, day register, punch records, correction requests and decisions, self-attendance", "Implemented"],
            ["Leave", "Leave types, balances, applications with status trail, leave calendar; approvals flow through the workflow engine", "Implemented"],
            ["Approvals", "Configurable multi-stage workflows: stages with ANY / ALL / QUORUM strategies, SLA hours, role or named-user approvers; queue, history, per-request timeline with comments, return and resubmit", "Implemented"],
            ["Payroll", "Salary structures with components, statutory Indian calculations (EPF, TDS), attendance-linked pro-rating with loss-of-pay, payroll runs, payslips with line items, revision history, cost trend", "Implemented"],
            ["Recruitment", "Vacancies with salary ranges, candidates with sources, application pipeline stages, interview rounds with mode and recommendation, offers and onboarding", "Implemented"],
            ["Faculty Workload", "Academic terms, subject allocations, 16-hour weekly contact norm, overload flags, department load distribution, academic contributions (research, mentoring, training, administrative duties)", "Implemented"],
            ["Appraisal", "Appraisal cycles, goals with categories and status, self-assessment, reviewer and HOD review, grades and recommendations", "Implemented"],
            ["Documents", "Categories, confidentiality sensitivity levels, upload, verification, and expiry tracking with an expiring-documents view", "Implemented"],
            ["Reports", "Headcount, attendance, leave and payroll reports with dashboard charts and CSV export of the employee directory", "Implemented"],
            ["Settings (support)", "User accounts, roles and permission assignments, approval workflow configuration, audit log, active sessions, institution settings", "Implemented"],
            ["Notifications and Profile (support)", "Notification feed with activity and severity, personal profile page", "Implemented"],
        ],
        [0.16, 0.72, 0.12],
        caption="Table 2 — Verified module inventory of the running build (12 modules plus 3 supporting areas).",
        center_cols=[2],
    )

    story += h2_block("1.4 What is deliberately not implemented", para(
        "Being equally clear about the boundary is what makes the implemented claims believable. The build does "
        "<b>not</b> integrate with biometric or RFID attendance devices — attendance is captured through punch records "
        "and manual marking in the API, and corrections flow through an approval step. It has no mobile application, "
        "no email or SMS delivery channel (notifications are in-app only), no statutory e-filing integration with "
        "EPFO or TRACES, and reports export to CSV rather than PDF. These are roadmap items, and Members 2 and 4 "
        "should present them as deliberate, honestly-acknowledged scope decisions rather than discovered gaps. The "
        "system also currently holds one seeded demonstration institution, although the schema itself is multi-campus "
        "and multi-institution by design."))
    story += callout(
        "An end-to-end verification pass on the live build: every API endpoint across all 12 modules returned correct "
        "results for every demo role; RBAC negatives behaved as designed (faculty received 403 on user administration "
        "and payroll runs); unauthenticated calls were rejected with 401; and all 82 automated role switches updated "
        "the active role, the dashboard data and the charts correctly.",
        title="Verification performed for this guide")


def chapter2(story):
    story += h1_block(
        "2. Team Responsibility Distribution",
        para("A four-member panel presentation works only when each speaker owns one distinct mission, the missions "
             "chain into a single narrative, and no speaker repeats what another has already said. The split below "
             "follows that principle: Member 1 frames the problem for non-technical judges, Member 2 (the primary "
             "developer) carries the technical and functional core and the live demonstration, Member 3 positions the "
             "project against four established Indian education platforms, and Member 4 converts features into "
             "institutional value and closes. The developer\u2019s section is intentionally the longest — that is where "
             "the marks for depth are earned — while every other member still holds a meaningful, self-contained "
             "segment."))
    story += make_table(
        ["Member", "Mission in the presentation", "Time", "Slides", "Depth"],
        [
            ["Member 1", "Introduction and problem statement: what an HRMS is, why colleges need one, the pain of manual HR, our vision, team introduction", "3 min", "4", "Non-technical, engaging"],
            ["Member 2", "The system itself: architecture, how the three tiers cooperate, the twelve modules, security and RBAC, the live demonstration", "8 min", "10", "Technical and functional core (developer)"],
            ["Member 3", "Competitor comparison with MasterSoft, Fedena, Cyborg ERP and RF-Campus; our differentiation and the honest \u201cwhy choose us\u201d argument", "5 min", "5", "Evidence-based analysis"],
            ["Member 4", "Practical impact for administrators, HR and staff; limitations and future scope; conclusion and thank-you", "4 min", "4", "Value and closing"],
        ],
        [0.11, 0.55, 0.08, 0.08, 0.18],
        caption="Table 3 — Speaking responsibilities, durations and slide allocation across the four members (20 minutes, 23 slides).",
        center_cols=[2, 3],
    )
    story += h2_block("2.1 Handoff discipline", para(
        "Each member ends with a scripted transition sentence that names the next speaker and their mission; the full "
        "set is in Chapter 7 with the timing plan. Between rehearsals, keep two ground rules. First, the \u201cno repeat\u201d "
        "rule: if a point has been made by an earlier speaker, later speakers reference it in one clause (\u201cas our "
        "developer showed in the payroll demo\u2026\u201d) instead of re-explaining it. Second, the \u201cquestion relay\u201d rule: "
        "when judges ask a question that belongs to another member\u2019s domain, that member answers — the team looks "
        "coordinated rather than competitive, and every member stays within their prepared material."))
    story += h2_block("2.2 Balance check", para(
        "The distribution deliberately satisfies the balance requirement while giving the developer the technical "
        "depth the panel expects: Member 1 carries the critical job of earning judge attention in the first three "
        "minutes with zero jargon; Member 2 carries eight minutes of technical substance plus the demo, which is the "
        "core differentiating content of a development project; Member 3 carries the market awareness that most student "
        "teams lack entirely; and Member 4 carries the argument that ties everything to institutional value, which is "
        "what non-technical judges remember. Nobody is a passenger: removing any one of the four sections would leave "
        "a visible hole in the narrative arc from problem to solution to value."))
