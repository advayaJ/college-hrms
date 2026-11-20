#!/usr/bin/env python3
"""Build the body PDF (ReportLab) and merge with the Playwright cover.

Output: /home/z/my-project/download/College_HRMS_Team_Presentation_and_Competitor_Analysis.pdf
"""
import os
import sys

BUILD = "/home/z/my-project/scripts/pdf-build"
sys.path.insert(0, BUILD)
os.chdir(BUILD)

from engine import (TocDocTemplate, page_deco, Paragraph, Spacer, PageBreak,
                    TableOfContents, S, DOC_TITLE, MARGIN, A4)
from content_a import chapter1, chapter2
from content_b import chapter3, chapter4
from content_c import chapter5, chapter6, chapter7
from content_d import chapter8, chapter9, chapter10
from content_e import chapter11, chapter12, chapter13

BODY_PDF = os.path.join(BUILD, "body.pdf")
COVER_PDF = os.path.join(BUILD, "cover.pdf")
FINAL_PDF = "/home/z/my-project/download/College_HRMS_Team_Presentation_and_Competitor_Analysis.pdf"


def build_body():
    story = []
    # Front matter: Table of Contents (page i)
    story.append(Paragraph("<b>Table of Contents</b>", S["toc_title"]))
    toc = TableOfContents()
    toc.levelStyles = [S["toc0"], S["toc1"]]
    toc.dotsMinLevel = 0
    story.append(toc)
    # How to use this guide (front-matter block on the TOC page)
    story.append(Spacer(1, 24))
    story.append(Paragraph("<b>How to use this guide</b>", S["h2"]))
    from engine import para as _para, bullets as _bullets
    story += _para(
        "Each member rehearses from their own chapter first — Chapters 3 to 6 hold the speaking points, "
        "scripts, transitions and the questions each member should personally expect. The whole team then "
        "aligns on the shared material: Chapter 1 is the single source of truth for what is actually "
        "implemented, Chapter 7 is the timing map, and Chapters 8 to 13 are the evidence base — the "
        "comparison matrix, the differentiation assessment, the impact story and the judges\u2019 question bank "
        "with model answers.")
    story += _bullets([
        "<b>Read Chapter 1 before your own chapter.</b> Every factual claim you make should trace back to it.",
        "<b>Rehearse against Chapter 7\u2019s timings</b>, and run the Chapter 4 demonstration sequence at least twice "
        "on the live system.",
        "<b>Before the question round</b>, read Chapter 12 in full: one member may be asked to deliver any answer in it.",
    ])
    story.append(PageBreak())

    chapters = [chapter1, chapter2, chapter3, chapter4, chapter5, chapter6,
                chapter7, chapter8, chapter9, chapter10, chapter11, chapter12,
                chapter13]
    for ch in chapters:
        ch(story)

    doc = TocDocTemplate(
        BODY_PDF,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
        title=DOC_TITLE,
        author="Z.ai",
        creator="Z.ai",
        subject="Team presentation preparation guide: verified system analysis, "
                "speaking responsibilities, competitor comparison and judges' question bank",
    )
    doc.multiBuild(story, onFirstPage=page_deco, onLaterPages=page_deco)
    print("body.pdf built:", os.path.getsize(BODY_PDF), "bytes")


def merge_final():
    from pypdf import PdfReader, PdfWriter

    A4_W, A4_H = 595.28, 841.89

    def normalize(page):
        w, h = float(page.mediabox.width), float(page.mediabox.height)
        if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
            page.scale_to(A4_W, A4_H)
        return page

    writer = PdfWriter()
    cover_page = PdfReader(COVER_PDF).pages[0]
    writer.add_page(normalize(cover_page))
    for page in PdfReader(BODY_PDF).pages:
        writer.add_page(normalize(page))
    writer.add_metadata({
        "/Title": "College HRMS — Team Presentation & Competitor Analysis",
        "/Author": "Z.ai",
        "/Creator": "Z.ai",
        "/Subject": "Team presentation preparation guide: verified system analysis, "
                    "speaking responsibilities, competitor comparison and judges' question bank",
    })
    with open(FINAL_PDF, "wb") as f:
        writer.write(f)
    n = len(PdfReader(FINAL_PDF).pages)
    print("final merged:", FINAL_PDF, "|", n, "pages")


if __name__ == "__main__":
    build_body()
    merge_final()
