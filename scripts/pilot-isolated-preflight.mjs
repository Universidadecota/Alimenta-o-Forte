#!/usr/bin/env node
/**
 * CLI estritamente offline. Não importar supabase-js nem conectar a banco.
 * Variáveis de ambiente não devem conter senhas ou chaves de acesso.
 */
import {makeIsolatedReadinessReport} from "./lib/pilot-isolated-target-guard.mjs";

const config={
 mode:process.env.CC_ISOLATED_TEST_MODE??"",
 url:process.env.CC_ISOLATED_TEST_URL??"",
 projectRef:process.env.CC_ISOLATED_TEST_PROJECT_REF??"",
 approvedProjectRef:process.env.CC_ISOLATED_TEST_APPROVED_REF??"",
 confirmation:process.env.CC_ISOLATED_TEST_CONFIRMATION??""
};
const report=makeIsolatedReadinessReport(config);
process.stdout.write(JSON.stringify(report,null,2)+"\n");
if(!report.target.allowed)process.exitCode=2;
// Quando permitido, isso confirma APENAS a sintaxe e a seleção do alvo.
// Nenhum teste de autorização, nenhuma migração e nenhuma conexão é feita.
