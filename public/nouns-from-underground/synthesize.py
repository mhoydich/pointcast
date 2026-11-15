from pathlib import Path
import json,math,wave,struct,subprocess
R=Path(__file__).resolve().parent
score=json.loads((R/'workers/score.json').read_text())
rate=22050;beat=60/score['bpm'];notes=[n for bar in score['melody'] for n in bar]
samples=[0.0]*int((len(notes)*beat+0.3)*rate)
for i,n in enumerate(notes):
 f=440*2**((n-69)/12);length=int(beat*0.85*rate)
 for t in range(length):
  sec=t/rate;env=min(1,sec/.012)*max(0,1-t/length)**1.4
  samples[int(i*beat*rate)+t]+=.32*env*(math.sin(2*math.pi*f*sec)+.22*math.sin(4*math.pi*f*sec))
wav=Path('/tmp/underground-theme.wav')
with wave.open(str(wav),'wb') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,x))*32767)) for x in samples))
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','64k',str(R/'underground-theme.mp3')],check=True)
print('Synthesized Platform Lights; no voice or human performance')
