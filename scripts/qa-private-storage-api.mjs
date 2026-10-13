/**
 * API isolation smoke test for LOCAL Supabase only.
 * Run: node scripts/qa-private-storage-api.mjs
 * Requires Docker + local Supabase CLI services running and installed npm deps.
 * Creates two temporary auth users and an image object, deletes all in finally.
 * Never prints credentials. Does not require existing user password.
 */
import { execFileSync } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url="http://127.0.0.1:54321";
if(process.env.VITE_SUPABASE_URL && !["http://127.0.0.1:54321","http://localhost:54321"].includes(process.env.VITE_SUPABASE_URL))
 throw new Error("Ambiente nao local detectado; teste cancelado.");

function localConfig(){
 const cmd=process.platform==="win32"?"npx.cmd":"npx";
 const out=execFileSync(cmd,["supabase","status","-o","env"],{encoding:"utf8",stdio:["ignore","pipe","pipe"],timeout:60000});
 const env={};
 for(const line of out.split(/\r?\n/)){
  const found=line.match(/^([A-Z_]+)=(.*)$/);
  if(found)env[found[1]]=found[2].replace(/^["']|["']$/g,"");
 }
 const publicKey=env.ANON_KEY||env.PUBLISHABLE_KEY;
 const adminKey=env.SERVICE_ROLE_KEY||env.SECRET_KEY;
 if(!publicKey||!adminKey)throw new Error("Chaves locais indisponiveis em supabase status -o env.");
 return {publicKey,adminKey};
}
const {publicKey,adminKey}=localConfig();
const makeClient=key=>createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
const admin=makeClient(adminKey);
const owner=makeClient(publicKey);
const outsider=makeClient(publicKey);
const id=randomUUID(), pass=randomBytes(26).toString("hex")+"A1!";
const bucket="personal-recipe-images";
const testUsers=[], insertedObjects=[];
const assert=(ok,message)=>{if(!ok)throw Error("FALHA: "+message);};
const must=(result,context)=>{if(result.error)throw Error(context+": "+result.error.message);return result.data;};
try{
 for(const marker of ["owner","other"]){
  const created=must(await admin.auth.admin.createUser({email:`qa-${marker}-${id}@example.invalid`,password:pass,email_confirm:true}),"Criar conta");
  testUsers.push(created.user.id);
 }
 must(await owner.auth.signInWithPassword({email:`qa-owner-${id}@example.invalid`,password:pass}),"Entrar como dono");
 must(await outsider.auth.signInWithPassword({email:`qa-other-${id}@example.invalid`,password:pass}),"Entrar como outro usuario");

 const objectPath=`${testUsers[0]}/${randomUUID()}/${randomUUID()}.webp`;
 const binary=Uint8Array.from([82,73,70,70,20,0,0,0,87,69,66,80,86,80,56,32,8,0,0,0,0,0,0,0,0,0,0,0,0,0]);
 must(await owner.storage.from(bucket).upload(objectPath,binary,{contentType:"image/webp",upsert:false}),"Upload como dono");
 insertedObjects.push(objectPath);
 const ownerRead=await owner.storage.from(bucket).download(objectPath);
 must(ownerRead,"Download como dono");
 console.log("OK: proprietario consegue baixar sua propria imagem.");
 const otherRead=await outsider.storage.from(bucket).download(objectPath);
 assert(Boolean(otherRead.error)||!otherRead.data,"Outro usuario conseguiu baixar arquivo privado");
 console.log("OK: outro usuario nao consegue baixar a imagem do proprietario.");
 const otherList=must(await outsider.storage.from(bucket).list(testUsers[0]),"Listagem por outro usuario");
 assert(!otherList.some(x=>x.name===objectPath.split("/").at(-1)),"Outro usuario enxerga imagem alheia");
 console.log("OK: listagem nao expoe a imagem privada.");
 const otherDelete=await outsider.storage.from(bucket).remove([objectPath]);
 assert(!otherDelete.data?.length,"Outro usuario removeu a imagem alheia");
 console.log("OK: outro usuario nao exclui imagem do proprietario.");
 console.log("APROVADO: verificacoes de API Storage executadas no localhost.");
}catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=1;}
finally{
 for(const p of insertedObjects) {
  const result=await admin.storage.from(bucket).remove([p]);
  if(result.error)console.error("ATENCAO: falha ao limpar objeto temporario.");
 }
 for(const uid of testUsers) {
  const result=await admin.auth.admin.deleteUser(uid);
  if(result.error)console.error("ATENCAO: falha ao remover usuario temporario.");
 }
 console.log("Limpeza dos dados de teste solicitada.");
}
