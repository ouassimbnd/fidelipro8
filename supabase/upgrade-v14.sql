-- Fideli v14 — rôles, données client enrichies, consentements et campagnes.
-- Migration additive : n'efface aucune donnée existante.
begin;

alter table public.businesses add column if not exists logo_url text;
alter table public.customers add column if not exists phone text;
alter table public.customers add column if not exists birth_date date;
alter table public.customers add column if not exists marketing_consent boolean not null default false;
alter table public.customers add column if not exists marketing_consent_at timestamptz;
alter table public.customers add column if not exists privacy_accepted_at timestamptz;

create table if not exists public.business_members(
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('manager','cashier')), active boolean not null default true,
 created_at timestamptz not null default now(), unique(business_id,user_id)
);
create index if not exists business_members_user_idx on public.business_members(user_id);
alter table public.business_members enable row level security;

drop policy if exists business_members_self_read on public.business_members;
create policy business_members_self_read on public.business_members for select to authenticated
 using(user_id=(select auth.uid()) or public.owns_business(business_id));

create or replace function public.business_role(p_business uuid) returns text
language sql stable security definer set search_path='' as $$
 select case when exists(select 1 from public.businesses b where b.id=p_business and b.owner_id=auth.uid()) then 'owner'
 else (select bm.role from public.business_members bm where bm.business_id=p_business and bm.user_id=auth.uid() and bm.active limit 1) end;
$$;
create or replace function public.can_manage_business(p_business uuid) returns boolean
language sql stable security definer set search_path='' as $$ select coalesce(public.business_role(p_business) in ('owner','manager'),false); $$;
create or replace function public.can_operate_business(p_business uuid) returns boolean
language sql stable security definer set search_path='' as $$ select coalesce(public.business_role(p_business) in ('owner','manager','cashier'),false); $$;
revoke all on function public.business_role(uuid),public.can_manage_business(uuid),public.can_operate_business(uuid) from public,anon;
grant execute on function public.business_role(uuid),public.can_manage_business(uuid),public.can_operate_business(uuid) to authenticated;

-- Les profils d'équipe et statistiques sont accessibles aux responsables, la caisse aux trois rôles.
drop policy if exists cashier_owner_read on public.cashiers;
create policy cashier_team_read on public.cashiers for select to authenticated using(public.can_operate_business(business_id));

create or replace function public.record_visit(p_membership uuid,p_cashier uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_business uuid;v_id uuid;
begin
 select p.business_id into v_business from public.memberships m join public.programs p on p.id=m.program_id where m.id=p_membership and p.active;
 if v_business is null or not public.can_operate_business(v_business) then raise exception 'Accès refusé'; end if;
 if p_cashier is not null and not exists(select 1 from public.cashiers where id=p_cashier and business_id=v_business and active) then raise exception 'Caissier invalide';end if;
 if exists(select 1 from public.visits where membership_id=p_membership and created_at>now()-interval '10 minutes') then raise exception 'Passage déjà enregistré il y a moins de 10 minutes';end if;
 insert into public.visits(membership_id,recorded_by,cashier_id) values(p_membership,auth.uid(),p_cashier) returning id into v_id;return v_id;
end $$;

create or replace function public.redeem_reward(p_membership uuid,p_reward uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_business uuid;v_cost integer;v_balance integer;v_id uuid;v_reward_program uuid;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_membership::text,0));
 select p.business_id into v_business from public.memberships m join public.programs p on p.id=m.program_id where m.id=p_membership and p.active;
 if v_business is null or not public.can_operate_business(v_business) then raise exception 'Accès refusé';end if;
 select program_id,points_cost into v_reward_program,v_cost from public.rewards where id=p_reward and active;
 if v_cost is null or not exists(select 1 from public.memberships m where m.id=p_membership and m.program_id=v_reward_program) then raise exception 'Récompense indisponible';end if;
 select (select count(*)*10 from public.visits where membership_id=p_membership)+(select count(*)*5 from public.private_feedback where membership_id=p_membership)-(select coalesce(sum(points_spent),0) from public.redemptions where membership_id=p_membership) into v_balance;
 if v_balance<v_cost then raise exception 'Points insuffisants';end if;
 insert into public.redemptions(membership_id,redeemed_by,reward_id,points_spent) values(p_membership,auth.uid(),p_reward,v_cost) returning id into v_id;return v_id;
end $$;

create table if not exists public.campaigns(
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null check(length(trim(name)) between 2 and 100), channel text not null default 'email' check(channel in ('email')),
 subject text not null check(length(trim(subject)) between 2 and 140), content text not null check(length(trim(content)) between 2 and 4000),
 status text not null default 'draft' check(status in ('draft','ready','sent','cancelled')),
 audience_count integer not null default 0, sent_count integer not null default 0, opened_count integer not null default 0,
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), sent_at timestamptz
);
create index if not exists campaigns_business_idx on public.campaigns(business_id,created_at desc);
alter table public.campaigns enable row level security;
create policy campaigns_team_read on public.campaigns for select to authenticated using(public.can_manage_business(business_id));
create policy campaigns_team_insert on public.campaigns for insert to authenticated with check(public.can_manage_business(business_id) and created_by=auth.uid());
create policy campaigns_team_update on public.campaigns for update to authenticated using(public.can_manage_business(business_id)) with check(public.can_manage_business(business_id));

-- Le propriétaire reste automatiquement représenté par businesses.owner_id. Les membres ont un rôle séparé.
commit;
