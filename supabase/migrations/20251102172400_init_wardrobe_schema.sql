-- migration: initial wardrobe-assistant schema and policies
-- purpose: create core tables, relations, indices, triggers, rls policies, and storage policies for the wardrobe-assistant app
-- affected objects:
--   schemas: public, auth, storage
--   tables: public.profiles, public.item_categories, public.styles, public.wardrobe_items, public.creations, public.creation_items
--   functions: public.update_updated_at_column, public.can_add_to_creation, public.handle_new_user
--   triggers: update_*_updated_at, on_auth_user_created
--   indices: fk indices and functional indices listed below
-- notes:
--   - all sql is written in lowercase as required
--   - all user-data tables have rls enabled with granular per-role policies (anon vs authenticated)
--   - destructive operations are avoided in this initial migration; any future drops must include careful comments and data migration plans

-- 1) prerequisites and extensions -------------------------------------------------

-- ensure uuid generation is available for default values where used
create extension if not exists "uuid-ossp";

-- 2) dictionary tables ------------------------------------------------------------

-- 2.1 item_categories: dictionary of closet item categories
create table if not exists public.item_categories (
  id uuid primary key default extensions.uuid_generate_v4(),
  name varchar(50) not null unique,
  display_name varchar(100) not null,
  is_required boolean not null default false
);

-- enable rls even for dictionary tables (policies defined later)
alter table public.item_categories enable row level security;

-- 2.2 styles: dictionary of creation styles
create table if not exists public.styles (
  id uuid primary key default extensions.uuid_generate_v4(),
  name varchar(50) not null unique,
  display_name varchar(100) not null
);

alter table public.styles enable row level security;

-- 3) user profile table -----------------------------------------------------------

-- profiles: public profile data; id matches auth.users(id)
create table if not exists public.profiles (
  id uuid primary key,
  username varchar(50) not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_profiles_user
    foreign key (id) references auth.users(id) on delete cascade
);

alter table public.profiles enable row level security;

-- 4) user-owned data tables -------------------------------------------------------

-- wardrobe_items: clothing items owned by users
create table if not exists public.wardrobe_items (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null,
  category_id uuid not null,
  name varchar(100) not null,
  color varchar(50) not null,
  brand varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_wardrobe_items_user
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint fk_wardrobe_items_category
    foreign key (category_id) references public.item_categories(id) on delete restrict
);

alter table public.wardrobe_items enable row level security;

-- creations: accepted outfits created by users
create table if not exists public.creations (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null,
  style_id uuid not null,
  name varchar(200) not null,
  image_path text not null,
  status varchar(20) not null default 'pending', -- lifecycle status: pending | accepted | rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_creations_user
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint fk_creations_style
    foreign key (style_id) references public.styles(id) on delete restrict,
  constraint chk_creations_status check (status in ('pending','accepted','rejected'))
);

alter table public.creations enable row level security;

-- creation_items: m2m join between creations and wardrobe_items
create table if not exists public.creation_items (
  id uuid primary key default extensions.uuid_generate_v4(),
  creation_id uuid not null,
  item_id uuid not null,
  constraint fk_creation_items_creation
    foreign key (creation_id) references public.creations(id) on delete cascade,
  constraint fk_creation_items_item
    foreign key (item_id) references public.wardrobe_items(id) on delete cascade,
  constraint uq_creation_item unique (creation_id, item_id)
);

alter table public.creation_items enable row level security;

-- 5) seed initial dictionary data -------------------------------------------------

-- note: use on conflict do nothing to keep migration idempotent on re-run
insert into public.item_categories (id, name, display_name, is_required) values
  (extensions.uuid_generate_v4(), 'okrycie_glowy', 'okrycie głowy', false),
  (extensions.uuid_generate_v4(), 'okrycie_gorne', 'okrycie górne', true),
  (extensions.uuid_generate_v4(), 'okrycie_dolne', 'okrycie dolne', true),
  (extensions.uuid_generate_v4(), 'buty', 'buty', true)
on conflict (name) do nothing;

insert into public.styles (id, name, display_name) values
  (extensions.uuid_generate_v4(), 'casual', 'casual'),
  (extensions.uuid_generate_v4(), 'elegancki', 'elegancki'),
  (extensions.uuid_generate_v4(), 'plazowy', 'plażowy'),
  (extensions.uuid_generate_v4(), 'sexy', 'sexy'),
  (extensions.uuid_generate_v4(), 'wieczorowy', 'wieczorowy')
on conflict (name) do nothing;

-- 6) indices ---------------------------------------------------------------------

-- foreign key helper indices (improve join/filter performance)
create index if not exists idx_wardrobe_items_user_id on public.wardrobe_items(user_id);
create index if not exists idx_wardrobe_items_category_id on public.wardrobe_items(category_id);
create index if not exists idx_creations_user_id on public.creations(user_id);
create index if not exists idx_creations_style_id on public.creations(style_id);
create index if not exists idx_creations_user_status_created_at on public.creations(user_id, status, created_at desc);
create index if not exists idx_creation_items_creation_id on public.creation_items(creation_id);
create index if not exists idx_creation_items_item_id on public.creation_items(item_id);

-- functional and additional indices
create index if not exists idx_profiles_username_lower on public.profiles(lower(username));
create index if not exists idx_creations_created_at on public.creations(created_at desc);
create index if not exists idx_wardrobe_items_created_at on public.wardrobe_items(created_at desc);

-- 7) helper functions -------------------------------------------------------------

-- 7.1 function to auto-update updated_at timestamp columns
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 7.2 validation function ensuring items added to a creation belong to the same authenticated user
-- security definer so that it can check ownership regardless of caller privileges
create or replace function public.can_add_to_creation(
  p_creation_id uuid,
  p_item_id uuid
) returns boolean as $$
declare
  v_creation_user_id uuid;
  v_item_user_id uuid;
begin
  -- fetch owner of the creation
  select user_id into v_creation_user_id
  from public.creations
  where id = p_creation_id;

  -- fetch owner of the wardrobe item
  select user_id into v_item_user_id
  from public.wardrobe_items
  where id = p_item_id;

  -- allow insert only when both belong to the currently authenticated user
  return (
    v_creation_user_id = auth.uid()
    and v_item_user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 7.3 function to create a profile automatically when a new auth.user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- 8) triggers --------------------------------------------------------------------

-- keep updated_at fresh
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

create trigger update_wardrobe_items_updated_at
before update on public.wardrobe_items
for each row
execute function public.update_updated_at_column();

create trigger update_creations_updated_at
before update on public.creations
for each row
execute function public.update_updated_at_column();

-- create profiles automatically after a new auth user is inserted
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 9) row-level security policies -------------------------------------------------

-- guidelines: define separate policies for anon and authenticated roles per action.
-- by default, absence of a policy denies access. we still add explicit deny policies for transparency.

-- 9.1 profiles -------------------------------------------------------------------

-- anon: deny all access explicitly
create policy "anon cannot select profiles"
  on public.profiles for select
  to anon
  using (false);

create policy "anon cannot insert profiles"
  on public.profiles for insert
  to anon
  with check (false);

create policy "anon cannot update profiles"
  on public.profiles for update
  to anon
  using (false);

create policy "anon cannot delete profiles"
  on public.profiles for delete
  to anon
  using (false);

-- authenticated: can operate only on own row
create policy "authenticated can select own profiles"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "authenticated can insert own profiles"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "authenticated can update own profiles"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "authenticated can delete own profiles"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- 9.2 wardrobe_items --------------------------------------------------------------

create policy "anon cannot select wardrobe_items"
  on public.wardrobe_items for select
  to anon
  using (false);

create policy "anon cannot insert wardrobe_items"
  on public.wardrobe_items for insert
  to anon
  with check (false);

create policy "anon cannot update wardrobe_items"
  on public.wardrobe_items for update
  to anon
  using (false);

create policy "anon cannot delete wardrobe_items"
  on public.wardrobe_items for delete
  to anon
  using (false);

create policy "authenticated can select own wardrobe_items"
  on public.wardrobe_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "authenticated can insert own wardrobe_items"
  on public.wardrobe_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "authenticated can update own wardrobe_items"
  on public.wardrobe_items for update
  to authenticated
  using (auth.uid() = user_id);

create policy "authenticated can delete own wardrobe_items"
  on public.wardrobe_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- 9.3 creations ------------------------------------------------------------------

create policy "anon cannot select creations"
  on public.creations for select
  to anon
  using (false);

create policy "anon cannot insert creations"
  on public.creations for insert
  to anon
  with check (false);

create policy "anon cannot update creations"
  on public.creations for update
  to anon
  using (false);

create policy "anon cannot delete creations"
  on public.creations for delete
  to anon
  using (false);

create policy "authenticated can select own creations"
  on public.creations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "authenticated can insert own creations"
  on public.creations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "authenticated can update own creations"
  on public.creations for update
  to authenticated
  using (auth.uid() = user_id);

create policy "authenticated can delete own creations"
  on public.creations for delete
  to authenticated
  using (auth.uid() = user_id);

-- 9.4 creation_items --------------------------------------------------------------

create policy "anon cannot select creation_items"
  on public.creation_items for select
  to anon
  using (false);

create policy "anon cannot insert creation_items"
  on public.creation_items for insert
  to anon
  with check (false);

create policy "anon cannot update creation_items"
  on public.creation_items for update
  to anon
  using (false);

create policy "anon cannot delete creation_items"
  on public.creation_items for delete
  to anon
  using (false);

create policy "authenticated can select own creation_items"
  on public.creation_items for select
  to authenticated
  using (
    exists (
      select 1 from public.creations c
      where c.id = creation_items.creation_id
        and c.user_id = auth.uid()
    )
  );

create policy "authenticated can insert own creation_items"
  on public.creation_items for insert
  to authenticated
  with check (public.can_add_to_creation(creation_id, item_id));

-- updates to creation_items are not supported (identity of links should not change)
create policy "authenticated cannot update creation_items"
  on public.creation_items for update
  to authenticated
  using (false);

create policy "authenticated can delete own creation_items"
  on public.creation_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.creations c
      where c.id = creation_items.creation_id
        and c.user_id = auth.uid()
    )
  );

-- 9.5 dictionary tables read policies --------------------------------------------

-- item_categories: readable by authenticated users only; no writes except by service role
create policy "anon cannot select item_categories"
  on public.item_categories for select
  to anon
  using (false);

create policy "authenticated can select item_categories"
  on public.item_categories for select
  to authenticated
  using (true);

create policy "authenticated cannot modify item_categories"
  on public.item_categories for all
  to authenticated
  using (false)
  with check (false);

-- styles: readable by authenticated users only; no writes except by service role
create policy "anon cannot select styles"
  on public.styles for select
  to anon
  using (false);

create policy "authenticated can select styles"
  on public.styles for select
  to authenticated
  using (true);

create policy "authenticated cannot modify styles"
  on public.styles for all
  to authenticated
  using (false)
  with check (false);

-- optionally allow service_role unrestricted access (service key bypasses rls by default, but policy kept for clarity)
create policy "service_role full access item_categories"
  on public.item_categories for all
  to service_role
  using (true)
  with check (true);

create policy "service_role full access styles"
  on public.styles for all
  to service_role
  using (true)
  with check (true);

-- 10) storage bucket and policies -------------------------------------------------

-- create bucket 'creations' if it does not exist yet
insert into storage.buckets (id, name, public) values ('creations', 'creations', false)
on conflict (id) do nothing;

-- explicit deny for anon on storage objects within this bucket
create policy "anon cannot select creations bucket"
  on storage.objects for select to anon
  using (false);

create policy "anon cannot insert creations bucket"
  on storage.objects for insert to anon
  with check (false);

create policy "anon cannot delete creations bucket"
  on storage.objects for delete to anon
  using (false);

-- allow authenticated users to access only their own folder inside the 'creations' bucket
-- folder structure: {user_id}/{creation_id}.png
create policy "authenticated can upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'creations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "authenticated can view own files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'creations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "authenticated can delete own files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'creations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- end of migration ---------------------------------------------------------------
