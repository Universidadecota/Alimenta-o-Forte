import assert from "node:assert/strict";
import {build} from "esbuild";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const result=await build({
 entryPoints:[fileURLToPath(new URL("../src/lib/evolutionTrends.ts",import.meta.url))],
 bundle:true,platform:"node",format:"esm",write:false,logLevel:"silent",outfile:"evolution-f52-test.mjs"
});
const model=await import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].contents).toString("base64"));
const {getTrendWindow,buildEvolutionTrend,formatTrendDate}=model;
const today="2026-11-01";
assert.deepEqual(getTrendWindow(today,7),{start:"2026-10-26",end:today});
assert.deepEqual(getTrendWindow(today,30),{start:"2026-10-03",end:today});
assert.deepEqual(getTrendWindow(today,90),{start:"2026-08-04",end:today});
assert.throws(()=>getTrendWindow("2026-02-30",7));
assert.throws(()=>getTrendWindow(today,14));
assert.equal(formatTrendDate(today),"01/11/2026");
const row=(day,energy=null,wellbeing=null,sleep=null)=>({
 recorded_on:day,energy_level:energy,wellbeing_level:wellbeing,sleep_quality:sleep
});
const data=[
 row("2026-10-28",2,3,1),row("2026-10-27",3,null,2),
 row("2026-10-30",4,4,null),row("2026-11-01",5,null,5),
 row("2026-10-20",1,1,1),row("2026-11-02",1,1,1),
 row("2026-10-29",null,null,null)
];
const series=buildEvolutionTrend(data,"energy_level",7,today);
assert.deepEqual(series.points.map(p=>[p.day,p.value,p.offset]),[
 ["2026-10-27",3,1],["2026-10-28",2,2],["2026-10-30",4,4],["2026-11-01",5,6]
]);
assert.deepEqual(series.segments.map(s=>s.map(p=>p.day)),[
 ["2026-10-27","2026-10-28"],["2026-10-30"],["2026-11-01"]
],"Nunca ligar artificialmente dias sem dado.");
assert.equal(series.recordedDays,5,"Dia com somente comentário ou hábito conta como registro, não nota.");
const wellbeing=buildEvolutionTrend(data,"wellbeing_level",7,today);
assert.deepEqual(wellbeing.points.map(p=>p.value),[3,4]);
assert.equal(buildEvolutionTrend(data,"sleep_quality",7,today).points.length,3);
const notesOnly=buildEvolutionTrend([row("2026-11-01")],"energy_level",7,today);
assert.equal(notesOnly.recordedDays,1);
assert.deepEqual(notesOnly.points,[]);
const empty=buildEvolutionTrend([], "energy_level", 30,today);
assert.equal(empty.recordedDays,0);assert.deepEqual(empty.points,[]);
const duplicate=buildEvolutionTrend([row(today,2),row(today,4)],"energy_level",7,today);
assert.equal(duplicate.points.length,1);
assert.deepEqual(duplicate.points.map(p=>p.value),[2]);
const source=(file)=>readFileSync(fileURLToPath(new URL(file,import.meta.url)),"utf8");
const component=source("../src/EvolutionTrends.tsx");
const panel=source("../src/EvolutionPanel.tsx");
assert.match(panel,/!loading&&!error&&<EvolutionTrends entries=\{rows\}/,"Sem mostrar dados antigos em erro de carga.");
assert.match(panel,/setRows\(previous=>\[updated,/);
assert.match(panel,/setRows\(current=>current\.filter/);
assert.match(component,/aria-pressed=\{metric===key\}/);
assert.match(component,/aria-pressed=\{period===n\}/);
assert.match(component,/role="img"/);
assert.match(component,/<table>/);
assert.match(component,/onSelectDay\(point\.day\)/);
assert.match(component,/trend\.segments\.filter\(segment=>segment\.length>1\)/);
assert.match(component,/Nenhum registro nesse intervalo/);
assert.doesNotMatch(component,/supabase|localStorage|sessionStorage|fetch\(|axios|\.insert\(|\.delete\(|\.update\(|\.upsert\(/i,"O gráfico jamais lê outro proprietário nem grava dados.");
console.log("PASS F52: períodos, lacunas, ausência de dados, séries 1–5, privacidade e acessibilidade.");
