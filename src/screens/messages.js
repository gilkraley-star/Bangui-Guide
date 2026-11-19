import { esc, svg, I, CI, sb, configured, getProfile, fmtTime, toast } from '../core.js';
import { $app, shell, skel, errBox, notConfigured, photoBox, onLeave, refreshBadge, photoOf, heroOf } from '../ui.js';
import { CAT } from '../data.js';

const STAT = { nouvelle: ['Nouvelle', '#EAF1FF', '#2A4A8A'], confirmee: ['Confirmée', '#E7F7EC', '#1E7A43'], refusee: ['Refusée', '#FFE9E7', '#C23B3B'], traitee: ['Traitée', '#F1F2F6', '#3A3F52'] };
const stPill = k => { const t = STAT[k] || STAT.nouvelle; return `<span class="ostat" style="background:${t[1]};color:${t[2]}">${t[0]}</span>`; };
export async function messages() {
  shell(`<div class="xhd mh safe-top"><i style="background-image:linear-gradient(90deg,#14307F 0,rgba(20,48,127,0) 50%),url('img/hd-monument.jpg')"></i><div class="mpb"><img src="logo.png" alt=""><span class="wm">Bangui <i>Guide</i></span></div><div class="mhb"><span class="mhi">${svg(I.msg, 30, '#fff', 1.7)}</span><div><h1>Messages</h1><p>Vos conversations avec les établissements</p></div></div></div>
    <div class="mch" id="ch"></div><div class="xsb ms"><span>${svg(I.search, 20, '#142A52', 2)}</span><input id="mq" type="search" placeholder="Rechercher une conversation…"></div><div class="mcl" id="cl"></div>`, 'msg');
  const cl = document.getElementById('cl');
  if (!configured) { cl.innerHTML = notConfigured(); return; }
  const prof = await getProfile().catch(() => null);
  if (!prof) { document.getElementById('ch').innerHTML = ''; cl.innerHTML = `<div class="card2" style="text-align:center;padding:24px"><div class="sh" style="justify-content:center">Connectez-vous</div><p class="sub" style="margin:0 0 14px">Pour écrire à un établissement et suivre vos conversations.</p><a class="btn" href="#/profil">Se connecter</a></div>`; return; }
  cl.innerHTML = skel(3);
  const [{ data: convs, error }, { data: unread }] = await Promise.all([
    sb.from('conversations').select('*, places(name, category, photo_url)').order('last_at', { ascending: false }).limit(100),
    sb.from('messages').select('conversation_id').is('read_at', null).neq('sender_id', prof.uid)
  ]);
  if (error) { cl.innerHTML = errBox(error); return; }
  const ids = (convs || []).map(c => c.id), lastMsg = {};
  if (ids.length) { const { data: ms } = await sb.from('messages').select('conversation_id, body').in('conversation_id', ids).order('created_at', { ascending: false }).limit(400); (ms || []).forEach(m => { if (!(m.conversation_id in lastMsg)) lastMsg[m.conversation_id] = m.body; }); }
  const cnt = {}; (unread || []).forEach(m => { cnt[m.conversation_id] = (cnt[m.conversation_id] || 0) + 1; });
  const total = Object.values(cnt).reduce((a, b) => a + b, 0); let only = false, term = '';
  const draw = () => {
    document.getElementById('ch').innerHTML = `<button class="${only ? '' : 'on'}" data-f="all">Tous ${total ? `<b>${total}</b>` : ''}</button><button class="${only ? 'on' : ''}" data-f="unread">Non lus</button>`;
    document.querySelectorAll('#ch button').forEach(b => b.onclick = () => { only = b.dataset.f === 'unread'; draw(); });
    const list = convs.filter(c => (!only || cnt[c.id]) && (!term || ((c.places?.name || c.user_name || '') + ' ' + (lastMsg[c.id] || '')).toLowerCase().includes(term)));
    cl.innerHTML = list.length ? list.map(c => {
      const pl = c.places || {}, mineConv = c.user_id === prof.uid, ct = CAT[pl.category] || { label: '', bg: '#EEF1F8', fg: '#142A52' }, u = cnt[c.id] || 0, ph = photoOf({ name: pl.name, category: pl.category, photo_url: pl.photo_url }) || (pl.category ? heroOf({ name: pl.name, category: pl.category }) : null);
      return `<a class="mcv ${u ? 'un' : ''}" href="#/chat/${c.id}"><span class="mav" style="background:${ph ? `center/cover url('${esc(ph)}')` : ct.bg}">${ph ? '' : svg(CI[pl.category] || I.msg, 26, ct.fg, 1.8)}</span>
        <div class="mbd"><div class="mtp"><b>${esc(mineConv ? (pl.name || 'Établissement') : (c.user_name || 'Client'))}</b><time>${fmtTime(c.last_at || c.created_at)}</time></div>
        <div class="mmd">${pl.category ? `<span class="pill" style="background:${ct.bg};color:${ct.fg}">${esc(ct.label.replace(/s$/, ''))}</span>` : ''}${c.status && c.status !== 'nouvelle' ? stPill(c.status) : ''}</div>
        <div class="mls"><span>${esc(lastMsg[c.id] || 'Nouvelle conversation')}</span>${u ? `<em>${u}</em>` : ''}</div></div></a>`; }).join('')
      : `<div class="empty">${only ? 'Aucun message non lu.' : 'Aucune conversation. Ouvre la fiche d’un lieu et touche « Écrire ».'}</div>`;
  };
  document.getElementById('mq').oninput = e => { term = e.target.value.trim().toLowerCase(); draw(); };
  draw();
}

export async function chat(id) {
  setTimeout(() => { const d = sessionStorage.getItem('bg_draft'), i = document.getElementById('ci'); if (d && i) { i.value = d; sessionStorage.removeItem('bg_draft'); i.focus(); } }, 400);
  $app.innerHTML = `<div class="top safe-top" style="background:#fff;border-bottom:1px solid #ECEEF2"><button class="back" id="back">${svg(I.back, 20)}</button><div id="ct" style="font-weight:700;font-size:16px;min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">…</div></div>
    <div class="scroll" id="scroll"><div class="chat" id="cm"></div></div>
    <form class="cbar" id="cf"><input id="ci" placeholder="Écrire un message…" maxlength="2000" autocomplete="off"><button aria-label="Envoyer">${svg(I.send, 20, '#fff')}</button></form>`;
  document.getElementById('back').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/messages');
  if (!configured) return;
  const prof = await getProfile().catch(() => null); if (!prof) { location.hash = '#/profil'; return; }
  const { data: cv, error } = await sb.from('conversations').select('*, places(name)').eq('id', id).maybeSingle();
  if (error || !cv) { document.getElementById('cm').innerHTML = '<div class="empty">Conversation introuvable.</div>'; return; }
  document.getElementById('ct').textContent = cv.user_id === prof.uid ? (cv.places?.name || 'Établissement') : (cv.user_name || 'Client');
  const ownerView = cv.user_id !== prof.uid;
  const sbar = document.createElement('div'); sbar.className = 'stbar';
  const drawSt = () => { sbar.innerHTML = ownerView ? `<span>Demande : ${stPill(cv.status)}</span><button data-s="confirmee">Confirmer</button><button data-s="refusee">Refuser</button><button data-s="traitee">Traitée</button>` : `<span>Statut de votre demande : ${stPill(cv.status)}</span>`; sbar.querySelectorAll('button').forEach(b => b.onclick = async () => { const { error } = await sb.rpc('set_conv_status', { c: id, s: b.dataset.s }); if (error) { toast('Erreur : ' + error.message); return; } cv.status = b.dataset.s; drawSt(); toast('Statut mis à jour'); }); };
  drawSt(); document.getElementById('scroll').before(sbar);
  const box = document.getElementById('cm'), sc = document.getElementById('scroll'); const seen = new Set();
  const add = m => { if (seen.has(m.id)) return; seen.add(m.id); const em0 = box.querySelector('.empty'); if (em0) em0.remove(); const me = m.sender_id === prof.uid; const d = document.createElement('div'); d.className = 'bub ' + (me ? 'me' : 'th'); d.innerHTML = `${esc(m.body)}<small>${fmtTime(m.created_at)}</small>`; box.appendChild(d); last = m.created_at; };
  let last = null;
  const load = async first => {
    let q = sb.from('messages').select('*').eq('conversation_id', id).order('created_at'); if (last) q = q.gt('created_at', last);
    const { data } = await q; const n = (data || []).filter(m => !seen.has(m.id)); n.forEach(add);
    if (n.length) { sc.scrollTop = sc.scrollHeight; if (n.some(m => m.sender_id !== prof.uid)) { await sb.rpc('mark_read', { c: id }); refreshBadge(); } }
    else if (first) { box.innerHTML = '<div class="empty" style="padding:30px 10px">Dites bonjour 👋</div>'; }
  };
  await load(true);
  const t = setInterval(() => load(false), 4000); onLeave(() => clearInterval(t));
  sb.rpc('mark_read', { c: id }).then(refreshBadge);
  document.getElementById('cf').onsubmit = async e => {
    e.preventDefault(); const i = document.getElementById('ci'), body = i.value.trim(); if (!body) return; i.value = '';
    const { data, error } = await sb.from('messages').insert({ conversation_id: id, sender_id: prof.uid, body }).select().single();
    if (error) { toast('Envoi impossible : ' + error.message); i.value = body; return; }
    const em = box.querySelector('.empty'); if (em) em.remove(); add(data); sc.scrollTop = sc.scrollHeight;
  };
}
