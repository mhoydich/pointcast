import test from 'node:test';
import assert from 'node:assert/strict';
import {createRound, enter, metrics, pause, resume, fingerFor, baseKey, lessons} from '../src/lib/typing-bloom.mjs';
test('a mistake keeps the target, resets the streak, and counts in accuracy', () => {
 const r=createRound('abc'); enter(r,'a',0); enter(r,'x',1000);
 assert.equal(r.position,1); assert.equal(r.streak,0); assert.equal(metrics(r,1000).accuracy,50);
 enter(r,'b',2000); enter(r,'c',4000); assert.equal(r.position,3); assert.equal(r.bestStreak,2);
 assert.equal(metrics(r,4000).accuracy,75); assert.equal(enter(r,'c',5000),false); assert.equal(r.attempts,4);
});
test('WPM excludes pre-start idle and paused time and freezes at completion', () => {
 const r=createRound('abcde'); resume(r,0); assert.equal(metrics(r,60000).wpm,null);
 enter(r,'a',60000); enter(r,'b',61000); pause(r,62000); pause(r,63000);
 resume(r,120000); enter(r,'c',121000); enter(r,'d',122000); enter(r,'e',123000);
 assert.equal(r.elapsed,5000); assert.equal(metrics(r,999999).wpm,12);
});
test('tap practice does not report a typing speed',()=>{
 const r=createRound('ab'); enter(r,'a',0,true); enter(r,'b',4000); assert.equal(metrics(r,4000).wpm,null);
});
test('every lesson is completable and every target maps to an available key',()=>{
 const keys="1234567890qwertyuiopasdfghjkl;'zxcvbnm,./ ";
 for(const l of lessons){const r=createRound(l.text); for(const [i,c] of [...l.text].entries()){assert.ok(keys.includes(baseKey(c)),c); assert.equal(enter(r,c,i*200),true);} assert.equal(metrics(r,20000).accuracy,100);}
 assert.equal(fingerFor('!'),'Left pinky + opposite Shift'); assert.equal(fingerFor(' '),'Either thumb · Space');
});
