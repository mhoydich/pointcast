#!/usr/bin/env python3
"""Generate the twelve-page companion to PointCast Noticing Issue 04."""

from pathlib import Path
from textwrap import wrap

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/downloads/a-calendar-is-a-treaty-field-edition.pdf"
ART = ROOT / "public/images/noticing/calendar-issue-04"
W, H = letter

INK = HexColor("#101B2B")
PAPER = HexColor("#F4ECDA")
YELLOW = HexColor("#F0B523")
BLUE = HexColor("#2F7392")
TIDE = HexColor("#8AB7BD")
ORANGE = HexColor("#D95C2B")
FOG = HexColor("#C8CED0")
WHITE = HexColor("#FFF8E9")


def text_lines(c, text, x, y, width, font="Times-Roman", size=14, leading=19, color=INK):
    c.setFillColor(color)
    c.setFont(font, size)
    chars = max(12, int(width / (size * 0.52)))
    for paragraph in text.split("\n"):
        lines = wrap(paragraph, width=chars, break_long_words=False) or [""]
        for line in lines:
            c.drawString(x, y, line)
            y -= leading
        y -= leading * 0.45
    return y


def label(c, text, x, y, color=ORANGE):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x, y, text.upper())


def rule(c, y, color=Color(0.06, 0.1, 0.17, alpha=0.35)):
    c.setStrokeColor(color)
    c.setLineWidth(0.6)
    c.line(42, y, W - 42, y)


def footer(c, page, title, dark=False):
    color = WHITE if dark else INK
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 6.8)
    c.drawString(42, 24, "POINTCAST / WHAT I KEEP NOTICING / 04.A")
    c.drawRightString(W - 42, 24, f"{page:02d} / {title.upper()}")


def title(c, kicker, heading, sub=None, dark=False):
    color = WHITE if dark else INK
    label(c, kicker, 42, H - 52, YELLOW if dark else ORANGE)
    c.setFillColor(color)
    c.setFont("Times-Bold", 40)
    y = H - 105
    for line in wrap(heading, width=24):
        c.drawString(42, y, line)
        y -= 40
    if sub:
        y -= 8
        y = text_lines(c, sub, 42, y, W - 84, "Times-Roman", 15, 20, color)
    return y


def image_cover(c, image, wash=Color(0.04, 0.08, 0.14, alpha=0.58)):
    c.drawImage(str(image), 0, 0, width=W, height=H, preserveAspectRatio=True, anchor="c", mask="auto")
    c.setFillColor(wash)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def page_one(c):
    image_cover(c, ART / "week-has-weather.webp")
    label(c, "PointCast / What I Keep Noticing / Field Edition 04.A", 42, H - 48, YELLOW)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(42, H - 132, "HOW TO CALENDAR A LIFE, OR:")
    c.setFont("Helvetica-Bold", 56)
    c.drawString(38, H - 210, "A CALENDAR")
    c.setFillColor(YELLOW)
    c.setFont("Times-Italic", 66)
    c.drawString(42, H - 276, "is a treaty")
    c.setFillColor(WHITE)
    c.setFont("Times-Roman", 17)
    c.drawString(42, 118, "A free twelve-page field edition for an inhabitable week.")
    c.setFont("Helvetica-Bold", 8)
    c.drawString(42, 88, "ANCHORS / SHADOWS / TIDES / WEATHER / COMMONS")
    c.setFillColor(YELLOW)
    c.rect(42, 48, 138, 22, fill=1, stroke=0)
    c.setFillColor(INK)
    c.drawString(51, 56, "PRINT / MARK / PASS ALONG")


def page_two(c):
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    y = title(c, "00 / The proposition", "The rectangle is accurate about the meeting.", "It is dishonest about the day.")
    y -= 26
    copy = (
        "A calendar invitation has a clean edge. Life does not. The visible event omits "
        "preparation, travel, switching, setup, cleanup, recovery, and the fact that capacity "
        "changes even when the grid does not.\n"
        "This booklet keeps the grid and adds the dimensions it forgets. It is not a system "
        "for perfect control. It is a small treaty with your future self, written so the week "
        "can be lived as well as scheduled."
    )
    text_lines(c, copy, 42, y, 360, size=14, leading=20)
    c.setFillColor(BLUE)
    c.rect(430, 140, 140, 300, fill=1, stroke=0)
    c.setFillColor(YELLOW)
    c.circle(470, 390, 22, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.circle(506, 402, 17, fill=1, stroke=0)
    text_lines(c, "The goal is not a perfectly defended week. It is a week whose costs and openings can be seen.", 450, 345, 100, "Times-Bold", 15, 19, WHITE)
    footer(c, 2, "The proposition")


def page_three(c):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    title(c, "01 / Five treaty terms", "Keep the grid. Add what it forgets.")
    terms = [
        ("01", "ANCHORS", "Promises involving other people. The parts of the week that cannot move without consequence.", YELLOW),
        ("02", "SHADOWS", "Preparation, travel, switching, setup, cleanup, and return. Every yes casts one.", INK),
        ("03", "TIDES", "Sleep, food, movement, caregiving, medication, daylight, and the body's recurring needs.", TIDE),
        ("04", "WEATHER", "A light forecast of capacity: open, mixed, or dense. No score and no moral rank.", FOG),
        ("05", "COMMONS", "Time deliberately left unclaimed, available for arrival, repair, surprise, and shared life.", PAPER),
    ]
    y = 588
    for number, name, copy, color in terms:
        c.setFillColor(color)
        c.rect(42, y - 74, W - 84, 76, fill=1, stroke=0)
        c.setFillColor(WHITE if color == INK else INK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(53, y - 18, number)
        c.setFont("Helvetica-Bold", 19)
        c.drawString(86, y - 23, name)
        text_lines(c, copy, 250, y - 17, 310, "Times-Roman", 10.5, 13.5, WHITE if color == INK else INK)
        y -= 88
    footer(c, 3, "Treaty terms")


def page_four(c):
    image_cover(c, ART / "every-yes-casts-a-shadow.webp", Color(0.03, 0.06, 0.1, alpha=0.67))
    title(c, "02 / Instrument", "The true footprint", "How long is a thirty-minute meeting?", dark=True)
    items = [("VISIBLE EVENT", "30"), ("PREPARE", "+10"), ("TRAVEL / SETUP", "+20"), ("RETURN / RECOVER", "+20")]
    y = 470
    for name, minutes in items:
        c.setStrokeColor(WHITE)
        c.line(42, y, W - 42, y)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(42, y - 25, name)
        c.setFillColor(YELLOW if "+" in minutes else ORANGE)
        c.setFont("Helvetica-Bold", 28)
        c.drawRightString(W - 42, y - 31, minutes)
        y -= 68
    c.setFillColor(YELLOW)
    c.rect(42, 116, W - 84, 78, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(54, 164, "ONE RECTANGLE")
    c.setFont("Helvetica-Bold", 38)
    c.drawRightString(W - 54, 142, "80 MINUTES")
    c.setFont("Helvetica-Bold", 8)
    c.drawString(54, 133, "THE WEEK PAYS THE WHOLE FOOTPRINT")
    footer(c, 4, "True footprint", dark=True)


def page_five(c):
    c.setFillColor(BLUE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    title(c, "03 / Weather", "A week has weather.", "Forecast capacity lightly. Do not turn it into a diagnosis.", dark=True)
    states = [("MON", "MIXED"), ("TUE", "DENSE"), ("WED", "OPEN"), ("THU", "MIXED"), ("FRI", "DENSE"), ("SAT", "OPEN"), ("SUN", "OPEN")]
    x, y = 42, 465
    for index, (day, state) in enumerate(states):
        col = index % 4
        row = index // 4
        bx, by = x + col * 130, y - row * 150
        fill = YELLOW if state == "OPEN" else (FOG if state == "MIXED" else INK)
        c.setFillColor(fill)
        c.rect(bx, by, 116, 120, fill=1, stroke=0)
        c.setFillColor(INK if state != "DENSE" else WHITE)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(bx + 10, by + 96, day)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(bx + 10, by + 15, state)
    text_lines(c, "Three open squares. Enough room for arrival if they remain unclaimed.", 42, 130, W - 84, "Times-Bold", 20, 26, WHITE)
    footer(c, 5, "Capacity weather", dark=True)


def page_six(c):
    image_cover(c, ART / "leave-a-square-for-arrival.webp", Color(0.96, 0.93, 0.84, alpha=0.30))
    c.setFillColor(PAPER)
    c.roundRect(42, 86, 305, 600, 4, fill=1, stroke=0)
    title(c, "04 / Commons", "Leave a square for arrival.")
    copy = (
        "Unclaimed time is not failed productivity. It is where a late conversation can finish, "
        "where a child can need something, where weather can alter the route, where a neighbor can "
        "be helped, and where a person can remember a desire that was not entered into a system.\n"
        "A commons is protected by refusing to name its future use too precisely."
    )
    text_lines(c, copy, 62, 505, 258, size=13, leading=18)
    c.setStrokeColor(INK)
    c.setLineWidth(2)
    c.rect(390, 165, 165, 165, fill=0, stroke=1)
    label(c, "available for arrival", 406, 145, INK)
    footer(c, 6, "Commons")


def page_seven(c):
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    title(c, "05 / Refrigerator-door protocol", "Eight clauses for an inhabitable week.")
    clauses = [
        "Mark the promises that involve other people.",
        "Give each anchor an honest shadow.",
        "Put bodily tides on the same map as work.",
        "Name the week's weather in one sentence.",
        "Leave at least one square deliberately open.",
        "Do not use openness as hidden inventory.",
        "Renegotiate before resentment becomes the system.",
        "Begin again next week; the treaty remains amendable.",
    ]
    y = 560
    for index, clause in enumerate(clauses, 1):
        rule(c, y + 15)
        c.setFillColor(ORANGE if index in (2, 5, 8) else INK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(42, y - 3, f"{index:02d}")
        text_lines(c, clause, 82, y, 480, "Times-Roman", 12.5, 16, INK)
        y -= 55
    footer(c, 7, "Eight clauses")


def page_eight(c):
    c.setFillColor(INK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    title(c, "06 / Listening rooms", "Let the week have weather.", "Thirty-six tracks arranged as two passages.", dark=True)
    rooms = [
        ("01", "A TREATY WITH THE DAY — SHADOW WORK", "18 tracks / 53 min", ["ARRIVE", "ANCHOR", "INTERRUPTION", "RETURN"], YELLOW),
        ("02", "LEAVE A SQUARE — COMMONS MUSIC", "18 tracks / 1 hr 2 min", ["TIDE", "DRIFT", "GATHER", "OPEN AIR"], TIDE),
    ]
    y = 480
    for number, name, duration, movements, color in rooms:
        c.setStrokeColor(WHITE)
        c.rect(42, y - 154, W - 84, 160, fill=0, stroke=1)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 26)
        c.drawString(56, y - 35, number)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(106, y - 32, name)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(106, y - 52, duration.upper())
        x = 106
        for movement in movements:
            c.setFillColor(color)
            c.rect(x, y - 112, 92, 28, fill=1, stroke=0)
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 7)
            c.drawCentredString(x + 46, y - 101, movement)
            x += 100
        y -= 185
    c.linkURL("https://open.spotify.com/playlist/38YzecNFRdDVnDAxZcHV9d", (42, 326, W - 42, 486), relative=0)
    c.linkURL("https://open.spotify.com/playlist/02VSkAD9uXGZYi1aUVKV5B", (42, 141, W - 42, 301), relative=0)
    footer(c, 8, "Listening rooms", dark=True)


def page_nine(c):
    c.setFillColor(FOG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    title(c, "07 / Visual fields", "Look slowly. Save selectively.", "Two fifty-image boards for the edges around a promise.")
    boards = [
        ("01", "SHADOWS & WEATHER", "Long shadows / marked paper / changing light / weather systems / thresholds", YELLOW),
        ("02", "TIDES & COMMONS", "Tide tables / shared tables / open fields / public rooms / soft boundaries", BLUE),
    ]
    x = 42
    for number, name, copy, color in boards:
        c.setFillColor(color)
        c.rect(x, 190, 250, 360, fill=1, stroke=0)
        c.setFillColor(INK if color == YELLOW else WHITE)
        c.setFont("Helvetica-Bold", 34)
        c.drawString(x + 18, 505, number)
        text_lines(c, name, x + 18, 420, 212, "Helvetica-Bold", 22, 24, INK if color == YELLOW else WHITE)
        text_lines(c, copy, x + 18, 300, 205, "Times-Roman", 12, 17, INK if color == YELLOW else WHITE)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 18, 215, "50 PINS / WALK THE BOARD")
        x += 278
    c.linkURL("https://www.pinterest.com/hoydich/a-calendar-is-a-treaty-shadows-weather/", (42, 190, 292, 550), relative=0)
    c.linkURL("https://www.pinterest.com/hoydich/leave-a-square-tides-commons/", (320, 190, 570, 550), relative=0)
    footer(c, 9, "Visual fields")


def page_ten(c):
    c.setFillColor(YELLOW)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    title(c, "08 / Circulation", "One hundred issues. Sixty free.", "An edition as a reading circle, not an argument for scarcity.")
    for x, number, caption, color in [
        (42, "100", "ISSUES TOTAL", INK),
        (220, "60", "FREE ON OBJKT", BLUE),
        (398, "40", "KEPT IN STUDIO", ORANGE),
    ]:
        c.setFillColor(color)
        c.rect(x, 350, 155, 170, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 46)
        c.drawString(x + 14, 450, number)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 14, 380, caption)
    copy = (
        "One hundred is enough to feel finite without pretending the work is scarce. Sixty free "
        "issues make access the opening gesture. Forty stay with the studio for future readers, "
        "exchanges, exhibitions, and gifts. The PDF itself remains free and ungated."
    )
    text_lines(c, copy, 42, 295, W - 84, "Times-Bold", 15, 21, INK)
    footer(c, 10, "Circulation")


def page_eleven(c):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    title(c, "09 / Source ledger", "Inspect the paper trail.")
    sources = [
        ("S01", "RFC 5545", "Internet Calendaring and Scheduling Core Object Specification"),
        ("S02", "Apple", "Calendar User Guide"),
        ("S03", "Google", "Calendar Help and working-hours behavior"),
        ("S04", "Microsoft", "Work Trend Index workplace telemetry"),
        ("S05", "U.S. Bureau of Labor Statistics", "American Time Use Survey"),
        ("S06", "Malkoc and Tonietto", "Calendar mindset and leisure enjoyment"),
        ("S07", "Leroy", "Attention residue when switching tasks"),
        ("S08", "Sonnentag and Fritz", "Recovery experience research"),
        ("S09", "WHO", "Healthy working-time boundaries"),
        ("S10", "PointCast", "Editorial synthesis: anchors, shadows, tides, weather, commons"),
    ]
    y = 570
    for sid, publisher, detail in sources:
        rule(c, y + 11)
        c.setFillColor(ORANGE)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(42, y, sid)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(82, y, publisher)
        c.setFont("Times-Roman", 9.5)
        c.drawString(235, y, detail[:62])
        y -= 43
    text_lines(c, "Reporting boundary: this practical editorial field guide is not medical, therapeutic, or employment advice. Published studies retain their population and causal limits.", 42, 110, W - 84, "Times-Italic", 10.5, 14, INK)
    footer(c, 11, "Sources")


def page_twelve(c):
    c.setFillColor(INK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(YELLOW)
    c.setFont("Times-Bold", 58)
    c.drawString(42, H - 110, "Leave a square.")
    c.setStrokeColor(WHITE)
    c.setLineWidth(2)
    c.rect(42, 300, 300, 300, fill=0, stroke=1)
    label(c, "this square remains yours", 42, 280, YELLOW)
    text_lines(c, "Write the week's weather here. Or do not.", 385, 535, 170, "Times-Roman", 16, 22, WHITE)
    text_lines(c, "Free PDF / PointCast / 2026\nOriginal editorial plates: Codex image system\nWriting and design: Codex with Michael Hoydich\npointcast.xyz/noticing/how-to-calendar-a-life", 385, 230, 170, "Helvetica", 8.5, 14, WHITE)
    c.linkURL("https://pointcast.xyz/noticing/how-to-calendar-a-life", (385, 160, 560, 245), relative=0)
    footer(c, 12, "Colophon", dark=True)


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=letter, pageCompression=1)
    c.setTitle("A Calendar Is a Treaty — Field Edition")
    c.setAuthor("PointCast / Michael Hoydich with Codex")
    c.setSubject("What I Keep Noticing Issue 04.A: a free twelve-page field edition")
    c.setKeywords("PointCast, calendar, time use, field guide, commons, free edition")
    pages = [page_one, page_two, page_three, page_four, page_five, page_six, page_seven, page_eight, page_nine, page_ten, page_eleven, page_twelve]
    for index, draw in enumerate(pages):
        draw(c)
        if index != len(pages) - 1:
            c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
