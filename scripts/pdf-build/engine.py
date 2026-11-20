#!/usr/bin/env python3
"""College HRMS Team Presentation & Competitor Analysis — body PDF builder.

Report route (ReportLab). Cover is rendered separately via html2poster.js
and merged with pypdf (see merge_final.py). Crystal Blue (Template 07)
fixed body palette per typesetting/cover.md.
"""
import os
import sys
import hashlib

PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, "scripts"))

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether,
    CondPageBreak, HRFlowable, Image,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from PIL import Image as PILImage

# ── Fonts (allowed set only) ────────────────────────────────────────────────
FONT_DIR = "/usr/share/fonts"
pdfmetrics.registerFont(TTFont("NotoSerifSC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Noto Sans SC", f"{FONT_DIR}/truetype/chinese/NotoSansSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Noto Sans SC Bold", f"{FONT_DIR}/truetype/chinese/NotoSansSC-Bold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FONT_DIR}/truetype/freefont/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", f"{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSans", f"{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf"))

registerFontFamily("NotoSerifSC", normal="NotoSerifSC", bold="NotoSerifSC-Bold")
registerFontFamily("Noto Sans SC", normal="Noto Sans SC", bold="Noto Sans SC Bold")
registerFontFamily("FreeSerif", normal="FreeSerif", bold="FreeSerif-Bold",
                   italic="FreeSerif-Italic", boldItalic="FreeSerif-BoldItalic")
registerFontFamily("DejaVuSans", normal="DejaVuSans", bold="DejaVuSans")

from pdf import install_font_fallback  # noqa: E402
install_font_fallback()

# ── Crystal Blue body palette (Template 07, fixed) ──────────────────────────
PAGE_BG      = colors.HexColor("#f5f8fc")
SECTION_BG   = colors.HexColor("#edf2f9")
CARD_BG      = colors.HexColor("#e4ecf5")
TABLE_STRIPE = colors.HexColor("#eef3fa")
HEADER_FILL  = colors.HexColor("#1a4a7a")
BORDER       = colors.HexColor("#c0d0e2")
ACCENT       = colors.HexColor("#2d7ab3")
TEXT_PRIMARY = colors.HexColor("#142840")
TEXT_MUTED   = colors.HexColor("#5a7a96")

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ── Geometry ────────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN = 0.9 * inch
AVAIL_W = PAGE_W - 2 * MARGIN
AVAIL_H = PAGE_H - 2 * MARGIN
MAX_KEEP_HEIGHT = PAGE_H * 0.4
H1_ORPHAN_THRESHOLD = AVAIL_H * 0.25

# ── Styles ──────────────────────────────────────────────────────────────────
S = {}
S["body"] = ParagraphStyle("Body", fontName="FreeSerif", fontSize=10.5, leading=17,
                           alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY,
                           spaceBefore=0, spaceAfter=10)
S["lead"] = ParagraphStyle("Lead", parent=S["body"], fontSize=11, leading=18,
                           textColor=TEXT_PRIMARY, spaceAfter=12)
S["h1"] = ParagraphStyle("H1", fontName="FreeSerif", fontSize=22, leading=27,
                         textColor=HEADER_FILL, spaceBefore=0, spaceAfter=4)
S["h2"] = ParagraphStyle("H2", fontName="FreeSerif", fontSize=15, leading=20,
                         textColor=TEXT_PRIMARY, spaceBefore=16, spaceAfter=8)
S["h3"] = ParagraphStyle("H3", fontName="FreeSerif", fontSize=11.5, leading=16,
                         textColor=HEADER_FILL, spaceBefore=12, spaceAfter=6)
S["bullet"] = ParagraphStyle("Bullet", fontName="FreeSerif", fontSize=10.5, leading=16.5,
                             alignment=TA_LEFT, textColor=TEXT_PRIMARY,
                             leftIndent=18, bulletIndent=6, spaceAfter=5)
S["bullet2"] = ParagraphStyle("Bullet2", parent=S["bullet"], leftIndent=32, bulletIndent=20)
S["quote"] = ParagraphStyle("Quote", fontName="FreeSerif-Italic", fontSize=10.5, leading=17,
                            leftIndent=24, textColor=TEXT_PRIMARY, spaceBefore=6, spaceAfter=10,
                            borderPadding=0)
S["caption"] = ParagraphStyle("Caption", fontName="FreeSerif", fontSize=8.5, leading=12,
                              alignment=TA_CENTER, textColor=TEXT_MUTED,
                              spaceBefore=3, spaceAfter=6)
S["th"] = ParagraphStyle("TH", fontName="FreeSerif", fontSize=9.5, leading=13,
                         alignment=TA_CENTER, textColor=colors.white)
S["td"] = ParagraphStyle("TD", fontName="FreeSerif", fontSize=9, leading=12.5,
                         alignment=TA_LEFT, textColor=TEXT_PRIMARY)
S["tdc"] = ParagraphStyle("TDC", parent=S["td"], alignment=TA_CENTER)
S["stat_big"] = ParagraphStyle("StatBig", fontName="FreeSerif", fontSize=19, leading=23,
                               textColor=ACCENT, alignment=TA_CENTER)
S["stat_label"] = ParagraphStyle("StatLabel", fontName="FreeSerif", fontSize=9, leading=12.5,
                                 textColor=TEXT_MUTED, alignment=TA_CENTER)
S["callout"] = ParagraphStyle("Callout", fontName="FreeSerif", fontSize=10.5, leading=16,
                               textColor=TEXT_PRIMARY, alignment=TA_LEFT)
S["ref"] = ParagraphStyle("Ref", fontName="FreeSerif", fontSize=9.5, leading=14.5,
                          leftIndent=24, firstLineIndent=-24, textColor=TEXT_PRIMARY,
                          spaceAfter=8, alignment=TA_LEFT)
S["toc_title"] = ParagraphStyle("TocTitle", fontName="FreeSerif", fontSize=20, leading=26,
                                textColor=HEADER_FILL, spaceAfter=14)
S["toc0"] = ParagraphStyle("TOC0", fontName="FreeSerif", fontSize=11.5, leading=21,
                           textColor=TEXT_PRIMARY, leftIndent=6)
S["toc1"] = ParagraphStyle("TOC1", fontName="FreeSerif", fontSize=10, leading=17,
                           textColor=TEXT_MUTED, leftIndent=26)

DOC_TITLE = "College HRMS — Team Presentation & Competitor Analysis"
FOOTER_LEFT = "Aryavratt HRMS Project Team"


# ── TOC document template ──────────────────────────────────────────────────
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, "bookmark_name"):
            level = getattr(flowable, "bookmark_level", 0)
            text = getattr(flowable, "bookmark_text", "")
            key = getattr(flowable, "bookmark_key", "")
            self.notify("TOCEntry", (level, text, self.page, key))


# ── Page decoration (header, footer, crystal-blue page tint) ────────────────
def page_deco(canvas, doc):
    canvas.saveState()
    # full-page light blue tint (Crystal Blue body)
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # header
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, PAGE_H - 0.55 * inch, DOC_TITLE)
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(MARGIN, PAGE_H - 0.62 * inch, PAGE_W - MARGIN, PAGE_H - 0.62 * inch)
    # footer
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 0.62 * inch, PAGE_W - MARGIN, 0.62 * inch)
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, 0.45 * inch, FOOTER_LEFT)
    page_label = "i" if doc.page == 1 else str(doc.page - 1)
    canvas.drawRightString(PAGE_W - MARGIN, 0.45 * inch, page_label)
    canvas.restoreState()


# ── Helpers ─────────────────────────────────────────────────────────────────
def add_heading(text, style, level=0):
    key = "h_%s" % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/><b>%s</b>' % (key, text), style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p


def safe_keep_together(elements):
    total_h = 0
    for el in elements:
        try:
            _, h = el.wrap(AVAIL_W, PAGE_H)
        except Exception:
            h = 0
        total_h += h
    if total_h <= MAX_KEEP_HEIGHT:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)


def h1_block(text, first_content):
    """Chapter heading with accent underline, kept with the first content block."""
    head = add_heading(text, S["h1"], level=0)
    rule = HRFlowable(width="100%", color=ACCENT, thickness=1.2,
                      spaceBefore=2, spaceAfter=12)
    first = list(first_content) if isinstance(first_content, (list, tuple)) else [first_content]
    out = [CondPageBreak(H1_ORPHAN_THRESHOLD), Spacer(1, 10)]
    out += safe_keep_together([head, rule] + first)
    return out


def h2_block(text, first_content=None):
    head = Paragraph("<b>%s</b>" % text, S["h2"])
    if first_content is not None:
        first = list(first_content) if isinstance(first_content, (list, tuple)) else [first_content]
        return safe_keep_together([head] + first)
    return [head]


def h3_block(text, first_content=None):
    head = Paragraph("<b>%s</b>" % text, S["h3"])
    if first_content is not None:
        first = list(first_content) if isinstance(first_content, (list, tuple)) else [first_content]
        return safe_keep_together([head] + first)
    return [head]


def para(text, style="body"):
    return [Paragraph(text, S[style])]


def bullets(items, style="bullet"):
    return [Paragraph(t, S[style], bulletText="\u2022") for t in items]


def stat_row(stats):
    """4-cell metric strip: [(value, label), ...]"""
    n = len(stats)
    cells = []
    for value, label in stats:
        cells.append([Paragraph("<b>%s</b>" % value, S["stat_big"]),
                      Paragraph(label, S["stat_label"])])
    tbl = Table([cells], colWidths=[AVAIL_W / n] * n, hAlign="CENTER")
    style = [
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("BOX", (0, 0), (-1, -1), 1, ACCENT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    for i in range(1, n):
        style.append(("LINEBEFORE", (i, 0), (i, -1), 0.5, BORDER))
    tbl.setStyle(TableStyle(style))
    return [Spacer(1, 6), tbl, Spacer(1, 12)]


def callout(text, title=None):
    rows = []
    if title:
        rows.append([Paragraph("<b>%s</b>" % title,
                               ParagraphStyle("ct", parent=S["callout"],
                                               textColor=HEADER_FILL, fontSize=11))])
    rows.append([Paragraph(text, S["callout"])])
    tbl = Table(rows, colWidths=[AVAIL_W], hAlign="CENTER")
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ACCENT),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return [Spacer(1, 4), tbl, Spacer(1, 12)]


def make_table(headers, rows, ratios, caption=None, center_cols=None, font_size=None):
    """Standard striped table. All cells wrapped in Paragraph()."""
    center_cols = center_cols or []
    th_style, td_style, tdc_style = S["th"], S["td"], S["tdc"]
    if font_size:
        th_style = ParagraphStyle("th_x", parent=S["th"], fontSize=font_size, leading=font_size + 3.5)
        td_style = ParagraphStyle("td_x", parent=S["td"], fontSize=font_size, leading=font_size + 3.5)
        tdc_style = ParagraphStyle("tdc_x", parent=td_style, alignment=TA_CENTER)
    data = [[Paragraph("<b>%s</b>" % h, th_style) for h in headers]]
    for row in rows:
        cells = []
        for ci, cell in enumerate(row):
            stl = tdc_style if ci in center_cols else td_style
            cells.append(Paragraph(str(cell), stl))
        data.append(cells)
    col_widths = [r * AVAIL_W for r in ratios]
    assert abs(sum(ratios) - 1.0) < 0.01, "ratios must sum to 1"
    assert sum(col_widths) <= AVAIL_W + 0.5, "table overflow"
    tbl = Table(data, colWidths=col_widths, hAlign="CENTER", repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_ODD if i % 2 == 1 else TABLE_ROW_EVEN
        style.append(("BACKGROUND", (0, i), (-1, i), bg))
    tbl.setStyle(TableStyle(style))
    out = [Spacer(1, 6), tbl]
    if caption:
        out += [Spacer(1, 2), Paragraph(caption, S["caption"])]
    out.append(Spacer(1, 12))
    return out


def embed_image(path, max_width=None, max_height=None):
    if max_width is None:
        max_width = AVAIL_W
    if max_height is None:
        max_height = A4[1] * 0.35
    pil_img = PILImage.open(path)
    orig_w, orig_h = pil_img.size
    ratio = min(max_width / orig_w if orig_w > max_width else 1.0,
                max_height / orig_h if orig_h > max_height else 1.0)
    return Image(path, width=orig_w * ratio, height=orig_h * ratio)


def qa_block(question, answer):
    q = Paragraph("<b>Q: %s</b>" % question,
                  ParagraphStyle("q", parent=S["body"], textColor=HEADER_FILL,
                                 spaceBefore=8, spaceAfter=4, alignment=TA_LEFT))
    a = Paragraph("<b>A:</b> %s" % answer, S["body"])
    return safe_keep_together([q, a])


def quote_block(text):
    tbl = Table([[Paragraph(text, S["quote"])]], colWidths=[AVAIL_W], hAlign="CENTER")
    tbl.setStyle(TableStyle([
        ("LINEBEFORE", (0, 0), (0, -1), 2, TEXT_MUTED),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return [Spacer(1, 4), tbl, Spacer(1, 8)]
