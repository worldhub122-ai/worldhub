/* ==========================================================
   WorldHub — app.js  (Updated: Supabase-aware)
   Layout, mock data (fallback), interactions, and real-data
   bridge via the `api` object at the bottom.
   ========================================================== */

const NAV = [
  { id:'home',          icon:'🏠', label:'Accueil',            href:'index.html' },
  { id:'reels',         icon:'🎬', label:'Reels',               href:'reels.html' },
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
  { id:'worlds',       icon:'🧭', label:'Explorer les Mondes', href:'worlds.html' },
  { id:'div2' },
  { id:'jobs',        icon:'🧰', label:'Offres d\'emploi', href:'jobs.html' },
  { id:'companies',   icon:'🏢', label:'Entreprises',     href:'companies.html' },
  { id:'events',      icon:'📅', label:'Événements',      href:'events.html' },
  { id:'marketplace', icon:'🛒', label:'Marketplace',     href:'marketplace.html' },
  { id:'plus',        icon:'⋯', label:'Plus',            href:'#' },
];

/* ── Mock data (used as fallback when Supabase is not connected) ──
   Issue: cet objet contenait de faux utilisateurs "démo" (Alex Dev,
   Sarah Parker, John Doe, John Smith, Mike Wilson, Emma Davis, des
   vendeurs de la marketplace...) qui apparaissaient partout dans
   l'interface (fil d'actualité, top membres, notifications, reels,
   marketplace) même quand Supabase était connecté avec de vrais
   comptes. Tous les faux profils ont été retirés : `user` est
   désormais un profil "invité" neutre et générique (pas une personne
   inventée), et les listes qui contenaient des personnes fictives
   (posts, topMembers, notifications, reels, listings) sont vides —
   l'app affiche un vrai état vide ("Aucune publication", etc.) au
   lieu d'inventer du contenu attribué à des gens qui n'existent pas. */
const MOCK = {
  user: { name:'Invité', handle:'@invite', avatar:'https://ui-avatars.com/api/?name=?&background=2a2a3a&color=9a97ad&size=150',
          bio:'', posts:0, followers:0, following:0 },

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

  posts: [],

  trending: ['#JavaScript','#Flutter','#AI','#RemoteDev','#WebDesign'],

  topMembers: [],

  events: [
    { day:'15', mon:'JUIN', title:'Flutter World Conference', place:'En ligne', desc:'La plus grande conférence Flutter de l\'année avec des experts du monde entier.', going:'1.2k participants' },
    { day:'22', mon:'JUIN', title:'IA & ML Summit 2024', place:'Paris, France', desc:'Rassemblement des meilleurs esprits en Machine Learning.', going:'850 participants' },
    { day:'05', mon:'JUIL', title:'Web Dev Bootcamp', place:'Lyon, France', desc:'Bootcamp intensif sur les technologies web modernes.', going:'150 participants' },
  ],

  notifications: [],

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

  /* Fallback reels used only when Supabase isn't connected. Previously
     seeded with fake authors (Sarah Parker, Alex Dev, John Doe) —
     left empty so the page shows a real "no reels yet" state instead
     of content attributed to people who don't exist. */
  reels: [],

  listings: [],
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

/* ── @Mentions / #Hashtags rendering (Issue: post text was pure escaped
   text — no way to tell a mention/hashtag was clickable). Escapes first
   for XSS safety, THEN turns @handle / #tag into links. Both link to
   search.html since there's no public per-user profile page yet. ── */
function renderPostText(text){
  const escaped = escapeHtml(text);
  return escaped
    .replace(/(^|[^\w@])@([a-zA-Z0-9_.]{2,32})/g, (m, pre, handle) =>
      `${pre}<a href="search.html?q=${encodeURIComponent('@'+handle)}" style="color:var(--accent-2);font-weight:600;text-decoration:none" onclick="event.stopPropagation()">@${handle}</a>`)
    .replace(/(^|[^\w#])#([\p{L}0-9_]{2,50})/gu, (m, pre, tag) =>
      `${pre}<a href="search.html?q=${encodeURIComponent('#'+tag)}" style="color:var(--accent-2);font-weight:600;text-decoration:none" onclick="event.stopPropagation()">#${tag}</a>`);
}

/* ── Shared post "..." menu (Modifier / Supprimer) — only rendered for
   the post's own author. Uses a single `pid` per feed row (see
   _mapPostRow: `pid` = the *actionable* post id — the original post's id
   for a plain repost, or the row's own id otherwise). NOTE: if the same
   original post is repost by two different people and both show up in
   the same feed load, they will share one `pid` and thus one menu DOM id
   — an accepted edge-case limitation, not a correctness issue for
   likes/comments/edits themselves. ── */
let _feedUserId = null;
let _feedPostsById = {};
function moreMenuHTML(p){
  const pid = p.actionId || p.id;
  if(!_feedUserId || String(p.authorId) !== String(_feedUserId)){
    return `<span class="more">⋯</span>`;
  }
  return `
  <span class="more" style="cursor:pointer;position:relative" onclick="toggleMoreMenu(event,'${pid}')">⋯
    <div class="more-menu" id="moremenu-${pid}" hidden style="position:absolute;top:22px;right:0;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);min-width:150px;z-index:20;box-shadow:0 8px 20px rgba(0,0,0,.4);text-align:left">
      <div class="row" style="padding:10px 14px;cursor:pointer" onclick="event.stopPropagation();openEditPostModal('${pid}')">✏️ Modifier</div>
      <div class="row" style="padding:10px 14px;cursor:pointer;color:var(--red)" onclick="event.stopPropagation();handleDeletePost('${pid}')">🗑️ Supprimer</div>
    </div>
  </span>`;
}
function _closeAllFloatingMenus(){
  document.querySelectorAll('.more-menu').forEach(m=>m.hidden = true);
}
function toggleMoreMenu(evt, pid){
  evt.stopPropagation();
  const el = document.getElementById('moremenu-' + pid);
  const wasHidden = el ? el.hidden : true;
  _closeAllFloatingMenus();
  if(el) el.hidden = !wasHidden;
}
function _wireFloatingMenuOutsideClick(){
  if(window._whMenuOutsideWired) return;
  window._whMenuOutsideWired = true;
  document.addEventListener('click', _closeAllFloatingMenus);
}

function openEditPostModal(pid){
  document.getElementById('moremenu-'+pid)?.setAttribute('hidden','');
  const p = _feedPostsById[pid];
  if(!p) return;
  openModal(`
    <h3 style="margin:0 0 16px">Modifier la publication</h3>
    <div class="field"><textarea id="editPostText" rows="5">${escapeHtml(p.text)}</textarea></div>
    <div id="editPostErr" class="err-msg" hidden style="background:var(--red-soft);border:1px solid var(--red);color:var(--text-1);border-radius:var(--radius-sm);padding:10px 14px;font-size:13px;margin-bottom:12px"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" id="editPostSubmit" onclick="submitEditPost('${pid}')">Enregistrer</button>
    </div>`);
}
async function submitEditPost(pid){
  const text = document.getElementById('editPostText').value.trim();
  const errEl = document.getElementById('editPostErr');
  if(!text){ errEl.textContent = 'Le contenu ne peut pas être vide.'; errEl.hidden = false; return; }
  const btn = document.getElementById('editPostSubmit');
  btn.disabled = true; btn.textContent = 'Enregistrement...';
  try{
    await api.updatePost(pid, text);
    closeModal();
    showToast('Publication modifiée ✓', 'success');
    if (typeof render === 'function') render();
  }catch(err){
    errEl.textContent = err.message || 'Impossible de modifier cette publication.';
    errEl.hidden = false;
    btn.disabled = false; btn.textContent = 'Enregistrer';
  }
}
async function handleDeletePost(pid){
  document.getElementById('moremenu-'+pid)?.setAttribute('hidden','');
  if(!confirm('Supprimer définitivement cette publication ?')) return;
  try{
    await api.deletePost(pid);
    showToast('Publication supprimée ✓', 'success');
    if (typeof render === 'function') render();
  }catch(err){
    showError(err);
  }
}

/* ── Repost / Quote-repost menu (Issue: "🔄 Partager" only ever copied a
   link — there was no real repost-inside-the-platform feature at all) ── */
function repostButtonHTML(p){
  const pid = p.actionId || p.id;
  return `
  <div class="a-btn" style="position:relative" onclick="toggleRepostMenu(event,'${pid}')">
    <span>${p.hasReposted ? '✅' : '🔁'}</span> Republier <span class="count" id="repostcount-${pid}">${p.repostCount || 0}</span>
    <div class="more-menu" id="repostmenu-${pid}" hidden style="position:absolute;bottom:34px;left:0;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);min-width:190px;z-index:20;box-shadow:0 8px 20px rgba(0,0,0,.4);text-align:left">
      <div class="row" style="padding:10px 14px;cursor:pointer" onclick="event.stopPropagation();handleSimpleRepost('${pid}')">🔁 ${p.hasReposted ? 'Annuler la republication' : 'Republier'}</div>
      <div class="row" style="padding:10px 14px;cursor:pointer" onclick="event.stopPropagation();openQuoteRepostModal('${pid}')">💬 Citer</div>
    </div>
  </div>`;
}
function toggleRepostMenu(evt, pid){
  evt.stopPropagation();
  const el = document.getElementById('repostmenu-' + pid);
  const wasHidden = el ? el.hidden : true;
  _closeAllFloatingMenus();
  if(el) el.hidden = !wasHidden;
}
async function handleSimpleRepost(pid){
  document.getElementById('repostmenu-'+pid)?.setAttribute('hidden','');
  try{
    const res = await api.toggleRepost(pid);
    showToast(res.reposted ? 'Republié ✓' : 'Republication annulée', 'success');
    if (typeof render === 'function') render();
  }catch(err){ showError(err); }
}
function openQuoteRepostModal(pid){
  document.getElementById('repostmenu-'+pid)?.setAttribute('hidden','');
  openModal(`
    <h3 style="margin:0 0 16px">Citer la publication</h3>
    <div class="field"><textarea id="quoteText" rows="4" placeholder="Ajoutez un commentaire (optionnel)..."></textarea></div>
    <div id="quoteErr" class="err-msg" hidden style="background:var(--red-soft);border:1px solid var(--red);color:var(--text-1);border-radius:var(--radius-sm);padding:10px 14px;font-size:13px;margin-bottom:12px"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" id="quoteSubmit" onclick="submitQuoteRepost('${pid}')">Republier</button>
    </div>`);
}
async function submitQuoteRepost(pid){
  const text = document.getElementById('quoteText').value.trim();
  const btn = document.getElementById('quoteSubmit');
  btn.disabled = true; btn.textContent = 'Publication...';
  try{
    await api.quoteRepost(pid, text);
    closeModal();
    showToast('Republié avec citation ✓', 'success');
    if (typeof render === 'function') render();
  }catch(err){
    const errEl = document.getElementById('quoteErr');
    errEl.textContent = err.message || 'Impossible de republier.';
    errEl.hidden = false;
    btn.disabled = false; btn.textContent = 'Republier';
  }
}

/* ── Repost banner + embedded quoted-post preview (shared by
   index.html's postCard() and world.html's worldPostCard()) ── */
function repostBannerHTML(p){
  if(!p.isRepost) return '';
  return `<div style="display:flex;align-items:center;gap:6px;padding:10px 16px 0;color:var(--text-3);font-size:12.5px">
    🔁 <b style="color:var(--text-2)">${escapeHtml(p.repostedBy.name)}</b> a republié · ${escapeHtml(p.repostedBy.time)}
  </div>`;
}
function quotedPostHTML(p){
  if(!p.quoteOf) return '';
  const q = p.quoteOf;
  return `
  <div style="margin-top:10px;border:1px solid var(--border);border-radius:10px;padding:10px 12px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <img class="avatar" src="${q.avatarUrl || 'https://i.pravatar.cc/60?u='+encodeURIComponent(q.handle)}" style="width:24px;height:24px">
      <b style="font-size:13px">${escapeHtml(q.author)}</b>
      <span style="color:var(--text-3);font-size:12px">${escapeHtml(q.handle)} · ${escapeHtml(q.time)}</span>
    </div>
    <div style="font-size:13.5px;color:var(--text-2)">${renderPostText(q.text)}</div>
    ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-width:100%;border-radius:8px;margin-top:8px;display:block">` : ''}
    ${q.videoUrl ? `<video src="${q.videoUrl}" controls style="max-width:100%;border-radius:8px;margin-top:8px;display:block"></video>` : ''}
  </div>`;
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
      <input type="text" id="topbarSearchInput" placeholder="Rechercher des personnes, publications, mondes..." onkeydown="if(event.key==='Enter') handleTopbarSearch(this.value)">
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
    <div class="card-head"><h3>Découvrir des Mondes</h3><span class="link" onclick="location.href='worlds.html'">Voir tout</span></div>
    ${MOCK.worlds.slice(0,4).map(w=>`
      <div class="row" style="cursor:pointer" onclick="location.href='world.html?id=${encodeURIComponent(w.id)}'">
        ${tile(w.icon,w.color)}
        <div><div class="row-title">${w.name}</div><div class="row-sub">${w.members} membres</div></div>
        <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="event.stopPropagation();location.href='world.html?id=${encodeURIComponent(w.id)}'">Voir</button>
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

/* ---------------- SEARCH (Issue: la barre de recherche de la topbar
   n'était reliée à rien — elle ne faisait littéralement rien) ---------------- */
function handleTopbarSearch(query){
  const q = (query || '').trim();
  if (!q) return;
  window.location.href = 'search.html?q=' + encodeURIComponent(q);
}
/* ⌘K / Ctrl+K focuses the topbar search box, wherever the user is */
function _wireSearchShortcut(){
  if (window._whSearchShortcutWired) return;
  window._whSearchShortcutWired = true;
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      const input = document.getElementById('topbarSearchInput');
      if (input) { e.preventDefault(); input.focus(); }
    }
  });
}

/* ================================================================
   POLL WIDGET (Issue: "📊 Sondage" only ever composed a plain-text
   block into the post's content — there was no real vote-counting UI.
   Shared here so both index.html and world.html render/vote the same
   way. A post only gets a live widget if `p.pollId` is set (see
   getFeed()/getWorldPosts() above), which only happens when the DB
   actually has a matching row in `polls`. ================================ */
function pollPlaceholderHTML(post){
  if (!post.pollId) return '';
  return `<div class="poll-widget" id="poll-${post.id}" style="margin-top:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px 14px">
    <div style="font-size:12.5px;color:var(--text-3)">Chargement du sondage...</div>
  </div>`;
}
function _pollOptionRowHTML(postId, poll, opt, totalVotes){
  const pct = totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0;
  const isMine = poll.myVote === opt.id;
  const voted = !!poll.myVote;
  return `
    <div class="poll-option" style="position:relative;margin-bottom:8px;${voted?'':'cursor:pointer'}" ${voted ? '' : `onclick="handlePollVote('${postId}','${poll.id}','${opt.id}')"`}>
      <div style="position:absolute;inset:0;border-radius:8px;background:${isMine?'var(--accent-soft)':'var(--surface-2)'};width:${voted ? pct : 0}%;transition:width .25s"></div>
      <div style="position:relative;display:flex;justify-content:space-between;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px">
        <span>${escapeHtml(opt.label)}${isMine?' ✓':''}</span>
        ${voted ? `<span style="color:var(--text-3);flex:none">${pct}%</span>` : ''}
      </div>
    </div>`;
}
async function _hydratePoll(postId){
  const el = document.getElementById('poll-' + postId);
  if (!el) return;
  const poll = await api.getPoll(postId);
  if (!poll) { el.remove(); return; }
  const totalVotes = poll.options.reduce((s,o)=>s+o.votes, 0);
  el.innerHTML = `
    <div style="font-weight:700;font-size:13.5px;margin-bottom:10px">📊 ${escapeHtml(poll.question)}</div>
    ${poll.options.map(o=>_pollOptionRowHTML(postId, poll, o, totalVotes)).join('')}
    <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">${totalVotes} vote${totalVotes===1?'':'s'}</div>`;
}
async function handlePollVote(postId, pollId, optionId){
  if (typeof DB !== 'undefined' && DB.isConnected) {
    const session = await DB.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
  }
  try {
    await api.votePoll(pollId, optionId);
    await _hydratePoll(postId);
  } catch (err) {
    showError ? showError(err) : console.error(err);
  }
}
/* Call once after a batch of posts has been injected into the DOM */
function hydratePollsIn(posts){
  (posts || []).filter(p => p.pollId).forEach(p => _hydratePoll(p.id));
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
  _wireSearchShortcut();
  _wireFloatingMenuOutsideClick();
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
/* ── Normalise one Supabase `posts` row into the shape the UI expects.
   Shared by getFeed()/getWorldPosts() (Issue: repost/quote-repost had no
   UI at all — this is where a repost row gets turned into "show the
   original post's content, with a small banner on top"). ── */
function _mapPostRow(p){
  const isSimpleRepost = !!p.repost_of && !p.content && !!p.original;
  const base = isSimpleRepost ? p.original : p;
  const baseAuthor = base.author;
  return {
    id:       p.id,
    /* actionId = the post that likes/comments/edits/reposts actually apply
       to: the ORIGINAL post for a plain repost, or the row itself otherwise. */
    actionId: isSimpleRepost ? (p.original?.id || p.repost_of) : p.id,
    authorId: baseAuthor?.id || null,
    author:   baseAuthor ? (baseAuthor.first_name + ' ' + (baseAuthor.last_name || '')).trim() : 'Utilisateur',
    handle:   baseAuthor?.handle || '@user',
    time:     _relTime(base.created_at),
    world:    base.world_id || '',
    text:     base.content || '',
    likes:    Array.isArray(base.likes)    ? base.likes.length    : 0,
    comments: Array.isArray(base.comments) ? base.comments.length : 0,
    commentList: Array.isArray(base.comments) ? base.comments : [],
    shares:   0,
    avatarUrl: baseAuthor?.avatar_url || null,
    imageUrl: base.image_url || null,
    videoUrl: base.video_url || null,
    pollId: (Array.isArray(base.polls) ? base.polls[0]?.id : base.polls?.id) || null,
    isRepost: isSimpleRepost,
    repostedBy: isSimpleRepost ? {
      name: p.author ? (p.author.first_name + ' ' + (p.author.last_name || '')).trim() : 'Utilisateur',
      time: _relTime(p.created_at),
    } : null,
    quoteOf: (!isSimpleRepost && p.repost_of && p.original) ? {
      id: p.original.id,
      author: p.original.author ? (p.original.author.first_name + ' ' + (p.original.author.last_name || '')).trim() : 'Utilisateur',
      handle: p.original.author?.handle || '@user',
      avatarUrl: p.original.author?.avatar_url || null,
      text: p.original.content || '',
      imageUrl: p.original.image_url || null,
      videoUrl: p.original.video_url || null,
      time: _relTime(p.original.created_at),
    } : null,
  };
}

/* Fetch repost counts/state for a batch of mapped posts and merge them
   in-place (one query for the whole feed instead of one per post). */
async function _hydrateRepostStats(mapped){
  const ids = [...new Set(mapped.map(m => m.actionId).filter(Boolean))];
  if (!ids.length) return mapped;
  try {
    const stats = await DB.getRepostStats(ids);
    mapped.forEach(m => {
      const s = stats[m.actionId];
      m.repostCount = s ? s.count : 0;
      m.hasReposted = s ? s.reposted : false;
    });
  } catch (err) {
    console.warn('[WorldHub] getRepostStats failed:', err.message);
    mapped.forEach(m => { m.repostCount = 0; m.hasReposted = false; });
  }
  return mapped;
}

/* ── Normalise one Supabase `reels` row into the shape reels.html expects.
   Mirrors _mapPostRow() above but for the reels table (separate from
   posts: no repost/quote/poll concepts apply to reels). ── */
function _mapReelRow(r){
  return {
    id: r.id,
    authorId: r.author?.id || null,
    author: r.author ? (r.author.first_name + ' ' + (r.author.last_name || '')).trim() : 'Utilisateur',
    handle: r.author?.handle || '@user',
    avatarUrl: r.author?.avatar_url || null,
    caption: r.caption || '',
    videoUrl: r.video_url,
    thumbnailUrl: r.thumbnail_url || null,
    world: r.world_id || '',
    time: _relTime(r.created_at),
    views: r.view_count || 0,
    likes: Array.isArray(r.reel_likes) ? r.reel_likes.length : 0,
    comments: Array.isArray(r.reel_comments) ? r.reel_comments.length : 0,
    commentList: Array.isArray(r.reel_comments) ? r.reel_comments : [],
  };
}

const api = {

  /* ── Feed (Issue 4) ── */
  async getFeed() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listPosts({ limit: 30 });
        const mapped = rows.map(_mapPostRow);
        await _hydrateRepostStats(mapped);
        return mapped;
      } catch (err) {
        console.warn('[WorldHub] getFeed fell back to mock:', err.message);
      }
    }
    return MOCK.posts;
  },

  /* ── Posts by a specific author (Issue: profile.html's "Publications"
     tab always rendered MOCK.posts, even when Supabase was connected —
     it never actually queried the real posts table for the user). ── */
  async getUserPosts(authorId) {
    if (typeof DB !== 'undefined' && DB.isConnected && authorId) {
      try {
        const rows = await DB.listPosts({ authorId, limit: 30 });
        const mapped = rows.map(_mapPostRow);
        await _hydrateRepostStats(mapped);
        return mapped;
      } catch (err) {
        console.warn('[WorldHub] getUserPosts fell back to mock:', err.message);
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
            description: w.description || '', createdBy: w.created_by || null,
          }));
        }
      } catch (err) {
        console.warn('[WorldHub] getWorlds fell back to mock:', err.message);
      }
    }
    return MOCK.worlds;
  },

  /* ── Single world (by id/slug) ── used by world.html to know which
     world it's rendering (name, icon, member count, description).
     Issue: this used to reuse getWorlds()'s mapped shape, which never
     carried `description`/`createdBy` — world.html always showed the
     generic placeholder text instead of the real description. ── */
  async getWorld(worldId) {
    const worlds = await this.getWorlds();
    const found = worlds.find(w => String(w.id) === String(worldId));
    if (found) return found;
    return MOCK.worlds.find(w => w.id === worldId) || MOCK.worlds[0];
  },

  /* ── Create a brand-new world (Issue: no UI/API existed at all to
     create a world — the sidebar only ever showed 4 hardcoded ones). ── */
  async createWorld({ id, name, icon, color, description }) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      return DB.createWorld({ id, name, icon, color, description });
    }
    console.log('createWorld->mock', id, name);
    const w = { id, name, icon: icon || '🌍', color: color || 'accent', description: description || '', members: '0' };
    MOCK.worlds.push(w);
    return w;
  },

  /* ── Edit a world's name/icon/color/description (owner/admin only —
     enforced server-side by RLS; the button is also hidden client-side
     for non-admins). ── */
  async updateWorld(worldId, patch) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.updateWorld(worldId, patch);
    console.log('updateWorld->mock', worldId, patch);
    const w = MOCK.worlds.find(w => w.id === worldId);
    if (w) Object.assign(w, patch);
    return w;
  },

  /* ── Delete a world (owner only). ── */
  async deleteWorld(worldId) {
    if (typeof DB !== 'undefined' && DB.isConnected) { await DB.deleteWorld(worldId); return true; }
    console.log('deleteWorld->mock', worldId);
    MOCK.worlds = MOCK.worlds.filter(w => w.id !== worldId);
    return true;
  },

  /* ── Current user's role in a world: 'owner' | 'admin' | 'member' | null.
     Used to decide whether to show "⚙️ Gérer" / member-management controls. ── */
  async getWorldRole(worldId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try { return await DB.getMyWorldRole(worldId); } catch (err) { console.warn('[WorldHub] getWorldRole failed:', err.message); }
    }
    return null;
  },

  /* ── Member list for the "Membres" tab, with role badges. ── */
  async getWorldMembers(worldId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.getWorldMembers(worldId);
        return rows.map(r => ({
          id: r.profile?.id || r.user_id,
          name: r.profile ? (r.profile.first_name + ' ' + (r.profile.last_name || '')).trim() : 'Utilisateur',
          handle: r.profile?.handle || '',
          avatar: r.profile?.avatar_url || `https://i.pravatar.cc/80?u=${r.user_id}`,
          role: r.role,
        }));
      } catch (err) { console.warn('[WorldHub] getWorldMembers failed:', err.message); }
    }
    return [];
  },
  async setWorldMemberRole(worldId, userId, role) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.updateWorldMemberRole(worldId, userId, role);
    console.log('setWorldMemberRole->mock', worldId, userId, role);
    return true;
  },
  async removeWorldMember(worldId, userId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.removeWorldMember(worldId, userId);
    console.log('removeWorldMember->mock', worldId, userId);
    return true;
  },

  /* ── Invite a user (by profile id) to a world — creates a real
     notification for them (Issue: no invite mechanism existed). ── */
  async inviteToWorld(worldId, invitedUserId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.inviteToWorld(worldId, invitedUserId);
    console.log('inviteToWorld->mock', worldId, invitedUserId);
    return true;
  },

  /* ── Resources tab ── */
  async getWorldResources(worldId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listWorldResources(worldId);
        return rows.map(r => ({
          id: r.id, title: r.title, url: r.url, type: r.resource_type,
          addedBy: r.added_by ? (r.added_by.first_name + ' ' + (r.added_by.last_name || '')).trim() : 'Utilisateur',
        }));
      } catch (err) { console.warn('[WorldHub] getWorldResources failed:', err.message); }
    }
    return [];
  },
  async addWorldResource(worldId, { title, url, resourceType }) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.addWorldResource(worldId, { title, url, resourceType });
    console.log('addWorldResource->mock', worldId, title, url);
    return { id: 'mock-' + Date.now(), title, url, type: resourceType || 'link', addedBy: MOCK.user.name };
  },
  async deleteWorldResource(resourceId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.deleteWorldResource(resourceId);
    console.log('deleteWorldResource->mock', resourceId);
    return true;
  },

  /* ── Search scoped to a single world's posts (Issue: no way to search
     inside a world — only the global topbar search existed). ── */
  async searchInWorld(worldId, query) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.searchWorldPosts(worldId, query);
        const mapped = rows.map(_mapPostRow);
        await _hydrateRepostStats(mapped);
        return mapped;
      } catch (err) { console.warn('[WorldHub] searchInWorld failed:', err.message); }
    }
    const q = (query || '').toLowerCase();
    const world = MOCK.worlds.find(w => w.id === worldId);
    return MOCK.posts.filter(p => p.world === (world ? world.name : worldId) && p.text.toLowerCase().includes(q));
  },

  /* ── Posts scoped to a single world ── */
  async getWorldPosts(worldId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listPosts({ worldId });
        const mapped = rows.map(_mapPostRow);
        await _hydrateRepostStats(mapped);
        return mapped;
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
          type:   n.type || 'system',
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

  /* ── Conversations ──
     Issue fixed: this used to silently swallow any DB.listConversations()
     error and fall back to a hardcoded list of fake people (Sarah Parker,
     John Smith...), which is why the messages page could show "phantom"
     users that don't exist in the database and never actually send
     anything. There is no meaningful "demo mode" for real 1:1 messaging,
     so a failure/disconnection now surfaces as a real, visible error
     instead of fake data. */
  async getConversations() {
    if (typeof DB === 'undefined' || !DB.isConnected) {
      throw new Error('La messagerie nécessite une connexion à Supabase.');
    }
    const convs = await DB.listConversations();
    return convs.map(c => ({
      name:    (c.other.first_name + ' ' + (c.other.last_name || '')).trim(),
      avatar:  c.other.avatar_url || 'https://i.pravatar.cc/80?u=' + c.other.id,
      preview: c.lastMessage?.image_url ? '📷 Photo' : (c.lastMessage?.video_url ? '🎬 Vidéo' : (c.lastMessage?.content || '')),
      time:    _relTime(c.lastMessage?.created_at),
      online:  false,
      unread:  c.unread || 0,
      otherId: c.other.id,
    }));
  },

  /* ── Full message thread with one other user ── */
  async getMessages(otherId) {
    if (typeof DB === 'undefined' || !DB.isConnected) {
      throw new Error('La messagerie nécessite une connexion à Supabase.');
    }
    if (!otherId) return [];
    const [rows, me] = await Promise.all([DB.listMessages(otherId), DB.getCurrentUser()]);
    return rows.map(m => ({
      id: m.id,
      from: m.sender_id === me.id ? 'me' : 'them',
      text: m.content,
      imageUrl: m.image_url || null,
      videoUrl: m.video_url || null,
      time: _relTime(m.created_at),
      read: !!m.read_at,
      edited: !!m.edited_at,
    }));
  },

  /* ── Mark a thread's incoming messages as read (Issue: real-time
     read-receipt ticks need this called whenever a thread is opened) ── */
  async markMessagesRead(otherId) {
    if (typeof DB !== 'undefined' && DB.isConnected && otherId) {
      try { await DB.markMessagesRead(otherId); return true; } catch (err) { console.warn(err.message); }
    }
    return false;
  },

  /* ── Send message (Issue: send button silently did nothing when no
     real backend was connected — now it fails loudly with a clear
     error instead of pretending to succeed). Supports an optional
     image/video attachment, uploaded beforehand via api.uploadMessageMedia. ── */
  async sendMessage(recipientId, content, imageUrl, videoUrl) {
    if (typeof DB === 'undefined' || !DB.isConnected) {
      throw new Error('Vous devez être connecté(e) pour envoyer un message.');
    }
    if (!recipientId) {
      throw new Error('Choisissez une conversation avant d\'envoyer un message.');
    }
    return DB.sendMessage(recipientId, content, imageUrl, videoUrl);
  },

  /* ── Edit / delete a message the current user sent ── */
  async editMessage(messageId, content) {
    if (typeof DB === 'undefined' || !DB.isConnected) throw new Error('Non connecté(e).');
    return DB.editMessage(messageId, content);
  },
  async deleteMessage(messageId) {
    if (typeof DB === 'undefined' || !DB.isConnected) throw new Error('Non connecté(e).');
    return DB.deleteMessage(messageId);
  },

  /* ── Search people to start a new conversation (Issue: DB.searchProfiles
     already existed in supabase.js for exactly this purpose — its own
     comment says so — but no "new message" UI anywhere ever called it,
     so there was literally no way to message someone before they
     already had an existing conversation). ── */
  async searchPeople(query) {
    if (typeof DB === 'undefined' || !DB.isConnected) {
      throw new Error('La recherche nécessite une connexion à Supabase.');
    }
    return DB.searchProfiles(query);
  },

  /* ── Upload an image/video attachment for a message, reusing the same
     Storage bucket as post media. ── */
  async uploadMessageMedia(file) {
    if (typeof DB === 'undefined' || !DB.isConnected) throw new Error('Non connecté(e).');
    return DB.uploadPostMedia(file);
  },

  /* ── Create post (Issue 3, 5: text + image/video uploads) ──
     Bug fixed: this used to take a single `imageUrl` param, so when a
     post had ONLY a video, create-post.html was forced to pass the
     video URL into the image slot — it got saved as `image_url` in the
     DB and could never render as a real <video>. Now takes both. ── */
  async createPost(content, worldId, imageUrl, videoUrl) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      return DB.createPost({ content, worldId, imageUrl: imageUrl || null, videoUrl: videoUrl || null });
    }
    console.log('createPost->mock', content, imageUrl, videoUrl);
    return true;
  },

  /* ── Edit / delete a post (Issue: DB.updatePost/DB.deletePost already
     existed in supabase.js but no button in the UI ever called them) ── */
  async updatePost(postId, content) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.updatePost(postId, { content });
    console.log('updatePost->mock', postId, content);
    return true;
  },
  async deletePost(postId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.deletePost(postId);
    console.log('deletePost->mock', postId);
    return true;
  },

  /* ── Repost / quote-repost (Issue: no real repost feature existed —
     "🔄 Partager" only ever copied a link to the clipboard) ── */
  async toggleRepost(postId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.toggleRepost(postId);
    console.log('toggleRepost->mock', postId);
    return { reposted: true };
  },
  async quoteRepost(postId, text) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.quoteRepost(postId, text);
    console.log('quoteRepost->mock', postId, text);
    return { id: 'mock-quote-' + Date.now() };
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
            /* Issue: la page profil affichait "📍 Paris, France · 🔗 alexdev.io"
               en dur pour tout le monde. On lit les vraies colonnes si elles
               existent, sinon on n'affiche rien plutôt que d'inventer une
               localisation/site qui n'appartient pas à l'utilisateur. */
            location:  profile.location || '',
            website:   profile.website  || '',
            joinedAt:  profile.created_at || user.created_at || null,
            followers: counts.followers,
            following: counts.following,
            posts:     MOCK.user.posts, /* post count requires separate query — extendable */
          };
        }
      } catch (err) {
        console.warn('[WorldHub] getCurrentProfile fell back to mock:', err.message);
      }
    }
    return { ...MOCK.user, id: null, location:'', website:'', joinedAt:null };
  },

  /* ── Username availability (Issue: aucune vérification n'existait,
     ni à l'inscription ni à l'édition du profil — seule la contrainte
     de base de données bloquait après coup, avec un message illisible). ── */
  async checkUsernameAvailable(handle, currentUserId = null) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      return DB.checkHandleAvailable(handle, currentUserId);
    }
    /* Mode démo (sans backend) : on simule juste deux noms "déjà pris"
       pour que l'indicateur visuel ait quelque chose à montrer. */
    const taken = ['admin', 'worldhub', 'test', 'alexdev'];
    return !taken.includes(String(handle).replace(/^@/, '').toLowerCase());
  },

  /* ── Followers / Following list (Issue: seuls les compteurs étaient
     affichés sur le profil, aucune page ne listait qui suit qui). ── */
  async _hydrateConnectionRows(rows) {
    const mapped = rows.map(p => ({
      id: p.id,
      name: (p.first_name + ' ' + (p.last_name || '')).trim() || 'Utilisateur',
      handle: p.handle || '@user',
      avatar: p.avatar_url || ('https://i.pravatar.cc/80?u=' + p.id),
      isFollowing: false,
      isMe: false,
    }));
    if (typeof DB === 'undefined' || !DB.isConnected) return mapped;
    try {
      const me = await DB.getCurrentUser();
      if (!me) return mapped;
      const followingIds = await DB.listFollowingIds(me.id);
      return mapped.map(r => ({ ...r, isFollowing: followingIds.has(r.id), isMe: r.id === me.id }));
    } catch (err) {
      console.warn('[WorldHub] _hydrateConnectionRows:', err.message);
      return mapped;
    }
  },
  async getFollowers(userId) {
    if (typeof DB !== 'undefined' && DB.isConnected && userId) {
      try {
        const rows = await DB.listFollowers(userId);
        return this._hydrateConnectionRows(rows);
      } catch (err) {
        console.warn('[WorldHub] getFollowers fell back to mock:', err.message);
      }
    }
    return MOCK.topMembers.map((m, i) => ({
      id: 'mock-' + i, name: m.name, handle: '@' + m.name.toLowerCase().replace(' ', '.'),
      avatar: m.avatar, isFollowing: false, isMe: false,
    }));
  },
  async getFollowing(userId) {
    if (typeof DB !== 'undefined' && DB.isConnected && userId) {
      try {
        const rows = await DB.listFollowing(userId);
        return this._hydrateConnectionRows(rows);
      } catch (err) {
        console.warn('[WorldHub] getFollowing fell back to mock:', err.message);
      }
    }
    return MOCK.topMembers.slice(0, 2).map((m, i) => ({
      id: 'mock-' + i, name: m.name, handle: '@' + m.name.toLowerCase().replace(' ', '.'),
      avatar: m.avatar, isFollowing: true, isMe: false,
    }));
  },
  async getProfileById(userId) {
    if (typeof DB !== 'undefined' && DB.isConnected && userId) {
      try {
        const profile = await DB.getProfile(userId);
        const counts  = await DB.getFollowCounts(userId);
        return {
          id: userId,
          name: (profile.first_name + ' ' + (profile.last_name || '')).trim(),
          handle: profile.handle || '@user',
          avatar: profile.avatar_url || ('https://i.pravatar.cc/150?u=' + userId),
          followers: counts.followers,
          following: counts.following,
        };
      } catch (err) {
        console.warn('[WorldHub] getProfileById:', err.message);
      }
    }
    return null;
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
  async getEvents(worldId = null) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listEvents({ worldId });
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
    return worldId ? [] : MOCK.events;
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

  /* ── Reels (Issue: le "🎬 Reels" de la sidebar pointait vers "#" —
     aucune table, aucun stockage, aucune interaction n'existait). Mock
     mode utilise MOCK.reels + un compteur de likes/vues purement local
     (perdu au rechargement), pour que la page reste utilisable sans
     backend au lieu d'être vide. ── */
  async getReels() {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const rows = await DB.listReels({ limit: 20 });
        return rows.map(_mapReelRow);
      } catch (err) { console.warn('[WorldHub] getReels fell back to mock:', err.message); }
    }
    return MOCK.reels.map(r => ({ ...r }));
  },
  async uploadReelMedia(file) {
    if (typeof DB === 'undefined' || !DB.isConnected) {
      // pas de backend -> aperçu local uniquement, jamais persistant
      return URL.createObjectURL(file);
    }
    return DB.uploadReelMedia(file);
  },
  async createReel(videoUrl, caption, thumbnailUrl) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.createReel({ videoUrl, caption, thumbnailUrl });
    console.log('createReel->mock', videoUrl, caption);
    const reel = {
      id: 'mock-' + Date.now(), authorId: null,
      author: MOCK.user.name, handle: MOCK.user.handle, avatarUrl: MOCK.user.avatar,
      caption: caption || '', videoUrl, thumbnailUrl: thumbnailUrl || null, world: '',
      time: 'à l\'instant', views: 0, likes: 0, comments: 0, commentList: [],
    };
    MOCK.reels.unshift(reel);
    return reel;
  },
  async toggleReelLike(reelId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.toggleReelLike(reelId);
    console.log('toggleReelLike->mock', reelId);
    return true;
  },
  async addReelComment(reelId, content) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.addReelComment(reelId, content);
    console.log('addReelComment->mock', reelId, content);
    return {
      id: 'mock-' + Date.now(), content,
      author: { first_name: MOCK.user.name.split(' ')[0], last_name: MOCK.user.name.split(' ').slice(1).join(' '), avatar_url: MOCK.user.avatar },
    };
  },
  async getReelComments(reelId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try { return await DB.listReelComments(reelId); } catch (err) { console.warn('[WorldHub] getReelComments failed:', err.message); }
    }
    return [];
  },
  async toggleSaveReel(reelId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.toggleSaveReel(reelId);
    console.log('toggleSaveReel->mock', reelId);
    return true;
  },
  async logReelView(reelId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.logReelView(reelId);
    return null; // pas de suivi de vues en mode démo
  },

  /* ── Search (Issue: the topbar search box did nothing at all — no
     query reached the DB, no results page existed). Real search hits
     posts/profiles/worlds/companies/jobs via DB.searchAll(); mock mode
     filters the same MOCK arrays client-side so the page still works
     without Supabase connected. ── */
  async search(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return { posts:[], profiles:[], worlds:[], companies:[], jobs:[] };
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try {
        const r = await DB.searchAll(query);
        return {
          posts: r.posts.map(p => ({
            id: p.id,
            author: p.author ? (p.author.first_name + ' ' + (p.author.last_name || '')).trim() : 'Utilisateur',
            avatarUrl: p.author?.avatar_url || null,
            text: p.content || '', time: _relTime(p.created_at),
          })),
          profiles: r.profiles.map(u => ({
            id: u.id, name: (u.first_name + ' ' + (u.last_name || '')).trim(),
            handle: u.handle || '@user', avatar: u.avatar_url || 'https://i.pravatar.cc/80',
          })),
          worlds: r.worlds.map(w => ({ id: w.id, name: w.name, icon: w.icon || '🌍', members: w.member_count || 0 })),
          companies: r.companies.map(c => ({ id: c.id, name: c.name, sector: c.sector || '', logo: c.logo_url || null })),
          jobs: r.jobs.map(j => ({ id: j.id, title: j.title, company: j.company?.name || '', location: j.location || '', type: j.job_type || '' })),
        };
      } catch (err) { console.warn('[WorldHub] search fell back to mock:', err.message); }
    }
    return {
      posts: MOCK.posts.filter(p => p.text.toLowerCase().includes(q))
        .map(p => ({ id:p.id, author:p.author, avatarUrl:null, text:p.text, time:p.time })),
      profiles: MOCK.topMembers.map(m=>({name:m.name, handle:'@'+m.name.toLowerCase().replace(' ','.'), avatar:m.avatar}))
        .filter(u => (u.name||'').toLowerCase().includes(q) || (u.handle||'').toLowerCase().includes(q)),
      worlds: MOCK.worlds.filter(w => w.name.toLowerCase().includes(q)),
      companies: MOCK.companies.filter(c => c.name.toLowerCase().includes(q))
        .map(c => ({ name:c.name, sector:c.sector, logo:null })),
      jobs: MOCK.jobs.filter(j => j.title.toLowerCase().includes(q))
        .map(j => ({ title:j.title, company:j.company, location:j.place, type:j.type })),
    };
  },

  /* ── Polls (Issue: "Sondage" only composed plain text into the post —
     now backed by real polls/poll_options/poll_votes tables when
     connected). Mock fallback returns null / no-ops since there is no
     real vote-counting possible without a backend. ── */
  async createPoll(postId, question, options) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.createPoll(postId, question, options);
    console.log('createPoll->mock', postId, question, options);
    return { id: 'mock-poll-' + Date.now() };
  },
  async getPoll(postId) {
    if (typeof DB !== 'undefined' && DB.isConnected) {
      try { return await DB.getPollForPost(postId); } catch (err) { console.warn('[WorldHub] getPoll failed:', err.message); }
    }
    return null;
  },
  async votePoll(pollId, optionId) {
    if (typeof DB !== 'undefined' && DB.isConnected) return DB.votePoll(pollId, optionId);
    console.log('votePoll->mock', pollId, optionId);
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
  return { like:'❤️', comment:'💬', follow:'➕', mention:'📣', share:'🔄', repost:'🔁', system:'🌍',
    reel_like:'❤️', reel_comment:'💬', world_invite:'🌐' }[type] || '🔔';
}
function _notifColor(type){
  return { like:'pink', comment:'blue', follow:'accent', mention:'accent', share:'green', repost:'green', system:'yellow',
    reel_like:'pink', reel_comment:'blue', world_invite:'blue' }[type] || 'accent';
}
function _notifDefaultText(n){
  const who = n.actor ? (n.actor.first_name + ' ' + (n.actor.last_name || '')).trim() : 'Quelqu\'un';
  const map = {
    like:'a aimé votre publication', comment:'a commenté votre publication',
    follow:'a commencé à vous suivre', mention:'vous a mentionné',
    share:'a partagé votre publication', repost:'a republié votre publication',
    reel_like:'a aimé votre Reel', reel_comment:'a commenté votre Reel',
    world_invite:'vous invite à rejoindre un monde',
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
