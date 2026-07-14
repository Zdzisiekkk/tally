create or replace function public.calc_entry_total(p_entry_id uuid)
returns numeric language sql stable as $$
  with items as (
    select activity_type, activity_value, qty from public.entry_items where entry_id = p_entry_id
  ),
  mult as (select coalesce(sum(activity_value),0) as m from items where activity_type='multiplier_add')
  select
      coalesce(sum(case when i.activity_type='base' then (i.activity_value+(select m from mult))*i.qty else 0 end),0)
    + coalesce(sum(case when i.activity_type='flat_bonus' then i.activity_value else 0 end),0)
    + coalesce(sum(case when i.activity_type='per_unit_bonus' then i.activity_value*i.qty else 0 end),0)
  from items i;
$$;
create or replace function public.refresh_entry_total()
returns trigger language plpgsql as $$
declare v_entry uuid;
begin
  v_entry := coalesce(new.entry_id, old.entry_id);
  update public.entries set total_points = public.calc_entry_total(v_entry) where id = v_entry;
  return null;
end; $$;
create trigger trg_entry_items_total
after insert or update or delete on public.entry_items
for each row execute function public.refresh_entry_total();
