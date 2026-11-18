import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { esc, svg, I, catPath, sb, configured, withDist, locate, getPos, attachStats, toast } from '../core.js';
import { CAT } from '../data.js';
import { shell, rowHtml, onLeave, notConfigured } from '../ui.js';

export async function mapScreen() {
  shell(`<div class="top safe-top" style="background:#fff;padding-bottom:10px"><h1 style="font-size:18px;flex:1">Carte de Bangui</h1><span class="sub" id="cnt"></span></div>
    <div class="mapw"><div id="map"></div><button class="mfab" id="me" aria-label="Ma position">${svg(I.locate, 22, '#1E6BE0')}</button><div class="mcard" id="mcard"></div></div>`, 'map');
  document.getElementById('scroll').classList.add('maps');
  const me = getPos();
  const map = L.map('map', { zoomControl: false, attributionControl: true }).setView(me ? [me.lat, me.lng] : [4.3947, 18.5582], me ? 14 : 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  onLeave(() => map.remove());
  setTimeout(() => map.invalidateSize(), 200);
  let meMarker;
  const showMe = p => { if (meMarker) meMarker.remove(); meMarker = L.circleMarker([p.lat, p.lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#1E6BE0', fillOpacity: 1 }).addTo(map); };
  if (me) showMe(me);
  document.getElementById('me').onclick = async () => { if (await locate()) { const p = getPos(); showMe(p); map.setView([p.lat, p.lng], 15); } };
  if (!configured) { toast('Serveur non configuré'); return; }
  const { data, error } = await sb.from('places').select('*').eq('status', 'published').not('lat', 'is', null).not('lng', 'is', null).limit(500);
  if (error) { toast('Impossible de charger les lieux'); return; }
  document.getElementById('cnt').textContent = `${data.length} lieu${data.length > 1 ? 'x' : ''}`;
  if (!data.length) toast('Aucun lieu avec position GPS pour l’instant');
  const card = document.getElementById('mcard');
  data.forEach(p => {
    const c = CAT[p.category] || { fg: '#142A52' };
    L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: `<div class="mk" style="background:${c.fg}">${svg(catPath(p.category), 16, '#fff', 2)}</div>`, iconSize: [34, 34], iconAnchor: [17, 34] }) })
      .addTo(map).on('click', async () => { const [pp] = withDist(await attachStats([p])); card.innerHTML = rowHtml(pp); card.style.display = 'block'; });
  });
  map.on('click', () => { card.style.display = 'none'; });
  if (data.length && !me) map.fitBounds(L.latLngBounds(data.map(p => [p.lat, p.lng])), { padding: [50, 50], maxZoom: 15 });
}
