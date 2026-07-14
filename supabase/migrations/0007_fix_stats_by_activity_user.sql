-- Fix: stats_by_activity ignored p_user because the subject filter lived in the
-- LEFT JOIN's ON clause, so entry_items from every player were still summed.
-- Move the filter so per-player "Top aktywności" reflects only that player's entries.
create or replace function public.stats_by_activity(p_group uuid, p_user uuid default null)
returns table(activity_id uuid, name text, category text, total numeric, times_used bigint)
language sql stable security definer set search_path=public as $$
  select a.id, a.name, c.name,
    coalesce(sum(case a.type
      when 'base' then ei.activity_value*ei.qty
      when 'per_unit_bonus' then ei.activity_value*ei.qty
      else ei.activity_value end), 0),
    count(ei.id)
  from public.activities a
  left join public.categories c on c.id = a.category_id
  left join public.entry_items ei on ei.activity_id = a.id
  left join public.entries e
    on e.id = ei.entry_id
   and e.group_id = p_group
   and (p_user is null or e.subject_id = p_user)
  where a.group_id = p_group
    and public.is_group_member(p_group, auth.uid())
    -- keep only items that belong to a matching entry (drops other players' items)
    and (ei.id is null or e.id is not null)
  group by a.id, a.name, c.name
  order by 4 desc;
$$;
