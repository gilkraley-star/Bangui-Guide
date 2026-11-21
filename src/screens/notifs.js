import { esc, svg, I, sb, configured, getProfile, fmtTime, swr } from '../core.js';
import { plain, topbar, bindBack, errBox, notConfigured, refreshBadge } from '../ui.js';

const ICON = t => /valid|publi|prêt|enregistr/i.test(t) ? ['#1E7A43', '#E7F7EC', I.check || '<path d="m5 12 5 5 9-10"/>'] : /refus/i.test(t) ? ['#C23B3B', '#FFE9E7', '<path d="M6 6l12 12M18 6 6 18"/>'] : /avis/i.test(t) ? ['#F5841F', '#FFF1E6', '<path d="m12 2 3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z"/>'] : ['#1E5BD8', '#EAF1FF', I.bell || '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/>'];
export async function notifs() {
  plain(topbar('Notifications') + '<div class="pad" id="nl"></div>'); bindBack();
  const nl = document.getElementById('nl');
  if (!configured) { nl.innerHTML = notConfigured(); return; }
  const prof = await getProfile().catch(() => null);
  if (!prof) { nl.innerHTML = '<div class="empty">Connectez-vous pour voir vos notifications.<br><a class="btn" href="#/profil" style="margin-top:14px">Se connecter</a></div>'; return; }
  const draw = (d) => {
    if (!d) { nl.innerHTML = errBox(); return; }
    nl.innerHTML = d.length ? `<button class="btn ghost" id="nr" style="margin-bottom:10px;padding:9px">Tout marquer comme lu</button>` + d.map(n => { const c = ICON(n.title); return `<a class="card2 nf ${n.read ? '' : 'un'}" data-id="${n.id}" href="${esc(n.link || '#/notifs')}" style="display:flex;gap:12px;align-items:flex-start;text-decoration:none;color:inherit"><span class="mth ic" style="background:${c[1]};flex:none">${svg(c[2], 20, c[0], 2.2)}</span><div style="min-width:0;flex:1"><div style="display:flex;justify-content:space-between;gap:8px"><b style="color:#142A52">${esc(n.title)}</b><small style="color:#8A90A3;white-space:nowrap">${fmtTime(n.created_at)}</small></div>${n.body ? `<div class="sub" style="margin:2px 0 0">${esc(n.body)}</div>` : ''}</div>${n.read ? '' : '<i class="nfd"></i>'}</a>`; }).join('')
      : '<div class="empty">Aucune notification pour le moment.<br>Vous serez prévenu ici : fiche validée ou refusée, nouvelle demande, nouvel avis…</div>';
    nl.querySelectorAll('.nf').forEach(a => a.addEventListener('click', () => { if (a.classList.contains('un')) sb.from('notifications').update({ read: true }).eq('id', a.dataset.id).then(() => refreshBadge()); }));
    const nr = document.getElementById('nr'); if (nr) nr.onclick = async () => { await sb.from('notifications').update({ read: true }).eq('read', false); notifs(); };
  };
  nl.innerHTML = '<div class="empty">Chargement…</div>';
  await swr('notifs_' + prof.uid, async () => { const { data, error } = await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(60); if (error) throw error; return data; }, d => draw(d));
}
