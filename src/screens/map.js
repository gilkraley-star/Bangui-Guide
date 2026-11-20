import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { esc, svg, I, catPath, sb, configured, withDist, locate, getPos, attachStats, swr, fetchPlaces, toast } from '../core.js';
import { CAT, CATS } from '../data.js';
import { shell, rowHtml, onLeave, notConfigured } from '../ui.js';

const PIN_COL = { restaurant: '#E5301F', hotel: '#1E6BE0', pharmacie: '#1FA64D', commerce: '#9B2FC9', banque: '#1E6BE0', admin: '#F5841F', culte: '#6B7185', hopital: '#E5301F', universite: '#1E3A8A', transport: '#0E9AA7', btp: '#E2541F', station: '#1E6BE0', voyage: '#0E9AA7' };
export async function mapScreen() {
  shell(`<div class="xhd mp safe-top"><i style="background-image:linear-gradient(90deg,#14307F 0,rgba(20,48,127,0) 55%),url('img/hd-monument.jpg')"></i><div class="mpb"><img src="logo.png" alt=""><span class="wm">Bangui <i>Guide</i></span></div><p>Explorez Bangui, trouvez facilement<br>les meilleurs lieux</p></div>
    <div class="xsb mpsb"><span>${svg(I.search, 22, '#142A52', 2)}</span><input id="mq" type="search" placeholder="Rechercher un lieu, un établissement, un quartier…"><button id="mf" aria-label="Filtres">${svg('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>', 22, '#142A52', 2)}</button></div>
    <div class="fchips xch mpch" id="mch"><button class="fc on" data-c="">${svg('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>', 16, 'currentColor', 2.2)} Tous</button>${CATS.map(c => `<button class="fc" data-c="${c.id}"><span style="color:${PIN_COL[c.id] || c.fg};display:inline-flex">${svg(catPath(c.id), 16, 'currentColor', 2.2)}</span> ${esc(c.label)}</button>`).join('')}</div>
    <div class="mapw"><div id="map"></div><button class="mfab" id="me" aria-label="Ma position">${svg(I.locate, 22, '#142A52')}</button><div class="mzoom"><button id="zi">+</button><button id="zo">−</button></div><button class="mfab mnav" id="mnv" aria-label="Centrer">${svg('<path d="M3 11 21 3l-8 18-2-8z"/>', 24, '#1E5BD8', 2)}</button><div class="mcard" id="mcard"></div></div>`, 'map');
  document.getElementById('scroll').classList.add('maps');
  const me = getPos();
  const map = L.map('map', { zoomControl: false, attributionControl: true }).setView(me ? [me.lat, me.lng] : [4.3947, 18.5582], me ? 14 : 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  onLeave(() => map.remove());
  setTimeout(() => map.invalidateSize(), 200);
  let meMarker;
  const showMe = p => { if (meMarker) meMarker.remove(); meMarker = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: '<div class="mme"><i></i></div>', iconSize: [70, 70], iconAnchor: [35, 35] }), interactive: false, zIndexOffset: 1000 }).addTo(map); };
  if (me) showMe(me);
  const goMe = async () => { if (await locate()) { const p = getPos(); showMe(p); map.setView([p.lat, p.lng], 15); } };
  document.getElementById('me').onclick = goMe; document.getElementById('mnv').onclick = goMe;
  document.getElementById('zi').onclick = () => map.zoomIn(); document.getElementById('zo').onclick = () => map.zoomOut();
  if (!configured) { toast('Serveur non configuré'); return; }
  let data = [];
  const card = document.getElementById('mcard'); let cat = '', term = '', layer = L.layerGroup().addTo(map), first = true;
  const draw = () => {
    layer.clearLayers();
    const a = data.filter(p => (!cat || p.category === cat) && (!term || (p.name + ' ' + (p.area || '') + ' ' + (p.address || '')).toLowerCase().includes(term)));
    a.forEach(p => {
      const col = PIN_COL[p.category] || (CAT[p.category] || {}).fg || '#142A52', nm = esc(p.name);
      L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: `<div class="mk2"><span class="pn" style="background:${col}">${svg(catPath(p.category), 17, '#fff', 2.2)}</span><b>${nm}</b></div>`, iconSize: [0, 0], iconAnchor: [18, 40] }) })
        .addTo(layer).on('click', async () => { const [pp] = withDist(await attachStats([p])); card.innerHTML = rowHtml(pp); card.style.display = 'block'; });
    });
    if (a.length && (first || cat || term) && !me) map.fitBounds(L.latLngBounds(a.map(p => [p.lat, p.lng])), { padding: [50, 50], maxZoom: 15 }); first = false;
  };
  document.querySelectorAll('#mch .fc').forEach(b => b.onclick = () => { cat = b.dataset.c; document.querySelectorAll('#mch .fc').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  document.getElementById('mq').oninput = e => { term = e.target.value.trim().toLowerCase(); draw(); };
  document.getElementById('mf').onclick = () => document.getElementById('mch').scrollBy({ left: 160, behavior: 'smooth' });
  map.on('click', () => { card.style.display = 'none'; });
  await swr('map', () => fetchPlaces(sb.from('places').select('*').eq('status', 'published').not('lat', 'is', null).not('lng', 'is', null).limit(500)), (d, info) => { if (!d) { toast('Impossible de charger les lieux'); return; } data = d; draw(); });
}
