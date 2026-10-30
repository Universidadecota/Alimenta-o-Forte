-- Costa&Costa | Fase 2F: preparacao conservadora de credenciamento de revisora medica.
-- A concordancia relatada pelo administrador nao substitui verificacao CRM, RQE ou identidade.
-- NENHUMA conta, email, convite, permissao de revisao ou aprovacao e gerada.
create table if not exists public.cc_medical_reviewer_onboarding (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(btrim(display_name)) between 5 and 180),
  council text not null default 'CRM' check (council='CRM'),
  registration_region text not null check (registration_region ~ '^[A-Z]{2}$'),
  registration_number text not null check (registration_number ~ '^[0-9]{4,9}$'),
  claimed_specialty text not null default '',
  rqe_number text,
  consent_reported boolean not null default false,
  credential_status text not null default 'pending_official_check'
    check (credential_status in ('pending_official_check','crm_verified','specialty_verified','rejected')),
  verification_reference text not null default '',
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  auth_user_id uuid unique references auth.users(id),
  invitation_status text not null default 'not_invited'
    check (invitation_status in ('not_invited','invited','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cc_medical_review_unique_registry unique (council,registration_region,registration_number),
  constraint cc_medical_review_lengths check (
    length(claimed_specialty)<=160 AND (rqe_number is null or length(rqe_number)<=32)
    AND length(verification_reference)<=1200
  ),
  constraint cc_medical_review_verification_necessary check (
    credential_status not in ('crm_verified','specialty_verified')
    OR (verified_at is not null and verified_by is not null and length(btrim(verification_reference))>=10)
  ),
  constraint cc_medical_review_activation_guard check (
    invitation_status<>'active'
    OR (credential_status='specialty_verified'
      and rqe_number is not null and length(btrim(rqe_number))>=2
      and verified_at is not null and verified_by is not null
      and auth_user_id is not null and consent_reported
      and length(btrim(verification_reference))>=10)
  )
);
comment on table public.cc_medical_reviewer_onboarding is
 'Pre-cadastro restrito de revisores medicos, distinto de cc_nutrition_reviewers. Nenhum acesso concedido sem checagem documental CFM/CRM, RQE, identificacao da conta e ativacao manual.';
alter table public.cc_medical_reviewer_onboarding enable row level security;
revoke all on public.cc_medical_reviewer_onboarding from public,anon,authenticated;
grant select on public.cc_medical_reviewer_onboarding to authenticated;
drop policy if exists cc_medical_review_admin_read on public.cc_medical_reviewer_onboarding;
create policy cc_medical_review_admin_read on public.cc_medical_reviewer_onboarding
  for select to authenticated using ((select public.cc_is_admin()));

-- A futura autorizacao de parecer medico nao equivale a revisao nutricional.
create or replace function public.cc_is_medical_reviewer()
returns boolean language sql stable security definer set search_path=''
as $f$
 select exists (
   select 1 from public.cc_medical_reviewer_onboarding m
   where m.auth_user_id = (select auth.uid())
     and m.invitation_status='active'
     and m.credential_status='specialty_verified'
     and m.rqe_number is not null
     and m.verified_at is not null
 )
$f$;
revoke all on function public.cc_is_medical_reviewer() from public,anon,authenticated;
grant execute on function public.cc_is_medical_reviewer() to authenticated;

-- Registro preliminar: nome e especialidade conforme informados pelo responsavel do projeto.
-- Nao assumir nome civil completo de fontes secundarias nem RQE nao informado.
insert into public.cc_medical_reviewer_onboarding
 (display_name,council,registration_region,registration_number,claimed_specialty,consent_reported,
  credential_status,invitation_status,verification_reference)
values
 ('Dra. Thaisa Helena','CRM','SP','170476','Endocrinologia — informada pelo responsável, não verificada',
  true,'pending_official_check','not_invited','')
on conflict (council,registration_region,registration_number) do nothing;
