/* ==========================================================
   WorldHub — auth-guard.js
   Issues 2, 8, 9, 10: session validation, auth state listener,
   logout helper, and centralised error display.
   Include AFTER supabase.js on every protected page.
   ========================================================== */

/* ── 1. Centralised toast / error display (Issue 10) ─────────────── */
/* showToast(msg, type) — generic toast used both for errors (red) and
   confirmations like "Lien copié" / "Publication créée" (green/neutral).
   Kept in this file (rather than app.js) so it's available on every
   protected AND public page that includes auth-guard.js. */
function showToast(msg, type = 'error') {
  let toast = document.getElementById('wh-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wh-toast';
    document.body.appendChild(toast);
  }
  const palette = {
    error:   { bg: 'var(--red-soft)',   border: 'var(--red)'   },
    success: { bg: 'var(--green-soft)', border: 'var(--green)' },
    info:    { bg: 'var(--surface-3)',  border: 'var(--border)'},
  }[type] || { bg: 'var(--surface-3)', border: 'var(--border)' };
  toast.style.cssText = [
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%)',
    `background:${palette.bg};border:1px solid ${palette.border}`,
    'color:var(--text-1);padding:12px 20px;border-radius:var(--radius-md)',
    'font-size:14px;z-index:9999;max-width:380px;text-align:center',
    'box-shadow:0 8px 24px rgba(0,0,0,.5)',
  ].join(';');
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.hidden = true; }, 4000);
}

function showError(error, container) {
  const msg = (error && error.message) ? error.message : 'Une erreur inattendue est survenue.';
  console.error('[WorldHub]', error);
  if (container) {
    container.textContent = msg;
    container.hidden = false;
  } else {
    showToast(msg, 'error');
  }
}

/* ── 2. requireAuth — redirect to login if not authenticated (Issue 2) ── */
async function requireAuth() {
  try {
    const session = await DB.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    return session;
  } catch (err) {
    showError(err);
    window.location.href = 'login.html';
    return null;
  }
}

/* ── 3. Global auth state listener — react to sign-out (Issue 8) ─────── */
(function wireAuthStateListener() {
  if (!DB.isConnected || !DB.sbClient) return;

  DB.sbClient.auth.onAuthStateChange((event, session) => {
    /* If the user signs out from another tab or the token expires,
       redirect every open protected page to login. */
    if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
      /* Avoid redirect loop if we're already on login page */
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
      }
    }
  });
})();

/* ── 4. logout helper (Issue 9) ───────────────────────────── */
async function logout() {
  try {
    await DB.signOut();
  } catch (err) {
    showError(err);
  } finally {
    /* Always redirect, even if signOut threw */
    window.location.href = 'login.html';
  }
}
