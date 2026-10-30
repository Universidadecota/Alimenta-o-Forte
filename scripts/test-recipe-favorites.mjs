import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root = new URL("../",import.meta.url);
const app = readFileSync(new URL("src/App.tsx",root),"utf8");
const styles = readFileSync(new URL("src/styles.css",root),"utf8");
const details = readFileSync(new URL("src/RecipeDetails.tsx",root),"utf8");
const sql = readFileSync(new URL("supabase/migrations/20261027145350_cc_recipe_favorites_private_beta.sql",root),"utf8");

assert.match(sql,/create table if not exists public\.favorites/i);
assert.match(sql,/primary key \(user_id, recipe_id\)/i);
assert.match(sql,/references auth\.users\(id\) on delete cascade/i);
assert.match(sql,/references public\.recipes\(id\) on delete cascade/i);
assert.match(sql,/alter table public\.favorites enable row level security/i);
assert.match(sql,/revoke all on table public\.favorites from public, anon, authenticated/i);
assert.match(sql,/grant select, insert, delete on table public\.favorites to authenticated/i);
assert.doesNotMatch(sql,/grant [^;]*update on table public\.favorites/i);
assert.match(sql,/for select to authenticated[\s\S]*?user_id = \(select auth\.uid\(\)\)/i);
assert.match(sql,/for insert to authenticated[\s\S]*?user_id = \(select auth\.uid\(\)\)/i);
assert.match(sql,/for delete to authenticated[\s\S]*?user_id = \(select auth\.uid\(\)\)/i);
assert.match(sql,/select 1 from public\.recipes r where r\.id = favorites\.recipe_id/i);

assert.match(app,/\.from\("favorites"\)\.select\("recipe_id"\)\.eq\("user_id",userId\)/);
assert.match(app,/\.from\("favorites"\)\.insert\(\{user_id:userId,recipe_id:recipeId\}\)/);
assert.match(app,/\.from\("favorites"\)\.delete\(\)\.eq\("user_id",userId\)\.eq\("recipe_id",recipeId\)/);
assert.match(app,/setFavoriteIds\(new Set\(\)\);setFavoritesLoadedFor\(null\)/);
assert.match(app,/if\(onlyFavorites&&\(!favoritesReady\|\|!favoriteIds\.has\(recipe\.id\)\)\)return false/);
assert.match(app,/aria-pressed=\{favoritesReady&&favoriteIds\.has\(r\.id\)\}/);
assert.match(app,/onToggleFavorite=\{\(\)=>void toggleFavorite\(detailId!\)\}/);
assert.match(details,/aria-pressed=\{isFavorite\}/);
assert.match(details,/onClick=\{onToggleFavorite\}/);
assert.match(details,/className="recipe-title-actions"/);
assert.match(details,/className=\{"recipe-favorite-action"/);
assert.match(details,/aria-busy=\{favoriteBusy\}/);
assert.ok(details.indexOf("recipe-detail-head") < details.indexOf("recipe-favorite-action"));
assert.doesNotMatch(details,/<button type="button" className="secondary" aria-pressed/);
assert.match(styles,/\.recipe-favorite-action\.is-favorite/);
assert.match(styles,/\.recipe-favorite-action:focus-visible/);

assert.match(styles,/\.cc-recipes-filterbar \.cc-favorites-filter input\[type="checkbox"\]\{width:18px;height:18px;min-height:0/);
console.log("OK: favoritos privados, RLS por usuário, leitura/gravação e filtro na UI (verificação estática).");
