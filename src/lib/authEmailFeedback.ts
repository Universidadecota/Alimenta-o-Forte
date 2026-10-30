/** Feedback de limite de e-mails do Supabase Auth, sem expor existência de contas. */
export type AuthEmailErrorLike = { status?:number; code?:string; message?:string };
export function isAuthEmailRateLimited(error: unknown): boolean {
 if (!error || typeof error !== "object") return false;
 const e = error as AuthEmailErrorLike;
 if (e.status === 429) return true;
 const code = (e.code ?? "").toLowerCase();
 return code === "over_email_send_rate_limit" ||
  code === "over_request_rate_limit" ||
  code === "over_email_send_rate_limit" ||
  code === "email_rate_limit_exceeded" ||
  code === "too_many_requests";
}
export function authEmailFailureMessage(error: unknown): string {
 if (isAuthEmailRateLimited(error)) {
  return "Limite temporário de solicitações de e-mail atingido. Esta tentativa foi bloqueada. Confira se já recebeu uma mensagem e tente novamente mais tarde. Não repita o envio várias vezes.";
 }
 return "Não foi possível solicitar o envio do e-mail agora. Verifique sua conexão e tente novamente mais tarde.";
}
