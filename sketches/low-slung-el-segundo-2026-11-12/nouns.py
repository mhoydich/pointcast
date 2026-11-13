"""Ten original, deterministically drawn pixel characters for LOW SLUNG.

No image-generation model is used. Every coloured pixel is specified by these
geometric drawing commands. Nouns-inspired visual language, custom original
traits; these are not official Nouns tokens or reconstructions of minted Nouns.
API: draw_noun(index: int) -> a fresh 32 x 40 RGBA PIL Image, indices 1..10.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

NAMES = {
    1: "Louver Fern", 2: "Leafcatch", 3: "Figfold", 4: "Agave Dial",
    5: "Gutterbloom", 6: "Pepperwing", 7: "Rootglass",
    8: "Nasturtium Loop", 9: "Saltmoth", 10: "Ripplepod",
}
TRAITS = {
    1: {"head": "Louver blinds with climbing fern", "body": "Terracotta work shirt", "noggles": "Midnight blue"},
    2: {"head": "Pool-skimmer mesh with sycamore leaves", "body": "Chartreuse lifeguard tee", "noggles": "Aubergine"},
    3: {"head": "Folded bath towel with fig and fig leaf", "body": "Periwinkle short-sleeve shirt", "noggles": "Bottle green"},
    4: {"head": "Agave fan growing from a clock-shaped planter", "body": "Papaya striped tee", "noggles": "Ink blue"},
    5: {"head": "Rain-gutter elbow with oxalis flowers", "body": "Lagoon rain jacket", "noggles": "Oxide red"},
    6: {"head": "Pepper-tree canopy with pink berries", "body": "Cream and rose camp shirt", "noggles": "Dark plum"},
    7: {"head": "Square propagation jar with exposed roots", "body": "Tomato gardening shirt", "noggles": "Deep cobalt"},
    8: {"head": "Terracotta loop with climbing nasturtium", "body": "Emerald workwear", "noggles": "Midnight violet"},
    9: {"head": "Angular salt moth with sea-glass wing marks", "body": "Violet night shirt", "noggles": "Dark teal"},
    10: {"head": "Jacaranda pod containing concentric water ripples", "body": "Butter-yellow pool shirt", "noggles": "Charcoal violet"},
}
CHARACTERS = [{"index": i, "name": NAMES[i], "traits": TRAITS[i],
               "provenance": "Original code-drawn Nouns-inspired pixel design; not an official Nouns token"}
              for i in range(1, 11)]


def draw_noun(i: int) -> Image.Image:
    if i not in NAMES:
        raise ValueError("Character index must be in 1..10")
    im = Image.new("RGBA", (32, 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    def r(box, c): d.rectangle(box, fill=c)
    def p(points, c): d.polygon(points, fill=c)
    def ln(points, c, w=1): d.line(points, fill=c, width=w)

    # A clean stepped full body is part of the visual system. Clothes differ.
    shirts = [None, "#BF653E", "#D5D947", "#8B8ED0", "#F17E39", "#367E87", "#E6D6BD", "#E3503C", "#3B8C62", "#69619A", "#EED88A"]
    shadows = [None, "#8D442C", "#8B983D", "#555B97", "#AB4A2F", "#245562", "#AF776B", "#A52F36", "#255E47", "#403E6D", "#BC935B"]
    skin = "#E6BE8C"
    r((12, 25, 20, 29), skin)
    p([(9,28),(23,28),(23,30),(26,30),(26,35),(23,35),(23,37),(9,37),(9,35),(6,35),(6,30),(9,30)], shirts[i])
    r((23,31,26,35), shadows[i]); r((6,34,8,36),skin); r((24,34,26,36),skin)
    r((10,37,14,39),"#26323E"); r((19,37,23,39),"#26323E")
    if i in (1,3,6,7,8):
        r((16,29,16,36),shadows[i]); r((11,31,13,33),shadows[i])
        r((16,30,16,30),"#F8EDCC"); r((16,34,16,34),"#F8EDCC")
    if i==4:
        r((9,31,22,32),"#F9C483"); r((9,35,22,35),"#F9C483")
    if i==2: r((11,31,20,32),"#F3E8BE")
    if i==5:
        ln([(11,29),(16,32),(21,29)],"#80B8B2"); r((16,32,16,37),"#183E4C")
    if i==9: r((12,31,13,32),"#D6CB8C")
    if i==10: r((11,30,13,33),"#E4964A")

    # All heads have separate silhouettes; facial bands preserve legibility.
    if i == 1:
        r((5,6,26,26),"#567884")
        for y in (6,10,14,18,22):
            r((4,y,25,y+2),"#C8D9CE"); r((7,y+2,26,y+3),"#89ADB0")
        ln([(22,12),(23,8),(22,4),(24,1)],"#285B48",2)
        for x,y in [(22,3),(21,5),(23,7),(20,8),(24,2)]:
            r((x-2,y,x,y+1),"#4D8C5B")
        frame="#172E48"; lens="#EEDFA4"
    elif i == 2:
        p([(7,4),(25,4),(28,7),(28,23),(25,26),(6,26),(3,23),(3,8)],"#35787A")
        r((6,7,25,23),"#A3CBC1")
        for x in range(7,25,3): ln([(x,7),(x,23)],"#6F9D99")
        for y in range(8,24,3): ln([(6,y),(25,y)],"#6F9D99")
        p([(10,4),(11,7),(15,6),(13,9),(14,12),(11,11),(8,13),(9,9),(6,8),(9,7)],"#CA8741")
        p([(23,10),(24,13),(27,14),(25,16),(26,19),(23,18),(21,20),(21,16),(18,14),(22,13)],"#DAAA46")
        p([(12,20),(15,21),(16,25),(13,25),(10,23)],"#A56B3D")
        frame="#512D48"; lens="#D7ECAF"
    elif i == 3:
        p([(7,6),(22,6),(25,9),(27,9),(27,26),(4,26),(4,11),(7,11)],"#E9DDBC")
        r((5,12,26,14),"#C1BB9D"); r((6,22,26,23),"#C1BB9D")
        r((7,8,22,10),"#FFF0CD"); r((8,24,24,25),"#FFF0CD")
        r((7,10,22,11),"#9EA49B")
        p([(21,8),(22,4),(25,5),(27,2),(28,6),(31,7),(27,9),(26,13),(24,10)],"#4F7752")
        p([(24,5),(26,8),(25,11)],"#7D9B57")
        p([(20,8),(22,7),(24,9),(24,13),(22,15),(19,13),(19,10)],"#77516F")
        r((21,9,21,11),"#AB7796")
        frame="#204B46"; lens="#E8D39C"
    elif i == 4:
        p([(7,11),(24,11),(27,14),(27,24),(24,27),(7,27),(4,24),(4,14)],"#A2B694")
        r((8,13,23,25),"#CDD0AB")
        # Fan has unequal succulent blades, each stepped and sculptural.
        p([(13,13),(9,9),(6,2),(10,4),(15,10)],"#527C65")
        p([(15,12),(13,7),(14,0),(17,4),(17,12)],"#7D9A6B")
        p([(17,12),(18,7),(24,1),(24,5),(20,11)],"#345D55")
        p([(20,13),(24,8),(29,6),(27,11),(23,14)],"#729A79")
        p([(11,13),(7,11),(2,11),(7,15)],"#6D8B65")
        ln([(16,22),(16,24),(19,24)],"#6D8061")
        frame="#26374C"; lens="#F6D88C"
    elif i == 5:
        p([(5,8),(25,8),(25,11),(28,11),(28,24),(24,27),(7,27),(4,24),(4,11)],"#748F91")
        r((7,11,24,23),"#ADBAB1"); r((4,8,26,10),"#B9CABD")
        r((7,25,23,27),"#4B7179")
        r((9,6,22,8),"#344C4B")
        for x,y in [(10,5),(16,3),(23,5)]:
            ln([(x,10),(x,y)],"#47744B")
            r((x-2,y,x+2,y),"#E9CE49");r((x,y-2,x,y+2),"#E9CE49");r((x,y,x,y),"#E89831")
        r((19,8,21,9),"#72A466")
        frame="#773E37"; lens="#DDE5C1"
    elif i == 6:
        p([(8,10),(24,10),(26,16),(25,25),(7,25),(5,17)],"#DFCAAA")
        p([(3,7),(8,5),(13,6),(17,3),(23,4),(28,7),(30,12),(27,14),(23,11),(20,12),(16,9),(13,12),(8,10),(5,15),(2,12)],"#597E5D")
        for x,y in [(5,8),(8,6),(11,9),(17,6),(21,7),(26,10)]:
            r((x,y,x+2,y+1),"#83A16D")
        for x,y in [(4,12),(7,11),(11,13),(20,11),(24,13),(28,12),(6,15),(26,16)]:
            r((x,y,x+1,y+1),"#BC5870")
            r((x+1,y+2,x+2,y+3),"#D97885")
        frame="#4A3145"; lens="#E0D19F"
    elif i == 7:
        p([(6,7),(25,7),(25,10),(27,10),(27,25),(24,27),(6,27),(4,24),(4,10),(6,10)],"#6DA49E")
        r((6,11,25,24),"#B9D8C4"); r((6,7,25,9),"#D7E4C9")
        r((8,11,9,23),"#DFE8CC"); r((22,11,24,23),"#94BDB3")
        ln([(16,8),(15,15),(17,20),(14,25)],"#F6E3AE")
        ln([(16,15),(12,18),(13,22),(10,25)],"#F6E3AE")
        ln([(16,17),(20,21),(19,25)],"#F6E3AE")
        ln([(16,9),(17,4),(16,1)],"#416F4F",2)
        p([(17,5),(19,1),(24,1),(22,4),(18,6)],"#4F8D55")
        p([(16,4),(12,1),(8,1),(10,4),(15,6)],"#78A55D")
        frame="#24465A"; lens="#D9E5A7"
    elif i == 8:
        p([(6,5),(24,5),(27,8),(27,25),(24,27),(6,27),(3,24),(3,8)],"#B76040")
        r((7,9,23,23),"#E1B08B"); r((10,10,20,22),"#6D8F62")
        r((5,7,24,8),"#DB8653");r((24,10,26,24),"#91482F")
        ln([(7,25),(5,20),(7,13),(5,8),(8,3),(13,3),(16,7),(23,6),(26,2)],"#366548",2)
        for x,y in [(7,5),(4,14),(9,21),(25,4)]:
            p([(x-2,y-1),(x+1,y-2),(x+3,y),(x+2,y+2),(x-1,y+2),(x-2,y)],"#72935C")
        for x,y in [(15,4),(26,10)]:
            r((x-1,y-2,x+1,y+2),"#F3AA41");r((x-2,y-1,x+2,y+1),"#EA8936");r((x,y,x,y),"#B65A33")
        frame="#363443"; lens="#EED491"
    elif i == 9:
        p([(3,4),(8,5),(14,12),(15,24),(11,27),(7,25),(7,22),(3,20),(1,14),(1,8)],"#D9C8A2")
        p([(29,4),(24,5),(18,12),(17,24),(21,27),(25,25),(25,22),(29,20),(31,14),(31,8)],"#C6B799")
        p([(3,6),(7,7),(12,13),(10,18),(5,16)],"#EADFBD")
        p([(29,6),(25,7),(20,13),(22,18),(27,16)],"#EADFBD")
        r((4,10,8,14),"#6DABA6");r((24,10,28,14),"#6DABA6")
        r((5,11,7,13),"#BCD7C3");r((25,11,27,13),"#BCD7C3")
        p([(13,10),(19,10),(21,22),(18,27),(14,27),(11,22)],"#EFE2BC")
        ln([(14,11),(12,6),(10,5)],"#6F695C");ln([(18,11),(20,6),(22,5)],"#6F695C")
        r((5,21,9,22),"#A79678");r((23,21,27,22),"#A79678")
        frame="#294E54"; lens="#D4DEBB"
    else:
        p([(9,5),(23,5),(27,9),(29,17),(27,24),(22,28),(10,28),(5,24),(3,17),(5,10)],"#78637B")
        p([(10,8),(22,8),(25,11),(26,21),(22,25),(10,25),(6,21),(6,12)],"#ADA0A2")
        r((9,11,23,23),"#669BA2")
        # Rings are deliberately squared to retain the code/pixel vocabulary.
        for box,c in [((8,10,24,24),"#9CC6BD"),((10,12,22,22),"#336F89"),((12,14,20,20),"#C3D8C6"),((14,16,18,18),"#4A92AD")]:
            d.rectangle(box,outline=c,width=1)
        p([(17,5),(18,2),(22,2),(25,4),(22,6),(19,7)],"#B198C5")
        r((20,3,22,4),"#D4BDDA")
        frame="#3D354D"; lens="#E0D4B2"

    # Original rectangular frames use the recognizable Nouns proportions.
    # Glasses deliberately sit on top of all head marks for a strong face.
    r((4,14,13,21),frame);r((17,14,26,21),frame)
    r((13,16,17,18),frame);r((2,14,4,16),frame)
    r((7,16,11,19),lens);r((20,16,24,19),lens)
    # Single offset pupil column; expression stays calm and neutral.
    r((9,16,10,19),"#182931");r((22,16,23,19),"#182931")
    return im


def write_previews(out_dir=None):
    out = Path(out_dir or Path(__file__).parent / "noun-previews")
    out.mkdir(parents=True,exist_ok=True)
    font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",22)
    sheet=Image.new("RGB",(1800,1050),"#E9E4D7");sd=ImageDraw.Draw(sheet)
    for i in range(1,11):
        sprite=draw_noun(i)
        sprite.save(out/f"noun-{i:02}.png")
        big=sprite.resize((256,320),Image.Resampling.NEAREST)
        x=((i-1)%5)*360+52;y=((i-1)//5)*525+55
        sheet.paste(big,(x,y),big)
        sd.text((x-16,y+350),f"{i:02}  {NAMES[i]}",font=font,fill="#2D3C3E")
    sheet.save(out/"noun-contact-sheet.png")
    return out/"noun-contact-sheet.png"


if __name__=="__main__":
    print(write_previews())
