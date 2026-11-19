import { esc, svg, I, CI, sb, configured, withDist, getPos, locate, attachStats, sortSp, isSponsored, toast } from '../core.js';
import { CATS, CAT } from '../data.js';
import { shell, brand, rowHtml, skel, errBox, notConfigured, photoBox, spBadge, stars, onLeave } from '../ui.js';

const GRID = ['restaurant', 'hotel', 'pharmacie', 'banque', 'hopital', 'culte', 'commerce', 'admin', 'station'];
const ZONES = ['Tous', 'Centre-ville', 'Km5', 'Koudoukou'];

const CIRC = new Set(['restaurant', 'pharmacie']);
const ICC = { restaurant: '#F26A1B', hotel: '#1B2F6B', pharmacie: '#1FA34A', banque: '#2A3A8A', hopital: '#E5322D', culte: '#5B2D8A', commerce: '#F28A1E', admin: '#1B2F6B', station: '#1B2F6B' };
export async function home() {
  const me0 = getPos();
  const cells = GRID.map(id => { const c = CAT[id]; return `<a class="gi" href="#/search?cat=${id}" style="background:#fff"><i style="${CIRC.has(id) ? `background:${ICC[id]}` : 'background:none;box-shadow:none'}">${svg(CI[id], CIRC.has(id) ? 18 : 30, CIRC.has(id) ? '#fff' : (ICC[id] || c.fg), 2)}</i>${esc(c.label.replace('Stations-service', 'Stations service'))}</a>`; }).join('')
    + `<a class="gi" href="#/categories" style="background:#fff"><i style="background:none;box-shadow:none">${svg('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>', 26, '#142A52', 3)}</i>Autres</a>`;
  shell(`<div class="homec"><div class="hero2"><img class="herophoto" src="hero.jpg" alt=""><span class="heroshade"></span><div class="in safe-top"><div class="hrow"><div class="logo" style="padding:3px"><img src="logo.png" alt="" style="height:44px"></div>
    <div style="flex:1;min-width:0">${brand}<div class="tag">Découvrez, trouvez, visitez Bangui</div></div>
    <a class="icb" href="#/messages" aria-label="Messages">${svg(I.bell, 19, '#fff')}<b class="bdg" id="bdg-msg" style="display:none"></b></a><a class="icb" href="#/profil" aria-label="Profil">${svg(I.user, 19, '#fff')}</a></div>
    <div class="greet">Bonjour,<b>Trouvez un lieu à Bangui</b><i></i></div></div></div>
    <form class="sbar2" id="sf">${svg(I.search, 20, '#142A52')}<input id="q" type="search" placeholder="Restaurant, hôtel, pharmacie…" enterkeyhint="search"><button type="button" class="lb" id="loc" aria-label="Autour de moi">${svg(I.locate, 20, me0 ? '#1E6BE0' : '#142A52')}</button></form>
    <div class="grid">${cells}</div>
    <div class="zones" id="zones"></div>
    <div id="feat"></div>
    <div class="sec"><div style="display:flex;justify-content:space-between;align-items:center"><h2 class="sh" style="margin:0">À découvrir à Bangui</h2><a href="#/search" class="more">Voir tout</a></div></div>
    <div class="list" id="recent">${skel(4)}</div><div id="nearbox"></div></div>`, 'home');
  document.getElementById('loc').onclick = async () => { if (await locate()) home(); };
  document.getElementById('sf').onsubmit = e => { e.preventDefault(); location.hash = '#/search?q=' + encodeURIComponent(document.getElementById('q').value.trim()); };
  const recent = document.getElementById('recent');
  if (!configured) { recent.innerHTML = notConfigured(); return; }
  const { data, error } = await sb.from('places').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(60);
  if (error) { recent.innerHTML = errBox(error); return; }
  const all = withDist(await attachStats(data));
  let zone = 'Tous';
  const draw = () => {
    document.getElementById('zones').innerHTML = ZONES.map(z => `<button class="zc ${z === zone ? 'on' : ''}" data-z="${z}">${z === 'Tous' ? svg('<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>', 15, 'currentColor', 2) : svg(I.pin, 15, '#E2541F', 2)} ${z}</button>`).join('')
      + `<a class="zc" href="#/search" aria-label="Filtres">${svg(I.sliders, 16)}</a>`;
    document.querySelectorAll('.zc[data-z]').forEach(b => b.onclick = () => { zone = b.dataset.z; draw(); });
    const list = zone === 'Tous' ? all : all.filter(p => (p.area || '').toLowerCase().includes(zone.toLowerCase()));
    recent.innerHTML = list.length ? (list.filter(p => !isSponsored(p)).concat(list.filter(isSponsored)).slice(0, 5)).map(rowHtml).join('') : `<div class="empty">Aucun lieu dans cette zone pour l’instant.</div>`;
    const inv = document.getElementById('inv'); if (inv) inv.onclick = async () => { try { await navigator.share({ title: 'Bangui Guide', text: 'Trouve restaurants, hôtels, pharmacies et services à Bangui avec Bangui Guide !' }); } catch { } };
  };
  draw();
  const feat = all.filter(isSponsored);
  if (feat.length) {
    document.getElementById('feat').innerHTML = `<div class="bnr" id="bnr">${feat.map(p => `<a class="banner" href="#/place/${p.id}"><div class="bl">${photoBox(p, '', 46, true)}${spBadge(true)}</div>
      <div class="br"><div class="nm" style="font-size:17px;line-height:1.15">${esc(p.name)}</div><div style="font-size:12.5px;opacity:.9">${esc(CAT[p.category]?.label || '')}${p.area ? ' · ' + esc(p.area) : ''}</div>
      ${p._r != null ? `<div style="display:flex;gap:6px;align-items:center;font-size:12px">${stars(p._r, 13)} (${p._n} avis)</div>` : ''}<span class="bb">Découvrir ${svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 15, '#3A1646', 2.5)}</span></div></a>`).join('')}</div>
      <div class="dots" id="dots">${feat.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>`;
    const b = document.getElementById('bnr'), dots = [...document.querySelectorAll('#dots i')];
    b.addEventListener('scroll', () => { const i = Math.round(b.scrollLeft / b.clientWidth); dots.forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
    if (feat.length > 1) { const t = setInterval(() => { const n = (Math.round(b.scrollLeft / b.clientWidth) + 1) % feat.length; b.scrollTo({ left: n * b.clientWidth, behavior: 'smooth' }); }, 4500); onLeave(() => clearInterval(t)); }
  }
  const nb = document.getElementById('nearbox'), me = getPos();
  const near = all.filter(p => p._d != null).sort((a, b) => a._d - b._d).slice(0, 3);
  if (me && near.length) nb.innerHTML = `<div class="sec"><h2 class="sh">Près de vous</h2></div><div class="list" style="padding-bottom:6px">${near.map(rowHtml).join('')}</div>`;
}
const invite = () => `<div class="invite" style="margin:6px 0 10px"><span style="flex:none">${svg(I.share, 26, '#fff', 1.7)}</span><div style="flex:1;font-size:13px;line-height:1.35"><b>Bangui Guide, c’est mieux à plusieurs</b><div style="opacity:.8;font-size:12px;margin-top:2px">Fais découvrir l’app à tes proches.</div></div><button class="btn" id="inv">Inviter</button></div>`;
