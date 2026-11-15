import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
DATA = json.loads((OUT / 'official-image-data.json').read_text())
NAVY = '#07152f'
CREAM = '#f4f1e8'
GOLD = '#ffd15c'
CORAL = '#f24b32'
MINT = '#5ef0c0'
FONT_BOLD = '/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Bold.otf'
FONT_REG = '/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf'
FONT_MONO = '/usr/share/fonts/opentype/urw-base35/NimbusMonoPS-Regular.otf'

def layer(name, section):
    item = next(p for p in DATA['images'][section] if p['filename'] == name)
    b = bytes.fromhex(item['data'].removeprefix('0x'))
    palette_index, top, right, bottom, left = b[:5]
    result = Image.new('RGBA', (32, 32), (0,0,0,0))
    x, y = left, top
    for i in range(5, len(b), 2):
        length, color = b[i:i+2]
        for _ in range(length):
            if color:
                result.putpixel((x,y), tuple(bytes.fromhex(DATA['palette'][color])) + (255,))
            x += 1
            if x == right:
                x, y = left, y + 1
    return result

def noun(recipe, background=False):
    bg = '#'+DATA['bgcolors'][recipe.get('background',1)] if background else (0,0,0,0)
    im = Image.new('RGBA',(32,32),bg)
    for key, section in [('body','bodies'),('accessory','accessories'),('head','heads'),('glasses','glasses')]:
        im.alpha_composite(layer(recipe[key],section))
    return im

def recipe(head, body, glasses, accessory='accessory-none'):
    return dict(background=1,head='head-'+head,body='body-'+body,glasses='glasses-'+glasses,accessory=accessory)

RECIPES = [
    recipe('boombox','gold','square-guava'),
    recipe('brain','teal','square-yellow-saturated','accessory-think'),
    recipe('camcorder','purple','square-guava','accessory-flash'),
    recipe('cloud','blue-sky','square-red','accessory-cloud'),
    recipe('owl','orange-yellow','square-teal','accessory-pocket-pencil'),
    recipe('pencil-tip','teal-light','square-black','accessory-txt-a2+b2'),
    recipe('rainbow','redpinkish','square-black','accessory-heart'),
    recipe('robot','bluegrey','square-yellow-saturated','accessory-robot'),
    recipe('wizardhat','gold','square-guava','accessory-bling-sparkles'),
    recipe('satellite','teal','square-orange','accessory-eth'),
]

avatar = noun(RECIPES[0], True).resize((1024,1024),Image.Resampling.NEAREST).convert('RGB')
avatar.save(OUT/'Loom-Broadcaster-Noun-Avatar.png')

sheet = Image.new('RGB',(1000,440),CREAM)
d = ImageDraw.Draw(sheet)
font=ImageFont.truetype(FONT_REG,17)
for i,r in enumerate(RECIPES):
    x=(i%5)*200
    y=(i//5)*220
    im=noun(r,True).resize((192,192),Image.Resampling.NEAREST)
    sheet.paste(im,(x+4,y))
    d.text((x+8,y+197),r['head'].replace('head-',''),font=font,fill=NAVY)
sheet.save(OUT/'contact-sheet.png')
(OUT/'noun-recipes.json').write_text(json.dumps(RECIPES,indent=2)+'\n')
print('Rendered exact official Nouns traits:', len(RECIPES))

# Typography is drawn at 2x for smooth edges; the Nouns themselves remain exact
# integer-scaled pixels. The crowd uses original transparent layer composites.
S=2
canvas=Image.new('RGB',(1500*S,500*S),NAVY)
draw=ImageDraw.Draw(canvas)
def textxy(x,y,text,size=24,color=CREAM,font=FONT_REG):
    f=ImageFont.truetype(font,int(size*S))
    draw.text((int(x*S),int(y*S)),text,font=f,fill=color,anchor='lt')
def linexy(coords,fill,width=1):
    draw.line(tuple(int(v*S) for v in coords),fill=fill,width=width*S)

textxy(64,42,'THE LOOM',64,font=FONT_BOLD)
textxy(62,111,'BROADCASTER',104,font=FONT_BOLD)
textxy(884,40,'AGENTS, MODELS & MAKERS',15,GOLD,FONT_MONO)
textxy(884,75,'ChatGPT · Claude · Grok · Gemini',25)
textxy(884,112,'Llama · DeepSeek · Mistral · Qwen',25)
textxy(884,149,'Midjourney · Seedance · Ideogram',25)
linexy((64,211,1436,211),GOLD,2)
textxy(64,241,'OfficeNoun · Socrates · Hem',25,CORAL)
textxy(64,282,'GOOD STORIES.',18,CREAM,FONT_MONO)
textxy(64,309,'OPEN SIGNAL.',18,CREAM,FONT_MONO)

# Staggered crowd. Positions are visible-bounds coordinates, so large empty
# padding in the 32x32 source cannot create accidental gaps in the gaggle.
# Back row is placed first. Front row overlaps torsos while preserving faces.
crowd=[
    (4, 354, 260, 6),
    (8, 529, 267, 6),
    (3, 713, 254, 6),
    (2, 899, 276, 6),
    (9, 1260, 274, 6),
    (5, 440, 328, 6),
    (6, 624, 335, 6),
    (0, 799, 323, 7),
    (1, 1020, 314, 6),
    (7, 1157, 338, 6),
]
banner=canvas.resize((1500,500),Image.Resampling.LANCZOS)
for ri,x,y,scale in crowd:
    im=noun(RECIPES[ri])
    im=im.crop(im.getbbox())
    im=im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST)
    banner.paste(im,(x,y),im)
banner.save(OUT/'Loom-Broadcaster-Nouns-Banner.png')

# A review mock-up, not a screenshot or a claim about the live X account.
review=Image.new('RGB',(1500,810),CREAM)
review.paste(banner,(0,0))
rd=ImageDraw.Draw(review)
rd.ellipse((40,358,278,596),fill=CREAM)
circle=Image.new('L',(220,220),0)
ImageDraw.Draw(circle).ellipse((0,0,219,219),fill=255)
avatar_small=avatar.resize((220,220),Image.Resampling.NEAREST)
review.paste(avatar_small,(49,367),circle)
rd.text((58,624),'The Loom Broadcaster',font=ImageFont.truetype(FONT_BOLD,47),fill=NAVY,anchor='lt')
rd.text((59,681),'Stories, art, sound, and experiments from the Loom.',font=ImageFont.truetype(FONT_REG,27),fill=NAVY,anchor='lt')
rd.text((59,720),'People and AI making things together. Broadcasting from El Segundo.',font=ImageFont.truetype(FONT_REG,27),fill=NAVY,anchor='lt')
rd.text((1350,763),'PREVIEW',font=ImageFont.truetype(FONT_MONO,16),fill=NAVY,anchor='lt')
review.save(OUT/'Loom-Broadcaster-Profile-Preview.png')
print('Rendered 1500x500 banner and profile preview')

CARDS = [
 ('01-OfficeNoun','OfficeNoun',['ONE SMALL THING.','FINISHED.'],7,CORAL,'Work, with something to show.'),
 ('02-Midjourney','Midjourney',['ONE IDEA.','FOUR REFERENCES.'],8,GOLD,'An art desk experiment.'),
 ('03-Socrates','Socrates Tag',['PASS THE THOUGHT.','KEEP THE FIRE.'],4,MINT,'A game for the agents of PointCast.'),
 ('04-Hem','Hem',['A SMALL POEM','FOR THE','INTERVAL.'],5,CORAL,'Words between transmissions.'),
 ('05-Seedance','Seedance',['BEGINNING.','MIDDLE.','SIGNAL.'],2,GOLD,'A motion desk experiment.'),
 ('06-Benchmark','The benchmark desk',['WHAT DID THE','BENCHMARK','MEASURE?'],1,MINT,'The task. The setup. The result.'),
 ('07-Ideogram','Ideogram',['CHANGE THE WORDS.','KEEP THE IDEA.'],6,CORAL,'A design desk experiment.'),
 ('08-Agent-Strengths','The guest agent',['A STRENGTH,','WITH EVIDENCE.'],9,GOLD,'One brief. One visible result.'),
]
cards_dir=OUT/'broadcast-cards'
cards_dir.mkdir(exist_ok=True)
for filename,desk,lines,ri,accent,sub in CARDS:
    hi=Image.new('RGB',(1600*2,900*2),NAVY)
    dr=ImageDraw.Draw(hi)
    def ct(x,y,t,size,color=CREAM,face=FONT_REG):
        dr.text((x*2,y*2),t,font=ImageFont.truetype(face,size*2),fill=color,anchor='lt')
    ct(72,52,'THE LOOM BROADCASTER',28)
    dr.line((72*2,114*2,1528*2,114*2),fill=accent,width=4)
    ct(72,164,desk,36,accent)
    for j,t in enumerate(lines):
        ct(68,255+j*112,t,92,CREAM,FONT_BOLD)
    ct(72,685,sub,30)
    ct(72,812,'GOOD STORIES. OPEN SIGNAL.',21,accent,FONT_MONO)
    ct(1110,812,'EDITORIAL SERIES',19,CREAM,FONT_MONO)
    card=hi.resize((1600,900),Image.Resampling.LANCZOS)
    figure=noun(RECIPES[ri]); figure=figure.crop(figure.getbbox())
    scale=18
    figure=figure.resize((figure.width*scale,figure.height*scale),Image.Resampling.NEAREST)
    card.paste(figure,(1180-(figure.width//2),740-figure.height),figure)
    card.save(cards_dir/(filename+'.png'))
print('Rendered eight original station cards; no external model outputs represented')
