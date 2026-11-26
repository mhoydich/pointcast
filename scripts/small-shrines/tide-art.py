import math, random, sys
from PIL import Image, ImageDraw, ImageFilter
random.seed(5)
W,H=1536,1024
def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
img=Image.new('RGB',(W,H))
px=img.load()
sky_top=(232,226,214); sky_low=(240,214,196)
sea_far=(176,200,198); sea_near=(120,160,162)
sand_wet=(186,176,160); sand_dry=(226,214,192)
hz=360; shore=640
for y in range(H):
    if y<hz: c=lerp(sky_top,sky_low,(y/hz)**1.4)
    elif y<shore: c=lerp(sea_far,sea_near,((y-hz)/(shore-hz))**0.9)
    else: c=lerp(sand_wet,sand_dry,((y-shore)/(H-shore))**0.7)
    for x in range(W): px[x,y]=c
d=ImageDraw.Draw(img,'RGBA')
# soft sun glow low on horizon
glow=Image.new('L',(W,H),0); gd=ImageDraw.Draw(glow)
gd.ellipse((980,250,1260,470),fill=150); glow=glow.filter(ImageFilter.GaussianBlur(70))
img.paste(Image.new('RGB',(W,H),(250,226,206)),(0,0),glow)
d=ImageDraw.Draw(img,'RGBA')
# sea swell lines
for i in range(40):
    y=hz+6+i*7+random.randint(-2,2)
    a=40+random.randint(0,40)
    x0=random.randint(-200,W); L=random.randint(200,900)
    d.line([(x0,y),(x0+L,y+random.randint(-1,1))],fill=(240,246,242,a),width=random.choice([1,2]))
# sun reflection on water
for i in range(60):
    y=hz+4+i*4; w=int(120-i*1.2)+random.randint(-20,20); cx=1120+random.randint(-30,30)
    d.line([(cx-w,y),(cx+w,y)],fill=(252,236,220,max(0,90-i)),width=2)
# wave fronts toward shore: wavy foam lines
def wave(y0,amp,alpha,width,phase):
    pts=[(x, y0+amp*math.sin(x/180+phase)+8*math.sin(x/53+phase*2)) for x in range(-10,W+10,6)]
    d.line(pts,fill=(250,250,246,alpha),width=width)
    return pts
for k,(y0,amp,al,wd) in enumerate([(520,6,90,3),(570,8,120,4),(612,10,170,6)]):
    wave(y0,amp,al,wd,k*1.3)
# wet sand sheen band below shore line
sheen=Image.new('L',(W,H),0); sd=ImageDraw.Draw(sheen)
pts=[(x,shore+14*math.sin(x/210+0.6)+6*math.sin(x/61)) for x in range(-10,W+10,6)]
sd.polygon(pts+[(W+10,shore+150),(-10,shore+150)],fill=110)
sheen=sheen.filter(ImageFilter.GaussianBlur(18))
img.paste(Image.new('RGB',(W,H),(214,214,206)),(0,0),sheen)
d=ImageDraw.Draw(img,'RGBA')
# lace foam edge at waterline
lace=[(x,shore-4+14*math.sin(x/210+0.6)+6*math.sin(x/61)) for x in range(-10,W+10,4)]
d.line(lace,fill=(255,255,252,210),width=5)
for i in range(900):
    x=random.randint(0,W); y=int(shore+14*math.sin(x/210+0.6)+6*math.sin(x/61))+random.randint(-14,10)
    r=random.choice([1,1,2]); d.ellipse((x-r,y-r,x+r,y+r),fill=(255,255,250,random.randint(60,160)))
# tide marks: faint older high-water lines on dry sand
for k,y0 in enumerate([730,790,860]):
    pts=[(x,y0+10*math.sin(x/260+k)+4*math.sin(x/47+k)) for x in range(-10,W+10,6)]
    d.line(pts,fill=(170,156,134,70-k*15),width=2)
# smooth low stone, left of center foreground, with its wet shadow
st=Image.new('L',(W,H),0); sd=ImageDraw.Draw(st)
sd.ellipse((330,780,700,905),fill=255); st=st.filter(ImageFilter.GaussianBlur(3))
shadow=Image.new('L',(W,H),0); shd=ImageDraw.Draw(shadow); shd.ellipse((360,860,760,930),fill=120); shadow=shadow.filter(ImageFilter.GaussianBlur(14))
img.paste(Image.new('RGB',(W,H),(150,138,122)),(0,0),shadow)
stone=Image.new('RGB',(W,H)); sp=stone.load()
for y in range(770,915):
    for x in range(320,710):
        t=(y-780)/125; u=(x-330)/370
        c=lerp((176,172,164),(108,108,104),min(1,max(0,t*0.9+u*0.25)))
        sp[x,y]=c
img.paste(stone,(0,0),st)
d=ImageDraw.Draw(img,'RGBA')
d.arc((360,786,640,860),200,320,fill=(230,228,220,120),width=3)
# small pale shell
d.ellipse((760,835,786,852),fill=(244,232,222,230)); d.arc((760,835,786,852),180,360,fill=(200,180,170,200),width=1)
# grain
noise=Image.effect_noise((W,H),22).convert('L')
img=Image.blend(img,Image.merge('RGB',(noise,noise,noise)),0.045)
img=img.filter(ImageFilter.GaussianBlur(0.6))
img.save('tide-original.png'); img.save('tide.webp','WEBP',quality=82,method=6)
print('ok')
