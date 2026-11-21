import { esc, svg, I, sb, configured, getProfile, isStaff, toast, favs } from '../core.js';
import { shell, notConfigured, brand } from '../ui.js';

export async function profil() {
  if (!configured) { shell(notConfigured(), 'profil'); return; }
  const prof = await getProfile(true).catch(() => null);
  if (!prof) return authScreen();
  let owner = false; try { const { count } = await sb.from('places').select('id', { count: 'exact', head: true }).eq('owner_id', prof.uid); owner = count > 0; } catch { }
  const role = { admin: 'Administrateur', agent: 'Agent terrain', user: 'Membre' }[prof.role] || 'Membre';
  const item = (href, ic, label, sub) => `<a class="pm" href="${href}"><span class="ic">${svg(ic, 20, '#1E6BE0')}</span><span style="flex:1">${label}${sub ? `<div class="sub" style="margin:2px 0 0;font-weight:500">${sub}</div>` : ''}</span>${svg(I.chev, 18, '#9AA0B4')}</a>`;
  shell(`<div class="hero safe-top" style="padding-bottom:34px"><div style="display:flex;gap:14px;align-items:center"><div class="av" style="width:64px;height:64px;background:#fff;color:#142A52;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;font-family:'Space Grotesk'">${esc(prof.full_name.slice(0, 1).toUpperCase())}</div>
    <div style="min-width:0"><h1 style="font-size:21px">${esc(prof.full_name)}</h1><div style="font-size:12.5px;opacity:.85;overflow:hidden;text-overflow:ellipsis">${esc(prof.email)}</div><span class="pill" style="background:rgba(255,255,255,.2);color:#fff;margin-top:6px">${role}</span></div></div></div>
    <div class="pcard" style="margin-top:-18px;position:relative">${prof.must_change_pw ? `<a class="msg err" id="pwn" style="display:block;margin:0 0 10px;text-decoration:none"><b>Choisissez votre mot de passe.</b><br>Le mot de passe provisoire reçu doit être remplacé. Touchez ici.</a>` : ''}${item('#/notifs', I.bell, 'Notifications', 'Validations, demandes, avis')}${item('#/favs', I.heart, 'Mes favoris', `${favs.get().length} lieu(x)`)}${item('#/messages', I.msg, 'Mes messages')}
    ${owner || prof.role === 'admin' ? item('#/manage', I.edit, 'Mon espace client', 'Menu, chambres, produits, tarifs, photos') : ''}${prof.role === 'user' ? item('#/claim', I.plus, 'Inscrire mon entreprise', 'Soyez visible sur Bangui Guide') : ''}${prof.role === 'admin' ? item('#/admin', I.check, 'Espace administrateur', 'Agents, fiches à valider, demandes, lieux') : ''}${isStaff(prof) ? item('#/agent', I.cam, 'Espace agent', 'Enregistrer des clients et des lieux') : ''}</div>
    <div class="pcard"><button class="pm" id="pwb"><span class="ic">${svg(I.edit, 20, '#1E6BE0')}</span><span style="flex:1">Changer mon mot de passe</span></button></div>
    <div class="pcard"><button class="pm" id="lo"><span class="ic" style="background:#FFF1F0">${svg(I.logout, 20, '#C23B3B')}</span><span style="flex:1;color:#C23B3B">Se déconnecter</span></button></div>
    <div class="sub" style="text-align:center;padding:6px 0 24px">Bangui Guide · version 2</div>`, 'profil');
  document.getElementById('lo').onclick = async () => { await sb.auth.signOut(); profil(); };
  const pwb = document.getElementById('pwb'); if (pwb) pwb.onclick = () => openPwSheet(() => profil());
  const pwn = document.getElementById('pwn'); if (pwn) pwn.onclick = () => openPwSheet(() => profil());
  if (prof.must_change_pw && !sessionStorage.getItem('bg_pwask')) { sessionStorage.setItem('bg_pwask', '1'); openPwSheet(() => profil()); }
}

/* Changer son mot de passe (obligatoire à la première connexion d'un compte créé par un agent ou l'administrateur) */
function openPwSheet(done) {
  const old = document.getElementById('mgsh'); if (old) old.remove();
  const el = document.createElement('div'); el.id = 'mgsh'; el.className = 'mgsh';
  el.innerHTML = `<div class="mgsc"></div><div class="mgsp"><div class="mgsx"><b>Changer mon mot de passe</b><button class="back" id="pw_x" aria-label="Fermer">${svg('<path d="M6 6l12 12M18 6 6 18"/>', 18, '#142A52', 2.2)}</button></div>
    <div id="pw_e"></div><div class="field"><label>Nouveau mot de passe (6 caractères min.)</label><input id="pw_1" type="password" autocomplete="new-password" minlength="6"></div>
    <div class="field"><label>Confirmer</label><input id="pw_2" type="password" autocomplete="new-password"></div><button class="btn" id="pw_ok">Enregistrer</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
  const q = i => el.querySelector('#' + i), close = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 250); };
  q('pw_x').onclick = close; el.querySelector('.mgsc').onclick = close;
  q('pw_ok').onclick = async () => {
    const a = q('pw_1').value, b = q('pw_2').value, err = m => q('pw_e').innerHTML = `<div class="msg err">${esc(m)}</div>`;
    if (a.length < 6) return err('6 caractères minimum.'); if (a !== b) return err('Les deux mots de passe sont différents.');
    q('pw_ok').disabled = true; q('pw_ok').textContent = '…';
    const { error } = await sb.auth.updateUser({ password: a });
    if (error) { err(/same/i.test(error.message) ? 'Choisissez un mot de passe différent de l’actuel.' : error.message); q('pw_ok').disabled = false; q('pw_ok').textContent = 'Enregistrer'; return; }
    await sb.rpc('pw_changed'); toast('Mot de passe modifié'); close(); done && done();
  };
}

function authScreen() {
  let mode = 'in';
  const draw = () => {
    shell(`<div class="hero safe-top" style="padding-bottom:36px"><div class="logo" style="width:max-content;padding:3px"><img src="logo.png" alt="" style="height:46px"></div><h1 style="font-size:23px;margin-top:12px">Bienvenue sur ${brand}</h1><div style="font-size:13px;opacity:.85;margin-top:4px">Connectez-vous pour écrire aux établissements, donner votre avis et plus encore.</div></div>
      <form class="pad" style="padding-top:20px" id="af"><div class="seg"><button type="button" class="${mode === 'in' ? 'on' : ''}" data-m="in">Connexion</button><button type="button" class="${mode === 'up' ? 'on' : ''}" data-m="up">Créer un compte</button></div><div id="ae"></div>
      ${mode === 'up' ? '<div class="field"><label>Votre nom</label><input id="an" autocomplete="name" required maxlength="60"></div>' : ''}
      <div class="field"><label>${mode === 'in' ? 'Email ou identifiant' : 'Email'}</label><input id="ae1" type="${mode === 'in' ? 'text' : 'email'}" autocapitalize="none" autocomplete="username" required></div>
      <div class="field"><label>Mot de passe</label><input id="ap" type="password" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" required ${mode === 'in' ? '' : 'minlength="6"'}></div>
      <button class="btn" id="ab">${mode === 'in' ? 'Se connecter' : 'Créer mon compte'}</button></form>`, 'profil');
    document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
    document.getElementById('af').onsubmit = async e => {
      e.preventDefault(); const b = document.getElementById('ab'), err = document.getElementById('ae'); b.disabled = true; const label = b.textContent; b.textContent = '…';
      let email = document.getElementById('ae1').value.trim(); if (mode === 'in' && email && !email.includes('@')) email += '@bangui.demo'; const password = document.getElementById('ap').value;
      let res;
      if (mode === 'in') res = await sb.auth.signInWithPassword({ email, password });
      else res = await sb.auth.signUp({ email, password, options: { data: { full_name: document.getElementById('an').value.trim() } } });
      if (res.error) { const m = res.error.message; err.innerHTML = `<div class="msg err">${esc(/Invalid login/i.test(m) ? 'Email ou mot de passe incorrect.' : /already registered/i.test(m) ? 'Un compte existe déjà avec cet email.' : /Email not confirmed/i.test(m) ? 'Confirme ton email avant de te connecter.' : m)}</div>`; b.disabled = false; b.textContent = label; return; }
      if (!res.data.session) { err.innerHTML = '<div class="msg info">Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.</div>'; b.disabled = false; b.textContent = label; return; }
      const next = sessionStorage.getItem('bg_next'); sessionStorage.removeItem('bg_next');
      location.hash = next || '#/profil'; if (!next) profil();
    };
  };
  draw();
}
