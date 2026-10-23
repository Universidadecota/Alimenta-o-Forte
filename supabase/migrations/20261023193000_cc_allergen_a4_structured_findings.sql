-- Costa&Costa A4: avaliacao estruturada de RISCO por ingrediente/alergeno.
-- Apenas classificacao administrativa PRELIMINAR. Nao existe ausencia comprovada,
-- clearance, status verified nem qualquer desbloqueio do planejador nesta etapa.

create table if not exists public.cc_allergen_a4_taxonomy (
 code text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
 label text not null check (length(btrim(label)) >= 3)
);

insert into public.cc_allergen_a4_taxonomy(code,label) values
 ('trigo','Trigo'),('centeio','Centeio'),('cevada','Cevada'),('aveia','Aveia'),
 ('crustaceos','Crustáceos'),('ovos','Ovos'),('peixes','Peixes'),
 ('amendoim','Amendoim'),('soja','Soja'),('leite','Leite e derivados'),
 ('amendoa','Amêndoas'),('avela','Avelãs'),('castanha_caju','Castanha de caju'),
 ('castanha_para','Castanha-do-pará'),('macadamia','Macadâmia'),
 ('nozes','Nozes'),('peca','Noz-pecã'),('pistache','Pistache'),
 ('pinoli','Pinoli'),('castanhas','Castanhas não especificadas'),('latex','Látex natural')
on conflict (code) do nothing;

alter table public.cc_allergen_a4_taxonomy enable row level security;
revoke all on public.cc_allergen_a4_taxonomy from public,anon,authenticated;
grant select on public.cc_allergen_a4_taxonomy to authenticated;
drop policy if exists cc_a4_taxonomy_admin_read on public.cc_allergen_a4_taxonomy;
create policy cc_a4_taxonomy_admin_read on public.cc_allergen_a4_taxonomy
 for select to authenticated using (
  exists(select 1 from public.cc_admin_members m where m.user_id=(select auth.uid()))
 );

create table if not exists public.cc_allergen_a4_ingredient_findings (
 id uuid primary key default gen_random_uuid(),
 recipe_id uuid not null references public.recipes(id) on delete cascade,
 ingredient_id uuid not null references public.recipe_ingredients(id) on delete cascade,
 evidence_id uuid not null references public.cc_allergen_ingredient_evidence(id),
 allergen_code text not null references public.cc_allergen_a4_taxonomy(code),
 finding text not null check (finding in ('declared_in_recipe','suspected','undetermined')),
 cross_contact_finding text not null default 'not_assessed'
  check (cross_contact_finding in ('not_assessed','possible_reported')),
 assessment_notes text not null check (length(btrim(assessment_notes)) >= 15),
 ingredient_text_snapshot text not null default '',
 source_reference_hash_snapshot text not null default '',
 recorded_by uuid not null references auth.users(id),
 recorded_at timestamptz not null default now()
);

create index if not exists cc_a4_findings_recipe_recorded_idx
 on public.cc_allergen_a4_ingredient_findings(recipe_id,recorded_at desc);
create index if not exists cc_a4_findings_ingredient_code_idx
 on public.cc_allergen_a4_ingredient_findings(ingredient_id,allergen_code,recorded_at desc);

create or replace function public.cc_allergen_a4_finding_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
 v_recipe_id uuid;
 v_name text;
 v_source_hash text;
 v_owner uuid;
 v_archived timestamptz;
 v_evidence public.cc_allergen_ingredient_evidence%rowtype;
 v_latest_id uuid;
begin
 if (select auth.uid()) is null then
  raise exception 'Autenticacao obrigatoria para revisao A4' using errcode='42501';
 end if;
 select i.recipe_id,i.name,s.reference_hash,r.owner_user_id,r.archived_at
 into v_recipe_id,v_name,v_source_hash,v_owner,v_archived
 from public.recipe_ingredients i
 join public.recipes r on r.id=i.recipe_id
 left join public.cc_official_recipe_source_records s on s.recipe_id=i.recipe_id
 where i.id=new.ingredient_id;
 if not found or v_owner is not null or v_archived is not null
  or new.recipe_id is distinct from v_recipe_id or coalesce(v_source_hash,'')='' then
  raise exception 'A4 requer ingrediente oficial ativo e fonte original identificada'
   using errcode='23514';
 end if;
 select * into v_evidence from public.cc_allergen_ingredient_evidence
 where id=new.evidence_id;
 if not found or v_evidence.recipe_id is distinct from v_recipe_id
  or v_evidence.ingredient_id is distinct from new.ingredient_id
  or v_evidence.ingredient_text_snapshot is distinct from v_name
  or v_evidence.source_reference_hash_snapshot is distinct from v_source_hash then
  raise exception 'Evidencia A3B ausente, de outra receita ou desatualizada'
   using errcode='23514';
 end if;
 select e.id into v_latest_id from public.cc_allergen_ingredient_evidence e
 where e.ingredient_id=new.ingredient_id
 order by e.recorded_at desc,e.id desc limit 1;
 if v_latest_id is distinct from new.evidence_id then
  raise exception 'A4 deve se basear na evidencia A3B mais recente'
   using errcode='23514';
 end if;
 if new.finding='declared_in_recipe' and (
  v_evidence.source_kind <> 'recipe_text' or
  not (new.allergen_code = any(v_evidence.suspected_allergens))
 ) then
  raise exception 'Presenca declarada exige fonte textual A3B com alergeno identificado'
   using errcode='23514';
 end if;
 -- O banco sempre captura responsavel, horario e versao de origem. O cliente
 -- nao pode inventar assinatura, alterar evidencias anteriores nem aprovar.
 new.ingredient_text_snapshot := v_name;
 new.source_reference_hash_snapshot := v_source_hash;
 new.recorded_by := (select auth.uid());
 new.recorded_at := now();
 return new;
end;
$$;

revoke all on function public.cc_allergen_a4_finding_guard()
 from public,anon,authenticated;
drop trigger if exists cc_a4_finding_insert on public.cc_allergen_a4_ingredient_findings;
create trigger cc_a4_finding_insert
 before insert on public.cc_allergen_a4_ingredient_findings
 for each row execute function public.cc_allergen_a4_finding_guard();

alter table public.cc_allergen_a4_ingredient_findings enable row level security;
revoke all on public.cc_allergen_a4_ingredient_findings from public,anon,authenticated;
grant select,insert on public.cc_allergen_a4_ingredient_findings to authenticated;
drop policy if exists cc_a4_findings_admin_read on public.cc_allergen_a4_ingredient_findings;
create policy cc_a4_findings_admin_read on public.cc_allergen_a4_ingredient_findings
 for select to authenticated using (
  exists(select 1 from public.cc_admin_members m where m.user_id=(select auth.uid()))
 );
drop policy if exists cc_a4_findings_admin_append on public.cc_allergen_a4_ingredient_findings;
create policy cc_a4_findings_admin_append on public.cc_allergen_a4_ingredient_findings
 for insert to authenticated with check (
  exists(select 1 from public.cc_admin_members m where m.user_id=(select auth.uid()))
 );

comment on table public.cc_allergen_a4_ingredient_findings is
 'A4: classificacao preliminar append-only por ingrediente e alergeno, vinculada a evidencia A3B vigente. Sem declaracao de ausencia ou liberacao de cardapios.';
comment on table public.cc_allergen_a4_taxonomy is
 'Codigos editoriais para investigar; lista inicial, nao certificado de cobertura de todos os alergenos.';
