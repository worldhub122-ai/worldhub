/* =========================================================
   WorldHub — supabase.js
   طبقة الاتصال بقاعدة بيانات Supabase (مصادقة + بيانات)
   ========================================================= */

// -----------------------------------------------------------------
// 1) ضع بيانات مشروعك هنا (Supabase → Project Settings → API)
// -----------------------------------------------------------------
const SUPABASE_URL = 'https://fqlpadpxucybqsgwnmmr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bRiIZMzAdJJofUpYNff7Iw_6OozTuyx';

// -----------------------------------------------------------------
// 2) تهيئة العميل — إن لم تُضبط البيانات أعلاه يبقى الموقع
//    يعمل بوضع تجريبي محلي (DB.isConnected = false)
// -----------------------------------------------------------------
const sbClient = (SUPABASE_URL.startsWith('YOUR_') || SUPABASE_ANON_KEY.startsWith('YOUR_'))
  ? null
  : window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DB = (() => {

  const isConnected = !!sbClient;

  function assertConnected(){
    if(!isConnected) throw new Error('Supabase n\'est pas connecté. Renseignez SUPABASE_URL et SUPABASE_ANON_KEY dans supabase.js.');
  }

  // ---------------- Auth ----------------
  async function signUp({ email, password, firstName, lastName, worldId }){
    assertConnected();
    const handle = '@' + (firstName || 'user').toLowerCase().replace(/\s+/g,'') + Math.floor(Math.random()*1000);
    const { data, error } = await sbClient.auth.signUp({
      email, password,
      options: { data: { first_name:firstName, last_name:lastName, handle, world_id: worldId } }
    });
    if(error) throw error;
    return data;
  }

  async function signIn({ email, password }){
    assertConnected();
    const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
    if(error) throw error;
    return data;
  }

  async function signOut(){
    assertConnected();
    const { error } = await sbClient.auth.signOut();
    if(error) throw error;
  }

  // provider: 'google' | 'apple' | 'github' ...
  // يجب تفعيل المزوّد المطلوب مسبقاً من Supabase → Authentication → Providers،
  // وإضافة Redirect URL الصحيح لموقعك هناك (وفي إعدادات Google Cloud OAuth Client).
  async function signInWithOAuth(provider){
    assertConnected();
    const { data, error } = await sbClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + window.location.pathname.replace(/login\.html$/, 'index.html') }
    });
    if(error) throw error;
    return data; // يُعيد المتصفح توجيهه تلقائياً لصفحة تسجيل دخول Google
  }

  async function getSession(){
    if(!isConnected) return null;
    const { data } = await sbClient.auth.getSession();
    return data.session;
  }

  async function getCurrentUser(){
    if(!isConnected) return null;
    const { data } = await sbClient.auth.getUser();
    return data.user;
  }

  // ---------------- Profiles ----------------
  async function getProfile(userId){
    assertConnected();
    const { data, error } = await sbClient.from('profiles').select('*').eq('id', userId).single();
    if(error) throw error;
    return data;
  }

  async function updateProfile(userId, patch){
    assertConnected();
    const { data, error } = await sbClient.from('profiles').update(patch).eq('id', userId).select().single();
    if(error) throw error;
    return data;
  }

  async function getFollowCounts(userId){
    assertConnected();
    const [{ count: followers }, { count: following }] = await Promise.all([
      sbClient.from('followers').select('*', { count:'exact', head:true }).eq('following_id', userId),
      sbClient.from('followers').select('*', { count:'exact', head:true }).eq('follower_id', userId),
    ]);
    return { followers: followers||0, following: following||0 };
  }

  // ---------------- Posts ----------------
  // يرجع منشورات مع اسم الكاتب، عدد الإعجابات، وهل المستخدم الحالي أعجب بها
  async function listPosts({ worldId=null, authorId=null, limit=30 } = {}){
    assertConnected();
    let q = sbClient
      .from('posts')
      .select('id, content, image_url, video_url, world_id, created_at, edited_at, author:profiles(id, first_name, last_name, handle, avatar_url), likes(user_id), comments(id, content, created_at, author:profiles(id, first_name, last_name, handle, avatar_url))')
      .order('created_at', { ascending:false })
      .limit(limit);
    if(worldId) q = q.eq('world_id', worldId);
    if(authorId) q = q.eq('author_id', authorId);
    const { data, error } = await q;
    if(error) throw error;
    return data;
  }

  async function createPost({ content, worldId, imageUrl=null, videoUrl=null }){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour publier.');
    const { data, error } = await sbClient.from('posts')
      .insert({ author_id:user.id, content, world_id:worldId, image_url:imageUrl, video_url:videoUrl })
      .select().single();
    if(error) throw error;
    return data;
  }

  async function updatePost(postId, { content, imageUrl, videoUrl } = {}){
    assertConnected();
    const patch = { edited_at: new Date().toISOString() };
    if(content !== undefined) patch.content = content;
    if(imageUrl !== undefined) patch.image_url = imageUrl;
    if(videoUrl !== undefined) patch.video_url = videoUrl;
    const { data, error } = await sbClient.from('posts').update(patch).eq('id', postId).select().single();
    if(error) throw error;
    return data;
  }

  async function deletePost(postId){
    assertConnected();
    const { error } = await sbClient.from('posts').delete().eq('id', postId);
    if(error) throw error;
  }

  // يرفع ملفاً (صورة أو فيديو) لمنشور إلى Storage ويرجع رابطه العام
  async function uploadPostMedia(file){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour envoyer un fichier.');
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error: upErr } = await sbClient.storage.from('post-media').upload(path, file, {
      cacheControl: '3600', upsert: false,
    });
    if(upErr) throw upErr;
    const { data } = sbClient.storage.from('post-media').getPublicUrl(path);
    return data.publicUrl;
  }

  // يرفع صورة البروفايل إلى bucket "avatars"، يحدّث profiles.avatar_url،
  // ويرجع الرابط العام الجديد. يحذف الصورة القديمة (إن وُجدت) بعد نجاح
  // الرفع حتى لا تتراكم ملفات يتيمة في الـ bucket.
  async function uploadAvatar(file){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour changer votre photo de profil.');
    const oldProfile = await getProfile(user.id).catch(()=>null);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error: upErr } = await sbClient.storage.from('avatars').upload(path, file, {
      cacheControl: '3600', upsert: false,
    });
    if(upErr) throw upErr;
    const { data: pub } = sbClient.storage.from('avatars').getPublicUrl(path);
    const publicUrl = pub.publicUrl;
    const { error: updErr } = await sbClient.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    if(updErr) throw updErr;
    if(oldProfile?.avatar_url){
      const oldPath = _storagePathFromPublicUrl(oldProfile.avatar_url, 'avatars');
      if(oldPath) sbClient.storage.from('avatars').remove([oldPath]).catch(()=>{});
    }
    return publicUrl;
  }

  // نفس المنطق لصورة الغلاف، على bucket "covers" وعمود profiles.cover_url.
  async function uploadCover(file){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour changer votre photo de couverture.');
    const oldProfile = await getProfile(user.id).catch(()=>null);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error: upErr } = await sbClient.storage.from('covers').upload(path, file, {
      cacheControl: '3600', upsert: false,
    });
    if(upErr) throw upErr;
    const { data: pub } = sbClient.storage.from('covers').getPublicUrl(path);
    const publicUrl = pub.publicUrl;
    const { error: updErr } = await sbClient.from('profiles').update({ cover_url: publicUrl }).eq('id', user.id);
    if(updErr) throw updErr;
    if(oldProfile?.cover_url){
      const oldPath = _storagePathFromPublicUrl(oldProfile.cover_url, 'covers');
      if(oldPath) sbClient.storage.from('covers').remove([oldPath]).catch(()=>{});
    }
    return publicUrl;
  }

  // يستخرج "userId/filename.ext" من رابط عام لملف مخزّن، لحذفه لاحقاً.
  // يرجع null إن لم يكن الرابط من نفس الـ bucket (تجنّباً لحذف شيء خاطئ).
  function _storagePathFromPublicUrl(url, bucket){
    if(!url) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if(idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length));
  }

  // ---------------- Saved posts (المحفوظات) ----------------
  async function toggleSavePost(postId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour enregistrer.');
    const { data: existing } = await sbClient.from('saved_posts').select('*').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
    if(existing){
      await sbClient.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
      return false;
    }else{
      await sbClient.from('saved_posts').insert({ post_id:postId, user_id:user.id });
      return true;
    }
  }

  async function listSavedPostIds(){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) return [];
    const { data, error } = await sbClient.from('saved_posts').select('post_id').eq('user_id', user.id);
    if(error) throw error;
    return data.map(r=>r.post_id);
  }

  async function listSavedPosts(){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e).');
    const { data, error } = await sbClient
      .from('saved_posts')
      .select('created_at, post:posts(id, content, image_url, video_url, world_id, created_at, edited_at, author:profiles(id, first_name, last_name, handle, avatar_url), likes(user_id), comments(id, content, created_at, author:profiles(id, first_name, last_name, handle, avatar_url)))')
      .eq('user_id', user.id)
      .order('created_at', { ascending:false });
    if(error) throw error;
    return data.map(r=>r.post).filter(Boolean);
  }

  async function getPost(postId){
    assertConnected();
    const { data, error } = await sbClient
      .from('posts')
      .select('id, content, image_url, video_url, world_id, created_at, edited_at, author:profiles(id, first_name, last_name, handle, avatar_url), likes(user_id), comments(id, content, created_at, author:profiles(id, first_name, last_name, handle, avatar_url))')
      .eq('id', postId).single();
    if(error) throw error;
    return data;
  }

  // ---------------- Likes ----------------
  async function toggleLike(postId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour aimer une publication.');
    const { data: existing } = await sbClient.from('likes').select('*').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
    if(existing){
      await sbClient.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      return false; // أصبح غير معجب
    }else{
      await sbClient.from('likes').insert({ post_id:postId, user_id:user.id });
      return true; // أصبح معجب
    }
  }

  // ---------------- Comments ----------------
  async function addComment(postId, content){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour commenter.');
    const { data, error } = await sbClient.from('comments')
      .insert({ post_id:postId, author_id:user.id, content })
      .select('*, author:profiles(id, first_name, last_name, handle, avatar_url)').single();
    if(error) throw error;
    return data;
  }

  // ---------------- Follow ----------------
  async function toggleFollow(targetUserId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour suivre.');
    const { data: existing } = await sbClient.from('followers').select('*').eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle();
    if(existing){
      await sbClient.from('followers').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
      return false;
    }else{
      await sbClient.from('followers').insert({ follower_id:user.id, following_id:targetUserId });
      return true;
    }
  }

  // ---------------- Messages (رسائل مباشرة) ----------------

  // يرجع قائمة المحادثات: طرف المحادثة، آخر رسالة، وعدد الرسائل غير المقروءة
  async function listConversations(){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e).');
    const { data, error } = await sbClient
      .from('messages')
      .select('id, content, created_at, read_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(id, first_name, last_name, handle, avatar_url), recipient:profiles!messages_recipient_id_fkey(id, first_name, last_name, handle, avatar_url)')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending:false });
    if(error) throw error;

    const map = new Map();
    for(const m of data){
      const iAmSender = m.sender_id === user.id;
      const otherId = iAmSender ? m.recipient_id : m.sender_id;
      const otherProfile = iAmSender ? m.recipient : m.sender;
      if(!map.has(otherId)){
        map.set(otherId, { other: otherProfile, lastMessage: m, unread: 0 });
      }
      if(!iAmSender && !m.read_at) map.get(otherId).unread++;
    }
    return [...map.values()];
  }

  // يرجع كامل سجل الرسائل بين المستخدم الحالي ومستخدم آخر
  async function listMessages(otherUserId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e).');
    const { data, error } = await sbClient
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending:true });
    if(error) throw error;
    return data;
  }

  async function sendMessage(recipientId, content){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour envoyer un message.');
    const { data, error } = await sbClient.from('messages')
      .insert({ sender_id:user.id, recipient_id:recipientId, content })
      .select().single();
    if(error) throw error;
    return data;
  }

  // يضع علامة "مقروءة" على كل رسائل otherUserId الموجّهة لي
  async function markMessagesRead(otherUserId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) return;
    const { error } = await sbClient.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId).eq('recipient_id', user.id).is('read_at', null);
    if(error) throw error;
  }

  // اشتراك لحظي: رسائل واردة جديدة لي (يتطلب تفعيل Realtime على جدول messages)
  function subscribeToIncomingMessages(myUserId, onInsert){
    assertConnected();
    return sbClient.channel('messages-in-' + myUserId)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`recipient_id=eq.${myUserId}` },
          payload => onInsert(payload.new))
      .subscribe();
  }

  // اشتراك لحظي: إشعار بقراءة الطرف الآخر لرسائلي (تحديث علامات ✓✓)
  function subscribeToReadReceipts(myUserId, onUpdate){
    assertConnected();
    return sbClient.channel('messages-read-' + myUserId)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'messages', filter:`sender_id=eq.${myUserId}` },
          payload => onUpdate(payload.new))
      .subscribe();
  }

  // قناة بث (Broadcast) لمؤشر "يكتب الآن..." بين طرفين — لا تُخزَّن في قاعدة البيانات
  function typingChannel(userIdA, userIdB){
    assertConnected();
    const key = [userIdA, userIdB].sort().join('_');
    return sbClient.channel('typing-' + key, { config: { broadcast: { self:false } } });
  }

  function removeChannel(channel){
    if(channel) sbClient.removeChannel(channel);
  }

  // ---------------- Notifications ----------------
  // مطابق لِـ schema.sql: العمود هو read_at (timestamptz, null = غير مقروء)،
  // وليس is_read (boolean). نفس نمط جدول messages.
  async function listNotifications(limit=30){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) return [];
    const { data, error } = await sbClient
      .from('notifications')
      .select('id, type, content, read_at, created_at, post_id, actor:profiles!notifications_actor_id_fkey(id, first_name, last_name, handle, avatar_url)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending:false })
      .limit(limit);
    if(error) throw error;
    return data;
  }

  async function markNotificationRead(notifId){
    assertConnected();
    const { error } = await sbClient.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notifId);
    if(error) throw error;
  }

  async function markAllNotificationsRead(){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) return;
    const { error } = await sbClient.from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_id', user.id).is('read_at', null);
    if(error) throw error;
  }

  async function getUnreadNotificationCount(){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) return 0;
    const { count, error } = await sbClient.from('notifications').select('*', { count:'exact', head:true }).eq('recipient_id', user.id).is('read_at', null);
    if(error) throw error;
    return count || 0;
  }

  // ---------------- Worlds (المجتمعات/الفئات) ----------------
  // ملاحظة: لا توجد سياسة RLS لجدول "worlds" في ملف السياسات المرفق،
  // مما يعني أنه غالباً غير موجود كجدول فعلي — الأقسام (Programmation,
  // IA & ML...) هي بيانات مرجعية ثابتة في الواجهة، وليست "بيانات تجريبية"
  // يجب استبدالها بالضرورة. هذه الدالة تحاول القراءة لو أُنشئ الجدول
  // مستقبلاً، وتتراجع بأمان إلى MOCK.worlds حالياً (وهي غير مؤكَّدة).
  async function listWorlds(){
    assertConnected();
    const { data, error } = await sbClient.from('worlds').select('*').order('member_count', { ascending:false });
    if(error) throw error;
    return data;
  }

  // ---------------- Unread messages (لعداد شارة الرسائل) ──
  // مؤكَّد من RLS: recipient_id هو العمود الصحيح في جدول messages.
  async function getUnreadMessageCount(){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) return 0;
    const { count, error } = await sbClient.from('messages').select('*', { count:'exact', head:true }).eq('recipient_id', user.id).is('read_at', null);
    if(error) throw error;
    return count || 0;
  }

  // بحث بسيط عن مستخدمين بالاسم أو المعرّف لبدء محادثة جديدة
  async function searchProfiles(query){
    assertConnected();
    if(!query || !query.trim()) return [];
    const q = query.trim();
    const { data, error } = await sbClient
      .from('profiles')
      .select('id, first_name, last_name, handle, avatar_url')
      .or(`handle.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(8);
    if(error) throw error;
    const user = await getCurrentUser();
    return user ? data.filter(p=>p.id !== user.id) : data;
  }

  // ---------------- Worlds (membership) ----------------
  async function joinWorld(worldId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour rejoindre.');
    const { error } = await sbClient.from('world_members').insert({ world_id: worldId, user_id: user.id });
    if(error) throw error;
  }

  async function leaveWorld(worldId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e).');
    const { error } = await sbClient.from('world_members').delete().eq('world_id', worldId).eq('user_id', user.id);
    if(error) throw error;
  }

  async function isWorldMember(worldId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) return false;
    const { data } = await sbClient.from('world_members').select('*').eq('world_id', worldId).eq('user_id', user.id).maybeSingle();
    return !!data;
  }

  // ---------------- Companies ----------------
  async function listCompanies(){
    assertConnected();
    const { data, error } = await sbClient.from('companies').select('*, jobs(count), company_followers(count)').order('created_at', { ascending:false });
    if(error) throw error;
    return data;
  }

  async function createCompany({ name, sector, description, website, logoUrl, coverUrl }){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour créer une page entreprise.');
    const { data, error } = await sbClient.from('companies')
      .insert({ owner_id:user.id, name, sector, description, website, logo_url:logoUrl, cover_url:coverUrl })
      .select().single();
    if(error) throw error;
    return data;
  }

  async function toggleFollowCompany(companyId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour suivre.');
    const { data: existing } = await sbClient.from('company_followers').select('*').eq('company_id', companyId).eq('user_id', user.id).maybeSingle();
    if(existing){
      await sbClient.from('company_followers').delete().eq('company_id', companyId).eq('user_id', user.id);
      return false;
    }else{
      await sbClient.from('company_followers').insert({ company_id:companyId, user_id:user.id });
      return true;
    }
  }

  // ---------------- Jobs ----------------
  async function listJobs({ worldId=null, companyId=null } = {}){
    assertConnected();
    let q = sbClient.from('jobs')
      .select('*, company:companies(id, name, logo_url, sector)')
      .eq('status', 'open')
      .order('created_at', { ascending:false });
    if(worldId) q = q.eq('world_id', worldId);
    if(companyId) q = q.eq('company_id', companyId);
    const { data, error } = await q;
    if(error) throw error;
    return data;
  }

  async function createJob({ companyId, title, description, location, jobType, worldId, isRemote }){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error("Vous devez être connecté(e) pour publier une offre d'emploi.");
    const { data, error } = await sbClient.from('jobs')
      .insert({ company_id:companyId, posted_by:user.id, title, description, location, job_type:jobType, world_id:worldId, is_remote:isRemote })
      .select().single();
    if(error) throw error;
    return data;
  }

  async function applyToJob(jobId, coverNote=''){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour postuler.');
    const { data, error } = await sbClient.from('job_applications')
      .insert({ job_id:jobId, applicant_id:user.id, cover_note:coverNote })
      .select().single();
    if(error) throw error;
    return data;
  }

  // ---------------- Events ----------------
  async function listEvents({ worldId=null, upcoming=true } = {}){
    assertConnected();
    let q = sbClient.from('events')
      .select('*, host:profiles(id, first_name, last_name, avatar_url), event_attendees(user_id, status)')
      .order('starts_at', { ascending:true });
    if(worldId) q = q.eq('world_id', worldId);
    if(upcoming) q = q.gte('starts_at', new Date().toISOString());
    const { data, error } = await q;
    if(error) throw error;
    return data;
  }

  async function createEvent({ title, description, location, isOnline, startsAt, endsAt, worldId, coverUrl }){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour créer un événement.');
    const { data, error } = await sbClient.from('events')
      .insert({ host_id:user.id, title, description, location, is_online:isOnline, starts_at:startsAt, ends_at:endsAt, world_id:worldId, cover_url:coverUrl })
      .select().single();
    if(error) throw error;
    return data;
  }

  async function rsvpEvent(eventId, status='going'){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour participer.');
    const { data, error } = await sbClient.from('event_attendees')
      .upsert({ event_id:eventId, user_id:user.id, status }, { onConflict:'event_id,user_id' })
      .select().single();
    if(error) throw error;
    return data;
  }

  // ---------------- Marketplace ----------------
  async function listListings({ category=null } = {}){
    assertConnected();
    let q = sbClient.from('listings')
      .select('*, seller:profiles(id, first_name, last_name, avatar_url), listing_reviews(rating)')
      .eq('status', 'active')
      .order('created_at', { ascending:false });
    if(category) q = q.eq('category', category);
    const { data, error } = await q;
    if(error) throw error;
    return data;
  }

  async function createListing({ title, description, category, priceCents, currency='EUR', coverUrl }){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour créer un service.');
    const { data, error } = await sbClient.from('listings')
      .insert({ seller_id:user.id, title, description, category, price_cents:priceCents, currency, cover_url:coverUrl })
      .select().single();
    if(error) throw error;
    return data;
  }

  async function orderListing(listingId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour commander.');
    // NOTE: this only records intent to buy. Real payment capture must go
    // through a Supabase Edge Function calling Stripe (or similar) — never
    // handle card numbers or final charge amounts directly in the browser.
    const { data, error } = await sbClient.from('listing_orders')
      .insert({ listing_id:listingId, buyer_id:user.id })
      .select().single();
    if(error) throw error;
    return data;
  }

  // ---------------- Dashboard ----------------
  async function getDashboardSummary(){
    assertConnected();
    const { data, error } = await sbClient.rpc('get_dashboard_summary');
    if(error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async function getDailyInteractions(days=30){
    assertConnected();
    const { data, error } = await sbClient.rpc('get_daily_interactions', { p_days: days });
    if(error) throw error;
    return data;
  }

  return {
    isConnected, sbClient,
    signUp, signIn, signOut, signInWithOAuth, getSession, getCurrentUser,
    getProfile, updateProfile, getFollowCounts, uploadAvatar, uploadCover,
    listPosts, createPost, updatePost, deletePost, uploadPostMedia,
    toggleLike, addComment, toggleFollow,
    toggleSavePost, listSavedPostIds, listSavedPosts, getPost,
    listConversations, listMessages, sendMessage, markMessagesRead,
    subscribeToIncomingMessages, subscribeToReadReceipts, typingChannel, removeChannel,
    searchProfiles,
    listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount,
    listWorlds, getUnreadMessageCount,
    joinWorld, leaveWorld, isWorldMember,
    listCompanies, createCompany, toggleFollowCompany,
    listJobs, createJob, applyToJob,
    listEvents, createEvent, rsvpEvent,
    listListings, createListing, orderListing,
    getDashboardSummary, getDailyInteractions,
  };
})();
