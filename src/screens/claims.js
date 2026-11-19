import { esc, svg, I, sb, configured, getProfile, requireLogin, toast } from '../core.js';
import { CATS, CAT, QUARTIERS } from '../data.js';
import { plain, topbar, bindBack, errBox, notConfigured } from '../ui.js';

/* Inscrire une entreprise, ou revendiquer une fiche existante */
export async function claim(placeId) {
  if (!configured) { plain(topbar('Mon entreprise') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null); if (!prof) { requireLogin(location.hash); return; }
  let pl = null; if (placeId) pl = (await sb.from('places').select('id,name,category,area,phone,owner_id').eq('id', placeId).maybeSingle()).data;
  plain(topbar(pl ? 'Revendiquer cette fiche' : 'Inscrire mon entreprise') + `<form class="pad" id="cf" style="padding-top:8px">
    <div class="card2"><div class="sh">${pl ? esc(pl.name) : 'Votre entreprise'}</div>
    <div class="sub" style="margin:0 0 10px">${pl ? 'Prouvez que cette entreprise est la vôtre. L’équipe Bangui Guide vérifie puis vous donne accès à la gestion de la fiche.' : 'Remplissez ces informations. Après vérification par l’équipe, votre fiche est publiée et vous la gérez depuis l’app.'}</div>
    ${pl ? '' : `<div class="field"><label>Nom de l’entreprise</label><input id="c_n" required maxlength="120"></div>
    <div class="field"><label>Secteur</label><select id="c_c">${CATS.map(c => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></div>
    <div class="field"><label>Quartier</label><select id="c_a">${QUARTIERS.map(q => `<option>${esc(q)}</option>`).join('')}</select></div>`}
    <div class="field"><label>Téléphone / WhatsApp pour vous joindre</label><input id="c_t" type="tel" required value="${esc(pl?.phone || '')}"></div>
    <div class="field"><label>Votre rôle et comment vous prouver (facultatif)</label><textarea id="c_m" maxlength="600" placeholder="Ex. : gérant, je peux montrer le registre de commerce"></textarea></div>
    <div id="c_e"></div><button class="btn" id="c_b">Envoyer ma demande</button></div></form>`); bindBack();
  document.getElementById('cf').onsubmit = async e => {
    e.preventDefault(); const b = document.getElementById('c_b'); b.disabled = true;
    const row = { user_id: prof.uid, place_id: pl?.id || null, business_name: pl ? pl.name : document.getElementById('c_n').value.trim(), category: pl ? pl.category : document.getElementById('c_c').value, area: pl ? pl.area : document.getElementById('c_a').value, phone: document.getElementById('c_t').value.trim(), message: document.getElementById('c_m').value.trim() || null };
    const { error } = await sb.from('claims').insert(row);
    if (error) { document.getElementById('c_e').innerHTML = `<div class="msg err">${esc(error.message)}</div>`; b.disabled = false; return; }
    plain(topbar('Demande envoyée') + `<div class="pad" style="text-align:center;padding-top:40px"><div style="width:84px;height:84px;border-radius:50%;background:#E7F7EC;margin:0 auto 14px;display:flex;align-items:center;justify-content:center">${svg(I.check, 44, '#1E7A43', 3)}</div><h2 style="color:#142A52;margin:0 0 8px">Demande envoyée</h2><p class="sub">Nous vérifions votre demande. Vous retrouverez votre entreprise dans Profil › Mes établissements dès son approbation.</p><a class="btn" href="#/profil" style="margin-top:18px;display:inline-flex">Retour au profil</a></div>`); bindBack();
  };
}

/* Admin : valider ou refuser les demandes */
export async function adminClaims() {
  if (!configured) { plain(topbar('Demandes') + notConfigured()); bindBack(); return; }
  const prof = await getProfile().catch(() => null); if (!prof || prof.role !== 'admin') { location.hash = '#/profil'; return; }
  plain(topbar('Demandes d’entreprises') + '<div class="pad" id="cl" style="padding-top:8px"><div class="empty">Chargement…</div></div>'); bindBack();
  const { data, error } = await sb.from('claims').select('*').eq('status', 'pending').order('created_at'); const cl = document.getElementById('cl');
  if (error) { cl.innerHTML = errBox(error); return; }
  cl.innerHTML = data.length ? data.map(c => `<div class="card2"><b>${esc(c.business_name)}</b><div class="sub" style="margin:2px 0">${esc(CAT[c.category]?.label || c.category || '')}${c.area ? ' · ' + esc(c.area) : ''}${c.place_id ? ' · fiche existante' : ' · nouvelle fiche'}</div>
    <div class="sub" style="margin:2px 0">Tél : <a href="tel:${esc(c.phone || '')}">${esc(c.phone || '')}</a></div>${c.message ? `<div class="sub" style="margin:2px 0">${esc(c.message)}</div>` : ''}
    <div style="display:flex;gap:8px;margin-top:10px"><button class="btn" data-ok="${c.id}">Approuver</button><button class="btn ghost" data-no="${c.id}">Refuser</button></div></div>`).join('') : '<div class="empty">Aucune demande en attente.</div>';
  const go = async (id, ok) => { const { data: r, error: er } = await sb.rpc('decide_claim', { c: id, ok }); if (er) { toast('Erreur : ' + er.message); return; } toast(r); adminClaims(); };
  cl.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => go(b.dataset.ok, true)); cl.querySelectorAll('[data-no]').forEach(b => b.onclick = () => go(b.dataset.no, false));
}
