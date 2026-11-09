"""Browser integration checks. Uses set_content because test-environment URL navigation is blocked.
Storage restoration uses an explicitly named test double; this is NOT a native reload-persistence test.
Run: python tests/player-v1/regression.py (requires Playwright and Chromium).
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, math, wave, struct, time, traceback, os
BASE=Path(__file__).resolve().parents[2]/'public'/'player-v1'
HTML=(BASE/'app.html').read_text().replace('<link rel="stylesheet" href="player.css">','<style>'+ (BASE/'player.css').read_text()+'</style>').replace('<script src="player.js"></script>','<script>'+(BASE/'player.js').read_text()+'</script>')
OUT=Path(__file__).resolve().parent/'artifacts'; PRE=OUT/'previews'
PRE.mkdir(parents=True,exist_ok=True)
results=[]; errors=[]; network=[]
def check(name, ok, detail=''):
 results.append({'name':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name+' '+str(detail))
def get(p):return p.evaluate('PointCastPlayer.getState()')
def wait(p,expr,ms=5000):
 end=time.monotonic()+ms/1000
 while time.monotonic()<end:
  if p.evaluate(expr):return
  p.wait_for_timeout(45)
 raise AssertionError('Timed out: '+expr)
def slide(p,id,value):p.locator('#'+id).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',str(value))
def export(p,fn,name):
 with p.expect_download(timeout=8000) as d:fn()
 path=OUT/name;d.value.save_as(path);return path
# An actual PCM WAV imported through the file picker, not a fake media element.
with wave.open(str(OUT/'local-tone.wav'),'wb') as f:
 f.setnchannels(1);f.setsampwidth(2);f.setframerate(22050);f.writeframes(b''.join(struct.pack('<h',int(math.sin(2*math.pi*440*i/22050)*7000)) for i in range(22050*4)))
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True, **({'executable_path':os.environ['CHROMIUM_PATH']} if os.environ.get('CHROMIUM_PATH') else {}))
  context=b.new_context(viewport={'width':1440,'height':1080},accept_downloads=True)
  def page(width=1440,height=1080,storage=None,reduced=None):
   p=context.new_page();p.set_viewport_size({'width':width,'height':height})
   p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:network.append(r.url) if r.url.startswith(('http:','https:')) else None)
   if storage is not None:p.evaluate('seed=>{window.testStorage=seed;Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:k=>testStorage[k]??null,setItem:(k,v)=>testStorage[k]=String(v),removeItem:k=>delete testStorage[k]}})}',storage)
   if reduced:p.emulate_media(reduced_motion=reduced)
   p.set_content(HTML,wait_until='load');wait(p,'!!window.PointCastPlayer');p.wait_for_timeout(120);return p
  p=page()
  check('Runtime boots without JavaScript errors',not errors)
  check('No autoplay at startup',not get(p)['playing'] and p.evaluate('audio.paused'))
  check('Three playable original demos are present',len(get(p)['queue'])==3)
  check('Storage denial is reported as session-only',not get(p)['storageAvailable'] and p.locator('#storageStatus').inner_text()=='SESSION ONLY')
  p.locator('#playBtn').click();wait(p,'audio.currentTime>.35 && !audio.paused')
  check('Real HTML audio playback advances',p.evaluate('audio.currentTime>.35'))
  check('One persistent source and ten real EQ nodes',p.evaluate('PointCastPlayer.getGraph().sourceCount===1 && PointCastPlayer.getGraph().bands.length===10'))
  slide(p,'eq-0',7);wait(p,'Math.abs(PointCastPlayer.getGraph().bands[0].gain-7)<.05')
  check('EQ slider changes the actual filter gain',abs(p.evaluate('PointCastPlayer.getGraph().bands[0].gain')-7)<.1)
  p.locator('#eqBypass').click();wait(p,'PointCastPlayer.getGraph().bands.every(b=>Math.abs(b.gain)<.05)')
  check('EQ bypass zeros real filters',p.evaluate('PointCastPlayer.getGraph().bands.every(b=>Math.abs(b.gain)<.1)'))
  p.locator('#eqBypass').click();p.locator('#eqPreset').select_option('warm');p.wait_for_timeout(100)
  check('Equalizer preset changes settings and graph',get(p)['eq']==[3,3,2,1,0,0,-1,-2,-2,-3])
  p.locator('#eqReset').click();check('EQ reset restores flat',get(p)['eq']==[0]*10)
  slide(p,'volume',21);wait(p,'Math.abs(PointCastPlayer.getGraph().master-.21)<.005');check('Volume changes master gain',abs(p.evaluate('PointCastPlayer.getGraph().master')-.21)<.01)
  p.locator('#muteBtn').click();wait(p,'PointCastPlayer.getGraph().master<.001');check('Mute is real gain control',get(p)['muted'] and p.evaluate('PointCastPlayer.getGraph().master<.001'))
  p.locator('#muteBtn').click();p.locator('#playBtn').click();check('Pause stops playback',p.evaluate('audio.paused'))
  slide(p,'seek',500);check('Seek changes actual playback time',14<p.evaluate('audio.currentTime')<18)
  p.locator('#stopBtn').click();check('Stop returns to the beginning',p.evaluate('audio.currentTime===0 && audio.paused'))
  p.locator('#nextBtn').click();wait(p,'PointCastPlayer.getState().active==="demo-coast" && !!audio.src');check('Next selects the next actual track',get(p)['active']=='demo-coast')
  p.locator('#prevBtn').click();wait(p,'PointCastPlayer.getState().active==="demo-sakura" && !!audio.src');check('Previous selects previous actual track',get(p)['active']=='demo-sakura')
  p.locator('#shuffleBtn').click();check('Shuffle toggles',get(p)['shuffle']);p.locator('#shuffleBtn').click()
  p.locator('#repeatBtn').click();check('Repeat all toggles',get(p)['repeat']=='all');p.locator('#repeatBtn').click();check('Repeat one toggles',get(p)['repeat']=='one');p.locator('#repeatBtn').click()
  p.locator('#fileInput').set_input_files(str(OUT/'local-tone.wav'));wait(p,'PointCastPlayer.getState().queue.length===4')
  check('File input creates a real local track',get(p)['queue'][-1]['kind']=='local' and not get(p)['queue'][-1]['missing'])
  local=get(p)['queue'][-1]['id'];p.get_by_role('button',name='Play local-tone',exact=True).click();wait(p,'audio.currentTime>.25 && !audio.paused')
  check('Imported WAV really decodes and plays',3.9<p.evaluate('audio.duration')<4.1 and get(p)['active']==local)
  p.locator('#playBtn').click();p.get_by_role('button',name='Move local-tone up').click();check('Queue reordering works',get(p)['queue'][2]['id']==local)
  p.locator('#queueSearch').fill('local-tone');check('Queue filter works',p.locator('.queue-item').count()==1);p.locator('#queueSearch').fill('')
  # Private notes and safe rendering.
  p.locator('#noteInput').fill('A <script>window.stolen=true</script> quiet listening room.');p.locator('#noteForm button').click()
  check('Timestamped note is stored only locally',len(get(p)['notes'])==1 and not get(p)['selected'])
  check('Note text cannot execute HTML',not p.evaluate('!!window.stolen') and p.locator('#notes script').count()==0)
  p.locator('#notes input').check();check('Explicit note selection works',len(get(p)['selected'])==1)
  p.locator('[data-layer=ai]').click();p.locator('#previewBrief').click();packet=json.loads(p.locator('#dialogBody pre').inner_text())
  check('AI brief excludes track and notes by default','track' not in packet and 'notes' not in packet)
  check('AI brief is draft-only and has no audio',packet['constraints']=={'draftOnly':True,'executeActions':False,'audioUploaded':False})
  p.locator('#dialogClose').click();p.locator('#shareTrack').check();p.locator('#shareNotes').check();p.locator('#previewBrief').click();packet=json.loads(p.locator('#dialogBody pre').inner_text())
  check('AI brief includes only explicitly approved context',packet['track']['title']=='local-tone' and len(packet['notes'])==1)
  check('Standalone does not impersonate a live companion',p.get_by_role('button',name='Open in my PointCast AI').count()==0)
  brief=export(p,lambda:p.get_by_role('button',name='Export brief',exact=True).click(),'sample-ai-brief.json');check('AI brief JSON is downloadable',json.loads(brief.read_text())==packet);p.locator('#dialogClose').click()
  p.evaluate('window.dispatchEvent(new MessageEvent("message",{data:{type:"pointcast.player.host-ready",version:1},origin:"https://attacker.invalid",source:window}))')
  check('Untrusted host-ready message is rejected',not get(p)['hostReady'])
  # Quotes and appearance independence.
  p.locator('[data-layer=offer]').click();p.locator('#draftOffer').click();q=get(p)['quote'];check('Example print quote calculates subtotal',q['total']==24 and q['status']=='draft')
  p.locator('#motion').uncheck();p.locator('#playBtn').click();wait(p,'!audio.paused');t=p.evaluate('audio.currentTime')
  for skin in ['chrome','tokyo','quiet','lightworks','sparrow','harbor','paper','terminal','gallery','playroom']:
   p.evaluate('(s)=>PointCastPlayer.setSkin(s,false)',skin);p.wait_for_timeout(40)
   check(skin+': switching preserves playback and quote',not p.evaluate('audio.paused') and get(p)['quote']['id']==q['id'] and get(p)['quote']['status']=='draft')
  p.locator('#playBtn').click();slide(p,'volume',44);slide(p,'eq-2',3)
  check('Listening settings do not invalidate a print quote',get(p)['quote']['status']=='draft')
  p.locator('[data-scene=coast]').click();check('Artwork change invalidates quote',get(p)['quote']['status']=='stale' and p.locator('#reviewOffer').is_disabled())
  p.locator('#offerQuantity').select_option('5');p.locator('#draftOffer').click();check('Five-print example totals correctly',get(p)['quote']['total']==120)
  p.locator('#reviewOffer').click();p.evaluate('document.querySelector("#offerQuantity").value="10"');p.get_by_role('button',name='Record local approval').click()
  check('Approval revalidates exact inputs',get(p)['quote']['status']=='stale')
  p.locator('#draftOffer').click();p.locator('#reviewOffer').click();p.get_by_role('button',name='Record local approval').click();check('Demo approval is recorded without orders',get(p)['quote']['status']=='approved' and 'NO ORDER' in p.locator('#offerState').inner_text())
  check('Repeat approval is disabled',p.locator('#reviewOffer').is_disabled())
  # Export and restore settings.
  p.locator('[data-layer=memory]').click();p.locator('#saveName').fill('Tokyo study');p.locator('#saveWorkspace').click();check('Save workspace creates settings capsule',len(get(p)['workspaces'])==1)
  ws=export(p,lambda:p.locator('#exportWorkspace').click(),'sample-workspace.json');wsp=json.loads(ws.read_text());check('Workspace excludes notes and audio',set(wsp)=={'schema','settings'} and 'notes' not in wsp['settings'])
  old=get(p)['skin'];p.locator('#workspaceFile').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps({'schema':'pointcast.player-workspace/v1','settings':{'skin':'evil','eq':[1]}}).encode()});p.wait_for_timeout(80);check('Invalid imported settings do not mutate state',get(p)['skin']==old)
  queue=export(p,lambda:p.locator('#exportQueue').click(),'sample-playlist.json');qp=json.loads(queue.read_text());check('Playlist export is metadata only',qp['schema']=='pointcast.playlist/v1' and all('url' not in x and 'blob' not in x for x in qp['tracks']))
  p.locator('#queueFile').set_input_files({'name':'remote.json','mimeType':'application/json','buffer':json.dumps({'schema':'pointcast.playlist/v1','tracks':[{'kind':'remote','url':'https://bad.invalid/x.mp3'}]}).encode()});p.wait_for_timeout(80);check('Remote URL playlist is rejected',len(get(p)['queue'])==4)
  p.locator('#fileInput').set_input_files({'name':'code.html','mimeType':'text/html','buffer':b'<script>alert(1)</script>'});p.wait_for_timeout(50);check('Non-audio file is rejected',len(get(p)['queue'])==4)
  p.locator('#skinsBtn').click();check('All ten skins are in the wardrobe',p.locator('#dialog .skin-card').count()==10);p.keyboard.press('Shift+Tab');check('Native modal contains keyboard focus',p.evaluate('dialog.contains(document.activeElement)'))
  p.keyboard.press('Escape');check('Escape closes modal and restores focus',not p.locator('#dialog').evaluate('(e)=>e.open') and p.evaluate('document.activeElement.id')=='skinsBtn')
  p.locator('#focusBtn').click();check('Focus mode is functional','focus' in p.locator('body').get_attribute('class'));p.locator('#exitFocus').click()
  p.locator('[data-layer=notes]').click();p.locator('#noteInput').fill('s f');check('Typing does not trigger shortcuts',not p.locator('#dialog').evaluate('(e)=>e.open') and 'focus' not in (p.locator('body').get_attribute('class')or''))
  # Exact pixels are independent of skin for the same fixed-size still scene.
  p.locator('#motion').uncheck();p.locator('[data-scene=sakura]').click();p.wait_for_timeout(80);original=p.locator('#scene').evaluate('(e)=>e.toDataURL()')
  for skin in ['chrome','tokyo','quiet','lightworks']:
   p.evaluate('(s)=>PointCastPlayer.setSkin(s,false)',skin);p.wait_for_timeout(80)
   check(skin+': still artwork is unchanged',p.locator('#scene').evaluate('(e)=>e.toDataURL()')==original)
  image=export(p,lambda:p.locator('#captureBtn').click(),'captured-scene.png');check('Real visual capture returns PNG',image.read_bytes()[:8]==b'\x89PNG\r\n\x1a\n')
  p.close()
  # Width checks use actual CSS layout, not screenshots of a mockup.
  p=page()
  for width in [320,390,768,1440]:
   p.set_viewport_size({'width':width,'height':1000})
   for skin in ['chrome','tokyo','quiet','lightworks','sparrow','harbor','paper','terminal','gallery','playroom']:
    p.evaluate('(s)=>PointCastPlayer.setSkin(s,false)',skin);p.wait_for_timeout(25)
    check(f'{skin}: no horizontal overflow at {width}px',p.evaluate('document.documentElement.scrollWidth<=innerWidth'),p.evaluate('document.documentElement.scrollWidth'))
  p.set_viewport_size({'width':1440,'height':1040});p.locator('#motion').uncheck();p.locator('#playBtn').click();wait(p,'!audio.paused');
  for skin in ['chrome','tokyo','quiet','lightworks']:
   p.evaluate('(s)=>PointCastPlayer.setSkin(s,false)',skin);p.wait_for_timeout(100);p.screenshot(path=str(PRE/(skin+'-desktop.png')),full_page=True)
  p.locator('#playBtn').click();p.locator('#focusBtn').click();p.evaluate('PointCastPlayer.setSkin("tokyo",false)');p.screenshot(path=str(PRE/'tokyo-focus.png'),full_page=True);p.locator('#exitFocus').click()
  p.set_viewport_size({'width':390,'height':844});p.evaluate('PointCastPlayer.setSkin("quiet",false)');p.screenshot(path=str(PRE/'quiet-mobile.png'),full_page=True)
  p.locator('#skinsBtn').click();check('Mobile skin picker fits horizontally',p.evaluate('dialog.scrollWidth<=innerWidth'));p.screenshot(path=str(PRE/'mobile-skins.png'),full_page=True);p.keyboard.press('Escape');p.close()
  p=page(reduced='reduce');check('System reduced motion overrides default',not get(p)['motion'] and p.locator('#motion').is_disabled());p.wait_for_timeout(80);a=p.locator('#scene').evaluate('(e)=>e.toDataURL()');p.wait_for_timeout(300);check('Reduced-motion artwork remains stationary',a==p.locator('#scene').evaluate('(e)=>e.toDataURL()'));p.close()
  # Explicit storage test double: not a native browser-origin reload claim.
  p=page(storage={});p.evaluate('PointCastPlayer.setSkin("tokyo",false)');slide(p,'eq-4',5);p.locator('#fileInput').set_input_files(str(OUT/'local-tone.wav'));p.locator('#noteInput').fill('Keep this locally.');p.locator('#noteForm button').click();p.wait_for_timeout(300)
  seed=p.evaluate('testStorage');check('Storage serialization includes settings, metadata and notes',len(seed)>0);p.close()
  p=page(storage=seed);check('Storage restoration preserves skin and EQ',get(p)['skin']=='tokyo' and get(p)['eq'][4]==5);check('Saved notes restore',len(get(p)['notes'])==1);check('Local audio is honestly marked for reconnection',get(p)['queue'][-1].get('missing') is True)
  p.locator('#fileInput').set_input_files(str(OUT/'local-tone.wav'));p.wait_for_timeout(100);check('Reselecting file relinks without duplicating',len(get(p)['queue'])==4 and not get(p)['queue'][-1]['missing'])
  check('Reload/restoration never starts audio',not get(p)['playing']);p.close()
  check('No page-level JavaScript exceptions across suite',not errors,errors);check('No external network requests from standalone application',not network,network)
  b.close()
except Exception as e:
 results.append({'name':'Suite completion','passed':False,'detail':traceback.format_exc()});print(traceback.format_exc())
finally:
 report={'version':'1.0.0','checks':results,'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'errors':errors,'externalRequests':network,'limitations':['Chromium only. No physical iPhone or Safari test.','set_content used because URL navigation is blocked in this environment.','Storage serialized and restored with a test double; native reload persistence unverified.','Hosted Astro companion adapter not executed against a live signed-in account.']}
 (OUT/'test-results.json').write_text(json.dumps(report,indent=2));print('RESULT',report['passed'],'passed',report['failed'],'failed')
 if report['failed']:raise SystemExit(1)
