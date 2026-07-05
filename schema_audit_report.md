# WorldHub — Schema & Frontend Audit

## 1. Bug found: notifications never actually work

`schema.sql` defines `notifications.read_at` (`timestamptz`, `null` = unread) — the same
pattern used by `messages.read_at`. But `supabase.js` and `app.js` were written against
an `is_read` boolean that **doesn't exist in the table**. Every notifications query
(`listNotifications`, `markNotificationRead`, `markAllNotificationsRead`,
`getUnreadNotificationCount`) throws a Postgres "column does not exist" error and
silently falls back to `MOCK.notifications`.

**Fixed** in the attached `supabase.js` / `app.js`: all four functions now read/write
`read_at` instead of `is_read`. No SQL migration needed — the schema was already correct.

## 2. Pages already fully supported by `schema.sql`

| Page | Tables used | Status |
|---|---|---|
| index.html (feed) | `posts`, `likes`, `comments`, `profiles` | ✅ matches `DB.listPosts()` field-for-field |
| create-post.html | `posts`, storage bucket `post-media` | ✅ matches `DB.createPost()` / `uploadPostMedia()` |
| profile.html | `profiles`, `followers` | ✅ matches |
| messages.html | `messages` (`sender_id`/`recipient_id`/`read_at`) | ✅ matches exactly |
| notifications.html | `notifications` | ✅ now fixed (see §1) |

## 3. Pages with no backing tables at all (until this update)

`world.html`, `jobs.html`, `companies.html`, `events.html`, `marketplace.html`, and
`dashboard.html` render entirely from `MOCK.*` in `app.js`. None of their buttons
("Rejoindre", "Postuler", "Suivre", "Participer", "Commander", "+ Créer …") have
click handlers — they're static mockups, not wired to Supabase or even to mock state.

`schema_additions.sql` adds the missing tables:

- **Worlds**: `worlds` + `world_members` (membership, roles, auto-updated
  `member_count` via trigger). Seeded with the same 8 world IDs already hardcoded in
  `MOCK.worlds`, so switching `world.html` over is a drop-in swap. Also retroactively
  adds a foreign key from `posts.world_id → worlds.id` (previously a bare, unconstrained
  `text` column).
- **Companies & Jobs**: `companies`, `company_followers`, `jobs`, `job_applications`.
- **Events**: `events`, `event_attendees` (RSVP status: going/interested/declined).
- **Marketplace**: `listings`, `listing_orders`, `listing_reviews`. Order rows only
  record buyer intent — **actual payment capture needs a Supabase Edge Function
  calling a payment provider** (Stripe, etc.); never process card data or final
  charge amounts client-side.
- **Dashboard**: a `post_views` table plus two SQL functions —
  `get_dashboard_summary()` (totals) and `get_daily_interactions(days)` (chart data) —
  both scoped to `auth.uid()` internally via `security definer`.

All new tables have RLS enabled, indexes on foreign keys/sort columns, and
notification triggers (job applications, company follows, event RSVPs, listing
orders) using three new `notifications.type` values — which required loosening the
existing `check` constraint (also done in `schema_additions.sql`, §0).

Three new public storage buckets were added: `company-media`, `event-media`,
`listing-media`, each with the same "public read, owner-folder write" policy shape
already used for `avatars`/`covers`/`post-media`.

## 4. Frontend data-access layer: extended, not rewritten

To keep the "pages call `api.*`, `api.*` calls `DB.*` or falls back to `MOCK.*`"
pattern intact, both files got matching additions:

- `supabase.js` — new `DB.*` functions: `joinWorld`/`leaveWorld`/`isWorldMember`,
  `listCompanies`/`createCompany`/`toggleFollowCompany`,
  `listJobs`/`createJob`/`applyToJob`, `listEvents`/`createEvent`/`rsvpEvent`,
  `listListings`/`createListing`/`orderListing`, `getDashboardSummary`/`getDailyInteractions`.
- `app.js` — new `api.*` wrappers: `getCompanies`/`followCompany`, `getJobs`/`applyToJob`,
  `getEvents`/`rsvpEvent`, `getListings`/`orderListing`, `joinWorld`, `getDashboardStats`.
  Each follows the existing try-DB-then-fall-back-to-`MOCK`-array convention.

## 5. What's *not* included — deliberately out of scope here

The HTML pages themselves (`jobs.html`, `companies.html`, `events.html`,
`marketplace.html`, `dashboard.html`, `world.html`) still render `MOCK.*` directly
and their buttons still have no `onclick` handlers. The schema and `api.*` layer are
now ready for them, but wiring each page's markup to call
`api.getJobs()`/`api.applyToJob()`/etc. (mirroring how `index.html` and
`create-post.html` already do this) is a separate, page-by-page frontend task —
happy to do that next if useful.

## 6. Run order

1. `schema.sql` (if not already applied)
2. `schema_additions.sql`
3. Replace `assets/js/supabase.js` and `assets/js/app.js` with the updated versions
