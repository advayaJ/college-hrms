#!/usr/bin/env python3
"""Chapters 5-7: Member 3, Member 4, Presentation Flow & Timing."""
from engine import (h1_block, h2_block, h3_block, para, bullets, stat_row,
                    callout, make_table, qa_block, quote_block)


def chapter5(story):
    story += h1_block(
        "5. Member 3 — Competitor Comparison and Differentiation",
        para("Member 3 carries the section most student teams skip: market awareness. The material is fully "
             "prepared in Chapters 8 and 9 of this guide — the comparison matrix, the evidence notes and the "
             "differentiation assessment — so this chapter is the <i>speaking layer</i>: what to actually say in "
             "five minutes. The stance throughout is confident but fair: competitors are established products "
             "with real strengths, and our case rests on configurability, cost, ownership and focus rather than "
             "on belittling anyone. Judges reward evidence-based comparison and punish exaggeration, so every "
             "claim below maps to a documented source."))
    story += bullets([
        "<b>Frame the research honestly in thirty seconds.</b> \u201cWe studied four established Indian platforms — "
        "MasterSoft HRMS, Fedena, Cyborg ERP and RF-Campus from IITMS — using their official product pages. Where "
        "a capability is clearly documented we mark it available; where it is only partially described we mark it "
        "partially available; where we could not verify it we say so instead of guessing.\u201d",
        "<b>Headline finding one.</b> Established platforms are broad: biometric attendance, mobile apps, "
        "training modules, e-filing and integrations we deliberately have not built. Say it plainly — "
        "acknowledging their breadth is what makes our other claims credible.",
        "<b>Headline finding two.</b> Deep <i>process</i> configurability is rare in the documented feature set: "
        "most describe workflows generically, while our approval engine exposes multi-stage chains with ANY, ALL "
        "and QUORUM strategies, SLA hours, role or named approvers, and return-and-resubmit cycles as "
        "administrator-editable data.",
        "<b>Headline finding three.</b> Our academic depth is competitive: workload norms with overload flags "
        "plus academic contributions feeding appraisal, Indian statutory payroll with EPF, TDS and loss-of-pay "
        "pro-rating, and role-specific dashboards — in one self-contained build the institution owns.",
        "<b>Then the differentiation arc.</b> Genuine differentiators (configurable approval depth, dual-theme "
        "SPATIAL GLASS interface, live multi-role switching), honest common ground (payroll, leave, recruitment "
        "are industry-standard), and improvement opportunities (biometric and mobile integrations). Chapter 9 "
        "contains the full assessment table.",
        "<b>Close the segment with the college\u2019s decision.</b> Present the \u201cwhy choose us\u201d argument in its "
        "realistic form from Chapter 9 — zero licensing cost, self-hosted data ownership, no vendor lock-in, "
        "configurable processes and a modern interface — as the reasons a college would <i>pilot</i> this system, "
        "while mature commercial ERPs remain the choice for institutions needing their breadth on day one.",
    ])
    story += h2_block("5.1 Questions Member 3 should expect", None)
    story += qa_block(
        "Fedena already does school HR with payroll — why should anyone use yours?",
        "Fedena is a solid, documented product for schools with employee data, leave, payroll and payslips — we "
        "verified exactly that on their feature pages. Our case is different in kind: university-scale structure "
        "with campuses and faculties, configurable multi-stage approvals, faculty workload norms feeding "
        "appraisal, and full ownership of code and data at zero licence cost. For an institution that wants "
        "those specific capabilities and control, our system is the better fit; for one that needs Fedena\u2019s "
        "breadth today, Fedena is.")
    story += qa_block(
        "Your comparison says \u201cnot verified\u201d in several cells — why not just say the competitor lacks it?",
        "Because we restricted ourselves to what their official documentation states. A cell marked \u201cnot "
        "verified\u201d means we found no public statement either way, and claiming a gap we cannot evidence would "
        "be exactly the kind of assumption a commercial vendor would correct in front of the judges. The honest "
        "label is the defensible one.")
    story += qa_block(
        "If these products are so established, what is your real advantage?",
        "Three things we can demonstrate on the spot: a configurable approval engine whose stages, strategies "
        "and SLAs are administrator-editable data; an interface modern enough that a 55-year-old registrar can "
        "use it without training; and complete institutional ownership — self-hosted PostgreSQL, open stack, no "
        "per-student licence. Breadth they win; depth of configurability, experience and ownership we win.")
    story += qa_block(
        "What did you learn from studying these products?",
        "Two lessons that changed our roadmap: first, that biometric attendance and mobile applications are "
        "table stakes for institutional buyers, so they lead our integration list; second, that our approval "
        "engine, which we thought of as a feature, is actually a differentiator, because most documented "
        "workflow claims stop at generic automation.")


def chapter6(story):
    story += h1_block(
        "6. Member 4 — Impact, Practical Application and Conclusion",
        para("Member 4 converts the system the judges just saw into value they can feel, then closes the "
             "presentation. The discipline of this segment is to say almost nothing technical: Member 2 has "
             "already earned the engineering marks, and repeating features would dilute them. Every point below "
             "is a scenario, a benefit or an honest limitation — the material non-technical judges actually "
             "remember ten minutes later. The full impact analysis behind these points is in Chapter 10; this is "
             "the spoken version."))
    story += bullets([
        "<b>For administrators and principals.</b> Approvals stop walking corridors: every request sits in a "
        "queue with its stage, its history and its deadline, and institution-wide numbers — workforce mix, "
        "attendance trends, salary cost — sit on one dashboard instead of one folder of spreadsheets.",
        "<b>For the HR office.</b> One master record per employee instead of parallel files; joining, transfers, "
        "promotions and separations as recorded service events; documents with expiry alerts so nothing lapses "
        "silently; and an audit trail that answers \u201cwho approved what, when\u201d without an afternoon of "
        "archaeology.",
        "<b>For faculty and staff.</b> Self-service reality: apply for leave and watch its stages, see own "
        "attendance and request corrections, read own payslip with its EPF and TDS lines, track own workload "
        "and appraisal goals — no queues, no phone calls, no \u201ccome after lunch\u201d.",
        "<b>Transparency as a cultural change.</b> The same rules apply to everyone and are visible to "
        "everyone concerned: a leave request rejected with a reason is a conversation prevented; an overload "
        "flag on the workload screen is a staffing argument won with data.",
        "<b>Multi-campus readiness and future scope.</b> The schema is built campus-first, so growth is data "
        "entry rather than re-engineering; the roadmap the team honestly presents is biometric and mobile "
        "integration, notification channels beyond in-app, statutory e-filing, and PDF report generation.",
        "<b>Honest limitations first.</b> State them plainly and briefly — no biometric devices, no mobile app, "
        "no email or SMS, CSV-only exports — and note each one leads the roadmap. Judges trust teams who name "
        "their own boundaries before being asked.",
        "<b>Conclusion and thank-you.</b> One breath of summary — the problem, the twelve modules, the proof "
        "just witnessed, and the invitation to ask anything — then a clean thank-you to the panel and handover "
        "to the question round.",
    ])
    story += h2_block("6.1 Suggested closing line", None)
    story += quote_block(
        "\u201cWe set out to remove paper from an HR office, and we ended up building something an institution "
        "could actually run: its people, its processes, its rules, and its records — in one place, under its own "
        "control. Thank you for your time; we welcome your questions.\u201d")
    story += h2_block("6.2 Questions Member 4 should expect", None)
    story += qa_block(
        "What is the single biggest benefit you would claim?",
        "Accountability through transparency: every transaction is recorded, every decision is attributable, "
        "and every employee can see their own data. Everything else — time saved, errors avoided — flows from "
        "that one property.")
    story += qa_block(
        "How much manual work does this actually remove?",
        "The repetitive daily transactions: attendance compilation, leave application tracking, payslip "
        "generation and routine enquiry answering become self-service or automated, and the approval chases "
        "become queue monitoring. What remains is the judgement work — approvals and decisions — which is "
        "exactly the work HR should be doing.")
    story += qa_block(
        "Can this really run in a college, or is it a demo?",
        "The engineering is production-shaped — a separate API, a relational database with integrity "
        "constraints, session security with role-based permissions, and an audit log — seeded with a full "
        "demonstration dataset to make it presentable. Deploying it institution-wide needs the integrations on "
        "our roadmap and a data migration exercise, which is precisely the future scope we described.")


def chapter7(story):
    story += h1_block(
        "7. Presentation Flow, Slide Allocation and Timing",
        para("The full presentation runs twenty minutes across ten stages and twenty-three slides, followed by "
             "the judges\u2019 question round. The flow mirrors the structure of this guide so every member can "
             "rehearse from the same map: problem, solution, engineering proof, market position, value, close. "
             "Timings assume one rehearsed run-through with a stopwatch; the buffer advice at the end of this "
             "chapter protects the demonstration, which is the segment judges remember."))
    story += make_table(
        ["Stage", "Member", "Min", "Slides", "Key points on the slide"],
        [
            ["1. Introduction and problem statement", "M1", "1.5", "2", "Title slide; the manual-HMS pain in four pictures (register, chit, spreadsheet, corridor)"],
            ["2. Objectives and proposed solution", "M1", "1.5", "2", "Vision in one sentence; the twelve-module map as a single diagram"],
            ["3. Architecture and system overview", "M2", "1.5", "2", "Three-tier diagram; the request lifecycle told as one sentence"],
            ["4. Module-wise functionality", "M2", "2.5", "4", "One slide per depth module: approvals engine, statutory payroll, workload norms, appraisal flow; inventory slide for the rest"],
            ["5. Live demonstration", "M2", "2.5", "2", "Only a \u201clive system\u201d interstitial and a fallback screenshot slide — the screen is the slide"],
            ["6. Competitor comparison", "M3", "2.0", "2", "The comparison matrix (Chapter 8) with the honest label legend; evidence-sources footnote"],
            ["7. Our differentiation", "M3", "2.0", "2", "Genuine differentiators vs common ground vs roadmap; \u201cwhy a college would choose us\u201d in five points"],
            ["8. Practical impact", "M4", "2.0", "2", "Stakeholder table: administrator, HR, faculty; transparency before/after framing"],
            ["9. Future scope and limitations", "M4", "1.0", "1", "Honest limitation list leading the integration roadmap"],
            ["10. Conclusion and questions", "M4", "1.0", "1", "One-breath summary and thank-you; team photograph"],
        ],
        [0.30, 0.08, 0.07, 0.08, 0.47],
        caption="Table 7 — The ten-stage flow: 20 minutes, 23 slides, four members, no gaps and no overlaps.",
        center_cols=[1, 2, 3],
    )
    story += h2_block("7.1 The four transition sentences", para(
        "Transitions are scripted so the baton never drops. Each one names the next speaker and their mission in "
        "a single breath, and each is short enough to deliver from memory under pressure."))
    story += bullets([
        "<b>M1 to M2 (after the solution overview):</b> \u201cThat is what we set out to build; now our primary "
        "developer will show you how it is engineered — and then prove it live.\u201d",
        "<b>M2 to M3 (after the demonstration):</b> \u201cYou have just seen what our system does. The natural "
        "question is how it stands against what colleges already buy — our analyst will answer that with "
        "evidence.\u201d",
        "<b>M3 to M4 (after differentiation):</b> \u201cSo the comparison says where we are strong and where we are "
        "still growing. What that means for a real institution is the story our final speaker will tell.\u201d",
        "<b>M4 to questions (after the close):</b> \u201cThat concludes our presentation. We are happy to take "
        "your questions — any of the four of us will answer depending on where it lands.\u201d",
    ])
    story += h2_block("7.2 Rehearsal and buffer guidance", para(
        "Rehearse the full arc at least twice with a stopwatch and once with a hostile questioner playing the "
        "panel. Guard the demonstration: it is the only unrehearsable-in-spirit segment, so arrive early, open "
        "the preview link, log in and let the browser warm its cache before the first speaker starts. Keep a "
        "screen recording of the full demo as a fallback — if the live environment misbehaves, switch to it "
        "without apology and keep narrating, because a recorded truth beats a live failure. If the panel cuts "
        "time, the modules in stage 4 compress first (speak only the depth four), and the demonstration and "
        "comparison matrix are the last things to sacrifice."))
