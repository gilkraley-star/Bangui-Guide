import { esc, svg, I, sb, configured, getProfile, toast, pickPhoto, uploadPhoto, fmtPrice, removeStored } from '../core.js';
import { CAT } from '../data.js';
import { billingSheet, invoiceRow, planBox, tarifsBox, loadTarifs, dueTotal, money } from '../billing.js';
import { plain, topbar, bindBack, errBox, notConfigured, rowHtml, photoBox, shell } from '../ui.js';
import { PRESET_TAGS } from './place.js';
import { SECTAGS, MGR, MGR_DEFAULT, ico } from '../sector.js';
import { itemPhoto } from '../ui.js';

export async function manageList() {
  if (!configured) { plain(topbar('Mes établissements') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null); if (!prof) { location.hash = '#/profil'; return; }
  plain(topbar('Mes établissements') + '<div class="list" id="ml"><div class="empty">Chargement…</div></div>'); bindBack();
  let q = sb.from('places').select('*').order('name').limit(100); if (prof.role !== 'admin') q = q.eq('owner_id', prof.uid);
  const { data, error } = await q; const ml = document.getElementById('ml');
  if (error) { ml.innerHTML = errBox(error); return; }
  ml.innerHTML = data.length ? data.map(p => rowHtml(p).replace('href="#/place/', 'href="#/manage/')).join('') : '<div class="empty">Aucun établissement rattaché à ton compte. Demande à l’administrateur de te l’attribuer.</div>';
}

export async function manage(id) {
  if (!configured) { plain(topbar('Mon espace') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null); if (!prof) { location.hash = '#/profil'; return; }
  const [{ data: p, error }, { data: its }] = await Promise.all([sb.from('places').select('*').eq('id', id).maybeSingle(), sb.from('place_items').select('*').eq('place_id', id).order('created_at')]);
  if (error || !p) { plain(topbar('Mon espace') + (error ? errBox(error) : '<div class="empty">Lieu introuvable.</div>')); bindBack(); return; }
  const cfg = MGR[p.category] || MGR_DEFAULT, ct = CAT[p.category] || { label: '' }, $ = i => document.getElementById(i);
  let tags = [...(p.tags || [])], photo = null, list = its || [], gal = [...(p.photos || [])], tab = 'cat';
  const hasDuty = ['pharmacie', 'hopital'].includes(p.category);
  plain(`<div class="mgh safe-top"><div class="mgt"><button class="back" id="back">${svg(I.back, 20)}</button><div><small>Espace client · ${esc(ct.label.replace(/s$/, ''))}</small><h1>${esc(p.name)}</h1></div><a class="mgv" href="#/place/${id}">${svg(I.eye || '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 18, '#fff', 2)} Ma fiche</a></div>
    <div class="mgs" id="m_stat"><div><b>…</b><span>Vues</span></div><div><b>…</b><span>Appels</span></div><div><b>…</b><span>Messages</span></div><div><b>…</b><span>WhatsApp</span></div></div></div>
    <div class="mgtabs" id="m_tabs"><button data-t="cat" class="on">${esc(cfg.tab)}</button><button data-t="inf">Infos</button><button data-t="pho">Photos</button><button data-t="act">Activité</button><button data-t="fac">Factures<i class="abdg" id="b_fac" style="display:none"></i></button></div>
    <div class="mgbody" id="m_body"></div><div class="mgsav" id="m_sav" style="display:none"><button class="btn" id="m_save">Enregistrer les informations</button></div>`);
  bindBack();
  const showTab = t => { tab = t; document.querySelectorAll('#m_tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $('m_sav').style.display = t === 'inf' ? 'block' : 'none'; ({ cat: drawCat, inf: drawInf, pho: drawPho, act: drawAct, fac: drawFac })[t](); $('m_body').scrollTop = 0; };
  document.querySelectorAll('#m_tabs button').forEach(b => b.onclick = () => showTab(b.dataset.t));

  /* ---------- catalogue ---------- */
  function drawCat() {
    $('m_body').innerHTML = `<div class="mgcat"><div class="mgct"><h2>${esc(cfg.title)}</h2><span>${list.length}</span></div>
      ${list.length ? `<div id="m_items">${list.map(it => `<div class="mgi ${it.available === false ? 'off' : ''}">${itemPhoto(it) ? `<span class="mth big" style="background:center/cover url('${esc(itemPhoto(it))}')"></span>` : `<span class="mth big ic">${ico(it.name, 28, '#1E3A8A')}</span>`}
        <div class="mgin"><b>${esc(it.name)}</b>${it.description ? `<small>${esc(it.description)}</small>` : ''}${it.price != null ? `<em>${esc(fmtPrice(it.price, it.unit))}</em>` : ''}
        <div class="mgac"><button class="sw ${it.available === false ? '' : 'on'}" data-a="${it.id}" aria-label="Disponible"><i></i></button><span>${it.available === false ? 'Indisponible' : 'Disponible'}</span><button class="back" data-e="${it.id}" aria-label="Modifier">${svg(I.edit, 16)}</button><button class="back" data-d="${it.id}" aria-label="Supprimer">${svg(I.trash, 16, '#C23B3B')}</button></div></div></div>`).join('')}</div>`
      : `<div class="mgem"><span class="sxi">${ico(cfg.ph, 34)}</span><p>${esc(cfg.empty)}</p></div>`}
      <button class="btn mgadd" id="m_add">${svg(I.plus, 20, '#fff', 2.4)} ${esc(cfg.add)}</button></div>`;
    $('m_add').onclick = () => openSheet(null);
    document.querySelectorAll('#m_items [data-d]').forEach(b => b.onclick = async () => { if (!confirm('Supprimer cet élément ?')) return; const { error } = await sb.from('place_items').delete().eq('id', b.dataset.d); if (error) { toast('Erreur : ' + error.message); return; } removeStored(list.find(x => x.id === b.dataset.d)?.photo_url); list = list.filter(x => x.id !== b.dataset.d); drawCat(); });
    document.querySelectorAll('#m_items [data-a]').forEach(b => b.onclick = async () => { const it = list.find(x => x.id === b.dataset.a), v = it.available === false; const { error } = await sb.from('place_items').update({ available: v }).eq('id', it.id); if (error) { toast('Erreur : ' + error.message); return; } it.available = v; drawCat(); });
    document.querySelectorAll('#m_items [data-e]').forEach(b => b.onclick = () => openSheet(list.find(x => x.id === b.dataset.e)));
  }
  function openSheet(it) {
    let ip = null; const old = document.getElementById('mgsh'); if (old) old.remove();
    const el = document.createElement('div'); el.id = 'mgsh'; el.className = 'mgsh';
    const unitField = cfg.unit === 'free' ? `<div class="field" style="flex:1"><label>Unité</label><input id="i_u" maxlength="20" placeholder="${esc(cfg.uph || '')}" value="${esc(it?.unit || '')}"></div>` : '';
    el.innerHTML = `<div class="mgsc"></div><div class="mgsp"><div class="mgsx"><b>${it ? 'Modifier' : esc(cfg.add)}</b><button class="back" id="i_x" aria-label="Fermer">${svg('<path d="M6 6l12 12M18 6 6 18"/>', 18, '#142A52', 2.2)}</button></div>
      <button type="button" class="mgph" id="i_ph" style="${itemPhoto(it || {}) ? `background:center/cover url('${esc(itemPhoto(it))}')` : ''}">${itemPhoto(it || {}) ? '' : `${svg(I.cam, 30, '#1E3A8A', 1.8)}<span>Ajouter une photo</span>`}</button>
      <div class="field"><label>Nom</label><input id="i_n" maxlength="120" placeholder="ex : ${esc(cfg.ph)}" value="${esc(it?.name || '')}"></div>
      <div class="field"><label>${esc(cfg.desc)}</label><input id="i_d" maxlength="200" value="${esc(it?.description || '')}"></div>
      ${cfg.price !== 'none' ? `<div style="display:flex;gap:8px"><div class="field" style="flex:2"><label>${esc(cfg.plabel || 'Prix (FCFA)')}${cfg.price === 'opt' ? ' · facultatif' : ''}</label><input id="i_p" type="number" inputmode="numeric" min="0" value="${it?.price ?? ''}"></div>${unitField}</div>${cfg.unit && cfg.unit !== 'free' && cfg.unit !== 'none' ? `<div class="sub" style="margin:-4px 0 8px">Prix affiché : par ${esc(cfg.unit)}</div>` : ''}` : ''}
      <button class="btn" id="i_ok">${it ? 'Enregistrer' : 'Ajouter'}</button></div>`;
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
    const close = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 250); };
    el.querySelector('.mgsc').onclick = close; $('i_x').onclick = close;
    $('i_ph').onclick = async () => { try { const ph = await pickPhoto(); if (ph) { ip = ph; const b = $('i_ph'); b.style.background = `center/cover url('${ph}')`; b.innerHTML = ''; } } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Photo impossible'); } };
    $('i_ok').onclick = async () => {
      const name = $('i_n').value.trim(); if (!name) { toast('Donnez un nom'); return; }
      const pr = $('i_p') ? $('i_p').value : ''; if (cfg.price === 'req' && pr === '') { toast('Indiquez le prix'); return; }
      const b = $('i_ok'); b.disabled = true; b.textContent = 'Enregistrement…';
      try {
        const row = { name, price: pr === '' ? null : Number(pr), unit: cfg.unit === 'free' ? ($('i_u')?.value.trim() || null) : (cfg.unit === 'none' ? null : (pr === '' ? null : cfg.unit)), description: $('i_d').value.trim() || null };
        if (ip) row.photo_url = await uploadPhoto(prof.uid, ip);
        if (it) { const { data, error } = await sb.from('place_items').update(row).eq('id', it.id).select().single(); if (error) throw error; if (ip && it.photo_url) removeStored(it.photo_url); list = list.map(x => x.id === it.id ? data : x); toast('Modifié'); }
        else { const { data, error } = await sb.from('place_items').insert({ ...row, place_id: id }).select().single(); if (error) throw error; list = [...list, data]; toast('Ajouté'); }
        close(); drawCat();
      } catch (e) { toast('Erreur : ' + (e.message || e)); b.disabled = false; b.textContent = it ? 'Enregistrer' : 'Ajouter'; }
    };
  }

  /* ---------- infos ---------- */
  function drawInf() {
    const all = [...new Set([...(SECTAGS[p.category] || PRESET_TAGS), ...tags])];
    $('m_body').innerHTML = `<div id="me"></div><div class="card2"><div class="sh">Coordonnées</div>
      <div class="field"><label>Téléphone</label><input id="m_tel" type="tel" value="${esc(p.phone || '')}"></div>
      <div class="field"><label>Horaires</label><input id="m_h" value="${esc(p.hours || '')}" maxlength="120" placeholder="Lun–Sam 8h–18h ; Dim 9h–13h"><div class="sub" style="margin-top:4px">Exemples : 24h/24 · Lun–Ven 7h30–15h30</div></div>
      <div class="field"><label>Adresse</label><input id="m_a" value="${esc(p.address || '')}" maxlength="200"></div>
      <div class="field"><label>Présentation</label><textarea id="m_d" maxlength="600">${esc(p.description || '')}</textarea></div></div>
      ${hasDuty ? `<div class="card2"><div class="mgrow"><div><b>${p.category === 'pharmacie' ? 'Pharmacie de garde' : 'Service d’urgence de garde'}</b><div class="sub">Affiche « de garde aujourd’hui » sur votre fiche</div></div><button class="sw ${p.on_duty ? 'on' : ''}" id="m_duty" aria-label="De garde"><i></i></button></div></div>` : ''}
      <div class="card2"><div class="sh">Atouts affichés sur la fiche</div><div class="fchips" style="flex-wrap:wrap;padding:0;overflow:visible" id="m_t">${all.map(t => `<button type="button" class="fc ${tags.includes(t) ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`;
    document.querySelectorAll('#m_t .fc').forEach(b => b.onclick = () => { const t = b.dataset.t; tags = tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]; b.classList.toggle('on'); });
    const d = $('m_duty'); if (d) d.onclick = async () => { const v = !p.on_duty; const { error } = await sb.rpc('owner_set_duty', { p_id: id, p_on: v }); if (error) { toast('Erreur : ' + error.message); return; } p.on_duty = v; d.classList.toggle('on', v); };
  }
  $('m_save').onclick = async () => {
    const b = $('m_save'); b.disabled = true; b.textContent = 'Enregistrement…';
    try {
      const url = photo ? await uploadPhoto(prof.uid, photo) : null;
      const { error } = await sb.rpc('owner_update_place', { p_id: id, p_phone: $('m_tel').value.trim() || null, p_hours: $('m_h').value.trim() || null, p_address: $('m_a').value.trim() || null, p_description: $('m_d').value.trim() || null, p_tags: tags, p_photo_url: url });
      if (error) throw error; p.phone = $('m_tel').value.trim(); p.hours = $('m_h').value.trim(); p.address = $('m_a').value.trim(); p.description = $('m_d').value.trim(); toast('Informations enregistrées');
    } catch (e) { $('me').innerHTML = `<div class="msg err">${esc(e.message || 'Erreur')}</div>`; }
    b.disabled = false; b.textContent = 'Enregistrer les informations';
  };

  /* ---------- photos ---------- */
  function drawPho() {
    $('m_body').innerHTML = `<div class="card2"><div class="sh">Photo principale</div><div class="mgmain" id="m_pv" style="${p.photo_url ? `background:center/cover url('${esc(p.photo_url)}')` : ''}">${p.photo_url ? '' : '<span>Aucune photo principale</span>'}</div><button type="button" class="btn ghost" id="m_ph" style="margin-top:10px">${svg(I.cam, 18)} Changer la photo principale</button></div>
      <div class="card2"><div class="sh">Galerie (carrousel de la fiche)</div><div class="mgal" id="m_gal"></div><button type="button" class="btn ghost" id="m_gadd">${svg(I.cam, 18)} Ajouter une photo</button></div>`;
    $('m_ph').onclick = async () => { try { const ph = await pickPhoto(); if (!ph) return; $('m_ph').disabled = true; const url = await uploadPhoto(prof.uid, ph); const { error } = await sb.rpc('owner_update_place', { p_id: id, p_phone: p.phone || null, p_hours: p.hours || null, p_address: p.address || null, p_description: p.description || null, p_tags: tags, p_photo_url: url }); if (error) throw error; p.photo_url = url; toast('Photo principale mise à jour'); drawPho(); } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Erreur : ' + (e.message || 'photo impossible')); const b = $('m_ph'); if (b) b.disabled = false; } };
    const drawGal = () => { $('m_gal').innerHTML = gal.length ? gal.map((u, i) => `<div class="gph" style="background:center/cover url('${esc(u)}')"><button type="button" data-g="${i}" aria-label="Retirer">${svg(I.trash, 15, '#fff')}</button></div>`).join('') : '<div class="sub" style="grid-column:1/4">Ajoutez 3 à 6 photos pour un beau carrousel.</div>';
      $('m_gal').querySelectorAll('[data-g]').forEach(b => b.onclick = async () => { const n = gal.filter((_, i) => i !== +b.dataset.g); const { error } = await sb.rpc('owner_set_photos', { p_id: id, p_photos: n }); if (error) { toast('Erreur : ' + error.message); return; } removeStored(gal[+b.dataset.g]); gal = n; drawGal(); }); };
    drawGal();
    $('m_gadd').onclick = async () => { try { const ph = await pickPhoto(); if (!ph) return; $('m_gadd').disabled = true; const url = await uploadPhoto(prof.uid, ph); const n = [...gal, url]; const { error } = await sb.rpc('owner_set_photos', { p_id: id, p_photos: n }); if (error) throw error; gal = n; drawGal(); toast('Photo ajoutée'); } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Erreur : ' + (e.message || 'photo impossible')); } $('m_gadd').disabled = false; };
  }

  /* ---------- factures ---------- */
  let invs = [], tarifs = null; const isAdm = prof.role === 'admin';
  const perms = { collect: isAdm, create: isAdm, sponsor: isAdm, cancel: isAdm };
  async function drawFac() {
    $('m_body').innerHTML = '<div class="empty">Chargement…</div>';
    const [{ data, error }, t] = await Promise.all([sb.from('invoices').select('*').eq('place_id', id).order('created_at', { ascending: false }), tarifs ? Promise.resolve(tarifs) : loadTarifs()]);
    tarifs = t; if (error) { $('m_body').innerHTML = errBox(error); return; } invs = data || [];
    const due = dueTotal(invs), b = $('b_fac'); if (b) { const n = invs.filter(i => i.status === 'due').length; b.textContent = n || ''; b.style.display = n ? 'inline-flex' : 'none'; }
    $('m_body').innerHTML = `<div class="card2" style="background:${due ? '#FFF4EC' : '#EAF8EF'}"><div class="sub" style="margin:0">Reste à payer</div><b style="font-size:28px;color:${due ? '#E2541F' : '#1E7A43'}">${money(due)}</b>
        <div class="sub" style="margin:4px 0 0">${due ? 'Remettez ce montant à votre agent Bangui Guide : votre reçu apparaîtra ici.' : 'Tout est à jour. Merci !'}</div></div>
      ${planBox(p)}
      <div class="mgct"><h2>Mes factures</h2><span>${invs.length}</span></div>
      ${invs.length ? invs.map(i => invoiceRow(i, i.status === 'paid' ? ' · reçu ' + i.receipt : '')).join('') : '<div class="mgem"><p>Aucune facture pour le moment. Votre facture d’inscription apparaît ici dès la validation de votre fiche.</p></div>'}
      ${isAdm ? `<button class="btn mgadd" id="f_new" style="position:static;margin:4px 0 12px">${svg(I.plus, 20, '#fff', 2.4)} Nouvelle facture</button>` : ''}${tarifsBox(tarifs)}`;
    $('m_body').querySelectorAll('[data-iv]').forEach(x => x.onclick = () => billingSheet(p, perms, () => drawFac(), x.dataset.iv));
    const fn = $('f_new'); if (fn) fn.onclick = () => billingSheet(p, perms, () => drawFac());
  }
  sb.from('invoices').select('id').eq('place_id', id).eq('status', 'due').then(({ data }) => { const b = $('b_fac'); if (b && data?.length) { b.textContent = data.length; b.style.display = 'inline-flex'; } });

  /* ---------- activité ---------- */
  let stats = null;
  function drawAct() {
    const L = [['view', 'Vues de la fiche'], ['call', 'Appels'], ['message', 'Messages'], ['whatsapp', 'WhatsApp'], ['route', 'Itinéraires']];
    $('m_body').innerHTML = `<div class="card2"><div class="sh">Statistiques</div>${stats === 'err' ? '<div class="sub">Statistiques indisponibles pour l’instant.</div>' : `<div class="mgst">${L.map(([k, l]) => `<div><b>${stats?.[k]?.n7 ?? 0}</b><span>${l}</span><small>7 jours · ${stats?.[k]?.n30 ?? 0} en 30 jours</small></div>`).join('')}</div>`}</div>
      <a class="card2 mgln" href="#/messages"><span>${svg(I.msg, 22, '#1E3A8A', 1.8)}</span><div><b>Demandes et messages</b><div class="sub">Répondez, confirmez ou refusez les demandes des clients</div></div>${svg('<path d="m9 6 6 6-6 6"/>', 18, '#8A90A3', 2)}</a>
      <a class="card2 mgln" href="#/place/${id}"><span>${svg(I.star || '<path d="m12 2 3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z"/>', 22, '#E2541F', 1.8)}</span><div><b>Avis des clients</b><div class="sub">Ouvrez votre fiche, onglet Avis, pour répondre</div></div>${svg('<path d="m9 6 6 6-6 6"/>', 18, '#8A90A3', 2)}</a>`;
  }
  sb.rpc('owner_stats', { p_id: id }).then(({ data, error }) => {
    stats = error ? 'err' : Object.fromEntries((data || []).map(r => [r.kind, r]));
    const g = k => stats === 'err' ? 0 : (stats[k]?.n7 ?? 0);
    const e = $('m_stat'); if (e) e.innerHTML = [['view', 'Vues'], ['call', 'Appels'], ['message', 'Messages'], ['whatsapp', 'WhatsApp']].map(([k, l]) => `<div><b>${g(k)}</b><span>${l} · 7 j</span></div>`).join('');
    if (tab === 'act') drawAct();
  });
  showTab(new URLSearchParams((location.hash.split('?')[1]) || '').get('t') === 'fac' ? 'fac' : 'cat');
}
