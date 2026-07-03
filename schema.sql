-- =========================================================
-- WorldHub — schema.sql
-- شغّل هذا الملف كاملاً داخل Supabase → SQL Editor → New query → Run
-- يبني الجداول الأساسية: profiles, posts, likes, comments, followers
-- =========================================================

-- ---------------------------------------------------------
-- 1) profiles — ملف كل مستخدم (يرتبط تلقائياً بجدول auth.users)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  first_name   text not null default '',
  last_name    text not null default '',
  handle       text unique,
  avatar_url   text,
  cover_url    text,
  bio          text default '',
  world_id     text default 'programming',   -- العالم المفضّل عند التسجيل
  points       integer default 0,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "الملفات الشخصية مرئية للجميع"
  on public.profiles for select
  using (true);

create policy "يمكن للمستخدم تعديل ملفه فقط"
  on public.profiles for update
  using (auth.uid() = id);

-- إنشاء صف profile تلقائياً عند تسجيل مستخدم جديد
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, handle, world_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'handle', '@user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'world_id', 'programming')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- 2) posts — المنشورات
-- ---------------------------------------------------------
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles(id) on delete cascade,
  world_id     text not null default 'programming',
  content      text not null,
  image_url    text,
  video_url    text,
  created_at   timestamptz default now(),
  edited_at    timestamptz
);

alter table public.posts enable row level security;

create policy "المنشورات مرئية للجميع"
  on public.posts for select
  using (true);

create policy "يمكن لأي مستخدم مسجّل النشر"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "يمكن للمستخدم تعديل منشوره فقط"
  on public.posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "يمكن للمستخدم حذف منشوره فقط"
  on public.posts for delete
  using (auth.uid() = author_id);

-- ترقية لمن نفّذ نسخة سابقة من هذا الملف (لا يضيف شيئاً في تنصيب جديد):
alter table public.posts add column if not exists video_url text;
alter table public.posts add column if not exists edited_at timestamptz;

-- ---------------------------------------------------------
-- 3) likes — الإعجابات (مرتبطة بمنشور + مستخدم، بدون تكرار)
-- ---------------------------------------------------------
create table if not exists public.likes (
  post_id      uuid not null references public.posts(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "الإعجابات مرئية للجميع"
  on public.likes for select
  using (true);

create policy "يمكن للمستخدم إضافة إعجابه فقط"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "يمكن للمستخدم حذف إعجابه فقط"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 4) comments — التعليقات
-- ---------------------------------------------------------
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  content      text not null,
  created_at   timestamptz default now()
);

alter table public.comments enable row level security;

create policy "التعليقات مرئية للجميع"
  on public.comments for select
  using (true);

create policy "يمكن لأي مستخدم مسجّل التعليق"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "يمكن للمستخدم حذف تعليقه فقط"
  on public.comments for delete
  using (auth.uid() = author_id);

-- ---------------------------------------------------------
-- 5) followers — نظام المتابعة
-- ---------------------------------------------------------
create table if not exists public.followers (
  follower_id   uuid not null references public.profiles(id) on delete cascade,
  following_id  uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.followers enable row level security;

create policy "علاقات المتابعة مرئية للجميع"
  on public.followers for select
  using (true);

create policy "يمكن للمستخدم متابعة غيره فقط"
  on public.followers for insert
  with check (auth.uid() = follower_id);

create policy "يمكن للمستخدم إلغاء متابعته فقط"
  on public.followers for delete
  using (auth.uid() = follower_id);

-- ---------------------------------------------------------
-- 6) messages — الرسائل المباشرة بين مستخدمَين (نظام دردشة خاص)
-- ---------------------------------------------------------
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  created_at    timestamptz default now(),
  read_at       timestamptz,
  check (sender_id <> recipient_id)
);

alter table public.messages enable row level security;

create policy "يمكن لطرفي المحادثة فقط قراءة رسائلهما"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "يمكن للمستخدم إرسال رسالة من حسابه فقط"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "يمكن للمستلم فقط تعديل حالة القراءة"
  on public.messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create index if not exists idx_messages_sender    on public.messages (sender_id, created_at desc);
create index if not exists idx_messages_recipient on public.messages (recipient_id, created_at desc);

-- =========================================================
-- مهم جداً — لتفعيل الرسائل اللحظية (Realtime):
-- من لوحة Supabase → Database → Replication → فعّل جدول public.messages
-- أو نفّذ السطر التالي يدوياً في SQL Editor:
-- alter publication supabase_realtime add table public.messages;
-- =========================================================

-- ---------------------------------------------------------
-- 7) saved_posts — المنشورات المحفوظة لكل مستخدم
-- ---------------------------------------------------------
create table if not exists public.saved_posts (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  post_id      uuid not null references public.posts(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;

create policy "يرى كل مستخدم محفوظاته فقط"
  on public.saved_posts for select
  using (auth.uid() = user_id);

create policy "يمكن للمستخدم حفظ منشور لنفسه فقط"
  on public.saved_posts for insert
  with check (auth.uid() = user_id);

create policy "يمكن للمستخدم إلغاء حفظه فقط"
  on public.saved_posts for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 8) تخزين ملفات المنشورات (صور/فيديو) — Supabase Storage
-- ---------------------------------------------------------
-- ينشئ Bucket عام باسم post-media لرفع صور وفيديوهات المنشورات.
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

-- يجب أن يرفع كل مستخدم ملفاته داخل مجلد باسم uid الخاص به: <user_id>/filename.ext
create policy "الجميع يمكنه رؤية ملفات المنشورات"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "المستخدم يرفع ملفاته الخاصة فقط"
  on storage.objects for insert
  with check (bucket_id = 'post-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "المستخدم يحذف ملفاته الخاصة فقط"
  on storage.objects for delete
  using (bucket_id = 'post-media' and auth.uid()::text = (storage.foldername(name))[1]);


create index if not exists idx_posts_created_at   on public.posts (created_at desc);
create index if not exists idx_posts_world_id      on public.posts (world_id);
create index if not exists idx_comments_post_id    on public.comments (post_id);
create index if not exists idx_followers_following on public.followers (following_id);

-- =========================================================
-- ملاحظة: الجداول التالية مذكورة في مخطط WorldHub الكامل
-- كمرحلة لاحقة (notifications, worlds, world_members,
-- companies, jobs, events, reels, saved_posts). أضفها بنفس
-- الطريقة عندما تصبح الميزات المقابلة جاهزة للربط الحقيقي.
-- (تم بالفعل إضافة جدول messages أعلاه ✓)
-- =========================================================
