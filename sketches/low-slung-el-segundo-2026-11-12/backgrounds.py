"""Deterministic El Segundo courtyard screenprints.

No generated imagery, fonts, or external assets. All marks are authored geometry.
Coordinate space is 1200 x 800, rendered with supersampling to 1800 x 1200.
"""
from __future__ import annotations
from pathlib import Path
import math
import random
import numpy as np
from PIL import Image, ImageDraw

W, H, S = 1200, 800, 2

# Actual output pixel coordinates; sprite is 32 x 40 pixels before scaling.
PLACEMENTS = {
    1: (1305, 690, 9), 2: (1425, 720, 9), 3: (1430, 738, 8),
    4: (1265, 690, 9), 5: (855, 687, 9), 6: (1050, 675, 9),
    7: (1260, 438, 8), 8: (930, 618, 8), 9: (1290, 650, 9),
    10: (840, 550, 8),
}

PALETTES = {
  1: dict(sky='#c9ddd0', cream='#f1e4be', wall='#f6dac8', dark='#183b63', water='#1c7dcd', light='#75d6de', ground='#dcb175', accent='#e66a54', plant='#376d50'),
  2: dict(sky='#f3c09f', cream='#f0debd', wall='#efe2c3', dark='#244b52', water='#58b5ba', light='#b6ddce', ground='#d88969', accent='#cf493c', plant='#386851'),
  3: dict(sky='#dad0e8', cream='#f4e5c6', wall='#ceb8c7', dark='#38436f', water='#3876ce', light='#94c8e1', ground='#dfa794', accent='#a6507f', plant='#24594a'),
  4: dict(sky='#d5dec0', cream='#ede7bd', wall='#d07c62', dark='#174b59', water='#4c9d9a', light='#a0d7bf', ground='#e6b575', accent='#e06f3e', plant='#457e68'),
  5: dict(sky='#a2b7b3', cream='#e3d6b5', wall='#dba8a3', dark='#224f5b', water='#3b8797', light='#90c5bd', ground='#c9c5a8', accent='#e0bc3b', plant='#486a52'),
  6: dict(sky='#dbb1bd', cream='#efe0be', wall='#c8869c', dark='#234d51', water='#3d929b', light='#91c7bd', ground='#e0b4a5', accent='#bf4b70', plant='#4c7860'),
  7: dict(sky='#9ebbc9', cream='#f2e3be', wall='#f1c29f', dark='#183e65', water='#176bb6', light='#68c2d0', ground='#e7bb92', accent='#dc503e', plant='#36754a'),
  8: dict(sky='#a9afd4', cream='#efdab5', wall='#e5a075', dark='#285447', water='#5c9eb8', light='#b2d5cf', ground='#c67b56', accent='#d85a34', plant='#356b4e'),
  9: dict(sky='#312e56', cream='#f1df9c', wall='#51466b', dark='#192a3c', water='#294c70', light='#65a2ab', ground='#675970', accent='#e1be52', plant='#233e46'),
  10: dict(sky='#d8c1d7', cream='#e9d9b7', wall='#b886ae', dark='#27436a', water='#338ac3', light='#92ccd8', ground='#dfa98f', accent='#c4564c', plant='#496c51'),
}

def cubic(a,b,c,d,n=35):
    return [((1-t)**3*a[0]+3*(1-t)**2*t*b[0]+3*(1-t)*t*t*c[0]+t**3*d[0],
             (1-t)**3*a[1]+3*(1-t)**2*t*b[1]+3*(1-t)*t*t*c[1]+t**3*d[1])
            for t in np.linspace(0,1,n)]

class Canvas:
    def __init__(self, idx, color=None):
        self.i=idx; self.p=PALETTES[idx]; self.r=random.Random(81200+idx)
        self.im=Image.new('RGB',(W*S,H*S),color or self.p['sky']); self.d=ImageDraw.Draw(self.im)
    def xy(self, pts): return [(round(x*S),round(y*S)) for x,y in pts]
    def poly(self, pts, color, outline=None, width=1):
        pp=self.xy(pts); self.d.polygon(pp,fill=color)
        if outline: self.d.line(pp+[pp[0]],fill=outline,width=max(1,round(width*S)),joint='curve')
    def rect(self,b,color,outline=None,width=1):
        self.d.rectangle(tuple(round(v*S) for v in b),fill=color,outline=outline,width=max(1,round(width*S)))
    def ellipse(self,b,color,outline=None,width=1):
        self.d.ellipse(tuple(round(v*S) for v in b),fill=color,outline=outline,width=max(1,round(width*S)))
    def line(self,pts,color,width=2):
        self.d.line(self.xy(pts),fill=color,width=max(1,round(width*S)),joint='curve')
    def curve(self,a,b,c,d,color,width=2): self.line(cubic(a,b,c,d),color,width)
    def leaf(self,base,tip,breadth,color,vein=None):
        dx,dy=tip[0]-base[0],tip[1]-base[1]; ln=max(1,math.hypot(dx,dy)); nx,ny=-dy/ln*breadth,dx/ln*breadth
        p1=(base[0]+dx*.25+nx,base[1]+dy*.25+ny)
        p2=(base[0]+dx*.65+nx,base[1]+dy*.65+ny)
        p3=(base[0]+dx*.65-nx*.6,base[1]+dy*.65-ny*.6)
        p4=(base[0]+dx*.25-nx*.6,base[1]+dy*.25-ny*.6)
        self.poly(cubic(base,p1,p2,tip)+cubic(tip,p3,p4,base),color)
        if vein: self.line([base,tip],vein,1)
    def finish(self):
        # Low-amplitude paper and ink texture, reproducible and confined to color.
        arr=np.asarray(self.im.resize((1800,1200),Image.Resampling.LANCZOS)).astype(np.int16)
        rng=np.random.default_rng(9040+self.i)
        fine=rng.normal(0,.8,(1200,1800,1))
        coarse=Image.fromarray(rng.integers(117,138,(150,225),dtype=np.uint8)).resize((1800,1200),Image.Resampling.BICUBIC)
        fiber=(np.asarray(coarse,dtype=np.float32)-127.5)[...,None]*.12
        return Image.fromarray(np.clip(arr+fine+fiber,0,255).astype(np.uint8))

def water(c, points, density=65, night=False):
    p=c.p; c.poly(points,p['water'])
    mask=Image.new('L',c.im.size,0); md=ImageDraw.Draw(mask); md.polygon(c.xy(points),fill=255)
    over=Image.new('RGB',c.im.size,p['water']); od=ImageDraw.Draw(over)
    xs=[a[0] for a in points]; ys=[a[1] for a in points]
    for k in range(density):
        x=c.r.uniform(min(xs)-50,max(xs)); y=c.r.uniform(min(ys),max(ys))
        length=c.r.uniform(35,140); phase=c.r.uniform(0,6.28); amp=c.r.uniform(3,12)
        pts=[(x+t*length,y+math.sin(t*5+phase)*amp+math.sin(t*13)*amp*.2) for t in np.linspace(0,1,16)]
        od.line(c.xy(pts),fill=p['light'] if k%3 else p['dark'],width=S*(2 if k%5 else 3),joint='curve')
        if k%4==0:
            od.line(c.xy([(xx+3,yy+7) for xx,yy in pts[:10]]),fill=p['cream'],width=S)
    c.im.paste(over,(0,0),mask); c.d=ImageDraw.Draw(c.im)

def tile_edge(c, a,b,count=30,color=None,depth=10):
    col=color or c.p['dark']
    c.line([a,b],col,2)
    dx,dy=b[0]-a[0],b[1]-a[1]; ln=max(1,math.hypot(dx,dy)); nx,ny=-dy/ln*depth,dx/ln*depth
    for i in range(count+1):
        t=i/count; x,y=a[0]+dx*t,a[1]+dy*t
        c.line([(x,y),(x+nx,y+ny)],col,1)

def apartment(c,x,y,w,h, floors=2, windows=5, wall=None, balcony=True):
    p=c.p; wall=wall or p['wall']; c.rect((x,y,x+w,y+h),wall)
    c.poly([(x,y),(x+w,y),(x+w+13,y-12),(x+14,y-12)],p['cream'])
    c.rect((x,y-5,x+w,y+5),p['dark'])
    fh=h/floors
    for f in range(floors):
        yy=y+f*fh; step=w/windows
        for j in range(windows):
            wx=x+step*j+step*.17; ww=step*.59; wy=yy+fh*.17; wh=fh*.6
            c.rect((wx+7,wy+6,wx+ww+7,wy+wh+8),p['ground'])
            c.rect((wx,wy,wx+ww,wy+wh),p['cream'])
            c.rect((wx+4,wy+4,wx+ww-4,wy+wh-4),p['dark'])
            if (j+f)%3==0:
                c.rect((wx+7,wy+6,wx+ww*.46,wy+wh-6),p['accent'])
                c.line([(wx+ww*.52,wy+5),(wx+ww*.52,wy+wh-5)],wall,3)
            else:
                for z in range(7):
                    ly=wy+8+z*(wh-16)/7
                    c.line([(wx+6,ly),(wx+ww-6,ly)],p['light'] if (j+f)%2 else p['wall'],2)
            c.rect((wx-3,wy+wh,wx+ww+3,wy+wh+4),p['cream'])
        if balcony and f<floors-1:
            by=yy+fh-2
            c.rect((x-8,by-12,x+w+6,by+7),p['cream'])
            c.poly([(x-8,by+7),(x+w+6,by+7),(x+w+6,by+23),(x+13,by+23)],p['ground'])
            c.line([(x-5,by-39),(x+w+4,by-39)],p['dark'],3)
            for bx in np.arange(x,x+w+5,17): c.line([(bx,by-38),(bx,by-12)],p['dark'],1.5)
    c.rect((x-5,y+h-4,x+w+8,y+h+8),p['cream'])

def tower(c,x,y,s=1,color=None):
    """Water tank and lightly engineered, cross-braced support legs."""
    p=c.p; dark=color or p['dark']; tank=p['cream'] if not color else color
    def pt(a,b):return(x+a*s,y+b*s)
    for a,b in [((-38,62),(-58,215)),((38,62),(58,215)),((-23,62),(-26,215)),((23,62),(26,215))]:
        c.line([pt(*a),pt(*b)],dark,3*s)
    for yy,ww in [(97,43),(142,48),(190,54)]:
        c.line([pt(-ww,yy),pt(ww,yy)],dark,2*s)
    c.line([pt(-41,95),pt(49,145),pt(-54,191)],dark,2*s)
    c.line([pt(41,95),pt(-49,145),pt(54,191)],dark,2*s)
    c.rect((x-44*s,y+10*s,x+44*s,y+66*s),tank)
    c.ellipse((x-44*s,y-3*s,x+44*s,y+25*s),tank)
    c.ellipse((x-44*s,y+51*s,x+44*s,y+77*s),tank)
    c.poly([pt(-44,15),pt(-30,21),pt(-30,64),pt(-44,60)],p['ground'] if not color else color)
    c.line([pt(-45,16),pt(45,16)],dark,2*s)
    c.line([pt(-44,64),pt(44,64)],dark,2*s)
    c.line([pt(-52,82),pt(52,82)],dark,2*s)
    for ax in [-52,-26,0,26,52]:c.line([pt(ax,72),pt(ax,83)],dark,1.2*s)
    c.line([pt(30,81),pt(30,205)],dark,1*s)
    for yy in range(89,201,9):c.line([pt(30,yy),pt(37,yy)],dark,1*s)
    c.line([pt(37,81),pt(37,205)],dark,1*s)

def pumpjack(c,x,y,s=1,flip=False,color=None):
    dark=color or c.p['dark']; sign=-1 if flip else 1
    def T(pts):return [(x+a*s*sign,y+b*s) for a,b in pts]
    c.poly(T([(-80,90),(-55,-15),(-47,-15),(-20,90),(-30,90),(-51,10),(-68,90)]),dark)
    c.poly(T([(-98,-34),(49,-68),(55,-55),(-94,-21)]),dark)
    c.poly(T([(47,-74),(67,-78),(79,-66),(83,-27),(71,-4),(54,-13),(59,-45)]),dark)
    c.line(T([(72,-3),(72,83)]),dark,2*s)
    c.line(T([(-83,-25),(-90,40)]),dark,4*s)
    c.ellipse((x-105*s,y+26*s,x-73*s,y+58*s),dark)
    c.rect((x-113*s,y+70*s,x-70*s,y+91*s),dark)
    c.line(T([(-114,94),(94,94)]),dark,5*s)
    c.line(T([(-67,65),(-35,65)]),c.p['ground'],2*s)
    c.line(T([(-58,33),(-43,33)]),c.p['ground'],2*s)

def aircraft(c,x,y,s=1,color=None,angle=0):
    # Custom side profile; discrete geometry, no airline logos.
    pts=[(-119,2),(-99,-3),(-18,-5),(14,-30),(30,-30),(14,-4),(81,-5),(101,-19),(109,-19),(105,-1),(123,5),(113,11),(31,12),(-8,36),(-27,36),(-4,12),(-99,11),(-119,6)]
    co,si=math.cos(angle),math.sin(angle)
    tr=[(x+(a*co-b*si)*s,y+(a*si+b*co)*s) for a,b in pts]
    c.poly(tr,color or c.p['dark'])

def agave(c,x,y,s=1,colors=None,pot=False):
    colors=colors or [c.p['plant'],c.p['light'],c.p['dark']]
    if pot:
        c.poly([(x-37*s,y-2*s),(x+39*s,y-2*s),(x+27*s,y+54*s),(x-26*s,y+54*s)],c.p['accent'])
        c.rect((x-42*s,y-8*s,x+43*s,y+3*s),c.p['cream'])
    ends=[(-105,-80),(-78,-133),(-43,-154),(-7,-182),(25,-150),(66,-128),(102,-69),(50,-50),(-47,-56)]
    for k,(dx,dy) in enumerate(ends):
        base=(x,y); tip=(x+dx*s,y+dy*s)
        c.leaf(base,tip,14*s,colors[k%len(colors)],colors[(k+1)%len(colors)])

def pepper(c,x,y,s=1,flip=False):
    dark=c.p['plant']; high=c.p['light']; berry=c.p['accent']; sg=-1 if flip else 1
    stems=[((0,0),(67,-120)),((20,-42),(145,-90)),((49,-89),(75,-190)),((69,-121),(173,-161)),((28,-62),(-53,-145)),((80,-143),(43,-220))]
    for j,(a,b) in enumerate(stems):
        aa=(x+a[0]*s*sg,y+a[1]*s); bb=(x+b[0]*s*sg,y+b[1]*s)
        c.line([aa,bb],dark,max(2,5*s if j==0 else 2*s))
        for k,t in enumerate(np.linspace(.15,1,7)):
            bx=aa[0]+(bb[0]-aa[0])*t; by=aa[1]+(bb[1]-aa[1])*t
            direction=-1 if k%2 else 1
            tip=(bx+direction*30*s,by+45*s)
            c.leaf((bx,by),tip,8*s,dark if k%3 else high)
        for k in range(5):
            bx=bb[0]+math.sin(k*2.4+j)*14*s; by=bb[1]+15*s+k*6*s
            c.ellipse((bx-3*s,by-3*s,bx+3*s,by+3*s),berry)

def round_vine(c,pts,s=1,color=None,flowers=True):
    col=color or c.p['plant']; c.line(pts,col,3*s)
    for j,(x,y) in enumerate(pts[1::2]):
        sg=-1 if j%2 else 1; cx=x+sg*20*s; cy=y-15*s
        c.line([(x,y),(cx,cy)],col,2*s)
        r=(16+j%3*3)*s
        c.ellipse((cx-r,cy-r,cx+r,cy+r),col)
        for a in [-2.4,-1.4,-.4,.6,1.6]: c.line([(cx,cy),(cx+math.cos(a)*r*.86,cy+math.sin(a)*r*.86)],c.p['light'],.8*s)
        if flowers and j%2==0:
            fx=x-sg*13*s; fy=y+12*s
            for a in range(5):
                xx=fx+math.cos(a*1.256)*8*s; yy=fy+math.sin(a*1.256)*8*s
                c.ellipse((xx-7*s,yy-7*s,xx+7*s,yy+7*s),c.p['accent'])
            c.ellipse((fx-3*s,fy-3*s,fx+3*s,fy+3*s),c.p['cream'])

def chair(c,x,y,s=1):
    p=c.p
    c.poly([(x,y),(x+72*s,y-12*s),(x+81*s,y+37*s),(x+4*s,y+48*s)],p['cream'])
    c.poly([(x,y),(x-11*s,y-77*s),(x+57*s,y-88*s),(x+72*s,y-12*s)],p['cream'])
    for k in range(7):
        yy=y-72*s+k*10*s
        c.line([(x-7*s+k*1.5*s,yy),(x+58*s+k*1.7*s,yy-10*s)],p['accent'],3*s)
    for k in range(6):
        yy=y+5*s+k*6*s
        c.line([(x+1*s,yy),(x+73*s,yy-11*s)],p['accent'],2.5*s)
    c.line([(x-11*s,y-80*s),(x+5*s,y+75*s)],p['dark'],3*s)
    c.line([(x+57*s,y-91*s),(x+86*s,y+63*s)],p['dark'],3*s)
    c.line([(x+3*s,y+43*s),(x-14*s,y+79*s)],p['dark'],3*s)
    c.line([(x+78*s,y+32*s),(x+59*s,y+68*s)],p['dark'],3*s)

def paving(c, origin=(600,340), spacing=130, color=None):
    color=color or c.p['cream']; ox,oy=origin
    for xx in range(-900,2200,spacing): c.line([(ox+(xx-ox)*.24,oy),(xx,820)],color,1)
    for yy in [oy+28,oy+72,oy+135,oy+225,oy+345,oy+485]: c.line([(0,yy),(1200,yy-12)],color,1)

def scene1(c):
    p=c.p
    tower(c,974,53,.92)
    c.poly([(0,309),(1200,294),(1200,800),(0,800)],p['ground'])
    apartment(c,115,158,932,263,2,6)
    c.rect((112,418,1056,434),p['dark'])
    # Long apartment-side shadows interrupted by a large cut of water.
    for k in range(5):
        yy=448+k*64
        c.poly([(0,yy),(1200,yy-100),(1200,yy-67),(0,yy+34)],'#b88c6f')
    c.poly([(119,485),(726,450),(1010,738),(111,800)],p['cream'])
    water(c,[(145,502),(707,470),(956,719),(140,777)],78)
    tile_edge(c,(145,502),(707,470),30,depth=9)
    tile_edge(c,(707,470),(956,719),23,depth=-8)
    c.poly([(58,0),(110,0),(110,800),(58,800)],p['dark'])
    c.poly([(1120,0),(1200,0),(1200,800),(1120,800)],p['dark'])
    c.rect((0,0,1200,46),p['dark'])
    for yy in [68,102,136]:
        c.poly([(0,yy),(1200,yy-19),(1200,yy-7),(0,yy+13)],p['cream'])
        c.line([(0,yy+13),(1200,yy-7)],p['dark'],2)
    c.line([(1080,0),(1080,180)],p['dark'],1)
    c.ellipse((1076,174,1085,186),p['accent'])
    agave(c,98,763,1.1,pot=True)
    pepper(c,1160,520,1.4,True)
    c.ellipse((850,699,1080,725),'#b88c6f')

def scene2(c):
    p=c.p
    # Oilfield ridge is an angular horizon, not a sun-and-palm postcard.
    c.poly([(0,234),(245,214),(460,235),(710,198),(960,216),(1200,191),(1200,402),(0,402)],'#d99b79')
    pumpjack(c,307,175,1.1)
    pumpjack(c,894,164,.84,True)
    c.line([(0,282),(1200,262)],p['dark'],2)
    for xx in range(5,1200,37):c.line([(xx,267),(xx,290)],p['dark'],1)
    apartment(c,93,302,1054,168,1,8)
    c.rect((0,480,1200,800),p['ground'])
    paving(c,(540,477),160,color='#bd705e')
    c.poly([(80,547),(882,511),(1054,756),(15,800)],p['cream'])
    water(c,[(106,565),(869,531),(1002,736),(55,781)],65)
    tile_edge(c,(106,565),(869,531),46,depth=7)
    tile_edge(c,(869,531),(1002,736),16,depth=-8)
    # Utility pipes and a quiet residential fence.
    c.line([(1032,304),(1032,274),(1080,274),(1080,301)],p['cream'],7)
    c.line([(1088,302),(1088,248),(1115,248),(1115,298)],p['dark'],2)
    pepper(c,30,565,1.8)
    c.poly([(0,694),(98,666),(151,800),(0,800)],p['dark'])
    agave(c,1136,769,.7,colors=[p['plant'],p['light'],p['dark']])
    # Pixel resident stands on the wide right-hand pool deck.
    c.ellipse((940,712,1140,736),'#bd705e')

def scene3(c):
    p=c.p
    c.rect((0,0,1200,800),p['ground'])
    # Overhead apartment roofs and two different tiled courtyard planes.
    c.poly([(0,0),(1200,0),(1200,117),(109,165),(0,116)],p['wall'])
    c.poly([(0,0),(126,85),(170,800),(0,800)],p['cream'])
    c.poly([(0,116),(109,165),(157,800),(118,800)],p['dark'])
    for x in range(160,1150,135):
        c.poly([(x,28),(x+98,24),(x+97,78),(x-2,83)],p['cream'])
        for t in range(4): c.line([(x+8,38+t*9),(x+88,34+t*9)],p['dark'],1)
    for y in range(174,800,48):c.line([(165,y),(1200,y-47)],p['cream'],1)
    for x in range(170,1220,80):c.line([(x,150),(x+41,800)],p['cream'],1)
    c.poly([(275,239),(934,203),(1000,668),(320,731)],p['cream'])
    water(c,[(300,260),(912,226),(974,647),(344,704)],95)
    tile_edge(c,(300,260),(912,226),32,depth=9)
    tile_edge(c,(912,226),(974,647),27,depth=-10)
    # An airplane's flat shadow links this courtyard to the nearby airport.
    aircraft(c,667,390,1.22,color='#315da1',angle=-.32)
    c.line([(105,160),(1190,345)],p['dark'],2)
    c.line([(103,236),(1191,418)],p['dark'],2)
    for x,y,co in [(260,187,p['cream']),(442,218,p['accent']),(652,254,p['wall']),(885,294,p['cream'])]:
        c.poly([(x,y),(x+107,y+18),(x+97,y+105),(x-5,y+84)],co)
        c.line([(x+15,y+9),(x+12,y+75)],p['dark'],1)
        c.line([(x+86,y+22),(x+82,y+87)],p['dark'],1)
        for k in [14,90]:c.rect((x+k,y+k*.17-6,x+k+5,y+k*.17+9),p['dark'])
    # Round nasturtium leaves repeated along the parapet.
    round_vine(c,[(112,90),(190,121),(223,169),(199,212),(216,266),(210,321),(242,363),(221,415)],1.3)
    agave(c,200,773,.9,colors=[p['plant'],p['light'],p['dark']],pot=True)
    c.ellipse((950,716,1145,744),'#be8e87')

def scene4(c):
    p=c.p
    tower(c,788,37,1.76)
    # Large raw stucco walls stagger around a narrow pool.
    c.poly([(0,291),(607,270),(607,507),(0,511)],p['cream'])
    c.poly([(607,270),(1200,321),(1200,800),(607,634)],p['wall'])
    c.poly([(0,507),(607,488),(1200,655),(1200,800),(0,800)],p['ground'])
    c.poly([(0,486),(455,480),(638,800),(0,800)],p['cream'])
    water(c,[(0,505),(435,500),(602,800),(0,800)],64)
    tile_edge(c,(435,500),(602,800),25,depth=-10)
    c.rect((94,323,300,438),p['dark'])
    c.rect((106,335,287,426),p['light'])
    for xx in [165,226]:c.line([(xx,335),(xx,426)],p['cream'],5)
    c.line([(106,381),(287,381)],p['cream'],5)
    # Repeating brise-soleil slits across the terracotta wall.
    for j in range(6):
        x=662+j*77; yy=328+j*6
        c.poly([(x,yy),(x+41,yy+4),(x+41,yy+117),(x,yy+109)],p['dark'])
        c.poly([(x+6,yy+7),(x+41,yy+10),(x+41,yy+117),(x+6,yy+108)],'#b95f50')
    # Three crisp ladder strokes, chrome colored, no gradients.
    c.curve((385,585),(366,509),(425,500),(442,574),p['cream'],8)
    c.curve((435,673),(414,591),(473,583),(491,651),p['cream'],8)
    for xx,yy in [(414,568),(429,599),(445,630)]:c.line([(xx-9,yy),(xx+37,yy+72)],p['cream'],5)
    chair(c,714,569,.8)
    agave(c,1137,780,1.2,colors=[p['plant'],p['light'],p['dark']])
    agave(c,700,786,.7,colors=[p['plant'],p['cream'],p['dark']])
    c.ellipse((840,696,1060,719),'#ce965f')

def scene5(c):
    p=c.p
    c.poly([(0,251),(1200,232),(1200,800),(0,800)],p['ground'])
    pumpjack(c,860,195,1.45,color='#436d73')
    c.rect((0,330,1200,495),p['cream'])
    c.rect((0,336,1200,348),p['dark'])
    # A generously scaled patterned breeze-block screen.
    for row in range(3):
        for col in range(14):
            x=col*88-15; y=357+row*44
            c.poly([(x,y),(x+67,y),(x+67,y+31),(x,y+31)],p['wall'])
            c.poly([(x+12,y+5),(x+51,y+5),(x+42,y+26),(x+20,y+26)],p['dark'])
            c.poly([(x+20,y+8),(x+46,y+8),(x+40,y+24),(x+22,y+24)],p['water'])
    apartment(c,-83,122,496,233,2,3)
    # Wet angular paving catches fragmented color from walls and sky.
    for pts in [[(42,569),(315,538),(414,581),(316,634),(54,655)],[(724,541),(1135,510),(1200,542),(1143,622),(810,606)],[(226,692),(463,665),(555,709),(492,786),(191,800)],[(821,690),(1110,651),(1200,714),(1188,800),(918,789)]]:
        c.poly(pts,p['water'])
    for y,x1,x2 in [(578,77,334),(597,121,302),(558,827,1124),(724,865,1150),(751,943,1191),(722,282,504)]:
        c.line([(x1,y),(x2,y-8)],p['light'],3)
    c.poly([(897,676),(929,670),(980,789),(957,790)],p['dark'])
    c.poly([(1061,661),(1080,660),(1024,795),(1002,795)],p['dark'])
    for a,b in [((0,520),(1200,477)),((0,674),(1200,616)),((400,495),(332,800)),((828,477),(925,800))]:c.line([a,b],p['cream'],2)
    c.poly([(20,800),(0,641),(67,566),(158,800)],p['dark'])
    round_vine(c,[(75,773),(91,706),(74,640),(113,591),(103,533),(149,499)],1.25)
    # Little oxalis-like plants under the wall emphasize rain and everyday weeds.
    for x in [345,432,1010,1104]:
        for j in range(3):
            c.line([(x,505),(x+j*9-9,484-j*5)],p['plant'],2)
            c.ellipse((x+j*9-14,478-j*5,x+j*9-4,488-j*5),p['accent'])
    c.ellipse((560,691,780,716),'#a7b3a0')

def scene6(c):
    p=c.p
    c.rect((0,0,1200,800),p['ground'])
    c.poly([(0,0),(1200,0),(1200,342),(0,438)],p['sky'])
    tower(c,1014,82,.88,color='#7d6b87')
    apartment(c,36,219,979,214,2,7)
    # A vertical pool strip compresses the courtyard into a graphic diagonal.
    c.poly([(970,444),(1200,419),(1200,800),(1017,800)],p['cream'])
    water(c,[(996,461),(1200,439),(1200,800),(1042,800)],52)
    tile_edge(c,(996,461),(1042,800),29,depth=8)
    c.poly([(0,529),(989,448),(1029,800),(0,800)],p['ground'])
    # Pepper canopy shadows form the print's second, oversized pattern.
    shadow='#bd8998'
    for xx,yy in [(185,589),(300,654),(484,573),(619,719),(330,468)]:
        c.line([(xx-96,yy+160),(xx+30,yy-70)],shadow,7)
        for j in range(7):
            bx=xx-60+j*15; by=yy+100-j*28
            c.leaf((bx,by),(bx+(-1 if j%2 else 1)*63,by-16),17,shadow)
    chair(c,446,588,1.1)
    c.line([(0,741),(984,658)],p['cream'],1)
    c.line([(208,432),(285,800)],p['cream'],1)
    c.line([(620,432),(669,800)],p['cream'],1)
    # Botanical foreground is deliberately larger than the building.
    pepper(c,-7,463,2.3)
    pepper(c,425,277,1.7,True)
    c.curve((0,83),(255,65),(329,214),(606,241),p['dark'],18)
    for x,y in [(123,110),(266,163),(386,210),(509,233)]:pepper(c,x,y,.65)
    c.ellipse((692,690,907,716),shadow)

def scene7(c):
    p=c.p
    aircraft(c,711,127,2.0,angle=-.03)
    apartment(c,0,242,1200,230,2,8)
    c.rect((0,476,1200,800),p['ground'])
    c.poly([(0,514),(1200,493),(1200,630),(0,661)],p['cream'])
    water(c,[(0,531),(1200,510),(1200,610),(0,641)],55)
    tile_edge(c,(0,531),(1200,510),60,depth=7)
    # Broad oval tabletop is an intentional foreground still life.
    c.ellipse((-210,576,790,1041),p['dark'])
    c.ellipse((-225,561,775,1026),p['cream'])
    c.curve((-80,654),(161,602),(434,611),(649,708),p['ground'],3)
    # Three hand-drawn propagation jars, with branching visible roots.
    for j,(x,y,s) in enumerate([(131,656,1.05),(380,684,.82),(565,748,.74)]):
        c.rect((x-36*s,y-80*s,x+36*s,y+18*s),p['light'])
        c.ellipse((x-36*s,y-89*s,x+36*s,y-70*s),p['cream'])
        c.line([(x-36*s,y-80*s),(x-36*s,y+14*s),(x+36*s,y+14*s),(x+36*s,y-80*s)],p['dark'],2)
        c.line([(x-33*s,y-38*s),(x+33*s,y-38*s)],p['water'],2)
        for a in [-21,-11,0,13,22]:
            c.curve((x,y-75*s),(x+a*s,y-52*s),(x-a*.3*s,y-18*s),(x+a*s,y+7*s),p['cream'],1.5)
        c.line([(x,y-76*s),(x+10*s,y-184*s)],p['plant'],3)
        c.leaf((x+5*s,y-132*s),(x-60*s,y-178*s),25*s,p['plant'])
        c.leaf((x+8*s,y-157*s),(x+63*s,y-215*s),23*s,p['plant'])
        c.line([(x+7*s,y-166*s),(x+11*s,y-205*s)],p['plant'],2)
    round_vine(c,[(1194,459),(1163,403),(1182,344),(1155,294),(1167,227),(1131,180),(1154,125)],.95)
    # Resident is behind pool-side table, feet rest on the far deck.
    c.ellipse((832,494,1010,512),'#c59278')

def scene8(c):
    p=c.p
    pumpjack(c,183,184,1.0,color='#526d72')
    c.poly([(0,291),(1200,220),(1200,800),(0,800)],p['ground'])
    apartment(c,377,113,823,380,2,5)
    c.poly([(0,287),(222,270),(293,800),(0,800)],p['wall'])
    c.rect((30,348,165,557),p['dark'])
    for x in [53,84,115,146]:c.line([(x,360),(x,541)],p['cream'],3)
    c.poly([(856,594),(1200,547),(1200,800),(986,800)],p['cream'])
    water(c,[(883,610),(1200,570),(1200,800),(1010,800)],50)
    tile_edge(c,(883,610),(1010,800),20,depth=8)
    # Two flight switchback staircase, with a generous middle landing.
    c.poly([(189,718),(382,718),(742,413),(552,413)],p['dark'])
    for j in range(13):
        y=703-j*22; x=209+j*26
        c.poly([(x,y),(x+177,y),(x+197,y-16),(x+20,y-16)],p['cream'])
        c.line([(x,y),(x+177,y)],p['accent'],3)
    c.poly([(544,414),(815,414),(884,468),(610,468)],p['cream'])
    c.poly([(610,468),(884,468),(884,487),(610,487)],p['dark'])
    c.poly([(737,415),(892,415),(1110,177),(953,177)],p['dark'])
    for j in range(11):
        y=400-j*20; x=759+j*18
        c.poly([(x,y),(x+135,y),(x+153,y-15),(x+18,y-15)],p['cream'])
        c.line([(x,y),(x+135,y)],p['accent'],2)
    # Railings and landing supports are dark, finely drawn architecture.
    c.line([(196,645),(554,340),(812,340)],p['dark'],4)
    for j in range(14):
        x=204+j*26; y=639-j*22
        c.line([(x,y),(x,y+68)],p['dark'],2)
    c.line([(889,342),(1110,101)],p['dark'],4)
    for j in range(11):c.line([(892+j*20,338-j*22),(892+j*20,408-j*22)],p['dark'],2)
    c.line([(878,489),(878,674)],p['dark'],6)
    # Courtyard-floor landing reserved for the character, just below the stairs.
    c.poly([(556,606),(811,595),(913,666),(614,688)],p['cream'])
    c.ellipse((607,613,796,636),'#ad674c')
    round_vine(c,[(151,768),(199,712),(219,662),(267,629),(285,573),(331,545),(357,486),(408,459),(432,405),(482,379),(516,326)],1.12)
    agave(c,1191,792,.72,colors=[p['plant'],p['light'],p['dark']])

def scene9(c):
    p=c.p
    tower(c,1027,40,1.03,color=p['dark'])
    apartment(c,39,236,1110,282,2,7)
    # Keep the whole building quiet except one welcoming door.
    c.rect((835,361,946,518),p['cream'])
    c.rect((844,372,938,518),p['accent'])
    c.rect((922,431,927,439),p['dark'])
    c.rect((873,333,902,345),p['cream'])
    c.poly([(874,345),(901,345),(999,527),(786,527)],'#a39079')
    c.rect((835,361,946,518),p['cream'])
    c.rect((844,372,938,518),p['accent'])
    c.rect((0,523,1200,800),p['ground'])
    c.poly([(34,567),(765,550),(1029,800),(0,800)],p['cream'])
    water(c,[(57,587),(751,570),(982,800),(0,800)],70,night=True)
    # Door reflection is made of separated, broken slabs of yellow ink.
    for j in range(8):
        yy=610+j*25; xx=686-j*12
        c.poly([(xx,yy),(xx+44+j*3,yy-3),(xx+53+j*3,yy+4),(xx-8,yy+7)],p['accent'])
    tile_edge(c,(57,587),(751,570),35,depth=8)
    # Paper-moth marks, each composed with wings rather than generic stars.
    for x,y,s in [(790,325,1),(967,288,.7),(1028,383,.55),(738,406,.6)]:
        c.poly([(x,y),(x-16*s,y-12*s),(x-13*s,y+8*s),(x,y+4*s),(x+13*s,y+8*s),(x+16*s,y-12*s)],p['cream'])
    agave(c,55,567,1.35,colors=[p['dark'],p['plant'],p['water']])
    pepper(c,1210,421,1.25,True)
    c.ellipse((854,669,1081,697),'#4a425b')

def scene10(c):
    p=c.p
    c.rect((0,0,1200,800),p['ground'])
    # An entirely overhead composition; the tower is reflected rather than on a horizon.
    for yy in range(0,801,80):c.line([(0,yy),(1200,yy-40)],p['cream'],1)
    for xx in range(0,1201,80):c.line([(xx,0),(xx+70,800)],p['cream'],1)
    c.poly([(137,59),(1042,102),(1120,744),(200,783)],p['cream'])
    water(c,[(165,83),(1016,127),(1087,720),(224,754)],135)
    tile_edge(c,(165,83),(1016,127),47,depth=10)
    tile_edge(c,(1016,127),(1087,720),35,depth=-9)
    tile_edge(c,(224,754),(1087,720),47,depth=-10)
    # Geometric inverted tower reflection, broken into offset bands.
    rc='#4d72aa'
    c.poly([(799,163),(916,174),(908,220),(802,211)],rc)
    c.ellipse((799,152,916,179),rc)
    c.poly([(814,219),(826,219),(788,390),(776,392)],rc)
    c.poly([(890,224),(902,226),(950,394),(938,393)],rc)
    c.line([(800,280),(921,291),(790,344),(934,353)],rc,4)
    for yy in [244,315,368]:c.poly([(751,yy),(970,yy+9),(973,yy+16),(748,yy+7)],p['water'])
    # Pixel character floats on a large simple cream ring.
    c.ellipse((479,387,783,642),p['dark'])
    c.ellipse((472,378,776,633),p['cream'])
    c.ellipse((533,428,714,580),p['water'])
    # Jacaranda bloom drift, arranged as a loose printed diagonal.
    for j in range(43):
        x=244+j*15+c.r.uniform(-47,47); y=175+j*9+c.r.uniform(-56,56)
        if 480<x<785 and 370<y<650:continue
        co=p['wall'] if j%3 else p['accent']
        c.poly([(x,y),(x+9,y-4),(x+13,y+5),(x+5,y+13),(x-2,y+6)],co)
    # Roof corners and garden canopy crop the image like a neighborhood aerial.
    c.poly([(0,0),(170,0),(210,800),(0,800)],p['wall'])
    for y in range(48,780,76):c.line([(0,y),(177+y*.04,y-4)],p['cream'],3)
    round_vine(c,[(1176,54),(1132,113),(1155,168),(1124,224),(1149,283),(1121,337),(1154,401),(1130,457),(1167,517)],1.4)
    agave(c,1161,789,.95,colors=[p['plant'],p['light'],p['dark']])

SCENES={1:scene1,2:scene2,3:scene3,4:scene4,5:scene5,6:scene6,7:scene7,8:scene8,9:scene9,10:scene10}

def draw_scene(i):
    if i not in SCENES:raise ValueError('scene must be 1..10')
    c=Canvas(i); SCENES[i](c); return c.finish()

if __name__=='__main__':
    out=Path(__file__).parent/'background-previews'; out.mkdir(exist_ok=True)
    sheet=Image.new('RGB',(1800,1200),'#eee5d5')
    for i in range(1,11):
        im=draw_scene(i); im.save(out/f'background-{i:02}.png')
        small=im.resize((360,240),Image.Resampling.LANCZOS)
        sheet.paste(small,(((i-1)%5)*360,((i-1)//5)*600+110))
        # Additional crop-sized swatch makes these two rows easier to inspect.
        sw=im.crop((420,310,1380,950)).resize((360,240),Image.Resampling.LANCZOS)
        sheet.paste(sw,(((i-1)%5)*360,((i-1)//5)*600+350))
    sheet.save(out/'contact-sheet.jpg',quality=95)
    print(str(out/'contact-sheet.jpg'))
