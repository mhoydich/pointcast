import { APP_CATALOG, APP_SERIES, APP_DISCLOSURE } from '../../../lib/nouns-money-app-catalog';
export function GET() {
 return new Response(JSON.stringify({schema:'pointcast.nouns-money.app-catalog/v1',title:'Michael Hoydich’s Currency Builder · Nouns Money',canonical:'https://pointcast.xyz/nouns-money/app/',status:'Public art browser and browser-local design prototype',favorites:'Device-local preferences only; no account or ownership records',disclosure:APP_DISCLOSURE,transactionsEnabled:false,financialBacking:'none established',production:'proposed; no physical proof or press certification claimed',series:APP_SERIES,catalog:APP_CATALOG},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300','Access-Control-Allow-Origin':'*'}});
}
