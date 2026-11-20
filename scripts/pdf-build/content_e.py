#!/usr/bin/env python3
"""Chapters 11-13: Suggestions, Judges' Question Bank, References."""
from engine import (h1_block, h2_block, h3_block, para, bullets, stat_row,
                    callout, make_table, qa_block, quote_block, Paragraph, S,
                    Spacer)


def chapter11(story):
    story += h1_block(
        "11. Suggestions to Make Our Project Stand Out Before the Judges",
        para("This chapter is deliberately separate from the confirmed functionality of the preceding chapters: "
             "these are preparation and performance recommendations, not system features. They are ordered by "
             "impact against effort, and split into essentials the team should treat as mandatory before the "
             "presentation day and optional enhancements for teams with rehearsal time to spare. Applying the "
             "six essentials takes an evening and changes how the panel perceives the entire project."))
    story += h2_block("11.1 Essential preparations (high impact, low effort)", None)
    story += bullets([
        "<b>Rehearse the demonstration twice on the live preview link</b>, and keep a full screen recording as "
        "the fallback. A recorded truth beats a live failure; a rehearsed live run beats both.",
        "<b>Warm the browser before the presentation.</b> Open the link, log in, and walk the five core screens "
        "once so the bundle and cache are hot — the first cold load is the moment most likely to look slow in "
        "front of judges.",
        "<b>Lead the demo with the role switch.</b> Logging in as one user and switching to HOD — dashboard "
        "remounting to department scope — is the single most memorable proof that the RBAC story is real. It "
        "also directly demonstrates the 82-switch verification without saying the word.",
        "<b>Show the workflow configuration screen, not just the queue.</b> The moment judges see approval "
        "stages, strategies and SLA hours as editable data, the \u201cconfigurable\u201d claim stops being a word and "
        "becomes an observation.",
        "<b>Carry one verification appendix slide.</b> A single slide reading \u201cwhat we tested: every API "
        "endpoint per role, 403 and 401 behaviour, 82 of 82 role switches\u201d converts the whole presentation "
        "from a product pitch into an engineering report.",
        "<b>Script the 403 moment.</b> In a private window, attempt a forbidden route as faculty and say the "
        "one sentence: \u201cthe server rejected it before any data left.\u201d Security claims are usually asserted; "
        "yours will be observed.",
    ])
    story += h2_block("11.2 What to demonstrate live, in priority order", None)
    story += bullets([
        "Role switching with dashboard remounting (identity and permission proof)",
        "Approval queue plus workflow configuration (the deepest technical differentiator)",
        "Payslip with EPF, TDS and loss-of-pay lines (statutory correctness)",
        "Workload norms and overload flags (academic specificity)",
        "One CSV export landing in the downloads folder (output the institution consumes)",
    ])
    story += h2_block("11.3 First impressions and memorability", para(
        "The strongest first-impression screens are, in order: the login page with its nine one-click role "
        "accounts (breadth in five seconds), the Super Admin dashboard with KPI tiles and both charts (numbers "
        "over claims), and the HOD dashboard after the switch (personalisation over genericity). What makes "
        "the interface memorable is the SPATIAL GLASS identity: the glass cards, the glowing KPI tiles, and "
        "above all the one-click dark-to-light toggle — perform it once; it is the moment judges mention to "
        "each other afterwards. Keep the command palette (Ctrl+K) as the closing flourish: \u201cthis is how a "
        "power user moves.\u201d"))
    story += h2_block("11.4 What to avoid saying", None)
    story += bullets([
        "Never claim unimplemented breadth — biometric devices, mobile apps, email or SMS, statutory "
        "e-filing, PDF exports. If asked, the answer is \u201croadmap item, deliberately out of scope for this "
        "build.\u201d",
        "Never say \u201cbetter than Fedena\u201d or name competitor weaknesses beyond the documented matrix; say "
        "\u201cdifferent goals — breadth versus configurability and ownership.\u201d",
        "Never improvise numbers. Use the real ones — 323 employees, 35 departments, 44 models, 68 permission "
        "keys, 82 of 82 switches — and only those.",
        "Never call the system \u201centerprise-ready\u201d or \u201cproduction-complete\u201d; say \u201cproduction-architected "
        "and pilot-ready,\u201d which is both true and precise.",
        "Never blame the toolchain for a hiccup mid-demo; keep narrating while you recover, and switch to the "
        "recording calmly if you cannot.",
    ])
    story += h2_block("11.5 Optional enhancements (if rehearsal time remains)", None)
    story += make_table(
        ["Suggestion", "Impact", "Effort", "Class"],
        [
            ["Seed one realistic approval chain live in front of judges (submit as faculty, approve as HOD)", "High", "Low", "Essential-adjacent"],
            ["Prepare a one-page printed handout per judge with the architecture diagram and the comparison matrix", "Medium", "Low", "Optional"],
            ["Rehearse one deep-dive question per chapter of this guide with a designated attacker", "High", "Medium", "Optional"],
            ["Pre-load the exact employee profile you will open, so the demo search is instant", "Medium", "Trivial", "Optional"],
            ["Prepare a 30-second answer for \u201cwhat would you build next\u201d that names the roadmap order and why", "Medium", "Low", "Optional"],
        ],
        [0.52, 0.12, 0.13, 0.23],
        caption="Table 13 — Prioritised suggestions by impact and effort.",
        center_cols=[1, 2, 3],
    )
    story += h2_block("11.6 What judges are most likely to ask", para(
        "From the structure of this project, five questions are near-certain: <i>which features are actually "
        "implemented</i> (answer with Chapter 1\u2019s inventory and the verification callout); <i>how do "
        "permissions actually work</i> (backend guard per request, 68 keys, verified 403s); <i>how is salary "
        "computed</i> (component data plus EPF, TDS and loss-of-pay rules); <i>why choose this over an "
        "established product</i> (ownership, configurability, cost — positioned honestly); and <i>what are the "
        "limitations</i> (biometric, mobile, channels, exports — leading the roadmap). Every one of them has a "
        "prepared answer in this guide; rehearse those five first and the question round becomes the "
        "strongest part of the presentation rather than the feared one."))


def chapter12(story):
    story += h1_block(
        "12. Judges' Question Bank",
        para("Thirteen categories of questions follow, one representative question with a model answer each, "
             "plus a final set of functionality-authenticity tests designed to probe whether the system is "
             "genuinely working. The answers are written so that <b>any of the four members</b> can deliver "
             "them credibly — short enough to memorise the shape, technically accurate enough to survive a "
             "follow-up, and grounded only in what the running build actually does."))
    story += h2_block("12.1 Project overview", None)
    story += qa_block(
        "Summarise your project in two sentences.",
        "A full-stack College HRMS that runs the complete institutional HR lifecycle — employees, attendance, "
        "leave, approvals, payroll, recruitment, workload, appraisal, documents and reporting — for teaching, "
        "non-teaching and technical staff across campuses. It is built as a Next.js web application over a "
        "NestJS API and PostgreSQL, with role-based access, a configurable approval engine and Indian statutory "
        "payroll, all verified end-to-end on a 323-employee demonstration dataset.")
    story += h2_block("12.2 Technical architecture", None)
    story += qa_block(
        "Describe your architecture and justify it.",
        "Three tiers: a Next.js single-page application, a NestJS REST API, and PostgreSQL through Prisma. The "
        "client renders and submits; every rule — permissions, salary computation, approval routing — lives in "
        "the API, so it cannot be bypassed from the browser; and the relational database enforces integrity "
        "across the 44 models, so payslips cannot exist without their run and actions cannot exist without "
        "their requests. Separation of concerns, one gatekeeper, one source of truth.")
    story += h2_block("12.3 Frontend and backend", None)
    story += qa_block(
        "Why two frameworks — Next.js and NestJS — instead of one full-stack framework?",
        "Because the frontend and the rule engine have different change cycles and different failure modes. The "
        "SPA optimises experience — instant navigation, themes, charts; the API optimises correctness and "
        "auditability — guards, validation, transactions. Keeping them separate lets either evolve without "
        "re-testing the other, and means the same API could later serve a mobile client unchanged.")
    story += h2_block("12.4 Database design", None)
    story += qa_block(
        "How is the database designed? Walk us through it.",
        "Forty-four relational models led by the institutional skeleton — institution, campuses, faculties, "
        "departments, designations — with employees joining it, and every domain hanging off employees: "
        "attendance and punches, leave types, balances and applications, salary structures, revisions, runs and "
        "payslip lines, workload and subject allocations, appraisal cycles, goals and reviews, documents with "
        "sensitivity levels, plus users, roles, permissions, sessions and a persistent audit log. Relationships "
        "are enforced by foreign keys, hot lookups carry indexes, and list queries are paginated at the "
        "database level.")
    story += h2_block("12.5 Authentication and security", None)
    story += qa_block(
        "How are passwords and sessions handled?",
        "Passwords are hashed with bcrypt before storage — salted and deliberately slow, so a database leak "
        "does not leak usable credentials. Login issues a signed session cookie; the API validates it on every "
        "request through a global guard, so there is no unauthenticated path to any domain endpoint. Unauthenticated calls "
        "return 401, forbidden ones 403 — both behaviours verified during preparation, not assumed.")
    story += h2_block("12.6 Role-based permissions", None)
    story += qa_block(
        "Explain your permission model concretely.",
        "Sixty-eight permission keys of the form module:action — read, create, decide, verify and so on — "
        "grouped into eight predefined roles plus custom ones, each scoped to the institution or to a "
        "department. The guard resolves the session\u2019s active role to its key set per request; a faculty "
        "session calling the payroll-run endpoint is refused with 403 before any data is read. Users holding "
        "several roles switch between them live, and every switch re-scopes what the dashboards show.")
    story += h2_block("12.7 Approval workflows", None)
    story += qa_block(
        "What makes your approval engine configurable rather than hard-coded?",
        "A workflow is data: an ordered set of stages, each naming a role or a specific user as approver, a "
        "decision strategy — ANY, ALL, or QUORUM with a minimum count — an optional SLA in hours, and a "
        "final-stage flag. Requests bind to the active workflow for their document type and walk the stages; "
        "every action is recorded with actor, comment and timestamp, and a rejection can return a request to "
        "its initiator for resubmission. Because the definition lives in the database, an administrator "
        "changes institutional policy without a developer in the room.")
    story += h2_block("12.8 Payroll calculations", None)
    story += qa_block(
        "How exactly does a payslip get computed?",
        "From three inputs, in order: the employee\u2019s salary structure, where every component is a row — "
        "BASIC, DA at a percentage of basic, HRA, conveyance, medical, each fixed or percent-of-basic; the "
        "statutory rules — EPF at 12% of basic with the wage ceiling applied, and monthly TDS computed after "
        "the standard deduction; and the month\u2019s attendance, which pro-rates pay for loss-of-pay days. The "
        "run writes payslips with per-line components, so any figure on the slip can be traced back to its "
        "rule and input.")
    story += h2_block("12.9 Competitor differences", None)
    story += qa_block(
        "What do established products like MasterSoft or Fedena offer that you do not, and vice versa?",
        "They offer documented breadth — biometric and RFID attendance, mobile apps, training and placement "
        "modules, fee and finance integration, support contracts. We offer documented depth and ownership — a "
        "configurable multi-stage approval engine with quorum strategies and SLAs, statutory Indian payroll, "
        "workload norms feeding appraisal, role-specific dashboards with live switching, and code and data "
        "that belong to the institution with zero licensing cost. Chapter 8\u2019s matrix carries the full "
        "evidence, cell by cell with sources.")
    story += h2_block("12.10 Scalability", None)
    story += qa_block(
        "Will this handle five thousand employees or ten institutions?",
        "The architecture scales before the code does: the API is stateless between requests, so instances "
        "multiply behind a load balancer; PostgreSQL carries the indexes on the hot paths; every list "
        "endpoint is paginated at the database level so response times stay flat as rows grow; and the "
        "institution–campus–department skeleton is already multi-campus in the demonstration data. The honest "
        "caveat is operational, not architectural: production scale brings real integration, backup and "
        "compliance work, which is precisely the roadmap.")
    story += h2_block("12.11 Data privacy", None)
    story += qa_block(
        "How do you protect sensitive employee data?",
        "In layers: access is scoped by role and department, so a HOD sees their department and an employee "
        "sees themselves; documents carry sensitivity levels, with confidential ones gated by an explicit "
        "permission; payslips and salary structures are readable only through read-self or payroll "
        "permissions; every read of consequence is auditable; and the whole system is self-hosted, so "
        "employee data never leaves infrastructure the institution controls.")
    story += h2_block("12.12 Real-world implementation", None)
    story += qa_block(
        "What would deploying this in a real college actually involve?",
        "Provision a server and PostgreSQL, deploy the API and the web bundle, migrate employee master data "
        "into the existing schema, configure the institution\u2019s departments, leave types, salary components "
        "and approval workflows through the settings screens, create user accounts with their roles, and "
        "train each role on its own dashboard. The configuration work — which is the historically painful "
        "part — is data entry in our system rather than code changes, and that is the point of the "
        "configurable design.")
    story += h2_block("12.13 Limitations and future scope", None)
    story += qa_block(
        "What are your system\u2019s limitations, honestly?",
        "No biometric or RFID device integration — attendance arrives through punch records and manual "
        "marking; no mobile application; notifications are in-app only, with no email or SMS; exports are CSV "
        "rather than PDF; and the demonstration holds one seeded institution though the schema is "
        "multi-campus. Each of these leads the roadmap in priority order, and we prefer to name them before "
        "you ask.")
    story += h2_block("12.14 Functionality-authenticity tests", para(
        "These are the questions that separate a working build from a slideware project. The panel asks one "
        "of them precisely because it is hard to fake; every answer below is something the team can do live "
        "from the running system."))
    story += qa_block(
        "Switch to the HOD role right now and show me a department-scoped view.",
        "Live: the role menu on any screen switches the active role; the header re-labels, navigation "
        "rescopes and the dashboard remounts to department strength, 30-day attendance and weekly load. We "
        "automated this exact flow 82 times across all seeded multi-role users with zero failures during "
        "verification.")
    story += qa_block(
        "Call an endpoint you are not permitted to call, and show me what happens.",
        "Live, in a private window as a faculty session: the payroll-runs or user-administration call returns "
        "403 Forbidden from the guard before any data leaves the server — and an unauthenticated call returns "
        "401. The perimeter is in the API, not the interface.")
    story += qa_block(
        "Where is the approval workflow defined? Show me changing it.",
        "Settings, Workflows: the stages, approver type, strategy — ANY, ALL or QUORUM — minimum approvals and "
        "SLA hours are editable fields on records stored in the database. Changing a chain is editing data; "
        "no deployment, no developer.")
    story += qa_block(
        "Show me the raw API response behind this dashboard.",
        "Live: open the network panel and re-request the dashboard — the JSON envelope returns the role, the "
        "KPI values and the chart series the tiles render from. What you see on screen is the same payload "
        "the browser fetched.")
    story += qa_block(
        "Add a leave type or an approval stage right now.",
        "Live: leave categories are managed from the leave settings, and workflow stages from the workflow "
        "builder — both are plain create forms writing rows the engine immediately respects. That is what "
        "\u201cpolicy as data\u201d means in practice.")


def chapter13(story):
    story += h1_block(
        "13. References and Sources",
        para("Competitor capability claims in Chapter 8 come from the four official product pages below, "
             "fetched and read during the preparation of this guide; nothing else was relied upon for the "
             "matrix, and any capability not stated on these pages is labelled \u201cnot verified\u201d accordingly. "
             "Internal system claims — module behaviour, permission counts, payroll rules, verification "
             "results — come from the running build itself, inspected through its source, its API and its "
             "database, and exercised through the automated smoke and role-switch suites described in "
             "Chapter 1."))
    refs = [
        "MasterSoft ERP Solutions. (2026). <i>HR Management System (HRMS)</i>. Retrieved November 2026, from "
        "https://www.mastersoft.ai/product/hr-management-system.aspx",
        "Foradian Technologies. (2026). <i>Fedena — School HR Management System: Payroll Management</i>. "
        "Retrieved November 2026, from https://fedena.com/feature-tour/school-HR-management-system",
        "Foradian Technologies. (2026). <i>Fedena — Employee Leave Management</i>. Retrieved November 2026, "
        "from https://support.fedena.com/support/solutions/articles/202351-employee-leave-management-in-fedena",
        "Cyborg ERP. (2026). <i>Cyborg ERP — The Operating System for Educational Institutions</i>. Retrieved "
        "November 2026, from https://www.cyborgerp.com",
        "IITMS. (2026). <i>RF-Campus ERP Modules</i>. Retrieved November 2026, from "
        "https://www.iitms.co.in/products/rfcampus",
    ]
    for i, r in enumerate(refs, 1):
        story.append(Paragraph("[%d] %s" % (i, r), S["ref"]))
    story.append(Spacer(1, 6))
    from engine import CondPageBreak
    story.append(CondPageBreak(300))
    story += h2_block("13.1 Verification basis for our own claims", None)
    story += bullets([
        "<b>Module behaviour and counts:</b> read from the deployed build\u2019s source and PostgreSQL schema (44 Prisma "
        "models; 68 permission keys across 8 predefined roles; 323 employees; 35 departments; 3 campuses; 332 "
        "user accounts in the seeded dataset).",
        "<b>Endpoint behaviour:</b> an automated smoke suite covering every module\u2019s endpoints for every demo role, "
        "including the negative cases — faculty blocked with 403 from user administration and payroll runs; "
        "unauthenticated requests rejected with 401; wrong password rejected with 401.",
        "<b>Role switching:</b> an automated multi-role suite executing 82 switches across all seeded multi-role "
        "users, verifying after each switch that the active role, the dashboard role and the chart data "
        "reflect the new context — zero failures.",
        "<b>Interface behaviour:</b> driven manually in a headless browser during preparation — login, dashboard "
        "charts, in-UI role switch to a HOD role with dashboard remount, dark-to-light theme toggle, "
        "command palette and notifications drawer.",
        "<b>Payroll rules:</b> read from the payroll service implementation — EPF at 12% of basic with the wage "
        "ceiling, monthly TDS after the standard deduction, attendance-driven pro-rating — and cross-checked "
        "against the payslip line data returned by the API.",
        "<b>Competitor documentation:</b> each of the four official product pages was fetched and read during "
        "preparation; the capability cells in Chapter 8 paraphrase only what those pages state, and every "
        "capability we could not verify is labelled as such rather than assumed.",
    ])
