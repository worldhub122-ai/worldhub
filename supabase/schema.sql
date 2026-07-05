-- =========================================================================
-- WorldHub — schema.sql
-- Run this once in Supabase → SQL Editor (on a fresh project) to create
-- every table, index, RLS policy, storage bucket, and trigger the app
-- needs. Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1) PROFILES
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text not null default '',
  last_name     text default '',
  handle        text unique,
  avatar_url    text,
  cover_url     text,
  bio           text default '',
  world_id      text,
  settings      jsonb default '{}'::jsonb,      -- privacy prefs
  notif_prefs   jsonb default '{}'::jsonb,       -- notification prefs
  created_at    timestamptz default now()
);

create index if not exists idx_profiles_handle on public.profiles(handle);

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone" on public.profiles
  for select using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, handle, world_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'handle', '@user' || substr(new.id::text,1,6)),
    new.raw_user_meta_data->>'world_id'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------------------
-- 2) POSTS
-- -------------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null default '',
  image_url   text,
  video_url   text,
  world_id    text,
  created_at  timestamptz default now(),
  edited_at   timestamptz
);

create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_world on public.posts(world_id);
create index if not exists idx_posts_created on public.posts(created_at desc);

alter table public.posts enable row level security;

drop policy if exists "posts are viewable by everyone" on public.posts;
create policy "posts are viewable by everyone" on public.posts for select using (true);

drop policy if exists "users can insert their own posts" on public.posts;
create policy "users can insert their own posts" on public.posts
  for insert with check (auth.uid() = author_id);

drop policy if exists "users can update their own posts" on public.posts;
create policy "users can update their own posts" on public.posts
  for update using (auth.uid() = author_id);

drop policy if exists "users can delete their own posts" on public.posts;
create policy "users can delete their own posts" on public.posts
  for delete using (auth.uid() = author_id);

-- -------------------------------------------------------------------------
-- 3) FOLLOWERS
-- -------------------------------------------------------------------------
create table if not exists public.followers (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists idx_followers_following on public.followers(following_id);
create index if not exists idx_followers_follower on public.followers(follower_id);

alter table public.followers enable row level security;

drop policy if exists "followers are viewable by everyone" on public.followers;
create policy "followers are viewable by everyone" on public.followers for select using (true);

drop policy if exists "users can follow as themselves" on public.followers;
create policy "users can follow as themselves" on public.followers
  for insert with check (auth.uid() = follower_id);

drop policy if exists "users can unfollow as themselves" on public.followers;
create policy "users can unfollow as themselves" on public.followers
  for delete using (auth.uid() = follower_id);

-- -------------------------------------------------------------------------
-- 4) LIKES
-- -------------------------------------------------------------------------
create table if not exists public.likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_likes_post on public.likes(post_id);

alter table public.likes enable row level security;

drop policy if exists "likes are viewable by everyone" on public.likes;
create policy "likes are viewable by everyone" on public.likes for select using (true);

drop policy if exists "users can like as themselves" on public.likes;
create policy "users can like as themselves" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can unlike as themselves" on public.likes;
create policy "users can unlike as themselves" on public.likes
  for delete using (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 5) COMMENTS
-- -------------------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

create index if not exists idx_comments_post on public.comments(post_id);

alter table public.comments enable row level security;

drop policy if exists "comments are viewable by everyone" on public.comments;
create policy "comments are viewable by everyone" on public.comments for select using (true);

drop policy if exists "users can comment as themselves" on public.comments;
create policy "users can comment as themselves" on public.comments
  for insert with check (auth.uid() = author_id);

drop policy if exists "users can delete their own comments" on public.comments;
create policy "users can delete their own comments" on public.comments
  for delete using (auth.uid() = author_id);

-- -------------------------------------------------------------------------
-- 6) SAVED POSTS
-- -------------------------------------------------------------------------
create table if not exists public.saved_posts (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

alter table public.saved_posts enable row level security;

drop policy if exists "users manage their own saved posts" on public.saved_posts;
create policy "users manage their own saved posts" on public.saved_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 7) MESSAGES (direct messages — doubles as the "conversations" system:
--    a conversation is simply the set of messages between two users)
-- -------------------------------------------------------------------------
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  read_at       timestamptz,
  created_at    timestamptz default now()
);

create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_recipient on public.messages(recipient_id);
create index if not exists idx_messages_created on public.messages(created_at);

alter table public.messages enable row level security;

drop policy if exists "users see their own conversations" on public.messages;
create policy "users see their own conversations" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "users send messages as themselves" on public.messages;
create policy "users send messages as themselves" on public.messages
  for insert with check (auth.uid() = sender_id);

drop policy if exists "recipients can mark messages read" on public.messages;
create policy "recipients can mark messages read" on public.messages
  for update using (auth.uid() = recipient_id);

-- Enable Realtime for messages (run once):
-- alter publication supabase_realtime add table public.messages;

-- -------------------------------------------------------------------------
-- 8) NOTIFICATIONS
-- -------------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  actor_id      uuid references public.profiles(id) on delete cascade,
  type          text not null check (type in ('like','comment','follow','mention','share','system')),
  content       text,
  post_id       uuid references public.posts(id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz default now()
);

create index if not exists idx_notifications_recipient on public.notifications(recipient_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "users see their own notifications" on public.notifications;
create policy "users see their own notifications" on public.notifications
  for select using (auth.uid() = recipient_id);

drop policy if exists "users mark their own notifications read" on public.notifications;
create policy "users mark their own notifications read" on public.notifications
  for update using (auth.uid() = recipient_id);

-- Notifications are inserted by triggers below (as the "actor"), so no
-- direct insert policy for regular users is required.

-- Enable Realtime for notifications (run once):
-- alter publication supabase_realtime add table public.notifications;

-- ── Trigger: notify on new like ──
create or replace function public.notify_on_like()
returns trigger as $$
declare v_author uuid;
begin
  select author_id into v_author from public.posts where id = new.post_id;
  if v_author is not null and v_author <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id)
    values (v_author, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_on_like on public.likes;
create trigger trg_notify_on_like after insert on public.likes
  for each row execute function public.notify_on_like();

-- ── Trigger: notify on new comment ──
create or replace function public.notify_on_comment()
returns trigger as $$
declare v_author uuid;
begin
  select author_id into v_author from public.posts where id = new.post_id;
  if v_author is not null and v_author <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id)
    values (v_author, new.author_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_on_comment on public.comments;
create trigger trg_notify_on_comment after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ── Trigger: notify on new follower ──
create or replace function public.notify_on_follow()
returns trigger as $$
begin
  insert into public.notifications (recipient_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_on_follow on public.followers;
create trigger trg_notify_on_follow after insert on public.followers
  for each row execute function public.notify_on_follow();

-- -------------------------------------------------------------------------
-- 9) STORAGE BUCKETS (avatars, covers, post-media)
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('covers', 'covers', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('post-media', 'post-media', true)
  on conflict (id) do nothing;

-- Anyone can view (buckets are public); only the owner (folder = their uid) can write.
drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "users upload their own avatar" on storage.objects;
create policy "users upload their own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users update their own avatar" on storage.objects;
create policy "users update their own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "public read covers" on storage.objects;
create policy "public read covers" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "users upload their own cover" on storage.objects;
create policy "users upload their own cover" on storage.objects
  for insert with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users update their own cover" on storage.objects;
create policy "users update their own cover" on storage.objects
  for update using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "public read post-media" on storage.objects;
create policy "public read post-media" on storage.objects
  for select using (bucket_id = 'post-media');

drop policy if exists "users upload their own post media" on storage.objects;
create policy "users upload their own post media" on storage.objects
  for insert with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- -------------------------------------------------------------------------
-- 10) ACCOUNT DELETION (Edge Function required)
-- -------------------------------------------------------------------------
-- auth.users cannot be deleted from the browser (requires the service_role
-- key, which must never be exposed client-side). Create a Supabase Edge
-- Function named "delete-account" that:
--   1. Reads the caller's JWT to get their user id
--   2. Calls supabase.auth.admin.deleteUser(userId) with the service role
--   3. `profiles`, `posts`, etc. cascade-delete automatically (foreign keys
--      above use ON DELETE CASCADE)
-- The client-side call already exists: DB.deleteAccount() in supabase.js.
