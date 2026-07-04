/* ==========================================================
   WorldHub — shared layout, mock data & interactions
   Drop-in module used by every page. Nothing here talks to a
   real backend — swap MOCK.* and the fetch stubs at the bottom
   for your Supabase/Firebase calls when wiring up the backend.
   ========================================================== */

const NAV = [
  { id:'home',          icon:'🏠', label:'Accueil',            href:'index.html' },
  { id:'reels',         icon:'🎬', label:'Reels',               href:'#' },
  { id:'messages',      icon:'💬', label:'Messages',            href:'messages.html', badge:3 },
  { id:'notifications', icon:'🔔', label:'Notifications',       href:'notifications.html', badge:6 },
  { id:'create',        icon:'➕', label:'Créer une publication', href:'create-post.html' },
  { id:'dashboard',     icon:'📊', label:'Tableau de bord',     href:'dashboard.html' },
  { id:'profile',       icon:'👤', label:'Profil',              href:'profile.html' },
  { id:'div1' },
  { id:'worlds-label', label:'Mes Mondes' },
  { id:'programming',  icon:'💻', label:'Programmation',  href:'world.html', accent:'green' },
  { id:'ai',           icon:'🤖', label:'IA & ML',         href:'world.html', accent:'blue' },
  { id:'design',       icon:'🎨', label:'Design',          href:'world.html', accent:'pink' },
  { id:'entrepreneur', icon:'💼', label:'Entrepreneuriat', href:'world.html', accent:'yellow' },
  { id:'div2' },
  { id:'jobs',        icon:'🧰', label:'Offres d’emploi', href:'jobs.html' },
  { id:'companies',   icon:'🏢', label:'Entreprises',     href:'companies.html' },
  { id:'events',      icon:'📅', label:'Événements',      href:'events.html' },
  { id:'marketplace', icon:'🛒', label:'Marketplace',     href:'marketplace.html' },
  { id:'plus',        icon:'⋯', label:'Plus',            href:'#' },
];

const MOCK = {
  user: { name:'Alex Dev', handle:'@alex.dev', avatar:'https://i.pravatar.cc/150?img=13',
          bio:'Développeur Full Stack · Passionné d’IA et le Web', posts:152, followers:'12.4k', following:280 },

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
      text:'L’avenir de l’IA entre nos mains. Continuons à construire !',
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
    { day:'15', mon:'JUIN', title:'Flutter World Conference', place:'En ligne', desc:'La plus grande conférence Flutter de l’année avec des experts du monde entier.', going:'1.2k participants' },
    { day:'22', mon:'JUIN', title:'IA & ML Summit 2024', place:'Paris, France', desc:'Rassemblement des meilleurs esprits en Machine Learning.', going:'850 participants' },
    { day:'05', mon:'JUIL', title:'Web Dev Bootcamp', place:'Lyon, France', desc:'Bootcamp intensif sur les technologies web modernes.', going:'150 participants' },
  ],

  conversations: [
    { name:'Sarah Parker', avatar:'https://i.pravatar.cc/80?img=5',  preview:'Oui, il a l’air incroyable 🎉', time:'10:33', online:true, unread:0 },
    { name:'John Smith',   avatar:'https://i.pravatar.cc/80?img=32', preview:'Ça va super ! Et toi ?',        time:'09:10', online:true, unread:2 },
    { name:'Alex Johnson', avatar:'https://i.pravatar.cc/80?img=15', preview:'À demain alors 👋',              time:'Hier',  online:false, unread:0 },
    { name:'Mike Wilson',  avatar:'https://i.pravatar.cc/80?img=22', preview:'Tu as vu le nouveau framework ?',time:'Hier',  online:false, unread:0 },
    { name:'Emma Davis',   avatar:'https://i.pravatar.cc/80?img=9',  preview:'Merci pour l’aide !',            time:'Lun',   online:false, unread:0 },
    { name:'David Brown',  avatar:'https://i.pravatar.cc/80?img=51', preview:'On se cale une réunion ?',       time:'Lun',   online:false, unread:0 },
  ],

  chatThread: [
    { from:'them', text:'Salut Alex ! Comment ça va ?', time:'10:20' },
    { from:'me',   text:'Ça va super ! Et toi ?',        time:'10:21' },
    { from:'them', text:'Bien aussi ! Tu as vu le nouveau framework ?', time:'10:30' },
    { from:'me',   text:'Oui, il a l’air incroyable 🎉', time:'10:33' },
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
    { title:'Script d’automatisation Python', seller:'Léa M.', price:'90€', rating:4.8, tag:'Programmation' },
    { title:'Montage vidéo Reels', seller:'Tom B.', price:'60€', rating:4.7, tag:'Vidéo' },
  ],
};

const COLOR_VARS = { green:'var(--green)', blue:'var(--blue)', pink:'var(--pink)', yellow:'var(--yellow)', accent:'var(--accent)' };

function tile(icon,color){ return `<div class="tile" style="background:${COLOR_VARS[color]||COLOR_VARS.accent}22;color:${COLOR_VARS[color]||COLOR_VARS.accent}">${icon}</div>`; }

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
      <a href="notifications.html" class="icon-btn">🔔<span class="dot">6</span></a>
      <a href="messages.html" class="icon-btn">💬<span class="dot">3</span></a>
      <a href="profile.html" class="avatar-btn"><img src="${MOCK.user.avatar}" alt="${MOCK.user.name}"></a>
    </div>
  </div>`;
}

/* ---------------- SIDEBAR ---------------- */
function renderSidebar(active){
  const items = NAV.map(n=>{
    if(n.id.startsWith('div')) return `<div class="nav-divider"></div>`;
    if(n.id.endsWith('-label')) return `<div class="nav-label">${n.label}</div>`;
    const cls = n.id===active ? 'nav-item active' : 'nav-item';
    const badge = n.badge ? `<span class="nav-badge">${n.badge}</span>` : '';
    return `<a class="${cls}" href="${n.href}"><span class="ic">${n.icon}</span>${n.label}${badge}</a>`;
  }).join('');
  return `<aside class="sidebar" id="sidebar">${items}</aside>`;
}

/* ---------------- RIGHT RAIL ---------------- */
function railWorlds(){
  return `<div class="card">
    <div class="card-head"><h3>Découvrir des Mondes</h3><span class="link">Voir tout</span></div>
    ${MOCK.worlds.slice(0,4).map(w=>`
      <div class="row">
        ${tile(w.icon,w.color)}
        <div><div class="row-title">${w.name}</div><div class="row-sub">${w.members} membres</div></div>
        <button class="btn btn-outline btn-sm" style="margin-left:auto">Rejoindre</button>
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
}

/* ---------------- GENERIC INTERACTIONS ---------------- */
function wireGlobalInteractions(){
  document.querySelectorAll('[data-like]').forEach(el=>{
    el.addEventListener('click',()=>{
      el.classList.toggle('liked');
      const countEl = el.querySelector('.count');
      if(countEl){
        let n = parseInt(countEl.textContent.replace(/\D/g,''))||0;
        n += el.classList.contains('liked') ? 1 : -1;
        countEl.textContent = n;
      }
    });
  });
  document.querySelectorAll('[data-follow]').forEach(el=>{
    el.addEventListener('click',()=>{
      const following = el.dataset.follow === 'on';
      el.dataset.follow = following ? 'off' : 'on';
      el.textContent = following ? 'Suivre' : 'Suivi ✓';
      el.classList.toggle('btn-primary', !following);
      el.classList.toggle('btn-outline', following);
    });
  });
}

/* ---------------- BACKEND STUBS ----------------
   Replace the bodies below with real Supabase / Firebase calls.
   Keeping the same function names means the UI code above never
   has to change when you wire up the real database.
------------------------------------------------- */
const api = {
  async getFeed(){ return MOCK.posts; },
  async getWorlds(){ return MOCK.worlds; },
  async getNotifications(){ return MOCK.notifications; },
  async getConversations(){ return MOCK.conversations; },
  async sendMessage(threadId, text){ console.log('sendMessage->supabase', threadId, text); return true; },
  async createPost(payload){ console.log('createPost->supabase', payload); return true; },
  async toggleFollow(userId){ console.log('toggleFollow->supabase', userId); return true; },
  async toggleLike(postId){ console.log('toggleLike->supabase', postId); return true; },
};
