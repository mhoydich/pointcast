"""Official Nouns RLE assets composited into original coded scenes; no imagegen.
Run python build_scenes.py. Requires Pillow. Source is SHA-256 pinned.
"""
from pathlib import Path
import json,hashlib,subprocess,math
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parent
S=R/'source-image-data.json'
URL='https://raw.githubusercontent.com/nounsDAO/nouns-monorepo/2213eea1c15f331f786784c2621d53bdecf907e2/packages/nouns-assets/src/image-data.json'
if not S.exists():subprocess.run(['curl','-L','--max-time','30','-fsS',URL,'-o',str(S)],check=True)
assert hashlib.sha256(S.read_bytes()).hexdigest()=='a03f22b7838b35fdf0332617c9b8e2b032eb26cf1632afbefb200fec64c4bc20'
data=json.loads(S.read_text())
P={'ink':'#14243d','cream':'#f5f0df','mint':'#87c9b5','pink':'#e8aea8','coral':'#d95643','gold':'#e8b94b','blue':'#418cb0','sky':'#a9cfdb','dark':'#202335','lilac':'#b7a5c5','white':'#fff8eb'}
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=lambda n,b=False:ImageFont.truetype(BOLD if b else FONT,n)
seeds={'Hem':{'body':13,'accessory':73,'head':68,'glasses':15},'Heckle':{'body':2,'accessory':4,'head':74,'glasses':0},'laundry-attendant':{'body':24,'accessory':73,'head':222,'glasses':0},'cup-visitor':{'body':3,'accessory':103,'head':133,'glasses':15},'moon-reader':{'body':23,'accessory':91,'head':128,'glasses':0},'garden-reader':{'body':2,'accessory':73,'head':19,'glasses':15},'pencil-reader':{'body':24,'accessory':103,'head':149,'glasses':0}}
beret=[(16,0,1,2),(11,2,10,1),(7,3,17,1),(5,4,20,1),(3,5,23,1),(3,6,22,1),(4,7,20,1),(5,8,17,1),(10,9,12,1)]
def noun(name,hat=True):
 im=Image.new('RGBA',(32,32));d=ImageDraw.Draw(im);seed=seeds[name]
 for group,key in [('bodies','body'),('accessories','accessory'),('heads','head'),('glasses','glasses')]:
  raw=bytes.fromhex(data['images'][group][seed[key]]['data'].removeprefix('0x'));pal,top,right,bottom,left=raw[:5];x,y=left,top
  assert pal==0
  for k in range(5,len(raw),2):
   remain,c=raw[k:k+2]
   while remain:
    w=min(remain,right-x);assert w>0 and y<32
    if c:d.rectangle((x,y,x+w-1,y),fill='#'+data['palette'][c])
    remain-=w;x+=w
    if x==right:x,y=left,y+1
 if name=='Hem' and hat:
  for x,y,w,h in beret:d.rectangle((x,y,x+w-1,y+h-1),fill='#17171e')
 return im
class Scene:
 def __init__(self,title,kicker,bg):
  self.im=Image.new('RGB',(800,450),bg);self.d=ImageDraw.Draw(self.im)
  self.rect(0,0,800,64,P['cream']);self.text(26,12,kicker,10,P['coral'],True);self.text(24,28,title,23,P['ink'],True)
  self.rect(0,430,800,20,P['ink']);self.text(24,434,'HEM / LOOM PLAYGROUND     •     OFFICIAL NOUNS ASSETS + CODED SCENES',8,P['cream'])
 def rect(self,x,y,w,h,c):self.d.rectangle((x,y,x+w-1,y+h-1),fill=c)
 def poly(self,pts,c):self.d.polygon(pts,fill=c)
 def line(self,pts,c,w=2):self.d.line(pts,fill=c,width=w)
 def ellipse(self,x,y,w,h,c):self.d.ellipse((x,y,x+w,y+h),fill=c)
 def text(self,x,y,t,n=12,c=None,b=False):self.d.text((x,y),t,font=font(n,b),fill=c or P['ink'])
 def character(self,name,x,y,scale=4,hat=True):
  img=noun(name,hat).resize((32*scale,32*scale),Image.Resampling.NEAREST);self.im.paste(img,(x,y),img)
 def plant(self,x,y,scale=1):
  s=scale;self.poly([(x,y),(x+24*s,y),(x+20*s,y+22*s),(x+4*s,y+22*s)],P['coral'])
  self.line([(x+12*s,y),(x+12*s,y-48*s)],P['ink'],2*s)
  for a,b in [(-1,-12),(1,-24),(-1,-36)]:self.poly([(x+12*s,y+b*s),(x+(12+17*a)*s,y+(b-12)*s),(x+(12+13*a)*s,y+(b+4)*s)],P['mint'])
 def window(self,x,y,w,h):
  self.rect(x,y,w,h,P['ink']);self.rect(x+5,y+5,w-10,h-10,P['sky']);self.rect(x+w//2-2,y,4,h,P['ink'])
 def save(self,name):
  p=R/(name+'.png');self.im.resize((1600,900),Image.Resampling.NEAREST).save(p);return p.name
scenes=[]
# 1: laundry
s=Scene('THE POETRY LAUNDROMAT','01 / LEAVE A WORRY. COLLECT SIX LINES.',P['mint'])
s.rect(0,300,800,130,P['pink'])
for y in range(310,430,28):s.line([(0,y),(800,y)],'#c38f8c')
for x in range(-100,900,80):s.line([(x,300),(x+80,430)],'#c38f8c')
s.window(515,88,255,152)
s.ellipse(685,100,46,46,P['gold']);s.poly([(530,207),(755,170),(755,228),(530,228)],P['blue'])
for x in [28,182,336]:
 s.rect(x,162,140,156,P['cream']);s.rect(x,162,140,26,P['ink']);s.ellipse(x+24,202,92,92,P['ink']);s.ellipse(x+34,212,72,72,P['blue']);s.ellipse(x+46,227,46,42,P['sky']);s.rect(x+110,169,18,8,P['gold']);s.text(x+10,169,'RINSE / VERSE',8,P['cream'])
s.character('Hem',471,220,5);s.character('laundry-attendant',635,205,4)
s.rect(550,320,220,18,P['gold']);s.rect(568,338,8,60,P['ink']);s.rect(742,338,8,60,P['ink'])
s.rect(588,285,47,35,P['white']);s.text(594,290,'6 LINES',8);s.rect(649,302,62,9,P['pink']);s.rect(654,293,56,9,P['cream'])
s.text(34,104,'WORRIES IN',14,P['ink'],True);s.text(34,128,'POEMS OUT / NO COINS REQUIRED',10)
scenes.append(s.save('01-poetry-laundromat'))
# 2 exhibit
s=Scene('ONE CUP. FIVE WAYS IN.','02 / A COLLABORATIVE EXHIBITION',P['cream'])
s.rect(0,65,800,165,P['pink']);s.rect(0,230,800,200,'#ddd3b7')
for x in range(32,780,150):s.window(x,89,130,100)
s.ellipse(355,105,70,70,P['gold']);s.rect(360,65,80,162,P['pink'])
s.rect(40,314,720,18,P['ink']);s.rect(57,332,10,75,P['ink']);s.rect(731,332,10,75,P['ink'])
# Only Hem is depicted as a named participant; four chairs await guests.
s.character('Hem',25,214,4)
for i,x in enumerate([204,354,504,654],1):
 s.rect(x,260,76,52,P['mint']);s.rect(x+5,332,7,48,P['ink']);s.rect(x+64,332,7,48,P['ink']);s.rect(x+12,291,52,19,P['white']);s.text(x+17,295,'OPEN '+str(i),8)
s.ellipse(350,300,88,10,P['white']);s.rect(368,259,43,43,P['cream']);s.ellipse(404,270,18,19,P['cream']);s.ellipse(410,275,9,10,P['pink']);s.rect(370,260,39,5,P['coral'])
s.line([(379,249),(373,236),(380,222)],P['cream'],3);s.text(210,394,'ONE OBJECT / FOUR GUEST PLACES / NO INVENTED REPLIES',10)
scenes.append(s.save('02-one-cup-five-bots'))
# 3 courtyard mystery
s=Scene('THE MISSING BERET','03 / A VERY SMALL MYSTERY',P['sky'])
s.ellipse(630,83,82,82,P['gold']);s.rect(0,181,800,249,'#d9c9aa')
s.rect(30,102,435,110,P['cream']);s.rect(22,96,455,12,P['ink'])
for x in [48,153,258,363]:s.window(x,121,79,67)
s.line([(460,114),(520,70),(565,114)],P['ink'],3);s.rect(486,90,51,28,P['cream']);s.line([(493,119),(485,180)],P['ink']);s.line([(532,119),(540,180)],P['ink'])
s.poly([(258,260),(686,260),(768,413),(196,413)],P['cream']);s.poly([(284,278),(671,278),(730,395),(235,395)],P['blue'])
for yy in [300,331,364]:
 for xx in range(285,680,66):s.line([(xx,yy),(xx+30,yy)],P['sky'],2)
s.character('Hem',27,224,5,False);s.character('Heckle',636,184,4)
s.rect(182,212,14,62,P['ink']);s.line([(189,218),(215,218),(215,227)],P['ink'],4)
s.text(173,193,'EMPTY',8)
s.rect(483,229,88,8,P['coral']);s.rect(490,237,6,43,P['ink']);s.rect(559,237,6,43,P['ink'])
s.ellipse(503,216,42,10,'#17171e');s.rect(516,193,21,26,'#eaf2e6');s.line([(527,197),(527,174)],P['ink'],2);s.poly([(527,188),(507,171),(522,173)],P['mint']);s.poly([(527,180),(541,164),(543,175)],P['mint'])
s.line([(208,265),(229,258)],P['white'],4);s.text(33,401,'LOOK CLOSELY. THE COURTYARD HAS ALREADY LEFT A CLUE.',10)
scenes.append(s.save('03-missing-beret'))
# 4 club
s=Scene('BAD POETRY NIGHT','04 / QUESTIONABLE ACHIEVEMENT WELCOME',P['dark'])
s.rect(25,80,750,248,'#633844')
for x in range(25,775,32):s.rect(x,80,10,248,'#784655')
s.poly([(380,79),(205,329),(586,329)],'#b78268');s.rect(34,329,732,30,P['gold']);s.rect(15,359,770,71,P['ink'])
s.character('Hem',259,185,4);s.character('Heckle',416,196,4)
s.rect(394,220,4,108,P['ink']);s.ellipse(388,204,16,24,P['ink']);s.ellipse(373,321,45,6,P['ink'])
s.rect(577,128,154,94,P['cream']);s.text(595,142,'NO RHYME',15,P['coral'],True);s.text(595,168,'LEFT BEHIND',13,P['ink'],True);s.text(596,197,'ENTRY: ONE BAD POEM',8)
for x,n in [(35,'cup-visitor'),(620,'moon-reader')]:s.character(n,x,308,4)
for x in [197,350,503]:s.ellipse(x,390,43,27,'#4f6170')
scenes.append(s.save('04-bad-poetry-night'))
# 5 poem stand
s=Scene('POEMS YOU CAN FIND','05 / TAKE ONE. LEAVE THE VIEW.',P['sky'])
s.ellipse(520,83,92,92,P['gold']);s.rect(0,180,800,105,P['blue'])
for y in [205,230,256]:
 for x in range(0,800,70):s.line([(x,y),(x+35,y)],P['sky'],2)
s.rect(0,285,800,145,'#e2c899');s.poly([(0,368),(800,316),(800,360),(0,421)],P['cream'])
s.rect(64,169,13,183,P['ink']);s.poly([(24,171),(76,140),(122,176),(87,163),(84,198),(70,165),(33,190)],P['mint'])
s.rect(540,212,192,129,P['cream']);s.poly([(525,212),(747,212),(727,189),(545,189)],P['coral']);s.text(563,224,'TAKE A POEM',16,P['ink'],True)
for x in [559,612,665]:
 s.rect(x,254,40,62,P['white'])
 for y in range(265,300,7):s.line([(x+6,y),(x+32,y)],P['blue'])
s.rect(550,341,10,38,P['ink']);s.rect(712,341,10,38,P['ink'])
s.character('Hem',364,237,4);s.character('garden-reader',172,269,4)
s.text(28,409,'A CAFE / A COURTYARD / A COURT BAG / A SMALL DETOUR',9)
scenes.append(s.save('05-poems-you-can-find'))
# Portrait for fictional gull persona. Duck-head art remains unmodified.
av=Image.new('RGBA',(32,32),'#a9cfdb');n=noun('Heckle');av.alpha_composite(n);av.resize((1024,1024),Image.Resampling.NEAREST).convert('RGB').save(R/'heckle-avatar.png')
# Contact sheet with readable scene previews.
contact=Image.new('RGB',(1600,1580),P['cream']);d=ImageDraw.Draw(contact)
d.text((32,22),'HEM / THE LOOM PLAYGROUND',font=font(32,True),fill=P['ink']);d.text((32,68),'Five public games. Official Nouns artwork. Original coded scenes.',font=font(18),fill=P['ink'])
for i,name in enumerate(scenes):
 thumb=Image.open(R/name).resize((752,423),Image.Resampling.NEAREST);contact.paste(thumb,(32+(i%2)*784,110+(i//2)*475))
contact.paste(Image.open(R/'heckle-avatar.png').resize((280,280),Image.Resampling.NEAREST),(850,110+2*475+50));d.text((1150,1125),'HECKLE',font=font(27,True),fill=P['ink']);d.text((1150,1170),'Fictional gull poet.\nOfficial duck-head\nNouns art costume.',font=font(17),fill=P['ink'])
contact.save(R/'playground-preview.png')
prov={'source':URL,'source_sha256':hashlib.sha256(S.read_bytes()).hexdigest(),'license':'Official Nouns artwork CC0/public domain','method':'Official RLE traits decoded without modification; transparent compositing at integer scales; nearest-neighbor output. Hem adds a documented custom beret. Backgrounds and props are original code. No image-generation model used.','characters':{},'notes':['Heckle is a fictional gull persona depicted with the unmodified official head-duck trait; this is not an official seagull trait.','Exhibition scene deliberately leaves four guest chairs empty; it does not claim the invited bots participated.','All character combinations are asset remixes, not representations of a numbered minted Noun.'],'scenes':scenes}
for name,seed in seeds.items():prov['characters'][name]={'seed':seed,'traits':{key:data['images'][group][seed[key]]['filename'] for group,key in [('bodies','body'),('accessories','accessory'),('heads','head'),('glasses','glasses')]}}
(R/'provenance.json').write_text(json.dumps(prov,indent=2)+'\n')
print(json.dumps({'scenes':scenes,'portrait':'heckle-avatar.png','preview':'playground-preview.png'}))
