#!/usr/bin/env python3
"""Chapters 8-10: Competitor Comparison Matrix, Differentiation, Practical Impact."""
from engine import (h1_block, h2_block, h3_block, para, bullets, stat_row,
                    callout, make_table, qa_block, quote_block)


def chapter8(story):
    story += h1_block(
        "8. Competitor Comparison Matrix",
        para("This matrix is the evidence base Member 3 presents and the document judges will scrutinise most "
             "closely. Method first: our column reflects only features <b>verified in the running build</b>; each "
             "competitor column reflects only what its <b>official product documentation states</b>, fetched during "
             "the preparation of this guide (sources in Chapter 13). The four labels are used strictly — "
             "<i>Available</i> means the capability is clearly documented and implemented; <i>Partially "
             "available</i> means a related capability is documented but the specific depth is not; <i>Not "
             "verified</i> means the documentation is silent and we refuse to guess; <i>Not applicable</i> means "
             "the product\u2019s documented positioning does not cover the area. No cell claims a competitor lacks "
             "anything we could not verify."))
    story += make_table(
        ["Capability", "Our HRMS (verified)", "MasterSoft HRMS", "Fedena", "Cyborg ERP", "RF-Campus (IITMS)"],
        [
            ["Employee management", "Available", "Available", "Available", "Available", "Available"],
            ["Attendance", "Available (punch records, corrections; no devices)", "Available (biometric, RFID, mobile)", "Available (calculation; devices not stated)", "Available (attendance suite; employee biometrics not stated)", "Partially available (student side documented; staff side not stated)"],
            ["Leave management", "Available", "Available", "Available", "Available", "Available"],
            ["Payroll", "Available (EPF, TDS, LOP pro-rating)", "Available (automated salary and tax)", "Available (LOP via LOPD / NDW)", "Available", "Available"],
            ["Faculty workload and academic contributions", "Available (16h norm, overload, research, mentoring)", "Not verified", "Not applicable (K-12 positioning)", "Available (TimeTable Forge load balancing; PBAS)", "Not verified (KPI tracking documented)"],
            ["Recruitment", "Available (pipeline to onboarding)", "Available (online recruitment)", "Not verified", "Available", "Available (faculty recruitment)"],
            ["Performance appraisal", "Available (cycles, goals, review)", "Available (KPI-based)", "Not verified", "Available (PBAS)", "Available (KPI generation)"],
            ["Approval workflows", "Available (multi-stage, ANY/ALL/QUORUM, SLA)", "Partially available (workflow automation claimed)", "Partially available (payslip approval privileges)", "Available (file routing)", "Partially available (automation claimed)"],
            ["Role-based dashboards", "Available (per-role KPIs and charts)", "Available (user, admin, management)", "Not verified", "Available (role dashboards incl. Principal, HR, Faculty)", "Partially available (BI dashboards; roles not enumerated)"],
            ["Reporting and analytics", "Available (4 domains, CSV export)", "Available (MIS reports)", "Partially available (leave reports documented)", "Available (AI dashboards, reports)", "Available (BI dashboards)"],
            ["UI/UX quality and themes", "Available (dual-theme SPATIAL GLASS)", "Not verified (not assessable from documentation)", "Not verified", "Not verified", "Not verified"],
            ["Configurability and institutional flexibility", "Available (workflows, leave types, salary components, roles)", "Partially available (customisable policies claimed)", "Partially available (payroll setup, privileges)", "Available (Control Center RBAC)", "Available (complete customisation claimed)"],
        ],
        [0.235, 0.15, 0.155, 0.15, 0.155, 0.155],
        caption="Table 8 — Capability comparison. Labels: Available, Partially available, Not verified, Not applicable. Competitor columns reflect official documentation only.",
        font_size=8,
    )
    story += h2_block("8.1 Evidence notes per row", para(
        "These notes are the defence file for the matrix: each row\u2019s reasoning, with what the official page "
        "actually said. Present two or three of them verbally; keep the rest ready for questions, and never "
        "defend a cell without its note."))
    story += make_table(
        ["Capability", "Basis for the labels above"],
        [
            ["Employee management", "All five platforms document centralised employee or staff records — MasterSoft (employee record repository), Fedena (employee data, bulk import), Cyborg (HRMS), RF-Campus (faculty profile management). Ours: directory, profiles with service events, separation processing, all API-verified."],
            ["Attendance", "MasterSoft explicitly documents biometric, RFID and mobile attendance. Fedena documents attendance calculation; devices are not stated on the fetched pages. Cyborg documents attendance in its academic suite; employee biometrics are not stated on the page fetched. RF-Campus documents attendance under its student system; staff attendance is not stated — hence partially available. Ours: punch records, day register, monthly statistics and a correction workflow — but no device integration, stated openly."],
            ["Leave management", "Documented by all four (MasterSoft configurable leave types; Fedena leave management with balance reports; Cyborg LeavePro; RF-Campus leave management under its HRMS) and implemented in ours with types, balances, applications, calendar and approval routing."],
            ["Payroll", "MasterSoft documents automated salary and tax deduction with payslips; Fedena documents payroll setup with loss-of-pay integration by LOPD or NDW; Cyborg and RF-Campus document payroll systems. Ours implements Indian statutory rules end-to-end: EPF at 12% of basic with the wage ceiling, monthly TDS after the standard deduction, attendance-driven pro-rating and payslip lines — verified by API inspection."],
            ["Faculty workload", "MasterSoft\u2019s fetched pages make no workload claim — not verified. Fedena positions itself for schools; university-style faculty workload norms are outside its documented scope — not applicable. Cyborg documents TimeTable Forge (\u201callocate classes, detect clashes and balance teaching loads\u201d) and PBAS — available. RF-Campus documents KPI-based faculty performance tracking but not contact-hour workload — not verified. Ours: subject allocations, 16-hour weekly norm, overload flags and academic contributions (research, mentoring, training, administrative duties)."],
            ["Recruitment", "MasterSoft documents online recruitment with posting, screening and interview scheduling plus onboarding; Cyborg documents a recruitment system; RF-Campus documents faculty recruitment. Fedena\u2019s HR feature tour does not mention recruitment — not verified. Ours: vacancies with salary ranges, candidate sourcing, pipeline stages, interview rounds, offers and onboarding."],
            ["Performance appraisal", "MasterSoft documents KPI-based performance tracking (teaching effectiveness, research contributions); Cyborg\u2019s PBAS is a dedicated performance-based appraisal system; RF-Campus documents automatic KPI generation and performance tracking. Fedena\u2019s fetched pages are silent — not verified. Ours: cycles, goals, self-assessment, HOD review with grades, finalisation."],
            ["Approval workflows", "The sharpest differentiator. Cyborg documents file management that raises, routes and approves files — available. MasterSoft claims \u201cworkflow automation\u201d in a feature list without describing stages or strategies — partially available. Fedena documents approval privileges specifically for payslips — partially available. RF-Campus describes automation broadly — partially available. Ours exposes multi-stage workflows with ANY, ALL and QUORUM strategies, minimum approvals, SLA hours, role or named-user approvers, return and resubmit — all administrator-configurable at runtime."],
            ["Role-based dashboards", "MasterSoft documents user, admin and management dashboards; Cyborg enumerates role dashboards from Director to Faculty; RF-Campus documents BI dashboards without enumerating roles — partially available. Fedena is silent — not verified. Ours renders role-specific KPI sets and charts, and remounts them on live role switching."],
            ["Reporting and analytics", "MasterSoft documents MIS reports across HR metrics; Cyborg documents AI dashboards and report generation; RF-Campus documents BI dashboards. Fedena documents leave balance reports only — partially available. Ours: headcount, attendance, leave and payroll reports with charts plus CSV export."],
            ["UI/UX quality and themes", "Deliberately the most conservative row: interface quality cannot be judged from marketing pages, so every competitor is marked not verified rather than guessed. Our column is verified by use: the SPATIAL GLASS design system with obsidian dark and graphite light themes toggled live in the browser."],
            ["Configurability", "Cyborg\u2019s Control Center documents an RBAC framework and the site advertises broad customisation; RF-Campus states clients receive \u201cthe freedom to completely customise\u201d. MasterSoft and Fedena document specific customisable policies (leave policies; payroll setups and privileges) without a general configurability claim — partially available. Ours: approval workflows, leave types, salary components, roles and permissions and institution settings are all runtime-editable data."],
        ],
        [0.22, 0.78],
        caption="Table 9 — Per-row evidence notes, quoting or paraphrasing the official documentation only.",
    )
    story += h2_block("8.2 The competitors in one paragraph each", None)
    story += make_table(
        ["Platform", "What its official documentation presents", "Source"],
        [
            ["MasterSoft HRMS", "A widely deployed Indian education ERP whose HRMS pages document centralised HR, payroll with automated tax deduction, configurable leave policies, online recruitment with onboarding, biometric/RFID/mobile attendance, KPI-based performance tracking, MIS reporting, a service-book module and self-service portals with role-based access.", "mastersoft.ai — HR Management System product page"],
            ["Fedena", "A school management platform (K-12 positioning) whose HR feature tour documents employee data with bulk import, leave management with balance reports, payroll with earnings and deductions variations and loss-of-pay integration (LOPD or NDW), and payslip generation with approval privileges.", "fedena.com — school HR management system feature tour"],
            ["Cyborg ERP", "An education ERP presenting Cyborg Workforce (HRMS, recruitment, leave, payroll, appraisal, loan and advance), LeavePro, the PBAS performance-based appraisal system, TimeTable Forge for teaching-load balancing, Control Center RBAC, role dashboards from Director to Faculty, file routing for approvals, and web, mobile and cloud delivery.", "cyborgerp.com — product site"],
            ["RF-Campus (IITMS)", "An e-governance ERP for higher education documenting the student lifecycle plus a faculty management system with faculty recruitment, automatic KPI generation and performance tracking, an ESTABLISHMENT HRMS with payroll, leave and service book, accounts, and a strong customisation promise with BI dashboards.", "iitms.co.in — RF-Campus product page"],
        ],
        [0.14, 0.62, 0.24],
        caption="Table 10 — Competitor profiles as their own documentation presents them; URLs in Chapter 13.",
    )
    story += h2_block("8.3 What they have that we do not — said out loud", para(
        "Read this paragraph in front of the judges before anyone asks: the established platforms document "
        "biometric and RFID attendance, mobile applications, email and SMS communication, training and placement "
        "modules, loan and advance processing, benefits management, and deep integrations with fees, finance and "
        "library systems — none of which our build claims. Our scope was deliberately the HR core done deeply: "
        "the twelve modules, the approval engine, statutory payroll and role-aware experience. Stating their "
        "breadth first is not weakness; it is what makes every positive cell in our column credible, and it "
        "frames the roadmap in Chapter 9 as ambition rather than apology."))


def chapter9(story):
    story += h1_block(
        "9. Project Differentiation",
        para("The user-facing question of this chapter is the one every panel eventually asks: what is actually "
             "different here? The discipline of the answer is a three-way sort — genuine differentiators, "
             "well-implemented industry features, and improvement opportunities — because claiming uniqueness "
             "for common features is the fastest way to lose a judge\u2019s trust. The assessment below is honest "
             "by design: several candidate differentiators land in the common-feature bucket, and two land in "
             "the improvement bucket."))
    story += make_table(
        ["Candidate differentiator", "Honest classification", "Reasoning"],
        [
            ["Configurable approval hierarchy", "Genuine differentiator (depth)", "Multi-stage workflows with ANY, ALL and QUORUM strategies, minimum approvals, SLA hours, role or named approvers, and return-and-resubmit — editable at runtime. Competitor documentation describes workflows generically (MasterSoft, RF-Campus), narrowly (Fedena payslip privileges) or as file routing (Cyborg); none documents this depth of configurable logic."],
            ["SPATIAL GLASS dual-theme interface", "Genuine differentiator (experience)", "A custom design system with obsidian dark and graphite light themes, glass cards, glowing KPI tiles, command palette and notifications drawer — verified live. Competitor interface quality is not verifiable from documentation, and legacy-enterprise aesthetics are the norm in this market; we claim experience, not capability, superiority."],
            ["Live multi-role switching with remounting", "Genuine differentiator (workflow)", "One user holding several roles switches in place; the header, navigation and dashboard remount scoped to the new role — 82 automated switches verified zero failures. Enterprise norms are usually one account per role or full logout and re-login."],
            ["Faculty workload and academic contributions", "Strong but matched", "Our 16-hour norm, overload flags and contributions feed (research, mentoring, training, duties) is deep — but Cyborg documents TimeTable Forge load balancing and PBAS, and RF-Campus documents KPI-based faculty tracking. Present as academic depth, not uniqueness."],
            ["Role-specific dashboards", "Common industry feature", "MasterSoft, Cyborg and RF-Campus all document role dashboards. Ours is well-implemented (role-keyed remount, per-role chart sets) but the capability itself is table stakes."],
            ["Unified lifecycle across staff categories", "Common industry feature", "Teaching, non-teaching and technical staff in one system is good engineering, but every education ERP makes the same claim."],
            ["Centralised information and reporting", "Common industry feature", "Single-source HR data with analytics is the definition of the category, not a differentiator within it."],
            ["Clear workflows and simplified navigation", "Improvement opportunity", "The current navigation is good and the command palette helps, but there is room to streamline deep screens; presenting humility here preempts criticism."],
            ["Multi-campus unification", "Improvement opportunity", "The schema is campus-first and the demo runs three campuses, but multi-institution tenancy is not yet exercised in data or screens; claim the structure, not the proof."],
        ],
        [0.24, 0.20, 0.56],
        caption="Table 11 — Differentiation assessment: three genuine differentiators, three common features, two honest opportunities.",
    )
    story += h2_block("9.1 Why Would a College Choose Our HRMS?", para(
        "Because it gives the institution something the licensed platforms structurally cannot: complete "
        "ownership. There is no per-student or per-employee licence, no vendor dependency for policy changes, and "
        "no data leaving the institution — the database, the API and the interface all run on infrastructure the "
        "college controls, which matters for employee privacy and for accreditation documentation. On top of "
        "ownership sit the practical arguments: the approval engine lets an administrator reshape institutional "
        "process without a change request; the statutory payroll engine already computes EPF, TDS and loss-of-pay "
        "the Indian way; the workload and appraisal modules speak the academic language of norms, contact hours "
        "and contributions; and the interface is modern enough that staff adoption needs a briefing, not a "
        "training programme."))
    story += para(
        "The realistic version of the argument — the one to actually deliver — is positioning, not conquest: a "
        "college that needs biometric attendance, mobile apps, fee and finance integration and a support "
        "contract on day one should buy an established ERP, and we say so plainly. A college that wants its HR "
        "core deeply configurable, owned and auditable at near-zero licensing cost has, in this build, a "
        "pilot-ready starting point that already runs its processes end-to-end. Judges respond to that "
        "sentence precisely because it concedes what should be conceded and claims only what the demonstration "
        "just proved.")
    story += callout(
        "Three genuine differentiators to defend under pressure: (1) the configurable approval engine — depth "
        "of process logic no fetched competitor page documents; (2) the SPATIAL GLASS dual-theme experience; "
        "(3) verified live multi-role switching. Everything else in our feature list is honest parity, plus a "
        "roadmap we acknowledge before we are asked.",
        title="The differentiation story in one callout")


def chapter10(story):
    story += h1_block(
        "10. Practical Impact and Benefits",
        para("Impact is easiest to believe when it is drawn as before-and-after in a specific office on a "
             "specific day of the month. The table below is the backbone of Member 4\u2019s segment and Chapter 6\u2019s "
             "speaking points: each row is a stakeholder the panel can picture, and each cell describes work "
             "they do today versus work the system absorbs. Nothing here exaggerates — the automation claims "
             "map exactly onto the implemented modules of Chapter 1."))
    story += make_table(
        ["Stakeholder", "Manual world (before)", "With the HRMS (after)"],
        [
            ["Principal / administrator", "Signs paper approvals that walk the corridors; waits on compiled monthly reports that are already out of date", "Approves from a queue with the full stage history attached; sees live institution-wide KPIs and charts on the dashboard"],
            ["HR office", "Maintains parallel employee files; chases attendance and leave corrections; reconstructs approval histories on request", "One master record with service events; corrections run as governed workflow requests; every approval is reconstructible from the timeline and audit log"],
            ["HOD", "Marks attendance on paper, arbitrates leave by phone call, argues staffing with anecdote", "Department-scoped dashboard with strength, 30-day attendance and weekly load; leave decisions in queue; overload flags as staffing evidence"],
            ["Faculty and staff", "Submits paper leave forms; visits the office for payslip copies; guesses own leave balance", "Self-service: apply and track leave, view own attendance and corrections, read own payslip with EPF and TDS lines, check own workload and appraisal goals"],
            ["Accountant", "Rebuilds salary computations in spreadsheets each month; reconciles loss-of-pay manually", "Payslips generated line-by-line from structures with EPF, TDS and attendance-driven pro-rating; cost trends tracked across runs"],
            ["Recruiter", "Tracks candidates in email threads and notebooks", "Pipeline stages from application to onboarding with interview scheduling, recommendations and offer status in one view"],
        ],
        [0.16, 0.42, 0.42],
        caption="Table 12 — Before-and-after impact by stakeholder; every \u201cafter\u201d cell maps to a verified module.",
    )
    story += h2_block("10.1 Reduction of manual work", para(
        "The system absorbs the repetitive transaction layer of HR work — attendance compilation, leave tracking, "
        "payslip generation, document expiry monitoring and routine enquiries about balances and status — "
        "because these are exactly the flows the twelve modules automate. What it deliberately does not absorb "
        "is the judgement layer: approvals, exceptions and decisions remain human work, now performed from a "
        "queue with complete context rather than from a corridor with incomplete information. That division is "
        "the honest headline for the time saved, and it is also the cultural one: the system removes drudgery "
        "from HR rather than removing HR itself."))
    story += h2_block("10.2 Transparency, centralisation and trust", para(
        "Two structural benefits compound over time. Transparency: every decision is attributable — who "
        "submitted, who approved, who returned it, when, with what comment — so disputes shrink to conversations "
        "about policy rather than fights about facts, and audit or accreditation requests become queries instead "
        "of archaeology. Centralisation: one employee record feeds attendance, leave, payroll, workload, "
        "appraisal and documents, which removes the contradiction of three offices holding three versions of "
        "the same person. A rejected leave application with a visible reason, and an overload flag on a "
        "department screen, are the two everyday images of that shift."))
    story += h2_block("10.3 Multi-campus readiness and future scale", para(
        "The schema models the institution as campuses containing faculties, departments and designations before "
        "it models a single employee, and the demonstration dataset already runs three campuses — so a college "
        "group growing to more campuses is doing data entry, not re-engineering. The runtime scale story is "
        "equally practical: the API is stateless between requests so additional instances balance behind it; "
        "the database carries indexes on the hot lookups (requests by status, documents by type, records by "
        "employee); and every list endpoint is paginated, which is what keeps response times flat as the roster "
        "grows. The roadmap the team presents as future scope — biometric and mobile integration, notification "
        "channels beyond in-app, statutory e-filing, PDF reporting — is listed honestly as extensions to a "
        "structure that already holds, not as repairs to one that does not."))
