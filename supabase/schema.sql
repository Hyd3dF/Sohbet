-- ============================================================================
-- OP Chat - Supabase clean install schema
-- Run this file once in Supabase Studio -> SQL Editor.
--
-- WARNING: This is a clean-install script. It drops the app tables, functions,
-- enums, triggers, and storage policies listed below, then recreates them.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Reset app objects ----------
drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.messages cascade;
drop table if exists public.room_members cascade;
drop table if exists public.rooms cascade;
drop table if exists public.post_comments cascade;
drop table if exists public.post_likes cascade;
drop table if exists public.posts cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_new_room() cascade;
drop function if exists public.check_room_capacity() cascade;
drop function if exists public.room_role_of(uuid, uuid) cascade;
drop function if exists public.room_is_public(uuid) cascade;
drop function if exists public.room_owner_is(uuid, uuid) cascade;

drop type if exists public.attachment_type cascade;
drop type if exists public.room_role cascade;

-- ---------- Enums ----------
create type public.room_role as enum ('owner', 'admin', 'member');
create type public.attachment_type as enum ('image', 'audio', 'file');

-- ---------- Tables ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 1 and 32),
  display_name text check (display_name is null or char_length(display_name) <= 80),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 300),
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 4000),
  image_url text,
  created_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  description text check (description is null or char_length(description) <= 500),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  is_private boolean not null default false,
  max_members int not null default 50 check (max_members between 2 and 1000),
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.room_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text check (content is null or char_length(content) <= 4000),
  attachment_url text,
  attachment_type public.attachment_type,
  created_at timestamptz not null default now(),
  check (content is not null or attachment_url is not null)
);

-- ---------- Indexes ----------
create index profiles_username_idx on public.profiles (username);
create index posts_created_at_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id);
create index post_likes_user_idx on public.post_likes (user_id);
create index post_comments_post_idx on public.post_comments (post_id, created_at);
create index post_comments_author_idx on public.post_comments (author_id);
create index rooms_created_at_idx on public.rooms (created_at desc);
create index rooms_owner_idx on public.rooms (owner_id);
create index room_members_user_idx on public.room_members (user_id);
create index messages_room_idx on public.messages (room_id, created_at);
create index messages_author_idx on public.messages (author_id);

-- ---------- Helper functions ----------
create or replace function public.room_role_of(p_room uuid, p_user uuid)
returns public.room_role
language sql
security definer
set search_path = public
stable
as $$
  select rm.role
  from public.room_members rm
  where rm.room_id = p_room and rm.user_id = p_user
  limit 1;
$$;

create or replace function public.room_is_public(p_room uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = p_room and r.is_private = false
  );
$$;

create or replace function public.room_owner_is(p_room uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = p_room and r.owner_id = p_user
  );
$$;

grant execute on function public.room_role_of(uuid, uuid) to authenticated;
grant execute on function public.room_is_public(uuid) to authenticated;
grant execute on function public.room_owner_is(uuid, uuid) to authenticated;

-- ---------- Triggers ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(coalesce(
    nullif(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), ''),
    'user'
  ));

  candidate := left(base_username, 28);
  while exists (select 1 from public.profiles p where p.username = candidate) loop
    suffix := suffix + 1;
    candidate := left(base_username, 28) || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, candidate)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.room_members (room_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (room_id, user_id) do nothing;

  return new;
end;
$$;

create trigger on_room_created
  after insert on public.rooms
  for each row execute function public.handle_new_room();

create or replace function public.check_room_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap int;
  current_count int;
begin
  select r.max_members into cap
  from public.rooms r
  where r.id = new.room_id;

  select count(*) into current_count
  from public.room_members rm
  where rm.room_id = new.room_id;

  if current_count >= cap then
    raise exception 'Oda kapasitesi dolu (max %).', cap;
  end if;

  return new;
end;
$$;

create trigger check_room_capacity_trigger
  before insert on public.room_members
  for each row execute function public.check_room_capacity();

-- Create profiles for users that already exist in Auth.
insert into public.profiles (id, username, display_name)
select
  u.id,
  left('user_' || replace(u.id::text, '-', ''), 32),
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'user')
from auth.users u
on conflict (id) do nothing;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

-- profiles
create policy "profiles_read_all" on public.profiles
  for select using (true);

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- posts
create policy "posts_read_all" on public.posts
  for select using (true);

create policy "posts_insert_self" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "posts_update_own" on public.posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "posts_delete_own" on public.posts
  for delete using (auth.uid() = author_id);

-- post_likes
create policy "post_likes_read_all" on public.post_likes
  for select using (true);

create policy "post_likes_insert_self" on public.post_likes
  for insert with check (auth.uid() = user_id);

create policy "post_likes_delete_self" on public.post_likes
  for delete using (auth.uid() = user_id);

-- post_comments
create policy "post_comments_read_all" on public.post_comments
  for select using (true);

create policy "post_comments_insert_self" on public.post_comments
  for insert with check (auth.uid() = author_id);

create policy "post_comments_delete_own" on public.post_comments
  for delete using (auth.uid() = author_id);

-- rooms
create policy "rooms_read_visible" on public.rooms
  for select using (
    is_private = false
    or owner_id = auth.uid()
    or public.room_role_of(id, auth.uid()) is not null
  );

create policy "rooms_insert_self_owner" on public.rooms
  for insert with check (auth.uid() = owner_id);

create policy "rooms_update_owner" on public.rooms
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "rooms_delete_owner" on public.rooms
  for delete using (auth.uid() = owner_id);

-- room_members
create policy "room_members_read" on public.room_members
  for select using (
    public.room_is_public(room_id)
    or user_id = auth.uid()
    or public.room_role_of(room_id, auth.uid()) is not null
  );

create policy "room_members_join_or_invite" on public.room_members
  for insert with check (
    (auth.uid() = user_id and role = 'member' and public.room_is_public(room_id))
    or (auth.uid() = user_id and role = 'owner' and public.room_owner_is(room_id, auth.uid()))
    or public.room_role_of(room_id, auth.uid()) in ('owner', 'admin')
  );

create policy "room_members_remove" on public.room_members
  for delete using (
    auth.uid() = user_id
    or public.room_role_of(room_id, auth.uid()) = 'owner'
    or (public.room_role_of(room_id, auth.uid()) = 'admin' and role <> 'owner')
  );

create policy "room_members_update_role" on public.room_members
  for update using (
    public.room_role_of(room_id, auth.uid()) = 'owner'
    or (public.room_role_of(room_id, auth.uid()) = 'admin' and role <> 'owner')
  ) with check (
    public.room_role_of(room_id, auth.uid()) = 'owner'
    or (public.room_role_of(room_id, auth.uid()) = 'admin' and role <> 'owner')
  );

-- messages
create policy "messages_read_member" on public.messages
  for select using (
    public.room_role_of(room_id, auth.uid()) is not null
  );

create policy "messages_insert_member" on public.messages
  for insert with check (
    auth.uid() = author_id
    and public.room_role_of(room_id, auth.uid()) is not null
  );

create policy "messages_delete_owner_admin_or_self" on public.messages
  for delete using (
    auth.uid() = author_id
    or public.room_role_of(room_id, auth.uid()) in ('owner', 'admin')
  );

-- ---------- Realtime ----------
do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.post_likes;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.post_comments;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.room_members;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when others then null; end $$;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public)
values
  ('post-images', 'post-images', true),
  ('avatars', 'avatars', true),
  ('chat-attachments', 'chat-attachments', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "post-images read all" on storage.objects;
drop policy if exists "post-images upload self" on storage.objects;
drop policy if exists "post-images update self" on storage.objects;
drop policy if exists "post-images delete self" on storage.objects;
drop policy if exists "avatars read all" on storage.objects;
drop policy if exists "avatars upload self" on storage.objects;
drop policy if exists "avatars update self" on storage.objects;
drop policy if exists "avatars delete self" on storage.objects;
drop policy if exists "chat-attachments read all" on storage.objects;
drop policy if exists "chat-attachments upload self" on storage.objects;
drop policy if exists "chat-attachments update self" on storage.objects;
drop policy if exists "chat-attachments delete self" on storage.objects;

create policy "post-images read all" on storage.objects
  for select using (bucket_id = 'post-images');

create policy "post-images upload self" on storage.objects
  for insert with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post-images update self" on storage.objects
  for update using (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post-images delete self" on storage.objects
  for delete using (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars read all" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars upload self" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars update self" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars delete self" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "chat-attachments read all" on storage.objects
  for select using (bucket_id = 'chat-attachments');

create policy "chat-attachments upload self" on storage.objects
  for insert with check (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "chat-attachments update self" on storage.objects
  for update using (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "chat-attachments delete self" on storage.objects
  for delete using (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
