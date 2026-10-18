import {mkdtempSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {execFileSync} from "node:child_process";

// Supabase REST read-only inventory export + existing offline TypeScript parser.
// Must run only in an environment with explicit access to the review table.
// No credentials, raw ingredient texts or review decisions are committed.
const url=process.env.SUPABASE_URL?.replace(/\/$/,"");
const key=process.env.SUPABASE_ANON_KEY;
const userToken=process.env.SUPABASE_ACCESS_TOKEN;
const output=process.argv[2];
if(!url||!key||!userToken||!output)throw Error("Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ACCESS_TOKEN and output report path.");
if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(url))throw Error("Invalid Supabase URL");
const headers={apikey:key,Authorization:"Bearer "+userToken,Accept:"application/json",Prefer:"count=exact"};
const base=url+"/rest/v1/cc_pilot_ingredient_measure_reviews?select=ingredient_id,recipe_id,source_position,source_text,review_status&order=ingredient_id.asc";
const fetchPage=async (start,end)=>{
 const resp=await fetch(base,{method:"GET",headers:{...headers,Range:start+"-"+end},signal:AbortSignal.timeout(30000)});
 if(!resp.ok)throw Error("Supabase read failed: HTTP "+resp.status);
 const rows=await resp.json();
 const match=resp.headers.get("content-range")?.match(/\/(\d+)$/);
 if(!match)throw Error("Missing exact content range; inventory completeness cannot be established");
 return {rows,count:Number(match[1])};
};
const first=await fetchPage(0,199);
const total=first.count;
if(!Number.isSafeInteger(total)||total<1)throw Error("Invalid inventory count");
const all=[...first.rows];
for(let start=200;start<total;start+=200){
 const part=await fetchPage(start,start+199);
 if(part.count!==total)throw Error("Inventory changed during pagination; retry on a stable snapshot");
 all.push(...part.rows);
}
if(all.length!==total)throw Error("Incomplete inventory");
const dir=mkdtempSync(join(tmpdir(),"cc-inventory-"));
try{
 const input=join(dir,"inventory.json");
 writeFileSync(input,JSON.stringify(all),{mode:0o600});
 execFileSync(process.execPath,[new URL("./audit-measure-inventory.mjs",import.meta.url).pathname,input,output],{stdio:"inherit",env:{...process.env,CC_EXPECTED_INVENTORY_COUNT:String(total)}});
 console.log("Read-only report generated. Count:",total);
}finally{rmSync(dir,{recursive:true,force:true});}
