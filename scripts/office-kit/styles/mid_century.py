# Office Kit style generator, CC0. Written by a Claude worker on Nov 27 2026.
# Expects real Noun PNGs at /tmp/nm/n{3,5,9,14,21}.png (from https://noun.pics/<id>.png) and writes to /tmp/kitart/mcm/.
import math, random
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageFilter

W, H, S = 1600, 1000, 2
OUT = '/tmp/kitart/mcm/'
NM = '/tmp/nm/n%d.png'
INTER = '/usr/share/fonts/opentype/inter/Inter-%s.otf'

MUSTARD=(226,165,44); MUSTARD_L=(240,201,100); TEAL=(31,122,122); TEAL_L=(95,168,160)
TEAL_D=(20,86,92); ORANGE=(196,86,31); ORANGE_L=(222,128,70); OLIVE=(107,112,48)
OLIVE_L=(150,152,80); CREAM=(243,232,207); CREAM_D=(226,211,176); CHAR=(43,43,46)
WOOD=(184,121,62); WOOD_D=(140,88,45)

def font(w, size): return ImageFont.truetype(INTER % w, size)

class Layer:
    def __init__(self):
        self.im = Image.new('RGBA', (W*S, H*S), (0,0,0,0))
        self.d = ImageDraw.Draw(self.im)
    def P(self, pts): return [(x*S, y*S) for x, y in pts]
    def poly(self, pts, fill): self.d.polygon(self.P(pts), fill=fill)
    def rect(self, x0,y0,x1,y1, fill): self.d.rectangle([x0*S,y0*S,x1*S,y1*S], fill=fill)
    def rrect(self, x0,y0,x1,y1, r, fill): self.d.rounded_rectangle([x0*S,y0*S,x1*S,y1*S], radius=r*S, fill=fill)
    def ell(self, x0,y0,x1,y1, fill): self.d.ellipse([x0*S,y0*S,x1*S,y1*S], fill=fill)
    def circ(self, cx,cy,r, fill): self.ell(cx-r,cy-r,cx+r,cy+r, fill)
    def line(self, pts, w, fill): self.d.line(self.P(pts), fill=fill, width=int(w*S), joint='curve')
    def arc(self, box, a0, a1, w, fill):
        x0,y0,x1,y1 = box
        self.d.arc([x0*S,y0*S,x1*S,y1*S], a0, a1, fill=fill, width=int(w*S))
    def text(self, xy, s, f, fill, anchor='la', tracking=0):
        x, y = xy
        if tracking == 0:
            self.d.text((x*S,y*S), s, font=f, fill=fill, anchor=anchor); return
        # tracked text, left anchored at x
        fs = ImageFont.truetype(f.path, f.size*S)
        total = sum(fs.getlength(c) + tracking*S for c in s) - tracking*S
        cx = x*S
        if anchor[0] == 'm': cx -= total/2
        if anchor[0] == 'r': cx -= total
        for c in s:
            self.d.text((cx, y*S), c, font=fs, fill=fill, anchor='l'+anchor[1])
            cx += fs.getlength(c) + tracking*S
    def mask_layer(self):
        return Image.new('L', (W*S, H*S), 0)

def starburst(cx, cy, r_out, r_in, n, rot=0):
    pts=[]
    for i in range(n*2):
        r = r_out if i%2==0 else r_in
        a = rot + i*math.pi/n
        pts.append((cx+r*math.cos(a), cy+r*math.sin(a)))
    return pts

def kidney(cx, cy, rx, ry, dent=0.45, rot=0, n=120):
    pts=[]
    for i in range(n):
        t = 2*math.pi*i/n
        x = rx*math.cos(t); y = ry*math.sin(t)
        if math.sin(t) < 0:
            y += dent*ry*math.exp(-((x/rx)**2)/0.12)*(-math.sin(t))**0.5
        # lumpy bean skew
        y += 0.12*ry*math.cos(t)
        c, s = math.cos(rot), math.sin(rot)
        pts.append((cx + x*c - y*s, cy + x*s + y*c))
    return pts

def boomerang(cx, cy, R, a0, a1, wmax, n=60):
    out=[]; inn=[]
    for i in range(n+1):
        t = i/n
        a = math.radians(a0 + (a1-a0)*t)
        w = wmax*(math.sin(math.pi*t)**0.55)*0.5 + 2
        # center line
        x = cx + R*math.cos(a); y = cy + R*math.sin(a)
        nx, ny = math.cos(a), math.sin(a)
        out.append((x+nx*w, y+ny*w)); inn.append((x-nx*w, y-ny*w))
    return out + inn[::-1]

def blob_leaf(cx, cy, length, width, ang):
    pts=[]
    for i in range(41):
        t = i/40
        x = length*t; y = width*math.sin(math.pi*t)**0.8
        pts.append((x, y))
    for i in range(40,-1,-1):
        t = i/40
        pts.append((length*t, -width*math.sin(math.pi*t)**0.8))
    c, s = math.cos(ang), math.sin(ang)
    return [(cx+x*c-y*s, cy+x*s+y*c) for x, y in pts]

def halftone(layer, mask_poly_fn, box, color, spacing=14, rmax=5, axis='y', rev=False, rot=45):
    """halftone dot field inside box, clipped by shapes drawn by mask_poly_fn(maskdraw)."""
    dots = Image.new('L', (W*S, H*S), 0)
    dd = ImageDraw.Draw(dots)
    x0,y0,x1,y1 = box
    sp = spacing
    row = 0
    y = y0
    while y < y1:
        x = x0 + (sp/2 if row%2 else 0)
        while x < x1:
            t = ((y-y0)/(y1-y0)) if axis=='y' else ((x-x0)/(x1-x0))
            if rev: t = 1-t
            r = rmax*t
            if r > 0.6:
                dd.ellipse([(x-r)*S,(y-r)*S,(x+r)*S,(y+r)*S], fill=255)
            x += sp
        y += sp*0.5; row += 1
    m = Image.new('L', (W*S, H*S), 0)
    mask_poly_fn(ImageDraw.Draw(m))
    dots = ImageChops.multiply(dots, m)
    layer.im.paste(Image.new('RGBA',(W*S,H*S), color+(255,)), mask=dots)

def shift_ch(ch, dx, dy):
    o = Image.new('L', ch.size, 0)
    o.paste(ch, (dx, dy))
    # fill exposed edges from original
    if dx > 0: o.paste(ch.crop((0,0,dx,H)), (0,0))
    if dx < 0: o.paste(ch.crop((W+dx,0,W,H)), (W+dx,0))
    if dy > 0: o.paste(ch.crop((0,0,W,dy)), (0,0))
    if dy < 0: o.paste(ch.crop((0,H+dy,W,H)), (0,H+dy))
    return o

def finish(layer, seed, grain=9, shift=True):
    im = layer.im.resize((W, H), Image.LANCZOS)
    r,g,b,a = im.split()
    rnd = random.Random(seed)
    if shift:
        r = shift_ch(r, 1, 0); b = shift_ch(b, -1, 1)
    rgb = Image.merge('RGB', (r,g,b))
    # grain
    n1 = Image.effect_noise((W,H), grain*2.2)
    n2 = Image.effect_noise((W//3+1,H//3+1), grain*1.4).resize((W,H), Image.BICUBIC)
    n = ImageChops.blend(n1, n2, 0.4)
    rgb = ImageChops.add(rgb, Image.merge('RGB',(n,n,n)), 1.0, -128)
    # fine paper speckles
    sp = Image.new('L',(W,H),128); sd = ImageDraw.Draw(sp)
    for _ in range(2200):
        x, y = rnd.randrange(W), rnd.randrange(H)
        sd.point((x,y), fill=rnd.choice([90,100,165,175]))
    rgb = ImageChops.add(rgb, Image.merge('RGB',(sp,sp,sp)), 1.0, -128)
    return Image.merge('RGBA', (*rgb.split(), a))

def load_noun(n):
    im = Image.open(NM % n).convert('RGBA').resize((32,32), Image.NEAREST)
    px = im.load(); bg = px[0,0]
    for y in range(32):
        for x in range(32):
            if px[x,y] == bg: px[x,y] = (0,0,0,0)
    return im

def noun_bbox(n):
    return load_noun(n).getbbox()

def paste_noun(canvas, n, cx, bottom, scale):
    """Whole 32x32 noun, scaled by integer factor. cx = centre of content bbox; bottom = y of frame bottom."""
    im = load_noun(n)
    bb = im.getbbox()
    big = im.resize((32*scale, 32*scale), Image.NEAREST)
    ccx = (bb[0]+bb[2])/2*scale
    x = int(round(cx - ccx)); y = int(round(bottom - 32*scale))
    canvas.alpha_composite(big, (x, y))
    return (x + bb[0]*scale, y + bb[1]*scale, x + bb[2]*scale, y + 32*scale)

def corner_label(layer, color, anchor='br', pos=None):
    f = font('SemiBold', 15)
    if pos is None: pos = (W-44, H-38) if anchor == 'br' else (44, H-38)
    layer.text(pos, 'OFFICE KIT  ·  CC0', f, color, anchor=anchor[0]+'a' if False else ('ra' if anchor=='br' else 'la'), tracking=3)

def new_canvas(color):
    return Image.new('RGBA', (W,H), color+(255,))

# ---------------------------------------------------------------- piece 1
def clock(L, cx, cy, R):
    # starburst clock
    L.circ(cx, cy, R*0.34+10, CHAR)
    for i in range(12):
        a = math.radians(i*30 - 90)
        long = i % 3 == 0
        rl = R if long else R*0.82
        w = 0.07 if long else 0.055
        tip = (cx + rl*math.cos(a), cy + rl*math.sin(a))
        b1 = (cx + R*0.3*math.cos(a+w*2.4), cy + R*0.3*math.sin(a+w*2.4))
        b2 = (cx + R*0.3*math.cos(a-w*2.4), cy + R*0.3*math.sin(a-w*2.4))
        L.poly([b1, tip, b2], MUSTARD if long else ORANGE)
        L.circ(*tip, 9 if long else 7, CHAR if long else CREAM)
    # secondary short rays
    for i in range(12):
        a = math.radians(i*30 - 75)
        tip = (cx + R*0.62*math.cos(a), cy + R*0.62*math.sin(a))
        b1 = (cx + R*0.3*math.cos(a+0.12), cy + R*0.3*math.sin(a+0.12))
        b2 = (cx + R*0.3*math.cos(a-0.12), cy + R*0.3*math.sin(a-0.12))
        L.poly([b1, tip, b2], CHAR)
    L.circ(cx, cy, R*0.34, CREAM)
    L.circ(cx, cy, R*0.34-8, CREAM_D)
    L.circ(cx, cy, R*0.34-11, CREAM)
    # tick dots
    for i in range(12):
        a = math.radians(i*30-90)
        L.circ(cx+(R*0.27)*math.cos(a), cy+(R*0.27)*math.sin(a), 3.2, CHAR)
    # hands: 9:00 -> hour hand left, minute hand up
    L.line([(cx,cy),(cx-R*0.2,cy)], 8, CHAR); L.poly([(cx-R*0.2,cy-5),(cx-R*0.27,cy),(cx-R*0.2,cy+5)], CHAR)
    L.line([(cx,cy),(cx,cy-R*0.26)], 5, CHAR); 
    L.circ(cx, cy, 7, ORANGE)

def piece1():
    can = new_canvas(CREAM)
    L = Layer()
    L.rect(0,0,W,H,CREAM)
    # floor
    L.rect(0,800,W,H,OLIVE)
    L.rect(0,800,W,812,OLIVE_L)
    # wainscot band
    L.rect(0,640,W,800,TEAL)
    L.rect(0,640,W,650,TEAL_D)
    # big wall shapes: kidney in mustard pale
    # window
    L.rect(70,70,560,640,CHAR)
    L.rect(86,86,544,624,MUSTARD_L)
    # sunrise: bands + sun + rays
    L.rect(86,420,544,624,ORANGE_L)
    L.rect(86,330,544,420,MUSTARD)
    for a in range(-80,81,14):
        pass
    sun_c=(315,420)
    for i in range(13):
        a = math.radians(180 + i*15)
        L.poly([sun_c,(sun_c[0]+500*math.cos(a-0.035),sun_c[1]+500*math.sin(a-0.035)),(sun_c[0]+500*math.cos(a+0.035),sun_c[1]+500*math.sin(a+0.035))], (244,214,120))
    # clip rays to window by redrawing frame cover
    L.rect(0,0,W,86,CREAM); L.rect(0,0,86,H,CREAM)
    L.rect(544,0,W,H,CREAM)
    L.rect(0,624,W,H,CREAM)
    # re-draw wall elements hidden by cover: simplest -- redraw wall pieces after
    L2 = L
    # (cover rectangles above overdraw bg; restore bg)
    L.rect(0,640,W,800,TEAL); L.rect(0,640,W,650,TEAL_D)
    L.rect(0,800,W,H,OLIVE); L.rect(0,800,W,812,OLIVE_L)
    L.rect(70,70,86,640,CHAR); L.rect(544,70,560,640,CHAR); L.rect(70,70,560,86,CHAR); L.rect(70,624,560,640,CHAR)
    L.circ(315,420,78, ORANGE)
    L.rect(86,420,544,624,ORANGE_L)
    L.circ(315,420,0.1, ORANGE)
    # mullions
    L.rect(309,86,321,624,CHAR); L.rect(86,300,544,312,CHAR)
    # sill
    L.rect(54,640,576,664,CHAR)
    # distant hills in window lower
    L.poly([(86,560),(180,505),(260,540),(340,490),(440,530),(544,500),(544,624),(86,624)], OLIVE)
    L.poly([(86,590),(200,555),(330,585),(440,560),(544,580),(544,624),(86,624)], TEAL_D)
    # redraw mullions on top
    L.rect(309,86,321,624,CHAR); L.rect(86,300,544,312,CHAR)
    L.poly(kidney(1010,330,420,250,0.35,rot=-0.1), (236,218,166))
    # clock panel: teal rounded
    L.rrect(870,60,1470,560,40,TEAL)
    L.rrect(886,76,1454,544,30,TEAL_D)
    clock(L, 1170, 300, 210)
    # pendant lamp
    L.line([(760,0),(760,150)], 3, CHAR)
    L.circ(760,205,56, CREAM_D); L.circ(760,205,50, CREAM)
    L.rect(750,140,770,155, CHAR)
    L.poly([(722,196),(798,196),(790,214),(730,214)], MUSTARD)
    # rug kidney on floor
    L.poly(kidney(800,905,520,70,0.4,rot=0.02), MUSTARD)
    L.poly(kidney(800,905,460,50,0.4,rot=0.02), CREAM)
    # plant right
    L.rect(1500,700,1590,800,CHAR)
    L.poly([(1495,700),(1595,700),(1580,800),(1510,800)], ORANGE)
    for ang,ln,wd,col in [(-1.9,230,40,OLIVE),(-1.5,260,42,OLIVE_L),(-1.1,230,38,OLIVE),(-2.3,190,34,OLIVE_L),(-0.75,190,34,OLIVE_L)]:
        L.poly(blob_leaf(1545,705,ln,wd,ang), col)
    can.alpha_composite(finish(L, 1))

    # --- nouns behind the desk
    paste_noun(can, 3, 745, 706, 10)
    paste_noun(can, 14, 1265, 706, 8)

    # --- desk (foreground)
    F = Layer()
    F.rrect(350,690,1450,722,6,WOOD)
    F.rect(350,712,1450,722,WOOD_D)
    # pedestal drawers left
    F.rect(380,722,640,880,ORANGE)
    F.rect(380,722,640,732,WOOD_D)
    for y0 in (740,800):
        F.rect(396,y0,624,y0+52,ORANGE_L); F.rect(396,y0,624,y0+4,ORANGE)
        F.circ(510,y0+28,7,CREAM)
    # tapered legs right
    F.poly([(1300,722),(1330,722),(1352,880),(1340,880)], CHAR)
    F.poly([(1420,722),(1446,722),(1462,880),(1450,880)], CHAR)
    F.poly([(700,722),(722,722),(716,880),(706,880)], CHAR)
    F.rect(380,880,640,890,CHAR)
    # modesty panel
    F.rect(722,722,1300,775,WOOD_D)
    # desk items
    # lamp
    F.poly([(440,690),(500,690),(486,682),(454,682)], CHAR)
    F.line([(470,684),(458,600)], 7, CHAR); F.line([(458,600),(520,570)], 7, CHAR)
    F.poly([(498,540),(560,556),(548,610),(500,596)], MUSTARD)
    F.circ(520,574,8,CREAM)
    # papers & mug
    F.rect(1100,680,1240,690,CREAM); F.rect(1112,670,1230,680,CREAM_D); F.rect(1104,660,1236,670,CREAM)
    F.rrect(1330,650,1372,690,5,TEAL_L)
    F.arc((1362,658,1388,682),-90,90,5,TEAL_L)
    F.line([(1344,640),(1340,620),(1348,606)],3,CREAM_D)
    # pen cup
    F.rect(600,655,636,690,ORANGE)
    F.line([(612,656),(604,625)],3,CHAR); F.line([(622,656),(628,622)],3,TEAL)
    # nameplate
    F.rect(780,722-0,780,722,CHAR)
    # label text
    f = font('ExtraBold', 30)
    F.text((84,712+0),'9:00 AM', f, CHAR, 'ls', tracking=4) if False else None
    F.text((84,905),'9:00 AM', font('ExtraBold',38), CREAM, 'ls', tracking=5)
    F.text((86,940),'THE OFFICE OPENS', font('SemiBold',16), CREAM, 'ls', tracking=4)
    corner_label(F, CREAM)
    can.alpha_composite(finish(F, 2))
    can.convert('RGB').save(OUT+'mcm-1.png')

# ---------------------------------------------------------------- piece 2
def piece2_build():
    can = new_canvas((238,224,188))
    L = Layer()
    L.rect(0,0,W,H,(238,224,188))
    # big floor-ish shapes along the bottom
    L.circ(800,1130,400, MUSTARD)
    K1 = kidney(230,900,400,210,0.4,rot=-0.15)
    K2 = kidney(1380,910,400,200,0.4,rot=0.12)
    L.poly(K1, TEAL); L.poly(K2, OLIVE)
    L.poly(starburst(800,1130,470,330,36,0.0), ORANGE)
    L.circ(800,1130,400, MUSTARD)
    L.poly(K1, TEAL); L.poly(K2, OLIVE)
    halftone(L, lambda d: d.polygon(L.P(K1), fill=255), (0,700,640,1040), TEAL_D, 15, 5, 'y')
    halftone(L, lambda d: d.polygon(L.P(K2), fill=255), (980,700,1600,1040), (78,84,34), 15, 5, 'y')
    halftone(L, lambda d: d.ellipse([400*S,730*S,1200*S,1530*S], fill=255), (400,730,1200,1040), ORANGE, 15, 4.5, 'y')
    # soft cream sun-rays top
    for i in range(9):
        a0 = math.radians(60+ i*7.5)
    st = CHAR
    plates=[]
    def hang(cx, y0, noun, color, scale=6):
        w = 32*scale + 40
        top = y0 + 60
        bottom = top + 32*scale + 60
        L.line([(cx,y0),(cx,top+6)], 3, st)
        L.circ(cx, y0, 6, MUSTARD)
        L.ell(cx-w/2, top, cx+w/2, top+w, color)
        L.rect(cx-w/2, top+w/2, cx+w/2, bottom, color)
        # thin cream keyline inside
        plates.append((cx, bottom, noun, scale))
    def rod(x0,x1,y,w=7): L.line([(x0,y),(x1,y)], w, st)
    L.line([(800,0),(800,90)], 4, st)
    rod(300,1330,90); L.circ(800,90,10,ORANGE)
    L.line([(300,90),(300,300)],3,st); rod(130,470,300); L.circ(300,300,8,MUSTARD)
    hang(130,300,3,MUSTARD)
    L.line([(470,300),(470,380)],3,st)
    L.poly(boomerang(470,440,70,200,340,40), ORANGE)
    L.line([(1330,90),(1330,300)],3,st); rod(1180,1480,300); L.circ(1330,300,8,MUSTARD)
    hang(1180,300,14,MUSTARD_L)
    hang(1480,300,21,TEAL_L)
    L.line([(1330,300),(1330,395)],3,st)
    L.poly(starburst(1330,424,28,11,14,0.2), CHAR); L.circ(1330,424,6,MUSTARD)
    hang(660,90,9,ORANGE_L)
    hang(940,90,5,TEAL_L)
    L.line([(1100,90),(1100,200)],3,st)
    L.circ(1100,234,32,CHAR); L.circ(1100,234,12,MUSTARD)
    L.line([(480,90),(480,150)],3,st)
    L.circ(480,178,26,TEAL); L.circ(480,178,10,CREAM)
    can.alpha_composite(finish(L, 3))
    for cx, bot, noun, sc in plates:
        paste_noun(can, noun, cx, bot, sc)
    F = Layer()
    F.text((62,892),'IN BALANCE', font('ExtraBold',50), CREAM, 'la', tracking=7)
    F.text((64,956),'FIVE NOUNS, ONE MOBILE', font('SemiBold',17), CREAM, 'la', tracking=4)
    corner_label(F, CREAM)
    can.alpha_composite(finish(F, 4, shift=False))
    can.convert('RGB').save(OUT+'mcm-2.png')

# ---------------------------------------------------------------- piece 3
def palm(L, bx, by, h, lean, trunk=WOOD_D, c1=OLIVE, c2=OLIVE_L):
    pts=[]
    n=24
    for i in range(n+1):
        t=i/n
        pts.append((bx + lean*math.sin(t*1.4)*h*0.55 + 0, by - h*t))
    # tapered trunk
    left=[];right=[]
    for i,(x,y) in enumerate(pts):
        w = 11 - 5*i/n
        left.append((x-w,y)); right.append((x+w,y))
    L.poly(left+right[::-1], trunk)
    for i in range(1,n,3):
        x,y=pts[i]; w=11-5*i/n
        L.line([(x-w,y),(x+w,y-3)],2,CHAR)
    tx,ty = pts[-1]
    angs=[-2.9,-2.5,-2.1,-1.7,-1.3,-0.9,-0.5,-0.15, -3.2+0.0]
    for k,a in enumerate(angs):
        ln = 150 + (k%3)*18
        L.poly(blob_leaf(tx,ty,ln,26,a), c1 if k%2 else c2)
        # droop tip
    L.circ(tx,ty,13,CHAR)

def piece3():
    can = new_canvas(CREAM)
    L = Layer()
    L.rect(0,0,W,H,CHAR)
    # sky bands
    L.rect(40,40,1560,230,MUSTARD)
    L.rect(40,230,1560,360,MUSTARD_L)
    L.rect(40,360,1560,640,(246,224,160))
    # sun rays + sun
    sc=(800,470)
    for i in range(28):
        a = math.radians(180+i*180/27)
        L.poly([sc,(sc[0]+900*math.cos(a-0.02),sc[1]+900*math.sin(a-0.02)),(sc[0]+900*math.cos(a+0.02),sc[1]+900*math.sin(a+0.02))], (250,214,120) if i%2==0 else (240,190,80))
    L.circ(800,470,210,CREAM)
    L.circ(800,470,185,MUSTARD_L)
    L.circ(800,470,150,ORANGE_L)
    L.circ(800,470,115,ORANGE)
    # mountains
    L.poly([(40,560),(180,470),(300,520),(470,430),(640,520),(800,490),(980,540),(1150,440),(1330,520),(1450,470),(1560,540),(1560,660),(40,660)], TEAL_L)
    L.poly([(40,600),(220,540),(420,590),(650,545),(900,600),(1120,550),(1360,600),(1560,560),(1560,660),(40,660)], TEAL)
    halftone(L, lambda d: d.polygon(L.P([(40,600),(220,540),(420,590),(650,545),(900,600),(1120,550),(1360,600),(1560,560),(1560,660),(40,660)]), fill=255), (40,540,1560,660), TEAL_D, 12, 4, 'y')
    # blocks (office park) -- behind palms
    gy = 650
    # left tower
    L.rect(150,380,330,gy,ORANGE)
    for i in range(7):
        L.rect(170+i*24,400,184+i*24,gy-20,ORANGE_L)
    L.rect(130,368,350,388,CHAR)
    # main low building
    L.rect(360,480,1240,gy,TEAL_D)
    L.rect(330,466,1270,490,CHAR)
    L.rect(380,500,1220,610,CREAM)
    for i in range(14):
        x0 = 380+i*60
        L.rect(x0+4,504,x0+56,606, TEAL if i%3 else TEAL_L)
        L.rect(x0,500,x0+4,610,CHAR)
    L.rect(1220,500,1224,610,CHAR)
    L.rect(380,610,1220,622,MUSTARD)
    # right block with breeze-block circles
    L.rect(1270,420,1450,gy,MUSTARD)
    for r in range(8):
        for c in range(5):
            L.circ(1292+c*34,442+r*26,9,OLIVE)
            L.circ(1292+c*34,442+r*26,4,MUSTARD)
    L.rect(1250,408,1470,428,CHAR)
    # birds
    for bx,by in [(300,300),(350,270),(1180,280),(1230,310),(1290,265)]:
        L.line([(bx-16,by),(bx-8,by-9),(bx,by)],3,CHAR); L.line([(bx,by),(bx+8,by-9),(bx+16,by)],3,CHAR)
    # ground
    L.rect(40,gy,1560,960,OLIVE_L)
    L.rect(40,gy,1560,gy+8,OLIVE)
    # plaza / path
    L.poly([(700,gy+8),(900,gy+8),(1080,960),(520,960)], CREAM)
    L.poly([(740,gy+8),(860,gy+8),(960,960),(640,960)], CREAM_D)
    # pool kidney (right) and lounger
    L.poly(kidney(1340,790,190,62,0.45,rot=0.05), TEAL_D)
    L.poly(kidney(1340,790,170,50,0.45,rot=0.05), TEAL_L)
    L.poly(kidney(1330,792,110,22,0.4,rot=0.05), (130,196,186))
    # left lawn arcs
    L.arc((100,700,420,900),180,360,10,OLIVE)
    # palms
    palm(L, 120, 760, 470, 0.5)
    palm(L, 1480, 770, 420, -0.45)
    # sprinkler dots
    for i in range(10):
        L.circ(180+i*20, 880-(i%2)*8, 3, OLIVE)
    can.alpha_composite(finish(L, 5))
    xs=[(5,500),(21,800),(3,1100)]
    for n,cx in xs: paste_noun(can, n, cx, 866, 9)
    F = Layer()
    # hedge scalloped
    F.rect(40,846,1560,905,OLIVE)
    for i in range(0,1560,60):
        F.circ(60+i,846,34,OLIVE)
    for i in range(0,1560,60):
        F.circ(90+i,852,28,(86,92,38))
    F.rect(40,860,1560,905,OLIVE)
    F.rect(40,870,1560,905,OLIVE)
    F.rect(40,846,1560,849,OLIVE)
    # planters at both ends of hedge: flat boxes
    F.rect(40,896,1560,912,CHAR)
    # bottom band
    F.rect(40,905,1560,960,CHAR)
    F.text((84,950),'OFFICE PARK', font('ExtraBold',44), MUSTARD, 'ls', tracking=8)
    F.text((560,946),'SUNNY SIDE UP  ·  OPEN NINE TO FIVE', font('SemiBold',17), CREAM, 'ls', tracking=4)
    F.text((1520,946),'OFFICE KIT  ·  CC0', font('SemiBold',15), CREAM, 'rs', tracking=3)
    # title
    F.text((800,150),'CALIFORNIA', font('Black',112), CHAR, 'ms', tracking=14)
    F.text((800,196),'SUNSHINE  ·  STUCCO  ·  SPREADSHEETS', font('SemiBold',20), CHAR, 'ms', tracking=8)
    # frame
    F.rect(0,0,W,40,CREAM); F.rect(0,0,40,H,CREAM); F.rect(W-40,0,W,H,CREAM); F.rect(0,960,W,H,CREAM)
    F.rect(30,30,1570,34,CHAR); F.rect(30,966,1570,970,CHAR)
    F.rect(30,30,34,970,CHAR); F.rect(1566,30,1570,970,CHAR)
    can.alpha_composite(finish(F, 6))
    can.convert('RGB').save(OUT+'mcm-3.png')

# ---------------------------------------------------------------- piece 4
def note(L, x, y, col, s=1.0):
    L.ell(x-11*s,y-8*s,x+11*s,y+8*s,col)
    L.line([(x+9*s,y),(x+9*s,y-48*s)],4*s,col)
    L.poly([(x+9*s,y-48*s),(x+30*s,y-34*s),(x+30*s,y-24*s),(x+9*s,y-36*s)],col)

def piece4():
    can = new_canvas(TEAL_D)
    L = Layer()
    L.rect(0,0,W,H,TEAL_D)
    # wall: vertical slat field on left
    for i in range(0,900,36):
        L.rect(i,0,i+26,740,(24,98,104))
    # floor
    L.rect(0,760,W,H,WOOD)
    for i in range(0,W,160):
        L.rect(i,760,i+3,H,WOOD_D)
    L.rect(0,760,W,772,WOOD_D)
    # big cream circle behind chair for glow
    # framed art
    L.rect(330,70,660,300,CREAM)
    L.rect(344,84,646,286,CREAM_D)
    L.rect(350,90,640,280,CREAM)
    L.circ(430,170,44,MUSTARD)
    L.poly(boomerang(540,190,70,200,340,34), ORANGE)
    L.poly(kidney(580,225,48,24,0.4), TEAL)
    L.circ(600,130,11,CHAR)
    # starburst sculpture
    cx,cy=1250,240
    L.line([(cx,cy),(cx,cy+120)],0,CHAR)
    for i in range(16):
        a=math.radians(i*22.5)
        r = 125 if i%2==0 else 92
        L.line([(cx,cy),(cx+r*math.cos(a),cy+r*math.sin(a))],5,MUSTARD if i%2==0 else CREAM)
        L.circ(cx+(r+8)*math.cos(a),cy+(r+8)*math.sin(a),9 if i%2==0 else 7, ORANGE if i%2==0 else MUSTARD_L)
    L.circ(cx,cy,34,CREAM); L.circ(cx,cy,20,ORANGE)
    # pendant lamp
    L.line([(860,0),(860,150)],3,CREAM_D)
    L.poly([(800,230),(920,230),(890,160),(830,160)], ORANGE)
    L.ell(800,222,920,240,MUSTARD_L)
    # rug
    L.poly(kidney(840,895,610,78,0.35,rot=0.0), OLIVE)
    L.poly(kidney(840,895,560,56,0.35,rot=0.0), OLIVE_L)
    # speaker tall right
    L.rect(1450,470,1580,760,WOOD_D)
    L.rect(1458,478,1572,752,WOOD)
    L.circ(1515,560,40,CHAR); L.circ(1515,560,26,CREAM_D); L.circ(1515,560,10,CHAR)
    L.circ(1515,670,28,CHAR); L.circ(1515,670,16,CREAM_D)
    L.poly([(1462,760),(1480,760),(1472,800),(1466,800)], CHAR)
    L.poly([(1550,760),(1568,760),(1564,800),(1556,800)], CHAR)
    # chair back (behind noun)
    L.rrect(330,330,640,700,150,ORANGE)
    L.rrect(350,350,620,700,135,ORANGE_L)
    can.alpha_composite(finish(L, 7))
    paste_noun(can, 14, 485, 700, 10)
    # credenza + nouns behind it
    paste_noun(can, 9, 985, 700, 10)
    F = Layer()
    # chair front: seat, arms, legs
    F.rrect(270,660,700,745,40,ORANGE)
    F.rrect(290,650,680,690,20,MUSTARD)
    F.rrect(250,610,330,745,38,ORANGE)
    F.rrect(640,610,720,745,38,ORANGE)
    F.rect(256,606,324,616,ORANGE_L); F.rect(646,606,714,616,ORANGE_L)
    F.poly([(310,745),(340,745),(300,850),(284,850)], CHAR)
    F.poly([(630,745),(660,745),(700,850),(684,850)], CHAR)
    F.circ(292,853,7,MUSTARD); F.circ(692,853,7,MUSTARD)
    # credenza
    F.rect(800,700,1440,830,WOOD)
    F.rect(800,700,1440,716,WOOD_D)
    for i,(c) in enumerate([ORANGE,MUSTARD,TEAL,CREAM]):
        x0=816+i*152
        F.rect(x0,728,x0+140,812,c)
        F.rect(x0+60,764,x0+80,776,CHAR) if False else F.circ(x0+70,770,6,CHAR)
    F.poly([(830,830),(860,830),(872,900),(860,900)], CHAR)
    F.poly([(1380,830),(1410,830),(1396,900),(1384,900)], CHAR)
    # turntable on credenza
    F.rect(1090,664,1430,702,CREAM)
    F.rect(1090,692,1430,702,CREAM_D)
    F.ell(1130,632,1340,690,CHAR)  # record (ellipse from slight angle)
    F.ell(1138,636,1332,684,(60,60,64))
    F.ell(1150,642,1320,678,CHAR)
    F.ell(1182,652,1288,670,MUSTARD)
    F.ell(1228,658,1242,664,CHAR)
    F.line([(1400,676),(1400,640),(1262,654)],5,CHAR)
    F.circ(1400,646,10,CREAM_D)
    # notes
    note(F,1180,500,MUSTARD_L,1.2); note(F,1290,470,CREAM,1.0); note(F,1100,420,ORANGE_L,0.9)
    # boomerang coffee table front
    F.poly(boomerang(720,735,380,35,145,70)[::1], TEAL_L) if False else None
    for lx in (500,760):
        F.poly([(lx-6,852),(lx+6,852),(lx+14,915),(lx+6,915)], CHAR)
    F.poly(kidney(630,845,170,26,0.45,rot=0.0), TEAL)
    F.poly(kidney(630,838,170,26,0.45,rot=0.0), TEAL_L)
    F.text((60,938),'AFTER HOURS', font('ExtraBold',46), CHAR, 'ls', tracking=7)
    F.text((62,968),'HI-FI AT THE OFFICE', font('SemiBold',16), CHAR, 'ls', tracking=5)
    corner_label(F, CHAR)
    can.alpha_composite(finish(F, 8))
    can.convert('RGB').save(OUT+'mcm-4.png')

if __name__ == '__main__':
    import sys
    which = sys.argv[1:] or ['1','2','3','4']
    if '1' in which: piece1()
    if '2' in which: piece2_build()
    if '3' in which: piece3()
    if '4' in which: piece4()
