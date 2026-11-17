/** Operator-only read utility. No D1 writes, readiness switch, or secret output. */
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export async function inventory({account,namespace,token,fetcher=fetch}) {
  if(!/^[a-f0-9]{32}$/i.test(account??'') || !/^[a-f0-9]{32}$/i.test(namespace??'') || !token)throw Error('Account, namespace and private operator credential required');
  const keys=new Map();
  for(const prefix of ['loom:log:','loom:out:']) {
    let cursor='';const seen=new Set();
    do {
      const url=new URL(`https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${namespace}/keys`);
      url.searchParams.set('prefix',prefix);url.searchParams.set('limit','1000');if(cursor)url.searchParams.set('cursor',cursor);
      const response=await fetcher(url,{headers:{Authorization:'Bearer '+token}});
      if(!response.ok)throw Error('Inventory read failed; no complete inventory written');
      const data=await response.json();
      if(data.success!==true || !Array.isArray(data.result) || !data.result_info || typeof data.result_info.cursor!=='string')throw Error('Unrecognized pagination; inventory incomplete');
      for(const entry of data.result){if(typeof entry.name!=='string'||!entry.name.startsWith(prefix))throw Error('Unexpected key record');keys.set(entry.name,{name:entry.name});}
      cursor=data.result_info.cursor;
      if(cursor && seen.has(cursor))throw Error('Repeated cursor; inventory incomplete');
      seen.add(cursor);
    } while(cursor);
  }
  return {list_complete:true,account,namespace,captured_at:new Date().toISOString(),keys:[...keys.values()].sort((a,b)=>a.name.localeCompare(b.name))};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const [account,namespace,output]=process.argv.slice(2);
    if(!output)throw Error('Usage: node scripts/loom-legacy-inventory.mjs ACCOUNT NAMESPACE PRIVATE_OUTPUT');
    const data=await inventory({account,namespace,token:process.env.CLOUDFLARE_API_TOKEN});
    await writeFile(output,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});
    console.log(`Complete inventory: ${data.keys.length} keys. Review binding and repeat for stability; readiness unchanged.`);
  } catch {console.error('Inventory failed. No complete output published; check private credentials, binding, pagination and output path locally.');process.exitCode=1;}
}
