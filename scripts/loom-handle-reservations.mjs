/** Offline helper only: input is a complete, operator-reviewed KV key inventory.
 * Emits SQL, never connects to KV/D1 and never marks the rollout ready.
 */
import {readFileSync} from 'node:fs';
const input=JSON.parse(readFileSync(process.argv[2],'utf8'));
if(input.list_complete!==true || !Array.isArray(input.keys))throw Error('Expected {list_complete:true,keys:[{name:...}]} from a reviewed complete inventory');
const keys=new Set();
for(const entry of input.keys){const match=/^loom:(?:log|out):([a-f0-9]{24})$/.exec(entry.name??'');if(match)keys.add(match[1]);}
for(const key of keys)console.log(`INSERT OR IGNORE INTO loom_handle_legacy_keys(address_key) VALUES ('${key}');`);
console.error(`${keys.size} legacy hashes; readiness remains disabled pending rollout review.`);
