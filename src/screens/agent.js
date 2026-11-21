import { esc, svg, I, sb, configured, getProfile, isStaff, toast, pickPhoto, getGps, uploadPhoto, removeStored } from '../core.js';
import { CATS, CAT, QUARTIERS } from '../data.js';
import { SECTAGS, MGR, MGR_DEFAULT } from '../sector.js';
import { plain, bindBack, errBox, notConfigured, photoBox } from '../ui.js';

/* ---------- file d'attente hors connexion (IndexedDB : pas de limite de 5 Mo comme localStorage) ---------- */
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('bg_q', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const queue = {
  async get() {
    let a = []; try { const d = await idb(); a = await new Promise(res => { const t = d.transaction('k').objectStore('k').get('q'); t.onsuccess = () => res(t.result || []); t.onerror = () => res([]); }); } catch { }
    try { const old = JSON.parse(localStorage.getItem('bg_queue') || '[]'); if (old.length) { a = [...a, ...old.map(o => ({ ...o, photos: o.photo ? [o.photo] : [], tags: [], items: [] }))]; localStorage.removeItem('bg_queue'); await queue.set(a); } } catch { }
    return a;
  },
  async set(a) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('k', 'readwrite'); t.objectStore('k').put(a, 'q'); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
};
const isNetErr = e => !navigator.onLine || /fetch|network|failed to|timeout/i.test(e?.message || '');
const cfgOf = c => MGR[c] || MGR_DEFAULT;

/* Envoie (ou met à jour) une fiche complète : infos, photos, équipements, catalogue, compte client. */
async function sendPlace(it, prof) {
  const uid = prof.uid;
  const photos = []; for (const p of it.photos || []) photos.push(/^data:/.test(p) ? await uploadPhoto(uid, p) : p);
  const fields = { name: it.name, category: it.category, area: it.area, address: it.address, phone: it.phone, hours: it.hours, description: it.description, lat: it.lat, lng: it.lng, photo_url: photos[0] || null, photos, tags: it.tags || [] };
  if (it.editId) { const { error } = await sb.rpc('agent_update_place', { p_id: it.editId, p: fields }); if (error) throw error; }
  else {
    const { data, error } = await sb.from('places').insert({ ...fields, status: 'pending', verified: false, sponsored: false, created_by: uid }).select('id').single();
    if (error) throw error; it.editId = data.id;
  }
  const items = (it.items || []).filter(x => x.name?.trim()).map(x => ({ name: x.name.trim(), price: x.price === '' || x.price == null ? null : Number(x.price), unit: x.unit || null }));
  { const { error } = await sb.rpc('agent_replace_items', { p_id: it.editId, p_items: items }); if (error) throw error; }
  const warn = [];
  if (it.clientEmail) {
    try {
      let note = null;
      if (it.clientPw) { const { data, error } = await sb.rpc('staff_create_user', { p_email: it.clientEmail, p_password: it.clientPw, p_name: it.clientName || '', p_role: 'user' }); if (error) throw error; note = { email: it.clientEmail, pw: data?.existed ? null : it.clientPw }; }
      const { data: r, error } = await sb.rpc('agent_set_owner', { p_id: it.editId, p_email: it.clientEmail }); if (error) throw error; if (r !== 'OK') throw new Error(r);
      if (note) sessionStorage.setItem('bg_agent_note', JSON.stringify({ ...note, place: it.name }));
    } catch (e) { warn.push('Compte client non rattaché : ' + (e.message || e)); }
  }
  if (prof.role === 'admin') await sb.from('places').update({ status: 'published', verified: true }).eq('id', it.editId);
  return warn;
}
export async function syncQueue() {
  const q = await queue.get(); if (!q.length || !navigator.onLine || !configured) return;
  const prof = await getProfile().catch(() => null); if (!prof || !isStaff(prof)) return;
  const left = [];
  for (const it of q) { try { await sendPlace(it, prof); } catch (e) { it.error = e.message; left.push(it); } }
  await queue.set(left);
}
async function renderQueueBox() {
  const b = document.getElementById('qbox'); if (!b) return; const q = await queue.get();
  b.innerHTML = q.length ? `<div class="msg info">${q.length} fiche(s) enregistrée(s) sur ce téléphone, en attente d’envoi (pas de connexion).${q.some(i => i.error) ? '<br><small>Dernière erreur : ' + esc(q.find(i => i.error).error) + '</small>' : ''}<br><button class="btn ghost" id="rs" style="margin-top:8px;padding:9px">Envoyer maintenant</button></div>` : '';
  const r = document.getElementById('rs'); if (r) r.onclick = async () => { r.disabled = true; await syncQueue(); agent(); };
}
const head = (small, title) => `<div class="mgh safe-top"><div class="mgt"><button class="back" id="back" aria-label="Retour">${svg(I.back, 20)}</button><div><small>${esc(small)}</small><h1>${esc(title)}</h1></div></div></div>`;
const STAT = { pending: ['En attente', '#FFF4E6', '#B5560C'], published: ['Publié', '#EAF8EF', '#1E7A43'], rejected: ['Refusé', '#FFF1F0', '#C23B3B'] };

/* ---------- accueil agent ---------- */
export async function agent() {
  if (!configured) { plain(head('Espace agent', 'Bangui Guide') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null);
  if (!isStaff(prof)) { location.hash = '#/profil'; return; }
  plain(`${head(prof.role === 'admin' ? 'Administrateur · mode agent' : 'Espace agent', prof.full_name)}
    <div class="mgbody"><div id="qbox"></div><div id="anote"></div>
    <a class="btn mgadd" href="#/agent/new" style="position:static;margin-bottom:12px">${svg(I.plus, 20, '#fff', 2.4)} Enregistrer un client / un lieu</a>
    <div class="mgst" id="ast"></div>
    <div class="mgct" style="margin-top:14px"><h2>Mes enregistrements</h2><span id="acount"></span></div><div id="mine" style="display:flex;flex-direction:column;gap:10px;margin-top:8px"><div class="empty">Chargement…</div></div></div>`);
  bindBack(); document.getElementById('back').onclick = () => { location.hash = '#/profil'; };
  const note = (() => { try { return JSON.parse(sessionStorage.getItem('bg_agent_note') || 'null'); } catch { return null; } })();
  if (note) { document.getElementById('anote').innerHTML = `<div class="msg info"><b>Compte client créé</b> pour « ${esc(note.place)} ».<br>Email : <b>${esc(note.email)}</b>${note.pw ? `<br>Mot de passe provisoire : <b>${esc(note.pw)}</b>` : '<br>(le client avait déjà un compte)'}<br><small>Communiquez-le au client : il se connecte dans « Profil » puis ouvre « Mon espace client ».</small><br><button class="btn ghost" id="nok" style="margin-top:8px;padding:9px">C’est noté</button></div>`; document.getElementById('nok').onclick = () => { sessionStorage.removeItem('bg_agent_note'); document.getElementById('anote').innerHTML = ''; }; }
  await syncQueue().catch(() => { }); renderQueueBox();
  const { data, error } = await sb.from('places').select('*').eq('created_by', prof.uid).order('created_at', { ascending: false }).limit(100);
  const box = document.getElementById('mine');
  if (error) { box.innerHTML = errBox(error); return; }
  const n = s => data.filter(p => p.status === s).length;
  document.getElementById('ast').innerHTML = [['Enregistrés', data.length, '#142A52'], ['En attente', n('pending'), '#E2541F'], ['Publiés', n('published'), '#1FA64D'], ['Refusés', n('rejected'), '#C23B3B']].map(([l, v, c]) => `<div style="border-left:4px solid ${c}"><b>${v}</b><span>${l}</span></div>`).join('');
  document.getElementById('acount').textContent = data.length;
  box.innerHTML = data.length ? data.map(p => {
    const s = STAT[p.status] || STAT.pending, edit = p.status !== 'published';
    return `<a class="card2" href="${p.status === 'published' ? '#/place/' + p.id : '#/agent/edit/' + p.id}" style="display:flex;gap:12px;text-decoration:none;color:inherit;align-items:flex-start">${photoBox(p, 'th2', 24)}<div class="mgin"><b>${esc(p.name)}</b><small>${esc(CAT[p.category]?.label || p.category)}${p.area ? ' · ' + esc(p.area) : ''}</small>
      <div style="margin-top:5px"><span class="pill" style="background:${s[1]};color:${s[2]}">${s[0]}</span>${edit ? '<span class="sub" style="margin-left:8px">Toucher pour modifier</span>' : ''}</div>
      ${p.status === 'rejected' && p.reject_reason ? `<div class="msg err" style="margin:8px 0 0;padding:8px 10px;font-size:12.5px"><b>Motif :</b> ${esc(p.reject_reason)}</div>` : ''}</div></a>`;
  }).join('') : '<div class="mgem"><p>Aucun enregistrement pour le moment. Commencez par « Enregistrer un client / un lieu ».</p></div>';
}

/* ---------- formulaire : nouvelle fiche ou modification ---------- */
export async function newPlace(editId) {
  if (!configured) { plain(head('Enregistrer', 'Nouveau lieu') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null);
  if (!isStaff(prof)) { location.hash = '#/profil'; return; }
  let cur = null, rows = [];
  if (editId) {
    plain(head('Modifier la fiche', '…') + '<div class="empty">Chargement…</div>'); bindBack();
    const [{ data: p, error }, { data: its }] = await Promise.all([sb.from('places').select('*').eq('id', editId).maybeSingle(), sb.from('place_items').select('*').eq('place_id', editId).order('created_at')]);
    if (error || !p) { plain(head('Modifier la fiche', 'Introuvable') + '<div class="mgbody"><div class="msg err">Fiche introuvable ou non modifiable.</div></div>'); bindBack(); return; }
    if (p.status === 'published' && prof.role !== 'admin') { location.hash = '#/place/' + editId; return; }
    cur = p; rows = (its || []).map(x => ({ name: x.name, price: x.price ?? '', unit: x.unit || '' }));
  }
  const S = { photos: [...(cur?.photos?.length ? cur.photos : cur?.photo_url ? [cur.photo_url] : [])], tags: new Set(cur?.tags || []), lat: cur?.lat ?? null, lng: cur?.lng ?? null, cat: cur?.category || '', dirty: false };
  const orig = new Set(S.photos);
  plain(`${head(editId ? 'Modifier la fiche' : 'Enregistrer un client / un lieu', cur?.name || 'Nouveau lieu')}
    <form class="mgbody" id="nf" style="display:flex;flex-direction:column;gap:12px"><div id="ne"></div>
    ${cur?.status === 'rejected' && cur.reject_reason ? `<div class="msg err"><b>Fiche refusée :</b> ${esc(cur.reject_reason)}<br><small>Corrigez puis renvoyez : elle repassera en validation.</small></div>` : ''}
    <div class="card2"><div class="sh">Informations</div>
      <div class="field"><label>Nom du lieu *</label><input id="n_name" required maxlength="120"></div>
      <div class="field"><label>Catégorie *</label><select id="n_cat" required><option value="">Choisir…</option>${CATS.map(c => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></div>
      <div class="field"><label>Quartier</label><select id="n_area"><option value="">Choisir…</option>${QUARTIERS.map(a => `<option>${esc(a)}</option>`).join('')}</select></div>
      <div class="field"><label>Adresse / repère</label><input id="n_addr" maxlength="200" placeholder="Ex : face à la station Total"></div>
      <div class="field"><label>Téléphone</label><input id="n_tel" type="tel" placeholder="+236 …"></div>
      <div class="field"><label>Horaires</label><input id="n_hours" maxlength="120" placeholder="Ex : Lun–Sam 8h–18h"></div>
      <div class="field" style="margin-bottom:0"><label>Description</label><textarea id="n_desc" maxlength="600"></textarea></div></div>
    <div class="card2"><div class="sh">Photos <small style="font-weight:500;color:#5C6684">(la première est la photo principale, 6 max)</small></div><div id="n_gal" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div></div>
    <div class="card2" id="n_tagbox"></div>
    <div class="card2" id="n_catbox"></div>
    <div class="card2"><div class="sh">Position GPS</div><button type="button" class="btn ghost" id="n_gps">${svg(I.pin, 18)} Utiliser ma position actuelle</button><div class="sub" id="n_gt" style="margin-top:6px">${S.lat != null ? `✓ ${(+S.lat).toFixed(5)}, ${(+S.lng).toFixed(5)}` : 'Soyez sur place, devant le lieu.'}</div></div>
    ${editId ? '' : `<div class="card2"><div class="sh">Compte du client <small style="font-weight:500;color:#5C6684">(facultatif)</small></div>
      <div class="sub" style="margin:0 0 8px">Donne au client l’accès à son espace pour gérer plats, chambres, prix, photos…</div>
      <div class="field"><label>Nom du responsable</label><input id="c_name" maxlength="80"></div>
      <div class="field"><label>Email du client</label><input id="c_mail" type="email" autocapitalize="none" placeholder="client@exemple.com"></div>
      <div class="field" style="margin-bottom:0"><label>Mot de passe provisoire (6 caractères min.)</label><input id="c_pw" type="text" autocapitalize="none" value="${Math.random().toString(36).slice(2, 6)}${Math.random().toString(36).slice(2, 6)}"></div>
      <div class="sub" style="margin-top:6px">Si le client a déjà un compte, saisissez son email : la fiche lui sera simplement rattachée.</div></div>`}
    <button class="btn" id="n_go">${editId ? 'Enregistrer et renvoyer en validation' : 'Envoyer pour validation'}</button></form>`);
  bindBack(); const $ = id => document.getElementById(id);
  $('n_name').value = cur?.name || ''; $('n_cat').value = cur?.category || ''; $('n_area').value = cur?.area || ''; $('n_addr').value = cur?.address || ''; $('n_tel').value = cur?.phone || ''; $('n_hours').value = cur?.hours || ''; $('n_desc').value = cur?.description || '';

  const drawGal = () => {
    $('n_gal').innerHTML = S.photos.map((u, i) => `<div style="position:relative;aspect-ratio:1;border-radius:12px;background:center/cover url('${esc(u)}')">${i === 0 ? '<span class="pill" style="position:absolute;left:5px;top:5px;background:#E2541F;color:#fff">Principale</span>' : ''}<button type="button" data-rm="${i}" aria-label="Retirer" style="position:absolute;right:4px;top:4px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(10,20,50,.7);color:#fff;font-size:15px;line-height:1">×</button></div>`).join('')
      + (S.photos.length < 6 ? `<button type="button" class="mgph" id="n_add" style="height:auto;aspect-ratio:1;margin:0;font-size:12px">${svg(I.cam, 22, '#1E3A8A', 2)}Ajouter</button>` : '');
    $('n_gal').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { S.photos.splice(+b.dataset.rm, 1); drawGal(); });
    const a = $('n_add'); if (a) a.onclick = async () => { try { const p = await pickPhoto(); if (p) { S.photos.push(p); drawGal(); } } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Photo impossible : ' + (e.message || e)); } };
  };
  const drawTags = () => {
    const list = [...new Set([...(SECTAGS[S.cat] || []), ...S.tags])];
    $('n_tagbox').style.display = list.length ? 'block' : 'none';
    $('n_tagbox').innerHTML = `<div class="sh">Équipements et atouts</div><div style="display:flex;flex-wrap:wrap;gap:8px">${list.map(t => `<button type="button" class="fc ${S.tags.has(t) ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
    $('n_tagbox').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { S.tags.has(b.dataset.t) ? S.tags.delete(b.dataset.t) : S.tags.add(b.dataset.t); drawTags(); });
  };
  const drawCat = () => {
    const c = cfgOf(S.cat), box = $('n_catbox'); if (!S.cat) { box.style.display = 'none'; return; } box.style.display = 'block';
    const pr = c.price !== 'none';
    box.innerHTML = `<div class="sh">${esc(c.title)}</div><div class="sub" style="margin:0 0 8px">${esc(c.empty)} Photos et détails pourront être complétés ensuite par le client.</div>
      <div id="n_rows">${rows.map((r, i) => `<div class="mgrow" style="gap:6px;margin-bottom:8px" data-i="${i}"><input data-k="name" value="${esc(r.name)}" maxlength="120" placeholder="${esc(c.ph)}" style="flex:2;min-width:0">${pr ? `<input data-k="price" value="${esc(r.price)}" type="number" inputmode="numeric" min="0" placeholder="FCFA" style="flex:1;min-width:0">` : ''}<button type="button" data-rm="${i}" aria-label="Retirer" style="width:34px;height:34px;border-radius:50%;border:0;background:#FFE9E7;color:#C23B3B;font-size:17px;flex:none">×</button></div>`).join('')}</div>
      ${rows.length < 30 ? `<button type="button" class="btn ghost" id="n_ar" style="padding:10px">${svg(I.plus, 16, '#1E3A8A', 2.4)} ${esc(c.add)}</button>` : ''}`;
    const unitFor = r => c.unit === 'free' ? (r.unit || null) : c.unit === 'none' ? null : (r.price === '' || r.price == null ? null : c.unit);
    box.querySelectorAll('#n_rows [data-i]').forEach(el => { const i = +el.dataset.i; el.querySelectorAll('input').forEach(inp => inp.oninput = () => { rows[i][inp.dataset.k] = inp.value; rows[i].unit = unitFor(rows[i]) || ''; }); el.querySelector('[data-rm]').onclick = () => { rows.splice(i, 1); drawCat(); }; });
    const ar = $('n_ar'); if (ar) ar.onclick = () => { rows.push({ name: '', price: '', unit: '' }); drawCat(); const l = box.querySelectorAll('#n_rows [data-k=name]'); l[l.length - 1]?.focus(); };
  };
  $('n_cat').onchange = () => { S.cat = $('n_cat').value; drawTags(); drawCat(); };
  S.cat = $('n_cat').value; drawGal(); drawTags(); drawCat();
  $('n_gps').onclick = async () => { $('n_gt').textContent = 'Localisation…'; try { const g = await getGps(); S.lat = g.lat; S.lng = g.lng; $('n_gt').textContent = `✓ ${g.lat.toFixed(5)}, ${g.lng.toFixed(5)} (±${Math.round(g.acc)} m)`; } catch (e) { $('n_gt').textContent = 'Position indisponible : autorisez la localisation.'; } };

  let created = cur ? cur.id : null;
  $('nf').onsubmit = async e => {
    e.preventDefault(); const b = $('n_go'), lbl = b.textContent; b.disabled = true; b.textContent = 'Envoi…';
    const c = cfgOf(S.cat), unitFor = r => c.unit === 'free' ? (r.unit || null) : c.unit === 'none' ? null : (r.price === '' || r.price == null ? null : c.unit);
    const mail = $('c_mail')?.value.trim().toLowerCase() || '', pw = $('c_pw')?.value || '';
    if (mail && !/^\S+@\S+\.\S+$/.test(mail)) { $('ne').innerHTML = '<div class="msg err">Email du client invalide.</div>'; b.disabled = false; b.textContent = lbl; scrollTo(0, 0); $('scroll')?.scrollTo(0, 0); return; }
    if (mail && pw.length < 6 && navigator.onLine) { $('ne').innerHTML = '<div class="msg err">Mot de passe du client : 6 caractères minimum.</div>'; b.disabled = false; b.textContent = lbl; return; }
    const item = { editId: created, name: $('n_name').value.trim(), category: $('n_cat').value, area: $('n_area').value || null, address: $('n_addr').value.trim() || null, phone: $('n_tel').value.trim() || null, hours: $('n_hours').value.trim() || null, description: $('n_desc').value.trim() || null, lat: S.lat, lng: S.lng, photos: S.photos, tags: [...S.tags], items: rows.map(r => ({ ...r, unit: unitFor(r) })), clientEmail: mail || null, clientPw: mail ? pw : null, clientName: $('c_name')?.value.trim() || '' };
    try {
      const warn = await sendPlace(item, prof); created = item.editId;
      orig.forEach(u => { if (!S.photos.includes(u)) removeStored(u); });
      toast(warn.length ? warn[0] : prof.role === 'admin' ? 'Fiche publiée' : 'Envoyé pour validation'); location.hash = '#/agent';
    } catch (err) {
      created = item.editId || created;
      if (isNetErr(err) && !editId) {
        try { item.clientPw = null; const q = await queue.get(); await queue.set([...q, item]); toast('Pas de réseau : fiche gardée sur le téléphone'); location.hash = '#/agent'; }
        catch { $('ne').innerHTML = '<div class="msg err">Pas de réseau et mémoire pleine. Réessayez avec une connexion.</div>'; b.disabled = false; b.textContent = lbl; }
      } else { $('ne').innerHTML = `<div class="msg err">${esc(err.message || 'Erreur')}</div>`; b.disabled = false; b.textContent = lbl; scrollTo(0, 0); }
    }
  };
}
