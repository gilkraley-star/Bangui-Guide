import { esc, svg, I, CI, PIN, catPath, sb, configured, getProfile, requireLogin, favs, toast, fmtPrice, withDist, attachStats, isSponsored, fmtD } from '../core.js';
import { CAT } from '../data.js';
import { $app, onLeave, photoBox, itemPhoto, heroOf, spBadge, stars, errBox, notConfigured, brand, plain, topbar, bindBack, rowHtml } from '../ui.js';

const ITEM = { restaurant: ['Menu', 'restaurant'], hotel: ['Chambres', 'hotel'], commerce: ['Produits', 'commerce'], pharmacie: ['Produits', 'pharmacie'], ecole: ['Niveaux', 'ecole'], universite: ['Filières', 'universite'], voyage: ['Vols', 'voyage'], garage: ['Services', 'garage'], salon: ['Services', 'salon'], banque: ['Services', 'banque'], hopital: ['Services', 'hopital'], transport: ['Tarifs', 'transport'], btp: ['Services', 'btp'], station: ['Services', 'station'] };
const TAG_ICON = {
  'Wi-Fi': '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
  'Parking': '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  'Livraison': '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17 9 9h5l4 8M9 9H7"/>',
  'Paiement mobile': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  'Climatisation': '<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/>',
  'Piscine': '<path d="M2 18c2 0 2-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/><path d="M2 13c2 0 2-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/>',
  'Salle de groupe': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  'Terrasse': '<path d="M3 21h18M5 21V9l7-6 7 6v12"/>'
};
export const PRESET_TAGS = Object.keys(TAG_ICON);
const tagChip = t => `<span>${svg(TAG_ICON[t] || I.check, 22, '#1E6BE0', 1.8)}${esc(t)}</span>`;

export async function place(id) {
  plain(`<div class="dtop"><div class="dbar"><button class="back" id="back">${svg(I.back, 20)}</button>${brand}<span style="width:38px"></span></div></div><div class="sheet2"><div class="sk" style="height:150px;border-radius:20px"></div></div>`); bindBack();
  if (!configured) { plain(topbar('Lieu') + notConfigured()); bindBack(); return; }
  const [{ data: p, error }, items, revs, prof] = await Promise.all([
    sb.from('places').select('*').eq('id', id).maybeSingle(),
    sb.from('place_items').select('*').eq('place_id', id).order('created_at'),
    sb.from('reviews').select('*').eq('place_id', id).order('created_at', { ascending: false }).limit(50),
    getProfile().catch(() => null)
  ]);
  if (error || !p) { plain(topbar('Lieu') + (error ? errBox(error) : '<div class="empty">Lieu introuvable.</div>')); bindBack(); return; }
  const its = items.data || [], reviews = revs.data || [];
  const n = reviews.length, avg = n ? reviews.reduce((s, r) => s + r.rating, 0) / n : null;
  const c = CAT[p.category] || { fg: '#3A3F52', bg: '#F1F2F6', label: p.category }, isFav = favs.get().includes(p.id), sp = isSponsored(p);
  const itemInfo = ITEM[p.category], tabs = [];
  if (itemInfo) tabs.push(['items', itemInfo[0], CI[itemInfo[1]]]);
  tabs.push(['about', 'À propos', I.info], ['reviews', 'Avis', I.star], ['photos', 'Photos', I.img], ['infos', 'Infos', I.pin]);
  if (prof && (prof.role === 'admin' || p.owner_id === prof.uid)) tabs.push(['admin', 'Gérer', I.edit]);
  let tab = tabs[0][0];
  const hasGps = p.lat != null && p.lng != null;
  const url = hasGps ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' Bangui')}`;
  const mine = prof && reviews.find(r => r.user_id === prof.uid);
  const canManage = prof && (prof.role === 'admin' || p.owner_id === prof.uid);

  const itemsHtml = () => {
    if (!its.length) return `<div class="card2"><div class="empty" style="padding:20px">${itemInfo?.[0] || 'Contenu'} à venir. L’établissement n’a pas encore ajouté d’éléments.</div></div>`;
    const cards = ['hotel', 'commerce', 'pharmacie'].includes(p.category);
    const th = it => itemPhoto(it) ? `<div style="background:center/cover url('${esc(itemPhoto(it))}')"></div>` : photoBox({ category: p.category }, '', 30);
    return cards ? `<div class="icards">${its.map(it => `<div class="icd"><div class="ti">${th(it)}</div><div class="tx"><b style="font-size:14px">${esc(it.name)}</b><div class="pr" style="color:#E2541F;font-weight:800;margin-top:3px">${esc(fmtPrice(it.price, it.unit))}</div></div></div>`).join('')}</div>`
      : `<div class="card2 itmwrap">${its.map(it => `<div class="itm"><div class="ti">${th(it)}</div><div style="flex:1;min-width:0"><b>${esc(it.name)}</b>${it.description ? `<div class="sub" style="margin:2px 0 0">${esc(it.description)}</div>` : ''}</div><span class="pr">${esc(fmtPrice(it.price, it.unit))}</span></div>`).join('')}</div>`;
  };
  const row = (ic, tx, label) => tx ? `<div class="irow"><span class="ic">${svg(ic, 18, '#E2541F')}</span><div><div class="il">${label}</div><div class="iv">${esc(tx)}</div></div></div>` : '';
  const views = {
    items: itemsHtml,
    about: () => `<div class="card2"><div class="sh">À propos</div><p style="font-size:14.5px;color:#3A3F52;line-height:1.55;margin:0">${esc(p.description || 'Description à venir.')}</p></div>
      ${p.hours ? `<div class="card2"><div class="sh">Horaires d’ouverture</div><div class="iv">${esc(p.hours)}</div></div>` : ''}
      ${p.tags?.length ? `<div class="card2"><div class="sh">Services</div><div class="svc">${p.tags.map(tagChip).join('')}</div></div>` : ''}`,
    reviews: () => `<div class="card2"><div class="sum"><div class="big">${avg != null ? avg.toFixed(1) : '–'}</div><div>${stars(avg, 18)}<div class="sub" style="margin-top:4px">${n} avis</div></div></div></div>
      <div class="card2"><div class="sh">${mine ? 'Modifier mon avis' : 'Donner mon avis'}</div>${prof ? `<div class="starpick" id="sp">${[1, 2, 3, 4, 5].map(i => `<button data-v="${i}" aria-label="${i} étoiles">${svg(I.star, 30, '#FFB020', 1.6).replace('fill="none"', `fill="${(mine?.rating || 0) >= i ? '#FFB020' : 'none'}"`)}</button>`).join('')}</div>
        <div class="field" style="margin-bottom:10px"><textarea id="rc" maxlength="1000" placeholder="Votre commentaire (facultatif)">${esc(mine?.comment || '')}</textarea></div><button class="btn" id="rs">Publier</button>` : `<button class="btn sec2" id="rl">Se connecter pour donner son avis</button>`}</div>
      ${reviews.length ? `<div class="card2 rvwrap">${reviews.map(r => `<div class="rv"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">${esc(r.author || 'Utilisateur')}</b>${stars(r.rating, 13)}</div>${r.comment ? `<p style="font-size:13.5px;color:#3A3F52;line-height:1.5;margin:6px 0 0">${esc(r.comment)}</p>` : ''}</div>`).join('')}</div>` : ''}`,
    photos: () => { const ph = [heroOf(p), ...its.map(itemPhoto)].filter(Boolean); return ph.length ? `<div class="photos">${ph.map(u => `<div style="background:center/cover url('${esc(u)}')"></div>`).join('')}</div>` : `<div class="card2"><div class="empty" style="padding:20px">Pas encore de photos pour ce lieu.</div></div>`; },
    admin: () => `${admin}${canManage ? `<a class="card2" style="display:flex;align-items:center;gap:10px;font-weight:700" href="#/manage/${id}">${svg(I.edit, 18)} Modifier les informations, le menu et les photos</a>` : ''}`,
    infos: () => `<div class="card2">${row(I.pin, p.address || p.area, 'ADRESSE')}${row(I.clock, p.hours, 'HORAIRES')}${row(I.phone, p.phone, 'TÉLÉPHONE')}${!p.address && !p.area && !p.hours && !p.phone ? '<div class="sub">Informations à compléter par l’établissement.</div>' : ''}</div>
      ${p.tags?.length ? `<div class="card2"><div class="sh">Services</div><div class="svc">${p.tags.map(tagChip).join('')}</div></div>` : ''}
      <a class="card2 irow" id="mapl" href="#" style="display:flex;align-items:center;gap:12px"><span class="ic">${svg(I.nav, 18, '#1E6BE0')}</span><div style="flex:1"><div class="iv">Ouvrir dans Google Maps</div></div>${svg(I.chev, 18, '#9AA0B4')}</a>`
  };
  let bindAdmin = () => { };
  const admin = prof && prof.role === 'admin' ? `<div class="card2"><div class="il" style="margin-bottom:8px">ADMINISTRATION</div><div style="display:flex;flex-direction:column;gap:8px">
      ${sp ? '<button class="btn ghost" id="sp0">Retirer la mise en avant</button>' : '<button class="btn sec2" id="sp1">Activer la mise en avant (30 jours)</button>'}
      <div class="field" style="margin:4px 0 0"><label>Propriétaire (email du compte)</label><input id="own" type="email" placeholder="email@exemple.com"></div><button class="btn ghost" id="owb">Définir le propriétaire</button></div></div>` : '';

  const draw = () => {
    document.getElementById('tabs').innerHTML = tabs.map(([k, l, ic]) => `<button data-k="${k}" class="${k === tab ? 'on' : ''}">${svg(ic, 21, 'currentColor', 1.9)}${l}</button>`).join('');
    document.getElementById('tabc').innerHTML = views[tab]();
    document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.k; draw(); });
    bindAdmin();
    const ml = document.getElementById('mapl'); if (ml) ml.onclick = e => { e.preventDefault(); window.open(url, '_system'); };
    const rl = document.getElementById('rl'); if (rl) rl.onclick = () => requireLogin('#/place/' + id);
    const rs = document.getElementById('rs');
    if (rs) {
      let val = mine?.rating || 0; const paint = () => document.querySelectorAll('#sp button').forEach(b => b.querySelector('svg').setAttribute('fill', +b.dataset.v <= val ? '#FFB020' : 'none'));
      document.querySelectorAll('#sp button').forEach(b => b.onclick = () => { val = +b.dataset.v; paint(); });
      rs.onclick = async () => { if (!val) { toast('Choisis une note'); return; } rs.disabled = true; const { error } = await sb.from('reviews').upsert({ place_id: id, user_id: prof.uid, rating: val, comment: document.getElementById('rc').value.trim() || null }, { onConflict: 'place_id,user_id' }); if (error) { toast('Erreur : ' + error.message); rs.disabled = false; } else { toast('Merci pour votre avis'); place(id); } };
    }
  };
  $app.innerHTML = `<div class="scroll nov" id="scroll"><div class="dtop"><div class="dbar"><button class="back" id="back" aria-label="Retour">${svg(I.back, 20)}</button><span style="display:flex;align-items:center;gap:6px"><img src="logo.png" alt="" style="height:30px;border-radius:8px;background:#fff;padding:1px">${brand}</span>
      <div style="display:flex;gap:8px"><button class="back" id="fav" aria-label="Favori">${svg(I.heart, 19, isFav ? '#E2541F' : '#142A52').replace('fill="none"', isFav ? 'fill="#E2541F"' : 'fill="none"')}</button><button class="back" id="shr" aria-label="Partager">${svg(I.share, 18)}</button></div></div>
      <div class="dph">${photoBox(p, '', 56, true)}${sp ? spBadge(true) : ''}</div></div>
    <div class="sheet2"><div style="display:flex;gap:14px;align-items:center"><div class="ib" style="background:linear-gradient(150deg,${c.fg},${c.fg}BB)">${svg(catPath(p.category), 38, '#fff', 1.8)}</div>
      <div style="min-width:0;flex:1"><span class="pill" style="background:${c.bg};color:${c.fg}">${esc(c.label)}</span>${p.verified ? ' <span class="pill" style="background:#EAF8EF;color:#1E7A43">✓ Vérifié</span>' : ''}
      <h1 style="font-size:23px;line-height:1.15;margin:6px 0 4px">${esc(p.name)}</h1><div class="sub" style="margin:0;display:flex;gap:5px;align-items:center">${svg(PIN, 15, '#1E2A78', 2)} ${esc(p.area || 'Bangui')}</div></div></div>
      ${avg != null ? `<div style="display:flex;gap:8px;align-items:center;margin-top:10px"><b style="font-size:18px">${avg.toFixed(1).replace('.', ',')}</b>${stars(avg, 17)}<span class="sub" style="margin:0">(${n} avis)</span></div>` : ''}
      ${p.description ? `<p class="dsc">${esc(p.description)}</p>` : ''}
      <div class="acts">${p.phone ? `<a class="btn" style="flex:1.2" href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}">${svg(I.phone, 18, '#fff')} Appeler</a>` : ''}<button class="btn sec2" id="wr" style="flex:1">${svg(I.msg, 18, '#2A4A8A')} Écrire</button><button class="btn sec2" id="dir" style="flex:1.1">${svg(I.nav, 18, '#2A4A8A')} Itinéraire</button></div>
      <div class="tabs" id="tabs"></div><div id="tabc"></div></div></div>`;
  bindBack(); draw();
  document.getElementById('dir').onclick = () => window.open(url, '_system');
  document.getElementById('wr').onclick = async e => {
    if (!prof) { requireLogin('#/place/' + id); return; }
    e.currentTarget.disabled = true;
    let { data: cv } = await sb.from('conversations').select('id').eq('place_id', id).eq('user_id', prof.uid).maybeSingle();
    if (!cv) { const r = await sb.from('conversations').insert({ place_id: id, user_id: prof.uid, user_name: prof.full_name }).select('id').single(); if (r.error) { toast('Erreur : ' + r.error.message); e.currentTarget.disabled = false; return; } cv = r.data; }
    location.hash = '#/chat/' + cv.id;
  };
  document.getElementById('fav').onclick = () => { const a = favs.get(), i = a.indexOf(p.id); i >= 0 ? a.splice(i, 1) : a.push(p.id); favs.set(a); toast(i >= 0 ? 'Retiré des favoris' : 'Ajouté aux favoris'); place(id); };
  document.getElementById('shr').onclick = async () => { const text = `${p.name} — ${p.address || p.area || 'Bangui'} (Bangui Guide)`; try { navigator.share ? await navigator.share({ title: p.name, text, url }) : (await navigator.clipboard.writeText(text + ' ' + url), toast('Copié')); } catch { } };
  bindAdmin = () => {
  const setSp = async on => { const { error } = await sb.from('places').update(on ? { sponsored: true, sponsored_until: new Date(Date.now() + 30 * 864e5).toISOString() } : { sponsored: false, sponsored_until: null }).eq('id', id); error ? toast('Erreur : ' + error.message) : (toast(on ? 'Mise en avant activée' : 'Mise en avant retirée'), place(id)); };
  const b1 = document.getElementById('sp1'), b0 = document.getElementById('sp0'); if (b1) b1.onclick = () => setSp(true); if (b0) b0.onclick = () => setSp(false);
  const ow = document.getElementById('owb'); if (ow) ow.onclick = async () => { const { data, error } = await sb.rpc('set_place_owner', { p_id: id, p_email: document.getElementById('own').value.trim() }); toast(error ? 'Erreur : ' + error.message : data); };
  };
  bindAdmin();
}
