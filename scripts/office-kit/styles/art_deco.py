# Office Kit style generator, CC0. Written by a Claude worker on Nov 27 2026.
# Expects real Noun PNGs at /tmp/nm/n{3,5,9,14,21}.png (from https://noun.pics/<id>.png) and writes to /tmp/kitart/deco/.
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, K = 1600, 1000, 2
BLACK=(9,9,12); GOLD=(201,162,39); GOLD2=(232,200,98); GOLDD=(120,96,24)
EM=(11,93,75); EMD=(6,52,42); EML=(20,130,102)
NAVY=(14,31,63); NAVYD=(7,16,34); NAVYL=(28,58,108); CREAM=(242,230,196)
INTER="/usr/share/fonts/opentype/inter/"
def F(name,size): return ImageFont.truetype(INTER+name,size)

def load_noun(n):
    im=Image.open(f"/tmp/nm/n{n}.png").convert("RGBA").resize((32,32),Image.NEAREST)
    bg=im.getpixel((0,0)); px=im.load()
    for y in range(32):
        for x in range(32):
            if px[x,y]==bg: px[x,y]=(0,0,0,0)
    return im

class Canvas:
    def __init__(s,bg=BLACK):
        s.img=Image.new("RGB",(W*K,H*K),bg); s.d=ImageDraw.Draw(s.img)
    def p(s,pts): return [(x*K,y*K) for x,y in pts]
    def poly(s,pts,fill=None,outline=None,w=1):
        s.d.polygon(s.p(pts),fill=fill)
        if outline: s.line(list(pts)+[pts[0]],outline,w)
    def line(s,pts,fill,w=1):
        d=s.d; P=s.p(pts); d.line(P,fill=fill,width=max(1,int(w*K)),joint="curve")
    def rect(s,x0,y0,x1,y1,fill=None,outline=None,w=1):
        s.d.rectangle([x0*K,y0*K,x1*K,y1*K],fill=fill,outline=outline,width=int(w*K) if outline else 0)
    def circ(s,cx,cy,r,fill=None,outline=None,w=1):
        s.d.ellipse([(cx-r)*K,(cy-r)*K,(cx+r)*K,(cy+r)*K],fill=fill,outline=outline,width=int(w*K) if outline else 0)
    def arc(s,cx,cy,r,a0,a1,fill,w=1):
        s.d.arc([(cx-r)*K,(cy-r)*K,(cx+r)*K,(cy+r)*K],a0,a1,fill=fill,width=max(1,int(w*K)))
    def pie(s,cx,cy,r,a0,a1,fill):
        s.d.pieslice([(cx-r)*K,(cy-r)*K,(cx+r)*K,(cy+r)*K],a0,a1,fill=fill)
    def vgrad(s,x0,y0,x1,y1,c0,c1):
        for y in range(int(y0*K),int(y1*K)):
            t=(y-y0*K)/max(1,(y1-y0)*K)
            c=tuple(int(c0[i]+(c1[i]-c0[i])*t) for i in range(3))
            s.d.line([(x0*K,y),(x1*K,y)],fill=c)
    def mask(s): return Image.new("L",(W*K,H*K),0)
    def paste_masked(s,layer,m): s.img.paste(layer,(0,0),m)
    def final(s): return s.img.resize((W,H),Image.LANCZOS)

def chamfer(x0,y0,x1,y1,c):
    return [(x0+c,y0),(x1-c,y0),(x1,y0+c),(x1,y1-c),(x1-c,y1),(x0+c,y1),(x0,y1-c),(x0,y0+c)]

def stepped_arch(cx,base,hw,top,steps,sw,sh):
    """symmetric ziggurat-topped window: straight sides then steps in toward the top"""
    pts=[(cx-hw,base)]
    y=top+steps*sh; x=cx-hw
    pts.append((x,y))
    for i in range(steps):
        pts.append((x,y-sh)); x+=sw; y-=sh; pts.append((x,y))
    left=pts[:]
    # build full: left side up, flat top, right mirrored
    topx=x
    right=[(2*cx-px,py) for px,py in reversed(left)]
    # left has points ending at (topx, top); right begins at mirror
    return left+right

def zig(cx,base,hw,top,steps,sw):
    sh=(base-top)  # placeholder
    return None

def window(cx,base,hw,top,steps,sw,sh):
    """stepped top window polygon"""
    pts=[(cx-hw,base),(cx-hw,top+steps*sh)]
    x=cx-hw; y=top+steps*sh
    for i in range(steps):
        y-=sh; pts.append((x,y)); x+=sw; pts.append((x,y))
    # now at (x, top) ; mirror
    left=pts
    right=[(2*cx-px,py) for px,py in reversed(left)]
    return left+right

def rays(cv,cx,cy,n,r,c0,c1,a_off=0,a_from=0,a_to=360):
    step=(a_to-a_from)/n
    for i in range(n):
        a0=math.radians(a_from+i*step+a_off); a1=math.radians(a_from+(i+1)*step+a_off)
        pts=[(cx,cy),(cx+r*math.cos(a0),cy+r*math.sin(a0)),(cx+r*math.cos((a0+a1)/2),cy+r*math.sin((a0+a1)/2)),(cx+r*math.cos(a1),cy+r*math.sin(a1))]
        cv.poly(pts,fill=c0 if i%2==0 else c1)

def ray_lines(cv,cx,cy,n,r0,r1,col,w=1,a_from=0,a_to=360):
    for i in range(n+1):
        a=math.radians(a_from+(a_to-a_from)*i/n)
        cv.line([(cx+r0*math.cos(a),cy+r0*math.sin(a)),(cx+r1*math.cos(a),cy+r1*math.sin(a))],col,w)

def chevrons(cv,cx,y,hw,n,gap,h,col,w=1.5):
    for i in range(n):
        yy=y+i*gap
        cv.line([(cx-hw,yy),(cx,yy+h),(cx+hw,yy)],col,w)

def fan(cv,cx,cy,r,n,col,w=1.5,a0=180,a1=360):
    for i in range(1,n+1):
        cv.arc(cx,cy,r*i/n,a0,a1,col,w)

def glow(cv,cx,cy,r,col,alpha=120,blur=60):
    L=Image.new("RGBA",(W*K,H*K),(0,0,0,0)); dd=ImageDraw.Draw(L)
    dd.ellipse([(cx-r)*K,(cy-r)*K,(cx+r)*K,(cy+r)*K],fill=col+(alpha,))
    L=L.filter(ImageFilter.GaussianBlur(blur*K))
    cv.img.paste(L,(0,0),L)

def tracked(img,cx,y,s,font,fill,track=0,anchor="m"):
    d=ImageDraw.Draw(img)
    ws=[d.textlength(ch,font=font) for ch in s]
    total=sum(ws)+track*(len(s)-1)
    x=cx-total/2
    for ch,w in zip(s,ws):
        d.text((x,y),ch,font=font,fill=fill); x+=w+track
    return total

def place_noun(img,n,scale,cx,bottom,shadow=True):
    nm=load_noun(n); big=nm.resize((32*scale,32*scale),Image.NEAREST)
    bb=big.getbbox()
    x=int(cx-(bb[0]+bb[2])/2); y=int(bottom-bb[3])
    if shadow:
        sh=Image.new("RGBA",img.size,(0,0,0,0)); dd=ImageDraw.Draw(sh)
        w=(bb[2]-bb[0])*0.62
        dd.ellipse([cx-w,bottom-14,cx+w,bottom+14],fill=(0,0,0,150))
        sh=sh.filter(ImageFilter.GaussianBlur(8)); img.paste(sh,(0,0),sh)
    img.paste(big,(x,y),big)
    return (x+bb[0],y+bb[1],x+bb[2],y+bb[3])

def corner_fans(cv,x0,y0,x1,y1,r,n,col,w=1.5):
    cv.arc(x0,y0,r,0,90,col,w); cv.arc(x1,y0,r,90,180,col,w)
    cv.arc(x0,y1,r,270,360,col,w); cv.arc(x1,y1,r,180,270,col,w)
    for i in range(1,n):
        rr=r*i/n
        cv.arc(x0,y0,rr,0,90,col,w); cv.arc(x1,y0,rr,90,180,col,w)
        cv.arc(x0,y1,rr,270,360,col,w); cv.arc(x1,y1,rr,180,270,col,w)

def border(cv,m=36,col=GOLD):
    cv.poly(chamfer(m,m,W-m,H-m,26),outline=col,w=3)
    cv.poly(chamfer(m+14,m+14,W-m-14,H-m-14,18),outline=GOLDD,w=1.5)
    cv.poly(chamfer(m+22,m+22,W-m-22,H-m-22,12),outline=col,w=1)

# =============== 1: SUNBURST PORTRAIT ===============
def art1():
    cv=Canvas()
    cv.vgrad(0,0,W,H,(12,12,16),(6,6,8))
    border(cv)
    cx=800
    win=window(cx,850,330,165,5,26,24)
    m=cv.mask(); ImageDraw.Draw(m).polygon(cv.p(win),fill=255)
    layer=Image.new("RGB",cv.img.size,BLACK)
    L=Canvas(); L.img=layer; L.d=ImageDraw.Draw(layer)
    rays(L,cx,700,44,1400,EM,EMD,a_off=-90/1)
    ray_lines(L,cx,700,44,60,1400,GOLDD,1)
    # concentric fan bands
    for i,r in enumerate(range(120,900,60)):
        L.arc(cx,700,r,180,360,GOLD if i%2==0 else GOLDD,2 if i%2==0 else 1)
    cv.paste_masked(layer,m)
    # window outlines (stepped, nested)
    for i,ins in enumerate([0,10,20]):
        w=window(cx,850-0,330-ins,165+ins,5,26,24)
        cv.line(w+[w[0]],GOLD if i!=1 else GOLDD,3 if i==0 else 1.5)
    # halo disc
    glow(cv,cx,560,300,(240,200,80),60,70)
    cv.circ(cx,570,262,fill=NAVYD)
    for r,w,c in [(262,3,GOLD),(250,1.2,GOLDD),(238,1.2,GOLD)]:
        cv.circ(cx,570,r,outline=c,w=w)
    ray_lines(cv,cx,570,72,240,262,GOLD,1)
    # side columns
    for sx in (-1,1):
        bx=cx+sx*(330+120)
        for k,(wd) in enumerate([150,126,102]):
            cv.rect(bx-wd/2,850-0,bx+wd/2,850,fill=None)
        # column body
        cv.rect(bx-62,200,bx+62,850,fill=(14,14,18),outline=GOLD,w=2)
        cv.rect(bx-50,212,bx+50,838,outline=GOLDD,w=1.2)
        for f in range(-4,5):
            cv.line([(bx+f*11,225),(bx+f*11,825)],GOLDD if f%2 else GOLD,1)
        # capital steps
        for i in range(4):
            cv.rect(bx-62-i*0,200,bx+62,200+0,fill=None)
        for i,(y,wd) in enumerate([(200,62),(188,74),(176,86)]):
            cv.rect(bx-wd,y,bx+wd,y+12,fill=(14,14,18),outline=GOLD,w=1.5)
        chevrons(cv,bx,240,44,10,52,18,GOLD,1.8)
    # plinth steps
    for i,(y,hw) in enumerate([(850,470),(866,520),(882,570)]):
        cv.rect(cx-hw,y,cx+hw,y+16,fill=(14,14,18),outline=GOLD,w=2)
        for t in range(-hw+14,hw,28):
            cv.line([(cx+t,y+3),(cx+t,y+13)],GOLDD,1)
    corner_fans(cv,66,66,W-66,H-66,56,5,GOLD,1.2)
    img=cv.final()
    place_noun(img,9,16,cx,840)
    tracked(img,cx,78,"THE OFFICE",F("InterDisplay-Bold.otf",54),GOLD2,track=22)
    d=ImageDraw.Draw(img)
    d.line([(cx-300,150),(cx-70,150)],fill=GOLD,width=2); d.line([(cx+70,150),(cx+300,150)],fill=GOLD,width=2)
    d.polygon([(cx,140),(cx+10,150),(cx,160),(cx-10,150)],fill=GOLD)
    tracked(img,cx,922,"OFFICE KIT · CC0",F("Inter-Medium.otf",16),GOLD,track=6)
    img.save("/tmp/kitart/deco/deco-1.png")

# =============== 2: ELEVATOR DOORS ===============
def art2():
    cv=Canvas((10,10,13))
    border(cv)
    cx=800
    # outer stepped pilasters
    for sx in (-1,1):
        for i,(wd,c) in enumerate([(78,GOLD),(62,GOLDD),(46,GOLD)]):
            x=cx+sx*(660-i*0)
            cv.rect(min(x,x+sx*wd)-0,100,max(x,x+sx*wd),920,fill=None)
    # frame block
    cv.rect(160,90,1440,930,fill=(16,16,20),outline=GOLD,w=3)
    cv.rect(176,106,1424,914,outline=GOLDD,w=1.5)
    # lintel with floor dial
    cv.rect(200,120,1400,300,fill=(13,13,17),outline=GOLD,w=2)
    cv.pie(cx,300,130,180,360,NAVYD)
    for i in range(14):
        a0=180+i*180/14; a1=a0+180/14-1.5
        lit = (i==12)
        cv.pie(cx,300,124,a0,a1,GOLD2 if lit else (EMD if i%2==0 else NAVY))
    cv.pie(cx,300,76,180,360,(13,13,17))
    fan(cv,cx,300,76,3,GOLD,1.5)
    cv.arc(cx,300,130,180,360,GOLD,3); cv.arc(cx,300,138,180,360,GOLDD,1.5)
    ray_lines(cv,cx,300,28,76,130,GOLD,1,180,360)
    # lintel side motifs
    for sx in (-1,1):
        x0=cx+sx*210
        for i in range(6):
            xx=x0+sx*i*28
            cv.line([(xx,150),(xx+sx*14,210),(xx,270)],GOLD if i%2==0 else GOLDD,2)
        cv.line([(cx+sx*190,300),(cx+sx*600,300)],GOLD,2)
    # doors
    gap=290
    top=300; bot=914
    for sx in (-1,1):
        xi=cx+sx*gap; xo=cx+sx*(gap+310)
        x0,x1=min(xi,xo),max(xi,xo)
        cv.rect(x0,top,x1,bot,fill=(12,12,16),outline=GOLD,w=3)
        # stepped inset panels
        for k,(ins,c,w) in enumerate([(14,GOLD,2),(28,GOLDD,1.2),(40,GOLD,1.2)]):
            cv.poly(chamfer(x0+ins,top+ins,x1-ins,bot-ins,22-k*4),outline=c,w=w)
        # fan at top inner corner
        fcx=xi; 
        a0,a1=(0,90) if sx==1 else (90,180)
        for i in range(1,8):
            cv.arc(fcx,top+40,i*20,a0,a1,GOLD if i%2 else GOLDD,1.3)
        # fan at inner top: quarter: draw downward
        # vertical flutes
        mid=(x0+x1)/2
        for f in range(-5,6):
            xx=mid+f*12
            cv.line([(xx,top+240),(xx,bot-60)],GOLDD,1)
        # chevron stack
        chevrons(cv,mid,top+200,60,5,16,22,GOLD,2)
        for i in range(5):
            cv.line([(mid-70,top+240+i*0),(mid-70,top+240)],GOLDD,1)
        # diamond medallion
        my=top+130
        cv.poly([(mid,my-48),(mid+48,my),(mid,my+48),(mid-48,my)],fill=EMD,outline=GOLD,w=2)
        cv.poly([(mid,my-30),(mid+30,my),(mid,my+30),(mid-30,my)],outline=GOLD2,w=1.5)
        cv.circ(mid,my,8,fill=GOLD)
        # handle bar + kick plate
        cv.rect(mid-70,bot-60,mid+70,bot-44,fill=(12,12,16),outline=GOLD,w=1.5)
    # opening interior
    ox0,ox1=cx-gap,cx+gap
    m=cv.mask(); ImageDraw.Draw(m).rectangle([ox0*K,top*K,ox1*K,bot*K],fill=255)
    layer=Image.new("RGB",cv.img.size,NAVYD); L=Canvas(); L.img=layer; L.d=ImageDraw.Draw(layer)
    L.vgrad(0,top,W,bot,(8,20,44),(5,30,30))
    rays(L,cx,600,40,1200,(12,48,52),(8,30,38),a_off=0,a_from=180,a_to=360)
    # back wall panels
    for i in range(-3,4):
        L.rect(cx+i*80-34,top+40,cx+i*80+34,bot-120,outline=GOLDD,w=1)
    cv.paste_masked(layer,m)
    glow(cv,cx,520,260,(60,200,160),40,80)
    cv.img.paste(Image.new("RGB",cv.img.size,BLACK),(0,0),Image.new("L",cv.img.size,0))
    # floor
    cv.poly([(ox0,bot-120),(ox1,bot-120),(ox1,bot),(ox0,bot)],fill=(10,22,28))
    for i in range(-8,9):
        cv.line([(cx+i*14,bot-120),(cx+i*58,bot)],GOLDD,1)
    for y in (bot-90,bot-55,bot-24):
        cv.line([(ox0,y),(ox1,y)],GOLDD,1)
    cv.line([(ox0,bot-120),(ox1,bot-120)],GOLD,2)
    cv.rect(ox0,top,ox1,bot,outline=GOLD,w=3)
    # base plinth
    cv.rect(176,914,1424,930,fill=(16,16,20),outline=GOLD,w=2)
    corner_fans(cv,66,66,W-66,H-66,56,5,GOLD,1.2)
    img=cv.final()
    place_noun(img,14,16,cx,880)
    tracked(img,cx,138,"FLOOR 13",F("InterDisplay-Bold.otf",30),GOLD2,track=18)
    # number inside dial
    f=F("InterDisplay-Black.otf",44); ImageDraw.Draw(img).text((cx,274),"13",font=f,fill=GOLD2,anchor="mm")
    tracked(img,cx,945,"OFFICE KIT · CC0",F("Inter-Medium.otf",15),GOLD,track=6)
    img.save("/tmp/kitart/deco/deco-2.png")

# =============== 3: THEATRE MARQUEE ===============
def art3():
    cv=Canvas()
    cv.vgrad(0,0,W,H,(8,8,12),(14,10,12))
    border(cv)
    cx=800
    # marquee box
    mx0,my0,mx1,my1=270,70,1330,300
    cv.poly(chamfer(mx0-24,my0-8,mx1+24,my1+8,34),fill=(14,14,18),outline=GOLD,w=4)
    cv.poly(chamfer(mx0,my0+16,mx1,my1-16,24),fill=NAVYD,outline=GOLD,w=2)
    cv.poly(chamfer(mx0+14,my0+30,mx1-14,my1-30,16),outline=GOLDD,w=1.2)
    # bulbs
    glow_layer=Image.new("RGBA",cv.img.size,(0,0,0,0)); gd=ImageDraw.Draw(glow_layer)
    bulbs=[]
    for x in range(mx0-4,mx1+5,36): bulbs += [(x,my0-8+10),(x,my1+8-10)]
    for y in range(my0+36,my1-30,36): bulbs += [(mx0-24+10,y),(mx1+24-10,y)]
    for (bx,by) in bulbs:
        gd.ellipse([(bx-14)*K,(by-14)*K,(bx+14)*K,(by+14)*K],fill=(255,210,90,150))
    glow_layer=glow_layer.filter(ImageFilter.GaussianBlur(9*K)); cv.img.paste(glow_layer,(0,0),glow_layer)
    for (bx,by) in bulbs:
        cv.circ(bx,by,6,fill=(255,236,170)); cv.circ(bx,by,6,outline=GOLD,w=1.5)
    # marquee crest fan above
    # proscenium
    px0,px1,pt,pb=140,1460,330,930
    cv.rect(px0,pt,px1,pb,fill=(10,10,14),outline=GOLD,w=3)
    # stage back
    sx0,sx1=470,1130
    m=cv.mask(); ImageDraw.Draw(m).rectangle([sx0*K,(pt+80)*K,sx1*K,880*K],fill=255)
    layer=Image.new("RGB",cv.img.size,BLACK); L=Canvas(); L.img=layer; L.d=ImageDraw.Draw(layer)
    rays(L,cx,880,36,1200,(12,70,58),(7,36,34),a_from=180,a_to=360)
    ray_lines(L,cx,880,36,40,1200,GOLDD,1,180,360)
    for i,r in enumerate(range(80,700,70)): L.arc(cx,880,r,180,360,GOLD if i%2==0 else GOLDD,2 if i%2==0 else 1)
    cv.paste_masked(layer,m)
    cv.rect(sx0,pt+80,sx1,880,outline=GOLD,w=2)
    # curtains
    for sx in (-1,1):
        base=px0+14 if sx==-1 else sx1
        xs=[]
        wd=sx0-px0-14
        x0=px0+14 if sx==-1 else sx1; x1=x0+wd
        cv.rect(x0,pt+14,x1,pb-14,fill=NAVY)
        n=9
        for i in range(n):
            xa=x0+wd*i/n; xb=x0+wd*(i+1)/n
            c=NAVYL if i%2==0 else NAVYD
            cv.rect(xa,pt+14,xb,pb-14,fill=c)
            cv.line([(xa,pt+14),(xa,pb-14)],GOLDD,1)
        # swag: curve inner edge
        cv.line([(x0,pt+14),(x0,pb-14)],GOLD,2); cv.line([(x1,pt+14),(x1,pb-14)],GOLD,2)
        # tassel bands
        for yy in (700,):
            cv.rect(x0,yy,x1,yy+12,fill=GOLD)
            cv.rect(x0,yy+16,x1,yy+19,fill=GOLDD)
    # valance scallops
    cv.rect(px0+14,pt+14,px1-14,pt+54,fill=EMD)
    cv.line([(px0+14,pt+54),(px1-14,pt+54)],GOLD,2)
    n=22; wd=(px1-px0-28)/n
    for i in range(n):
        a=px0+14+i*wd
        cv.pie(a+wd/2,pt+54,wd/2,0,180,EM if i%2 else EML)
        cv.arc(a+wd/2,pt+54,wd/2,0,180,GOLD,2)
        cv.arc(a+wd/2,pt+54,wd/2-8,0,180,GOLDD,1)
    # floor
    cv.rect(sx0,880,sx1,pb-14,fill=(20,14,10))
    for i in range(-14,15):
        xa=cx+i*20; xb=cx+i*70
        # clip line to stage width
        if abs(xb-cx)>330:
            t=(330*(1 if xb>cx else -1)+cx-xa)/(xb-xa); xb=cx+(330 if xb>cx else -330); yb=880+(pb-14-880)*t
        else: yb=pb-14
        cv.line([(xa,880),(xb,yb)],GOLDD,1)
    cv.line([(sx0,880),(sx1,880)],GOLD,2)
    for y in (900,917): cv.line([(sx0,y),(sx1,y)],GOLDD,1)
    # footlights
    for i in range(-16,17):
        x=cx+i*38
        cv.pie(x,pb-14,10,180,360,GOLD2)
    # spotlight
    sp=Image.new("RGBA",cv.img.size,(0,0,0,0)); sd=ImageDraw.Draw(sp)
    sd.polygon(cv.p([(cx-30,pt+54),(cx+30,pt+54),(cx+270,880),(cx-270,880)]),fill=(255,230,150,46))
    sd.ellipse([(cx-270)*K,(880-30)*K,(cx+270)*K,(880+30)*K],fill=(255,230,150,60))
    sp=sp.filter(ImageFilter.GaussianBlur(5*K)); cv.img.paste(sp,(0,0),sp)
    # side chevron ornaments in margins
    for sgn in (-1,1):
        bx=cx+sgn*(690)
        pass
    corner_fans(cv,66,66,W-66,H-66,56,5,GOLD,1.2)
    img=cv.final()
    place_noun(img,5,14,cx,880)
    tracked(img,cx,122,"THE OFFICE",F("InterDisplay-Black.otf",70),GOLD2,track=26)
    tracked(img,cx,226,"ONE NIGHT ONLY",F("Inter-SemiBold.otf",22),CREAM,track=14)
    d=ImageDraw.Draw(img)
    d.line([(cx-340,215),(cx-60+0,215)],fill=GOLDD,width=1) if False else None
    tracked(img,cx,947,"OFFICE KIT · CC0",F("Inter-Medium.otf",14),GOLD,track=6)
    img.save("/tmp/kitart/deco/deco-3.png")

# =============== 4: OCEAN LINER POSTER ===============
def art4():
    cv=Canvas(NAVYD)
    cv.vgrad(0,0,W,H,(8,18,40),(6,14,30))
    border(cv)
    cx=800; cy=490; R=300
    # speed lines left/right
    for sx in (-1,1):
        for i,(y,l) in enumerate([(310,260),(332,200),(354,300),(376,150),(398,330),(420,220),(442,280),(464,170),(486,310),(508,230),(530,190),(552,290),(574,140)]):
            xs=cx+sx*(R+60); xe=xs+sx*l
            cv.line([(xs,y),(min(max(xe,90),W-90),y)],GOLD if i%3==0 else GOLDD,2 if i%3==0 else 1.2)
    # porthole interior
    m=cv.mask(); ImageDraw.Draw(m).ellipse([(cx-R)*K,(cy-R)*K,(cx+R)*K,(cy+R)*K],fill=255)
    layer=Image.new("RGB",cv.img.size,NAVYD); L=Canvas(); L.img=layer; L.d=ImageDraw.Draw(layer)
    hz=cy+100
    L.vgrad(0,cy-R,W,hz,(10,30,70),(210,150,50))
    rays(L,cx,hz,48,1200,(230,168,56),(200,140,40),a_from=180,a_to=360)
    # darken sky tone with overlay gradient
    ov=Image.new("RGBA",layer.size,(0,0,0,0)); od=ImageDraw.Draw(ov)
    for y in range(int((cy-R)*K),int(hz*K)):
        t=(y-(cy-R)*K)/((hz-(cy-R))*K)
        od.line([(0,y),(W*K,y)],fill=(10,24,56,int(235*(1-t)**1.2)))
    layer.paste(ov,(0,0),ov)
    L.circ(cx,hz,150,fill=(245,214,120)); L.circ(cx,hz,150,outline=GOLD2,w=3)
    for r in (118,86): L.circ(cx,hz,r,outline=(214,170,60),w=2)
    # sea
    L.rect(0,hz,W,H,fill=NAVY)
    rows=[(hz,EMD,NAVY),(hz+40,NAVY,EMD),(hz+80,EMD,NAVYD),(hz+120,NAVYD,EM),(hz+160,EM,NAVYD),(hz+200,NAVYD,EMD)]
    for ri,(y,c0,c1) in enumerate(rows):
        L.rect(0,y,W,y+40,fill=c1)
        wd=48+ri*8
        x=cx-wd*20
        k=0
        while x<cx+wd*20:
            L.pie(x+wd/2,y+40,wd/2,180,360,c0 if True else c1)
            L.arc(x+wd/2,y+40,wd/2,180,360,GOLD if ri%2==0 else GOLDD,2)
            L.arc(x+wd/2,y+40,wd/2-8,180,360,GOLDD,1)
            x+=wd; k+=1
    L.line([(0,hz),(W,hz)],GOLD,2)
    cv.paste_masked(layer,m)
    # porthole ring
    for r,c,w in [(R,GOLD,6),(R+10,GOLDD,2),(R+22,GOLD,3),(R+34,GOLDD,1.5)]:
        cv.circ(cx,cy,r,outline=c,w=w)
    for i in range(24):
        a=math.radians(i*15+7.5); rr=R+16
        bx,by=cx+rr*math.cos(a),cy+rr*math.sin(a)
        cv.circ(bx,by,3.5,fill=GOLD2)
    # rays outside the ring, fan
    ray_lines(cv,cx,cy,96,R+46,R+66,GOLD,1.2)
    # deck / hull
    dy=790
    for i,(y,hw) in enumerate([(dy,560),(dy+14,600),(dy+28,640)]):
        cv.rect(cx-hw,y,cx+hw,y+14,fill=(16,22,40),outline=GOLD,w=2)
    cv.rect(cx-640,dy+42,cx+640,dy+112,fill=NAVY,outline=GOLD,w=2)
    # railing posts
    for x in range(cx-560,cx+561,40):
        cv.line([(x,dy-34),(x,dy)],GOLDD,1.5)
    cv.line([(cx-560,dy-34),(cx+560,dy-34)],GOLD,2)
    # portholes row
    for x in range(cx-610,cx+611,40):
        if abs(x-cx)<240: continue
        cv.circ(x,dy+77,9,fill=NAVYD,outline=GOLD,w=2)
    # plaque
    cv.poly(chamfer(cx-210,dy+48,cx+210,dy+106,12),fill=NAVYD,outline=GOLD,w=2.5)
    cv.poly(chamfer(cx-200,dy+55,cx+200,dy+99,8),outline=GOLDD,w=1)
    corner_fans(cv,66,66,W-66,H-66,56,5,GOLD,1.2)
    img=cv.final()
    # clip noun: stands on deck line
    place_noun(img,21,16,cx,dy+2)
    tracked(img,cx,74,"OFFICE LINE",F("InterDisplay-Bold.otf",34),GOLD2,track=28)
    d=ImageDraw.Draw(img)
    tracked(img,cx,dy+57,"SAIL AT NOON",F("InterDisplay-Bold.otf",26),GOLD2,track=16)
    tracked(img,cx,918,"OFFICE KIT · CC0",F("Inter-Medium.otf",14),GOLD,track=6)
    img.save("/tmp/kitart/deco/deco-4.png")

if __name__=="__main__":
    art1(); art2(); art3(); art4()
