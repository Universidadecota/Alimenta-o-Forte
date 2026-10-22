import PublicLanding from "./PublicLanding";
import Onboarding from "./Onboarding";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { EMAIL_CONFIRM_REDIRECT, PASSWORD_RECOVERY_REDIRECT, isRecoveryCallbackUrl } from "./lib/authRedirect";
import { Leaf, Mail, Lock, UserRound } from "lucide-react";
import { authEmailFailureMessage, isAuthEmailRateLimited } from "./lib/authEmailFeedback";
export default function AuthGate({children}:{children:ReactNode}){
 const [session,setSession]=useState<Session|null>(null);
 const [showAuth,setShowAuth]=useState(false);
 const [onboarding,setOnboarding]=useState<"checking"|"needed"|"done">("checking");
 const [onboardingCheckError,setOnboardingCheckError]=useState(false);
 const [onboardingRetry,setOnboardingRetry]=useState(0);
 const [loading,setLoading]=useState(!!supabase);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [mode,setMode]=useState<"login"|"signup"|"reset">("login");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [recoveryAttempt,setRecoveryAttempt]=useState<{email:string;outcome:"received"|"limited"}|null>(null);
 const currentEmail=email.trim().toLowerCase();
 const recoveryAlreadyAttempted=mode==="reset"&&recoveryAttempt?.email===currentEmail;
 const [recoveryMode,setRecoveryMode]=useState(()=>isRecoveryCallbackUrl(window.location.href));
 const [newPassword,setNewPassword]=useState("");
 const [repeatPassword,setRepeatPassword]=useState("");
 useEffect(()=>{
  if(!supabase)return;
  const client=supabase;
  let active=true;
  client.auth.getSession().then(({data,error})=>{
   if(!active)return;
   setSession(data.session);
   setLoading(false);
   if(error)setMessage("Não foi possível verificar a sessão.");
  });
  const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{
   if(!active)return;
   setSession(session);
   if(event==="PASSWORD_RECOVERY"){
    setRecoveryMode(true);
    setMessage("");
   }
  });
  return ()=>{active=false;subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!session){setOnboarding("checking");setOnboardingCheckError(false);return;}
  let alive=true;
  setOnboarding("checking");setOnboardingCheckError(false);
  const client=supabase;if(!client)return;
  void client.from("user_preferences").select("onboarding_completed_at")
   .eq("user_id",session.user.id).maybeSingle().then(({data,error})=>{
    if(!alive)return;
    if(error){setOnboardingCheckError(true);return;}
    setOnboarding(data?.onboarding_completed_at?"done":"needed");
   });
  return()=>{alive=false;};
 },[session?.user.id,onboardingRetry]);
 async function submit(e:FormEvent){
  e.preventDefault();if(!supabase||busy||(mode==="reset"&&recoveryAlreadyAttempted))return;
  setBusy(true);setMessage("");
  try{
   if(mode==="reset"){
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:PASSWORD_RECOVERY_REDIRECT});
    if(error)throw error;
    setRecoveryAttempt({email:currentEmail,outcome:"received"});
    setMessage("Solicitação recebida. Se o e-mail estiver cadastrado, você receberá instruções de recuperação. Confira seu e-mail antes de solicitar novamente.");
   }
   else if(mode==="signup"){
    const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:EMAIL_CONFIRM_REDIRECT}});
    if(error)throw error;
    setMessage("Cadastro recebido. Verifique seu e-mail se a confirmação estiver habilitada.");
   }
   else {const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;}
  }catch(err){
   if(mode==="reset"){
    if(isAuthEmailRateLimited(err))setRecoveryAttempt({email:currentEmail,outcome:"limited"});
    setMessage(authEmailFailureMessage(err));
   }else if(mode==="signup"&&isAuthEmailRateLimited(err)){
    setMessage(authEmailFailureMessage(err));
   }else{
    setMessage(err instanceof Error?err.message:"Não foi possível completar a operação.");
   }
  }finally{setBusy(false);}
 }
 async function completeRecovery(e:FormEvent){
  e.preventDefault();
  if(!supabase||!session||busy)return;
  if(newPassword.length<8){setMessage("Use uma senha com pelo menos 8 caracteres.");return;}
  if(newPassword!==repeatPassword){setMessage("As senhas digitadas não conferem.");return;}
  setBusy(true);setMessage("");
  try{
   const {error}=await supabase.auth.updateUser({password:newPassword});
   if(error)throw error;
   setNewPassword("");setRepeatPassword("");setPassword("");
   // Finalizada a redefinição, exigir um novo login com a senha atualizada.
   const {error:logoutError}=await supabase.auth.signOut();
   if(logoutError)throw logoutError;
   window.history.replaceState({}, "", window.location.pathname);
   setRecoveryMode(false);setMode("login");setShowAuth(true);
   setMessage("Senha alterada com sucesso. Entre usando sua nova senha.");
  }catch(err){
   setMessage(err instanceof Error?err.message:"Não foi possível alterar a senha. Solicite um novo link de recuperação.");
  }finally{setBusy(false);}
 }
 if(!supabase)return <><div className="demo-banner">Ambiente de demonstração — configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar autenticação.</div>{children}</>;
 if(loading)return <div className="auth-center">Carregando Costa&Costa...</div>;
 // Deve preceder o onboarding e o aplicativo, para não ignorar o link de recuperação.
 if(recoveryMode&&session)return <div className="auth-center"><form className="auth-card" onSubmit={completeRecovery}>
  <div className="auth-logo"><Leaf size={25}/></div>
  <h1>Costa&Costa</h1><p>Sua alimentação. Seu ritmo. Sua evolução.</p>
  <h2>Definir nova senha</h2>
  <p>Confirme sua nova senha para concluir a recuperação da conta.</p>
  <label><Lock size={16}/> Nova senha
   <input type="password" autoComplete="new-password" required minLength={8}
    value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="No mínimo 8 caracteres"/>
  </label>
  <label><Lock size={16}/> Confirmar nova senha
   <input type="password" autoComplete="new-password" required minLength={8}
    value={repeatPassword} onChange={e=>setRepeatPassword(e.target.value)} placeholder="Digite a mesma senha novamente"/>
  </label>
  {message&&<div className="auth-message" role="status">{message}</div>}
  <button className="primary auth-submit" disabled={busy} type="submit">{busy?"Salvando...":"Salvar nova senha"}</button>
  <small>Por segurança, será necessário entrar novamente depois de alterar a senha.</small>
 </form></div>;
 if(recoveryMode&&!session)return <div className="auth-center"><section className="auth-card">
  <div className="auth-logo"><Leaf size={25}/></div>
  <h1>Costa&Costa</h1><h2>Link de recuperação inválido ou expirado</h2>
  <p>Solicite outro e-mail de recuperação para redefinir sua senha com segurança.</p>
  <button type="button" className="primary auth-submit" onClick={()=>{
   window.history.replaceState({}, "", window.location.pathname);
   setRecoveryMode(false);setShowAuth(true);setMode("reset");setMessage("");
  }}>Solicitar novo link</button>
 </section></div>;
 if(session&&onboarding==="checking"&&onboardingCheckError)return <div className="auth-center"><section className="auth-card">
  <div className="auth-logo"><Leaf size={25}/></div>
  <h1>Costa&Costa</h1><h2>Não foi possível carregar seu perfil</h2>
  <p>Houve uma falha ao consultar suas preferências. Para proteger seus dados, não vamos ignorar esta etapa.</p>
  <button type="button" className="primary auth-submit" onClick={()=>setOnboardingRetry(n=>n+1)}>Tentar novamente</button>
  <small>Se o problema persistir, tente novamente com uma conexão estável.</small>
 </section></div>;
 if(session&&onboarding==="checking")return <div className="auth-center">Preparando sua experiência Costa&Costa...</div>;
 if(session&&onboarding==="needed")return <Onboarding userId={session.user.id} onDone={()=>setOnboarding("done")}/>;
 if(session)return <>{children}</>;
 if(!showAuth)return <PublicLanding onAuth={next=>{setMode(next);setShowAuth(true);setMessage("");}}/>;
 return <div className="auth-center"><form className="auth-card" onSubmit={submit}>
 <button className="auth-back-home" type="button" onClick={()=>setShowAuth(false)}>← Voltar para o início</button><div className="auth-logo"><Leaf size={25}/></div><h1>Costa&Costa</h1><p>Sua alimentação. Seu ritmo. Sua evolução.</p>
 <h2>{mode==="signup"?"Crie sua conta":mode==="reset"?"Recuperar senha":"Entre na sua conta"}</h2>
 <label><Mail size={16}/> E-mail<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
 {mode!=="reset"&&<label><Lock size={16}/> Senha<input type="password" required minLength={6} autoComplete={mode==="signup"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/></label>}
 {message&&<div className="auth-message" role="status">{message}</div>}
 <button disabled={busy} className="primary auth-submit" type="submit"><UserRound size={17}/>{busy?"Aguarde...":mode==="signup"?"Criar conta":mode==="reset"?"Enviar recuperação":"Entrar"}</button>
 <div className="auth-links"><button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setMessage("");}}>{mode==="login"?"Criar uma conta":"Voltar ao login"}</button>{mode==="login"&&<button type="button" onClick={()=>{setMode("reset");setMessage("");}}>Esqueci minha senha</button>}</div>
 <small>Ao continuar, você reconhece que esta plataforma fornece informações educativas e não substitui acompanhamento profissional.</small>
 </form></div>;
}
