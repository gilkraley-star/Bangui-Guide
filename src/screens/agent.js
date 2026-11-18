import { esc, svg, I, sb, configured, getProfile, isStaff, toast, pickPhoto, getGps, uploadPhoto } from '../core.js';
import { CATS, CAT, QUARTIERS } from '../data.js';
import { plain, topbar, bindBack, shell, rowHtml, photoBox, errBox, notConfigured } from '../ui.js';

const QKEY = 'bg_queue';
const queue = { get: () => { try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch { return []; } }, set: a => localStorage.setItem(QKEY, JSON.stringify(a)) };
async function sendPlace(item, uid) {
  const photo_url = item.photo ? await uploadPhoto(uid, item.photo) : null;
  const { error } = await sb.from('places').insert({ name: item.name, category: item.category, area: item.area, address: item.address, phone: item.phone, hours: item.hours, description: item.description, lat: item.lat, lng: item.lng, photo_url, status: 'pending', created_by: uid });
  if (error) throw error;
}
const isNetErr = e => !navigator.onLine || /fetch|network|failed to|timeout/i.test(e?.message || '');
export async function syncQueue() {
  const q = queue.get(); if (!q.length || !navigator.onLine || !configured) return;
  const { data: { session } } = await sb.auth.getSession(); if (!session) return;
  const left = [];
  for (const it of q) { try { await sendPlace(it, session.user.id); } catch (e) { if (isNetErr(e)) left.push(it); else { it.error = e.message; left.push(it); } } }
  queue.set(left);
}
function renderQueueBox() {
  const b = document.getElementById('qbox'); if (!b) return; const q = queue.get();
  b.innerHTML = q.length ? `<div class="msg info">${q.length} lieu(x) enregistré(s) sur ce téléphone, en attente d’envoi (pas de connexion).${q.some(i => i.error) ? '<br><small>Dernière erreur : ' + esc(q.find(i => i.error).error) + '</small>' : ''}<br><button class="btn sec2" id="rs" style="margin-top:8px;padding:10px">Réessayer l’envoi</button></div>` : '';
  const r = document.getElementById('rs'); if (r) r.onclick = async () => { await syncQueue(); agent(); };
}

export async function agent() {
  if (!configured) { shell(notConfigured(), 'profil'); return; }
  const prof = await getProfile().catch(() => null);
  if (!isStaff(prof)) { location.hash = '#/profil'; return; }
  shell(`<div class="hero safe-top" style="padding-bottom:30px"><div style="font-size:12px;opacity:.75">${prof.role === 'admin' ? 'Administrateur' : 'Agent terrain'}</div><h1 style="font-size:21px">${esc(prof.full_name)}</h1></div>
    <div class="pad" style="padding-top:20px"><div id="qbox"></div><a class="btn" href="#/agent/new">${svg(I.plus, 18, '#fff')} Enregistrer un lieu</a></div>
    ${prof.role === 'admin' ? '<div class="sec"><h2 class="sh">À valider</h2></div><div class="list" id="pend"><div class="empty">Chargement…</div></div>' : ''}
    <div class="sec"><h2 class="sh">Mes enregistrements</h2></div><div class="list" id="mine"><div class="empty">Chargement…</div></div>`, 'profil');
  await syncQueue(); renderQueueBox();
  const stat = { pending: ['En attente', '#FFF4E6', '#B5560C'], published: ['Publié', '#EAF8EF', '#1E7A43'], rejected: ['Refusé', '#FFF1F0', '#C23B3B'] };
  const { data, error } = await sb.from('places').select('*').eq('created_by', prof.uid).order('created_at', { ascending: false }).limit(50);
  document.getElementById('mine').innerHTML = error ? errBox(error) : data.length ? data.map(p => { const s = stat[p.status]; return `<a class="row2" href="#/place/${p.id}">${photoBox(p, 'th2', 24)}<div class="bd"><span class="nm">${esc(p.name)}</span><div class="sub" style="margin:0">${esc(CAT[p.category]?.label || p.category)}${p.area ? ' · ' + esc(p.area) : ''}</div><span class="pill" style="background:${s[1]};color:${s[2]};width:max-content">${s[0]}</span></div></a>`; }).join('') : '<div class="empty">Tu n’as encore rien enregistré.</div>';
  if (prof.role === 'admin') loadPending();
}
async function loadPending() {
  const box = document.getElementById('pend');
  const { data, error } = await sb.from('places').select('*').eq('status', 'pending').order('created_at').limit(50);
  if (error) { box.innerHTML = errBox(error); return; }
  if (!data.length) { box.innerHTML = '<div class="empty">Rien à valider.</div>'; return; }
  box.innerHTML = data.map(p => `<div class="row2" style="flex-direction:column;align-items:stretch"><div style="display:flex;gap:12px">${photoBox(p, 'th2', 24)}<div class="bd"><span class="nm" style="white-space:normal">${esc(p.name)}</span><div class="sub" style="margin:0">${esc(CAT[p.category]?.label || p.category)}${p.area ? ' · ' + esc(p.area) : ''}</div><div class="sub" style="margin:0">${esc(p.address || '')} ${p.phone ? '· ' + esc(p.phone) : ''}</div></div></div>
    <div style="display:flex;gap:8px;margin-top:10px"><button class="btn ok" data-a="published" data-id="${p.id}" style="padding:10px">Publier</button><button class="btn no" data-a="rejected" data-id="${p.id}" style="padding:10px">Refuser</button></div></div>`).join('');
  box.querySelectorAll('button[data-id]').forEach(b => b.onclick = async () => {
    b.disabled = true; const pub = b.dataset.a === 'published';
    const { error } = await sb.from('places').update({ status: b.dataset.a, verified: pub }).eq('id', b.dataset.id);
    if (error) { toast('Erreur : ' + error.message); b.disabled = false; } else { toast(pub ? 'Publié' : 'Refusé'); loadPending(); }
  });
}

export async function newPlace() {
  if (!configured) { plain(topbar('Enregistrer un lieu') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null);
  if (!isStaff(prof)) { location.hash = '#/profil'; return; }
  let photo = null, gps = null;
  plain(topbar('Enregistrer un lieu') + `<form class="pad" id="nf"><div id="ne"></div>
    <div class="field"><label>Nom du lieu *</label><input id="n_name" required maxlength="120"></div>
    <div class="field"><label>Catégorie *</label><select id="n_cat" required><option value="">Choisir…</option>${CATS.map(c => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></div>
    <div class="field"><label>Quartier</label><select id="n_area"><option value="">Choisir…</option>${QUARTIERS.map(a => `<option>${esc(a)}</option>`).join('')}</select></div>
    <div class="field"><label>Adresse / repère</label><input id="n_addr" maxlength="200" placeholder="Ex : face à la station Total"></div>
    <div class="field"><label>Téléphone</label><input id="n_tel" type="tel" placeholder="+236 …"></div>
    <div class="field"><label>Horaires</label><input id="n_hours" maxlength="120" placeholder="Ex : Lun–Sam 8h–18h"></div>
    <div class="field"><label>Description</label><textarea id="n_desc" maxlength="600"></textarea></div>
    <div class="field"><label>Photo</label><button type="button" class="btn ghost" id="n_ph">${svg(I.cam, 18)} Prendre / choisir une photo</button><img id="n_prev" style="display:none;width:100%;border-radius:13px;margin-top:8px"></div>
    <div class="field"><label>Position GPS</label><button type="button" class="btn ghost" id="n_gps">${svg(I.pin, 18)} Utiliser ma position actuelle</button><div class="sub" id="n_gt">Sois sur place, devant le lieu.</div></div>
    <button class="btn" id="n_go">Enregistrer</button></form>`);
  bindBack(); const $ = id => document.getElementById(id);
  $('n_ph').onclick = async () => { try { const p = await pickPhoto(); if (p) { photo = p; $('n_prev').src = p; $('n_prev').style.display = 'block'; } } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Photo impossible : ' + (e.message || e)); } };
  $('n_gps').onclick = async () => { $('n_gt').textContent = 'Localisation…'; try { gps = await getGps(); $('n_gt').textContent = `✓ ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} (±${Math.round(gps.acc)} m)`; } catch (e) { gps = null; $('n_gt').textContent = 'Position indisponible : ' + (e.message || 'autorise la localisation'); } };
  $('nf').onsubmit = async e => {
    e.preventDefault(); const b = $('n_go'); b.disabled = true; b.textContent = 'Envoi…';
    const item = { name: $('n_name').value.trim(), category: $('n_cat').value, area: $('n_area').value || null, address: $('n_addr').value.trim() || null, phone: $('n_tel').value.trim() || null, hours: $('n_hours').value.trim() || null, description: $('n_desc').value.trim() || null, lat: gps?.lat ?? null, lng: gps?.lng ?? null, photo };
    try { await sendPlace(item, prof.uid); toast('Envoyé pour validation'); location.hash = '#/agent'; }
    catch (err) {
      if (isNetErr(err)) { try { queue.set([...queue.get(), item]); toast('Pas de réseau : enregistré sur le téléphone'); location.hash = '#/agent'; } catch { $('ne').innerHTML = '<div class="msg err">Pas de réseau et mémoire pleine. Réessaie avec une connexion.</div>'; b.disabled = false; b.textContent = 'Enregistrer'; } }
      else { $('ne').innerHTML = `<div class="msg err">${esc(err.message || 'Erreur')}</div>`; b.disabled = false; b.textContent = 'Enregistrer'; scrollTo(0, 0); }
    }
  };
}
