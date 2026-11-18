import { esc, svg, I, sb, configured, getProfile, fmtTime, toast } from '../core.js';
import { $app, shell, skel, errBox, notConfigured, photoBox, onLeave, refreshBadge } from '../ui.js';

export async function messages() {
  shell(`<div class="hero safe-top" style="padding-bottom:30px"><div style="display:flex;gap:12px;align-items:center"><span class="icb" style="width:46px;height:46px">${svg(I.msg, 22, '#fff')}</span><div><h1 style="font-size:23px">Messages</h1><div style="font-size:12.5px;opacity:.85">Vos conversations avec les établissements</div></div></div></div>
    <div class="ch" style="padding-top:18px" id="ch"></div><div class="list" id="cl">${skel(3)}</div>`, 'msg');
  const cl = document.getElementById('cl');
  if (!configured) { cl.innerHTML = notConfigured(); return; }
  const prof = await getProfile().catch(() => null);
  if (!prof) { document.getElementById('ch').innerHTML = ''; cl.innerHTML = `<div class="card2" style="text-align:center;padding:24px"><div class="sh" style="justify-content:center">Connectez-vous</div><p class="sub" style="margin:0 0 14px">Pour écrire à un établissement et suivre vos conversations.</p><a class="btn" href="#/profil">Se connecter</a></div>`; return; }
  const [{ data: convs, error }, { data: unread }] = await Promise.all([
    sb.from('conversations').select('*, places(name, category, photo_url)').order('last_at', { ascending: false }).limit(100),
    sb.from('messages').select('conversation_id').is('read_at', null).neq('sender_id', prof.uid)
  ]);
  if (error) { cl.innerHTML = errBox(error); return; }
  const cnt = {}; (unread || []).forEach(m => { cnt[m.conversation_id] = (cnt[m.conversation_id] || 0) + 1; });
  const total = Object.values(cnt).reduce((a, b) => a + b, 0); let only = false;
  const draw = () => {
    document.getElementById('ch').innerHTML = `<button class="${only ? '' : 'on'}" data-f="all">Tous ${convs.length ? `<b>${convs.length}</b>` : ''}</button><button class="${only ? 'on' : ''}" data-f="unread">Non lus ${total ? `<b>${total}</b>` : ''}</button>`;
    document.querySelectorAll('#ch button').forEach(b => b.onclick = () => { only = b.dataset.f === 'unread'; draw(); });
    const list = convs.filter(c => !only || cnt[c.id]);
    cl.innerHTML = list.length ? list.map(c => { const pl = c.places || {}, mineConv = c.user_id === prof.uid; return `<a class="cv" href="#/chat/${c.id}"><div class="av">${photoBox({ category: pl.category, photo_url: pl.photo_url }, '', 24)}</div><div class="bd"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(mineConv ? pl.name : (c.user_name || 'Client') + ' · ' + (pl.name || ''))}</b><span class="sub" style="margin:0;flex:none">${fmtTime(c.last_at)}</span></div><div class="lm">${esc(c.last_message || 'Nouvelle conversation')}</div></div>${cnt[c.id] ? `<span class="ub">${cnt[c.id]}</span>` : ''}</a>`; }).join('')
      : `<div class="empty">${only ? 'Aucun message non lu.' : 'Aucune conversation. Ouvre la fiche d’un lieu et touche « Écrire ».'}</div>`;
  };
  draw();
}

export async function chat(id) {
  $app.innerHTML = `<div class="top safe-top" style="background:#fff;border-bottom:1px solid #ECEEF2"><button class="back" id="back">${svg(I.back, 20)}</button><div id="ct" style="font-weight:700;font-size:16px;min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">…</div></div>
    <div class="scroll" id="scroll"><div class="chat" id="cm"></div></div>
    <form class="cbar" id="cf"><input id="ci" placeholder="Écrire un message…" maxlength="2000" autocomplete="off"><button aria-label="Envoyer">${svg(I.send, 20, '#fff')}</button></form>`;
  document.getElementById('back').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/messages');
  if (!configured) return;
  const prof = await getProfile().catch(() => null); if (!prof) { location.hash = '#/profil'; return; }
  const { data: cv, error } = await sb.from('conversations').select('*, places(name)').eq('id', id).maybeSingle();
  if (error || !cv) { document.getElementById('cm').innerHTML = '<div class="empty">Conversation introuvable.</div>'; return; }
  document.getElementById('ct').textContent = cv.user_id === prof.uid ? (cv.places?.name || 'Établissement') : (cv.user_name || 'Client');
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
