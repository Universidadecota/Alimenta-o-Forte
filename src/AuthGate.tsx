import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { Leaf, LogOut, Mail, Lock, UserRound } from "lucide-react";
export default function AuthGate({children}:{children:ReactNode}){
 const [session,setSession]=useState<Session|null>(null);
 const [loading,setLoading]=useState(!!supabase);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [mode,setMode]=useState<"login"|"signup"|"reset">("login");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!supabase)return;
  const client=supabase;
  client.auth.getSession().then(({data,error})=>{setSession(data.session);setLoading(false);if(error)setMessage("Não foi possível verificar a sessão.");});
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>setSession(session));
  return ()=>subscription.unsubscribe();
 },[]);
 async function submit(e:FormEvent){
  e.preventDefault();if(!supabase)return;
  setBusy(true);setMessage("");
  try{
   if(mode==="reset"){const {error}=await supabase!.auth.resetPasswordForEmail(email);if(error)throw error;setMessage("Se o e-mail estiver cadastrado, você receberá instruções de recuperação.");}
   else if(mode==="signup"){const {error}=await supabase.auth.signUp({email,password});if(error)throw error;setMessage("Cadastro recebido. Verifique seu e-mail se a confirmação estiver habilitada.");}
   else {const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;}
  }catch(err){setMessage(err instanceof Error?err.message:"Não foi possível completar a operação.");}finally{setBusy(false);}
 }
 if(!supabase)return <><div className="demo-banner">Ambiente de demonstração — configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar autenticação.</div>{children}</>;
 if(loading)return <div className="auth-center">Carregando Costa&Costa...</div>;
 if(session)return <><div className="session-bar"><span>Conectado como {session.user.email}</span><button type="button" onClick={()=>void supabase?.auth.signOut()}><LogOut size={15}/> Sair</button></div>{children}</>;
 return <div className="auth-center"><form className="auth-card" onSubmit={submit}>
 <div className="auth-logo"><Leaf size={25}/></div><h1>Costa&Costa</h1><p>Sua alimentação. Seu ritmo. Sua evolução.</p>
 <h2>{mode==="signup"?"Crie sua conta":mode==="reset"?"Recuperar senha":"Entre na sua conta"}</h2>
 <label><Mail size={16}/> E-mail<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
 {mode!=="reset"&&<label><Lock size={16}/> Senha<input type="password" required minLength={6} autoComplete={mode==="signup"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/></label>}
 {message&&<div className="auth-message" role="status">{message}</div>}
 <button disabled={busy} className="primary auth-submit" type="submit"><UserRound size={17}/>{busy?"Aguarde...":mode==="signup"?"Criar conta":mode==="reset"?"Enviar recuperação":"Entrar"}</button>
 <div className="auth-links"><button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setMessage("");}}>{mode==="login"?"Criar uma conta":"Voltar ao login"}</button>{mode==="login"&&<button type="button" onClick={()=>{setMode("reset");setMessage("");}}>Esqueci minha senha</button>}</div>
 <small>Ao continuar, você reconhece que esta plataforma fornece informações educativas e não substitui acompanhamento profissional.</small>
 </form></div>;
}
