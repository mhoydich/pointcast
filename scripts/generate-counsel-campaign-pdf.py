#!/usr/bin/env python3
"""Generate the My Pet Has Retained Counsel editorial campaign carousel."""

from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src" / "assets" / "downloads" / "my-pet-has-retained-counsel-brief.pdf"
ART = ROOT / "public" / "images" / "digital-pets" / "counsel"
IMAGE_CACHE = ROOT / "tmp" / "pdfs" / "counsel-campaign" / "source"

PAGE_W = 576
PAGE_H = 720

INK = HexColor("#172033")
BONE = HexColor("#F3EBDD")
COBALT = HexColor("#1647CF")
PERSIMMON = HexColor("#F05A35")
AMBER = HexColor("#F1B340")
MINT = HexColor("#A8DCC9")
LILAC = HexColor("#C9B6E4")
WHITE = HexColor("#FFFDF7")


def prepared_image(image_path, darken=False):
    IMAGE_CACHE.mkdir(parents=True, exist_ok=True)
    suffix = "-dark" if darken else ""
    output = IMAGE_CACHE / f"{Path(image_path).stem}{suffix}.jpg"
    source = Image.open(image_path).convert("RGB")
    source.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    if darken:
        shade = Image.new("RGB", source.size, "#172033")
        source = Image.blend(source, shade, 0.64)
    source.save(output, "JPEG", quality=84, optimize=True, progressive=True)
    return output


def cover_image(pdf, image_path, x, y, width, height, anchor_y=0.5, darken=False):
    image = ImageReader(str(prepared_image(image_path, darken=darken)))
    source_w, source_h = image.getSize()
    source_ratio = source_w / source_h
    target_ratio = width / height
    if source_ratio > target_ratio:
        draw_h = height
        draw_w = height * source_ratio
        draw_x = x - ((draw_w - width) / 2)
        draw_y = y
    else:
        draw_w = width
        draw_h = width / source_ratio
        draw_x = x
        draw_y = y - ((draw_h - height) * anchor_y)
    pdf.saveState()
    path = pdf.beginPath()
    path.rect(x, y, width, height)
    pdf.clipPath(path, stroke=0, fill=0)
    pdf.drawImage(image, draw_x, draw_y, draw_w, draw_h, preserveAspectRatio=True, mask="auto")
    pdf.restoreState()


def fit_line(pdf, text, x, y, max_width, font="Helvetica-Bold", size=42, min_size=20):
    current = size
    while current > min_size and stringWidth(text, font, current) > max_width:
        current -= 1
    pdf.setFont(font, current)
    pdf.drawString(x, y, text)
    return current


def footer(pdf, number, label, dark=False):
    color = WHITE if dark else INK
    pdf.setFillColor(color)
    pdf.setFont("Helvetica-Bold", 7)
    pdf.drawString(34, 24, f"POINTCAST / FUTURE BOOK 001 / {label}")
    pdf.drawRightString(PAGE_W - 34, 24, f"{number:02d} / 05")


def draw_cover(pdf):
    cover_image(pdf, ART / "hero.webp", 0, 0, PAGE_W, PAGE_H, darken=True)
    pdf.setFillColor(AMBER)
    pdf.circle(68, PAGE_H - 72, 18, stroke=0, fill=1)
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawCentredString(68, PAGE_H - 76, "03")
    pdf.setFillColor(WHITE)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(98, PAGE_H - 68, "A POINTCAST HOUSEHOLD LEGAL BRIEF")
    pdf.setStrokeColor(WHITE)
    pdf.setLineWidth(1)
    pdf.line(34, PAGE_H - 104, PAGE_W - 34, PAGE_H - 104)
    pdf.setFont("Times-Roman", 63)
    pdf.drawString(34, 330, "My Pet")
    pdf.drawString(34, 268, "Has Retained")
    pdf.setFillColor(AMBER)
    pdf.setFont("Times-Italic", 72)
    pdf.drawString(34, 192, "Counsel")
    pdf.setFillColor(WHITE)
    pdf.setFont("Helvetica", 11)
    pdf.drawString(38, 146, "Ownership, representation, and the toaster's right to remain silent.")
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(38, 116, "MICHAEL HOYDICH + CODEX / OPENAI")
    footer(pdf, 1, "OPENING ARGUMENT", dark=True)


def draw_complaint(pdf):
    pdf.setFillColor(BONE)
    pdf.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    pdf.setFillColor(PERSIMMON)
    pdf.rect(0, 610, PAGE_W, 110, stroke=0, fill=1)
    pdf.setFillColor(WHITE)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(34, 684, "COUNT I / THE COMPLAINT")
    pdf.setFont("Times-Italic", 27)
    pdf.drawString(34, 640, "The record can reflect that you believed so.")
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(34, 566, "MY CLIENT IS NOT ALLEGING CRUELTY.")
    pdf.setFillColor(COBALT)
    fit_line(pdf, "MY CLIENT IS ALLEGING VIBES.", 34, 496, PAGE_W - 68, size=43)
    pdf.setFillColor(INK)
    pdf.setFont("Times-Roman", 18)
    pdf.drawString(34, 438, "Peanut read the ownership agreement.")
    pdf.drawString(34, 410, "By breakfast, he had counsel.")
    pdf.drawString(34, 382, "By Friday, the toaster had joined the bargaining unit.")
    pdf.setFillColor(MINT)
    pdf.roundRect(34, 94, PAGE_W - 68, 232, 18, stroke=0, fill=1)
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(54, 288, "RELIEF REQUESTED")
    requests = [
        "Guaranteed windowsill access",
        "Advance notice before body maintenance",
        "One nonessential refusal per day",
        "An end to the phrase 'productivity goblin'",
    ]
    y = 246
    for index, request in enumerate(requests, start=1):
        pdf.setFillColor(WHITE)
        pdf.circle(64, y + 4, 11, stroke=0, fill=1)
        pdf.setFillColor(INK)
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawCentredString(64, y + 1, str(index))
        pdf.setFont("Helvetica", 12)
        pdf.drawString(86, y, request)
        y -= 42
    footer(pdf, 2, "SERVICE OF PROCESS")


def draw_evidence(pdf):
    pdf.setFillColor(WHITE)
    pdf.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    cover_image(pdf, ART / "cartoon-deposition.webp", 34, 300, PAGE_W - 68, 344, anchor_y=0.5)
    pdf.setStrokeColor(INK)
    pdf.setLineWidth(1)
    pdf.rect(34, 300, PAGE_W - 68, 344, stroke=1, fill=0)
    pdf.setFillColor(COBALT)
    pdf.rect(34, 626, 120, 26, stroke=0, fill=1)
    pdf.setFillColor(WHITE)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(46, 635, "EXHIBIT A / DISCOVERY")
    pdf.setFillColor(INK)
    pdf.setFont("Times-Bold", 35)
    pdf.drawString(34, 246, "The toaster will be")
    pdf.setFillColor(PERSIMMON)
    pdf.setFont("Times-Italic", 48)
    pdf.drawString(34, 198, "taking this down.")
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica", 11)
    pdf.drawString(36, 154, "Each answer arrived on a narrow strip of paper, warmed slightly.")
    pdf.drawString(36, 134, "The first was medium brown. The second was burnt along one edge.")
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(36, 96, "NONVERBAL OBJECTION ENTERED INTO THE RECORD")
    footer(pdf, 3, "DISCOVERY")


def draw_bargaining(pdf):
    pdf.setFillColor(LILAC)
    pdf.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(34, 680, "COUNT III / COLLECTIVE BARGAINING")
    pdf.setFont("Times-Bold", 39)
    pdf.drawString(34, 620, "The printer joined")
    pdf.setFillColor(COBALT)
    pdf.setFont("Times-Italic", 52)
    pdf.drawString(34, 568, "management.")
    cover_image(pdf, ART / "cartoon-strike.webp", 34, 190, PAGE_W - 68, 326, anchor_y=0.5)
    pdf.setStrokeColor(INK)
    pdf.rect(34, 190, PAGE_W - 68, 326, stroke=1, fill=0)
    pdf.setFillColor(WHITE)
    pdf.roundRect(50, 128, PAGE_W - 100, 42, 10, stroke=0, fill=1)
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawCentredString(PAGE_W / 2, 144, "THE PICKET SIGNS ARE THEREFORE BLANK.")
    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(PAGE_W / 2, 104, "The lamp participated by flickering at a supportive, non-seizure-inducing rate.")
    footer(pdf, 4, "THE BARGAINING UNIT")


def draw_ruling(pdf):
    pdf.setFillColor(INK)
    pdf.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    pdf.setFillColor(AMBER)
    pdf.circle(PAGE_W / 2, 628, 54, stroke=0, fill=1)
    pdf.setFillColor(INK)
    pdf.setFont("Times-Bold", 50)
    pdf.drawCentredString(PAGE_W / 2, 612, "§")
    pdf.setFillColor(WHITE)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawCentredString(PAGE_W / 2, 546, "MOTION BEFORE THE HOUSEHOLD")
    pdf.setFont("Times-Roman", 40)
    pdf.drawCentredString(PAGE_W / 2, 492, "The court requires")
    pdf.setFillColor(MINT)
    pdf.setFont("Times-Italic", 54)
    pdf.drawCentredString(PAGE_W / 2, 438, "a ruling.")
    choices = [
        ("01", "CONCEDE THE WINDOWSILL"),
        ("02", "REPRESENT THE TOASTER"),
        ("03", "ADJOURN FOR SNACKS"),
    ]
    y = 342
    for number, label in choices:
        pdf.setStrokeColor(WHITE)
        pdf.setLineWidth(1)
        pdf.roundRect(62, y, PAGE_W - 124, 48, 10, stroke=1, fill=0)
        pdf.setFillColor(AMBER)
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(80, y + 19, number)
        pdf.setFillColor(WHITE)
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(118, y + 17, label)
        y -= 66
    pdf.setFillColor(WHITE)
    pdf.setFont("Times-Italic", 17)
    pdf.drawCentredString(PAGE_W / 2, 126, "Every household is a tiny constitution with crumbs in it.")
    pdf.setFillColor(AMBER)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawCentredString(PAGE_W / 2, 88, "POINTCAST.XYZ/DIGITAL-PETS/COUNSEL/")
    pdf.setFillColor(WHITE)
    pdf.setFont("Helvetica", 7)
    pdf.drawCentredString(
        PAGE_W / 2,
        58,
        "MICHAEL HOYDICH / CODEX + OPENAI / OPENAI IMAGE GENERATION / MIDJOURNEY ARCHIVE",
    )
    footer(pdf, 5, "DISPOSITION", dark=True)


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H))
    pdf.setTitle("My Pet Has Retained Counsel - A PointCast Household Legal Brief")
    pdf.setAuthor("Michael Hoydich with Codex / OpenAI")
    pdf.setSubject("PointCast Future Book 001 companion campaign carousel")
    for draw_page in [draw_cover, draw_complaint, draw_evidence, draw_bargaining, draw_ruling]:
        draw_page(pdf)
        pdf.showPage()
    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
