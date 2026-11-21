import { esc, svg, I, sb, toast, fmtPrice } from './core.js';

/* ---------- tarifs ---------- */
export const TARIFS_DEF = { inscription: 25000, mensuel: 10000, annuel: 70000, sponsoring: 10000 };
export async function loadTarifs() {
  const t = { ...TARIFS_DEF };
  try { const { data } = await sb.from('tarifs').select('code,amount'); (data || []).forEach(r => { t[r.code] = r.amount; }); } catch { }
  return t;
}
export const KIND = { inscription: 'Inscription', mensuel: 'Abonnement mensuel', annuel: 'Abonnement annuel', sponsoring: 'Sponsoring' };
export const METH = { especes: 'Espèces', mobile_money: 'Mobile Money', virement: 'Virement bancaire', autre: 'Autre' };
const ST = { due: ['À payer', '#FFF1E6', '#E2541F'], paid: ['Payée', '#E7F7EC', '#1E7A43'], cancelled: ['Annulée', '#EEF1F8', '#5C6684'] };
export const money = n => fmtPrice(n);
export const fdate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
export const dueTotal = list => (list || []).filter(i => i.status === 'due').reduce((a, i) => a + i.amount, 0);
export const stChip = s => { const t = ST[s] || ST.due; return `<span class="pill" style="background:${t[1]};color:${t[2]};font-weight:800">${t[0]}</span>`; };

/* ligne de facture dans une liste */
export const invoiceRow = (iv, extra = '') => `<button type="button" class="card2 ivr" data-iv="${iv.id}" style="text-align:left;width:100%;border:0;display:flex;gap:12px;align-items:center">
  <span class="mth ic" style="background:${iv.status === 'paid' ? '#E7F7EC' : iv.status === 'due' ? '#FFF1E6' : '#EEF1F8'};flex:none">${svg('<path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 13h7M9 17h7"/>', 20, iv.status === 'paid' ? '#1E7A43' : iv.status === 'due' ? '#E2541F' : '#5C6684', 2)}</span>
  <div class="mgin"><b>${esc(iv.label)}</b><small>${esc(iv.number)} · ${fdate(iv.issued_on)}${extra}</small></div>
  <div style="text-align:right"><b style="color:#142A52;display:block;white-space:nowrap">${money(iv.amount)}</b>${stChip(iv.status)}</div></button>`;

/* abonnement / sponsoring en cours */
export function planBox(p) {
  const today = new Date().toISOString().slice(0, 10), act = p.plan_until && p.plan_until >= today, sp = p.sponsored && (!p.sponsored_until || p.sponsored_until.slice(0, 10) >= today);
  const soon = act && (new Date(p.plan_until) - new Date(today)) / 864e5 <= 7;
  return `<div class="mgst" style="margin-bottom:10px"><div style="border-left:4px solid ${act ? (soon ? '#E2541F' : '#1FA64D') : '#C23B3B'}"><b style="font-size:15px">${act ? 'Actif' : p.plan_until ? 'Expiré' : 'Aucun'}</b><span>Abonnement${act ? ' jusqu’au ' + fdate(p.plan_until) : ''}</span></div>
    <div style="border-left:4px solid ${sp ? '#F5841F' : '#8A90A3'}"><b style="font-size:15px">${sp ? 'En cours' : 'Non'}</b><span>Sponsoring${sp && p.sponsored_until ? ' jusqu’au ' + fdate(p.sponsored_until) : ''}</span></div></div>`;
}

/* grille des tarifs */
export const tarifsBox = t => `<div class="card2"><div class="sh">Nos tarifs</div>${[['Inscription (une fois)', t.inscription], ['Abonnement mensuel', t.mensuel], ['Abonnement annuel', t.annuel], ['Sponsoring, par semaine', t.sponsoring]].map(([l, v]) => `<div class="mgrow" style="padding:7px 0;border-bottom:1px solid #EDF0F8"><span>${l}</span><b style="color:#142A52">${money(v)}</b></div>`).join('')}</div>`;

/* Fenêtre de facturation d'un lieu.
   perms : { collect, create, sponsor, cancel }  (le client n'a aucun droit : il consulte seulement) */
export async function billingSheet(place, perms, onChange, openId) {
  const old = document.getElementById('mgsh'); if (old) old.remove();
  const el = document.createElement('div'); el.id = 'mgsh'; el.className = 'mgsh';
  el.innerHTML = '<div class="mgsc"></div><div class="mgsp" id="bs_p" style="max-height:88vh;overflow-y:auto"></div>';
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
  const close = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 250); onChange && onChange(); };
  el.querySelector('.mgsc').onclick = close;
  const P = () => el.querySelector('#bs_p'), t = await loadTarifs();
  let invs = [], view = 'list', cur = null;
  const load = async () => { const { data, error } = await sb.from('invoices').select('*').eq('place_id', place.id).order('created_at', { ascending: false }); if (error) toast('Erreur : ' + error.message); invs = data || []; };
  const head = (title, back) => `<div class="mgsx">${back ? `<button class="back" id="bs_b" aria-label="Retour">${svg(I.back, 18)}</button>` : ''}<b style="flex:1;margin-left:${back ? 8 : 0}px">${esc(title)}</b><button class="back" id="bs_x" aria-label="Fermer">${svg('<path d="M6 6l12 12M18 6 6 18"/>', 18, '#142A52', 2.2)}</button></div>`;
  const wire = () => { const x = P().querySelector('#bs_x'); if (x) x.onclick = close; const b = P().querySelector('#bs_b'); if (b) b.onclick = () => { view = 'list'; draw(); }; };

  function drawList() {
    const due = dueTotal(invs);
    P().innerHTML = `${head('Factures · ' + place.name)}
      <div class="card2" style="background:${due ? '#FFF4EC' : '#EAF8EF'};margin-bottom:10px"><div class="sub" style="margin:0">Reste à payer</div><b style="font-size:26px;color:${due ? '#E2541F' : '#1E7A43'}">${money(due)}</b></div>
      ${planBox(place)}
      ${invs.length ? invs.map(i => invoiceRow(i)).join('') : '<div class="mgem"><p>Aucune facture pour le moment.</p></div>'}
      ${perms.create ? `<button class="btn" id="bs_new" style="margin-top:10px">${svg(I.plus, 18, '#fff', 2.4)} Nouvelle facture</button>` : ''}`;
    P().querySelectorAll('[data-iv]').forEach(b => b.onclick = () => { cur = invs.find(i => i.id === b.dataset.iv); view = 'detail'; draw(); });
    const n = P().querySelector('#bs_new'); if (n) n.onclick = () => { view = 'new'; draw(); };
  }
  function drawDetail() {
    const iv = cur, line = (l, v) => v ? `<div class="mgrow" style="padding:7px 0;border-bottom:1px solid #EDF0F8"><span style="color:#5C6684">${l}</span><b style="color:#142A52;text-align:right">${v}</b></div>` : '';
    P().innerHTML = `${head('Facture ' + iv.number, true)}
      <div class="card2"><div style="display:flex;justify-content:space-between;align-items:center"><div><b style="color:#142A52;font-size:16px">${esc(iv.label)}</b><div class="sub" style="margin:2px 0 0">${esc(place.name)}</div></div>${stChip(iv.status)}</div>
      <div style="margin-top:8px">${line('Émise le', fdate(iv.issued_on))}${iv.qty > 1 ? line('Quantité', iv.qty + ' × ' + money(iv.unit_amount)) : ''}${line('Montant', money(iv.amount))}
      ${iv.status === 'paid' ? line('Payée le', fdate(iv.paid_at)) + line('Mode de paiement', esc(METH[iv.method] || iv.method || '')) + line('Référence', esc(iv.reference || '')) + line('Reçu N°', esc(iv.receipt || '')) + line('Encaissé par', esc(iv.collector_name || '')) : ''}</div></div>
      ${iv.status === 'due' && !perms.collect ? `<div class="msg info" style="margin-top:10px">Pour payer, remettez <b>${money(iv.amount)}</b> à votre agent Bangui Guide ou à l’équipe Bangui Guide (espèces ou Mobile Money). Vous recevrez ici votre reçu dès l’encaissement.</div>` : ''}
      ${iv.status === 'due' && perms.collect ? `<div class="card2" style="margin-top:10px"><div class="sh">Encaisser ${money(iv.amount)}</div><div id="bs_e"></div>
        <div class="field"><label>Mode de paiement</label><select id="bs_m">${Object.entries(METH).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div class="field"><label>Référence (n° de transaction, facultatif)</label><input id="bs_r" maxlength="60"></div>
        <button class="btn ok" id="bs_pay">Confirmer l’encaissement</button></div>` : ''}
      ${iv.status === 'due' && perms.cancel ? '<button class="btn ghost" id="bs_can" style="margin-top:8px;color:#C23B3B">Annuler cette facture</button>' : ''}
      <button class="btn ghost" id="bs_sh" style="margin-top:8px">Partager ${iv.status === 'paid' ? 'le reçu' : 'la facture'}</button>`;
    const pay = P().querySelector('#bs_pay');
    if (pay) pay.onclick = async () => {
      pay.disabled = true; pay.textContent = 'Enregistrement…';
      const { data, error } = await sb.rpc('record_payment', { p_invoice: iv.id, p_method: P().querySelector('#bs_m').value, p_ref: P().querySelector('#bs_r').value });
      if (error) { P().querySelector('#bs_e').innerHTML = `<div class="msg err">${esc(error.message)}</div>`; pay.disabled = false; pay.textContent = 'Confirmer l’encaissement'; return; }
      toast('Paiement enregistré · reçu ' + data); await load(); try { const { data: np } = await sb.from('places').select('*').eq('id', place.id).maybeSingle(); if (np) Object.assign(place, np); } catch { } cur = invs.find(i => i.id === iv.id); draw();
    };
    const can = P().querySelector('#bs_can'); if (can) can.onclick = async () => { if (!confirm('Annuler cette facture ?')) return; const { error } = await sb.rpc('cancel_invoice', { p_invoice: iv.id }); if (error) { toast('Erreur : ' + error.message); return; } await load(); view = 'list'; draw(); };
    P().querySelector('#bs_sh').onclick = async () => {
      const txt = `${iv.status === 'paid' ? 'Reçu ' + iv.receipt : 'Facture ' + iv.number} · ${iv.label}\n${place.name}\nMontant : ${money(iv.amount)}\n${iv.status === 'paid' ? 'Payée le ' + fdate(iv.paid_at) + ' (' + (METH[iv.method] || '') + ')' : 'À payer'}\nBangui Guide`;
      try { navigator.share ? await navigator.share({ title: iv.number, text: txt }) : (await navigator.clipboard.writeText(txt), toast('Copié')); } catch { }
    };
  }
  function drawNew() {
    let kind = 'mensuel', weeks = 1; const opts = [['inscription', 'Inscription', t.inscription, !invs.some(i => i.kind === 'inscription' && i.status !== 'cancelled')], ['mensuel', 'Abonnement mensuel', t.mensuel, true], ['annuel', 'Abonnement annuel', t.annuel, true], ['sponsoring', 'Sponsoring (par semaine)', t.sponsoring, !!perms.sponsor]].filter(o => o[3]);
    if (!opts.some(o => o[0] === kind)) kind = opts[0]?.[0];
    const render = () => {
      const o = opts.find(x => x[0] === kind), total = (o ? o[2] : 0) * (kind === 'sponsoring' ? weeks : 1);
      P().innerHTML = `${head('Nouvelle facture', true)}<div id="bs_e"></div>
        ${opts.map(([k, l, a]) => `<button type="button" class="card2 ivr" data-k="${k}" style="width:100%;text-align:left;border:2px solid ${kind === k ? '#E2541F' : 'transparent'};display:flex;justify-content:space-between;align-items:center"><b style="color:#142A52">${l}</b><span>${money(a)}</span></button>`).join('')}
        ${kind === 'sponsoring' ? `<div class="mgrow" style="margin:6px 0 10px"><b>Nombre de semaines</b><span style="display:flex;align-items:center;gap:10px"><button type="button" class="adup" id="bs_m" style="width:34px;height:34px;font-size:16px">−</button><b style="min-width:24px;text-align:center;font-size:17px">${weeks}</b><button type="button" class="adup" id="bs_p2" style="width:34px;height:34px;font-size:16px">+</button></span></div>` : ''}
        <div class="card2" style="background:#EAF1FF"><div class="sub" style="margin:0">Total à payer</div><b style="font-size:22px;color:#142A52">${money(total)}</b></div>
        <button class="btn" id="bs_go" style="margin-top:10px">Créer la facture</button>`;
      P().querySelectorAll('[data-k]').forEach(b => b.onclick = () => { kind = b.dataset.k; render(); });
      const m = P().querySelector('#bs_m'), pl = P().querySelector('#bs_p2'); if (m) m.onclick = () => { weeks = Math.max(1, weeks - 1); render(); }; if (pl) pl.onclick = () => { weeks = Math.min(52, weeks + 1); render(); };
      P().querySelector('#bs_go').onclick = async () => {
        const go = P().querySelector('#bs_go'); go.disabled = true;
        const { error } = await sb.rpc('create_invoice', { p_place: place.id, p_kind: kind, p_qty: weeks });
        if (error) { P().querySelector('#bs_e').innerHTML = `<div class="msg err">${esc(error.message)}</div>`; go.disabled = false; return; }
        toast('Facture créée'); await load(); view = 'list'; draw();
      };
      wire();
    };
    render();
  }
  function draw() { ({ list: drawList, detail: drawDetail, new: drawNew })[view](); wire(); }
  P().innerHTML = '<div class="empty">Chargement…</div>';
  await load();
  if (openId) { cur = invs.find(i => i.id === openId); if (cur) view = 'detail'; }
  draw();
}
