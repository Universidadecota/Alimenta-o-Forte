// A autenticação do beta deve sempre voltar ao domínio próprio, nunca a um
// URL temporário *.vercel.app. Permitir no Supabase Authentication → URL Configuration.
export const OFFICIAL_BETA_ORIGIN = "https://alimentacaoforte.epsacore.com.br";
export const EMAIL_CONFIRM_REDIRECT = OFFICIAL_BETA_ORIGIN + "/";
export const PASSWORD_RECOVERY_REDIRECT = OFFICIAL_BETA_ORIGIN + "/?cc_auth_action=recover";

export function isRecoveryCallbackUrl(url: string): boolean {
 try {
  const parsed = new URL(url);
  return parsed.origin === OFFICIAL_BETA_ORIGIN &&
   parsed.searchParams.get("cc_auth_action") === "recover";
 } catch {
  return false;
 }
}
