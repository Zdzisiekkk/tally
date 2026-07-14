create or replace function public.leaderboard(p_group uuid, p_since timestamptz default null)
returns table(user_id uuid, display_name text, avatar_url text, total numeric, entries_count bigint)
language sql stable security definer set search_path=public as $$
  select p.id,p.display_name,p.avatar_url,coalesce(sum(e.total_points),0),count(e.id)
  from public.group_members gm
  join public.profiles p on p.id=gm.user_id
  left join public.entries e on e.subject_id=gm.user_id and e.group_id=p_group and (p_since is null or e.occurred_at>=p_since)
  where gm.group_id=p_group and public.is_group_member(p_group,auth.uid())
  group by p.id,p.display_name,p.avatar_url order by 4 desc;
$$;
create or replace view public.entry_feed as
select e.id,e.group_id,e.subject_id,e.created_by,e.note,e.occurred_at,e.total_points,
  ps.display_name as subject_name, ps.avatar_url as subject_avatar,
  (select jsonb_agg(jsonb_build_object('activity_id',ei.activity_id,'name',a.name,'type',ei.activity_type,'value',ei.activity_value,'qty',ei.qty))
   from public.entry_items ei join public.activities a on a.id=ei.activity_id where ei.entry_id=e.id) as items
from public.entries e join public.profiles ps on ps.id=e.subject_id;
alter view public.entry_feed set (security_invoker=on);
create or replace function public.stats_by_activity(p_group uuid, p_user uuid default null)
returns table(activity_id uuid, name text, category text, total numeric, times_used bigint)
language sql stable security definer set search_path=public as $$
  select a.id,a.name,c.name,
    coalesce(sum(case a.type when 'base' then ei.activity_value*ei.qty when 'per_unit_bonus' then ei.activity_value*ei.qty else ei.activity_value end),0),
    count(ei.id)
  from public.activities a
  left join public.categories c on c.id=a.category_id
  left join public.entry_items ei on ei.activity_id=a.id
  left join public.entries e on e.id=ei.entry_id and (p_user is null or e.subject_id=p_user)
  where a.group_id=p_group and public.is_group_member(p_group,auth.uid())
  group by a.id,a.name,c.name order by 4 desc;
$$;
create or replace function public.stats_timeline(p_group uuid, p_bucket text default 'week')
returns table(bucket timestamptz, user_id uuid, display_name text, points numeric)
language sql stable security definer set search_path=public as $$
  select date_trunc(p_bucket,e.occurred_at),e.subject_id,p.display_name,sum(e.total_points)
  from public.entries e join public.profiles p on p.id=e.subject_id
  where e.group_id=p_group and public.is_group_member(p_group,auth.uid())
  group by 1,2,3 order by 1;
$$;
