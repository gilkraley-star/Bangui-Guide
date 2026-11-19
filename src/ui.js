import { esc, svg, I, PIN, catPath, sb, configured, fmtD, isSponsored, getProfile } from './core.js';
import { CAT } from './data.js';
export const $app = document.getElementById('app');

/* nettoyage à la sortie d'un écran (timers, abonnements) */
const leaveFns = [];
export const onLeave = f => leaveFns.push(f);
export const runLeave = () => { while (leaveFns.length) { try { leaveFns.pop()(); } catch { } } };

export const skel = n => Array.from({ length: n }, () => '<div class="row2"><div class="th2 sk"></div><div class="bd"><div class="sk" style="height:14px;width:70%;border-radius:6px"></div><div class="sk" style="height:11px;width:45%;border-radius:6px"></div></div></div>').join('');
export const spBadge = (abs) => `<span class="spb ${abs ? 'abs' : ''}">${svg(I.crown, 11, '#fff', 2)} Sponsorisé</span>`;
export const stars = (v, s = 14) => { const full = Math.round((v || 0) * 2) / 2; return `<span class="stars">${[1, 2, 3, 4, 5].map(i => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${full >= i ? '#FFB020' : full >= i - .5 ? 'url(#hs)' : '#E3E5EC'}" stroke="none"><defs><linearGradient id="hs"><stop offset="50%" stop-color="#FFB020"/><stop offset="50%" stop-color="#E3E5EC"/></linearGradient></defs><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>`).join('')}</span>`; };

/* image du lieu ou illustration du secteur */
const FALLBACK = [['mairie', 'img/mairie.jpg', 'img/mairie-hero.jpg'], ['cath', 'img/cathedrale.jpg'], ['afrique', 'img/notre-dame-afrique.jpg'], ['mosqu', 'img/mosquee.jpg'],
  ['relais', 'img/restaurant.jpg', 'img/relais-hero.jpg'], ['résidence', 'img/hotel-thumb.jpg', 'img/hotel-hero.jpg'], ['shopping', 'img/shop-hero.jpg', 'img/shop-hero.jpg'],
  ['pharmacie centrale', 'img/pharmacie.jpg'], ['boulangerie', 'img/boulangerie.jpg'], ['total', 'img/station-total.jpg'], ['amiti', 'img/hopital-amitie.jpg'], ['bicica', 'img/bicica.jpg']];
const ITEMPH = [['poulet', 'plat-poulet'], ['bœuf', 'plat-boeuf'], ['boeuf', 'plat-boeuf'], ['poisson', 'plat-poisson'], ['standard', 'chambre-standard'], ['confort', 'chambre-confort'], ['suite', 'suite'], ['portable', 'prod-pc'], ['smartphone', 'prod-phone'], ['imprimante', 'prod-imprimante']];
const fb = p => FALLBACK.find(([k]) => (p.name || '').toLowerCase().includes(k));
export const photoOf = p => p.photo_url || fb(p)?.[1] || null;
export const heroOf = p => p.photo_url || fb(p)?.[2] || fb(p)?.[1] || null;
export const itemPhoto = it => it.photo_url || ((k) => k ? `img/${k[1]}.jpg` : null)(ITEMPH.find(([w]) => (it.name || '').toLowerCase().includes(w)));
export function photoBox(p, cls = '', icon = 28, hero = false) {
  const c = CAT[p.category] || { fg: '#8A90A3', bg: '#F1F2F6' };
  const ph = hero ? heroOf(p) : photoOf(p); if (ph) return `<div class="${cls}" style="background:center/cover url('${esc(ph)}')"></div>`;
  return `<div class="${cls} ph0" style="background:linear-gradient(135deg,${c.bg},#fff 140%)"><span class="ph-ring" style="border-color:${c.fg}22"></span>${svg(catPath(p.category), icon, c.fg, 1.6)}</div>`;
}

export function shell(content, tab) {
  const t = (id, href, icon, label) => `<a href="${href}" class="${tab === id ? 'on' : ''}" data-t="${id}"><span class="ni">${svg(icon, 22, 'currentColor', tab === id ? 2.2 : 1.9)}<b class="bdg" id="bdg-${id}" style="display:none"></b></span><span>${label}</span></a>`;
  $app.innerHTML = `<div class="scroll nov" id="scroll">${content}</div>
  <nav class="nav">${t('home', '#/', I.home, 'Accueil')}${t('search', '#/search', I.compass, 'Explorer')}${t('map', '#/map', I.pin, 'Carte')}${t('msg', '#/messages', I.msg, 'Messages')}${t('profil', '#/profil', I.user, 'Profil')}</nav>`;
  refreshBadge();
}
export async function refreshBadge() {
  if (!configured) return;
  try {
    const p = await getProfile(); const b = document.getElementById('bdg-msg'); if (!p || !b) return;
    const { count } = await sb.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', p.uid);
    if (count > 0) { b.textContent = count > 9 ? '9+' : count; b.style.display = 'flex'; }
  } catch { }
}
export const plain = content => { $app.innerHTML = `<div class="scroll" id="scroll">${content}</div>`; };
export const topbar = title => `<div class="top safe-top"><button class="back" id="back" aria-label="Retour">${svg(I.back, 20)}</button><h1 style="font-size:17px">${esc(title)}</h1></div>`;
export const bindBack = () => { const b = document.getElementById('back'); if (b) b.onclick = () => history.length > 1 ? history.back() : (location.hash = '#/'); };
export const notConfigured = () => `<div class="empty"><h2 style="font-size:17px;color:#142A52;margin-bottom:10px">Serveur non configuré</h2>Renseigne <b>SUPABASE_URL</b> et <b>SUPABASE_ANON_KEY</b> dans <code>src/config.js</code>.</div>`;
export const errBox = e => `<div class="msg err">Impossible de charger les données. Vérifie ta connexion internet.<br><small>${esc(e?.message || '')}</small></div>`;
export const brand = `<span class="wm">Bangui <i>Guide</i></span>`;

export function rowHtml(p) {
  const c = CAT[p.category], sp = isSponsored(p);
  return `<a class="row2 ${sp ? 'sp' : ''}" href="#/place/${p.id}" style="--cf:${c?.fg || '#8A90A3'}">${photoBox(p, 'th2', 26, true)}<div class="bd">
    <span class="nm">${esc(p.name)}</span>
    <div class="sub" style="margin:0"><span style="color:${c?.fg || '#8A90A3'};font-weight:600">${esc(c?.label || p.category)}</span>${p.area ? ' · ' + esc(p.area) : ''}</div>
    <div class="tags">${sp ? spBadge() : ''}${p.verified ? `<span class="pill" style="background:#EAF8EF;color:#1E7A43">${svg(I.check, 10, '#1E7A43', 3)} Vérifié</span>` : ''}${p._r != null ? `<span class="pill" style="background:#FFF6E0;color:#B5560C">★ ${Number(p._r).toFixed(1)}</span>` : ''}</div></div>
    <div class="rt">${p._d != null ? `<span class="dist">${svg(PIN, 12, '#2A4A8A', 2.2)} ${fmtD(p._d)}</span>` : ''}<span style="color:#9AA0B4">${svg(I.chev, 18)}</span></div></a>`;
}

/* illustration vectorielle de Bangui (hero) */
export const heroSvg = () => `<svg class="herosvg" viewBox="0 0 390 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs><linearGradient id="sk1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17389B"/><stop offset=".45" stop-color="#3D7BE0"/><stop offset=".8" stop-color="#9CC8F5"/><stop offset="1" stop-color="#FFE0B8"/></linearGradient>
<linearGradient id="rv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3C9CC9"/><stop offset="1" stop-color="#7FD0E3"/></linearGradient>
<linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1E4A" stop-opacity="0"/><stop offset="1" stop-color="#0B1E4A" stop-opacity=".78"/></linearGradient></defs>
<rect width="390" height="250" fill="url(#sk1)"/>
<circle cx="300" cy="150" r="70" fill="#FFF3D6" opacity=".35"/><circle cx="300" cy="150" r="34" fill="#FFF3D6" opacity=".5"/>
<g fill="#fff" opacity=".85"><ellipse cx="70" cy="70" rx="38" ry="9"/><ellipse cx="96" cy="62" rx="26" ry="8"/><ellipse cx="250" cy="100" rx="30" ry="7"/><ellipse cx="274" cy="94" rx="20" ry="6"/></g>
<g fill="#E8D4B8" opacity=".9"><rect x="20" y="148" width="22" height="46"/><rect x="46" y="140" width="18" height="54"/><rect x="68" y="152" width="26" height="42"/><rect x="108" y="156" width="20" height="38"/></g>
<g fill="#2F7D52"><ellipse cx="60" cy="196" rx="70" ry="16"/><ellipse cx="170" cy="200" rx="60" ry="12"/></g>
<path d="M230 196 Q300 170 390 180 L390 250 L230 250Z" fill="url(#rv)"/>
<path d="M240 206 Q300 196 390 204" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>
<g><path d="M156 196 L164 118 L226 118 L234 196Z" fill="#E7C7A0"/><path d="M164 118 L172 70 L218 70 L226 118Z" fill="#F4DDBA"/>
<path d="M176 70 L186 22 L204 22 L214 70Z" fill="#E7C7A0"/><path d="M190 22 L195 4 L200 22Z" fill="#C98A4B"/><path d="M195 2 l1.6 3.6 3.9.4-2.9 2.6.9 3.8-3.5-2-3.5 2 .9-3.8-2.9-2.6 3.9-.4z" fill="#FFD23F"/>
<g fill="#B77A3C" opacity=".6"><rect x="176" y="128" width="8" height="20"/><rect x="191" y="128" width="8" height="20"/><rect x="206" y="128" width="8" height="20"/></g></g>
<g stroke="#5A3A22" stroke-width="3" fill="none"><path d="M26 250 Q34 190 30 140"/><path d="M360 250 Q352 200 358 150"/></g>
<g stroke="#1F8A4C" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M30 140 q-26-6-34 10M30 140 q-20-18-36-12M30 140 q4-24-8-34M30 140 q18-18 34-10M30 140 q26 0 34 16M30 140 q10-22 30-22"/>
<path d="M358 150 q-26-6-34 10M358 150 q-20-18-36-12M358 150 q4-24-8-34M358 150 q18-18 34-10M358 150 q26 0 34 16"/></g>
<g transform="translate(300 8) rotate(14)"><path d="M0 0 Q30 -10 60 0 T120 0 L120 12 Q90 22 60 12 T0 12Z" fill="#1F4FBF"/><path d="M0 12 Q30 2 60 12 T120 12 L120 24 Q90 34 60 24 T0 24Z" fill="#fff"/>
<path d="M0 24 Q30 14 60 24 T120 24 L120 36 Q90 46 60 36 T0 36Z" fill="#2E9E5B"/><path d="M0 36 Q30 26 60 36 T120 36 L120 48 Q90 58 60 48 T0 48Z" fill="#FFD23F"/><path d="M52 0 Q60 -4 68 2 L68 52 Q60 56 52 50Z" fill="#D8262F" opacity=".95"/></g>
<rect y="130" width="390" height="120" fill="url(#sh)"/></svg>`;
