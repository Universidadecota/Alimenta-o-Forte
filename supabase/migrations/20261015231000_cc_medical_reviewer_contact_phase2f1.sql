-- Costa&Costa | Fase 2F.1 — Contato de convite, sem concessao de acesso.
-- Dados pessoais de contato serao escritos SOMENTE no Supabase, nao neste arquivo.
alter table public.cc_medical_reviewer_onboarding
  add column if not exists contact_email text,
  add column if not exists contact_verified_at timestamptz;

alter table public.cc_medical_reviewer_onboarding
  add constraint cc_medical_contact_email_format check (
    contact_email is null OR (
      length(contact_email) between 6 and 254
      and contact_email = lower(btrim(contact_email))
      and contact_email !~ '[[:space:]]'
      and position('@' in contact_email)>1
      and position('.' in split_part(contact_email,'@',2))>1
      and split_part(contact_email,'@',3)=''
    )
  ),
  add constraint cc_medical_contact_verification check (
    contact_verified_at is null OR contact_email is not null
  ),
  add constraint cc_medical_contact_required_for_invite check (
    invitation_status='not_invited' OR contact_email is not null
  ),
  add constraint cc_medical_contact_required_for_activation check (
    invitation_status<>'active' OR contact_verified_at is not null
  );

create unique index if not exists cc_medical_contact_email_unique
  on public.cc_medical_reviewer_onboarding (contact_email)
  where contact_email is not null;

comment on column public.cc_medical_reviewer_onboarding.contact_email is
  'Endereço informado pelo contratante, não comprovado; usado somente após aceite e convite autenticado.';
comment on column public.cc_medical_reviewer_onboarding.contact_verified_at is
  'Preenchimento futuro após confirmar posse do contato por autenticação apropriada. Nulo no pré-cadastro.';
