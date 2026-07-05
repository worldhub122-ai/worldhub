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
  // عمود select مشترك — يتضمن الآن repost_of + المنشور الأصلي (original)
  // حتى تقدر الواجهة تعرض "فلان أعاد نشر منشور علان" مع بطاقة المنشور
  // الأصلي مضمّنة (Issue: إعادة النشر ما كانت موجودة إطلاقاً).
  const POST_SELECT = `id, content, image_url, video_url, world_id, created_at, edited_at, repost_of,
    author:profiles!posts_author_id_fkey(id, first_name, last_name, handle, avatar_url),
    likes(user_id),
    comments(id, content, created_at, author:profiles(id, first_name, last_name, handle, avatar_url)),
    polls(id, question),
    original:posts!repost_of(id, content, image_url, video_url, created_at,
      author:profiles!posts_author_id_fkey(id, first_name, last_name, handle, avatar_url))`;

  // يرجع منشورات مع اسم الكاتب، عدد الإعجابات، وهل المستخدم الحالي أعجب بها
  async function listPosts({ worldId=null, authorId=null, limit=30 } = {}){
    assertConnected();
    let q = sbClient
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending:false })
      .limit(limit);
    if(worldId) q = q.eq('world_id', worldId);
    if(authorId) q = q.eq('author_id', authorId);
    const { data, error } = await q;
    if(error) throw error;
    return data;
  }

  // ── @Mentions: يحلل النص بحثاً عن @handle، يربطها بمستخدمين حقيقيين،
  // ويخزّنها في جدول mentions (الإشعار يُنشأ تلقائياً عبر Trigger بالقاعدة) ──
  function _extractHandles(text){
    if(!text) return [];
    const matches = text.match(/@([a-zA-Z0-9_.]{2,32})/g) || [];
    return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
  }
  async function _saveMentions(sourceType, sourceId, content, actorId){
    const handles = _extractHandles(content);
    if(!handles.length) return;
    try{
      const { data: users } = await sbClient.from('profiles').select('id, handle')
        .in('handle', handles.map(h => '@'+h));
      const rows = (users||[])
        .filter(u => u.id !== actorId)
        .map(u => ({ source_type:sourceType, source_id:sourceId, mentioned_user_id:u.id, actor_id:actorId }));
      if(rows.length){
        await sbClient.from('mentions').upsert(rows, { onConflict:'source_type,source_id,mentioned_user_id', ignoreDuplicates:true });
      }
    }catch(err){ console.warn('[WorldHub] _saveMentions failed:', err.message); }
  }

  // ── #Hashtags: يحلل النص بحثاً عن #tag، ينشئها إن لم توجد، ويربطها بالمنشور ──
  function _extractHashtags(text){
    if(!text) return [];
    const matches = text.match(/#([\p{L}0-9_]{2,50})/gu) || [];
    return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
  }
  async function _saveHashtags(postId, content){
    const tags = _extractHashtags(content);
    try{
      // امسح الربط القديم أولاً (مفيد عند التعديل: منشور مُعدَّل قد يحذف وسماً)
      await sbClient.from('post_hashtags').delete().eq('post_id', postId);
      if(!tags.length) return;
      const { data: existing } = await sbClient.from('hashtags').select('id, tag').in('tag', tags);
      const existingMap = new Map((existing||[]).map(h => [h.tag, h.id]));
      const missing = tags.filter(t => !existingMap.has(t));
      if(missing.length){
        const { data: inserted, error } = await sbClient.from('hashtags')
          .insert(missing.map(tag => ({ tag }))).select('id, tag');
        if(!error) (inserted||[]).forEach(h => existingMap.set(h.tag, h.id));
      }
      const links = tags.filter(t => existingMap.has(t))
        .map(t => ({ post_id:postId, hashtag_id:existingMap.get(t) }));
      if(links.length) await sbClient.from('post_hashtags').insert(links);
    }catch(err){ console.warn('[WorldHub] _saveHashtags failed:', err.message); }
  }

  async function createPost({ content, worldId, imageUrl=null, videoUrl=null }){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour publier.');
    const { data, error } = await sbClient.from('posts')
      .insert({ author_id:user.id, content, world_id:worldId, image_url:imageUrl, video_url:videoUrl })
      .select().single();
    if(error) throw error;
    // لا تُفشل نشر المنشور إذا فشل استخراج المنشن/الوسم — هذه إثراء إضافي فقط
    await Promise.all([ _saveMentions('post', data.id, content, user.id), _saveHashtags(data.id, content) ]);
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
    if(content !== undefined){
      const user = await getCurrentUser();
      await Promise.all([ _saveMentions('post', postId, content, user?.id), _saveHashtags(postId, content) ]);
    }
    return data;
  }

  async function deletePost(postId){
    assertConnected();
    const { error } = await sbClient.from('posts').delete().eq('id', postId);
    if(error) throw error;
  }

  // ---------------- Reposts (Issue: زر "🔄" كان "مشاركة رابط" بس، ما
  // كان في أي شكل لإعادة النشر الحقيقية داخل المنصة) ----------------
  // Repost بسيط: صف جديد content='' + repost_of=originalId. الضغط ثانية
  // على نفس المنشور يلغيه (يحذف صف الـ repost). قيد فريد بالقاعدة يمنع
  // تكراره لنفس المستخدم لنفس المنشور.
  async function toggleRepost(originalPostId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour republier.');
    const { data: existing } = await sbClient.from('posts')
      .select('id').eq('repost_of', originalPostId).eq('author_id', user.id).eq('content', '').maybeSingle();
    if(existing){
      await sbClient.from('posts').delete().eq('id', existing.id);
      return { reposted:false };
    }
    const { error } = await sbClient.from('posts')
      .insert({ author_id:user.id, content:'', repost_of:originalPostId });
    if(error) throw error;
    return { reposted:true };
  }

  // Quote-Repost: منشور جديد فيه نص + repost_of. يمكن تكراره (كل اقتباس
  // منشور مستقل)، ويحلَّل نصه لمنشن/وسوم كأي منشور عادي.
  async function quoteRepost(originalPostId, quoteContent){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour republier.');
    const { data, error } = await sbClient.from('posts')
      .insert({ author_id:user.id, content:quoteContent||'', repost_of:originalPostId })
      .select().single();
    if(error) throw error;
    await Promise.all([ _saveMentions('post', data.id, quoteContent, user.id), _saveHashtags(data.id, quoteContent) ]);
    return data;
  }

  // يرجع { [postId]: { count, reposted } } لمجموعة منشورات دفعة وحدة
  // (استعلام واحد بدل استعلام لكل منشور).
  async function getRepostStats(postIds){
    assertConnected();
    if(!postIds || !postIds.length) return {};
    const user = await getCurrentUser();
    const { data, error } = await sbClient.from('posts')
      .select('id, repost_of, author_id, content')
      .in('repost_of', postIds);
    if(error) throw error;
    const stats = {};
    postIds.forEach(id => { stats[id] = { count:0, reposted:false }; });
    (data||[]).forEach(row => {
      const s = stats[row.repost_of];
      if(!s) return;
      s.count++;
      if(user && row.author_id === user.id && row.content === '') s.reposted = true;
    });
    return stats;
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
      .select(`created_at, post:posts(${POST_SELECT})`)
      .eq('user_id', user.id)
      .order('created_at', { ascending:false });
    if(error) throw error;
    return data.map(r=>r.post).filter(Boolean);
  }

  async function getPost(postId){
    assertConnected();
    const { data, error } = await sbClient
      .from('posts')
      .select(POST_SELECT)
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
    await _saveMentions('comment', data.id, content, user.id);
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

  // ---------------- Recherche globale (Issue: le champ de recherche
  // dans la topbar n'était relié à rien du tout) ----------------
  // Cherche en parallèle dans posts / profils / mondes / entreprises / offres
  // et retourne un objet groupé par catégorie. Chaque requête est indépendante
  // (Promise.allSettled) pour qu'une table manquante ne casse pas les autres.
  async function searchAll(query, limit=6){
    assertConnected();
    const q = (query || '').trim();
    if(!q) return { posts:[], profiles:[], worlds:[], companies:[], jobs:[] };

    const [posts, profiles, worlds, companies, jobs] = await Promise.allSettled([
      sbClient.from('posts')
        .select('id, content, created_at, author:profiles(id, first_name, last_name, handle, avatar_url)')
        .ilike('content', `%${q}%`).order('created_at', { ascending:false }).limit(limit),
      searchProfiles(q),
      sbClient.from('worlds').select('id, name, icon, member_count').ilike('name', `%${q}%`).limit(limit),
      sbClient.from('companies').select('id, name, sector, logo_url').ilike('name', `%${q}%`).limit(limit),
      sbClient.from('jobs').select('id, title, location, job_type, company:companies(name)').ilike('title', `%${q}%`).eq('status','open').limit(limit),
    ]);

    const unwrap = (settled, isRaw=true) => {
      if(settled.status !== 'fulfilled') return [];
      const v = settled.value;
      if(!isRaw) return v || []; // searchProfiles already returns a plain array
      return v.error ? [] : (v.data || []);
    };

    return {
      posts:     unwrap(posts),
      profiles:  unwrap(profiles, false),
      worlds:    unwrap(worlds),
      companies: unwrap(companies),
      jobs:      unwrap(jobs),
    };
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

  // ---------------- Polls (Issue: the "Sondage" chip only composed a
  // plain-text block into the post; there was no real vote-counting
  // backend at all) ----------------
  async function createPoll(postId, question, optionLabels){
    assertConnected();
    const { data: poll, error: pollErr } = await sbClient.from('polls')
      .insert({ post_id: postId, question }).select().single();
    if(pollErr) throw pollErr;
    const rows = optionLabels.map((label, i) => ({ poll_id: poll.id, label, position: i }));
    const { error: optErr } = await sbClient.from('poll_options').insert(rows);
    if(optErr) throw optErr;
    return poll;
  }

  // Returns { id, question, options:[{id,label,votes}], myVote } or null if this post has no poll
  async function getPollForPost(postId){
    assertConnected();
    const { data: poll, error } = await sbClient.from('polls')
      .select('id, question, post_id').eq('post_id', postId).maybeSingle();
    if(error) throw error;
    if(!poll) return null;

    const { data: options, error: optErr } = await sbClient.from('poll_options')
      .select('id, label, position, poll_votes(count)')
      .eq('poll_id', poll.id).order('position');
    if(optErr) throw optErr;

    const user = await getCurrentUser();
    let myVote = null;
    if(user){
      const { data: voteRow } = await sbClient.from('poll_votes')
        .select('option_id').eq('poll_id', poll.id).eq('user_id', user.id).maybeSingle();
      myVote = voteRow?.option_id || null;
    }
    return {
      id: poll.id,
      question: poll.question,
      options: (options || []).map(o => ({ id:o.id, label:o.label, votes: o.poll_votes?.[0]?.count || 0 })),
      myVote,
    };
  }

  async function votePoll(pollId, optionId){
    assertConnected();
    const user = await getCurrentUser();
    if(!user) throw new Error('Vous devez être connecté(e) pour voter.');
    const { data, error } = await sbClient.from('poll_votes')
      .upsert({ poll_id:pollId, option_id:optionId, user_id:user.id }, { onConflict:'poll_id,user_id' })
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
    toggleRepost, quoteRepost, getRepostStats,
    toggleLike, addComment, toggleFollow,
    toggleSavePost, listSavedPostIds, listSavedPosts, getPost,
    listConversations, listMessages, sendMessage, markMessagesRead,
    subscribeToIncomingMessages, subscribeToReadReceipts, typingChannel, removeChannel,
    searchProfiles, searchAll,
    listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount,
    listWorlds, getUnreadMessageCount,
    joinWorld, leaveWorld, isWorldMember,
    listCompanies, createCompany, toggleFollowCompany,
    listJobs, createJob, applyToJob,
    listEvents, createEvent, rsvpEvent,
    listListings, createListing, orderListing,
    createPoll, getPollForPost, votePoll,
    getDashboardSummary, getDailyInteractions,
  };
})();
