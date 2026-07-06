/* ==========================================================
   WorldHub — i18n.js
   Moteur multilingue léger : 5 langues — Français (défaut),
   English, العربية, Español, 中文.

   COMMENT ÇA MARCHE (important à lire avant de modifier) :
   Le site est écrit en français en dur, un peu partout (app.js,
   et le <script> de chaque page HTML). Plutôt que de réécrire
   des centaines de chaînes dans 15+ fichiers, ce moteur :

   1) Garde un dictionnaire { "texte français exact": {en,ar,es,zh} }.
   2) Après CHAQUE rendu (toutes les pages reconstruisent leur DOM
      via innerHTML au chargement, et souvent après une action),
      un MutationObserver reparcourt le DOM et remplace tout texte
      (et les attributs placeholder/title/aria-label/alt) qui
      correspond exactement à une clé française du dictionnaire.
   3) Changer de langue = on sauvegarde le choix puis on RECHARGE
      la page. Comme tout le contenu est régénéré en français à
      chaque chargement, on repart toujours d'une base française
      propre avant de retraduire — pas d'accumulation ni de perte
      d'information en changeant de langue plusieurs fois de suite.
   4) L'arabe passe le document en RTL (dir="rtl"). C'est une bascule
      de base : la mise en page (main.css) n'a pas été ré-écrite en
      miroir complet, donc certains alignements fins peuvent rester
      orientés LTR.

   Ce fichier doit être inclus sur CHAQUE page, de préférence juste
   après auth-guard.js et avant app.js :
     <script src="assets/js/i18n.js"></script>
   ========================================================== */
(function () {

  /* ── 1. Langues supportées ─────────────────────────────── */
  const LANGS = {
    fr: { name: 'Français', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
    en: { name: 'English',  native: 'English',  flag: '🇬🇧', dir: 'ltr' },
    ar: { name: 'Arabic',   native: 'العربية',  flag: '🇸🇦', dir: 'rtl' },
    es: { name: 'Spanish',  native: 'Español',  flag: '🇪🇸', dir: 'ltr' },
    zh: { name: 'Chinese',  native: '中文',      flag: '🇨🇳', dir: 'ltr' },
  };
  const DEFAULT_LANG = 'fr';
  const STORAGE_KEY = 'wh_lang';

  /* ── 2. Dictionnaire de traduction ─────────────────────────
     Clé = texte source EXACT en français tel qu'il apparaît dans
     le HTML généré (attention aux apostrophes ' vs ’, aux points
     de suspension, aux espaces). Valeur = traduction par langue. */
  const PHRASES = {
    /* ---- Marque / topbar / navigation ---- */
    'Accueil':                    { en:'Home',            ar:'الرئيسية',              es:'Inicio',              zh:'首页' },
    'Reels':                      { en:'Reels',            ar:'ريلز',                  es:'Reels',               zh:'短视频' },
    'Messages':                   { en:'Messages',         ar:'الرسائل',               es:'Mensajes',            zh:'消息' },
    'Notifications':              { en:'Notifications',    ar:'الإشعارات',             es:'Notificaciones',      zh:'通知' },
    'Créer une publication':      { en:'Create a post',    ar:'إنشاء منشور',           es:'Crear publicación',   zh:'发布帖子' },
    'Tableau de bord':            { en:'Dashboard',        ar:'لوحة التحكم',           es:'Panel',               zh:'仪表盘' },
    'Profil':                     { en:'Profile',          ar:'الملف الشخصي',          es:'Perfil',              zh:'个人资料' },
    'Mes Mondes':                 { en:'My Worlds',        ar:'عوالمي',                es:'Mis Mundos',          zh:'我的世界' },
    'Programmation':              { en:'Programming',      ar:'البرمجة',               es:'Programación',        zh:'编程' },
    'IA & ML':                    { en:'AI & ML',          ar:'الذكاء الاصطناعي والتعلم الآلي', es:'IA y ML',    zh:'人工智能与机器学习' },
    'Design':                     { en:'Design',           ar:'التصميم',               es:'Diseño',              zh:'设计' },
    'Entrepreneuriat':            { en:'Entrepreneurship', ar:'ريادة الأعمال',         es:'Emprendimiento',      zh:'创业' },
    'Explorer les Mondes':        { en:'Explore Worlds',   ar:'استكشاف العوالم',       es:'Explorar Mundos',     zh:'探索世界' },
    "Offres d'emploi":            { en:'Jobs',             ar:'عروض العمل',            es:'Empleos',             zh:'招聘信息' },
    'Offres d’emploi':            { en:'Jobs',             ar:'عروض العمل',            es:'Empleos',             zh:'招聘信息' },
    'Entreprises':                { en:'Companies',        ar:'الشركات',               es:'Empresas',            zh:'企业' },
    'Événements':                 { en:'Events',           ar:'الفعاليات',             es:'Eventos',             zh:'活动' },
    'Marketplace':                { en:'Marketplace',      ar:'المتجر',                es:'Mercado',             zh:'市场' },
    'Plus':                       { en:'More',             ar:'المزيد',                es:'Más',                 zh:'更多' },
    'Déconnexion':                { en:'Log out',          ar:'تسجيل الخروج',          es:'Cerrar sesión',       zh:'退出登录' },
    'Se déconnecter':             { en:'Log out',          ar:'تسجيل الخروج',          es:'Cerrar sesión',       zh:'退出登录' },
    'Ouvrir le menu':             { en:'Open menu',        ar:'فتح القائمة',           es:'Abrir menú',          zh:'打开菜单' },
    'Fermer':                     { en:'Close',            ar:'إغلاق',                 es:'Cerrar',              zh:'关闭' },
    '+ Créer':                    { en:'+ Create',         ar:'+ إنشاء',               es:'+ Crear',             zh:'+ 创建' },
    'Rechercher des personnes, publications, mondes...': { en:'Search people, posts, worlds...', ar:'ابحث عن أشخاص، منشورات، عوالم...', es:'Buscar personas, publicaciones, mundos...', zh:'搜索用户、帖子、世界...' },
    'Paramètres':                 { en:'Settings',         ar:'الإعدادات',             es:'Ajustes',             zh:'设置' },
    '⚙️ Paramètres':              { en:'⚙️ Settings',      ar:'⚙️ الإعدادات',          es:'⚙️ Ajustes',          zh:'⚙️ 设置' },

    /* ---- Boutons génériques ---- */
    'Annuler':                    { en:'Cancel',           ar:'إلغاء',                 es:'Cancelar',            zh:'取消' },
    'Créer':                      { en:'Create',           ar:'إنشاء',                 es:'Crear',               zh:'创建' },
    'Créer un événement':         { en:'Create an event',  ar:'إنشاء فعالية',          es:'Crear evento',        zh:'创建活动' },
    'Créer une entreprise':       { en:'Create a company', ar:'إنشاء شركة',            es:'Crear empresa',       zh:'创建企业' },
    'Créer un service':           { en:'Create a service', ar:'إنشاء خدمة',            es:'Crear servicio',      zh:'创建服务' },
    'Créer un monde':             { en:'Create a world',   ar:'إنشاء عالم',            es:'Crear mundo',         zh:'创建世界' },
    'Créer mon compte':           { en:'Create my account',ar:'إنشاء حسابي',           es:'Crear mi cuenta',     zh:'创建我的账户' },
    'Créer une page entreprise':  { en:'Create a company page', ar:'إنشاء صفحة شركة',  es:'Crear página de empresa', zh:'创建企业主页' },
    '+ Créer une entreprise':     { en:'+ Create a company', ar:'+ إنشاء شركة',        es:'+ Crear empresa',     zh:'+ 创建企业' },
    '+ Créer un événement':       { en:'+ Create an event', ar:'+ إنشاء فعالية',       es:'+ Crear evento',      zh:'+ 创建活动' },
    '+ Créer un service':         { en:'+ Create a service', ar:'+ إنشاء خدمة',        es:'+ Crear servicio',    zh:'+ 创建服务' },
    '+ Créer un monde':           { en:'+ Create a world', ar:'+ إنشاء عالم',          es:'+ Crear mundo',       zh:'+ 创建世界' },
    '+ Publier un Reel':          { en:'+ Post a Reel',    ar:'+ نشر ريل',             es:'+ Publicar Reel',     zh:'+ 发布短视频' },
    '+ Publier une offre':        { en:'+ Post a job',     ar:'+ نشر وظيفة',           es:'+ Publicar oferta',   zh:'+ 发布职位' },
    '+ Ajouter une option':       { en:'+ Add an option',  ar:'+ إضافة خيار',          es:'+ Añadir opción',     zh:'+ 添加选项' },
    'Publier':                    { en:'Post',             ar:'نشر',                   es:'Publicar',            zh:'发布' },
    "Publier une offre d'emploi": { en:'Post a job',       ar:'نشر عرض عمل',           es:'Publicar oferta de empleo', zh:'发布招聘' },
    'Publier un Reel':            { en:'Post a Reel',      ar:'نشر ريل',               es:'Publicar Reel',       zh:'发布短视频' },
    'Enregistrer':                { en:'Save',             ar:'حفظ',                   es:'Guardar',             zh:'保存' },
    'Enregistré':                 { en:'Saved',            ar:'محفوظ',                 es:'Guardado',            zh:'已保存' },
    'Envoyer':                    { en:'Send',             ar:'إرسال',                 es:'Enviar',              zh:'发送' },
    'Envoyer le lien':            { en:'Send link',        ar:'إرسال الرابط',          es:'Enviar enlace',       zh:'发送链接' },
    'Supprimer':                  { en:'Delete',           ar:'حذف',                   es:'Eliminar',            zh:'删除' },
    'Supprimer définitivement':   { en:'Delete permanently', ar:'حذف نهائي',           es:'Eliminar definitivamente', zh:'永久删除' },
    'Retirer':                    { en:'Remove',           ar:'إزالة',                 es:'Quitar',              zh:'移除' },
    'Exclure':                    { en:'Remove',           ar:'استبعاد',               es:'Excluir',             zh:'移除' },
    'Ajouter':                    { en:'Add',              ar:'إضافة',                 es:'Añadir',              zh:'添加' },
    'Modifier':                   { en:'Edit',             ar:'تعديل',                 es:'Editar',              zh:'编辑' },
    'Modifier le profil':         { en:'Edit profile',     ar:'تعديل الملف الشخصي',    es:'Editar perfil',       zh:'编辑个人资料' },
    'Modifier la publication':    { en:'Edit post',        ar:'تعديل المنشور',         es:'Editar publicación',  zh:'编辑帖子' },
    'Modifier le message':        { en:'Edit message',     ar:'تعديل الرسالة',         es:'Editar mensaje',      zh:'编辑消息' },
    'Postuler':                   { en:'Apply',            ar:'التقديم',               es:'Postularse',          zh:'申请' },
    'Participer':                 { en:'Attend',           ar:'المشاركة',              es:'Participar',          zh:'参加' },
    'Je participe ✓':             { en:"I'm attending ✓",  ar:'سأشارك ✓',              es:'Voy a participar ✓',  zh:'我要参加 ✓' },
    'Commander':                  { en:'Order',            ar:'اطلب الآن',             es:'Pedir',               zh:'下单' },
    'Commandé ✓':                 { en:'Ordered ✓',        ar:'تم الطلب ✓',            es:'Pedido ✓',            zh:'已下单 ✓' },
    'Suivre':                     { en:'Follow',           ar:'متابعة',                es:'Seguir',              zh:'关注' },
    'Suivi(e) ✓':                 { en:'Following ✓',      ar:'متابَع ✓',              es:'Siguiendo ✓',         zh:'已关注 ✓' },
    'Suivi ✓':                    { en:'Following ✓',      ar:'متابَع ✓',              es:'Siguiendo ✓',         zh:'已关注 ✓' },
    'Rejoindre':                  { en:'Join',             ar:'انضمام',                es:'Unirse',              zh:'加入' },
    'Rejoint(e) ✓':               { en:'Joined ✓',         ar:'منضم ✓',                es:'Unido ✓',             zh:'已加入 ✓' },
    'Voir':                       { en:'View',             ar:'عرض',                   es:'Ver',                 zh:'查看' },
    'Voir tout':                  { en:'See all',          ar:'عرض الكل',              es:'Ver todo',            zh:'查看全部' },
    'Voir le classement':         { en:'See rankings',     ar:'عرض الترتيب',           es:'Ver clasificación',   zh:'查看排行榜' },
    'Appliquer':                  { en:'Apply',            ar:'تطبيق',                 es:'Aplicar',             zh:'应用' },
    'Sauver':                     { en:'Save',             ar:'حفظ',                   es:'Guardar',             zh:'收藏' },
    'Partager':                   { en:'Share',            ar:'مشاركة',                es:'Compartir',           zh:'分享' },
    'Commenter':                  { en:'Comment',          ar:'تعليق',                 es:'Comentar',            zh:'评论' },
    'Republier':                  { en:'Repost',           ar:'إعادة النشر',           es:'Republicar',          zh:'转发' },
    'Citer':                      { en:'Quote',            ar:'اقتباس',                es:'Citar',               zh:'引用' },
    'Inviter':                    { en:'Invite',           ar:'دعوة',                  es:'Invitar',             zh:'邀请' },
    'Gérer le monde':             { en:'Manage world',     ar:'إدارة العالم',          es:'Gestionar mundo',     zh:'管理世界' },
    'Promouvoir admin':           { en:'Promote to admin', ar:'ترقية إلى مشرف',        es:'Ascender a admin',    zh:'提升为管理员' },
    'Rétrograder':                { en:'Demote',           ar:'تخفيض الرتبة',          es:'Degradar',            zh:'降级' },
    'Nouvelle conversation':      { en:'New conversation', ar:'محادثة جديدة',          es:'Nueva conversación',  zh:'新对话' },
    'Changer la photo':           { en:'Change photo',     ar:'تغيير الصورة',          es:'Cambiar foto',        zh:'更换照片' },
    'Continuer avec Google':      { en:'Continue with Google', ar:'المتابعة عبر Google', es:'Continuar con Google', zh:'使用 Google 继续' },
    "S'inscrire avec Google":     { en:'Sign up with Google', ar:'التسجيل عبر Google', es:'Registrarse con Google', zh:'使用 Google 注册' },
    'Se connecter':               { en:'Sign in',          ar:'تسجيل الدخول',          es:'Iniciar sesión',      zh:'登录' },
    'ou par email':               { en:'or by email',      ar:'أو عبر البريد الإلكتروني', es:'o por correo',     zh:'或使用邮箱' },
    '← Retour à la connexion':    { en:'← Back to sign in', ar:'← العودة لتسجيل الدخول', es:'← Volver al inicio de sesión', zh:'← 返回登录' },
    'Connexion':                  { en:'Sign in',          ar:'تسجيل الدخول',          es:'Iniciar sesión',      zh:'登录' },
    'Inscription':                { en:'Sign up',          ar:'إنشاء حساب',            es:'Registro',            zh:'注册' },
    'Mot de passe oublié ?':      { en:'Forgot password?', ar:'نسيت كلمة المرور؟',      es:'¿Olvidaste tu contraseña?', zh:'忘记密码？' },

    /* ---- Champs de formulaire ---- */
    'Nom':                        { en:'Last name',        ar:'الاسم',                 es:'Apellido',            zh:'姓' },
    'Prénom':                     { en:'First name',       ar:'الاسم الأول',           es:'Nombre',              zh:'名' },
    'Email':                      { en:'Email',            ar:'البريد الإلكتروني',     es:'Correo electrónico',  zh:'邮箱' },
    'Mot de passe':               { en:'Password',         ar:'كلمة المرور',           es:'Contraseña',          zh:'密码' },
    "Nom d'utilisateur":          { en:'Username',         ar:'اسم المستخدم',          es:'Nombre de usuario',   zh:'用户名' },
    'Description':                { en:'Description',      ar:'الوصف',                 es:'Descripción',         zh:'描述' },
    'Secteur':                    { en:'Sector',           ar:'القطاع',                es:'Sector',              zh:'行业' },
    'Titre':                      { en:'Title',            ar:'العنوان',               es:'Título',              zh:'标题' },
    'Titre du poste':             { en:'Job title',        ar:'المسمى الوظيفي',        es:'Título del puesto',   zh:'职位名称' },
    'Lieu':                       { en:'Location',         ar:'الموقع',                es:'Ubicación',           zh:'地点' },
    'Localisation':               { en:'Location',         ar:'الموقع',                es:'Ubicación',           zh:'位置' },
    'Type de contrat':            { en:'Contract type',    ar:'نوع العقد',             es:'Tipo de contrato',    zh:'合同类型' },
    'Monde':                      { en:'World',            ar:'العالم',                es:'Mundo',               zh:'世界' },
    'Couleur':                    { en:'Color',            ar:'اللون',                 es:'Color',               zh:'颜色' },
    'Icône (emoji)':              { en:'Icon (emoji)',     ar:'الأيقونة (إيموجي)',     es:'Icono (emoji)',       zh:'图标（表情符号）' },
    'Prix (€)':                   { en:'Price (€)',        ar:'السعر (€)',             es:'Precio (€)',          zh:'价格（€）' },
    'Catégorie':                  { en:'Category',         ar:'الفئة',                 es:'Categoría',           zh:'分类' },
    'Compétences':                { en:'Skills',           ar:'المهارات',              es:'Habilidades',         zh:'技能' },
    'Centres d’intérêt':          { en:'Interests',        ar:'الاهتمامات',            es:'Intereses',           zh:'兴趣' },
    "Centres d'intérêt":          { en:'Interests',        ar:'الاهتمامات',            es:'Intereses',           zh:'兴趣' },
    'Site web':                   { en:'Website',          ar:'الموقع الإلكتروني',     es:'Sitio web',           zh:'网站' },
    'À propos':                   { en:'About',            ar:'حول',                   es:'Acerca de',           zh:'关于' },
    'Bio':                        { en:'Bio',              ar:'نبذة',                  es:'Biografía',           zh:'简介' },
    'Photos':                     { en:'Photos',           ar:'الصور',                 es:'Fotos',               zh:'照片' },
    'Médias':                     { en:'Media',            ar:'الوسائط',               es:'Multimedia',          zh:'媒体' },
    'Admins':                     { en:'Admins',           ar:'المشرفون',              es:'Administradores',     zh:'管理员' },
    'Options':                    { en:'Options',          ar:'خيارات',                es:'Opciones',            zh:'选项' },
    'Session':                    { en:'Session',          ar:'الجلسة',                es:'Sesión',              zh:'会话' },
    'Compte':                     { en:'Account',          ar:'الحساب',                es:'Cuenta',              zh:'账户' },
    'Confidentialité':            { en:'Privacy',          ar:'الخصوصية',              es:'Privacidad',          zh:'隐私' },
    'Sondage':                    { en:'Poll',             ar:'استطلاع',               es:'Encuesta',            zh:'投票' },
    '📊 Sondage':                 { en:'📊 Poll',          ar:'📊 استطلاع',            es:'📊 Encuesta',         zh:'📊 投票' },
    'Assistant IA':               { en:'AI Assistant',     ar:'مساعد الذكاء الاصطناعي', es:'Asistente IA',       zh:'AI 助手' },
    '🤖 Assistant IA':            { en:'🤖 AI Assistant',  ar:'🤖 مساعد الذكاء الاصطناعي', es:'🤖 Asistente IA',   zh:'🤖 AI 助手' },
    'Vidéo':                      { en:'Video',            ar:'فيديو',                 es:'Video',               zh:'视频' },
    'Image':                      { en:'Image',            ar:'صورة',                  es:'Imagen',              zh:'图片' },
    'Membres':                    { en:'Members',          ar:'الأعضاء',               es:'Miembros',            zh:'成员' },
    'Messagerie':                 { en:'Messaging',        ar:'المراسلة',              es:'Mensajería',          zh:'消息' },
    'Ressources':                 { en:'Resources',        ar:'الموارد',               es:'Recursos',            zh:'资源' },
    'Titre de la ressource':      { en:'Resource title',   ar:'عنوان المورد',          es:'Título del recurso',  zh:'资源标题' },
    'Relations':                  { en:'Connections',      ar:'العلاقات',              es:'Conexiones',          zh:'关系' },
    'Vous':                       { en:'You',              ar:'أنت',                   es:'Tú',                  zh:'你' },
    '(vous)':                     { en:'(you)',            ar:'(أنت)',                 es:'(tú)',                zh:'（你）' },

    /* ---- Valeurs d'options ---- */
    'Tous':                       { en:'All',              ar:'الكل',                  es:'Todos',               zh:'全部' },
    'Toutes':                     { en:'All',              ar:'الكل',                  es:'Todas',               zh:'全部' },
    'CDI':                        { en:'Permanent',        ar:'دوام دائم',             es:'Indefinido',          zh:'长期合同' },
    'CDD':                        { en:'Fixed-term',       ar:'دوام محدد المدة',       es:'Temporal',            zh:'固定期限合同' },
    'Freelance':                  { en:'Freelance',        ar:'عمل حر',                es:'Freelance',           zh:'自由职业' },
    'Stage':                      { en:'Internship',       ar:'تدريب',                 es:'Prácticas',           zh:'实习' },
    'Alternance':                 { en:'Apprenticeship',   ar:'تدريب مهني',            es:'Formación dual',      zh:'学徒制' },
    'Remote':                     { en:'Remote',           ar:'عن بُعد',               es:'Remoto',              zh:'远程' },
    'En ligne':                   { en:'Online',           ar:'عبر الإنترنت',          es:'En línea',            zh:'线上' },

    /* ---- Sections / titres de cartes ---- */
    'Découvrir des Mondes':       { en:'Discover Worlds',  ar:'اكتشف العوالم',         es:'Descubrir Mundos',    zh:'发现世界' },
    'Tendances':                  { en:'Trending',         ar:'الرائج',                es:'Tendencias',          zh:'趋势' },
    'Top Membres':                { en:'Top Members',      ar:'أفضل الأعضاء',          es:'Miembros destacados', zh:'热门成员' },
    'Événements à venir':         { en:'Upcoming events',  ar:'الفعاليات القادمة',     es:'Próximos eventos',    zh:'即将举行的活动' },
    'Secteurs populaires':        { en:'Popular sectors',  ar:'القطاعات الشائعة',      es:'Sectores populares',  zh:'热门行业' },
    'Top recruteurs':             { en:'Top recruiters',   ar:'أفضل الموظفين',         es:'Principales reclutadores', zh:'热门招聘方' },
    'Filtrer':                    { en:'Filter',           ar:'تصفية',                 es:'Filtrar',             zh:'筛选' },
    'Catégories':                 { en:'Categories',       ar:'الفئات',                es:'Categorías',          zh:'分类' },
    'Résultats pour':             { en:'Results for',      ar:'نتائج بحث عن',          es:'Resultados de',       zh:'搜索结果' },
    'Personnes':                  { en:'People',           ar:'الأشخاص',               es:'Personas',            zh:'人物' },
    'Publications':                { en:'Posts',           ar:'المنشورات',             es:'Publicaciones',       zh:'帖子' },
    'Mondes':                     { en:'Worlds',           ar:'العوالم',               es:'Mundos',              zh:'世界' },
    'Pour vous':                  { en:'For you',          ar:'مخصص لك',               es:'Para ti',             zh:'为你推荐' },
    'Abonnements':                { en:'Following',        ar:'المتابَعون',            es:'Siguiendo',           zh:'关注中' },
    'Abonnés':                    { en:'Followers',        ar:'المتابعون',             es:'Seguidores',          zh:'粉丝' },
    'Plus récent ▾':              { en:'Most recent ▾',    ar:'الأحدث ▾',              es:'Más reciente ▾',      zh:'最新 ▾' },
    'À venir':                    { en:'Upcoming',         ar:'قادم',                  es:'Próximos',            zh:'即将到来' },
    'Passés':                     { en:'Past',             ar:'سابق',                  es:'Pasados',             zh:'已结束' },
    'Aperçu':                     { en:'Preview',          ar:'معاينة',                es:'Vista previa',        zh:'预览' },
    'Mentions':                   { en:'Mentions',         ar:'الإشارات',              es:'Menciones',           zh:'提及' },
    'Commentaires':               { en:'Comments',         ar:'التعليقات',             es:'Comentarios',         zh:'评论' },
    'J’aime':                     { en:'Likes',            ar:'الإعجابات',             es:'Me gusta',            zh:'点赞' },
    "J'aime":                     { en:'Likes',            ar:'الإعجابات',             es:'Me gusta',            zh:'点赞' },
    'Republications':             { en:'Reposts',          ar:'إعادة النشر',           es:'Republicaciones',     zh:'转发' },
    'Invitations aux mondes':     { en:'World invitations', ar:'دعوات العوالم',        es:'Invitaciones a mundos', zh:'世界邀请' },
    'Système':                    { en:'System',           ar:'النظام',                es:'Sistema',             zh:'系统' },
    'Tout marquer comme lu':      { en:'Mark all as read', ar:'تحديد الكل كمقروء',     es:'Marcar todo como leído', zh:'全部标为已读' },
    'Créer un service':           { en:'Create a service', ar:'إنشاء خدمة',            es:'Crear servicio',      zh:'创建服务' },
    'Vendez vos services':        { en:'Sell your services', ar:'بِع خدماتك',          es:'Vende tus servicios', zh:'出售你的服务' },
    'Créez votre communauté':     { en:'Create your community', ar:'أنشئ مجتمعك',      es:'Crea tu comunidad',   zh:'创建你的社区' },
    'Organisez le vôtre':         { en:'Host your own',    ar:'نظّم فعاليتك',          es:'Organiza el tuyo',    zh:'创建你自己的活动' },
    'Créez une page entreprise':  { en:'Create a company page', ar:'إنشاء صفحة شركة',  es:'Crea una página de empresa', zh:'创建企业主页' },

    /* ---- États vides / chargement ---- */
    'Chargement...':              { en:'Loading...',       ar:'جارٍ التحميل...',       es:'Cargando...',         zh:'加载中...' },
    'Recherche...':               { en:'Search...',        ar:'بحث...',                es:'Buscar...',           zh:'搜索...' },
    'Recherche en cours...':      { en:'Searching...',     ar:'جارٍ البحث...',         es:'Buscando...',         zh:'正在搜索...' },
    'Aucun résultat.':            { en:'No results.',      ar:'لا توجد نتائج.',        es:'Sin resultados.',     zh:'没有结果。' },
    'Aucun résultat pour le moment.': { en:'No results yet.', ar:'لا توجد نتائج حالياً.', es:'Aún no hay resultados.', zh:'暂无结果。' },
    'Aucune notification pour le moment.': { en:'No notifications yet.', ar:'لا توجد إشعارات حالياً.', es:'Aún no hay notificaciones.', zh:'暂无通知。' },
    'Aucune notification dans cette catégorie.': { en:'No notifications in this category.', ar:'لا توجد إشعارات في هذه الفئة.', es:'No hay notificaciones en esta categoría.', zh:'该分类下暂无通知。' },
    'Aucune activité récente.':   { en:'No recent activity.', ar:'لا يوجد نشاط حديث.',  es:'Sin actividad reciente.', zh:'暂无最新动态。' },
    'Aucun monde ne correspond à cette recherche.': { en:'No world matches this search.', ar:'لا يوجد عالم مطابق لهذا البحث.', es:'Ningún mundo coincide con esta búsqueda.', zh:'没有符合搜索条件的世界。' },
    'Aucune entreprise pour le moment.': { en:'No companies yet.', ar:'لا توجد شركات حالياً.', es:'Aún no hay empresas.', zh:'暂无企业。' },
    "Aucun événement à venir":    { en:'No upcoming events', ar:'لا توجد فعاليات قادمة', es:'No hay próximos eventos', zh:'暂无即将举行的活动' },
    'Aucune offre pour le moment.': { en:'No jobs yet.',     ar:'لا توجد عروض حالياً.',  es:'Aún no hay ofertas.', zh:'暂无招聘信息。' },
    'Aucun service pour le moment.': { en:'No services yet.', ar:'لا توجد خدمات حالياً.', es:'Aún no hay servicios.', zh:'暂无服务。' },
    'Aucune personne trouvée.':   { en:'No people found.', ar:'لم يتم العثور على أشخاص.', es:'No se encontraron personas.', zh:'未找到相关用户。' },
    'Aucune publication trouvée.': { en:'No posts found.', ar:'لم يتم العثور على منشورات.', es:'No se encontraron publicaciones.', zh:'未找到相关帖子。' },
    'Aucun monde trouvé.':        { en:'No worlds found.', ar:'لم يتم العثور على عوالم.', es:'No se encontraron mundos.', zh:'未找到相关世界。' },
    'Aucune offre trouvée.':      { en:'No jobs found.',   ar:'لم يتم العثور على عروض.', es:'No se encontraron ofertas.', zh:'未找到相关招聘。' },
    "Aucun Reel pour le moment. Soyez le premier à en publier un !": { en:'No Reels yet. Be the first to post one!', ar:'لا توجد ريلز حالياً. كن أول من ينشر واحداً!', es:'Aún no hay Reels. ¡Sé el primero en publicar uno!', zh:'暂无短视频。快来发布第一个吧！' },
    "Aucun commentaire pour l'instant.": { en:'No comments yet.', ar:'لا توجد تعليقات حالياً.', es:'Aún no hay comentarios.', zh:'暂无评论。' },
    'Aucun administrateur.':      { en:'No administrators.', ar:'لا يوجد مشرفون.',     es:'Sin administradores.', zh:'暂无管理员。' },
    'Aucun membre pour le moment.': { en:'No members yet.', ar:'لا يوجد أعضاء حالياً.', es:'Aún no hay miembros.', zh:'暂无成员。' },
    'Aucun élément enregistré pour le moment.': { en:'No saved items yet.', ar:'لا توجد عناصر محفوظة حالياً.', es:'Aún no hay elementos guardados.', zh:'暂无收藏内容。' },
    'Aucune publication pour le moment dans ce monde.': { en:'No posts yet in this world.', ar:'لا توجد منشورات حالياً في هذا العالم.', es:'Aún no hay publicaciones en este mundo.', zh:'该世界暂无帖子。' },
    'Aucune publication pour le moment.': { en:'No posts yet.', ar:'لا توجد منشورات حالياً.', es:'Aún no hay publicaciones.', zh:'暂无帖子。' },
    'Aucune ressource partagée pour le moment.': { en:'No shared resources yet.', ar:'لا توجد موارد مشتركة حالياً.', es:'Aún no hay recursos compartidos.', zh:'暂无共享资源。' },
    'Connectez-vous pour voir vos éléments enregistrés.': { en:'Sign in to see your saved items.', ar:'سجّل الدخول لعرض عناصرك المحفوظة.', es:'Inicia sesión para ver tus elementos guardados.', zh:'登录后查看你的收藏内容。' },
    'Quoi de neuf ?':              { en:"What's new?",     ar:'ما الجديد؟',            es:'¿Qué hay de nuevo?',  zh:'有什么新鲜事？' },
    'Quoi de neuf dans votre monde ?': { en:"What's new in your world?", ar:'ما الجديد في عالمك؟', es:'¿Qué hay de nuevo en tu mundo?', zh:'你的世界里有什么新鲜事？' },
    'À l’instant':                { en:'Just now',         ar:'الآن',                  es:'Justo ahora',         zh:'刚刚' },
    "À l'instant":                { en:'Just now',         ar:'الآن',                  es:'Justo ahora',         zh:'刚刚' },
    'Votre monde principal':      { en:'Your main world',  ar:'عالمك الأساسي',         es:'Tu mundo principal',  zh:'你的主要世界' },
    'Votre profil':               { en:'Your profile',     ar:'ملفك الشخصي',           es:'Tu perfil',           zh:'你的个人资料' },
    'Suggestions pour démarrer votre publication :': { en:'Suggestions to start your post:', ar:'اقتراحات لبدء منشورك:', es:'Sugerencias para empezar tu publicación:', zh:'发布建议：' },
    'Rassemblez des membres autour d\'un sujet qui vous passionne.': { en:'Bring people together around a topic you love.', ar:'اجمع أعضاءً حول موضوع يثير شغفك.', es:'Reúne miembros en torno a un tema que te apasione.', zh:'围绕你热爱的话题聚集成员。' },
    'Proposez vos compétences à toute la communauté WorldHub.': { en:'Offer your skills to the whole WorldHub community.', ar:'اعرض مهاراتك على مجتمع WorldHub بأكمله.', es:'Ofrece tus habilidades a toda la comunidad de WorldHub.', zh:'向整个 WorldHub 社区提供你的技能。' },
    'Publiez des offres, gérez votre marque employeur et recrutez au sein des Mondes.': { en:'Post jobs, manage your employer brand and recruit within Worlds.', ar:'انشر الوظائف، أدر علامتك التجارية كصاحب عمل، ووظّف داخل العوالم.', es:'Publica ofertas, gestiona tu marca de empleador y contrata dentro de los Mundos.', zh:'发布职位，管理雇主品牌，并在各个世界中招募人才。' },
    'Créez un événement et invitez votre communauté.': { en:'Create an event and invite your community.', ar:'أنشئ فعالية وادعُ مجتمعك.', es:'Crea un evento e invita a tu comunidad.', zh:'创建活动并邀请你的社区。' },

    /* ---- Placeholders (barres de recherche / champs) ---- */
    'Rechercher un monde...':        { en:'Search a world...', ar:'ابحث عن عالم...',   es:'Buscar un mundo...',  zh:'搜索世界...' },
    'Rechercher une entreprise...':  { en:'Search a company...', ar:'ابحث عن شركة...', es:'Buscar una empresa...', zh:'搜索企业...' },
    'Rechercher un service...':      { en:'Search a service...', ar:'ابحث عن خدمة...', es:'Buscar un servicio...', zh:'搜索服务...' },
    'Rechercher des messages...':    { en:'Search messages...', ar:'ابحث في الرسائل...', es:'Buscar mensajes...', zh:'搜索消息...' },
    'Rechercher une personne':       { en:'Search for a person', ar:'ابحث عن شخص',       es:'Buscar una persona',  zh:'搜索用户' },
    'Rechercher par nom ou identifiant...': { en:'Search by name or handle...', ar:'ابحث بالاسم أو المعرّف...', es:'Buscar por nombre o usuario...', zh:'按姓名或用户名搜索...' },
    'Nom ou @identifiant...':        { en:'Name or @handle...', ar:'الاسم أو @المعرّف...', es:'Nombre o @usuario...', zh:'姓名或 @用户名...' },
    'Ajouter un commentaire...':     { en:'Add a comment...', ar:'أضف تعليقاً...',       es:'Añadir un comentario...', zh:'添加评论...' },
    'Écrire un commentaire... (@mention #tag)': { en:'Write a comment... (@mention #tag)', ar:'اكتب تعليقاً... (@ذكر #وسم)', es:'Escribe un comentario... (@mención #etiqueta)', zh:'写评论...（@提及 #话题）' },
    'Écrivez une légende... (@mention #tag)': { en:'Write a caption... (@mention #tag)', ar:'اكتب وصفاً... (@ذكر #وسم)', es:'Escribe una descripción... (@mención #etiqueta)', zh:'写文案...（@提及 #话题）' },
    'Écrivez votre message...':      { en:'Write your message...', ar:'اكتب رسالتك...', es:'Escribe tu mensaje...', zh:'写下你的消息...' },
    'Posez une question...':         { en:'Ask a question...', ar:'اطرح سؤالاً...',      es:'Haz una pregunta...', zh:'提出一个问题...' },
    "Nom de l'entreprise":           { en:'Company name',    ar:'اسم الشركة',            es:'Nombre de la empresa', zh:'企业名称' },
    "Nom de l'événement":            { en:'Event name',      ar:'اسم الفعالية',          es:'Nombre del evento',   zh:'活动名称' },
    'Décrivez votre entreprise en quelques mots': { en:'Describe your company in a few words', ar:'صف شركتك بإيجاز', es:'Describe tu empresa en pocas palabras', zh:'用几句话介绍你的企业' },
    'Décrivez votre événement':      { en:'Describe your event', ar:'صف فعاليتك',        es:'Describe tu evento',  zh:'描述你的活动' },
    'Décrivez votre service':        { en:'Describe your service', ar:'صف خدمتك',        es:'Describe tu servicio', zh:'描述你的服务' },
    'Décrivez le poste':             { en:'Describe the job', ar:'صف الوظيفة',           es:'Describe el puesto',  zh:'描述该职位' },
    'De quoi parle ce monde ?':      { en:'What is this world about?', ar:'عن ماذا يتحدث هذا العالم؟', es:'¿De qué trata este mundo?', zh:'这个世界是关于什么的？' },
    'Minimum 8 caractères':          { en:'Minimum 8 characters', ar:'8 أحرف كحد أدنى',  es:'Mínimo 8 caracteres', zh:'至少 8 个字符' },
    'vous@exemple.com':              { en:'you@example.com', ar:'you@example.com',       es:'tu@ejemplo.com',      zh:'you@example.com' },
    'Titre de la ressource':         { en:'Resource title',  ar:'عنوان المورد',          es:'Título del recurso',  zh:'资源标题' },
    'Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.': { en:"Enter your email and we'll send you a link to reset your password.", ar:'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.', es:'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.', zh:'输入你的邮箱，我们将发送重置密码的链接。' },
    '3 à 20 caractères : lettres, chiffres, underscore.': { en:'3 to 20 characters: letters, numbers, underscore.', ar:'3 إلى 20 حرفاً: أحرف، أرقام، شرطة سفلية.', es:'De 3 a 20 caracteres: letras, números, guion bajo.', zh:'3 到 20 个字符：字母、数字、下划线。' },
  };

  /* Alias : quelques attributs (placeholder/title/aria-label) réutilisent
     les mêmes clés que ci-dessus, donc pas besoin de duplication ici. */

  /* ── 3. État & helpers ─────────────────────────────────── */
  function getLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved && LANGS[saved]) ? saved : DEFAULT_LANG;
  }

  function setLanguage(lang) {
    if (!LANGS[lang] || lang === getLanguage()) { closeMenu(); return; }
    localStorage.setItem(STORAGE_KEY, lang);
    /* On recharge la page : chaque page régénère son contenu en
       français à chaque chargement (mock data / appels Supabase), donc
       repartir de zéro garantit une traduction propre, sans résidus
       d'une langue précédente. */
    window.location.reload();
  }

  function t(key) {
    const lang = getLanguage();
    if (lang === DEFAULT_LANG) return key;
    const entry = PHRASES[key];
    return (entry && entry[lang]) ? entry[lang] : key;
  }

  /* ── 4. Application au DOM ─────────────────────────────── */
  const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'aria-label', 'alt'];
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA']);

  function translateTextNodes(root) {
    const lang = getLanguage();
    if (lang === DEFAULT_LANG) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const targets = [];
    let node;
    while ((node = walker.nextNode())) {
      const parentTag = node.parentElement ? node.parentElement.tagName : '';
      if (SKIP_TAGS.has(parentTag)) continue;
      const trimmed = node.nodeValue.trim();
      if (!trimmed) continue;
      if (PHRASES[trimmed]) targets.push(node);
    }
    targets.forEach((node) => {
      const trimmed = node.nodeValue.trim();
      const translated = t(trimmed);
      if (translated !== trimmed) {
        node.nodeValue = node.nodeValue.replace(trimmed, translated);
      }
    });
  }

  function translateAttributes(root) {
    const lang = getLanguage();
    if (lang === DEFAULT_LANG) return;
    const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
    elements.forEach((el) => {
      ATTRS_TO_TRANSLATE.forEach((attr) => {
        if (!el.hasAttribute(attr)) return;
        const val = el.getAttribute(attr);
        const entry = PHRASES[val];
        if (entry && entry[lang]) el.setAttribute(attr, entry[lang]);
      });
    });
    /* Also check root itself if it's an element with such attributes */
    if (root.nodeType === 1) {
      ATTRS_TO_TRANSLATE.forEach((attr) => {
        if (!root.hasAttribute || !root.hasAttribute(attr)) return;
        const val = root.getAttribute(attr);
        const entry = PHRASES[val];
        if (entry && entry[lang]) root.setAttribute(attr, entry[lang]);
      });
    }
  }

  function translateNode(root) {
    if (!root) return;
    translateTextNodes(root);
    translateAttributes(root);
  }

  function applyLanguage() {
    const lang = getLanguage();
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', LANGS[lang].dir);
    document.body && document.body.classList.toggle('wh-rtl', LANGS[lang].dir === 'rtl');
    translateNode(document.body);
  }

  /* ── 5. Sélecteur de langue (injecté dans la topbar) ────── */
  function switcherHTML() {
    const current = getLanguage();
    const options = Object.keys(LANGS).map((code) => {
      const l = LANGS[code];
      const activeCls = code === current ? 'wh-lang-opt active' : 'wh-lang-opt';
      return `<div class="${activeCls}" data-lang="${code}" onclick="WH_I18N.select('${code}')">
        <span>${l.flag}</span><span>${l.native}</span>${code === current ? '<span style="margin-left:auto">✓</span>' : ''}
      </div>`;
    }).join('');
    return `
    <div class="wh-lang-switch" id="whLangSwitch" style="position:relative">
      <button type="button" class="icon-btn" id="whLangBtn" title="${LANGS[current].native}"
        onclick="WH_I18N.toggleMenu(event)" style="font-size:16px">${LANGS[current].flag}</button>
      <div id="whLangMenu" hidden style="position:absolute;top:calc(100% + 8px);right:0;background:var(--surface-2,#1c1c24);
        border:1px solid var(--border,#333);border-radius:var(--radius-md,10px);min-width:170px;z-index:2000;
        box-shadow:0 10px 30px rgba(0,0,0,.5);overflow:hidden">
        ${options}
      </div>
    </div>`;
  }

  function injectStyles() {
    if (document.getElementById('wh-i18n-style')) return;
    const style = document.createElement('style');
    style.id = 'wh-i18n-style';
    style.textContent = `
      .wh-lang-opt{display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:13.5px;cursor:pointer;color:var(--text-1,#fff);white-space:nowrap}
      .wh-lang-opt:hover{background:var(--surface-3,rgba(255,255,255,.06))}
      .wh-lang-opt.active{font-weight:700}
      html[dir="rtl"] body{direction:rtl}
      html[dir="rtl"] .wh-lang-switch #whLangMenu{right:auto;left:0}
    `;
    document.head.appendChild(style);
  }

  function toggleMenu(evt) {
    if (evt) evt.stopPropagation();
    const menu = document.getElementById('whLangMenu');
    if (menu) menu.hidden = !menu.hidden;
  }
  function closeMenu() {
    const menu = document.getElementById('whLangMenu');
    if (menu) menu.hidden = true;
  }
  function select(code) {
    closeMenu();
    setLanguage(code);
  }

  function injectSwitcher() {
    const actions = document.querySelector('.topbar-actions') || document.getElementById('loginLangSlot');
    if (actions && !document.getElementById('whLangSwitch')) {
      injectStyles();
      actions.insertAdjacentHTML('afterbegin', switcherHTML());
    } else if (document.getElementById('whLangSwitch')) {
      /* Keep the flag icon in sync (e.g. after a re-render) */
      const btn = document.getElementById('whLangBtn');
      const current = getLanguage();
      if (btn) { btn.textContent = LANGS[current].flag; btn.title = LANGS[current].native; }
    }
  }

  document.addEventListener('click', closeMenu);

  /* ── 6. Observation du DOM (le site reconstruit son contenu
     via innerHTML sur quasiment chaque page/action) ────────── */
  let _debounceTimer = null;
  function scheduleReTranslate() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      translateNode(document.body);
      injectSwitcher();
    }, 40);
  }

  function startObserver() {
    if (!document.body) return;
    const observer = new MutationObserver(() => scheduleReTranslate());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function init() {
    applyLanguage();
    injectSwitcher();
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── 7. API publique ────────────────────────────────────── */
  window.WH_I18N = {
    LANGS,
    t,
    getLanguage,
    setLanguage,
    translateNode,
    toggleMenu,
    select,
  };
})();
