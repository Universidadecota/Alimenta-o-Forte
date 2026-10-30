import assert from "node:assert/strict";
import {parseRecipePreparation} from "../src/lib/recipePreparationSections.mjs";

assert.deepEqual(parseRecipePreparation("Aqueça a água.\nColoque os ovos."), {
  steps: ["Aqueça a água.", "Coloque os ovos."], tips: [], safety: []
});
assert.deepEqual(parseRecipePreparation("1º passo\\n2º passo\\nDICAS PARA DAR CERTO:\\nUse ovos frescos.\\nINFORMAÇÕES DE SEGURANÇA:\\nCozinhe bem."), {
  steps: ["1º passo", "2º passo"], tips: ["Use ovos frescos."], safety: ["Cozinhe bem."]
});
assert.deepEqual(parseRecipePreparation(null), {steps: [], tips: [], safety: []});
assert.deepEqual(parseRecipePreparation("Bata os ovos. Aqueça a frigideira por 2 minutos. Sirva."), {
  steps: ["Bata os ovos.", "Aqueça a frigideira por 2 minutos.", "Sirva."], tips: [], safety: []
});
assert.deepEqual(parseRecipePreparation("Misture 1,5 xícara de água. Sirva."), {
  steps: ["Misture 1,5 xícara de água.", "Sirva."], tips: [], safety: []
});
assert.deepEqual(parseRecipePreparation("Misture tudo. Deixe gelar.\nSirva com frutas."), {
  steps: ["Misture tudo. Deixe gelar.", "Sirva com frutas."], tips: [], safety: []
});
console.log("✅ Preparação seccionada: casos com e sem dicas/segurança validados.");
