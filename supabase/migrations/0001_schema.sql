create extension if not exists "pgcrypto";
create type public.member_role as enum ('admin', 'member');
create type public.activity_type as enum ('base','multiplier_add','flat_bonus','per_unit_bonus');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Gracz',
  avatar_url text,
  created_at timestamptz not null default now()
);
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  invite_code text not null unique default encode(gen_random_bytes(6),'hex'),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
create index idx_group_members_user on public.group_members(user_id);
create index idx_group_members_group on public.group_members(group_id);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  color text not null default '#8E8E93',
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (group_id, name)
);
create index idx_categories_group on public.categories(group_id);
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  type public.activity_type not null,
  value numeric(10,2) not null default 0,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (group_id, name)
);
create index idx_activities_group on public.activities(group_id);
create index idx_activities_cat on public.activities(category_id);
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  subject_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  note text,
  occurred_at timestamptz not null default now(),
  total_points numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index idx_entries_group_time on public.entries(group_id, occurred_at desc);
create index idx_entries_subject on public.entries(subject_id);
create table public.entry_items (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  activity_id uuid not null references public.activities(id),
  activity_type public.activity_type not null,
  activity_value numeric(10,2) not null,
  qty int not null default 1,
  created_at timestamptz not null default now()
);
create index idx_entry_items_entry on public.entry_items(entry_id);
create index idx_entry_items_activity on public.entry_items(activity_id);
