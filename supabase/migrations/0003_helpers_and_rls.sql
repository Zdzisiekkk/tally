create or replace function public.is_group_member(p_group uuid, p_user uuid)
returns boolean language sql security definer set search_path=public stable as $$
  select exists(select 1 from public.group_members where group_id=p_group and user_id=p_user);
$$;
create or replace function public.is_group_admin(p_group uuid, p_user uuid)
returns boolean language sql security definer set search_path=public stable as $$
  select exists(select 1 from public.group_members where group_id=p_group and user_id=p_user and role='admin');
$$;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.categories enable row level security;
alter table public.activities enable row level security;
alter table public.entries enable row level security;
alter table public.entry_items enable row level security;
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id=auth.uid());
create policy profiles_insert on public.profiles for insert to authenticated with check (id=auth.uid());
create policy groups_select on public.groups for select to authenticated using (public.is_group_member(id,auth.uid()));
create policy groups_insert on public.groups for insert to authenticated with check (created_by=auth.uid());
create policy groups_update on public.groups for update to authenticated using (public.is_group_admin(id,auth.uid()));
create policy groups_delete on public.groups for delete to authenticated using (public.is_group_admin(id,auth.uid()));
create policy gm_select on public.group_members for select to authenticated using (public.is_group_member(group_id,auth.uid()));
create policy gm_insert_self on public.group_members for insert to authenticated with check (user_id=auth.uid());
create policy gm_update_admin on public.group_members for update to authenticated using (public.is_group_admin(group_id,auth.uid()));
create policy gm_delete_admin_or_self on public.group_members for delete to authenticated using (public.is_group_admin(group_id,auth.uid()) or user_id=auth.uid());
create policy cat_select on public.categories for select to authenticated using (public.is_group_member(group_id,auth.uid()));
create policy cat_write_admin on public.categories for all to authenticated using (public.is_group_admin(group_id,auth.uid())) with check (public.is_group_admin(group_id,auth.uid()));
create policy act_select on public.activities for select to authenticated using (public.is_group_member(group_id,auth.uid()));
create policy act_write_admin on public.activities for all to authenticated using (public.is_group_admin(group_id,auth.uid())) with check (public.is_group_admin(group_id,auth.uid()));
create policy entries_select on public.entries for select to authenticated using (public.is_group_member(group_id,auth.uid()));
create policy entries_write_admin on public.entries for all to authenticated using (public.is_group_admin(group_id,auth.uid())) with check (public.is_group_admin(group_id,auth.uid()));
create policy ei_select on public.entry_items for select to authenticated using (exists(select 1 from public.entries e where e.id=entry_id and public.is_group_member(e.group_id,auth.uid())));
create policy ei_write_admin on public.entry_items for all to authenticated using (exists(select 1 from public.entries e where e.id=entry_id and public.is_group_admin(e.group_id,auth.uid()))) with check (exists(select 1 from public.entries e where e.id=entry_id and public.is_group_admin(e.group_id,auth.uid())));
