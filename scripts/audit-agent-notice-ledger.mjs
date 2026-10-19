import {readFileSync} from 'node:fs';
import {validateLedger} from '../src/lib/agent-notices.mjs';
export function checkAppendOnly(previous,next) {
 validateLedger(previous);validateLedger(next);
 if(previous.epoch!==next.epoch)throw new Error('epoch_change_requires_explicit_reset_review');
 if(previous.floor_sequence!==next.floor_sequence)throw new Error('pruning_requires_explicit_history_gap_review');
 if(next.events.length<previous.events.length)throw new Error('history_deleted');
 for(let i=0;i<previous.events.length;i++)if(JSON.stringify(previous.events[i])!==JSON.stringify(next.events[i]))throw new Error('immutable_event_changed');
 return true;
}
if(process.argv[1]?.endsWith('audit-agent-notice-ledger.mjs')) {
 if(process.argv.length!==4)throw new Error('Usage: node scripts/audit-agent-notice-ledger.mjs PREVIOUS.json NEXT.json');
 checkAppendOnly(JSON.parse(readFileSync(process.argv[2],'utf8')),JSON.parse(readFileSync(process.argv[3],'utf8')));console.log('Append-only ledger validated.');
}
