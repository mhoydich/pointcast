"""Reproduce the LOW SLUNG art set. Python 3 + Pillow + NumPy; no image models or external assets."""
from pathlib import Path
import json,hashlib,zipfile,sys
from PIL import Image,ImageDraw,ImageFont
from nouns import draw_noun,NAMES,TRAITS
from backgrounds import draw_scene,PLACEMENTS
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'art'; OUT.mkdir(exist_ok=True)
TITLES={1:'Slatlight',2:'The Skimmer',3:'Laundry Weather',4:'Quiet Hours',5:'After the Rain',6:'Shared Shade',7:'Poolside Propagation',8:'The Long Way Home',9:'Porch Light',10:'Everybody’s Water'}
DESCRIPTIONS={1:'Louver Fern watches the shared courtyard through stripes of afternoon light.',2:'Leafcatch keeps the pool clear while the pumpjacks keep their own slow time.',3:'Figfold lets the laundry catch the same breeze as the airplanes.',4:'Agave Dial takes a quiet hour beneath the El Segundo water tower.',5:'Gutterbloom finds a small garden in the rain left behind.',6:'Pepperwing moves one ordinary chair into the shared shade.',7:'Rootglass grows another garden from a neighbor’s cutting.',8:'Nasturtium Loop takes the stairs home through a tangle of flowers.',9:'Saltmoth waits for the porch light beside the still blue pool.',10:'Ripplepod floats in a little rectangle of everybody’s water.'}
BACKGROUNDS={1:'Venetian blinds, low-slung courtyard apartment and pool',2:'Oil pumpjacks, modest apartment roofline and pool',3:'Airport flight path, laundry lines and courtyard pool',4:'El Segundo water tower, agaves and apartment deck',5:'Rain puddles, breezeblock garden and pool',6:'Pepper-tree courtyard, webbed chair and pool',7:'Aircraft, propagation table and apartment balcony',8:'Exterior stairs, nasturtium vines and pool',9:'Night courtyard, porch light and pool reflections',10:'Overhead pool, jacaranda petals and coastal geometry'}
def signature(im):
    d=ImageDraw.Draw(im)
    # An original small monoline lowercase mh mark, rendered as geometry.
    x,y=im.width-105,im.height-54
    pts=[[(0,18),(3,3),(4,17),(10,5),(14,5),(14,18),(20,5),(24,5),(25,18)],[(33,18),(38,-5),(36,8),(43,3),(47,5),(46,18)]]
    for p in pts:d.line([(x+a,y+b) for a,b in p],fill='#F7EDDC',width=7,joint='curve')
    for p in pts:d.line([(x+a,y+b) for a,b in p],fill='#172D41',width=3,joint='curve')
    return im
ONLY=set(map(int,sys.argv[1:])) if len(sys.argv)>1 else None
rows=[]
for i in range(1,11):
    filename=f'{i:02d}-{TITLES[i].lower().replace(" ","-").replace("’","")}.png'
    p=OUT/filename
    if ONLY is None or i in ONLY or not p.exists():
        im=draw_scene(i).convert('RGBA')
        x,y,scale=PLACEMENTS[i]
        sprite=draw_noun(i).resize((32*scale,40*scale),Image.Resampling.NEAREST)
        im.alpha_composite(sprite,(x,y))
        im=signature(im.convert('RGB'))
        im.save(p,optimize=True)
    rows.append({'number':i,'name':f'Low Slung · {i:02d} · {TITLES[i]}','character':NAMES[i],'description':DESCRIPTIONS[i]+' Original code-drawn Nouns-inspired character in a Southern California scene. El Segundo Edition, signed mh. Not an official Nouns token.','background':BACKGROUNDS[i],'traits':TRAITS[i],'file':filename,'mimeType':'image/png','width':1800,'height':1200,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'creator':'Michael Hoydich','signature':'mh','imageGenerationModelUsed':False})
manifest={'series':'Low Slung: El Segundo Edition','creator':'Michael Hoydich','signature':'mh','bot':'Court Moth (@courtmoth)','date':'2026-11-12','artworkCount':10,'method':'Deterministic Python/Pillow vector geometry and original pixel traits; AI-assisted code, no image-generation model. Reproducible from included source.','provenance':'New custom Nouns-inspired designs, not official Nouns tokens. No claim of exhaustive worldwide uniqueness.','mintStatus':'not minted by this session','chainRequested':'tezos','mintTerms':{'collection':None,'editionsPerArtwork':None,'price':None,'royalties':None,'feeCap':None,'license':None},'artworks':rows}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
# A legible two-column visual catalogue for phone and desktop viewing.
W,H=1280,2580
sheet=Image.new('RGB',(W,H),'#F3EEE1');d=ImageDraw.Draw(sheet)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
f=lambda s,b=False:ImageFont.truetype(bold if b else font,s)
d.text((40,26),'LOW SLUNG',font=f(48,True),fill='#172D41')
d.text((42,88),'EL SEGUNDO EDITION  /  TEN COURTYARD NEIGHBORS  /  mh',font=f(19),fill='#344E57')
for i,row in enumerate(rows):
    x=40+(i%2)*620;y=150+(i//2)*475
    a=Image.open(OUT/row['file']).resize((580,387),Image.Resampling.LANCZOS)
    sheet.paste(a,(x,y))
    d.text((x,y+400),f'{row["number"]:02d}  {TITLES[row["number"]]}',font=f(24,True),fill='#172D41')
    d.text((x,y+434),row['character'],font=f(19),fill='#536468')
sheet.save(ROOT/'low-slung-el-segundo-preview.jpg',quality=94)
readme='''# Low Slung: El Segundo Edition\n\nTen original Nouns-inspired pixel characters in ten El Segundo scenes. Signed mh.\n\nCreator and art direction: Michael Hoydich. Production: Court Moth, his Codex art bot. Every character and background is drawn by reproducible Python code. No image-generation model was used. The code was written with AI assistance. These are custom Nouns-inspired characters, not official Nouns tokens.\n\n## Reproduce\n\nInstall Pillow and NumPy, then run `python build.py` beside `backgrounds.py` and `nouns.py`. The ten RGB PNG masters are 1800 × 1200. `manifest.json` records the original traits and SHA-256 checksums.\n\n## Tezos handoff\n\nMike asked Ledger to assess minting these ten artworks on Tezos. Edition quantities, collection, sale price, royalties, license and fee cap remain unspecified. All mint term fields are intentionally null. Upload/pin the exact approved PNG files, verify hashes, and present the concrete mint terms to Mike through Ledger’s authorized wallet workflow. Preserve the mh signature and attribution. Do not substitute official Nouns art or use generated image models. Report IPFS addresses, token links and operation hashes when completed.\n\n## Artworks\n\n'''
for r in rows:readme+=f'{r["number"]:02d}. **{TITLES[r["number"]]}** — {r["character"]}. {DESCRIPTIONS[r["number"]]}\n\n'
(ROOT/'README.md').write_text(readme)
print(json.dumps({'artworks':len(rows),'files':[r['file'] for r in rows],'preview':str(ROOT/'low-slung-el-segundo-preview.jpg')}))
