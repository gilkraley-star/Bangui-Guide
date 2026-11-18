import './style.css';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { sb, configured } from './supabase.js';
import { CATS, CAT, QUARTIERS } from './data.js';

const $app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PIN = '<path d="M12 21s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.6-9.5 9-9.5 9Z"/><circle cx="12" cy="11" r="2"/>';
const svg = (p, s = 21, c = 'currentColor', w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>', back: '<path d="m15 18-6-6 6-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  nav: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  cam: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', pin: PIN, star: '<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>'
};
const CI = {
  restaurant: '<path d="M7 3v8"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M17 3c-1.5 0-3 1.5-3 4s1 4 1 4v10"/><path d="M7 11v10"/>',
  hotel: '<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/><path d="M9 11h.01M15 11h.01"/>',
  pharmacie: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
  banque: '<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  hopital: '<path d="M4 21V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"/><path d="M12 9v6M9 12h6"/><path d="M9 21v-3h6v3"/>',
  ecole: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  universite: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  transport: '<rect x="3" y="6" width="18" height="11" rx="2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M3 11h18"/>',
  admin: '<path d="M12 3 3 8h18z"/><path d="M5 8v10M10 8v10M14 8v10M19 8v10"/><path d="M3 21h18"/>',
  culte: '<path d="M12 2v5M9.5 4.5h5"/><path d="M5 22V12l7-4 7 4v10"/><path d="M10 22v-5a2 2 0 0 1 4 0v5"/>',
  commerce: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  salon: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  garage: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  btp: '<path d="M2 18h20"/><path d="M4 18v-3a8 8 0 0 1 16 0v3"/><path d="M12 7v4"/>',
  voyage: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  organisation: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
};
const catPath = id => CI[id] || PIN;
const catIcon = id => { const c = CAT[id] || { fg: '#8A90A3', bg: '#F1F2F6' }; return `<i style="background:${c.bg}">${svg(catPath(id), 25, c.fg, 1.8)}</i>`; };
const toast = t => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); };
const favs = { get: () => { try { return JSON.parse(localStorage.getItem('bg_favs') || '[]'); } catch { return []; } }, set: a => localStorage.setItem('bg_favs', JSON.stringify(a)) };
const photoStyle = p => p.photo_url ? `background-image:url('${esc(p.photo_url)}')` : `background-color:${CAT[p.category]?.bg || '#E9ECF3'}`;
const noPhoto = (p, s = 26) => p.photo_url ? '' : `<div class="ph0">${svg(catPath(p.category), s, CAT[p.category]?.fg || '#B4B9C9', 1.7)}</div>`;
const isSponsored = p => p.sponsored && (!p.sponsored_until || new Date(p.sponsored_until) > new Date());
const getPos = () => { try { return JSON.parse(sessionStorage.getItem('bg_pos') || 'null'); } catch { return null; } };
const kmBetween = (a, b) => { const r = x => x * Math.PI / 180, dl = r(b.lat - a.lat), dg = r(b.lng - a.lng), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dg / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
const fmtD = k => k < 1 ? `${Math.round(k * 1000)} m` : `${k.toFixed(1)} km`;
const withDist = a => { const me = getPos(); return a.map(p => ({ ...p, _d: me && p.lat != null && p.lng != null ? kmBetween(me, p) : null })); };
async function locate() { try { const g = await getGps(); sessionStorage.setItem('bg_pos', JSON.stringify({ lat: g.lat, lng: g.lng })); return true; } catch { toast('Position indisponible : autorise la localisation'); return false; } }
const sortSp = a => [...a].sort((x, y) => isSponsored(y) - isSponsored(x));
const skel = n => Array.from({ length: n }, () => '<div class="row"><div class="th sk"></div><div class="bd"><div class="sk" style="height:14px;width:70%;border-radius:6px"></div><div class="sk" style="height:11px;width:45%;border-radius:6px"></div></div></div>').join('');

function shell(content, tab) {
  const t = (id, href, icon, label) => `<a href="${href}" class="${tab === id ? 'on' : ''}">${svg(icon, 21, 'currentColor', tab === id ? 2.2 : 1.9)}<span>${label}</span></a>`;
  $app.innerHTML = `<div class="scroll" id="scroll">${content}</div>
  <nav class="nav">${t('home', '#/', I.home, 'Accueil')}${t('search', '#/search', I.search, 'Explorer')}${t('favs', '#/favs', I.heart, 'Favoris')}${t('agent', '#/agent', I.user, 'Agent')}</nav>`;
}
function plain(content) { $app.innerHTML = `<div class="scroll" id="scroll">${content}</div>`; }
const topbar = (title) => `<div class="top safe-top"><button class="back" id="back" aria-label="Retour">${svg(I.back, 20)}</button><h1 style="font-size:17px">${esc(title)}</h1></div>`;
const bindBack = () => { const b = document.getElementById('back'); if (b) b.onclick = () => history.length > 1 ? history.back() : (location.hash = '#/'); };
const notConfigured = () => `<div class="empty"><h2 style="font-size:17px;color:#142A52;margin-bottom:10px">Serveur non configuré</h2>Renseigne <b>SUPABASE_URL</b> et <b>SUPABASE_ANON_KEY</b> dans <code>src/config.js</code>, puis recompile l’app.</div>`;
const errBox = e => `<div class="msg err">Impossible de charger les données. Vérifie ta connexion internet.<br><small>${esc(e?.message || '')}</small></div>`;
const spBadge = '<span class="spb">SPONSORISÉ</span>';

function rowHtml(p) {
  const c = CAT[p.category], sp = isSponsored(p);
  return `<a class="row ${sp ? 'sp' : ''}" href="#/place/${p.id}"><div class="th" style="${photoStyle(p)}">${noPhoto(p, 24)}</div><div class="bd">
    <span class="nm">${esc(p.name)}</span>
    <div class="sub" style="margin:0"><span style="color:${c?.fg || '#8A90A3'};font-weight:600">${esc(c?.label || p.category)}</span>${p.area ? ' · ' + esc(p.area) : ''}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">${sp ? spBadge : ''}${p.verified ? `<span class="pill" style="background:#EAF8EF;color:#1E7A43">✓ Vérifié</span>` : ''}${p._d != null ? `<span class="pill" style="background:#EAF1FF;color:#2A4A8A">${svg(PIN, 10, '#2A4A8A', 2.4)} ${fmtD(p._d)}</span>` : ''}</div></div>
    <span style="align-self:center;color:#C3C7D4">${svg('<path d="m9 18 6-6-6-6"/>', 18, 'currentColor', 2)}</span></a>`;
}

/* ---------- ACCUEIL ---------- */
async function home() {
  shell(`<div class="hero safe-top"><div style="display:flex;align-items:center;gap:12px"><div class="logo"><img src="logo.png" alt="Bangui Guide"></div>
    <div style="font-size:12px;opacity:.8;line-height:1.3">Bonjour 👋<br><b style="color:#fff;font-size:14px">Trouvez un lieu à Bangui</b></div></div></div>
    <form class="sbar" id="sf">${svg(I.search, 18, '#8A90A3')}<input id="q" type="search" placeholder="Restaurant, hôtel, pharmacie…" enterkeyhint="search"></form>
    <div class="chips">${CATS.map(c => `<a class="chip" href="#/search?cat=${c.id}">${catIcon(c.id)}${esc(c.label)}</a>`).join('')}</div>
    <div class="qa">
      <a href="#/search?cat=hopital" style="background:linear-gradient(135deg,#E2541F,#F5841F)">${svg(CI.hopital, 24, '#fff', 1.8)}<span><b>Urgence & santé</b><small>Hôpitaux, cliniques</small></span></a>
      <a href="#/search?cat=pharmacie" style="background:linear-gradient(135deg,#1E7A43,#2E9E5B)">${svg(CI.pharmacie, 24, '#fff', 1.8)}<span><b>Pharmacie</b><small>Près de vous</small></span></a>
      <a href="#/search?cat=restaurant" style="background:linear-gradient(135deg,#142A52,#2A4A8A)">${svg(CI.restaurant, 24, '#fff', 1.8)}<span><b>Manger</b><small>Restaurants</small></span></a></div>
    <div id="nearbox"></div><div id="feat"></div><div class="sec"><h2>Récemment ajoutés</h2><a href="#/search" class="more">Voir tout</a></div>
    <div class="list" id="recent">${skel(4)}</div>`, 'home');
  document.getElementById('sf').onsubmit = e => { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent(document.getElementById('q').value.trim()); };
  const recent = document.getElementById('recent');
  if (!configured) { recent.innerHTML = notConfigured(); return; }
  const { data, error } = await sb.from('places').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(40);
  if (error) { recent.innerHTML = errBox(error); return; }
  const feat = data.filter(isSponsored);
  if (feat.length) document.getElementById('feat').innerHTML = `<div class="sec"><h2>À la une</h2></div><div class="hs">${feat.map(p => `<a class="card" href="#/place/${p.id}"><div class="ph" style="${photoStyle(p)}">${noPhoto(p, 30)}${spBadge.replace('spb', 'spb abs')}</div><div class="tx"><div class="nm">${esc(p.name)}</div><div class="sub">${esc(CAT[p.category]?.label || '')}${p.area ? ' · ' + esc(p.area) : ''}</div></div></a>`).join('')}</div>`;
  const all = withDist(data), me = getPos(), nb = document.getElementById('nearbox');
  const near = all.filter(p => p._d != null).sort((a, b) => a._d - b._d).slice(0, 4);
  if (me && near.length) nb.innerHTML = `<div class="sec"><h2>Près de vous</h2></div><div class="list" style="padding-bottom:20px">${near.map(rowHtml).join('')}</div>`;
  else if (!me) { nb.innerHTML = `<div class="near"><span style="flex:none">${svg(I.pin, 28, '#2A4A8A', 1.7)}</span><div style="flex:1;font-size:13px;line-height:1.35"><b>Découvrez ce qui est autour de vous</b><div style="color:#5B6075;font-size:12px;margin-top:2px">Distances et lieux les plus proches.</div></div><button class="btn" id="loc">Activer</button></div>`; document.getElementById('loc').onclick = async e => { e.target.textContent = '…'; (await locate()) ? home() : (e.target.textContent = 'Activer'); }; }
  recent.innerHTML = all.length ? sortSp(all).slice(0, 12).map(rowHtml).join('') + `<div class="invite"><span style="flex:none">${svg(I.share, 26, '#fff', 1.7)}</span><div style="flex:1;font-size:13px;line-height:1.35"><b>Bangui Guide, c’est mieux à plusieurs</b><div style="opacity:.8;font-size:12px;margin-top:2px">Fais découvrir l’app à tes proches.</div></div><button class="btn" id="inv">Inviter</button></div>` : `<div class="empty">Aucun lieu pour l’instant. Les agents de terrain en ajoutent chaque jour.</div>`;
  const inv = document.getElementById('inv'); if (inv) inv.onclick = async () => { try { await navigator.share({ title: 'Bangui Guide', text: 'Trouve restaurants, hôtels, pharmacies et services à Bangui avec Bangui Guide !' }); } catch { } };
}

/* ---------- RECHERCHE ---------- */
async function search(params) {
  let cat = params.get('cat') || '', q = params.get('q') || '', nearOn = false;
  shell(`<div class="hero safe-top" style="padding-bottom:30px"><h1 style="font-size:22px">Explorer</h1><div style="font-size:12.5px;opacity:.8;margin-top:4px">Tous les lieux de Bangui</div></div>
    <div class="sbar"><span>${svg(I.search, 18, '#8A90A3')}</span><input id="q" type="search" placeholder="Nom, quartier, adresse…" value="${esc(q)}"></div>
    <div class="fchips"><button class="fc" id="nearbtn">${svg(I.pin, 13, 'currentColor', 2.2)} Plus proches</button><button class="fc ${cat ? '' : 'on'}" data-c="">Tous</button>${CATS.map(c => `<button class="fc ${cat === c.id ? 'on' : ''}" data-c="${c.id}">${esc(c.label)}</button>`).join('')}</div>
    <div class="list" id="res"></div>`, 'search');
  const res = document.getElementById('res'), qi = document.getElementById('q'); let t, seq = 0;
  const run = async () => {
    if (!configured) { res.innerHTML = notConfigured(); return; }
    const my = ++seq; res.innerHTML = skel(4);
    let query = sb.from('places').select('*').eq('status', 'published').order('verified', { ascending: false }).order('name').limit(60);
    if (cat) query = query.eq('category', cat);
    const term = qi.value.trim().replace(/[%,()]/g, ' ');
    if (term) query = query.or(`name.ilike.%${term}%,area.ilike.%${term}%,address.ilike.%${term}%`);
    const { data, error } = await query; if (my !== seq) return;
    if (error) res.innerHTML = errBox(error);
    else { let a = withDist(data); a = nearOn ? a.sort((x, y) => (x._d ?? 1e9) - (y._d ?? 1e9)) : sortSp(a); res.innerHTML = a.length ? a.map(rowHtml).join('') : '<div class="empty">Aucun résultat.</div>'; }
  };
  qi.oninput = () => { clearTimeout(t); t = setTimeout(run, 300); };
  document.getElementById('nearbtn').onclick = async e => { const b = e.currentTarget; if (!nearOn && !getPos() && !(await locate())) return; nearOn = !nearOn; b.classList.toggle('on', nearOn); run(); };
  document.querySelectorAll('.fc[data-c]').forEach(b => b.onclick = () => { cat = b.dataset.c; document.querySelectorAll('.fc[data-c]').forEach(x => x.classList.toggle('on', x === b)); run(); });
  run();
}

/* ---------- FICHE ---------- */
async function place(id) {
  plain(topbar('') + `<div class="pad"><div class="sk" style="height:200px;border-radius:20px"></div></div>`); bindBack();
  if (!configured) { plain(topbar('Lieu') + notConfigured()); bindBack(); return; }
  const { data: p, error } = await sb.from('places').select('*').eq('id', id).maybeSingle();
  if (error || !p) { plain(topbar('Lieu') + (error ? errBox(error) : '<div class="empty">Lieu introuvable.</div>')); bindBack(); return; }
  let prof = null; try { prof = await getProfile(); } catch { }
  const c = CAT[p.category] || { fg: '#3A3F52', bg: '#F1F2F6', label: p.category }, isFav = favs.get().includes(p.id), hasGps = p.lat != null && p.lng != null, sp = isSponsored(p);
  const row = (ic, tx, label) => tx ? `<div class="irow"><span class="ic">${svg(ic, 18, '#E2541F')}</span><div><div class="il">${label}</div><div class="iv">${esc(tx)}</div></div></div>` : '';
  const admin = prof && prof.role === 'admin' ? `<div class="card2"><div class="il" style="margin-bottom:8px">ADMINISTRATION</div>
    <div style="display:flex;flex-direction:column;gap:8px">${sp ? '<button class="btn ghost" id="sp0">Retirer la mise en avant</button>' : '<button class="btn sec2" id="sp1">Activer la mise en avant (30 jours)</button>'}</div></div>` : '';
  plain(`<div class="heroph" style="${photoStyle(p)}">${p.photo_url ? '' : `<div class="ph0" style="background:linear-gradient(135deg,${c.bg},#fff)">${svg(catPath(p.category), 64, c.fg, 1.3)}</div>`}
    <div class="hfade"></div>
    <button class="rb" id="back" aria-label="Retour" style="left:16px">${svg(I.back, 20)}</button>
    <div style="position:absolute;right:16px;top:max(env(safe-area-inset-top,0px),var(--safe-area-inset-top,0px));margin-top:14px;display:flex;gap:10px">
      <button class="rb" id="fav" style="position:static" aria-label="Favori">${svg(I.heart, 20, isFav ? '#E2541F' : '#142A52')}</button>
      <button class="rb" id="shr" style="position:static" aria-label="Partager">${svg(I.share, 19)}</button></div></div>
    <div class="sheet"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="pill" style="background:${c.bg};color:${c.fg}">${esc(c.label)}</span>
    ${p.verified ? '<span class="pill" style="background:#EAF8EF;color:#1E7A43">✓ Vérifié</span>' : ''}${sp ? spBadge : ''}</div>
    <h1 style="font-size:23px;margin:12px 0 4px;line-height:1.2">${esc(p.name)}</h1><div class="sub" style="margin:0 0 16px">${esc(p.area || '')}</div>
    <div class="card2">${row(I.pin, p.address, 'ADRESSE')}${row(I.clock, p.hours, 'HORAIRES')}${row(I.phone, p.phone, 'TÉLÉPHONE')}${!p.address && !p.hours && !p.phone ? '<div class="sub">Informations à compléter par l’établissement.</div>' : ''}</div>
    ${p.description ? `<div class="card2"><div class="il" style="margin-bottom:6px">À PROPOS</div><p style="font-size:14px;color:#3A3F52;line-height:1.55;margin:0">${esc(p.description)}</p></div>` : ''}
    ${admin}<div id="sim"></div></div>
    <div class="abar">${p.phone ? `<a class="btn" style="flex:1.3" href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}">${svg(I.phone, 18, '#fff')} Appeler</a>` : ''}
    <a class="btn sec2" id="dir" style="flex:1" href="#">${svg(I.nav, 18, '#2A4A8A')} Itinéraire</a></div>`);
  const ab = document.querySelector('.abar'); if (ab) $app.appendChild(ab);
  bindBack();
  sb.from('places').select('*').eq('status', 'published').eq('category', p.category).neq('id', p.id).limit(8).then(({ data }) => { const el = document.getElementById('sim'); if (!el || !data || !data.length) return; el.innerHTML = `<div class="sec" style="padding:0;margin:8px 0 12px"><h2>Dans la même catégorie</h2></div><div class="hs" style="padding:0 0 8px;margin:0 -20px;padding-left:20px">${data.map(x => `<a class="card" href="#/place/${x.id}"><div class="ph" style="${photoStyle(x)}">${noPhoto(x, 30)}</div><div class="tx"><div class="nm">${esc(x.name)}</div><div class="sub">${esc(x.area || '')}</div></div></a>`).join('')}</div>`; });
  const url = hasGps ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' Bangui')}`;
  document.getElementById('dir').onclick = e => { e.preventDefault(); window.open(url, '_system'); };
  document.getElementById('fav').onclick = () => { const a = favs.get(), i = a.indexOf(p.id); i >= 0 ? a.splice(i, 1) : a.push(p.id); favs.set(a); toast(i >= 0 ? 'Retiré des favoris' : 'Ajouté aux favoris'); place(id); };
  document.getElementById('shr').onclick = async () => { const text = `${p.name} — ${p.address || p.area || 'Bangui'} (Bangui Guide)`; try { navigator.share ? await navigator.share({ title: p.name, text, url }) : (await navigator.clipboard.writeText(text + ' ' + url), toast('Copié')); } catch { } };
  const setSp = async on => { const { error } = await sb.from('places').update(on ? { sponsored: true, sponsored_until: new Date(Date.now() + 30 * 864e5).toISOString() } : { sponsored: false, sponsored_until: null }).eq('id', p.id); error ? toast('Erreur : ' + error.message) : (toast(on ? 'Mise en avant activée' : 'Mise en avant retirée'), place(id)); };
  const b1 = document.getElementById('sp1'), b0 = document.getElementById('sp0'); if (b1) b1.onclick = () => setSp(true); if (b0) b0.onclick = () => setSp(false);
}

/* ---------- FAVORIS ---------- */
async function favsPage() {
  shell(`<div class="hero safe-top" style="padding-bottom:30px"><h1 style="font-size:20px">Mes favoris</h1></div><div class="list" style="padding-top:20px" id="fl"></div>`, 'favs');
  const ids = favs.get(), fl = document.getElementById('fl');
  if (!ids.length) { fl.innerHTML = '<div class="empty">Aucun favori. Touche « Favori » sur la fiche d’un lieu pour le retrouver ici.</div>'; return; }
  if (!configured) { fl.innerHTML = notConfigured(); return; }
  const { data, error } = await sb.from('places').select('*').in('id', ids).eq('status', 'published');
  fl.innerHTML = error ? errBox(error) : (data.length ? data.map(rowHtml).join('') : '<div class="empty">Ces lieux ne sont plus disponibles.</div>');
}

/* ---------- AGENT ---------- */
const QKEY = 'bg_queue';
const queue = { get: () => { try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch { return []; } }, set: a => localStorage.setItem(QKEY, JSON.stringify(a)) };
async function getProfile() {
  const { data: { session } } = await sb.auth.getSession(); if (!session) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  return data ? { ...data, uid: session.user.id } : { none: true, uid: session.user.id };
}
async function agent() {
  if (!configured) { shell(notConfigured(), 'agent'); return; }
  let prof; try { prof = await getProfile(); } catch { prof = null; }
  if (!prof) return agentLogin();
  if (prof.none) {
    shell(`<div class="hero safe-top"><h1>Espace agent</h1></div><div class="pad" style="padding-top:24px"><div class="msg err">Ce compte n’est pas autorisé comme agent. Contacte l’administrateur.</div><button class="btn ghost" id="lo">Se déconnecter</button></div>`, 'agent');
    document.getElementById('lo').onclick = async () => { await sb.auth.signOut(); agent(); }; return;
  }
  shell(`<div class="hero safe-top"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:12px;opacity:.75">${prof.role === 'admin' ? 'Administrateur' : 'Agent terrain'}</div><h1 style="font-size:20px">${esc(prof.full_name || 'Mon espace')}</h1></div><button id="lo" style="background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:600">Déconnexion</button></div></div>
    <div class="pad" style="padding-top:20px"><div id="qbox"></div><a class="btn" href="#/agent/new">${svg(I.plus, 18, '#fff')} Enregistrer un lieu</a></div>
    ${prof.role === 'admin' ? '<div class="sec"><h2>À valider</h2></div><div class="list" id="pend"><div class="empty">Chargement…</div></div>' : ''}
    <div class="sec"><h2>Mes enregistrements</h2></div><div class="list" id="mine"><div class="empty">Chargement…</div></div>`, 'agent');
  document.getElementById('lo').onclick = async () => { await sb.auth.signOut(); agent(); };
  await syncQueue(); renderQueueBox();
  const stat = { pending: ['En attente', '#FFF4E6', '#B5560C'], published: ['Publié', '#EAF8EF', '#1E7A43'], rejected: ['Refusé', '#FFF1F0', '#C23B3B'] };
  const { data, error } = await sb.from('places').select('*').eq('created_by', prof.uid).order('created_at', { ascending: false }).limit(50);
  document.getElementById('mine').innerHTML = error ? errBox(error) : data.length ? data.map(p => { const s = stat[p.status]; return `<a class="row" href="#/place/${p.id}"><div class="th" style="${photoStyle(p)}">${noPhoto(p)}</div><div class="bd"><span class="nm">${esc(p.name)}</span><div class="sub" style="margin:0">${esc(CAT[p.category]?.label || p.category)}${p.area ? ' · ' + esc(p.area) : ''}</div><span class="pill" style="background:${s[1]};color:${s[2]};width:max-content">${s[0]}</span></div></a>`; }).join('') : '<div class="empty">Tu n’as encore rien enregistré.</div>';
  if (prof.role === 'admin') loadPending();
}
async function loadPending() {
  const box = document.getElementById('pend');
  const { data, error } = await sb.from('places').select('*').eq('status', 'pending').order('created_at').limit(50);
  if (error) { box.innerHTML = errBox(error); return; }
  if (!data.length) { box.innerHTML = '<div class="empty">Rien à valider.</div>'; return; }
  box.innerHTML = data.map(p => `<div class="row" style="flex-direction:column"><div style="display:flex;gap:12px"><div class="th" style="${photoStyle(p)}">${noPhoto(p)}</div><div class="bd"><span class="nm" style="white-space:normal">${esc(p.name)}</span><div class="sub" style="margin:0">${esc(CAT[p.category]?.label || p.category)}${p.area ? ' · ' + esc(p.area) : ''}</div><div class="sub" style="margin:0">${esc(p.address || '')} ${p.phone ? '· ' + esc(p.phone) : ''}</div></div></div>
    <div style="display:flex;gap:8px;margin-top:10px"><button class="btn ok" data-a="published" data-id="${p.id}" style="padding:10px">Publier</button><button class="btn no" data-a="rejected" data-id="${p.id}" style="padding:10px">Refuser</button></div></div>`).join('');
  box.querySelectorAll('button[data-id]').forEach(b => b.onclick = async () => {
    b.disabled = true; const pub = b.dataset.a === 'published';
    const { error } = await sb.from('places').update({ status: b.dataset.a, verified: pub }).eq('id', b.dataset.id);
    if (error) { toast('Erreur : ' + error.message); b.disabled = false; } else { toast(pub ? 'Publié' : 'Refusé'); loadPending(); }
  });
}
function agentLogin() {
  shell(`<div class="hero safe-top"><h1>Espace agent</h1><div style="font-size:13px;opacity:.8;margin-top:6px">Connexion réservée aux agents et administrateurs Bangui Guide.</div></div>
    <form class="pad" style="padding-top:26px" id="lf"><div id="le"></div>
    <div class="field"><label>Email</label><input id="em" type="email" autocomplete="username" required></div>
    <div class="field"><label>Mot de passe</label><input id="pw" type="password" autocomplete="current-password" required></div>
    <button class="btn" id="lb">Se connecter</button></form>`, 'agent');
  document.getElementById('lf').onsubmit = async e => {
    e.preventDefault(); const b = document.getElementById('lb'); b.disabled = true; b.textContent = 'Connexion…';
    const { error } = await sb.auth.signInWithPassword({ email: document.getElementById('em').value.trim(), password: document.getElementById('pw').value });
    if (error) { document.getElementById('le').innerHTML = `<div class="msg err">${esc(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message)}</div>`; b.disabled = false; b.textContent = 'Se connecter'; }
    else agent();
  };
}

/* ---------- ENREGISTRER UN LIEU ---------- */
const dataUrlToBlob = async u => (await fetch(u)).blob();
function compress(src, max = 1280, q = .72) {
  return new Promise((res, rej) => {
    const img = new Image(); img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q));
    }; img.onerror = () => rej(new Error('Image illisible')); img.src = src;
  });
}
const blobToDataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function pickPhoto() {
  if (Capacitor.isNativePlatform()) {
    const ph = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Uri, source: CameraSource.Prompt, promptLabelHeader: 'Photo du lieu', promptLabelPhoto: 'Galerie', promptLabelPicture: 'Prendre une photo' });
    return compress(ph.webPath);
  }
  return new Promise((res, rej) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async () => { try { res(i.files[0] ? await compress(await blobToDataUrl(i.files[0])) : null); } catch (e) { rej(e); } }; i.click(); });
}
async function getGps() {
  const p = Capacitor.isNativePlatform() ? await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000 })
    : await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 20000 }));
  return { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
}
async function sendPlace(item, uid) {
  let photo_url = null;
  if (item.photo) {
    const path = `${uid}/${crypto.randomUUID()}.jpg`;
    const up = await sb.storage.from('place-photos').upload(path, await dataUrlToBlob(item.photo), { contentType: 'image/jpeg' });
    if (up.error) throw up.error;
    photo_url = sb.storage.from('place-photos').getPublicUrl(path).data.publicUrl;
  }
  const { error } = await sb.from('places').insert({ name: item.name, category: item.category, area: item.area, address: item.address, phone: item.phone, hours: item.hours, description: item.description, lat: item.lat, lng: item.lng, photo_url, status: 'pending', created_by: uid });
  if (error) throw error;
}
const isNetErr = e => !navigator.onLine || /fetch|network|failed to|timeout/i.test(e?.message || '');
async function syncQueue() {
  const q = queue.get(); if (!q.length || !navigator.onLine) return;
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
async function newPlace() {
  if (!configured) { plain(topbar('Enregistrer un lieu') + notConfigured()); bindBack(); return; }
  let prof; try { prof = await getProfile(); } catch { prof = null; }
  if (!prof || prof.none) { location.hash = '#/agent'; return; }
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

/* ---------- ROUTEUR ---------- */
function route() {
  const [path, qs] = (location.hash.slice(1) || '/').split('?'), params = new URLSearchParams(qs || '');
  let m;
  if (path === '/' || path === '') home();
  else if (path === '/search') search(params);
  else if ((m = path.match(/^\/place\/([\w-]+)$/))) place(m[1]);
  else if (path === '/favs') favsPage();
  else if (path === '/agent') agent();
  else if (path === '/agent/new') newPlace();
  else home();
}
addEventListener('hashchange', route);
addEventListener('online', () => { if (configured) syncQueue().catch(() => { }); });
CapApp.addListener('backButton', () => { const h = location.hash; (!h || h === '#/' || h === '#') ? CapApp.exitApp() : history.back(); }).catch?.(() => { });
route();
