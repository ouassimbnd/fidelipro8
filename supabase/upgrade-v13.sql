-- Mise à jour v12 -> v13. À exécuter une fois dans Supabase SQL Editor.
-- N'efface aucune donnée et ne change pas la règle 10 points / passage, 5 points / avis privé.
begin;

-- Le client ne peut lire que l'historique de ses propres adhésions.
create or replace function public.customer_history(p_membership uuid,p_offset integer default 0,p_limit integer default 20)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare v_result jsonb;
begin
 if auth.uid() is null or not exists(
  select 1 from public.memberships m join public.customers c on c.id=m.customer_id
  where m.id=p_membership and c.auth_user_id=auth.uid()
 ) then raise exception 'Accès refusé'; end if;
 if p_offset<0 or p_offset>100000 or p_limit<1 or p_limit>50 then raise exception 'Page invalide'; end if;
 select coalesce(jsonb_agg(x order by x.created_at desc,x.id desc),'[]'::jsonb) into v_result from (
  select * from (
   select v.id,'visite'::text as kind,v.created_at,'Passage validé'::text as detail,10::integer as points
   from public.visits v where v.membership_id=p_membership
   union all
   select r.id,'recompense',r.created_at,coalesce(w.name,'Récompense remise'),-r.points_spent
   from public.redemptions r left join public.rewards w on w.id=r.reward_id where r.membership_id=p_membership
   union all
   select f.id,'avis',f.created_at,'Retour privé envoyé',5
   from public.private_feedback f where f.membership_id=p_membership
  ) entries order by entries.created_at desc,entries.id desc limit p_limit offset p_offset
 ) x;
 return v_result;
end $$;
revoke all on function public.customer_history(uuid,integer,integer) from public,anon;
grant execute on function public.customer_history(uuid,integer,integer) to authenticated;

-- Renommer un membre conserve son identifiant et les visites déjà attribuées.
create or replace function public.rename_cashier(p_cashier uuid,p_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_business uuid;
begin
 select business_id into v_business from public.cashiers where id=p_cashier;
 if auth.uid() is null or v_business is null or not public.owns_business(v_business) then raise exception 'Accès refusé'; end if;
 if p_name is null or length(trim(p_name)) not between 2 and 60 then raise exception 'Nom invalide'; end if;
 update public.cashiers set name=trim(p_name) where id=p_cashier;
end $$;
revoke all on function public.rename_cashier(uuid,text) from public,anon;
grant execute on function public.rename_cashier(uuid,text) to authenticated;
commit;
