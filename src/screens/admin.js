import { esc, svg, I, sb, configured, getProfile, toast, pickPhoto, uploadPhoto } from '../core.js';
import { CAT } from '../data.js';
import { plain, topbar, bindBack, errBox, notConfigured, rowHtml, photoBox } from '../ui.js';
import { cardPhoto } from './explore.js';
import { adHtml, adLive } from '../ads.js';
import { billingSheet, invoiceRow, stChip, money, loadTarifs, TARIFS_DEF } from '../billing.js';

const TABS = [['ov', 'Aperçu'], ['val', 'Valider'], ['ag', 'Agents'], ['pub', 'Pub'], ['fac', 'Factures'], ['pl', 'Lieux']];
export async function admin() {
  if (!configured) { plain(topbar('Administration') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null); if (!prof || prof.role !== 'admin') { location.hash = '#/profil'; return; }
  let tab = sessionStorage.getItem('bg_admtab') || 'ov', ov = null, pend = null;
  plain(`<div class="mgh safe-top"><div class="mgt"><button class="back" id="back">${svg(I.back, 20)}</button><div><small>Espace administrateur</small><h1>Bangui Guide</h1></div></div></div>
    <div class="mgtabs" id="a_tabs">${TABS.map(([k, l]) => `<button data-t="${k}">${l}<i class="abdg" id="b_${k}"></i></button>`).join('')}</div><div class="mgbody" id="a_body"></div>`);
  bindBack(); const $ = i => document.getElementById(i);
  const badge = (k, n) => { const b = $('b_' + k); if (b) { b.textContent = n || ''; b.style.display = n ? 'inline-flex' : 'none'; } };
  const show = t => { tab = t; sessionStorage.setItem('bg_admtab', t); document.querySelectorAll('#a_tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); ({ ov: drawOv, val: drawVal, ag: drawAg, pub: drawPub, fac: drawFac, pl: drawPl })[t](); };
  document.querySelectorAll('#a_tabs button').forEach(b => b.onclick = () => show(b.dataset.t));
  const rpc = async (n, a) => { const { data, error } = await sb.rpc(n, a); if (error) throw error; return data; };

  /* ----- Aperçu ----- */
  async function drawOv() {
    $('a_body').innerHTML = '<div class="empty">Chargement…</div>';
    try { ov = await rpc('admin_overview'); } catch (e) { $('a_body').innerHTML = errBox(e) + '<div class="sub" style="padding:8px">Si l’erreur parle d’une fonction manquante, exécutez migration_v5.sql dans Supabase.</div>'; return; }
    badge('val', ov.pending);
    const T = [['published', 'Lieux publiés', '#1FA64D'], ['pending', 'À valider', '#E2541F'], ['agents', 'Agents', '#1E6BE0'], ['owners', 'Clients actifs', '#9B2FC9'], ['claims', 'Demandes clients', '#E2541F'], ['sponsored', 'Sponsorisés', '#F5841F'], ['users', 'Comptes', '#142A52'], ['ads', 'Pubs en ligne', '#F5841F'], ['inv_due', 'À encaisser (FCFA)', '#E2541F'], ['inv_paid', 'Encaissé (FCFA)', '#1FA64D'], ['revenue', 'Pubs payées (FCFA)', '#1FA64D']];
    $('a_body').innerHTML = `<div class="mgst">${T.map(([k, l, c]) => `<div style="border-left:4px solid ${c}"><b>${/revenue|inv_/.test(k) ? String(ov[k] ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') : (ov[k] ?? 0)}</b><span>${l}</span></div>`).join('')}</div>
      <a class="card2 mgln" href="#/admin/claims"><span>${svg(I.plus, 22, '#E2541F', 2)}</span><div><b>Demandes d’entreprises</b><div class="sub">${ov.claims ? ov.claims + ' en attente' : 'Aucune demande en attente'}</div></div>${svg('<path d="m9 6 6 6-6 6"/>', 18, '#8A90A3', 2)}</a>
      <a class="card2 mgln" href="#/agent/new"><span>${svg(I.pin, 22, '#1E3A8A', 2)}</span><div><b>Enregistrer un lieu</b><div class="sub">Créer vous-même une fiche (publiée directement)</div></div>${svg('<path d="m9 6 6 6-6 6"/>', 18, '#8A90A3', 2)}</a>`;
  }

  /* ----- Fiches à valider ----- */
  async function drawVal() {
    $('a_body').innerHTML = '<div class="empty">Chargement…</div>';
    try { pend = await rpc('admin_pending'); } catch (e) { $('a_body').innerHTML = errBox(e); return; }
    const TAR = await loadTarifs(); badge('val', pend.length);
    $('a_body').innerHTML = pend.length ? pend.map(p => `<div class="card2 avl" data-p="${p.id}"><div style="display:flex;gap:12px"><span class="mth big" style="background:center/cover url('${esc(cardPhoto(p) || '')}')"></span><div class="mgin"><b>${esc(p.name)}</b><small>${esc(CAT[p.category]?.label || p.category)}${p.area ? ' · ' + esc(p.area) : ''}</small><small>Par ${esc(p.agent_name || 'agent')} · ${new Date(p.created_at).toLocaleDateString('fr-FR')}</small><small>${p.n_items} élément(s) · ${p.phone ? esc(p.phone) : 'sans téléphone'}</small></div></div>
      ${p.description ? `<div class="sub" style="margin:8px 0 0">${esc(p.description)}</div>` : ''}
      <div class="sub" style="margin:10px 0 0">À la publication, la facture d’inscription (${money(TAR.inscription)}) est envoyée au client.</div><div style="display:flex;gap:8px;margin-top:8px"><div class="field" style="flex:1;margin:0"><label>Abonnement</label><select data-pl><option value="">Aucun</option><option value="mensuel">Mensuel · ${money(TAR.mensuel)}</option><option value="annuel">Annuel · ${money(TAR.annuel)}</option></select></div><div class="field" style="flex:1;margin:0"><label>Sponsoring</label><select data-sp><option value="0">Aucun</option>${[1, 2, 4, 8, 12].map(n => `<option value="${n}">${n} sem. · ${money(TAR.sponsoring * n)}</option>`).join('')}</select></div></div><div style="display:flex;gap:8px;margin-top:10px"><a class="btn ghost" href="#/place/${p.id}" style="flex:1;padding:10px;text-align:center">Voir la fiche</a><button class="btn ok" data-a="published" style="flex:1;padding:10px">Publier</button><button class="btn no" data-a="rejected" style="flex:1;padding:10px">Refuser</button></div></div>`).join('') : '<div class="mgem"><p>Rien à valider pour le moment. Les fiches enregistrées par vos agents apparaissent ici.</p></div>';
    document.querySelectorAll('.avl [data-a]').forEach(b => b.onclick = async () => {
      const id = b.closest('.avl').dataset.p, pub = b.dataset.a === 'published'; let why = null;
      if (!pub) { why = prompt('Motif du refus (visible par l’agent) :', ''); if (why === null) return; }
      b.disabled = true;
      const upd = { status: b.dataset.a, verified: pub, reject_reason: pub ? null : (why.trim() || null) };
      const { error } = await sb.from('places').update(upd).eq('id', id);
      if (error) { toast('Erreur : ' + error.message); b.disabled = false; return; }
      if (pub) { const card = b.closest('.avl'), pl = card.querySelector('[data-pl]')?.value, wk = +(card.querySelector('[data-sp]')?.value || 0);
        try { if (pl) await rpc('create_invoice', { p_place: id, p_kind: pl, p_qty: 1 }); if (wk) await rpc('create_invoice', { p_place: id, p_kind: 'sponsoring', p_qty: wk }); } catch (e) { toast('Fiche publiée, facture non créée : ' + e.message); drawVal(); return; } }
      toast(pub ? 'Fiche publiée · facture(s) envoyée(s) au client' : 'Fiche refusée'); drawVal();
    });
  }

  /* ----- Agents ----- */
  async function drawAg() {
    $('a_body').innerHTML = '<div class="empty">Chargement…</div>';
    let ag; try { ag = await rpc('admin_agents'); } catch (e) { $('a_body').innerHTML = errBox(e); return; }
    $('a_body').innerHTML = `<div class="mgct"><h2>Mes agents</h2><span>${ag.length}</span></div>
      ${ag.length ? ag.map(a => `<div class="card2"><div style="display:flex;align-items:center;gap:12px"><span class="mth big ic" style="width:48px;height:48px">${svg(I.user || '<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/>', 24, '#1E3A8A', 1.8)}</span><div class="mgin"><b>${esc(a.name || a.email)}</b><small>${esc(a.email)}</small><small>${a.total} fiche(s) · ${a.published} publiée(s) · <b style="color:#E2541F">${a.pending} en attente</b></small></div></div>
        <button class="btn ghost" data-rm="${esc(a.email)}" style="margin-top:10px;padding:9px;color:#C23B3B">Retirer le rôle d’agent</button></div>`).join('') : '<div class="mgem"><p>Aucun agent. Créez le premier ci-dessous.</p></div>'}
      <div class="card2"><div class="sh">Créer un agent</div><div id="ag_e"></div>
        <div class="field"><label>Nom complet</label><input id="ag_n" maxlength="80"></div>
        <div class="field"><label>Email de connexion</label><input id="ag_m" type="email" autocapitalize="none"></div>
        <div class="field"><label>Mot de passe provisoire (8 caractères min.)</label><input id="ag_p" type="text" autocapitalize="none" value="${Math.random().toString(36).slice(2, 6)}${Math.random().toString(36).slice(2, 6)}"></div>
        <button class="btn" id="ag_ok">Créer l’agent</button><div class="sub" style="margin-top:8px">Communiquez-lui l’email et ce mot de passe : il devra en choisir un nouveau à sa première connexion. Il pourra se connecter dans « Profil ». Aucun email de confirmation n’est nécessaire. Si la personne a déjà un compte, saisissez son email : elle deviendra agent.</div></div>
      <div class="card2"><div class="sh">Réinitialiser un mot de passe</div><div id="rp_e"></div>
        <div class="field"><label>Email du compte (agent, client…)</label><input id="rp_m" type="email" autocapitalize="none"></div>
        <div class="field"><label>Nouveau mot de passe provisoire</label><input id="rp_p" type="text" autocapitalize="none" value="${Math.random().toString(36).slice(2, 6)}${Math.random().toString(36).slice(2, 6)}"></div>
        <button class="btn ghost" id="rp_ok">Réinitialiser</button><div class="sub" style="margin-top:8px">La personne devra choisir un nouveau mot de passe à sa prochaine connexion.</div></div>`;
    document.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { if (!confirm('Retirer le rôle d’agent ?')) return; try { toast(await rpc('admin_set_role', { p_email: b.dataset.rm, p_role: 'user' })); drawAg(); } catch (e) { toast('Erreur : ' + e.message); } });
    $('rp_ok').onclick = async () => {
      const em = $('rp_m').value.trim(), pw = $('rp_p').value, e = m => $('rp_e').innerHTML = `<div class="msg ${m[0]}">${esc(m[1])}</div>`;
      if (!/^\S+@\S+\.\S+$/.test(em)) return e(['err', 'Email invalide']); if (pw.length < 6) return e(['err', 'Mot de passe : 6 caractères minimum']);
      $('rp_ok').disabled = true; try { const r = await rpc('staff_reset_password', { p_email: em, p_password: pw }); e(r === 'OK' ? ['info', `Mot de passe de ${em} remplacé. Communiquez-lui : ${pw}`] : ['err', r]); } catch (x) { e(['err', x.message]); } $('rp_ok').disabled = false;
    };
    $('ag_ok').onclick = async () => {
      const name = $('ag_n').value.trim(), email = $('ag_m').value.trim().toLowerCase(), pw = $('ag_p').value; const err = m => $('ag_e').innerHTML = `<div class="msg err">${esc(m)}</div>`;
      if (!/^\S+@\S+\.\S+$/.test(email)) return err('Email invalide'); if (pw.length < 8) return err('Mot de passe : 8 caractères minimum');
      const b = $('ag_ok'); b.disabled = true; b.textContent = 'Création…';
      try {
        const r = await rpc('staff_create_user', { p_email: email, p_password: pw, p_name: name, p_role: 'agent' });
        if (r?.existed) toast('Ce compte existait déjà : il est maintenant agent');
        toast('Agent créé'); drawAg();
      } catch (e) { err(e.message || 'Erreur'); b.disabled = false; b.textContent = 'Créer l’agent'; }
    };
  }


  /* ----- Publicités (sponsoring) ----- */
  async function drawPub() {
    $('a_body').innerHTML = '<div class="empty">Chargement…</div>';
    const { data, error } = await sb.from('ads').select('*').order('sort').order('created_at', { ascending: false }); let stats = {}; try { stats = await rpc('admin_ad_stats'); } catch { }
    if (error) { $('a_body').innerHTML = errBox(error) + '<div class="sub" style="padding:8px">Exécutez migration_v6.sql dans Supabase.</div>'; return; }
    const st = a => !a.active ? ['off', 'Désactivée'] : adLive(a) ? ['on', 'En ligne'] : (a.starts_on && a.starts_on > new Date().toISOString().slice(0, 10)) ? ['soon', 'Programmée'] : ['off', 'Terminée'];
    $('a_body').innerHTML = `<div class="mgct"><h2>Publicités</h2><span>${data.length}</span></div>
      <div class="sub" style="margin:0 2px 10px">Affichées en bannière sur l’accueil, avec les lieux sponsorisés. Deux modèles : <b>image seule</b> (votre affiche, mise au format) ou <b>texte + image</b>.</div>
      ${data.length ? data.map((a, i) => { const s = st(a), k = stats[a.id] || { views: 0, clicks: 0 }, left = a.ends_on ? Math.ceil((new Date(a.ends_on) - new Date(new Date().toISOString().slice(0, 10))) / 864e5) : null;
        return `<div class="adrow" data-id="${a.id}"><span class="mth" style="background:center/cover url('${esc(a.image_url || '')}')"></span><div class="mgin"><b>${esc(a.title || a.advertiser || (a.model === 'image' ? 'Affiche' : 'Pub'))}</b><small>${a.advertiser ? esc(a.advertiser) + ' · ' : ''}${a.model === 'image' ? 'Image seule' : 'Texte + image'}${left != null ? (left < 0 ? ' · terminée' : left <= 7 ? ' · <b style="color:#C23B3B">échéance dans ' + left + ' j</b>' : ' · jusqu’au ' + new Date(a.ends_on).toLocaleDateString('fr-FR')) : ''}</small><small>${k.views} affichages · ${k.clicks} clics${k.views ? ' (' + (k.clicks * 100 / k.views).toFixed(1) + ' %)' : ''}${a.amount ? ' · ' + a.amount + ' FCFA ' + (a.paid ? '<b style="color:#1E7A43">payé</b>' : '<b style="color:#C23B3B">à encaisser</b>') : ''}</small></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="adst ${s[0]}">${s[1]}</span><span style="display:flex;gap:4px"><button class="adup" data-mv="-1" aria-label="Monter" ${i === 0 ? 'disabled' : ''}>▲</button><button class="adup" data-mv="1" aria-label="Descendre" ${i === data.length - 1 ? 'disabled' : ''}>▼</button></span></div></div>`; }).join('') : '<div class="mgem"><p>Aucune publicité. Créez la première.</p></div>'}
      <button class="btn mgadd" id="pb_add">${svg(I.plus, 20, '#fff', 2.4)} Nouvelle publicité</button>`;
    $('pb_add').onclick = () => openAd(null);
    document.querySelectorAll('.adrow').forEach(r => r.onclick = () => openAd(data.find(x => x.id === r.dataset.id)));
    document.querySelectorAll('.adup').forEach(b => b.onclick = async e => { e.stopPropagation(); const row = b.closest('.adrow'), i = data.findIndex(x => x.id === row.dataset.id), j = i + +b.dataset.mv; if (j < 0 || j >= data.length) return;
      const arr = data.slice(); [arr[i], arr[j]] = [arr[j], arr[i]]; try { await Promise.all(arr.map((x, n) => sb.from('ads').update({ sort: n }).eq('id', x.id))); } catch { toast('Erreur'); } drawPub(); });
  }
  function openAd(ad) {
    const a = { model: 'image', title: '', body: '', cta: 'Découvrir', image_url: '', place_id: null, link_url: '', starts_on: '', ends_on: '', active: true, paid: false, ...(ad || {}) }; let img = null, tgt = a.place_id ? 'place' : a.link_url ? 'link' : 'none', placeName = '';
    const old = document.getElementById('mgsh'); if (old) old.remove();
    const el = document.createElement('div'); el.id = 'mgsh'; el.className = 'mgsh';
    el.innerHTML = `<div class="mgsc"></div><div class="mgsp"><div class="mgsx"><b>${ad ? 'Modifier la publicité' : 'Nouvelle publicité'}</b><button class="back" id="x_x" aria-label="Fermer">${svg('<path d="M6 6l12 12M18 6 6 18"/>', 18, '#142A52', 2.2)}</button></div>
      <div class="adprev homec" id="x_prev"></div>
      <div class="admodel"><button type="button" data-m="image"><i></i>Image seule<small>Votre affiche, mise au format de la bannière</small></button><button type="button" data-m="text"><i></i>Texte + image<small>Titre, texte et bouton, image à côté</small></button></div>
      <button type="button" class="mgph" id="x_ph" style="height:96px;margin-bottom:10px"></button><div class="sub" style="margin:-4px 0 10px" id="x_hint"></div>
      <div id="x_txt"><div class="field"><label>Titre</label><input id="x_t" maxlength="60"></div><div class="field"><label>Texte</label><input id="x_b" maxlength="110"></div><div class="field"><label>Bouton</label><input id="x_c" maxlength="20"></div></div>
      <div class="field"><label>Au toucher, ouvrir</label><div class="seg" id="x_seg"><button type="button" data-g="place">Une fiche</button><button type="button" data-g="link">Lien / appel</button><button type="button" data-g="none">Rien</button></div>
        <div id="x_pl" style="display:none"><input id="x_q" type="search" placeholder="Rechercher la fiche du client…"><div id="x_r" class="sub"></div></div>
        <div id="x_lk" style="display:none"><input id="x_u" maxlength="200" placeholder="https://… ou +236 70 00 00 00"></div></div>
      <div style="display:flex;gap:8px"><div class="field" style="flex:1"><label>Début</label><input id="x_s" type="date"></div><div class="field" style="flex:1"><label>Fin</label><input id="x_e" type="date"></div></div>
      <div class="field"><label>Annonceur (client)</label><input id="x_adv" maxlength="80" placeholder="Ex : Shopping Center"></div>
      <div style="display:flex;gap:8px;align-items:flex-end"><div class="field" style="flex:1"><label>Montant (FCFA)</label><input id="x_am" type="number" inputmode="numeric" min="0"></div><div class="mgrow" style="flex:1;margin:0 0 14px"><b>Payé</b><button type="button" class="sw ${a.paid ? 'on' : ''}" id="x_pd"><i></i></button></div></div>
      <div class="mgrow" style="margin:4px 0 14px"><b>Publicité active</b><button type="button" class="sw ${a.active ? 'on' : ''}" id="x_a"><i></i></button></div>
      <button class="btn" id="x_ok">${ad ? 'Enregistrer' : 'Publier la publicité'}</button>${ad ? '<button class="btn ghost" id="x_del" style="margin-top:8px;color:#C23B3B">Supprimer</button>' : ''}</div>`;
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
    const q = i => el.querySelector('#' + i), close = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 250); };
    q('x_t').value = a.title || ''; q('x_b').value = a.body || ''; q('x_c').value = a.cta || 'Découvrir'; q('x_u').value = a.link_url || ''; q('x_s').value = a.starts_on || ''; q('x_e').value = a.ends_on || '';
    const prev = () => { const cur = { ...a, title: q('x_t').value, body: q('x_b').value, cta: q('x_c').value || 'Découvrir', image_url: img || a.image_url }; q('x_prev').innerHTML = adHtml(cur, true);
      el.querySelectorAll('.admodel button').forEach(b => b.classList.toggle('on', b.dataset.m === a.model)); q('x_txt').style.display = a.model === 'text' ? 'block' : 'none';
      const has = img || a.image_url; q('x_ph').style.cssText = `height:96px;margin-bottom:10px;${has ? `background:center/cover url('${img || a.image_url}');color:#fff` : ''}`; q('x_ph').innerHTML = has ? `<span style="background:rgba(10,20,50,.6);border-radius:999px;padding:5px 12px">Changer l’image</span>` : `${svg(I.cam, 26, '#1E3A8A', 1.8)}<span>Ajouter l’image</span>`;
      q('x_hint').textContent = a.model === 'image' ? 'Format conseillé : horizontal large, environ 1200 × 275 px. L’image est recadrée pour remplir la bannière : gardez le texte important au centre.' : 'Format conseillé : image carrée ou 4/3, affichée à gauche du texte.';
      el.querySelectorAll('#x_seg button').forEach(b => b.classList.toggle('on', b.dataset.g === tgt)); q('x_pl').style.display = tgt === 'place' ? 'block' : 'none'; q('x_lk').style.display = tgt === 'link' ? 'block' : 'none'; };
    el.querySelectorAll('.admodel button').forEach(b => b.onclick = () => { a.model = b.dataset.m; prev(); });
    el.querySelectorAll('#x_seg button').forEach(b => b.onclick = () => { tgt = b.dataset.g; prev(); });
    ['x_t', 'x_b', 'x_c'].forEach(k => q(k).oninput = prev);
    q('x_adv').value = a.advertiser || ''; q('x_am').value = a.amount ?? ''; q('x_pd').onclick = () => { a.paid = !a.paid; q('x_pd').classList.toggle('on', a.paid); };
    q('x_a').onclick = () => { a.active = !a.active; q('x_a').classList.toggle('on', a.active); };
    q('x_ph').onclick = async () => { try { const p = await pickPhoto(); if (p) { img = p; prev(); } } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Photo impossible'); } };
    if (a.place_id) sb.from('places').select('name').eq('id', a.place_id).maybeSingle().then(r => { placeName = r.data?.name || ''; q('x_r').innerHTML = placeName ? `Fiche choisie : <b>${esc(placeName)}</b>` : ''; });
    let t; q('x_q').oninput = () => { clearTimeout(t); t = setTimeout(async () => { const term = q('x_q').value.trim().replace(/[%,()]/g, ' '); if (term.length < 2) { q('x_r').innerHTML = ''; return; } const { data } = await sb.from('places').select('id,name,area').eq('status', 'published').ilike('name', `%${term}%`).limit(6); q('x_r').innerHTML = (data || []).map(p => `<button type="button" class="fc" data-p="${p.id}" data-n="${esc(p.name)}" style="margin:3px 4px 0 0">${esc(p.name)}${p.area ? ' · ' + esc(p.area) : ''}</button>`).join('') || 'Aucun résultat';
      q('x_r').querySelectorAll('[data-p]').forEach(b => b.onclick = () => { a.place_id = b.dataset.p; placeName = b.dataset.n; q('x_r').innerHTML = `Fiche choisie : <b>${esc(placeName)}</b>`; }); }, 300); };
    q('x_x').onclick = close; el.querySelector('.mgsc').onclick = close;
    const del = q('x_del'); if (del) del.onclick = async () => { if (!confirm('Supprimer cette publicité ?')) return; const { error } = await sb.from('ads').delete().eq('id', ad.id); if (error) { toast('Erreur : ' + error.message); return; } toast('Supprimée'); close(); drawPub(); };
    q('x_ok').onclick = async () => {
      if (!(img || a.image_url)) { toast('Ajoutez une image'); return; } if (a.model === 'text' && !q('x_t').value.trim()) { toast('Ajoutez un titre'); return; }
      if (tgt === 'place' && !a.place_id) { toast('Choisissez la fiche à ouvrir'); return; }
      const b = q('x_ok'); b.disabled = true; b.textContent = 'Enregistrement…';
      try {
        const url = img ? await uploadPhoto(prof.uid, img) : a.image_url;
        const row = { model: a.model, title: q('x_t').value.trim() || null, body: a.model === 'text' ? q('x_b').value.trim() || null : null, cta: q('x_c').value.trim() || 'Découvrir', image_url: url, place_id: tgt === 'place' ? a.place_id : null, link_url: tgt === 'link' ? q('x_u').value.trim() || null : null, starts_on: q('x_s').value || null, ends_on: q('x_e').value || null, active: a.active, advertiser: q('x_adv').value.trim() || null, amount: q('x_am').value ? Math.round(+q('x_am').value) : null, paid: !!a.paid };
        const r = ad ? await sb.from('ads').update(row).eq('id', ad.id) : await sb.from('ads').insert(row); if (r.error) throw r.error;
        toast(ad ? 'Publicité modifiée' : 'Publicité publiée'); close(); drawPub();
      } catch (e) { toast('Erreur : ' + (e.message || e)); b.disabled = false; b.textContent = ad ? 'Enregistrer' : 'Publier la publicité'; }
    };
    prev();
  }

  /* ----- Factures ----- */
  let fFilter = 'due';
  async function drawFac() {
    $('a_body').innerHTML = '<div class="empty">Chargement…</div>';
    let sm; try { sm = await rpc('admin_billing_summary'); } catch (e) { $('a_body').innerHTML = errBox(e); return; }
    const T = await loadTarifs();
    const { data, error } = await sb.from('invoices').select('*, places(id,name,plan,plan_until,sponsored,sponsored_until)').order('created_at', { ascending: false }).limit(150);
    if (error) { $('a_body').innerHTML = errBox(error); return; }
    const list = (data || []).filter(i => fFilter === 'all' || i.status === fFilter);
    $('a_body').innerHTML = `<div class="mgst"><div style="border-left:4px solid #E2541F"><b>${money(sm.due)}</b><span>À encaisser · ${sm.due_n} facture(s)</span></div><div style="border-left:4px solid #1FA64D"><b>${money(sm.paid_month)}</b><span>Encaissé ce mois</span></div>
        <div style="border-left:4px solid #142A52"><b>${money(sm.paid)}</b><span>Encaissé au total</span></div><div style="border-left:4px solid #F5841F"><b>${sm.expiring}</b><span>Abonnements à renouveler (7 j)</span></div></div>
      ${(sm.by_collector || []).length ? `<div class="card2" style="margin-top:10px"><div class="sh">Encaissements par personne</div>${(sm.by_collector || []).map(c => `<div class="mgrow" style="padding:6px 0;border-bottom:1px solid #EDF0F8"><span>${esc(c.name)} <small style="color:#8A90A3">(${c.n})</small></span><b style="color:#142A52">${money(c.total)}</b></div>`).join('')}<div class="sub" style="margin-top:6px">Somme à récupérer auprès de chaque agent qui a encaissé en espèces.</div></div>` : ''}
      <div class="fchips xch" id="f_ch" style="margin:10px 0">${[['due', 'À payer'], ['paid', 'Payées'], ['all', 'Toutes']].map(([k, l]) => `<button class="fc ${fFilter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      ${list.length ? list.map(i => invoiceRow(i, ' · ' + esc(i.places?.name || '') + (i.status === 'paid' && i.collector_name ? ' · par ' + esc(i.collector_name) : ''))).join('') : '<div class="mgem"><p>Aucune facture dans cette liste.</p></div>'}
      <div class="card2" style="margin-top:10px"><div class="sh">Tarifs (FCFA)</div><div id="t_e"></div>${[['inscription', 'Inscription'], ['mensuel', 'Abonnement mensuel'], ['annuel', 'Abonnement annuel'], ['sponsoring', 'Sponsoring par semaine']].map(([k, l]) => `<div class="field"><label>${l}</label><input type="number" inputmode="numeric" min="0" data-t="${k}" value="${T[k]}"></div>`).join('')}
        <button class="btn ghost" id="t_ok">Enregistrer les tarifs</button><div class="sub" style="margin-top:6px">Les nouveaux tarifs s’appliquent aux prochaines factures ; les factures déjà émises ne changent pas.</div></div>`;
    document.querySelectorAll('#f_ch [data-f]').forEach(b => b.onclick = () => { fFilter = b.dataset.f; drawFac(); });
    document.querySelectorAll('[data-iv]').forEach(b => b.onclick = () => { const iv = data.find(x => x.id === b.dataset.iv); billingSheet({ ...(iv.places || {}), id: iv.place_id }, { collect: true, create: true, sponsor: true, cancel: true }, () => drawFac(), iv.id); });
    $('t_ok').onclick = async () => {
      const rows = [...document.querySelectorAll('[data-t]')].map(i => ({ code: i.dataset.t, amount: Math.max(0, Math.round(+i.value || 0)), label: ({ inscription: 'Inscription', mensuel: 'Abonnement mensuel', annuel: 'Abonnement annuel', sponsoring: 'Sponsoring (par semaine)' })[i.dataset.t] }));
      const { error } = await sb.from('tarifs').upsert(rows); if (error) { $('t_e').innerHTML = `<div class="msg err">${esc(error.message)}</div>`; return; } toast('Tarifs enregistrés');
    };
  }

  /* ----- Lieux ----- */
  async function drawPl() {
    $('a_body').innerHTML = `<div class="xsb ms" style="margin:0 0 10px"><span>${svg(I.search, 20, '#142A52', 2)}</span><input id="pl_q" type="search" placeholder="Rechercher un lieu…"></div><div id="pl_l"></div>`;
    let t, seq = 0; const run = async () => {
      const my = ++seq, term = $('pl_q').value.trim().replace(/[%,()]/g, ' ');
      let q = sb.from('places').select('*').order('created_at', { ascending: false }).limit(60); if (term) q = q.or(`name.ilike.%${term}%,area.ilike.%${term}%`);
      const { data, error } = await q; if (my !== seq) return; if (error) { $('pl_l').innerHTML = errBox(error); return; }
      $('pl_l').innerHTML = data.length ? data.map(p => `<a class="mgi" href="#/manage/${p.id}"><span class="mth big" style="background:center/cover url('${esc(cardPhoto(p) || '')}')"></span><div class="mgin"><b>${esc(p.name)}</b><small>${esc(CAT[p.category]?.label || p.category)}${p.area ? ' · ' + esc(p.area) : ''}</small><small>${{ published: 'Publié', pending: 'En attente', rejected: 'Refusé' }[p.status] || p.status}${p.owner_id ? ' · client rattaché' : ' · sans client'}${p.sponsored ? ' · sponsorisé' + (p.sponsored_until ? ' jusqu’au ' + new Date(p.sponsored_until).toLocaleDateString('fr-FR') : '') : ''}${p.status === 'rejected' && p.reject_reason ? ' · ' + esc(p.reject_reason) : ''}</small></div></a>`).join('') : '<div class="empty">Aucun lieu.</div>';
    };
    $('pl_q').oninput = () => { clearTimeout(t); t = setTimeout(run, 300); }; run();
  }
  show(tab);
  sb.rpc('admin_overview').then(({ data }) => data && badge('val', data.pending));
}
