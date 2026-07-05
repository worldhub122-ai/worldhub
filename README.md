# WorldHub — ما تم إصلاحه وتطويره

هذا التقرير يلخّص ما تم تنفيذه استناداً إلى تقرير التدقيق (Audit Report) الذي رفعته، بالإضافة إلى ما تبقّى كخارطة طريق (Roadmap) صادقة — لم أدّعِ إنجاز أشياء لم أنفّذها فعلاً.

## ✅ تم إصلاحه (Critical Issues من التقرير)

1. **بنية الملفات (Issue 1)** — كانت كل الصفحات تشير إلى `assets/css/main.css` و `assets/js/*.js` بينما الملفات المرفوعة كانت في المجلد الجذري بلا هذا الهيكل. تم إعادة تنظيم المشروع بالكامل:
   ```
   worldhub/
   ├── index.html, login.html, profile.html, ... (كل الصفحات)
   ├── account-settings.html        ← صفحة جديدة
   ├── assets/
   │   ├── css/main.css
   │   └── js/app.js, supabase.js, auth-guard.js
   └── supabase/schema.sql          ← جديد
   ```
   الآن لا يوجد أي 404 على CSS/JS.

2. **بيانات Mock بدل بيانات حقيقية (Issue 2)**
   - **الإشعارات**: كانت 100% Mock. الآن `notifications.html` يستدعي `api.getNotifications()` الذي يقرأ من جدول `notifications` الحقيقي، مع تعليم "مقروء" (فردي أو جماعي) محفوظ في القاعدة.
   - **لوحة التحكم (Dashboard)**: الأرقام كانت ثابتة (24 منشور، 12.4k متابع...). الآن `api.getDashboardStats()` يحسبها فعلياً من `posts`, `followers`, `likes`, `comments`.
   - **الإعجابات (Likes)**: الزر كان يغيّر الواجهة فقط دون حفظ أي شيء. الآن يستدعي `api.toggleLike(postId)` ويحفظ في جدول `likes`، مع تراجع تلقائي إن فشل الطلب.
   - **الملف الشخصي**: كان جزئياً مربوطاً (`getCurrentProfile`) — أُضيف رفع صورة البروفايل وصورة الغلاف الحقيقي (Supabase Storage).

3. **`api.createPost` (Issue 3)** — كان موجوداً ويعمل مسبقاً، تم التحقق من ربطه بـ `DB.createPost` والتعامل مع الأخطاء عبر `showError`.

4. **قاعدة بيانات Supabase وسياسات RLS (Issue 4)** — ملف جديد **`supabase/schema.sql`** يحتوي:
   - كل الجداول المطلوبة: `profiles`, `posts`, `followers`, `likes`, `comments`, `saved_posts`, `messages`, و **`notifications` (جدول جديد لم يكن موجوداً)**.
   - سياسات RLS كاملة لكل جدول (من يقرأ / يكتب / يعدّل / يحذف).
   - Indexes على المفاتيح الخارجية والحقول الأكثر استعلاماً.
   - Triggers تلقائية: إشعار عند إعجاب، تعليق، أو متابعة جديدة.
   - Storage buckets (`avatars`, `covers`, `post-media`) مع سياسات صلاحيات.
   - **شغّل هذا الملف في Supabase → SQL Editor مرة واحدة** على مشروعك.

## 🆕 ميزات جديدة أُضيفت (من قسم "Missing Features")

- **صفحة `account-settings.html`**: تغيير البريد الإلكتروني، تغيير كلمة المرور، تفضيلات الخصوصية، تفضيلات الإشعارات، تعديل معلومات البروفايل، وحذف الحساب (Danger Zone).
- **رفع صورة البروفايل وصورة الغلاف** من صفحة `profile.html` مباشرة إلى Supabase Storage.
- رابط "⚙️ Paramètres du compte" في القائمة الجانبية.

## ⚠️ ملاحظة مهمة: حذف الحساب

المتصفح لا يمكنه حذف مستخدم من `auth.users` مباشرة (يتطلب `service_role key` الذي يُمنع كشفه في الواجهة الأمامية لأسباب أمنية). الكود الأمامي (`DB.deleteAccount()`) جاهز ويستدعي Edge Function باسم `delete-account` — **يجب عليك إنشاء هذه الـ Edge Function بنفسك** في Supabase (الكود التوضيحي موجود كتعليق في `schema.sql`، القسم 10).

## 🗺️ خارطة طريق — لم يتم تنفيذها في هذه الجولة

هذه بنود ذكرها التقرير ولم أنفّذها لأنها تتطلب عملاً كبيراً منفصلاً (بنية تحتية، تصميم، أو محتوى قانوني حقيقي لا يجوز اختراعه):

| البند | لماذا لم يُنفَّذ الآن |
|---|---|
| الرسائل الفورية (Realtime) | الدوال جاهزة في `supabase.js` (`subscribeToIncomingMessages`, `subscribeToNotifications`) لكن غير مفعّلة في الصفحات — تحتاج تفعيل Realtime على الجدول من لوحة Supabase أولاً (سطر تعليق في schema.sql) |
| صفحات قانونية (Privacy Policy, ToS, Contact...) | تحتاج محتوى قانوني حقيقي من محامٍ أو فريقك، لا يمكن توليده تلقائياً بشكل مسؤول |
| الإشراف والتقارير (Reporting, Blocking, Admin Dashboard) | ميزة كبيرة مستقلة (جدول `reports`, `blocks`, صفحة أدمن كاملة) — يمكن بناؤها في جولة قادمة |
| تعدد اللغات (AR/EN/FR) | يتطلب استراتيجية ترجمة وملفات i18n لكل نص في كل صفحة — عمل واسع |
| SEO (Meta tags, sitemap, robots.txt) | سهل التنفيذ لاحقاً لكنه يحتاج معرفة اسم الدومين النهائي |
| صفحات World الديناميكية | `world.html` حالياً صفحة واحدة لكل "العوالم" — تحويلها لتكون حسب `?id=` من URL وربطها بجدول `worlds` حقيقي |
| PWA / تطبيق موبايل | خارج نطاق تعديل الملفات الحالية |

## كيف تشغّل المشروع الآن

1. افتح مشروعك في Supabase → SQL Editor → نفّذ محتوى `supabase/schema.sql`.
2. تأكد أن `assets/js/supabase.js` يحتوي `SUPABASE_URL` و `SUPABASE_ANON_KEY` الصحيحين (موجودان حالياً).
3. فعّل مزوّد Google في Authentication → Providers إذا تريد تسجيل الدخول بجوجل.
4. ارفع كل مجلد `worldhub/` كما هو (بما فيه `assets/`) إلى الاستضافة أو GitHub Pages/Vercel/Netlify.
