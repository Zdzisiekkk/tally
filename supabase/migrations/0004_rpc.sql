create or replace function public.join_group_by_code(p_code text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_group uuid;
begin
  select id into v_group from public.groups where invite_code=p_code;
  if v_group is null then raise exception 'INVALID_CODE'; end if;
  insert into public.group_members(group_id,user_id,role) values (v_group,auth.uid(),'member')
    on conflict (group_id,user_id) do nothing;
  return v_group;
end; $$;
create or replace function public.create_group(p_name text, p_seed boolean default true)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_group uuid; v_cat_intim uuid; v_cat_mod uuid;
begin
  insert into public.groups(name,created_by) values (p_name,auth.uid()) returning id into v_group;
  insert into public.group_members(group_id,user_id,role) values (v_group,auth.uid(),'admin');
  if p_seed then
    insert into public.categories(group_id,name,color,sort_order) values (v_group,'Aktywności','#0A84FF',0) returning id into v_cat_intim;
    insert into public.categories(group_id,name,color,sort_order) values (v_group,'Modyfikatory','#FF9F0A',1) returning id into v_cat_mod;
    insert into public.activities(group_id,category_id,name,type,value,sort_order) values
      (v_group,v_cat_intim,'Lizanie','base',1,0),
      (v_group,v_cat_intim,'Lodzik albo palcowa','base',2,1),
      (v_group,v_cat_intim,'Ruchanie','base',5,2),
      (v_group,v_cat_intim,'Trójkąt','base',10,3),
      (v_group,v_cat_mod,'Torta','multiplier_add',2,4),
      (v_group,v_cat_mod,'Niepełnosprawna','flat_bonus',50,5),
      (v_group,v_cat_mod,'Każda dupa zwinięta na willę','per_unit_bonus',1,6);
  end if;
  return v_group;
end; $$;
create or replace function public.add_entry(p_group uuid, p_subject uuid, p_items jsonb, p_note text default null, p_occurred_at timestamptz default now())
returns uuid language plpgsql security definer set search_path=public as $$
declare v_entry uuid; v_item jsonb; v_act public.activities%rowtype;
begin
  if not public.is_group_admin(p_group,auth.uid()) then raise exception 'NOT_ADMIN'; end if;
  insert into public.entries(group_id,subject_id,created_by,note,occurred_at) values (p_group,p_subject,auth.uid(),p_note,p_occurred_at) returning id into v_entry;
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_act from public.activities where id=(v_item->>'activity_id')::uuid and group_id=p_group;
    if not found then raise exception 'ACTIVITY_NOT_IN_GROUP'; end if;
    insert into public.entry_items(entry_id,activity_id,activity_type,activity_value,qty)
    values (v_entry,v_act.id,v_act.type,v_act.value,coalesce((v_item->>'qty')::int,1));
  end loop;
  return v_entry;
end; $$;
