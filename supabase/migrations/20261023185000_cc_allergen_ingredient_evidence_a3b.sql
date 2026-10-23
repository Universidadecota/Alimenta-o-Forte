-- Costa&Costa A3B: trilha de evidencias editoriais POR INGREDIENTE.
-- PREPARADA para revisao. Nao aplicar automaticamente ao banco principal.
-- Nenhuma linha aqui declara alimento seguro ou desbloqueia sugestoes com alergias.

create table if not exists public.cc_allergen_ingredient_evidence (
 id uuid primary key default gen_random_uuid(),
 recipe_id uuid not null references public.recipes(id) on delete cascade,
 ingredient_id uuid not null references public.recipe_ingredients(id) on delete cascade,
 ingredient_text_snapshot text not null default '',
 source_reference_hash_snapshot text not null default '',
 evidence_state text not null default 'investigating'
  check (evidence_state in ('investigating','awaiting_supplier')),
 source_kind text not null default 'unverified'
  check (source_kind in ('unverified','recipe_text','supplier_label','manufacturer_document','other_document')),
 source_reference text not null default '',
 supplier_or_brand text not null default '',
 composition_notes text not null,
 suspected_allergens text[] not null default '{}',
 cross_contact_notes text not null default '',
 recorded_by uuid not null references auth.users(id),
 recorded_at timestamptz not null default now(),
 constraint cc_a3b_notes_required check (length(btrim(composition_notes)) >= 10),
 constraint cc_a3b_source_reference_required check (
  source_kind = 'unverified' or length(btrim(source_reference)) >= 5
 )
);

create index if not exists cc_a3b_recipe_recorded_idx
 on public.cc_allergen_ingredient_evidence(recipe_id,recorded_at desc);
create index if not exists cc_a3b_ingredient_recorded_idx
 on public.cc_allergen_ingredient_evidence(ingredient_id,recorded_at desc);

create or replace function public.cc_a3b_ingredient_evidence_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
 v_recipe_id uuid;
 v_name text;
 v_source_hash text;
 v_owner uuid;
 v_archived timestamptz;
begin
 if (select auth.uid()) is null then
  raise exception 'Autenticacao necessaria para evidencias de alergenicos'
   using errcode='42501';
 end if;
 select i.recipe_id,i.name,s.reference_hash,r.owner_user_id,r.archived_at
 into v_recipe_id,v_name,v_source_hash,v_owner,v_archived
 from public.recipe_ingredients i
 join public.recipes r on r.id=i.recipe_id
 left join public.cc_official_recipe_source_records s on s.recipe_id=i.recipe_id
 where i.id=new.ingredient_id;
 if not found or v_owner is not null or v_archived is not null
    or new.recipe_id is distinct from v_recipe_id then
  raise exception 'Evidencia restrita a ingrediente de receita oficial ativa'
   using errcode='23514';
 end if;
 if exists (
  select 1 from unnest(new.suspected_allergens) a
  where a is null or a !~ '^[a-z][a-z0-9_]*$'
 ) then
  raise exception 'Codigo de alergeno invalido (somente codigo canonico)'
   using errcode='23514';
 end if;
 -- A versao de origem e o texto sao capturados NO SERVIDOR, nao enviados pelo navegador.
 new.ingredient_text_snapshot := v_name;
 new.source_reference_hash_snapshot := coalesce(v_source_hash,'');
 new.recorded_by := (select auth.uid());
 new.recorded_at := now();
 return new;
end;
$$;

revoke all on function public.cc_a3b_ingredient_evidence_guard()
 from public,anon,authenticated;
drop trigger if exists cc_a3b_ingredient_evidence_insert on public.cc_allergen_ingredient_evidence;
create trigger cc_a3b_ingredient_evidence_insert
 before insert on public.cc_allergen_ingredient_evidence
 for each row execute function public.cc_a3b_ingredient_evidence_guard();

alter table public.cc_allergen_ingredient_evidence enable row level security;
revoke all on public.cc_allergen_ingredient_evidence from public,anon,authenticated;
grant select,insert on public.cc_allergen_ingredient_evidence to authenticated;

drop policy if exists cc_a3b_admin_read on public.cc_allergen_ingredient_evidence;
create policy cc_a3b_admin_read on public.cc_allergen_ingredient_evidence
 for select to authenticated using (
  exists(select 1 from public.cc_admin_members m where m.user_id=(select auth.uid()))
 );
drop policy if exists cc_a3b_admin_append on public.cc_allergen_ingredient_evidence;
create policy cc_a3b_admin_append on public.cc_allergen_ingredient_evidence
 for insert to authenticated with check (
  exists(select 1 from public.cc_admin_members m where m.user_id=(select auth.uid()))
 );

comment on table public.cc_allergen_ingredient_evidence is
 'Historico imutavel de INVESTIGACAO administrativa por ingrediente. Sem UPDATE/DELETE para authenticated, sem clearance, sem aprovacao e sem ativacao do planejador.';
comment on column public.cc_allergen_ingredient_evidence.source_reference_hash_snapshot is
 'Referencia da versao textual original no momento do registro; comparar com a fonte atual para detectar desatualizacao.';
