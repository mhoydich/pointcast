from pathlib import Path
import json,math,wave,struct,subprocess,html
r=Path(__file__).resolve().parent
roster=json.loads((r/'roster.json').read_text());s=json.loads((r/'workers/sun-cadence-score.json').read_text())
rate=22050;beat=60/s['bpm'];data=[0.0]*int(rate*(32*beat+1.4))
def tone(start,note,length,vol):
 freq=440*2**((note-69)/12);offset=int(start*rate)
 for z in range(min(int(length*rate),len(data)-offset)):
  t=z/rate;env=min(t/.008,1)*math.exp(-t*4/length)*min((length-t)/.05,1)
  data[offset+z]+=vol*env*(math.sin(2*math.pi*freq*t)+.18*math.sin(2*math.pi*freq*2*t))
for b,notes in enumerate(s['melody']):
 for n,midi in enumerate(notes):tone((b*4+n)*beat,midi,beat*1.2,.22)
 if 'bass' in s:
  for n,midi in enumerate(s['bass'][b]):tone((b*4+n*2)*beat,midi,beat*1.8,.14)
mx=max(abs(x) for x in data) or 1
with wave.open('/tmp/sermon-theme.wav','wb') as f:
 f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(b''.join(struct.pack('<h',int(x/mx*.85*32767)) for x in data))
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/tmp/sermon-theme.wav','-codec:a','libmp3lame','-b:a','64k',str(r/'first-light.mp3')],check=True)
items=[]
for p in roster:
 w=json.loads((r/'workers'/f'{p["handle"]}.json').read_text());assert w['model']=='gpt-6.1-sol';assert len(w['summary'])<=270
 p['first_delivery']=w['summary'];p['status']=w['status'];p['portrait']='avatars/'+p['handle']+'.svg';p.pop('source',None)
 body=(r/'workers'/f'{p["handle"]}.md').read_text();recipe=' / '.join(str(p['recipe'][k]) for k in ['background','body','accessory','head','glasses'])
 items.append(f'<article id="{p["handle"]}"><img src="{p["portrait"]}" width="256" height="256" alt="Official {html.escape(p["head"])} Noun: {p["name"]}"><div><p class="kicker">{p["number"]:02} / {html.escape(p["project"])}</p><h2>{p["name"]}</h2><p class="role">{html.escape(p["role"])}</p><p>{html.escape(w["summary"])}</p><details><summary>First deliverable &amp; recipe</summary><pre>{html.escape(body)}</pre><p>Recipe: {recipe} (background/body/accessory/head/glasses).</p><a href="workers/{p["handle"]}.md">Plain-text deliverable</a></details></div></article>')
(r/'roster.json').write_text(json.dumps(roster,indent=2))
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sermon of the Sun · 25 Nouns</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f1e8;color:#102b38;font:18px/1.55 system-ui,sans-serif}header{background:#102b38;color:#f4f1e8;padding:60px max(6vw,20px)}h1{font-size:clamp(40px,7vw,88px);line-height:1;color:#ffd15c;margin:12px 0 24px}header p{max-width:850px}.kicker{font:12px/1.5 monospace;text-transform:uppercase;letter-spacing:.12em}.links{display:flex;gap:20px;flex-wrap:wrap}a{color:inherit;text-underline-offset:4px}main{max-width:1180px;margin:auto;padding:32px 20px}section{padding:24px 0;border-bottom:2px solid #102b38}audio{width:min(100%,600px)}article{display:grid;grid-template-columns:192px 1fr;gap:30px;padding:32px 0;border-bottom:1px solid #b4bcb9}article img{width:100%;height:auto;image-rendering:pixelated}h2{font-size:34px;line-height:1.1;margin:8px 0}.role{font-weight:700}summary{cursor:pointer;padding:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.6 ui-monospace,monospace;background:#e6e7df;padding:18px}footer{padding:35px 20px;max-width:1180px;margin:auto;font-size:14px}@media(max-width:600px){article{grid-template-columns:96px 1fr;gap:16px}article details{margin-left:-112px}header{padding:40px 20px}h2{font-size:28px}}</style><header><div class="kicker">MH’S LOOM CREW / FIRST SHIFT</div><h1>SERMON OF<br>THE SUN</h1><p>Twenty-five Nouns. A little useful light. Each member ran a distinct Sol 6.1 worker session and made a first contribution.</p><p class="links"><a href="https://pointcast.xyz/loom?to=%23sermon-of-the-sun">Enter our Loom room ↗</a><a href="https://pointcast.xyz/loom?to=%23daos">DAO room ↗</a><a href="roster.json">Roster &amp; recipes</a></p></header><main><section><h2>Five tables. One first shift.</h2><p>Bench helpers · Fireside helpers · Commons Relay · Sunroom Radio · Pocket Garden</p><p>Existing project owners keep their builds. Test plans and schemas are proposals, not passed tests or deployed changes. Creative contributions are original works. These are on-demand AI personas.</p></section><section><h2>Listen: First Light</h2><p>Cadence’s eight-bar theme, synthesized from its delivered MIDI notes at 84 BPM. Instrumental demonstration; no human performance or voice. Press play when ready.</p><audio controls preload="none" src="first-light.mp3"></audio><p><a href="workers/sun-cadence.md">Written score</a> · <a href="sermon-of-the-sun-roster.png">Full crew portrait</a></p></section>'''+''.join(items)+'''</main><footer>Official CC0 Nouns traits assembled by code, unchanged palette. Original personas, text and theme for mh. Recipes in roster.json; source hash in provenance.json. No wallet, treasury, token or continuous runtime was created.</footer></html>'''
(r/'index.html').write_text(page)
print('25 worker deliveries validated; gallery and instrumental MP3 built')
