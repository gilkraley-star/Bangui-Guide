import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { sb, configured } from './supabase.js';
export { sb, configured, Capacitor };

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const svg = (p, s = 21, c = 'currentColor', w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
export const PIN = '<path d="M12 21.5c-1.5-1.6-6.5-6.6-6.5-11.2a6.5 6.5 0 0 1 13 0c0 4.6-5 9.6-6.5 11.2Z"/><circle cx="12" cy="10" r="2.4"/>';
export const I = {
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>', back: '<path d="m15 18-6-6 6-6"/>', chev: '<path d="m9 18 6-6-6-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  nav: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  cam: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', pin: PIN, star: '<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  crown: '<path d="m2 8 5 4 5-8 5 8 5-4-2 12H4z"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/>'
};
export const CI = {
  restaurant: '<path d="M7 3v8"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M17 3c-1.5 0-3 1.5-3 4s1 4 1 4v10"/><path d="M7 11v10"/>',
  hotel: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 15h18"/><path d="M7 9V6h4v3"/><path d="M3 20v-2M21 20v-2"/>',
  pharmacie: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
  banque: '<path d="M12 3 2 9h20z"/><path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9"/><path d="M3 21h18"/>',
  hopital: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/><path d="M12 9v6M9 12h6"/>',
  ecole: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  universite: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  transport: '<rect x="3" y="6" width="18" height="11" rx="2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M3 11h18"/>',
  admin: '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-5h6v5"/><path d="M9 11h.01M12 11h.01M15 11h.01"/>',
  culte: '<path d="M12 2v5M9.5 4.5h5"/><path d="M5 22V12l7-4 7 4v10"/><path d="M10 22v-5a2 2 0 0 1 4 0v5"/>',
  commerce: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  salon: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  garage: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  btp: '<path d="M2 18h20"/><path d="M4 18v-3a8 8 0 0 1 16 0v3"/><path d="M12 7v4"/>',
  voyage: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  station: '<path d="M4 22V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v17"/><path d="M3 22h12"/><path d="M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3"/><path d="M7 8h4"/>',
  organisation: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
};
export const catPath = id => CI[id] || PIN;
export const toast = t => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); };
export const favs = { get: () => { try { return JSON.parse(localStorage.getItem('bg_favs') || '[]'); } catch { return []; } }, set: a => localStorage.setItem('bg_favs', JSON.stringify(a)) };
export const fmtPrice = (n, u) => n == null || n === '' ? '' : `${String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')} FCFA${u ? ' / ' + u : ''}`;
export const fmtTime = iso => { const d = new Date(iso), n = new Date(); const same = d.toDateString() === n.toDateString(); const y = new Date(n - 864e5).toDateString() === d.toDateString(); return same ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : y ? 'Hier' : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }); };
export const isSponsored = p => p.sponsored && (!p.sponsored_until || new Date(p.sponsored_until) > new Date());
export const sortSp = a => [...a].sort((x, y) => isSponsored(y) - isSponsored(x));

/* ----- auth ----- */
let _prof;
if (configured) sb.auth.onAuthStateChange(() => { _prof = undefined; });
export async function getProfile(force) {
  if (!configured) return null;
  if (_prof !== undefined && !force) return _prof;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return (_prof = null);
  const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  return (_prof = { uid: session.user.id, email: session.user.email, full_name: data?.full_name || session.user.email.split('@')[0], role: data?.role || 'user' });
}
export const isStaff = p => p && (p.role === 'agent' || p.role === 'admin');
export function requireLogin(next) { sessionStorage.setItem('bg_next', next || location.hash); location.hash = '#/profil'; }

/* ----- distances ----- */
export const getPos = () => { try { return JSON.parse(sessionStorage.getItem('bg_pos') || 'null'); } catch { return null; } };
const kmBetween = (a, b) => { const r = x => x * Math.PI / 180, dl = r(b.lat - a.lat), dg = r(b.lng - a.lng), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dg / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
export const fmtD = k => k < 1 ? `${Math.round(k * 1000)} m` : `${k.toFixed(1)} km`;
export const withDist = a => { const me = getPos(); return a.map(p => ({ ...p, _d: me && p.lat != null && p.lng != null ? kmBetween(me, p) : null })); };
export async function getGps() {
  const p = Capacitor.isNativePlatform() ? await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000 })
    : await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 20000 }));
  return { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
}
export async function locate() { try { const g = await getGps(); sessionStorage.setItem('bg_pos', JSON.stringify({ lat: g.lat, lng: g.lng })); return true; } catch { toast('Position indisponible : autorise la localisation'); return false; } }

/* ----- notes ----- */
export async function attachStats(list) {
  if (!configured || !list.length) return list;
  const { data } = await sb.from('place_stats').select('*').in('place_id', list.map(p => p.id));
  const m = Object.fromEntries((data || []).map(s => [s.place_id, s]));
  return list.map(p => ({ ...p, _r: m[p.id]?.avg ?? null, _n: m[p.id]?.n ?? 0 }));
}

/* ----- photos ----- */
export const dataUrlToBlob = async u => (await fetch(u)).blob();
const blobToDataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
export function compress(src, max = 1280, q = .72) {
  return new Promise((res, rej) => {
    const img = new Image(); img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q));
    }; img.onerror = () => rej(new Error('Image illisible')); img.src = src;
  });
}
export async function pickPhoto() {
  if (Capacitor.isNativePlatform()) {
    const ph = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Uri, source: CameraSource.Prompt, promptLabelHeader: 'Photo', promptLabelPhoto: 'Galerie', promptLabelPicture: 'Prendre une photo' });
    return compress(ph.webPath);
  }
  return new Promise((res, rej) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async () => { try { res(i.files[0] ? await compress(await blobToDataUrl(i.files[0])) : null); } catch (e) { rej(e); } }; i.click(); });
}
export async function uploadPhoto(uid, dataUrl) {
  const path = `${uid}/${crypto.randomUUID()}.jpg`;
  const up = await sb.storage.from('place-photos').upload(path, await dataUrlToBlob(dataUrl), { contentType: 'image/jpeg' });
  if (up.error) throw up.error;
  return sb.storage.from('place-photos').getPublicUrl(path).data.publicUrl;
}

/* ----- v3 : stats, ouvert maintenant, WhatsApp, cache hors connexion ----- */
export const logEvent = (id, kind) => { if (configured) sb.from('place_events').insert({ place_id: id, kind }).then(() => { }, () => { }); };
export const waLink = (phone, text) => { const n = (phone || '').replace(/[^\d]/g, ''); return n ? `https://wa.me/${n}${text ? '?text=' + encodeURIComponent(text) : ''}` : ''; };
const DAYS = { lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6, dim: 0 };
/* true / false / null (inconnu) à partir d'un texte comme « Lun–Sam 8h–19h ; Dim 9h–13h » ou « 24h/24 » */
export function openNow(h, now = new Date()) {
  if (!h) return null; const s = h.toLowerCase();
  if (/24\s*h?\s*(\/|sur)\s*24|24h|24\/7|7j\/7 24/.test(s) && !/\d{1,2}\s*h?\s*[–-]\s*\d/.test(s.replace(/24\s*h/g, ''))) return true;
  const d = now.getDay(), m = now.getHours() * 60 + now.getMinutes(); let known = false;
  for (const seg of s.split(/[;,\n]|\s\/\s/)) {
    const t = seg.match(/(\d{1,2})\s*h\s*(\d{2})?\s*(?:[–-]|à|a)\s*(\d{1,2})\s*h?\s*(\d{2})?/); if (!t) continue; known = true;
    let days = [0, 1, 2, 3, 4, 5, 6]; const dm = seg.match(/(lun|mar|mer|jeu|ven|sam|dim)\w*\s*(?:[–-]|à|au)\s*(lun|mar|mer|jeu|ven|sam|dim)/);
    if (dm) { const a = DAYS[dm[1]], b = DAYS[dm[2]]; days = []; for (let i = a; ; i = (i + 1) % 7) { days.push(i); if (i === b) break; } }
    else { const one = seg.match(/(lun|mar|mer|jeu|ven|sam|dim)/); if (one) days = [DAYS[one[1]]]; }
    if (!days.includes(d)) continue;
    const a = +t[1] * 60 + +(t[2] || 0), b = +t[3] * 60 + +(t[4] || 0);
    if (b > a ? m >= a && m < b : m >= a || m < b) return true;
  }
  return known ? false : null;
}
export async function cachedQuery(key, run) {
  try { const r = await Promise.race([run(), new Promise((_, rej) => setTimeout(() => rej(new Error('Connexion trop lente')), 12000))]); if (!r.error) { try { localStorage.setItem('bgc_' + key, JSON.stringify(r.data)); } catch { } return r; } throw r.error; }
  catch (e) { try { const d = JSON.parse(localStorage.getItem('bgc_' + key) || 'null'); if (d) return { data: d, error: null, stale: true }; } catch { } return { data: null, error: e }; }
}
