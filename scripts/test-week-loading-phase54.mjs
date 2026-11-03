import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const read = path => readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
const app = read("../src/App.tsx");
const home = read("../src/HomeDashboard.tsx");
const pkg = JSON.parse(read("../package.json"));

// Regressoes observadas: valor zero nao deve ser confundido com falta de carregamento.
assert.match(app,/const \[weekLoadedScope,setWeekLoadedScope\]=useState<string\|null>\(null\)/);
assert.match(app,/const \[weekLoadError,setWeekLoadError\]=useState<string\|null>\(null\)/);
assert.match(app,/const \[weekReloadToken,setWeekReloadToken\]=useState\(0\)/);
assert.match(app,/const weekReady=!supabase\|\|weekLoadedScope===\(userId\+"\|"\+weekStart\)/);
assert.match(app,/void loadWeek\(userId,weekStart\)/);
assert.match(app,/\.then\(data=>\{if\(alive\)\{setPlan\(data\);setWeekLoadedScope\(userId\+"\|"\+weekStart\);\}\}\)/);
assert.match(app,/\.catch\(\(\)=>\{if\(alive\)setWeekLoadError\(/);
assert.match(app,/\},\[userId,weekStart,weekReloadToken\]\)/);
assert.match(app,/return \(\)=>\{alive=false;\}/);
assert.match(app,/const reloadSavedWeek=\(\)=>\{if\(!supabase\|\|!userId\|\|saving\|\|loading\)return;setWeekReloadToken\(value=>value\+1\);\}/);

// Erros precisam ser apresentados; sem falsa semana vazia.
assert.match(app,/weekLoadError&&<div className="notice" role="alert">/);
assert.match(app,/onClick=\{reloadSavedWeek\}>Tentar novamente<\/button>/);
assert.match(app,/onClick=\{reloadSavedWeek\}>Recarregar semana salva<\/button>/);
assert.match(app,/weekReady&&!loading\?<><div className="week-grid">/);
assert.match(app,/O cardápio não foi carregado; nenhuma refeição foi substituída/);
assert.match(app,/loading=\{loading\|\|!weekReady\|\|weekStart!==dateKey\(startOfWeek\(new Date\(\)\)\)\}/);
assert.match(home,/loading \? "—" : plannedInWeek \+ " \/ " \+ \(slots\.length \* 7\)/);

// A ação de recuperação NÃO deve regravar/regerar receitas nem listas.
const retry = app.match(/const reloadSavedWeek=\(\)=>\{([^}]+)\};/);
assert.ok(retry,"Ação de recarga deve ter corpo isolável.");
assert.doesNotMatch(retry[1],/(replaceWeekMainMeals|saveMeal|savePurchasedItem|setPlan\(|delete|upsert|insert|update)/);
assert.match(app,/disabled=\{loading\|\|saving\|\|!weekReady\|\|!recipesReady\|\|!preferencesReady\} onClick=\{\(\)=>void suggestWeek\(\)\}/);
const buildSteps=pkg.scripts.build.split(" && ");
const step54=buildSteps.indexOf("npm run test:week-loading-phase54");
const typecheckStep=buildSteps.indexOf("tsc -b");
assert.ok(step54>=0 && typecheckStep>step54,
 "Teste da Fase 54 deve executar antes da checagem TypeScript em todos os builds.");
console.log("PASS F54: distingue semana pendente/erro/vazia; recarregamento somente leitura; controles de escrita preservados.");
