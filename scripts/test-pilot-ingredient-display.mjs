import assert from "node:assert/strict";
import {parsePilotIngredientDisplay,parsePilotIngredientGroups} from "../src/lib/pilotIngredientDisplay.mjs";

const pochê = "2 ovos, ½ abacate, 3 fatias (50 g) de salmão defumado, suco de limão, 1 colher (chá) de vinagre para a água, sal, pimenta, cebolinha, 1 xícara de chá.";
const parsed = parsePilotIngredientDisplay(pochê);
assert.equal(parsed?.length, 9);
assert.equal(parsed?.join(", "), pochê);
assert.deepEqual(parsePilotIngredientDisplay("1 tomate (picado, sem sementes), 2 ovos, sal"),
  ["1 tomate (picado, sem sementes)", "2 ovos", "sal"]);
assert.equal(parsePilotIngredientDisplay("1 tomate, sem sementes, 2 ovos"), null);
assert.equal(parsePilotIngredientDisplay("Molho: 1 gema, azeite, limão"), null);
assert.equal(parsePilotIngredientDisplay("Salada: ingredientes\nMolho: outros"), null);
assert.equal(parsePilotIngredientDisplay("1 ovo, 2 abacates"), null);
assert.equal(parsePilotIngredientDisplay("1 ovo, 2 abacates, (sem parênteses"), null);
const groups=parsePilotIngredientGroups("150 g de fraldinha, sal, 1 colher (chá) de manteiga. Chimichurri: 3 colheres (sopa) de salsinha, 1 dente de alho, azeite.");
assert.equal(groups?.length, 2);
assert.equal(groups?.[0].items?.length, 3);
assert.equal(groups?.[1].title, "Chimichurri");
assert.equal(groups?.[1].items?.length, 3);
assert.equal(parsePilotIngredientGroups("Salada: ingredientes, Molho: ver receita abaixo"), null);
assert.equal(parsePilotIngredientGroups(pochê), null);
console.log("✅ Lista visual de ingredientes: fonte preservada e casos ambíguos protegidos.");
