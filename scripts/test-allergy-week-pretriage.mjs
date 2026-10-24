import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/lib/suggestions.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const stub=`const slots=['Café da manhã','Almoço','Jantar'];
const dateKey=d=>d.toISOString().slice(0,10);
const recipeFitsSlot=(r,slot)=>r.category===slot;`;
const standalone=compiled.replace(/^import \{[^\n]+\} from ["']\.\/planner["'];?\s*$/m,stub);
assert.notEqual(standalone,compiled,'O stub do planner precisa substituir a importação');
const {proposeWeek}=await import('data:text/javascript,'+encodeURIComponent(standalone));

const days=Array.from({length:7},(_,i)=>new Date(Date.UTC(2026,9,26+i)));
const prefs={goal:null,liked_foods:[],disliked_foods:[],allergies:['Leite'],household_size:2,cooking_minutes:30};
const meal=(id,category)=>({id,title:id,category,ingredients:[{name:'Arroz',quantity:1,unit:'xícara'}],minutes:15,servings:1,ownerId:null});
const safe=[meal('a','Café da manhã'),meal('b','Almoço'),meal('c','Jantar')];
const blocked=[meal('x','Café da manhã'),meal('y','Almoço'),meal('z','Jantar')];

assert.throws(()=>proposeWeek([...safe,...blocked],prefs,days),/análise de ingredientes/);
const result=proposeWeek([...safe,...blocked],prefs,days,{},new Set(safe.map(r=>r.id)));
assert.equal(Object.keys(result).length,7);
for(const day of Object.values(result)){
 assert.deepEqual(Object.keys(day).sort(),['Almoço','Café da manhã','Jantar'].sort());
 for(const entry of Object.values(day))assert.ok(safe.some(r=>r.id===entry.id),'Não sugerir receita fora da triagem');
}
assert.throws(()=>proposeWeek([...safe,...blocked],prefs,days,{},new Set(['a','b'])),/Nenhuma receita passou pela pré-triagem para Jantar/);

const sql=readFileSync(new URL('../supabase/migrations/20261024163302_cc_a5_weekly_allergy_server_guard.sql',import.meta.url),'utf8');
for(const fragment of ['cc_allergy_candidate_ids','cc_allergy_preliminary_pass','cardápio não foi alterado','for share','cardinality(v_allergies)>0']){
 assert.ok(sql.toLowerCase().includes(fragment.toLowerCase()),`Contrato SQL faltando: ${fragment}`);
}
for(const group of ['leite','gluten','amendoim','castanhas','ovo','peixes','crustaceos','soja','gergelim']){
 assert.ok(sql.includes(`v_allergy='${group}'`),`Grupo sem triagem no servidor: ${group}`);
}
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
assert.match(app,/cc-allergy-alert" role="region" aria-label="Orientações sobre alergias"><details><summary>⚠️ ALERTA DE ALERGIA/,
 'O alerta deve ficar fechado por padrão, e a frase completa precisa ser clicável');
assert.match(app,/className="cc-allergy-details-content"/,
 'As instruções completas de segurança devem permanecer disponíveis ao expandir');
assert.match(styles,/\.cc-allergy-alert summary:focus-visible/,
 'O alerta deve permitir navegação visível por teclado');
console.log('OK: 21 refeições respeitam o conjunto de IDs pré-triados, falham fechadas e todos os grupos conhecidos constam do contrato SQL.');
