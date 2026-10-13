/**
 * Costa&Costa: homologacao de RLS do Storage pela API HTTP REAL, somente LOCAL.
 * Executar: node scripts/qa-private-storage-api.mjs
 *
 * Emite 2 JWTs de teste com o JWT_SECRET do Supabase CLI local. Nao cria usuarios
 * no auth.users nem executa admin.createUser (que apresentou HTTP 504).
 * Portanto valida autorizacao JWT/RLS na API, NAO valida login pelo GoTrue.
 * Nao registra tokens nem chaves. Remove os objetos temporarios em finally.
 */
import { execSync } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";

const API = "http://127.0.0.1:54321";
const BUCKET = "personal-recipe-images";
const TIMEOUT = 20000;

function fail(type, message) { throw new Error(type + ": " + message); }

function localConfig() {
  if (process.env.VITE_SUPABASE_URL &&
      !["http://127.0.0.1:54321","http://localhost:54321"].includes(process.env.VITE_SUPABASE_URL)) {
    fail("AMBIENTE", "VITE_SUPABASE_URL nao aponta para localhost");
  }
  let output;
  try {
    output = execSync("npx --no-install supabase status -o env", {
      encoding: "utf8", timeout: 120000, windowsHide: true,
      stdio: ["ignore","pipe","pipe"],
    });
  } catch {
    fail("INFRA", "Nao foi possivel consultar o Supabase CLI local");
  }
  const env = {};
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  if (env.API_URL !== API && env.API_URL !== "http://localhost:54321")
    fail("AMBIENTE", "A API retornada pelo CLI nao e a instancia local esperada");
  if (!env.ANON_KEY || !env.JWT_SECRET)
    fail("INFRA", "ANON_KEY ou JWT_SECRET ausente na configuracao local");
  return { anonKey: env.ANON_KEY, jwtSecret: env.JWT_SECRET };
}

function signTestJwt(userId, secret) {
  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const message = encode({alg:"HS256",typ:"JWT"}) + "." + encode({
    aud:"authenticated", role:"authenticated", sub:userId,
    iat:now, exp:now+600, iss:"supabase-local-qa",
  });
  return message + "." + createHmac("sha256", secret).update(message).digest("base64url");
}

async function call(label, method, route, anonKey, jwt, body, mime) {
  const headers = { apikey: anonKey, Authorization: "Bearer " + jwt };
  if (mime) headers["content-type"] = mime;
  const start = Date.now();
  let res;
  try {
    res = await fetch(API + route, {
      method, headers, body, signal: AbortSignal.timeout(TIMEOUT),
    });
  } catch (error) {
    fail("INFRA", label + " falhou na rede: " + (error?.name || "erro"));
  }
  let data = null;
  if (res.headers.get("content-type")?.includes("application/json")) {
    try { data = await res.json(); } catch { /* corpo nao utilizado */ }
  } else {
    try { await res.arrayBuffer(); } catch { /* corpo nao utilizado */ }
  }
  console.log(label + ": HTTP " + res.status + " (" + (Date.now()-start) + " ms)");
  if (res.status >= 500) fail("INFRA", label + " retornou HTTP " + res.status);
  return {status:res.status, ok:res.ok, data};
}

function expect(value, message) {
  if (!value) fail("ISOLAMENTO", message);
}

const {anonKey, jwtSecret} = localConfig();
const ownerId = randomUUID();
const otherId = randomUUID();
const folderId = randomUUID();
const objectPath = ownerId + "/" + folderId + "/" + randomUUID() + ".webp";
const attemptedPath = ownerId + "/" + folderId + "/" + randomUUID() + ".webp";
const prefix = ownerId + "/" + folderId + "/";
const ownerJwt = signTestJwt(ownerId, jwtSecret);
const otherJwt = signTestJwt(otherId, jwtSecret);
// WebP valido de 1 x 1 px; nenhum dado real de usuarios e utilizado.
const webp = Buffer.from("UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAgA0JaQAA3AA/uZQAAA=", "base64");
const objectRoute = "/storage/v1/object/" + BUCKET + "/";
const privateRoute = "/storage/v1/object/authenticated/" + BUCKET + "/";
const listRoute = "/storage/v1/object/list/" + BUCKET;
const removeRoute = "/storage/v1/object/" + BUCKET;

let cleanupOk = false;
try {
  const upload = await call("Upload proprietario", "POST", objectRoute + objectPath,
    anonKey, ownerJwt, webp, "image/webp");
  expect(upload.ok, "proprietario nao conseguiu criar a imagem (verificar RLS/MIME)");

  const ownerDownload = await call("Download proprietario", "GET", privateRoute + objectPath,
    anonKey, ownerJwt);
  expect(ownerDownload.status === 200, "proprietario nao consegue acessar a propria imagem");

  const publicRead = await call("Acesso publico", "GET",
    "/storage/v1/object/public/" + BUCKET + "/" + objectPath, anonKey, anonKey);
  expect(publicRead.status >= 400 && publicRead.status < 500,
    "imagem privada acessivel pelo endereco publico");

  const otherDownload = await call("Download outro usuario", "GET", privateRoute + objectPath,
    anonKey, otherJwt);
  expect(otherDownload.status >= 400 && otherDownload.status < 500,
    "outro usuario conseguiu baixar a imagem");

  const body = JSON.stringify({prefix,limit:100,offset:0});
  const ownerList = await call("Lista proprietario", "POST", listRoute,
    anonKey, ownerJwt, body, "application/json");
  expect(ownerList.ok && Array.isArray(ownerList.data) &&
    ownerList.data.some(item => item.name === objectPath.split("/").at(-1)),
    "a listagem do proprietario nao encontrou o arquivo");

  const otherList = await call("Lista outro usuario", "POST", listRoute,
    anonKey, otherJwt, body, "application/json");
  expect(otherList.ok && Array.isArray(otherList.data) &&
    !otherList.data.some(item => item.name === objectPath.split("/").at(-1)),
    "listagem de outro usuario revelou a imagem");

  const otherUpload = await call("Upload na pasta alheia", "POST",
    objectRoute + attemptedPath, anonKey, otherJwt, webp, "image/webp");
  expect(otherUpload.status >= 400 && otherUpload.status < 500,
    "outro usuario conseguiu gravar na pasta do proprietario");

  const otherDelete = await call("Exclusao por outro usuario", "DELETE",
    removeRoute, anonKey, otherJwt,
    JSON.stringify({prefixes:[objectPath]}), "application/json");
  expect((otherDelete.ok && Array.isArray(otherDelete.data) && otherDelete.data.length === 0) ||
    (otherDelete.status >= 400 && otherDelete.status < 500),
    "outro usuario teve exclusao aceita");

  const ownerStillReads = await call("Confirmacao apos exclusao indevida", "GET",
    privateRoute + objectPath, anonKey, ownerJwt);
  expect(ownerStillReads.status === 200, "arquivo nao existe mais apos acao do outro usuario");

  console.log("APROVADO: isolamento de Storage via HTTP no Supabase LOCAL.");
  console.log("Observacao: JWTs simulados nao substituem teste de login entre contas reais.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Erro desconhecido");
  process.exitCode = 1;
} finally {
  try {
    const removed = await call("Limpeza de objetos QA", "DELETE", removeRoute,
      anonKey, ownerJwt, JSON.stringify({prefixes:[objectPath, attemptedPath]}),
      "application/json");
    if (!removed.ok) fail("LIMPEZA", "API recusou a exclusao de objetos temporarios");

    const check = await call("Verificacao da limpeza", "GET",
      privateRoute + objectPath, anonKey, ownerJwt);
    if (check.status < 400 || check.status >= 500)
      fail("LIMPEZA", "arquivo de homologacao ainda pode estar disponivel");
    cleanupOk = true;
  } catch (error) {
    console.error("ATENCAO: " + (error instanceof Error ? error.message : "limpeza incompleta"));
    process.exitCode = 1;
  }
  if (cleanupOk) console.log("OK: limpeza de arquivo temporario confirmada.");
  else console.log("ATENCAO: verificar objetos QA em " + BUCKET + "/" + prefix);
}
