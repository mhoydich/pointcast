// Writes only to stdout; the canonical collection list is never copied by hand.
import config from '../src/data/nouns-money-collections.json' with { type: 'json' };
import { newestHoldersMarkup } from '../src/lib/nouns-money-newest-holders-markup.mjs';

process.stdout.write(`<link rel="stylesheet" href="/nouns-money/newest-holders/strip.css">\n${newestHoldersMarkup(config)}\n<script type="module" src="/nouns-money/newest-holders/strip.mjs"></script>\n`);
