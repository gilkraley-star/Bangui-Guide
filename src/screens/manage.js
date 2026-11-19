import { esc, svg, I, sb, configured, getProfile, toast, pickPhoto, uploadPhoto, fmtPrice } from '../core.js';
import { CAT } from '../data.js';
import { plain, topbar, bindBack, errBox, notConfigured, rowHtml, photoBox, shell } from '../ui.js';
import { PRESET_TAGS } from './place.js';

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
  if (!configured) { plain(topbar('Gérer') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null); if (!prof) { location.hash = '#/profil'; return; }
  const [{ data: p, error }, { data: its }] = await Promise.all([sb.from('places').select('*').eq('id', id).maybeSingle(), sb.from('place_items').select('*').eq('place_id', id).order('created_at')]);
  if (error || !p) { plain(topbar('Gérer') + (error ? errBox(error) : '<div class="empty">Lieu introuvable.</div>')); bindBack(); return; }
  let tags = [...(p.tags || [])], photo = null;
  plain(topbar(p.name) + `<div class="pad" style="padding-top:6px"><div id="m_top"></div><div id="me"></div>
    <div class="card2"><div class="sh">Informations</div>
    <div class="field"><label>Téléphone</label><input id="m_tel" type="tel" value="${esc(p.phone || '')}"></div>
    <div class="field"><label>Horaires</label><input id="m_h" value="${esc(p.hours || '')}" maxlength="120" placeholder="Lun–Sam 8h–18h"></div>
    <div class="field"><label>Adresse</label><input id="m_a" value="${esc(p.address || '')}" maxlength="200"></div>
    <div class="field"><label>Description</label><textarea id="m_d" maxlength="600">${esc(p.description || '')}</textarea></div>
    <div class="field"><label>Services proposés</label><div class="fchips" style="flex-wrap:wrap;padding:0;overflow:visible" id="m_t">${PRESET_TAGS.map(t => `<button type="button" class="fc ${tags.includes(t) ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>
    <div class="field"><label>Photo principale</label><button type="button" class="btn ghost" id="m_ph">${svg(I.cam, 18)} Changer la photo</button><img id="m_pv" src="${esc(p.photo_url || '')}" style="${p.photo_url ? '' : 'display:none;'}width:100%;border-radius:13px;margin-top:8px"></div>
    <button class="btn" id="m_save">Enregistrer</button></div>
    <div class="card2"><div class="sh">Éléments (menu, chambres, produits, tarifs…)</div><div id="m_items"></div>
    <div class="field" style="margin-top:12px"><label>Nom</label><input id="i_n" maxlength="120"></div>
    <div style="display:flex;gap:8px"><div class="field" style="flex:1"><label>Prix (FCFA)</label><input id="i_p" type="number" inputmode="numeric" min="0"></div><div class="field" style="flex:1"><label>Unité</label><input id="i_u" placeholder="nuit, kg…" maxlength="20"></div></div>
    <div class="field"><label>Description</label><input id="i_d" maxlength="200"></div>
    <div class="field"><button type="button" class="btn ghost" id="i_ph">${svg(I.cam, 18)} Photo (facultatif)</button><div class="sub" id="i_pt"></div></div>
    <button class="btn sec2" id="i_add">${svg(I.plus, 18, '#2A4A8A')} Ajouter</button></div></div>`);
  bindBack(); const $ = i => document.getElementById(i);
  document.querySelectorAll('#m_t .fc').forEach(b => b.onclick = () => { const t = b.dataset.t; tags = tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]; b.classList.toggle('on'); });
  $('m_ph').onclick = async () => { try { const ph = await pickPhoto(); if (ph) { photo = ph; $('m_pv').src = ph; $('m_pv').style.display = 'block'; } } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Photo impossible'); } };
  $('m_save').onclick = async () => {
    const b = $('m_save'); b.disabled = true; b.textContent = 'Enregistrement…';
    try {
      const url = photo ? await uploadPhoto(prof.uid, photo) : null;
      const { error } = await sb.rpc('owner_update_place', { p_id: id, p_phone: $('m_tel').value.trim() || null, p_hours: $('m_h').value.trim() || null, p_address: $('m_a').value.trim() || null, p_description: $('m_d').value.trim() || null, p_tags: tags, p_photo_url: url });
      if (error) throw error; toast('Enregistré');
    } catch (e) { $('me').innerHTML = `<div class="msg err">${esc(e.message || 'Erreur')}</div>`; }
    b.disabled = false; b.textContent = 'Enregistrer';
  };
  let list = its || [], ip = null, editId = null;
  const drawItems = () => {
    $('m_items').innerHTML = list.length ? list.map(it => `<div class="itm ${it.available === false ? 'soldout' : ''}"><div style="flex:1;min-width:0"><b>${esc(it.name)}</b><div class="sub" style="margin:0">${esc(fmtPrice(it.price, it.unit))}</div></div>
      <button class="fc ${it.available === false ? '' : 'on'}" data-a="${it.id}">${it.available === false ? 'Épuisé' : 'Dispo'}</button>
      <button class="back" data-e="${it.id}" aria-label="Modifier">${svg(I.edit, 17)}</button><button class="back" data-d="${it.id}" aria-label="Supprimer">${svg(I.trash, 18, '#C23B3B')}</button></div>`).join('') : '<div class="sub">Aucun élément pour l’instant.</div>';
    document.querySelectorAll('#m_items [data-d]').forEach(b => b.onclick = async () => { const { error } = await sb.from('place_items').delete().eq('id', b.dataset.d); if (error) { toast('Erreur : ' + error.message); return; } list = list.filter(x => x.id !== b.dataset.d); drawItems(); });
    document.querySelectorAll('#m_items [data-a]').forEach(b => b.onclick = async () => { const it = list.find(x => x.id === b.dataset.a), v = it.available === false; const { error } = await sb.from('place_items').update({ available: v }).eq('id', it.id); if (error) { toast('Erreur : ' + error.message); return; } it.available = v; drawItems(); });
    document.querySelectorAll('#m_items [data-e]').forEach(b => b.onclick = () => { const it = list.find(x => x.id === b.dataset.e); editId = it.id; $('i_n').value = it.name; $('i_p').value = it.price ?? ''; $('i_u').value = it.unit || ''; $('i_d').value = it.description || ''; $('i_add').lastChild.textContent = ' Enregistrer la modification'; $('i_n').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  };
  drawItems();
  $('i_ph').onclick = async () => { try { ip = await pickPhoto(); $('i_pt').textContent = ip ? '✓ Photo prête' : ''; } catch { } };
  $('i_add').onclick = async () => {
    const name = $('i_n').value.trim(); if (!name) { toast('Donne un nom'); return; } const b = $('i_add'); b.disabled = true;
    try {
      const row = { name, price: $('i_p').value === '' ? null : Number($('i_p').value), unit: $('i_u').value.trim() || null, description: $('i_d').value.trim() || null };
      if (ip) row.photo_url = await uploadPhoto(prof.uid, ip);
      if (editId) { const { data, error } = await sb.from('place_items').update(row).eq('id', editId).select().single(); if (error) throw error; list = list.map(x => x.id === editId ? data : x); editId = null; b.lastChild.textContent = ' Ajouter'; toast('Modifié'); }
      else { const { data, error } = await sb.from('place_items').insert({ ...row, place_id: id }).select().single(); if (error) throw error; list = [...list, data]; toast('Ajouté'); }
      drawItems(); ['i_n', 'i_p', 'i_u', 'i_d'].forEach(k => $(k).value = ''); ip = null; $('i_pt').textContent = '';
    } catch (e) { toast('Erreur : ' + (e.message || e)); }
    b.disabled = false;
  };
  /* statistiques + garde */
  const dutyOn = () => `<div class="field" style="margin:0"><label>${p.category === 'pharmacie' ? 'Pharmacie de garde aujourd’hui' : 'De garde / service d’urgence aujourd’hui'}</label><button type="button" class="fc ${p.on_duty ? 'on' : ''}" id="m_duty" style="margin-top:4px">${p.on_duty ? 'Oui, de garde' : 'Non'}</button></div>`;
  $('m_top').innerHTML = `<div class="card2"><div class="sh">Statistiques</div><div class="stat" id="m_stat"><div><b>…</b><span>chargement</span></div></div></div><div class="card2">${dutyOn()}</div>`;
  $('m_duty').onclick = async () => { const v = !p.on_duty; const { error } = await sb.rpc('owner_set_duty', { p_id: id, p_on: v }); if (error) { toast('Erreur : ' + error.message); return; } p.on_duty = v; $('m_duty').classList.toggle('on', v); $('m_duty').textContent = v ? 'Oui, de garde' : 'Non'; };
  sb.rpc('owner_stats', { p_id: id }).then(({ data, error }) => {
    const m = Object.fromEntries((data || []).map(r => [r.kind, r])); const L = [['view', 'Vues de la fiche'], ['call', 'Appels'], ['message', 'Messages'], ['whatsapp', 'WhatsApp'], ['route', 'Itinéraires']];
    $('m_stat').innerHTML = error ? '<div class="sub">Statistiques indisponibles (migration v3 non exécutée ?)</div>' : L.map(([k, l]) => `<div><b>${m[k]?.n7 ?? 0}</b><span>${l} · 7 jours<br>${m[k]?.n30 ?? 0} sur 30 jours</span></div>`).join('');
  });
}
