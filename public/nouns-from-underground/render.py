"""Official CC0 Nouns RLE assembly; no generative image model."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib, shutil
R=Path(__file__).resolve().parent
source=R/'image-data.json'
if not source.exists():source=R.parent/'sermon-of-the-sun/image-data.json'
J=json.loads(source.read_text());roster=json.loads((R/'roster.json').read_text())
(R/'avatars').mkdir(exist_ok=True)
cats={'body':'bodies','accessory':'accessories','head':'heads','glasses':'glasses'}
for item in roster:
 recipe=item['recipe'];im=Image.new('RGB',(32,32),'#'+J['bgcolors'][recipe['background']]);d=ImageDraw.Draw(im)
 # Expand each official RLE layer into pixels, retaining exact palette colors.
 for cat,plural in cats.items():
  b=bytes.fromhex(J['images'][plural][recipe[cat]]['data'][2:]);_,top,right,bottom,left=b[:5];index=0
  for count,color in zip(b[5::2],b[6::2]):
   for _ in range(count):
    x,y=left+index%(right-left),top+index//(right-left)
    if color: im.putpixel((x,y),tuple(bytes.fromhex(J['palette'][color])))
    index+=1
 # Compact SVG encodes final official pixels as horizontal runs grouped by color.
 paths={}
 for y in range(32):
  x=0
  while x<32:
   color=im.getpixel((x,y));end=x+1
   while end<32 and im.getpixel((end,y))==color:end+=1
   key='#%02x%02x%02x'%color;paths.setdefault(key,[]).append(f'M{x} {y}h{end-x}v1H{x}z');x=end
 svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">'+''.join('<path fill="'+c+'" d="'+''.join(p)+'"/>' for c,p in paths.items())+'</svg>'
 (R/'avatars'/(item['handle']+'.svg')).write_text(svg)
 im.resize((512,512),Image.Resampling.NEAREST).save(R/'avatars'/(item['handle']+'.png'))
 item['portrait']='avatars/'+item['handle']+'.svg'
(R/'roster.json').write_text(json.dumps(roster,indent=2))
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def f(n,b=False):return ImageFont.truetype(bold if b else font,n)
sheet=Image.new('RGB',(1500,3190),'#111d18');d=ImageDraw.Draw(sheet)
d.text((55,40),'NOUNS FROM',font=f(66,True),fill='#e3edbe');d.text((55,115),'UNDERGROUND',font=f(83,True),fill='#c4ec77')
d.text((58,225),'50 SOL PERSONAS  /  TEN WORKSHOPS  /  MH',font=f(23),fill='#b3bba7')
for item in roster:
 i=item['number']-1;x=30+(i%5)*295;y=290+(i//5)*285
 pic=Image.open(R/'avatars'/(item['handle']+'.png')).resize((214,214),Image.Resampling.NEAREST)
 sheet.paste(pic,(x+24,y));d.text((x+24,y+221),f"{i+1:02d}  {item['name']}",font=f(23,True),fill='#e3edbe')
 d.text((x+24,y+251),item['role'],font=f(16),fill='#b3bba7')
d.text((55,3150),'Official CC0 Nouns traits. Original personas. On-demand sessions.',font=f(18),fill='#b3bba7')
sheet.save(R/'underground-roster.png')
if source.resolve()!=(R/'image-data.json').resolve():shutil.copyfile(source,R/'image-data.json')
(R/'provenance.json').write_text(json.dumps({'official_source':'https://raw.githubusercontent.com/nounsDAO/nouns-monorepo/master/packages/nouns-assets/src/image-data.json','source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'license':'CC0','method':'Exact official RLE palette/layer assembly; no imagegen, recoloring or redrawing. Original persona combinations, not token ownership claims.','unique_heads':50,'heads_distinct_from_sun_crew':True},indent=2))
print('Rendered 50 portraits and contact sheet')
