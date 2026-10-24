import assert from "node:assert/strict";
import {parseRecipePreparation} from "../src/lib/recipePreparationSections.mjs";

assert.deepEqual(parseRecipePreparation("Aqueça a água.\nColoque os ovos."), {
  steps: ["Aqueça a água.", "Coloque os ovos."], tips: [], safety: []
});
assert.deepEqual(parseRecipePreparation("1º passo\\n2º passo\\nDICAS PARA DAR CERTO:\\nUse ovos frescos.\\nINFORMAÇÕES DE SEGURANÇA:\\nCozinhe bem."), {
  steps: ["1º passo", "2º passo"], tips: ["Use ovos frescos."], safety: ["Cozinhe bem."]
});
assert.deepEqual(parseRecipePreparation(null), {steps: [], tips: [], safety: []});
console.log("✅ Preparação seccionada: casos com e sem dicas/segurança validados.");
