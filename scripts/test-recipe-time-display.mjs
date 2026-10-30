import assert from "node:assert/strict";
import {formatPilotRecipeTime} from "../src/lib/pilotRecipeTime.mjs";

const vongole={
 title:"Amêijoas (vôngole) à portuguesa com salada de tomate",
 minutes:20,
 instructions:"Deixe o vôngole de molho em água com sal por 30 minutos para soltar a areia (se possível) e enxágue.\nDoure o alho no azeite.",
 pilotSource:{originalTime:"Tempo: 20 min | Porção: 1"}
};
assert.equal(formatPilotRecipeTime(vongole),"Tempo: 20 min de preparo + até 30 min de molho (se necessário) | Porção: 1");
assert.equal(formatPilotRecipeTime(vongole,true),"20 min + até 30 min de molho");
assert.equal(formatPilotRecipeTime({...vongole,instructions:"Doure o alho."}),"Tempo: 20 min | Porção: 1",
 "Não inferir molho adicional sem a etapa no preparo.");
assert.equal(formatPilotRecipeTime({...vongole,title:"Outra receita"}),"Tempo: 20 min | Porção: 1");
assert.equal(formatPilotRecipeTime({title:"Receita pessoal",minutes:35,instructions:null}),"35 minutos");
assert.equal(formatPilotRecipeTime({title:"Receita pessoal",minutes:35,instructions:null},true),"35 min");
console.log("OK: tempo de vôngole distingue preparo e molho opcional sem afetar outras fichas.");
