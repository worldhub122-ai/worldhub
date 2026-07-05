-- =========================================================================
-- WorldHub — schema_additions.sql
-- Run this AFTER schema.sql. Adds everything needed for pages that are
-- currently hardcoded mock data: Worlds, Jobs, Companies, Events,
-- Marketplace, and Dashboard stats. Safe to re-run.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 0) Widen the notifications.type check constraint
--    (new features below need a few more notification types)
-- -------------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('like','comment','follow','mention','share','system',
                   'job_application','event_rsvp','company_follow','listing_order'));

-- -------------------------------------------------------------------------
-- 1) WORLDS (communities) — referenced by app.js/supabase.js already,
--    but the table never existed. IDs match the ones already hardcoded
--    in MOCK.worlds so posts.world_id keeps working unchanged.
-- -------------------------------------------------------------------------
create table if not exists public.worlds (
  id            text primary key,
  name          text not null,
  icon          text default '🌍',
  color         text default 'accent',
  description   text default '',
  is_public     boolean not null default true,
  member_count  integer not null default 0,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz default now()
);

create table if not exists public.world_members (
  world_id   text not null references public.worlds(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('member','admin','owner')),
  joined_at  timestamptz default now(),
  primary key (world_id, user_id)
);

create index if not exists idx_world_members_user on public.world_members(user_id);

alter table public.worlds enable row level security;
alter table public.world_members enable row level security;

drop policy if exists "worlds are viewable by everyone" on public.worlds;
create policy "worlds are viewable by everyone" on public.worlds for select using (true);

drop policy if exists "users can create worlds" on public.worlds;
create policy "users can create worlds" on public.worlds
  for insert with check (auth.uid() = created_by);

drop policy if exists "owners/admins can update their world" on public.worlds;
create policy "owners/admins can update their world" on public.worlds
  for update using (exists (
    select 1 from public.world_members wm
    where wm.world_id = worlds.id and wm.user_id = auth.uid() and wm.role in ('owner','admin')
  ));

drop policy if exists "world members are viewable by everyone" on public.world_members;
create policy "world members are viewable by everyone" on public.world_members for select using (true);

drop policy if exists "users can join a world" on public.world_members;
create policy "users can join a world" on public.world_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "users can leave a world" on public.world_members;
create policy "users can leave a world" on public.world_members
  for delete using (auth.uid() = user_id);

-- keep member_count in sync
create or replace function public.sync_world_member_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.worlds set member_count = member_count + 1 where id = new.world_id;
  elsif (tg_op = 'DELETE') then
    update public.worlds set member_count = greatest(member_count - 1, 0) where id = old.world_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_world_member_count on public.world_members;
create trigger trg_world_member_count
  after insert or delete on public.world_members
  for each row execute function public.sync_world_member_count();

-- Now that worlds exists, tie posts/jobs/events to it for real referential integrity.
-- NOTE: run only after seeding the 8 rows below, or existing world_id values
-- on posts that don't match will need backfilling first.
alter table public.posts drop constraint if exists fk_posts_world;
alter table public.posts add constraint fk_posts_world
  foreign key (world_id) references public.worlds(id) on delete set null;

-- Seed the 8 worlds already hardcoded in app.js MOCK.worlds, so switching
-- world.html over from MOCK to a real DB.listWorlds() call is a no-op.
insert into public.worlds (id, name, icon, color, member_count) values
  ('programming',  'Programmation',   '💻', 'green',  12300),
  ('ai',            'IA & ML',        '🤖', 'blue',   8700),
  ('design',        'Design',         '🎨', 'pink',   11200),
  ('entrepreneur',  'Entrepreneuriat','💼', 'yellow', 6400),
  ('finance',       'Finance',        '📈', 'green',  5400),
  ('healthcare',    'Santé',          '🩺', 'pink',   4700),
  ('education',     'Éducation',      '🎓', 'blue',   3600),
  ('gaming',        'Gaming',         '🎮', 'yellow', 9100)
on conflict (id) do nothing;

-- -------------------------------------------------------------------------
-- 2) COMPANIES + JOBS
-- -------------------------------------------------------------------------
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  slug          text unique,
  sector        text,
  logo_url      text,
  cover_url     text,
  description   text default '',
  website       text,
  created_at    timestamptz default now()
);

create table if not exists public.company_followers (
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (company_id, user_id)
);

create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  posted_by    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text default '',
  location     text,
  job_type     text not null default 'CDI' check (job_type in ('CDI','CDD','Freelance','Stage','Alternance')),
  world_id     text references public.worlds(id) on delete set null,
  is_remote    boolean not null default false,
  status       text not null default 'open' check (status in ('open','closed')),
  created_at   timestamptz default now()
);

create table if not exists public.job_applications (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  cover_note   text,
  status       text not null default 'submitted' check (status in ('submitted','viewed','rejected','accepted')),
  created_at   timestamptz default now(),
  unique (job_id, applicant_id)
);

create index if not exists idx_companies_owner on public.companies(owner_id);
create index if not exists idx_company_followers_company on public.company_followers(company_id);
create index if not exists idx_jobs_company on public.jobs(company_id);
create index if not exists idx_jobs_world on public.jobs(world_id);
create index if not exists idx_jobs_created on public.jobs(created_at desc);
create index if not exists idx_job_applications_job on public.job_applications(job_id);
create index if not exists idx_job_applications_applicant on public.job_applications(applicant_id);

alter table public.companies enable row level security;
alter table public.company_followers enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "companies are viewable by everyone" on public.companies;
create policy "companies are viewable by everyone" on public.companies for select using (true);
drop policy if exists "users can create their own company" on public.companies;
create policy "users can create their own company" on public.companies
  for insert with check (auth.uid() = owner_id);
drop policy if exists "owners manage their company" on public.companies;
create policy "owners manage their company" on public.companies
  for update using (auth.uid() = owner_id);
drop policy if exists "owners delete their company" on public.companies;
create policy "owners delete their company" on public.companies
  for delete using (auth.uid() = owner_id);

drop policy if exists "company followers viewable by everyone" on public.company_followers;
create policy "company followers viewable by everyone" on public.company_followers for select using (true);
drop policy if exists "users follow companies as themselves" on public.company_followers;
create policy "users follow companies as themselves" on public.company_followers
  for insert with check (auth.uid() = user_id);
drop policy if exists "users unfollow companies as themselves" on public.company_followers;
create policy "users unfollow companies as themselves" on public.company_followers
  for delete using (auth.uid() = user_id);

drop policy if exists "open jobs are viewable by everyone" on public.jobs;
create policy "open jobs are viewable by everyone" on public.jobs for select using (true);
drop policy if exists "company owners post jobs" on public.jobs;
create policy "company owners post jobs" on public.jobs
  for insert with check (
    auth.uid() = posted_by
    and exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
  );
drop policy if exists "company owners manage their jobs" on public.jobs;
create policy "company owners manage their jobs" on public.jobs
  for update using (exists (select 1 from public.companies c where c.id = jobs.company_id and c.owner_id = auth.uid()));
drop policy if exists "company owners delete their jobs" on public.jobs;
create policy "company owners delete their jobs" on public.jobs
  for delete using (exists (select 1 from public.companies c where c.id = jobs.company_id and c.owner_id = auth.uid()));

drop policy if exists "applicants and company owners see applications" on public.job_applications;
create policy "applicants and company owners see applications" on public.job_applications
  for select using (
    auth.uid() = applicant_id
    or exists (
      select 1 from public.jobs j join public.companies c on c.id = j.company_id
      where j.id = job_applications.job_id and c.owner_id = auth.uid()
    )
  );
drop policy if exists "users apply as themselves" on public.job_applications;
create policy "users apply as themselves" on public.job_applications
  for insert with check (auth.uid() = applicant_id);
drop policy if exists "company owners update application status" on public.job_applications;
create policy "company owners update application status" on public.job_applications
  for update using (exists (
    select 1 from public.jobs j join public.companies c on c.id = j.company_id
    where j.id = job_applications.job_id and c.owner_id = auth.uid()
  ));

-- notify the company owner on a new application
create or replace function public.notify_on_job_application()
returns trigger as $$
declare v_owner uuid;
begin
  select c.owner_id into v_owner from public.jobs j join public.companies c on c.id = j.company_id where j.id = new.job_id;
  if v_owner is not null and v_owner <> new.applicant_id then
    insert into public.notifications (recipient_id, actor_id, type, content)
    values (v_owner, new.applicant_id, 'job_application', 'a postulé à votre offre d''emploi');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_on_job_application on public.job_applications;
create trigger trg_notify_on_job_application after insert on public.job_applications
  for each row execute function public.notify_on_job_application();

-- notify the company owner on a new follower
create or replace function public.notify_on_company_follow()
returns trigger as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.companies where id = new.company_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, content)
    values (v_owner, new.user_id, 'company_follow', 'suit désormais votre entreprise');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_on_company_follow on public.company_followers;
create trigger trg_notify_on_company_follow after insert on public.company_followers
  for each row execute function public.notify_on_company_follow();

-- -------------------------------------------------------------------------
-- 3) EVENTS
-- -------------------------------------------------------------------------
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null references public.profiles(id) on delete cascade,
  world_id      text references public.worlds(id) on delete set null,
  title         text not null,
  description   text default '',
  location      text,
  is_online     boolean not null default false,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  cover_url     text,
  created_at    timestamptz default now()
);

create table if not exists public.event_attendees (
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'going' check (status in ('going','interested','declined')),
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

create index if not exists idx_events_starts_at on public.events(starts_at);
create index if not exists idx_events_world on public.events(world_id);
create index if not exists idx_event_attendees_event on public.event_attendees(event_id);

alter table public.events enable row level security;
alter table public.event_attendees enable row level security;

drop policy if exists "events are viewable by everyone" on public.events;
create policy "events are viewable by everyone" on public.events for select using (true);
drop policy if exists "users create events as themselves" on public.events;
create policy "users create events as themselves" on public.events
  for insert with check (auth.uid() = host_id);
drop policy if exists "hosts manage their events" on public.events;
create policy "hosts manage their events" on public.events
  for update using (auth.uid() = host_id);
drop policy if exists "hosts delete their events" on public.events;
create policy "hosts delete their events" on public.events
  for delete using (auth.uid() = host_id);

drop policy if exists "attendance is viewable by everyone" on public.event_attendees;
create policy "attendance is viewable by everyone" on public.event_attendees for select using (true);
drop policy if exists "users rsvp as themselves" on public.event_attendees;
create policy "users rsvp as themselves" on public.event_attendees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.notify_on_event_rsvp()
returns trigger as $$
declare v_host uuid;
begin
  select host_id into v_host from public.events where id = new.event_id;
  if v_host is not null and v_host <> new.user_id and new.status = 'going' then
    insert into public.notifications (recipient_id, actor_id, type, content)
    values (v_host, new.user_id, 'event_rsvp', 'participe à votre événement');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_on_event_rsvp on public.event_attendees;
create trigger trg_notify_on_event_rsvp after insert on public.event_attendees
  for each row execute function public.notify_on_event_rsvp();

-- -------------------------------------------------------------------------
-- 4) MARKETPLACE
--    Note: these tables track listings/orders/reviews only. Actual payment
--    capture (Stripe or similar) must happen in a Supabase Edge Function —
--    never handle card details or charge amounts directly from the browser.
-- -------------------------------------------------------------------------
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text default '',
  category      text,
  price_cents   integer not null check (price_cents >= 0),
  currency      text not null default 'EUR',
  cover_url     text,
  status        text not null default 'active' check (status in ('active','paused','sold')),
  created_at    timestamptz default now()
);

create table if not exists public.listing_orders (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  buyer_id     uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','paid','completed','cancelled')),
  created_at   timestamptz default now()
);

create table if not exists public.listing_reviews (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  reviewer_id  uuid not null references public.profiles(id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz default now(),
  unique (listing_id, reviewer_id)
);

create index if not exists idx_listings_seller on public.listings(seller_id);
create index if not exists idx_listings_category on public.listings(category);
create index if not exists idx_listing_orders_listing on public.listing_orders(listing_id);
create index if not exists idx_listing_orders_buyer on public.listing_orders(buyer_id);
create index if not exists idx_listing_reviews_listing on public.listing_reviews(listing_id);

alter table public.listings enable row level security;
alter table public.listing_orders enable row level security;
alter table public.listing_reviews enable row level security;

drop policy if exists "listings are viewable by everyone" on public.listings;
create policy "listings are viewable by everyone" on public.listings for select using (true);
drop policy if exists "sellers manage their listings" on public.listings;
create policy "sellers manage their listings" on public.listings
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "buyers and sellers see their orders" on public.listing_orders;
create policy "buyers and sellers see their orders" on public.listing_orders
  for select using (
    auth.uid() = buyer_id
    or exists (select 1 from public.listings l where l.id = listing_orders.listing_id and l.seller_id = auth.uid())
  );
drop policy if exists "buyers place orders as themselves" on public.listing_orders;
create policy "buyers place orders as themselves" on public.listing_orders
  for insert with check (auth.uid() = buyer_id);
drop policy if exists "sellers update order status" on public.listing_orders;
create policy "sellers update order status" on public.listing_orders
  for update using (exists (select 1 from public.listings l where l.id = listing_orders.listing_id and l.seller_id = auth.uid()));

drop policy if exists "reviews are viewable by everyone" on public.listing_reviews;
create policy "reviews are viewable by everyone" on public.listing_reviews for select using (true);
drop policy if exists "buyers review as themselves" on public.listing_reviews;
create policy "buyers review as themselves" on public.listing_reviews
  for insert with check (auth.uid() = reviewer_id);

create or replace function public.notify_on_listing_order()
returns trigger as $$
declare v_seller uuid;
begin
  select seller_id into v_seller from public.listings where id = new.listing_id;
  if v_seller is not null and v_seller <> new.buyer_id then
    insert into public.notifications (recipient_id, actor_id, type, content)
    values (v_seller, new.buyer_id, 'listing_order', 'a commandé votre service');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_on_listing_order on public.listing_orders;
create trigger trg_notify_on_listing_order after insert on public.listing_orders
  for each row execute function public.notify_on_listing_order();

-- -------------------------------------------------------------------------
-- 5) DASHBOARD — real stats need post view-tracking; likes/comments/
--    followers already exist and can be aggregated directly.
-- -------------------------------------------------------------------------
create table if not exists public.post_views (
  id         bigint generated always as identity primary key,
  post_id    uuid not null references public.posts(id) on delete cascade,
  viewer_id  uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_post_views_post on public.post_views(post_id);
create index if not exists idx_post_views_created on public.post_views(created_at);

alter table public.post_views enable row level security;

drop policy if exists "anyone logs a post view" on public.post_views;
create policy "anyone logs a post view" on public.post_views for insert with check (true);
drop policy if exists "authors see their own post view stats" on public.post_views;
create policy "authors see their own post view stats" on public.post_views
  for select using (exists (select 1 from public.posts p where p.id = post_views.post_id and p.author_id = auth.uid()));

-- One function the dashboard page can call directly:
-- select * from get_dashboard_summary();  (uses auth.uid() internally)
create or replace function public.get_dashboard_summary()
returns table (
  post_count bigint,
  follower_count bigint,
  interaction_count bigint,
  view_count bigint
) as $$
  select
    (select count(*) from public.posts p where p.author_id = auth.uid()),
    (select count(*) from public.followers f where f.following_id = auth.uid()),
    (select count(*) from public.likes l join public.posts p on p.id = l.post_id where p.author_id = auth.uid())
      + (select count(*) from public.comments c join public.posts p on p.id = c.post_id where p.author_id = auth.uid()),
    (select count(*) from public.post_views v join public.posts p on p.id = v.post_id where p.author_id = auth.uid());
$$ language sql security definer stable;

-- Daily interaction counts for the dashboard bar chart (last N days)
create or replace function public.get_daily_interactions(p_days int default 30)
returns table (day date, interactions bigint) as $$
  select d::date as day, count(*) as interactions
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
  left join (
    select created_at from public.likes l join public.posts p on p.id = l.post_id where p.author_id = auth.uid()
    union all
    select created_at from public.comments c join public.posts p on p.id = c.post_id where p.author_id = auth.uid()
  ) x on x.created_at::date = d::date
  group by d
  order by d;
$$ language sql security definer stable;

-- -------------------------------------------------------------------------
-- 6) STORAGE — logos, covers for the new entity types
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('company-media', 'company-media', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('event-media', 'event-media', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('listing-media', 'listing-media', true) on conflict (id) do nothing;

drop policy if exists "public read company-media" on storage.objects;
create policy "public read company-media" on storage.objects for select using (bucket_id = 'company-media');
drop policy if exists "owners upload company-media" on storage.objects;
create policy "owners upload company-media" on storage.objects
  for insert with check (bucket_id = 'company-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "public read event-media" on storage.objects;
create policy "public read event-media" on storage.objects for select using (bucket_id = 'event-media');
drop policy if exists "hosts upload event-media" on storage.objects;
create policy "hosts upload event-media" on storage.objects
  for insert with check (bucket_id = 'event-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "public read listing-media" on storage.objects;
create policy "public read listing-media" on storage.objects for select using (bucket_id = 'listing-media');
drop policy if exists "sellers upload listing-media" on storage.objects;
create policy "sellers upload listing-media" on storage.objects
  for insert with check (bucket_id = 'listing-media' and (storage.foldername(name))[1] = auth.uid()::text);
