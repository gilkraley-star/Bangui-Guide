import { esc, svg, I, CI, sb, configured, withDist, getPos, locate, attachStats, sortSp, favs, isSponsored, fmtD, openNow } from '../core.js';
import { CATS, CAT } from '../data.js';
import { shell, rowHtml, skel, errBox, notConfigured, brand, photoOf, heroOf } from '../ui.js';

const EXR = ['ex-relais', 'ex-terrasse', 'ex-maman', 'ex-maquis'];
const hsh = t => [...String(t)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export const cardPhoto = p => photoOf(p) ? heroOf(p) && p.photo_url ? p.photo_url : photoOf(p) : p.category === 'restaurant' ? `img/${EXR[hsh(p.id) % 4]}.jpg` : heroOf(p);
export function cardHtml(p) {
  const c = CAT[p.category] || { label: '' }, op = p.on_duty ? true : openNow(p.hours), sp = isSponsored(p), ph = cardPhoto(p), fv = favs.get().includes(p.id);
  return `<a class="xc ${sp ? 'sp' : ''}" href="#/place/${p.id}"><div class="xp" style="background:${ph ? `center/cover url('${esc(ph)}')` : c.bg || '#EEF1F8'}"><span class="xh ${fv ? 'on' : ''}" data-f="${p.id}">${svg(I.heart, 19, fv ? '#E2541F' : '#142A52', 2).replace('fill="none"', fv ? 'fill="#E2541F"' : 'fill="none"')}</span>${ph ? '' : svg(CI[p.category] || I.pin, 40, c.fg || '#8A90A3', 1.6)}</div>
    <div class="xn"><b>${esc(p.name)}</b>${op != null ? `<i class="dot ${op ? 'on' : 'off'}"></i>` : ''}</div>
    <div class="xs">${esc(c.label)}${p.area ? ' <u>·</u> ' + esc(p.area) : ''}</div>
    <div class="xr">${p._r != null ? `${svg(I.star || '<path d="m12 2 3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z"/>', 18, '#FFB020', 0).replace('fill="none"', 'fill="#FFB020"')}<b>${Number(p._r).toFixed(1).replace('.', ',')}</b><span>(${p._n || 0} avis)</span>` : '<span>Nouveau</span>'}${p._d != null ? `<em>${fmtD(p._d)}</em>` : ''}</div>
    <div class="xt">${sp ? `<span class="xsp">${svg(I.crown, 13, '#fff', 2)} Sponsorisé</span>` : ''}${op != null ? `<span class="xo ${op ? 'on' : 'off'}">${svg('<path d="m5 12 5 5 9-10"/>', 14, 'currentColor', 3)} ${op ? 'Ouvert' : 'Fermé'}</span>` : ''}</div></a>`;
}
export const bindCards = root => root.querySelectorAll('[data-f]').forEach(h => h.onclick = e => { e.preventDefault(); e.stopPropagation(); const a = favs.get(), id = h.dataset.f, i = a.indexOf(id); i >= 0 ? a.splice(i, 1) : a.push(id); favs.set(a); h.classList.toggle('on', i < 0); const sv = h.querySelector('svg'); sv.setAttribute('fill', i < 0 ? '#E2541F' : 'none'); sv.setAttribute('stroke', i < 0 ? '#E2541F' : '#142A52'); });

export async function search(params) {
  let cat = params.get('cat') || '', q = params.get('q') || '', sort = 'rel', openOnly = false;
  shell(`<div class="xhd safe-top"><i style="background-image:linear-gradient(90deg,#14307F 0,rgba(20,48,127,0) 55%),url('img/hd-monument.jpg')"></i><div><h1>Explorer</h1><p>Tous les lieux de Bangui</p></div></div>
    <div class="xsb"><span>${svg(I.search, 22, '#142A52', 2)}</span><input id="q" type="search" placeholder="Nom, quartier, adresse…" value="${esc(q)}"><button id="flt" aria-label="Filtres">${svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>', 22, '#142A52', 2)}</button></div>
    <div class="fchips xch"><button class="fc" id="nearbtn">${svg(I.pin, 15, 'currentColor', 2.2)} Plus proches</button><button class="fc ${cat ? '' : 'on'}" data-c="">Tous</button>${CATS.map(c => `<button class="fc ${cat === c.id ? 'on' : ''}" data-c="${c.id}">${esc(c.label)}</button>`).join('')}</div>
    <div class="xbar"><div class="cnt" id="cnt"></div><label class="xsort">${svg('<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>', 16, '#142A52', 2)}<select id="srt"><option value="rel">Pertinence</option><option value="dist">Distance</option><option value="note">Mieux notés</option><option value="open">Ouverts</option></select></label></div>
    <div class="xg" id="res"></div>`, 'search');
  const res = document.getElementById('res'), qi = document.getElementById('q'); let t, seq = 0;
  const run = async () => {
    if (!configured) { res.innerHTML = notConfigured(); return; }
    const my = ++seq; res.innerHTML = Array.from({ length: 4 }, () => '<div class="xc"><div class="xp sk"></div><div class="xn sk" style="height:16px;margin:10px 12px"></div></div>').join('');
    let query = sb.from('places').select('*').eq('status', 'published').order('verified', { ascending: false }).order('name').limit(80);
    if (cat) query = query.eq('category', cat);
    const term = qi.value.trim().replace(/[%,()]/g, ' ');
    if (term) query = query.or(`name.ilike.%${term}%,area.ilike.%${term}%,address.ilike.%${term}%`);
    const { data, error } = await query; if (my !== seq) return;
    if (error) { res.innerHTML = errBox(error); return; }
    let a = withDist(await attachStats(data)); if (my !== seq) return;
    if (sort === 'open') a = a.filter(p => p.on_duty || openNow(p.hours) !== false);
    a = sort === 'dist' ? a.sort((x, y) => (x._d ?? 1e9) - (y._d ?? 1e9)) : sort === 'note' ? a.sort((x, y) => (y._r ?? -1) - (x._r ?? -1)) : sortSp(a);
    res.innerHTML = a.length ? a.map(cardHtml).join('') : '<div class="empty" style="grid-column:1/3">Aucun résultat.</div>';
    bindCards(res);
    const lb = cat ? (CAT[cat]?.label || 'lieux').toLowerCase() : 'lieux';
    document.getElementById('cnt').textContent = `${a.length} ${a.length > 1 || !cat ? lb : lb.replace(/s$/, '')} à Bangui`;
  };
  qi.oninput = () => { clearTimeout(t); t = setTimeout(run, 300); };
  document.getElementById('srt').onchange = e => { sort = e.target.value; run(); };
  document.getElementById('flt').onclick = () => { openOnly = !openOnly; const s = document.getElementById('srt'); s.value = openOnly ? 'open' : 'rel'; sort = s.value; run(); };
  document.getElementById('nearbtn').onclick = async e => { const b = e.currentTarget; if (sort !== 'dist' && !getPos() && !(await locate())) return; const on = sort !== 'dist'; sort = on ? 'dist' : 'rel'; document.getElementById('srt').value = sort; b.classList.toggle('on', on); run(); };
  document.querySelectorAll('.fc[data-c]').forEach(b => b.onclick = () => { cat = b.dataset.c; document.querySelectorAll('.fc[data-c]').forEach(x => x.classList.toggle('on', x === b)); run(); });
  const on = document.querySelector('.xch .fc.on'); if (on) setTimeout(() => on.scrollIntoView({ inline: 'center', block: 'nearest' }), 50);
  run();
}

export function categories() {
  shell(`<div class="hero safe-top" style="padding-bottom:22px"><h1 style="font-size:22px">Toutes les catégories</h1></div>
    <div class="catg">${CATS.map(c => `<a class="gi" href="#/search?cat=${c.id}" style="background:${c.bg}"><i style="background:linear-gradient(150deg,${c.fg},${c.fg}CC)">${svg(CI[c.id], 22, '#fff', 2)}</i>${esc(c.label)}</a>`).join('')}</div>`, 'search');
}

export async function favsPage() {
  shell(`<div class="hero safe-top" style="padding-bottom:30px"><h1 style="font-size:22px">Mes favoris</h1></div><div class="list hz hz2" id="fl"></div>`, 'profil');
  const ids = favs.get(), fl = document.getElementById('fl');
  if (!ids.length) { fl.innerHTML = '<div class="empty">Aucun favori. Touche le cœur sur la fiche d’un lieu pour le retrouver ici.</div>'; return; }
  if (!configured) { fl.innerHTML = notConfigured(); return; }
  const { data, error } = await sb.from('places').select('*').in('id', ids).eq('status', 'published');
  fl.innerHTML = error ? errBox(error) : (data.length ? withDist(await attachStats(data)).map(rowHtml).join('') : '<div class="empty">Ces lieux ne sont plus disponibles.</div>');
}
