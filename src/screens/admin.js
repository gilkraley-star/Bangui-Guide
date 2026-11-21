import { createClient } from '@supabase/supabase-js';
import { esc, svg, I, sb, configured, getProfile, toast } from '../core.js';
import { CAT } from '../data.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';
import { plain, topbar, bindBack, errBox, notConfigured, rowHtml, photoBox } from '../ui.js';
import { cardPhoto } from './explore.js';

const TABS = [['ov', 'Aperçu'], ['val', 'À valider'], ['ag', 'Agents'], ['pl', 'Lieux']];
export async function admin() {
  if (!configured) { plain(topbar('Administration') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null); if (!prof || prof.role !== 'admin') { location.hash = '#/profil'; return; }
  let tab = sessionStorage.getItem('bg_admtab') || 'ov', ov = null, pend = null;
  plain(`<div class="mgh safe-top"><div class="mgt"><button class="back" id="back">${svg(I.back, 20)}</button><div><small>Espace administrateur</small><h1>Bangui Guide</h1></div></div></div>
    <div class="mgtabs" id="a_tabs">${TABS.map(([k, l]) => `<button data-t="${k}">${l}<i class="abdg" id="b_${k}"></i></button>`).join('')}</div><div class="mgbody" id="a_body"></div>`);
  bindBack(); const $ = i => document.getElementById(i);
  const badge = (k, n) => { const b = $('b_' + k); if (b) { b.textContent = n || ''; b.style.display = n ? 'inline-flex' : 'none'; } };
  const show = t => { tab = t; sessionStorage.setItem('bg_admtab', t); document.querySelectorAll('#a_tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); ({ ov: drawOv, val: drawVal, ag: drawAg, pl: drawPl })[t](); };
  document.querySelectorAll('#a_tabs button').forEach(b => b.onclick = () => show(b.dataset.t));
  const rpc = async (n, a) => { const { data, error } = await sb.rpc(n, a); if (error) throw error; return data; };

  /* ----- Aperçu ----- */
  async function drawOv() {
    $('a_body').innerHTML = '<div class="empty">Chargement…</div>';
    try { ov = await rpc('admin_overview'); } catch (e) { $('a_body').innerHTML = errBox(e) + '<div class="sub" style="padding:8px">Si l’erreur parle d’une fonction manquante, exécutez migration_v5.sql dans Supabase.</div>'; return; }
    badge('val', ov.pending);
    const T = [['published', 'Lieux publiés', '#1FA64D'], ['pending', 'À valider', '#E2541F'], ['agents', 'Agents', '#1E6BE0'], ['owners', 'Clients actifs', '#9B2FC9'], ['claims', 'Demandes clients', '#E2541F'], ['sponsored', 'Sponsorisés', '#F5841F'], ['users', 'Comptes', '#142A52'], ['rejected', 'Refusés', '#8A90A3']];
    $('a_body').innerHTML = `<div class="mgst">${T.map(([k, l, c]) => `<div style="border-left:4px solid ${c}"><b>${ov[k] ?? 0}</b><span>${l}</span></div>`).join('')}</div>
      <a class="card2 mgln" href="#/admin/claims"><span>${svg(I.plus, 22, '#E2541F', 2)}</span><div><b>Demandes d’entreprises</b><div class="sub">${ov.claims ? ov.claims + ' en attente' : 'Aucune demande en attente'}</div></div>${svg('<path d="m9 6 6 6-6 6"/>', 18, '#8A90A3', 2)}</a>
      <a class="card2 mgln" href="#/agent/new"><span>${svg(I.pin, 22, '#1E3A8A', 2)}</span><div><b>Enregistrer un lieu</b><div class="sub">Créer vous-même une fiche (publiée directement)</div></div>${svg('<path d="m9 6 6 6-6 6"/>', 18, '#8A90A3', 2)}</a>`;
  }

  /* ----- Fiches à valider ----- */
  async function drawVal() {
    $('a_body').innerHTML = '<div class="empty">Chargement…</div>';
    try { pend = await rpc('admin_pending'); } catch (e) { $('a_body').innerHTML = errBox(e); return; }
    badge('val', pend.length);
    $('a_body').innerHTML = pend.length ? pend.map(p => `<div class="card2 avl" data-p="${p.id}"><div style="display:flex;gap:12px"><span class="mth big" style="background:center/cover url('${esc(cardPhoto(p) || '')}')"></span><div class="mgin"><b>${esc(p.name)}</b><small>${esc(CAT[p.category]?.label || p.category)}${p.area ? ' · ' + esc(p.area) : ''}</small><small>Par ${esc(p.agent_name || 'agent')} · ${new Date(p.created_at).toLocaleDateString('fr-FR')}</small><small>${p.n_items} élément(s) · ${p.phone ? esc(p.phone) : 'sans téléphone'}</small></div></div>
      ${p.description ? `<div class="sub" style="margin:8px 0 0">${esc(p.description)}</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:10px"><a class="btn ghost" href="#/place/${p.id}" style="flex:1;padding:10px;text-align:center">Voir la fiche</a><button class="btn ok" data-a="published" style="flex:1;padding:10px">Publier</button><button class="btn no" data-a="rejected" style="flex:1;padding:10px">Refuser</button></div></div>`).join('') : '<div class="mgem"><p>Rien à valider pour le moment. Les fiches enregistrées par vos agents apparaissent ici.</p></div>';
    document.querySelectorAll('.avl [data-a]').forEach(b => b.onclick = async () => {
      b.disabled = true; const id = b.closest('.avl').dataset.p, pub = b.dataset.a === 'published';
      const { error } = await sb.from('places').update({ status: b.dataset.a, verified: pub }).eq('id', id);
      if (error) { toast('Erreur : ' + error.message); b.disabled = false; return; } toast(pub ? 'Fiche publiée' : 'Fiche refusée'); drawVal();
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
        <button class="btn" id="ag_ok">Créer l’agent</button><div class="sub" style="margin-top:8px">Communiquez-lui l’email et ce mot de passe. Il pourra se connecter dans « Profil ». Si la personne a déjà un compte, saisissez simplement son email : elle deviendra agent.</div></div>`;
    document.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { if (!confirm('Retirer le rôle d’agent ?')) return; try { toast(await rpc('admin_set_role', { p_email: b.dataset.rm, p_role: 'user' })); drawAg(); } catch (e) { toast('Erreur : ' + e.message); } });
    $('ag_ok').onclick = async () => {
      const name = $('ag_n').value.trim(), email = $('ag_m').value.trim().toLowerCase(), pw = $('ag_p').value; const err = m => $('ag_e').innerHTML = `<div class="msg err">${esc(m)}</div>`;
      if (!/^\S+@\S+\.\S+$/.test(email)) return err('Email invalide'); if (pw.length < 8) return err('Mot de passe : 8 caractères minimum');
      const b = $('ag_ok'); b.disabled = true; b.textContent = 'Création…';
      try {
        const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
        const { error } = await tmp.auth.signUp({ email, password: pw, options: { data: { full_name: name || email.split('@')[0] } } });
        if (error && !/already|registered/i.test(error.message)) throw error;
        const r = await rpc('admin_set_role', { p_email: email, p_role: 'agent' });
        if (r !== 'OK') throw new Error(r);
        toast('Agent créé'); drawAg();
      } catch (e) { err(e.message || 'Erreur'); b.disabled = false; b.textContent = 'Créer l’agent'; }
    };
  }

  /* ----- Lieux ----- */
  async function drawPl() {
    $('a_body').innerHTML = `<div class="xsb ms" style="margin:0 0 10px"><span>${svg(I.search, 20, '#142A52', 2)}</span><input id="pl_q" type="search" placeholder="Rechercher un lieu…"></div><div id="pl_l"></div>`;
    let t, seq = 0; const run = async () => {
      const my = ++seq, term = $('pl_q').value.trim().replace(/[%,()]/g, ' ');
      let q = sb.from('places').select('*').order('created_at', { ascending: false }).limit(60); if (term) q = q.or(`name.ilike.%${term}%,area.ilike.%${term}%`);
      const { data, error } = await q; if (my !== seq) return; if (error) { $('pl_l').innerHTML = errBox(error); return; }
      $('pl_l').innerHTML = data.length ? data.map(p => `<a class="mgi" href="#/manage/${p.id}"><span class="mth big" style="background:center/cover url('${esc(cardPhoto(p) || '')}')"></span><div class="mgin"><b>${esc(p.name)}</b><small>${esc(CAT[p.category]?.label || p.category)}${p.area ? ' · ' + esc(p.area) : ''}</small><small>${{ published: 'Publié', pending: 'En attente', rejected: 'Refusé' }[p.status] || p.status}${p.owner_id ? ' · client rattaché' : ' · sans client'}${p.sponsored ? ' · sponsorisé' : ''}</small></div></a>`).join('') : '<div class="empty">Aucun lieu.</div>';
    };
    $('pl_q').oninput = () => { clearTimeout(t); t = setTimeout(run, 300); }; run();
  }
  show(tab);
  sb.rpc('admin_overview').then(({ data }) => data && badge('val', data.pending));
}
