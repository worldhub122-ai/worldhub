/* ==========================================================
   WorldHub — app.js  (Updated: Supabase-aware)
   Layout, mock data (fallback), interactions, and real-data
   bridge via the `api` object at the bottom.
   ========================================================== */

const NAV = [
  { id:'home',          icon:'🏠', label:'Accueil',            href:'index.html' },
  { id:'reels',         icon:'🎬', label:'Reels',               href:'#' },
  { id:'messages',      icon:'💬', label:'Messages',            href:'messages.html', badge:null },
  { id:'notifications', icon:'🔔', label:'Notifications',       href:'notifications.html', badge:null },
  { id:'create',        icon:'➕', label:'Créer une publication', href:'create-post.html' },
  { id:'dashboard',     icon:'📊', label:'Tableau de bord',     href:'dashboard.html' },
  { id:'profile',       icon:'👤', label:'Profil',              href:'profile.html' },
  { id:'div1' },
  { id:'worlds-label', label:'Mes Mondes' },
  { id:'programming',  icon:'💻', label:'Programmation',  href:'world.html?id=programming', accent:'green' },
  { id:'ai',           icon:'🤖', label:'IA & ML',         href:'world.html?id=ai', accent:'blue' },
  { id:'design',       icon:'🎨', label:'Design',          href:'world.html?id=design', accent:'pink' },
  { id:'entrepreneur', icon:'💼', label:'Entrepreneuriat', href:'world.html?id=entrepreneur', accent:'yellow' },
  { id:'div2' },
  { id:'jobs',        icon:'🧰', label:'Offres d\'emploi', href:'jobs.html' },
  { id:'companies',   icon:'🏢', label:'Entreprises',     href:'companies.html' },
  { id:'events',      icon:'📅', label:'Événements',      href:'events.html' },
  { id:'marketplace', icon:'🛒', label:'Marketplace',     href:'marketplace.html' },
  { id:'plus',        icon:'⋯', label:'Plus',            href:'#' },
];

/* ── Mock data (used as fallback when Supabase is not connected) ── */
const MOCK = {
  user: { name:'Alex Dev', handle:'@alex.dev', avatar:'https://i.pravatar.cc/150?img=13',
          bio:'Développeur Full Stack · Passionné d\'IA et le Web', posts:152, followers:'12.4k', following:280 },

  worlds: [
    { id:'programming', icon:'💻', color:'green',  name:'Programmation',        members:'12.3k' },
    { id:'ai',           icon:'🤖', color:'blue',   name:'IA & ML',              members:'8.7k' },
    { id:'design',       icon:'🎨', color:'pink',   name:'Design',               members:'11.2k' },
    { id:'entrepreneur', icon:'💼', color:'yellow', name:'Entrepreneuriat',      members:'6.4k' },
    { id:'finance',      icon:'📈', color:'green',  name:'Finance',              members:'5.4k' },
    { id:'healthcare',   icon:'🩺', color:'pink',   name:'Santé',                members:'4.7k' },
    { id:'education',    icon:'🎓', color:'blue',   name:'Éducation',            members:'3.6k' },
    { id:'gaming',       icon:'🎮', color:'yellow', name:'Gaming',               members:'9.1k' },
  ],

  posts: [
    { id:1, author:'Sarah Parker', handle:'@sarah.parker', time:'il y a 2h', world:'Programmation',
      text:'Quelques conseils pour améliorer vos compétences en JavaScript en 2024 🚀',
      code:`<span class="kw">const</span> developer = {\n  name: <span class="str">'JavaScript'</span>,\n  focus: <span class="str">'Web Development'</span>,\n  keepLearning: <span class="kw">true</span>\n};`,
      likes:138, comments:15, shares:6 },
    { id:2, author:'Alex Dev', handle:'@alex.dev', time:'il y a 5h', world:'IA & ML',
      text:'L\'avenir de l\'IA entre nos mains. Continuons à construire !',
      highlight:true,
      likes:246, comments:56, shares:23 },
    { id:3, author:'John Doe', handle:'@johndoe', time:'il y a 3h', world:'Programmation',
      text:'Astuce JavaScript : utilisez la déstructuration pour un code plus propre !',
      code:`<span class="kw">const</span> user = {\n  name: <span class="str">'John Doe'</span>,\n  age: 30,\n  skills: [<span class="str">'React'</span>, <span class="str">'Node.js'</span>]\n};\n\n<span class="kw">const</span> { name, age, skills } = user;`,
      likes:90, comments:24, shares:12 },
  ],

  trending: ['#JavaScript','#Flutter','#AI','#RemoteDev','#WebDesign'],

  topMembers: [
    { name:'Alex Dev',    meta:'12.4k pts', avatar:'https://i.pravatar.cc/80?img=13' },
    { name:'Sarah Parker',meta:'8.7k pts',  avatar:'https://i.pravatar.cc/80?img=5' },
    { name:'John Smith',  meta:'6.3k pts',  avatar:'https://i.pravatar.cc/80?img=32' },
  ],

  events: [
    { day:'15', mon:'JUIN', title:'Flutter World Conference', place:'En ligne', desc:'La plus grande conférence Flutter de l\'année avec des experts du monde entier.', going:'1.2k participants' },
    { day:'22', mon:'JUIN', title:'IA & ML Summit 2024', place:'Paris, France', desc:'Rassemblement des meilleurs esprits en Machine Learning.', going:'850 participants' },
    { day:'05', mon:'JUIL', title:'Web Dev Bootcamp', place:'Lyon, France', desc:'Bootcamp intensif sur les technologies web modernes.', going:'150 participants' },
  ],

  conversations: [
    { name:'Sarah Parker', avatar:'https://i.pravatar.cc/80?img=5',  preview:'Oui, il a l\'air incroyable 🎉', time:'10:33', online:true, unread:0 },
    { name:'John Smith',   avatar:'https://i.pravatar.cc/80?img=32', preview:'Ça va super ! Et toi ?',        time:'09:10', online:true, unread:2 },
    { name:'Alex Johnson', avatar:'https://i.pravatar.cc/80?img=15', preview:'À demain alors 👋',              time:'Hier',  online:false, unread:0 },
    { name:'Mike Wilson',  avatar:'https://i.pravatar.cc/80?img=22', preview:'Tu as vu le nouveau framework ?',time:'Hier',  online:false, unread:0 },
    { name:'Emma Davis',   avatar:'https://i.pravatar.cc/80?img=9',  preview:'Merci pour l\'aide !',            time:'Lun',   online:false, unread:0 },
    { name:'David Brown',  avatar:'https://i.pravatar.cc/80?img=51', preview:'On se cale une réunion ?',       time:'Lun',   online:false, unread:0 },
  ],

  chatThread: [
    { from:'them', text:'Salut Alex ! Comment ça va ?', time:'10:20' },
    { from:'me',   text:'Ça va super ! Et toi ?',        time:'10:21' },
    { from:'them', text:'Bien aussi ! Tu as vu le nouveau framework ?', time:'10:30' },
    { from:'me',   text:'Oui, il a l\'air incroyable 🎉', time:'10:33' },
  ],

  notifications: [
    { icon:'❤️', color:'pink',   text:'Sarah Parker a aimé votre publication',              time:'il y a 5 min', unread:true },
    { icon:'💬', color:'blue',   text:'John Smith a commenté votre publication',            time:'il y a 20 min', unread:true },
    { icon:'📣', color:'accent', text:'Alex Johnson vous a mentionné dans un commentaire',   time:'il y a 1h', unread:true },
    { icon:'🔄', color:'green',  text:'Votre publication a été partagée 5 fois',             time:'il y a 2h', unread:true },
    { icon:'🌍', color:'yellow', text:'Nouveau membre dans le monde Programmation',          time:'il y a 3h', unread:true },
    { icon:'➕', color:'accent', text:'Mike Wilson a commencé à vous suivre',                time:'il y a 4h', unread:true },
    { icon:'💬', color:'blue',   text:'Emma Davis a répondu à votre commentaire',            time:'il y a 6h', unread:false },
    { icon:'🔥', color:'pink',   text:'Votre contenu est tendance',                          time:'il y a 1j', unread:false },
  ],

  jobs: [
    { title:'Développeur Frontend React', company:'NovaTech', place:'Remote', type:'CDI', tag:'Programmation', posted:'il y a 2j' },
    { title:'Product Designer UI/UX', company:'Studio Kaya', place:'Paris, FR', type:'CDI', tag:'Design', posted:'il y a 3j' },
    { title:'Data Scientist', company:'Vertex AI Labs', place:'Remote', type:'Freelance', tag:'IA & ML', posted:'il y a 5j' },
    { title:'Growth Marketer', company:'Lumen Ventures', place:'Lyon, FR', type:'Stage', tag:'Entrepreneuriat', posted:'il y a 1sem' },
  ],

  companies: [
    { name:'NovaTech',        followers:'24.5k', openJobs:12, sector:'Logiciels' },
    { name:'Studio Kaya',     followers:'9.2k',  openJobs:4,  sector:'Design' },
    { name:'Vertex AI Labs',  followers:'31.8k', openJobs:7,  sector:'Intelligence Artificielle' },
    { name:'Lumen Ventures',  followers:'6.1k',  openJobs:2,  sector:'Startup Studio' },
  ],

  listings: [
    { title:'Développement site vitrine', seller:'Yasmine K.', price:'250€', rating:4.9, tag:'Web' },
    { title:'Identité visuelle complète', seller:'Karim D.', price:'180€', rating:5.0, tag:'Design' },
    { title:'Script d\'automatisation Python', seller:'Léa M.', price:'90€', rating:4.8, tag:'Programmation' },
    { title:'Montage vidéo Reels', seller:'Tom B.', price:'60€', rating:4.7, tag:'Vidéo' },
  ],
};

const COLOR_VARS = { green:'var(--green)', blue:'var(--blue)', pink:'var(--pink)', yellow:'var(--yellow)', accent:'var(--accent)' };

function tile(icon,color){ return `<div class="tile" style="background:${COLOR_VARS[color]||COLOR_VARS.accent}22;color:${COLOR_VARS[color]||COLOR_VARS.accent}">${icon}</div>`; }

/* ── XSS guard: escape any user-generated text before it goes into a
   template literal that's injected via innerHTML. Every place that
   renders post text, comment text, bios, chat messages, etc. must
   pass the value through this first. Do NOT escape trusted, hardcoded
   markup (icons, static labels) — only user-authored strings. ── */
function escapeHtml(str){
  if(str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/* ── Live user state (populated from Supabase when available) ── */
const _liveUser = { avatar: MOCK.user.avatar, name: MOCK.user.name, handle: MOCK.user.handle };

/* Attempt to load current user profile and patch topbar live.
   Runs once per page load without blocking layout rendering.      */
async function _hydrateCurrentUser() {
  if (typeof DB === 'undefined' || !DB.isConnected) return;
  try {
    const user = await DB.getCurrentUser();
    if (!user) return;
    const profile = await DB.getProfile(user.id);
    if (profile) {
      _liveUser.avatar  = profile.avatar_url  || _liveUser.avatar;
      _liveUser.name    = (profile.first_name + ' ' + (profile.last_name || '')).trim() || _liveUser.name;
      _liveUser.handle  = profile.handle       || _liveUser.handle;
    }
    /* Patch topbar avatar and name once data arrives */
    const avatarBtn = document.querySelector('.avatar-btn img');
    if (avatarBtn) avatarBtn.src = _liveUser.avatar;
  } catch (err) {
    /* Non-fatal — topbar keeps MOCK data */
    console.warn('[WorldHub] Could not hydrate user:', err.message);
  }
}

/* ---------------- TOPBAR ---------------- */
function renderTopbar(){
  return `
  <div class="topbar">
    <button class="menu-toggle" id="menuToggle" aria-label="Ouvrir le menu">☰</button>
    <a href="index.html" class="brand"><span class="glyph">🌍</span>WorldHub</a>
    <div class="search-box">
      <span>🔍</span>
      <input type="text" placeholder="Rechercher des personnes, publications, mondes...">
      <span class="kbd">⌘K</span>
    </div>
    <div class="topbar-actions">
      <button class="btn btn-primary btn-sm" onclick="location.href='create-post.html'">+ Créer</button>
      <a href="notifications.html" class="icon-btn">🔔<span class="dot" id="dotNotif" hidden></span></a>
      <a href="messages.html" class="icon-btn">💬<span class="dot" id="dotMsg" hidden></span></a>
      <a href="profile.html" class="avatar-btn"><img src="${_liveUser.avatar}" alt="${_liveUser.name}"></a>
      <button class="btn btn-ghost btn-sm" onclick="logout()" title="Déconnexion" style="padding:0 10px;font-size:18px;line-height:1">⏻</button>
    </div>
  </div>`;
}

/* ---------------- SIDEBAR ---------------- */
function renderSidebar(active){
  const items = NAV.map(n=>{
    if(n.id.startsWith('div')) return `<div class="nav-divider"></div>`;
    if(n.id.endsWith('-label')) return `<div class="nav-label">${n.label}</div>`;
    const cls = n.id===active ? 'nav-item active' : 'nav-item';
    const badgeId = n.id==='messages' ? 'navBadgeMsg' : (n.id==='notifications' ? 'navBadgeNotif' : null);
    const badge = badgeId ? `<span class="nav-badge" id="${badgeId}" hidden></span>` : '';
    return `<a class="${cls}" href="${n.href}"><span class="ic">${n.icon}</span>${n.label}${badge}</a>`;
  }).join('');
  /* Logout entry at the bottom of sidebar */
  const logoutItem = `<div class="nav-divider"></div><a class="nav-item" href="#" onclick="logout();return false;"><span class="ic">⏻</span>Déconnexion</a>`;
  return `<aside class="sidebar" id="sidebar">${items}${logoutItem}</aside>`;
}

/* ---------------- RIGHT RAIL ---------------- */
function railWorlds(){
  return `<div class="card">
    <div class="card-head"><h3>Découvrir des Mondes</h3><span class="link">Voir tout</span></div>
    ${MOCK.worlds.slice(0,4).map(w=>`
      <div class="row" style="cursor:pointer" onclick="location.href='world.html?id=${encodeURIComponent(w.id)}'">
        ${tile(w.icon,w.color)}
        <div><div class="row-title">${w.name}</div><div class="row-sub">${w.members} membres</div></div>
        <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="event.stopPropagation();location.href='world.html?id=${encodeURIComponent(w.id)}'">Rejoindre</button>
      </div>`).join('')}
  </div>`;
}
function railTrending(){
  return `<div class="card card-pad">
    <h3 style="margin:0 0 12px;font-size:15px">Tendances</h3>
    ${MOCK.trending.map(t=>`<div class="row" style="padding:8px 0"><span class="pill pill-accent">${t}</span></div>`).join('')}
  </div>`;
}
function railTopMembers(){
  return `<div class="card">
    <div class="card-head"><h3>Top Membres</h3><span class="link">Voir le classement</span></div>
    ${MOCK.topMembers.map((m,i)=>`
      <div class="row">
        <span style="width:18px;color:var(--text-3);font-weight:700;font-size:13px">${i+1}</span>
        <img class="avatar" src="${m.avatar}" style="width:34px;height:34px">
        <div><div class="row-title">${m.name}</div><div class="row-sub">${m.meta}</div></div>
      </div>`).join('')}
  </div>`;
}
function railEvents(){
  return `<div class="card">
    <div class="card-head"><h3>Événements à venir</h3><span class="link">Voir tout</span></div>
    ${MOCK.events.map(e=>`
      <div class="row">
        <div class="tile" style="background:var(--accent-soft);color:var(--accent-2);flex-direction:column;font-size:11px;line-height:1.1;font-weight:800">${e.day}<span style="font-size:9px;font-weight:700">${e.mon}</span></div>
        <div><div class="row-title">${e.title}</div><div class="row-sub">${e.place} · ${e.going}</div></div>
      </div>`).join('')}
  </div>`;
}
function defaultRail(){ return railWorlds()+railTrending()+railTopMembers()+railEvents(); }

/* ---------------- GENERIC MODAL ----------------
   Small reusable overlay used by every "+ Créer ..." action
   (company, job, event, listing) and profile editing, instead of
   leaving those buttons with no onclick handler at all. ----------- */
function openModal(innerHTML){
  closeModal();
  const overlay = document.createElement('div');
  overlay.id = 'wh-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(5,5,10,.6);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `<div class="card card-pad" style="max-width:460px;width:100%;max-height:86vh;overflow:auto;position:relative">
    <button type="button" onclick="closeModal()" aria-label="Fermer" style="position:absolute;top:12px;right:12px;background:none;border:none;color:var(--text-3);font-size:20px;cursor:pointer;line-height:1">✕</button>
    ${innerHTML}
  </div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', _modalEscHandler);
  document.body.appendChild(overlay);
}
function _modalEscHandler(e){ if (e.key === 'Escape') closeModal(); }
function closeModal(){
  document.getElementById('wh-modal-overlay')?.remove();
  document.removeEventListener('keydown', _modalEscHandler);
}

/* ---------------- MOBILE MENU ---------------- */
function wireMobileMenu(){
  const btn = document.getElementById('menuToggle');
  const sb = document.getElementById('sidebar');
  if(!btn || !sb) return;
  btn.addEventListener('click',()=> sb.classList.toggle('open'));
  document.addEventListener('click',(e)=>{
    if(sb.classList.contains('open') && !sb.contains(e.target) && e.target!==btn){
      sb.classList.remove('open');
    }
  });
}

/* ---------------- LAYOUT BOOTSTRAP ----------------
   Call once per page:
   initLayout({ active:'home', rail: defaultRail(), mainHTML: '<div class="main-col">...</div>', noRail:false })
----------------------------------------------------- */
function initLayout({ active, rail, mainHTML, noRail=false, wide=false }){
  document.getElementById('topbar-slot').innerHTML = renderTopbar();
  document.getElementById('shell-slot').innerHTML = `
    <div class="shell">
      ${renderSidebar(active)}
      <div class="content-grid ${noRail?'no-rail':''} ${wide?'wide':''}">
        ${mainHTML}
        ${noRail ? '' : `<aside class="rail">${rail||defaultRail()}</aside>`}
      </div>
    </div>`;
  wireMobileMenu();
  wireGlobalInteractions();
  /* Hydrate topbar avatar / name from Supabase (non-blocking) */
  _hydrateCurrentUser();
  /* Hydrate unread message/notification badges from real data.
     If getUnreadCounts() returns null (not connected, or tables
     don't exist yet), badges simply stay hidden rather than
     showing a fake number. */
  _hydrateUnreadBadges();
}

async function _hydrateUnreadBadges(){
  if (typeof api === 'undefined') return;
  try {
    const counts = await api.getUnreadCounts();
    if (!counts) return;
    const setBadge = (id, n) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (n > 0) { el.textContent = n > 99 ? '99+' : n; el.hidden = false; }
      else { el.hidden = true; }
    };
    setBadge('dotNotif', counts.notifications);
    setBadge('dotMsg', counts.messages);
    setBadge('navBadgeNotif', counts.notifications);
    setBadge('navBadgeMsg', counts.messages);
  } catch (err) {
    console.warn('[WorldHub] Could not hydrate badges:', err.message);
  }
}

/* ---------------- GENERIC INTERACTIONS ---------------- */
/* Issue 6/12: likes and follows now write through `api.*` to Supabase
   instead of only toggling a CSS class. UI updates optimistically for
   responsiveness, then rolls back if the DB write fails (e.g. user
   not authenticated, RLS rejection, network error). */
function wireGlobalInteractions(){
  document.querySelectorAll('[data-like]').forEach(el=>{
    if(!el.dataset.postId) return; // no post id wired -> nothing to persist, skip
    el.addEventListener('click', async ()=>{
      if(el.dataset.busy) return; // prevent double-click races
      el.dataset.busy = '1';
      const wasLiked = el.classList.contains('liked');
      const countEl = el.querySelector('.count');
      /* optimistic update */
      el.classList.toggle('liked');
      if(countEl){
        let n = parseInt(countEl.textContent.replace(/\D/g,''))||0;
        n += wasLiked ? -1 : 1;
        countEl.textContent = n;
      }
      try{
        await api.toggleLike(el.dataset.postId);
      }catch(err){
        /* rollback on failure */
        el.classList.toggle('liked', wasLiked);
        if(countEl){
          let n = parseInt(countEl.textContent.replace(/\D/g,''))||0;
          n += wasLiked ? 1 : -1;
          countEl.textContent = n;
        }
        showError ? showError(err) : console.error(err);
      }finally{
        delete el.dataset.busy;
      }
    });
  });
  document.querySelectorAll('[data-follow]').forEach(el=>{
    if(!el.dataset.userId) return; // no target user id wired -> skip
    el.addEventListener('click', async ()=>{
      if(el.dataset.busy) return;
      el.dataset.busy = '1';
      const wasFollowing = el.dataset.follow === 'on';
      /* optimistic update */
      el.dataset.follow = wasFollowing ? 'off' : 'on';
      el.textContent = wasFollowing ? 'Suivre' : 'Suivi ✓';
      el.classList.toggle('btn-primary', wasFollowing);
      el.classList.toggle('btn-outline', !wasFollowing);
      try{
        await api.toggleFollow(el.dataset.userId);
      }catch(err){
        el.dataset.follow = wasFollowing ? 'on' : 'off';
        el.textContent = wasFollowing ? 'Suivi ✓' : 'Suivre';
        el.classList.toggle('btn-primary', !wasFollowing);
        el.classList.toggle('btn-outline', wasFollowing);
        showError ? showError(err) : console.error(err);
      }finally{
        delete el.dataset.busy;
      }
    });
  });
}

/* ================================================================
   `api` — the bridge between UI and Supabase (or mock fallback).
   All page-level code calls api.* functions; never calls DB.* or
   MOCK.* directly — this makes swapping the backend effortless.
   ================================================================ */
const api = {

  /* ── Feed (Issue 4) ── */
  async getFeed() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listPosts({ limit: 30 });
        /* Normalise Supabase rows to the shape the UI expects.
           Note: id is kept as a real DB id so like/comment/follow
           actions can be wired to data-post-id in the markup. */
        return rows.map(p => ({
          id:       p.id,
          authorId: p.author?.id || null,
          author:   p.author ? (p.author.first_name + ' ' + (p.author.last_name || '')).trim() : 'Utilisateur',
          handle:   p.author?.handle || '@user',
          time:     _relTime(p.created_at),
          world:    p.world_id || '',
          text:     p.content  || '',
          likes:    Array.isArray(p.likes)    ? p.likes.length    : 0,
          comments: Array.isArray(p.comments) ? p.comments.length : 0,
          commentList: Array.isArray(p.comments) ? p.comments : [],
          shares:   0,
          avatarUrl: p.author?.avatar_url || null,
        }));
      } catch (err) {
        console.warn('[WorldHub] getFeed fell back to mock:', err.message);
      }
    }
    return MOCK.posts;
  },

  /* ── Worlds ──
     Attempts a real `worlds` table read; falls back to MOCK.worlds
     if the table doesn't exist yet or the query fails. This mirrors
     the same try/DB-then-fallback pattern used everywhere else. */
  async getWorlds() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listWorlds();
        if (rows && rows.length) {
          return rows.map(w => ({
            id: w.id, icon: w.icon || '🌍', color: w.color || 'accent',
            name: w.name, members: w.member_count != null ? String(w.member_count) : '',
          }));
        }
      } catch (err) {
        console.warn('[WorldHub] getWorlds fell back to mock:', err.message);
      }
    }
    return MOCK.worlds;
  },

  /* ── Single world (by id/slug) ── used by world.html to know which
     world it's rendering (name, icon, member count, description). ── */
  async getWorld(worldId) {
    const worlds = await this.getWorlds();
    const found = worlds.find(w => String(w.id) === String(worldId));
    if (found) return found;
    return MOCK.worlds.find(w => w.id === worldId) || MOCK.worlds[0];
  },

  /* ── Posts scoped to a single world ── */
  async getWorldPosts(worldId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listPosts({ worldId });
        return rows.map(p => ({
          id:       p.id,
          authorId: p.author?.id || null,
          author:   p.author ? (p.author.first_name + ' ' + (p.author.last_name || '')).trim() : 'Utilisateur',
          handle:   p.author?.handle || '@user',
          time:     _relTime(p.created_at),
          world:    p.world_id || '',
          text:     p.content  || '',
          likes:    Array.isArray(p.likes)    ? p.likes.length    : 0,
          comments: Array.isArray(p.comments) ? p.comments.length : 0,
          commentList: Array.isArray(p.comments) ? p.comments : [],
          shares:   0,
          avatarUrl: p.author?.avatar_url || null,
        }));
      } catch (err) {
        console.warn('[WorldHub] getWorldPosts fell back to mock:', err.message);
      }
    }
    /* Mock fallback: MOCK.posts tags posts by world *name* (e.g. 'Programmation'),
       so resolve the display name for this world id first. */
    const world = MOCK.worlds.find(w => w.id === worldId);
    return MOCK.posts.filter(p => p.world === (world ? world.name : worldId));
  },

  /* ── Is the current user a member of this world? ── */
  async isWorldMember(worldId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try { return await DB.isWorldMember(worldId); } catch (err) { console.warn('[WorldHub] isWorldMember failed:', err.message); }
    }
    return false;
  },

  /* ── Join/leave toggle for a world ── */
  async toggleWorldMembership(worldId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      const isMember = await DB.isWorldMember(worldId);
      if (isMember) { await DB.leaveWorld(worldId); return false; }
      await DB.joinWorld(worldId);
      return true;
    }
    console.log('toggleWorldMembership->mock', worldId);
    return true;
  },

  /* ── Notifications ──
     Attempts real `notifications` table read via DB.listNotifications();
     falls back to MOCK.notifications otherwise. */
  async getNotifications() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listNotifications();
        return rows.map(n => ({
          id:     n.id,
          icon:   _notifIcon(n.type),
          color:  _notifColor(n.type),
          /* n.content is user/DB-supplied text -> must be escaped before
             it reaches an innerHTML template. _notifDefaultText() already
             escapes the actor's name internally. */
          text:   n.content ? escapeHtml(n.content) : _notifDefaultText(n),
          time:   _relTime(n.created_at),
          unread: !n.read_at,
        }));
      } catch (err) {
        console.warn('[WorldHub] getNotifications fell back to mock:', err.message);
      }
    }
    return MOCK.notifications;
  },

  async markAllNotificationsRead() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try { await DB.markAllNotificationsRead(); return true; } catch (err) { console.warn(err.message); }
    }
    return false;
  },

  async markNotificationRead(id) {
    if (typeof DB !== 'undefined' && DB.isConnected && id) {
      try { await DB.markNotificationRead(id); return true; } catch (err) { console.warn(err.message); }
    }
    return false;
  },

  /* ── Unread badge counts (topbar nav) ── */
  async getUnreadCounts() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const [messages, notifications] = await Promise.all([
          DB.getUnreadMessageCount(), DB.getUnreadNotificationCount(),
        ]);
        return { messages, notifications };
      } catch (err) {
        console.warn('[WorldHub] getUnreadCounts failed:', err.message);
      }
    }
    return null; // signal "unknown" so caller can decide whether to keep static badge or hide it
  },

  /* ── Conversations ── */
  async getConversations() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const convs = await DB.listConversations();
        return convs.map(c => ({
          name:    (c.other.first_name + ' ' + (c.other.last_name || '')).trim(),
          avatar:  c.other.avatar_url || 'https://i.pravatar.cc/80?u=' + c.other.id,
          preview: c.lastMessage?.content || '',
          time:    _relTime(c.lastMessage?.created_at),
          online:  false,
          unread:  c.unread || 0,
          otherId: c.other.id,
        }));
      } catch (err) {
        console.warn('[WorldHub] getConversations fell back to mock:', err.message);
      }
    }
    return MOCK.conversations;
  },

  /* ── Full message thread with one other user ── */
  async getMessages(otherId) {
    if (typeof DB !== 'undefined' && DB.isConnected && otherId) {
      try {
        const rows = await DB.listMessages(otherId);
        const me = await DB.getCurrentUser();
        return rows.map(m => ({
          from: m.sender_id === me.id ? 'me' : 'them',
          text: m.content,
          time: _relTime(m.created_at),
        }));
      } catch (err) {
        console.warn('[WorldHub] getMessages fell back to mock:', err.message);
      }
    }
    return MOCK.chatThread;
  },

  /* ── Send message ── */
  async sendMessage(recipientId, content) {
    if (typeof DB !== 'undefined' && DB.isConnected && recipientId) {
      return DB.sendMessage(recipientId, content);
    }
    console.log('sendMessage->mock', recipientId, content);
    return true;
  },

  /* ── Create post (Issue 3, 5: text + image uploads) ── */
  async createPost(content, worldId, imageUrl) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      return DB.createPost({ content, worldId, imageUrl: imageUrl || null });
    }
    console.log('createPost->mock', content, imageUrl);
    return true;
  },

  /* ── Toggle follow ── */
  async toggleFollow(userId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      return DB.toggleFollow(userId);
    }
    console.log('toggleFollow->mock', userId);
    return true;
  },

  /* ── Toggle like ── */
  async toggleLike(postId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      return DB.toggleLike(postId);
    }
    console.log('toggleLike->mock', postId);
    return true;
  },

  /* ── Current user profile (Issues 3, 5) ──
     Returns a normalised profile object.
     Falls back to MOCK.user when Supabase is unavailable. */
  async getCurrentProfile() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const user = await DB.getCurrentUser();
        if (user) {
          const profile = await DB.getProfile(user.id);
          const counts  = await DB.getFollowCounts(user.id);
          return {
            id:        user.id,
            name:      (profile.first_name + ' ' + (profile.last_name || '')).trim(),
            handle:    profile.handle     || '@user',
            avatar:    profile.avatar_url || MOCK.user.avatar,
            cover:     profile.cover_url  || null,
            bio:       profile.bio        || MOCK.user.bio,
            followers: counts.followers,
            following: counts.following,
            posts:     MOCK.user.posts, /* post count requires separate query — extendable */
          };
        }
      } catch (err) {
        console.warn('[WorldHub] getCurrentProfile fell back to mock:', err.message);
      }
    }
    return { ...MOCK.user, id: null };
  },

  /* ── Profile photo uploads (Issues 7/8) ──
     Validate type/size client-side, then upload via Supabase Storage.
     Without a backend connection, fall back to a local object URL so
     the UI still previews the change during the session. */
  async uploadAvatar(file) {
    _validateProfileImage(file);
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.uploadAvatar(file);
    console.log('uploadAvatar->mock', file.name);
    return URL.createObjectURL(file);
  },
  async uploadCover(file) {
    _validateProfileImage(file);
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.uploadCover(file);
    console.log('uploadCover->mock', file.name);
    return URL.createObjectURL(file);
  },

  /* ── Companies ── */
  async getCompanies() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listCompanies();
        const user = await DB.getCurrentUser();
        let followingIds = new Set();
        if (user) {
          const { data } = await DB.sbClient.from('company_followers').select('company_id').eq('user_id', user.id);
          followingIds = new Set((data||[]).map(r=>r.company_id));
        }
        return rows.map(c => ({
          id: c.id, name: c.name, sector: c.sector || '',
          followers: String(c.company_followers?.[0]?.count ?? 0),
          openJobs: c.jobs?.[0]?.count ?? 0,
          isFollowing: followingIds.has(c.id),
        }));
      } catch (err) { console.warn('[WorldHub] getCompanies fell back to mock:', err.message); }
    }
    return MOCK.companies;
  },
  async followCompany(companyId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.toggleFollowCompany(companyId);
    console.log('followCompany->mock', companyId);
    return true;
  },

  /* ── Jobs ── */
  async getJobs() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listJobs();
        return rows.map(j => ({
          id: j.id, title: j.title, company: j.company?.name || '',
          place: j.is_remote ? 'Remote' : (j.location || ''), type: j.job_type,
          tag: j.world_id || '', posted: _relTime(j.created_at),
        }));
      } catch (err) { console.warn('[WorldHub] getJobs fell back to mock:', err.message); }
    }
    return MOCK.jobs;
  },
  async applyToJob(jobId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.applyToJob(jobId);
    console.log('applyToJob->mock', jobId);
    return true;
  },

  /* ── Events ── */
  async getEvents() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listEvents();
        return rows.map(e => {
          const d = new Date(e.starts_at);
          return {
            id: e.id, day: String(d.getDate()).padStart(2,'0'),
            mon: d.toLocaleDateString('fr-FR', { month:'short' }).toUpperCase(),
            title: e.title, place: e.is_online ? 'En ligne' : (e.location || ''),
            desc: e.description || '',
            going: `${(e.event_attendees||[]).filter(a=>a.status==='going').length} participants`,
          };
        });
      } catch (err) { console.warn('[WorldHub] getEvents fell back to mock:', err.message); }
    }
    return MOCK.events;
  },
  async rsvpEvent(eventId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.rsvpEvent(eventId, 'going');
    console.log('rsvpEvent->mock', eventId);
    return true;
  },

  /* ── Marketplace ── */
  async getListings() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listListings();
        return rows.map(l => {
          const ratings = (l.listing_reviews||[]).map(r=>r.rating);
          const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : '—';
          return {
            id: l.id, title: l.title,
            seller: l.seller ? (l.seller.first_name+' '+(l.seller.last_name||'')).trim() : 'Vendeur',
            price: (l.price_cents/100).toLocaleString('fr-FR', { style:'currency', currency:l.currency||'EUR' }),
            rating: avg, tag: l.category || '',
          };
        });
      } catch (err) { console.warn('[WorldHub] getListings fell back to mock:', err.message); }
    }
    return MOCK.listings;
  },
  async orderListing(listingId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.orderListing(listingId);
    console.log('orderListing->mock', listingId);
    return true;
  },

  /* ── Worlds ── */
  async joinWorld(worldId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.joinWorld(worldId);
    console.log('joinWorld->mock', worldId);
    return true;
  },

  /* ── Comments (Issue: comment button only ever linked to create-post.html,
     there was no way to actually post a reply) ── */
  async addComment(postId, content) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.addComment(postId, content);
    console.log('addComment->mock', postId, content);
    return {
      id: 'mock-' + Date.now(),
      content,
      author: { first_name: MOCK.user.name.split(' ')[0], last_name: MOCK.user.name.split(' ').slice(1).join(' '), avatar_url: MOCK.user.avatar },
    };
  },

  /* ── Create-company / create-job / create-event / create-listing —
     the DB layer already supported these (DB.createCompany, DB.createJob,
     DB.createEvent, DB.createListing) but nothing in app.js exposed them,
     so the "+ Créer ..." buttons on those pages had nowhere to call. ── */
  async createCompany(payload) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.createCompany(payload);
    console.log('createCompany->mock', payload);
    return { id: 'mock-' + Date.now(), ...payload };
  },
  async createJob(payload) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.createJob(payload);
    console.log('createJob->mock', payload);
    return { id: 'mock-' + Date.now(), ...payload };
  },
  async createEvent(payload) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.createEvent(payload);
    console.log('createEvent->mock', payload);
    return { id: 'mock-' + Date.now(), ...payload };
  },
  async createListing(payload) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.createListing(payload);
    console.log('createListing->mock', payload);
    return { id: 'mock-' + Date.now(), ...payload };
  },

  /* ── Saved posts (used by the "Enregistré" tab on profile.html) ── */
  async getSavedPosts() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listSavedPosts();
        return rows.map(p => ({
          id: p.id,
          author: p.author ? (p.author.first_name + ' ' + (p.author.last_name || '')).trim() : 'Utilisateur',
          time: _relTime(p.created_at),
          text: p.content || '',
          likes: Array.isArray(p.likes) ? p.likes.length : 0,
          comments: Array.isArray(p.comments) ? p.comments.length : 0,
        }));
      } catch (err) { console.warn('[WorldHub] getSavedPosts failed:', err.message); }
    }
    return [];
  },

  /* ── Update profile (Issue: "Modifier le profil" had no handler) ── */
  async updateProfile(patch) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      const user = await DB.getCurrentUser();
      if (!user) throw new Error('Vous devez être connecté pour modifier votre profil.');
      return DB.updateProfile(user.id, patch);
    }
    console.log('updateProfile->mock', patch);
    Object.assign(MOCK.user, patch);
    return true;
  },

  /* ── Dashboard ── */
  async getDashboardStats() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const [summary, daily] = await Promise.all([DB.getDashboardSummary(), DB.getDailyInteractions(14)]);
        return {
          posts: summary?.post_count ?? 0,
          followers: summary?.follower_count ?? 0,
          interactions: summary?.interaction_count ?? 0,
          views: summary?.view_count ?? 0,
          daily: (daily || []).map(d => d.interactions),
        };
      } catch (err) { console.warn('[WorldHub] getDashboardStats fell back to mock:', err.message); }
    }
    return null; // caller keeps the static mock numbers already in dashboard.html
  },
};

/* ── Notification display helpers (map DB `type` -> icon/color/text) ── */
function _notifIcon(type){
  return { like:'❤️', comment:'💬', follow:'➕', mention:'📣', share:'🔄', system:'🌍' }[type] || '🔔';
}
function _notifColor(type){
  return { like:'pink', comment:'blue', follow:'accent', mention:'accent', share:'green', system:'yellow' }[type] || 'accent';
}
function _notifDefaultText(n){
  const who = n.actor ? (n.actor.first_name + ' ' + (n.actor.last_name || '')).trim() : 'Quelqu\'un';
  const map = {
    like:'a aimé votre publication', comment:'a commenté votre publication',
    follow:'a commencé à vous suivre', mention:'vous a mentionné dans un commentaire',
    share:'a partagé votre publication',
  };
  return `${escapeHtml(who)} ${map[n.type] || 'a interagi avec votre contenu'}`;
}

/* ── Shared image validation for avatar/cover uploads ──
   Same rules as post-media uploads in create-post.html: JPG/PNG/WEBP/GIF,
   max 8 Mo. Throws a user-facing error (in French, shown via showError). */
const PROFILE_IMG_ALLOWED_TYPES = ['image/jpeg','image/png','image/webp','image/gif'];
const PROFILE_IMG_MAX_MB = 8;
function _validateProfileImage(file){
  if (!file) throw new Error('Aucun fichier sélectionné.');
  if (!PROFILE_IMG_ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Format non supporté : ${file.name}. Utilisez JPG, PNG, WEBP ou GIF.`);
  }
  if (file.size > PROFILE_IMG_MAX_MB * 1024 * 1024) {
    throw new Error(`"${file.name}" dépasse la taille maximale de ${PROFILE_IMG_MAX_MB} Mo.`);
  }
}

/* ── Relative time helper ── */
function _relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'à l\'instant';
  if (mins < 60)  return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}
