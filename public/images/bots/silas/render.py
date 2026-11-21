"""Render Silas from @nouns/assets 0.10.0 image-data.json; no generated art.
Usage: python render_silas.py /path/to/image-data.json /output/directory
"""
import json, pathlib, struct, sys, zlib, hashlib
source=pathlib.Path(sys.argv[1]); dest=pathlib.Path(sys.argv[2]);dest.mkdir(parents=True,exist_ok=True)
data=json.loads(source.read_text())
recipe={'bodies':'body-teal','accessories':'accessory-pocket-pencil','heads':'head-dictionary','glasses':'glasses-square-honey'}
bg=data['bgcolors'][0]
pixels=[[bg for x in range(32)] for y in range(32)]
rects=[]; seed={'background':0}
for category,name in recipe.items():
 index,part=next((i,p) for i,p in enumerate(data['images'][category]) if p['filename']==name)
 seed[{'bodies':'body','accessories':'accessory','heads':'head','glasses':'glasses'}[category]]=index
 encoded=bytes.fromhex(part['data'][2:]);palette,top,right,bottom,left=encoded[:5];x,y=left,top;count=0
 assert palette==0 and len(encoded[5:])%2==0
 for offset in range(5,len(encoded),2):
  length,color=encoded[offset:offset+2];count+=length
  while length:
   run=min(length,right-x); assert run>0 and y<=bottom
   if color:
    fill=data['palette'][color];rects.append(f'<rect x="{x}" y="{y}" width="{run}" height="1" fill="#{fill}"/>')
    for px in range(x,x+run):pixels[y][px]=fill
   x+=run;length-=run
   if x==right:x=left;y+=1
 assert count==(right-left)*(bottom-top+1),(name,count)
svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 32 32" shape-rendering="crispEdges"><title>Silas — official Nouns traits</title><rect width="32" height="32" fill="#{bg}"/>'+''.join(rects)+'</svg>\n'
(dest/'noun.svg').write_text(svg)
scale=10;raw=b''.join(b'\0'+b''.join(bytes.fromhex(c)*scale for c in row) for row in pixels for _ in range(scale))
def chunk(kind,payload):return struct.pack('>I',len(payload))+kind+payload+struct.pack('>I',zlib.crc32(kind+payload)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',320,320,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
(dest/'noun.png').write_bytes(png)
meta={'name':'Silas','source':'@nouns/assets@0.10.0/dist/image-data.json','source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'recipe':recipe,'seed':seed,'background':bg,'rendering':'Official RLE traits decoded in body, accessory, head, glasses order; PNG is nearest-neighbor 10x.'}
(dest/'recipe.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta,indent=2))
