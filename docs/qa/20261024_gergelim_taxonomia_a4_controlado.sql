-- Alimentação Forte Beta · ampliar a taxonomia administrativa preliminar A4.
-- Gergelim/sésamo é possibilidade real de alergia: rótulo de Anvisa permite
-- declaração voluntária mesmo fora da lista do Anexo III da RDC 727/2022.
-- Esta adição NÃO é uma aprovação de receita, não infere ausência, não altera
-- preferências existentes e não habilita cardápio automático para alérgicos.
-- Somente dado de referência; nenhuma RLS, GRANT, função ou trigger alterado.

begin;

do $sesame$
declare
 v_label text;
begin
 if to_regclass('public.cc_allergen_a4_taxonomy') is null then
  raise exception 'Taxonomia A4 não instalada: cancelando operação';
 end if;
 select label into v_label from public.cc_allergen_a4_taxonomy
 where code='gergelim' for update;
 if found then
  if v_label<>'Gergelim (sésamo)' then
   raise exception 'Código gergelim existe com outro rótulo: %',v_label;
  end if;
 else
  insert into public.cc_allergen_a4_taxonomy(code,label)
  values ('gergelim','Gergelim (sésamo)');
 end if;
end
$sesame$;

commit;
