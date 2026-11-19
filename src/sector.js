/* Mises en page des fiches par secteur (reproduit les maquettes) */
import { esc, svg, I, fmtPrice, openNow } from './core.js';
import { itemPhoto } from './ui.js';

const P = {
  pill: '<path d="M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7z"/><path d="m8.5 8.5 7 7"/>',
  syringe: '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a1 1 0 0 1-.7.3H5v-3a1 1 0 0 1 .3-.7L15.5 5.5M9 11l4 4M5 19l-3 3M14 4l6 6"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.2-6"/>',
  mother: '<circle cx="9" cy="6" r="3"/><path d="M4 21v-3a5 5 0 0 1 5-5"/><circle cx="17" cy="14" r="2.5"/><path d="M13.5 21v-1.5a3.5 3.5 0 0 1 7 0V21"/>',
  siren: '<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 21h14M12 2v2M3 6l1.5 1.5M21 6l-1.5 1.5"/>',
  steth: '<path d="M6 3v6a4 4 0 0 0 8 0V3M6 3H4M14 3h2"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
  micro: '<path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2zM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M15 10h3M15 13h3"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  transfer: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
  coins: '<circle cx="9" cy="9" r="6"/><path d="M15 9.5A6 6 0 1 1 9.5 15M7 9h4"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  rings: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="m9 4 1.5 2L12 4l1.5 2L15 4"/>',
  legal: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 15l2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  compass: '<path d="m12 3 5 18M12 3 7 21M9 15h6"/><circle cx="12" cy="3" r="1.4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 17.5 12 22l9-4.5"/>',
  hardhat: '<path d="M3 18h18M5 18v-3a7 7 0 0 1 14 0v3M10 8V5h4v3"/>',
  bricks: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9.3h18M3 14.7h18M9 4v5.3M15 9.3v5.4M9 14.7V20"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M7 8h4"/>',
  bottle: '<path d="M9 3h6v3a5 5 0 0 1 3 4.5V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8.5A5 5 0 0 1 9 6z"/>',
  store: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0"/>',
  car: '<path d="M5 17h14M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4H3z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
  wash: '<path d="M5 18h14M3 14l2-4a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 4v4H3zM8 3v2M12 2v3M16 3v2"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z"/>',
  atm: '<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="7" y="8" width="10" height="5" rx="1"/><path d="M9 17h6"/>',
  plane: '<path d="M2 16l20-7-7 13-3-6z"/><path d="m12 16 10-7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  beach: '<path d="M3 12a9 9 0 0 1 18 0zM12 12v9M9 21h6"/>',
  bed: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M7 9V6h4v3M3 20v-2M21 20v-2"/>',
  bus: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16M8 21v-4M16 21v-4"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="6.5" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
  calcheck: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  grad: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/>',
  network: '<circle cx="12" cy="12" r="2"/><path d="M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8M5 5a10 10 0 0 0 0 19M19 5a10 10 0 0 1 0 14"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/>',
  clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 14l2 2 4-4"/>',
  wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
  snow: '<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/>',
  food: '<path d="M7 3v8"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M17 3c-1.5 0-3 1.5-3 4s1 4 1 4v10"/><path d="M7 11v10"/>',
  park: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 5 5 9-10"/>'
};
export const SXI = P;
const KW = [
  [/m[ée]dicament|parac|pharmacie/i, 'pill'], [/produits? de sant|vaccin|test|injection/i, 'syringe'], [/parapharm|cosm|bio|naturel/i, 'leaf'], [/m[èe]re|enfant|maternit|accouch|b[ée]b[ée]/i, 'mother'],
  [/urgence/i, 'siren'], [/consult|m[ée]decin|g[ée]n[ée]ral|sp[ée]cial|dent/i, 'steth'], [/labo|analyse|[ée]chograph|radio/i, 'micro'],
  [/compte|adh[ée]sion/i, 'idcard'], [/carte/i, 'card'], [/transfert|virement|envoi/i, 'transfer'], [/cr[ée]dit|financ|[ée]pargne|pr[êe]t/i, 'coins'],
  [/mariage/i, 'rings'], [/l[ée]galis/i, 'legal'], [/naissance|acte|certificat|d[ée]claration|imp[ôo]t/i, 'doc'], [/renseign/i, 'info'],
  [/plan|conception|architec/i, 'compass'], [/[ée]tude|devis/i, 'layers'], [/chantier|suivi|construction/i, 'hardhat'], [/r[ée]nov|am[ée]nag|ma[çc]onn|plomb|[ée]lectr|peinture/i, 'bricks'],
  [/essence|gasoil|carburant|diesel/i, 'fuel'], [/gaz/i, 'bottle'], [/boutique|magasin/i, 'store'], [/lavage/i, 'wash'], [/pneu/i, 'wheel'], [/vidange|m[ée]canique|diagnostic|plaquette|r[ée]paration/i, 'wrench'], [/distributeur|atm|guichet/i, 'atm'],
  [/billet|avion|vol\b|bangui\s*[–-]/i, 'plane'], [/visa|passeport/i, 'globe'], [/s[ée]jour|circuit|touris/i, 'beach'], [/h[ôo]tel|chambre|nuit/i, 'bed'],
  [/r[ée]seau|t[ée]l[ée]com/i, 'network'], [/informatique|ordinateur|licence|logiciel/i, 'laptop'], [/formation|master|inscription|scolarit|primaire|coll[èe]ge/i, 'grad'],
  [/chauffeur/i, 'user'], [/assur|garant|s[ée]curis/i, 'shield'], [/livraison|colis/i, 'truck'], [/rapide|r[ée]servation/i, 'calcheck'],
  [/bus|taxi|course|v[ée]hicule|location|transport|auto|moto/i, 'car'], [/photo|cam[ée]ra/i, 'cam'], [/wi-?fi/i, 'wifi'], [/climat/i, 'snow'], [/restaur|menu|plat/i, 'food'], [/parking/i, 'park']
];
export const iconFor = (name = '') => P[(KW.find(([r]) => r.test(name)) || [, 'info'])[1]];
export const ico = (name, s = 30, col = 'currentColor', w = 1.8) => svg(iconFor(name), s, col, w);

/* ---------- horaires lisibles ---------- */
export const fmtHours = h => !h ? '' : /24\s*h?\s*\/\s*24/i.test(h) ? '24h/24 – 7j/7'
  : h.replace(/\s*;\s*/g, '  ·  ').replace(/(\d{1,2})h(?!\d)/g, '$1h00').replace(/(\p{L}{3})\s*[–-]\s*(\p{L}{3})\s+(\d)/gu, '$1 – $2 : $3').replace(/(\d)\s*[–-]\s*(\d)/g, '$1 – $2');
const DJ = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'], DN = { lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6, dim: 0 };
export function nextOpen(h, now = new Date()) {
  if (!h) return '';
  for (let k = 1; k <= 7; k++) {
    const d = new Date(+now + k * 864e5), dow = d.getDay();
    for (const seg of h.toLowerCase().split(/[;,]/)) {
      const t = seg.match(/(\d{1,2})\s*h\s*(\d{2})?/); if (!t) continue;
      let days = [0, 1, 2, 3, 4, 5, 6]; const dm = seg.match(/(lun|mar|mer|jeu|ven|sam|dim)\w*\s*(?:[–-]|à)\s*(lun|mar|mer|jeu|ven|sam|dim)/);
      if (dm) { days = []; for (let i = DN[dm[1]]; ; i = (i + 1) % 7) { days.push(i); if (i === DN[dm[2]]) break; } } else { const o = seg.match(/(lun|mar|mer|jeu|ven|sam|dim)/); if (o) days = [DN[o[1]]]; }
      if (days.includes(dow)) return `Réouverture ${k === 1 ? 'demain' : DJ[dow]} à ${t[1]}h${t[2] || '00'}`;
    }
  }
  return '';
}

/* ---------- ligne statut + horaires ---------- */
export function statusRow(p) {
  const cat = p.category, op = p.on_duty ? true : openNow(p.hours), tags = p.tags || [];
  const tg = re => tags.find(t => re.test(t));
  let chip = op == null ? null : [op ? 'on' : 'off', p.on_duty ? 'De garde aujourd’hui' : op ? (cat === 'hopital' ? 'Accueil ouvert' : /commerce|admin|btp|garage|salon|voyage|transport|banque/.test(cat) && !/24/.test(p.hours || '') ? 'Ouvert aujourd’hui' : 'Ouvert maintenant') : 'Fermé actuellement', P.check];
  let right = fmtHours(p.hours), rIcon = P.clock;
  if (cat === 'universite' || cat === 'ecole') { const ins = tg(/inscription/i); if (ins) chip = ['on', ins, P.grad]; const an = tg(/ann[ée]e/i); if (an) { right = an; rIcon = P.cal; } }
  if (op === false) right = nextOpen(p.hours) || right;
  if (cat === 'hopital' && /24h/.test(right)) right = '24h/24 – 7j/7';
  if (!chip && !right) return '';
  return `<div class="stline">${chip ? `<span class="stt ${chip[0]}">${chip[2] === P.check ? '<i></i>' : svg(chip[2], 16, 'currentColor', 2)}${esc(chip[1])}</span>` : ''}${right ? `<span class="sthr">${svg(rIcon, 19, '#4A5578', 1.8)}${esc(right)}</span>` : ''}</div>`;
}

/* ---------- briques ---------- */
const head = (t, all) => `<div class="sxh"><h3>${t}</h3>${all ? `<button class="sxall" data-all="1">${all} ${svg(I.arrow || '<path d="M5 12h14M13 6l6 6-6 6"/>', 17, '#E2541F', 2.2)}</button>` : ''}</div>`;
const tile = (it, s = 34) => `<div class="sxt"><span class="sxi">${ico(it.name, s)}</span><b>${esc(it.name)}</b>${it.description ? `<small>${esc(it.description)}</small>` : ''}</div>`;
const photoStyle = u => `style="background:center/cover url('${esc(u)}')"`;
const strip = (tags, map) => { const r = map.filter(([re]) => tags.some(t => re.test(t))); return r.length ? `<div class="sxstrip">${r.map(([re, l]) => `<div>${ico(l, 26, '#1E3A8A')}<span>${l}</span></div>`).join('')}</div>` : ''; };
const priced = its => its.filter(i => i.price != null && i.price !== '' && Number(i.price) > 0), free = its => its.filter(i => !(i.price != null && i.price !== '' && Number(i.price) > 0));
const empty = (t) => `<div class="card2"><div class="empty" style="padding:20px">${t} à venir. L’établissement n’a pas encore ajouté d’éléments.</div></div>`;
const sold = it => it.available === false ? ' soldout' : '';

export const TABNAME = { restaurant: 'Menu', hotel: 'Chambres', pharmacie: 'Produits', commerce: 'Produits', hopital: 'Services', universite: 'Formations', ecole: 'Formations', banque: 'Services', admin: 'Démarches', transport: 'Services', btp: 'Services', station: 'Services', voyage: 'Voyages', garage: 'Services', salon: 'Services', culte: 'Activités', organisation: 'Activités' };
export const ABOUT = { universite: 'Présentation', ecole: 'Présentation', admin: 'Présentation' };
export const ADDLABEL = { restaurant: 'un plat', hotel: 'une chambre', pharmacie: 'un produit ou service', commerce: 'un produit', hopital: 'un service médical', universite: 'une formation', ecole: 'une formation', banque: 'un service', admin: 'une démarche', transport: 'un véhicule ou un tarif', btp: 'un service', station: 'un carburant ou un service', voyage: 'un service ou un tarif', garage: 'un service', salon: 'une prestation', culte: 'une activité', organisation: 'une activité' };

export function sectorBody(p, its, state = {}) {
  const cat = p.category, tags = p.tags || [];
  if (state.all) return `<div class="card2 tlist"><div class="sh">Tout voir</div>${its.map(it => `<div class="trow${sold(it)}">${itemPhoto(it) ? `<div class="tth" ${photoStyle(itemPhoto(it))}></div>` : `<span class="sxi sm">${ico(it.name, 24)}</span>`}<div style="min-width:0;flex:1"><b>${esc(it.name)}</b>${it.description ? `<div class="sub" style="margin:1px 0 0">${esc(it.description)}</div>` : ''}</div><span class="pr">${esc(fmtPrice(it.price, it.unit))}</span></div>`).join('')}</div><button class="lnk" data-all="0" style="margin:6px auto 0;display:block">← Revenir</button>`;
  if (!its.length && !['pharmacie'].includes(cat)) return empty(TABNAME[cat] || 'Contenu');
  const CAP = { hotel: 2, restaurant: 2, pharmacie: 4, commerce: 6, hopital: 4, universite: 2, ecole: 2, banque: 4, admin: 4, transport: 3, btp: 4, voyage: 3, station: 3 };
  const cap = CAP[cat] || 4; const more = its.length > cap ? 'Voir toutes' : '';

  if (cat === 'hotel') return `${head('Nos chambres', more)}<div class="sxrooms">${its.slice(0, 2).map(it => `<div class="sxroom${sold(it)}"><div class="ph" ${photoStyle(itemPhoto(it) || 'img/hotel-hero.jpg')}></div><b>${esc(it.name)}</b><span>${it.price != null ? 'à partir de ' + esc(fmtPrice(it.price, it.unit)) : ''}</span></div>`).join('')}</div>
    ${tags.length ? `<div class="sxam">${tags.slice(0, 6).map(t => `<div>${ico(t, 26, '#1E3A8A')}<span>${esc(/^Wi-?Fi$/i.test(t) ? 'Wi-Fi gratuit' : t === 'Parking' ? 'Parking sécurisé' : t)}</span></div>`).join('')}</div>` : ''}`;

  if (cat === 'restaurant') return `<div class="card2 sxmenu">${head('Menu en aperçu')}${its.slice(0, 2).map(it => `<div class="sxdish${sold(it)}"><div class="ph" ${photoStyle(itemPhoto(it) || 'img/restaurant.jpg')}></div><div><b>${esc(it.name)}</b>${it.description ? `<small>${esc(it.description)}</small>` : ''}<em>${esc(fmtPrice(it.price, it.unit))}</em></div></div>`).join('')}
    <div class="sxbtns"><button class="btn ghost" data-all="1">${svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', 18, '#142A52', 2)} Voir le menu complet</button><button class="btn" id="cta">${svg(P.cal, 18, '#fff', 2)} Réserver une table</button></div></div>`;

  if (cat === 'pharmacie') { const hh = (p.hours || '').split(/\s*;\s*/).filter(Boolean).map(fmtHours);
    return `${head('Nos services')}<div class="sxtiles t4">${its.slice(0, 4).map(it => tile(it)).join('') || ['Médicaments', 'Produits de santé', 'Parapharmacie', 'Mère & Enfant'].map(n => tile({ name: n })).join('')}</div>
    <div class="sxduo"><div class="card2 sxhr"><b>${svg(P.clock, 24, '#142A52', 1.9)} Horaires</b>${hh.length ? hh.map(x => `<div>${esc(x)}</div>`).join('') : '<div>À renseigner</div>'}</div><div class="sxgarde ${p.on_duty ? '' : 'off'}"><div>${svg(P.cal, 24, 'currentColor', 1.9)}<b>Garde</b><small>${p.on_duty ? 'Aujourd’hui' : 'Pas de garde'}</small></div>${p.on_duty ? `<span class="ok">${svg(P.check, 22, '#fff', 3)}</span>` : ''}</div></div>`; }

  if (cat === 'commerce') return `${head('Nos produits', its.length > 6 ? 'Voir tout' : '')}<div class="sxgrid">${its.slice(0, 6).map(it => `<div class="sxprod${sold(it)}"><div class="ph" ${photoStyle(itemPhoto(it) || 'img/shop-hero.jpg')}></div><b>${esc(it.name)}</b>${it.price ? `<small>${esc(fmtPrice(it.price, it.unit))}</small>` : ''}</div>`).join('')}</div>
    ${strip(tags, [[/livraison/i, 'Livraison à Bangui'], [/garanti/i, 'Produits garantis'], [/paiement/i, 'Paiement sécurisé']])}`;

  if (cat === 'hopital') return `${head('Services médicaux', more ? 'Voir tous' : '')}<div class="sxsvc">${its.slice(0, 4).map(it => `<div class="sxs${sold(it)}"><span class="sxi">${ico(it.name, 36)}</span><div><b>${esc(it.name)}</b>${it.description ? `<small>${esc(it.description)}</small>` : ''}</div></div>`).join('')}</div>`;

  if (cat === 'universite' || cat === 'ecole') return `${head('Nos formations', more ? 'Voir toutes' : '')}<div class="sxfor">${its.slice(0, 2).map(it => `<div class="sxf${sold(it)}"><div class="ph" ${photoStyle(itemPhoto(it) || 'img/h-univ.jpg')}></div><div class="tt"><span class="sxi sm">${ico(it.name, 22)}</span><b>${esc(it.name)}</b></div>${it.description ? `<small>${esc(it.description)}</small>` : ''}${it.price ? `<span class="fee">Frais de scolarité</span><em>${esc(fmtPrice(it.price, it.unit))}</em>` : ''}</div>`).join('')}</div>`;

  if (cat === 'banque' || cat === 'admin') return `${head(cat === 'admin' ? 'Démarches administratives' : 'Nos services', more ? 'Voir tous' : '')}<div class="sxtiles t4 o">${its.slice(0, 4).map(it => tile(it)).join('')}</div>`;

  if (cat === 'transport') return `${head('Nos véhicules en location', its.length > 3 ? 'Voir tous' : '')}<div class="sxveh">${its.slice(0, 3).map(it => `<div class="sxv${sold(it)}"><div class="ph" ${photoStyle(itemPhoto(it) || 'img/h-auto.jpg')}></div><b>${esc(it.name)}</b>${it.description ? `<small>${svg(P.car, 15, '#3A3F52', 1.8)} ${esc(it.description)}</small>` : ''}<em>${esc(fmtPrice(it.price))}</em>${it.unit ? `<i>/ ${esc(it.unit)}</i>` : ''}</div>`).join('')}</div>
    ${strip(tags, [[/chauffeur/i, 'Avec chauffeur'], [/assur/i, 'Véhicules assurés'], [/entretenu/i, 'Bien entretenus'], [/rapide/i, 'Réservation rapide']])}`;

  if (cat === 'btp') return `${head('Nos services', more ? 'Voir tous' : '')}<div class="sxbtp">${its.slice(0, 4).map(it => `<div class="sxb${sold(it)}"><div class="ph" ${photoStyle(itemPhoto(it) || 'img/h-btp.jpg')}></div><div class="tt"><span class="sxi sm">${ico(it.name, 22)}</span><div><b>${esc(it.name)}</b>${it.description ? `<small>${esc(it.description)}</small>` : ''}</div></div></div>`).join('')}</div>`;

  if (cat === 'station') { const pr = priced(its), fr = free(its); return `${pr.length ? `${head('Carburants & prix')}<div class="sxfuel">${pr.slice(0, 3).map(it => `<div class="sxfu${sold(it)}"><span class="sxi">${ico(it.name, 34)}</span><b>${esc(it.name)}</b><em>${esc(fmtPrice(it.price))}</em>${it.unit ? `<i>/ ${esc(it.unit)}</i>` : ''}</div>`).join('')}</div>` : ''}${fr.length ? `${head('Autres services')}<div class="sxmini">${fr.slice(0, 5).map(it => `<div class="sxt"><span class="sxi">${ico(it.name, 30)}</span><b>${esc(it.name)}</b></div>`).join('')}</div>` : ''}`; }

  if (cat === 'voyage') { const pr = priced(its), fr = free(its); return `${head('Nos services')}<div class="sxtiles t4 o">${fr.slice(0, 4).map(it => tile(it)).join('')}</div>${pr.length ? `${head('Exemples de tarifs de vols', pr.length > 3 ? 'Voir tous' : '')}<div class="sxrates">${pr.slice(0, 3).map(it => `<div class="sxr${sold(it)}"><div class="ph" ${photoStyle(itemPhoto(it) || 'img/h-voyage.jpg')}></div><b>${esc(it.name)}</b>${it.description ? `<small>${esc(it.description)}</small>` : ''}<em>${esc(fmtPrice(it.price, it.unit))}</em></div>`).join('')}</div>` : ''}`; }

  /* garage, salon, culte, organisation, autres */
  const pr = priced(its);
  return pr.length ? `<div class="card2 tlist"><div class="sh">Services & tarifs</div>${its.map(it => `<div class="trow${sold(it)}">${itemPhoto(it) ? `<div class="tth" ${photoStyle(itemPhoto(it))}></div>` : `<span class="sxi sm">${ico(it.name, 24)}</span>`}<div style="min-width:0;flex:1"><b>${esc(it.name)}</b>${it.description ? `<div class="sub" style="margin:1px 0 0">${esc(it.description)}</div>` : ''}</div><span class="pr">${esc(fmtPrice(it.price, it.unit))}</span></div>`).join('')}</div>`
    : `${head(TABNAME[cat] === 'Activités' ? 'Nos activités' : 'Nos services')}<div class="sxtiles t4">${its.slice(0, 4).map(it => tile(it)).join('')}</div>`;
}

/* ---------- bouton d'action du bas ---------- */
export const CTAS = {
  hotel: ['Demander une réservation', 'cal', 'chat', 'Bonjour, je souhaite réserver une chambre.\nDates : \nNombre de personnes : '],
  restaurant: ['Réserver une table', 'cal', 'chat', 'Bonjour, je souhaite réserver une table.\nDate et heure : \nNombre de personnes : ', true],
  pharmacie: ['Appeler maintenant', 'phone', 'tel'], hopital: ['Appeler l’hôpital', 'phone', 'tel', null, false, 'Ou prendre rendez-vous (non urgent)', 'Bonjour, je souhaite prendre rendez-vous.\nSpécialité : \nDate souhaitée : '],
  admin: ['Contacter la mairie', 'phone', 'tel'], banque: ['Contacter l’agence', 'cal', 'chat', 'Bonjour, je souhaite un rendez-vous.\nMotif : \nDate souhaitée : '],
  commerce: ['Passer commande', 'cart', 'chat', 'Bonjour, je souhaite commander :\n'], universite: ['Demander une inscription', 'edit', 'chat', 'Bonjour, je souhaite m’inscrire.\nFilière : \nNiveau : '],
  ecole: ['Demander une inscription', 'edit', 'chat', 'Bonjour, je souhaite inscrire mon enfant.\nNiveau : \nRentrée : '], transport: ['Réserver un véhicule', 'cal', 'chat', 'Bonjour, je souhaite réserver.\nDépart : \nDestination : \nDate : '],
  btp: ['Demander un devis gratuit', 'clip', 'chat', 'Bonjour, je souhaite un devis.\nProjet : \nBudget : '], station: ['S’y rendre à la station', 'fuel', 'dir'],
  voyage: ['Demander une réservation', 'cal', 'chat', 'Bonjour, je souhaite réserver un voyage.\nDestination : \nDates : '],
  garage: ['Prendre rendez-vous', 'cal', 'chat', 'Bonjour, je souhaite un rendez-vous pour mon véhicule.\nProblème : \nDate souhaitée : '], salon: ['Prendre rendez-vous', 'cal', 'chat', 'Bonjour, je souhaite un rendez-vous.\nService : \nDate et heure : ']
};
export const ctaIcon = k => k === 'phone' ? I.phone : k === 'edit' ? I.edit : P[k] || P.cal;

/* ---------- carrousel photo du haut ---------- */
export const heroCarousel = (photos, badge) => photos.length ? `<div class="dph car" id="car"><div class="cs" id="cs">${photos.map(u => `<div style="background:center/cover url('${esc(u)}')"></div>`).join('')}</div>${badge || ''}${photos.length > 1 ? `<div class="cdots" id="cdots">${photos.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div><span class="ccnt" id="ccnt">${svg(I.img, 16, '#fff', 2)} 1/${photos.length}</span>` : ''}</div>` : '';

export const SECTAGS = {
  hotel: ['Wi-Fi gratuit', 'Climatisation', 'Restaurant', 'Parking sécurisé', 'Sécurité 24h/24', 'Piscine', 'Chambres disponibles'],
  restaurant: ['Wi-Fi', 'Parking', 'Livraison', 'Paiement mobile', 'Terrasse', 'Climatisation'],
  pharmacie: ['Garde 24/24', 'Livraison', 'Paiement mobile'],
  commerce: ['Livraison à Bangui', 'Produits garantis', 'Paiement sécurisé', 'Paiement mobile'],
  hopital: ['Urgences 24h/24', 'Parking', 'Ambulance', 'Maternité'],
  universite: ['Inscriptions ouvertes', 'Wi-Fi', 'Bibliothèque', 'Année 2026–2027'],
  ecole: ['Inscriptions ouvertes', 'Cantine', 'Transport scolaire'],
  banque: ['Distributeur 24h/24', 'Parking', 'Change'],
  admin: ['Sur rendez-vous', 'Accès handicapés'],
  transport: ['Avec chauffeur', 'Véhicules assurés', 'Bien entretenus', 'Réservation rapide', 'Service 24h/24'],
  btp: ['Devis gratuit', 'Chantiers garantis'],
  station: ['Boutique', 'Lavage auto', 'Service 24h/24'],
  voyage: ['Assistance visa', 'Paiement mobile']
};
export const PH = { hotel: ['Chambre Standard', 'nuit'], restaurant: ['Poulet braisé', ''], pharmacie: ['Médicaments', ''], commerce: ['Smartphones', ''], hopital: ['Maternité', ''], universite: ['Licence Informatique', 'an'], ecole: ['Primaire', 'an'], banque: ['Cartes bancaires', ''], admin: ['Actes de naissance', ''], transport: ['Berline (4 places)', 'course'], btp: ['Conception de plans', ''], station: ['Essence', 'litre'], voyage: ['Bangui – Douala', ''], garage: ['Vidange', ''], salon: ['Coupe homme', ''] };
