#!/usr/bin/env python3

import argparse
import json
import shutil
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "src" / "data" / "civic-packet-watch.json"

INK = HexColor("#10251B")
PAPER = HexColor("#F2EDDC")
ACID = HexColor("#C9FF46")
RED = HexColor("#FF5A3D")
SKY = HexColor("#82CFFC")
LAVENDER = HexColor("#BFB2FF")
WHITE = HexColor("#FFFDF6")


def safe(value):
    return (
        str(value)
        .replace("\u2014", " - ")
        .replace("\u2013", "-")
        .replace("\u2011", "-")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2197", "->")
        .replace("\u00d7", "x")
    )


def wrap(text, font, size, width):
    words = safe(text).split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def text_block(c, text, x, y, width, font="Helvetica", size=10, leading=14, color=INK, max_lines=None):
    c.setFont(font, size)
    c.setFillColor(color)
    lines = wrap(text, font, size, width)
    if max_lines:
        lines = lines[:max_lines]
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def meta(c, text, x, y, color=INK, size=7):
    c.setFillColor(color)
    c.setFont("Courier-Bold", size)
    c.drawString(x, y, safe(text).upper())


def footer(c, page, data, dark=False):
    color = ACID if dark else INK
    c.setStrokeColor(color)
    c.setLineWidth(0.5)
    c.line(36, 30, 576, 30)
    meta(c, f"POINTCAST FIELD EDITION 002 / PAGE {page} OF 4", 36, 18, color, 6.5)
    meta(c, f"CHECKED {data['checkedAt']}", 350, 18, color, 6.5)


def cover(c, data):
    width, height = letter
    c.setFillColor(INK)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(ACID)
    c.rect(0, height - 54, width, 54, fill=1, stroke=0)
    meta(c, "POINTCAST / PUBLIC READER / EL SEGUNDO", 36, height - 34, INK, 7)
    meta(c, "FIELD EDITION 002", 455, height - 34, INK, 7)

    c.setFillColor(ACID)
    c.setFont("Helvetica-Bold", 80)
    c.drawString(34, 594, "CIVIC")
    c.setFillColor(WHITE)
    c.drawString(34, 516, "PACKET")
    c.setFillColor(RED)
    c.drawString(34, 438, "WATCH.")

    c.setStrokeColor(ACID)
    c.setLineWidth(1)
    for radius in (58, 104, 150):
        c.circle(464, 590, radius, fill=0, stroke=1)
    c.setFillColor(ACID)
    c.circle(464, 590, 9, fill=1, stroke=0)
    for x, y in ((418, 638), (510, 542), (386, 526), (526, 666)):
        c.circle(x, y, 4, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(36, 328, "A small public instrument for agendas,")
    c.drawString(36, 304, "packets, revisions, and civic deadlines.")

    stats = [
        (str(len(data["signals"])), "SIGNALS"),
        (str(len([s for s in data["signals"] if s["kind"] == "meeting"])), "MEETINGS"),
        (str(len([s for s in data["signals"] if s["kind"] == "opportunity"])), "OPPORTUNITY"),
        ("1", "CONFLICT"),
    ]
    x = 36
    for value, label in stats:
        c.setStrokeColor(ACID)
        c.rect(x, 190, 126, 78, fill=0, stroke=1)
        c.setFillColor(ACID)
        c.setFont("Helvetica-Bold", 29)
        c.drawString(x + 12, 224, value)
        meta(c, label, x + 12, 205, ACID, 6.5)
        x += 135

    text_block(c, data["affiliation"], 36, 145, 520, "Helvetica", 8.5, 12, WHITE)
    text_block(c, data["disclaimer"], 36, 105, 520, "Helvetica", 8.5, 12, WHITE)
    footer(c, 1, data, dark=True)
    c.showPage()


def signal_board(c, data):
    width, height = letter
    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    meta(c, "01 / INITIAL BASELINE", 36, 756, INK, 7)
    c.setFont("Helvetica-Bold", 34)
    c.setFillColor(INK)
    c.drawString(36, 705, "WHAT IS ACTUALLY POSTED?")
    text_block(c, "Every row keeps an official source attached. Baseline means first observation - not new, breaking, or changed.", 36, 678, 520, "Helvetica", 10, 14, INK)

    y = 630
    for index, signal in enumerate(data["signals"], start=1):
        fill = PAPER
        if signal["status"] == "canceled":
            fill = HexColor("#FFD0C7")
        elif signal["status"] == "packet-posted":
            fill = ACID
        elif signal["status"] == "open":
            fill = SKY
        c.setFillColor(fill)
        c.setStrokeColor(INK)
        c.rect(36, y - 80, 540, 80, fill=1, stroke=1)
        c.line(76, y - 80, 76, y)
        c.line(176, y - 80, 176, y)
        c.setFillColor(INK)
        c.setFont("Courier-Bold", 9)
        c.drawString(49, y - 22, f"{index:02d}")
        meta(c, signal["kind"], 87, y - 22, INK, 6)
        meta(c, signal["status"], 87, y - 36, INK, 6)
        meta(c, signal["date"][5:16].replace("T", " / "), 87, y - 56, INK, 6)
        c.setFont("Helvetica-Bold", 11.5)
        c.drawString(190, y - 23, safe(signal["title"])[:54])
        text_block(c, signal["action"], 190, y - 42, 370, "Helvetica", 7.4, 10, INK, 3)
        c.linkURL(signal["sourceUrl"], (36, y - 80, 576, y), relative=0)
        y -= 90

    meta(c, "CLICK ANY ROW IN THE PDF TO OPEN ITS OFFICIAL SOURCE", 36, 75, INK, 6.5)
    footer(c, 2, data)
    c.showPage()


def conflict_and_method(c, data):
    width, height = letter
    c.setFillColor(RED)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    meta(c, "02 / FIRST USEFUL CATCH", 36, 756, INK, 7)
    c.setFont("Helvetica-Bold", 55)
    c.setFillColor(INK)
    c.drawString(36, 690, "FIVE O'CLOCK")
    c.drawString(36, 631, "IS NOT ELEVEN.")

    conflict = next(signal for signal in data["signals"] if signal.get("details", {}).get("deadlineConflict"))
    details = conflict["details"]
    c.setFillColor(PAPER)
    c.rect(36, 490, 250, 102, fill=1, stroke=1)
    c.rect(326, 490, 250, 102, fill=1, stroke=1)
    meta(c, "LISTING HEADER", 51, 566, INK, 6.5)
    meta(c, "OFFICIAL PACKET", 341, 566, INK, 6.5)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(51, 530, "5:00 PM")
    c.drawString(341, 530, "11:00 AM PDT")
    meta(c, "SEPTEMBER 16, 2026", 51, 507, INK, 6.5)
    meta(c, "SEPTEMBER 16, 2026", 341, 507, INK, 6.5)
    c.linkURL(conflict["sourceUrl"], (36, 490, 286, 592), relative=0)
    c.linkURL(conflict["packetUrl"], (326, 490, 576, 592), relative=0)

    text_block(c, details["deadlineConflictNote"], 36, 452, 540, "Helvetica-Bold", 10.5, 15, INK)

    c.setFillColor(INK)
    c.rect(0, 0, width, 370, fill=1, stroke=0)
    meta(c, "03 / A SCRAPER WITH A BRAKE PEDAL", 36, 338, ACID, 7)
    steps = [
        ("01", "OFFICIAL DOOR", "Known City listing, event, or PDF."),
        ("02", "BOUNDED READ", "One URL. No bypass. A 403 is a result."),
        ("03", "SMALL RECORD", "Title, time, status, availability, source."),
        ("04", "HUMAN CHECK", "Candidate data is verified before promotion."),
        ("05", "PUBLIC TWIN", "HTML, JSON, checked time, and change state."),
    ]
    y = 292
    for number, title, body in steps:
        c.setStrokeColor(HexColor("#5D7469"))
        c.line(36, y - 35, 576, y - 35)
        meta(c, number, 36, y, ACID, 7)
        meta(c, title, 74, y, WHITE, 7)
        text_block(c, body, 220, y, 356, "Helvetica", 8.5, 11, WHITE, 2)
        y -= 52
    footer(c, 3, data, dark=True)
    c.showPage()


def compact_and_sources(c, data):
    width, height = letter
    c.setFillColor(LAVENDER)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    meta(c, "04 / PUBLIC READER COMPACT", 36, 756, INK, 7)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 36)
    c.drawString(36, 711, "USEFUL WITHOUT A DOSSIER.")

    y = 676
    for index, rule in enumerate(data["compact"], start=1):
        c.setStrokeColor(INK)
        c.line(36, y - 30, 576, y - 30)
        meta(c, f"{index:02d}", 36, y, INK, 6.5)
        text_block(c, rule, 76, y, 500, "Helvetica-Bold", 8.2, 11, INK, 2)
        y -= 38

    c.setFillColor(ACID)
    c.rect(0, 0, width, 315, fill=1, stroke=0)
    meta(c, "05 / SOURCE DESK + EDITION", 36, 286, INK, 7)
    c.setFont("Helvetica-Bold", 19)
    c.drawString(36, 254, "THE SOURCE KEEPS AUTHORITY.")
    source_y = 226
    for index, source in enumerate(data["sources"], start=1):
        meta(c, f"{index:02d} / {source['kind']}", 36, source_y, INK, 6)
        c.setFont("Helvetica-Bold", 8.3)
        c.drawString(202, source_y, safe(source["label"])[:52])
        c.linkURL(source["url"], (36, source_y - 6, 576, source_y + 9), relative=0)
        source_y -= 23

    c.setFillColor(INK)
    c.rect(36, 62, 540, 62, fill=1, stroke=0)
    c.setFillColor(ACID)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, 82, "100 FREE / TEZOS / OBJKT")
    meta(c, "PDF READY / MINT NOT SIGNED", 390, 86, ACID, 5.2)
    c.linkURL(data["canonical"], (36, 62, 576, 124), relative=0)
    footer(c, 4, data)
    c.showPage()


def build(output, data):
    output.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(output), pagesize=letter, pageCompression=1)
    c.setTitle(safe(data["edition"]["title"]))
    c.setAuthor("Michael Hoydich and Codex for PointCast")
    c.setSubject("Source-linked public baseline for El Segundo civic packets and deadlines")
    c.setKeywords("PointCast, civic packets, El Segundo, Firecrawl, public records, OBJKT, Tezos")
    cover(c, data)
    signal_board(c, data)
    conflict_and_method(c, data)
    compact_and_sources(c, data)
    c.save()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(ROOT / "output" / "pdf" / "civic-packet-watch-field-edition.pdf"))
    parser.add_argument("--public-copy")
    args = parser.parse_args()
    data = json.loads(DATA_PATH.read_text())
    output = Path(args.output).expanduser().resolve()
    build(output, data)
    print(f"wrote {output}")
    if args.public_copy:
        public_copy = Path(args.public_copy).expanduser().resolve()
        public_copy.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(output, public_copy)
        print(f"copied {public_copy}")


if __name__ == "__main__":
    main()
