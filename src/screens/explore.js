import { esc, svg, I, CI, sb, configured, withDist, getPos, locate, attachStats, sortSp, favs } from '../core.js';
import { CATS, CAT } from '../data.js';
import { shell, rowHtml, skel, errBox, notConfigured, brand } from '../ui.js';

export async function search(params) {
  let cat = params.get('cat') || '', q = params.get('q') || '', nearOn = false;
  shell(`<div class="hero safe-top" style="padding-bottom:34px"><h1 style="font-size:22px">Explorer</h1><div style="font-size:12.5px;opacity:.8;margin-top:4px">Tous les lieux de Bangui</div></div>
    <div class="sbar"><span>${svg(I.search, 18, '#8A90A3')}</span><input id="q" type="search" placeholder="Nom, quartier, adresse…" value="${esc(q)}"></div>
    <div class="fchips"><button class="fc" id="nearbtn">${svg(I.pin, 13, 'currentColor', 2.2)} Plus proches</button><button class="fc ${cat ? '' : 'on'}" data-c="">Tous</button>${CATS.map(c => `<button class="fc ${cat === c.id ? 'on' : ''}" data-c="${c.id}">${esc(c.label)}</button>`).join('')}</div>
    <div class="list hz" id="res"></div>`, 'search');
  const res = document.getElementById('res'), qi = document.getElementById('q'); let t, seq = 0;
  const run = async () => {
    if (!configured) { res.innerHTML = notConfigured(); return; }
    const my = ++seq; res.innerHTML = skel(4);
    let query = sb.from('places').select('*').eq('status', 'published').order('verified', { ascending: false }).order('name').limit(60);
    if (cat) query = query.eq('category', cat);
    const term = qi.value.trim().replace(/[%,()]/g, ' ');
    if (term) query = query.or(`name.ilike.%${term}%,area.ilike.%${term}%,address.ilike.%${term}%`);
    const { data, error } = await query; if (my !== seq) return;
    if (error) { res.innerHTML = errBox(error); return; }
    let a = withDist(await attachStats(data)); if (my !== seq) return;
    a = nearOn ? a.sort((x, y) => (x._d ?? 1e9) - (y._d ?? 1e9)) : sortSp(a);
    res.innerHTML = a.length ? a.map(rowHtml).join('') : '<div class="empty">Aucun résultat.</div>';
  };
  qi.oninput = () => { clearTimeout(t); t = setTimeout(run, 300); };
  document.getElementById('nearbtn').onclick = async e => { const b = e.currentTarget; if (!nearOn && !getPos() && !(await locate())) return; nearOn = !nearOn; b.classList.toggle('on', nearOn); run(); };
  document.querySelectorAll('.fc[data-c]').forEach(b => b.onclick = () => { cat = b.dataset.c; document.querySelectorAll('.fc[data-c]').forEach(x => x.classList.toggle('on', x === b)); run(); });
  run();
}

export function categories() {
  shell(`<div class="hero safe-top" style="padding-bottom:22px"><h1 style="font-size:22px">Toutes les catégories</h1></div>
    <div class="catg">${CATS.map(c => `<a class="gi" href="#/search?cat=${c.id}" style="background:linear-gradient(160deg,${c.fg},${c.fg}CC)"><i style="background:#fff">${svg(CI[c.id], 22, c.fg, 2.2)}</i>${esc(c.label)}</a>`).join('')}</div>`, 'search');
}

export async function favsPage() {
  shell(`<div class="hero safe-top" style="padding-bottom:30px"><h1 style="font-size:22px">Mes favoris</h1></div><div class="list hz" id="fl"></div>`, 'profil');
  const ids = favs.get(), fl = document.getElementById('fl');
  if (!ids.length) { fl.innerHTML = '<div class="empty">Aucun favori. Touche le cœur sur la fiche d’un lieu pour le retrouver ici.</div>'; return; }
  if (!configured) { fl.innerHTML = notConfigured(); return; }
  const { data, error } = await sb.from('places').select('*').in('id', ids).eq('status', 'published');
  fl.innerHTML = error ? errBox(error) : (data.length ? withDist(await attachStats(data)).map(rowHtml).join('') : '<div class="empty">Ces lieux ne sont plus disponibles.</div>');
}
