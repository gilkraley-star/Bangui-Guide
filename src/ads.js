import { esc, svg } from './core.js';
import { spBadge } from './ui.js';

/* Une publicité = soit une image « affiche » mise au format de la bannière, soit un texte + une image à côté. */
export const adHref = a => a.place_id ? `#/place/${a.place_id}` : a.link_url ? (/^(https?:|tel:|mailto:)/.test(a.link_url) ? a.link_url : /^\+?[\d\s.]{6,}$/.test(a.link_url) ? 'tel:' + a.link_url.replace(/[^\d+]/g, '') : 'https://' + a.link_url) : '';
export const adHtml = (a, preview = false) => {
  const href = adHref(a), ext = href && !href.startsWith('#'), attrs = preview ? '' : href ? ` href="${esc(href)}"${ext ? ' data-ext="1"' : ''}` : '';
  const img = a.image_url ? `background-image:url('${esc(a.image_url)}')!important` : '';
  if (a.model === 'image') return `<a class="banner adimg"${attrs} style="${img}">${a.image_url ? '' : '<span class="adph">Ajoutez l’image de la pub</span>'}<span class="adtag">Sponsorisé</span></a>`;
  return `<a class="banner adtxt"${attrs}><div class="bl"><div class="adpic" style="${img}"></div>${spBadge(true)}</div>
    <div class="br"><div class="nm" style="font-size:17px;line-height:1.15">${esc(a.title || 'Titre de la pub')}</div>${a.body ? `<div style="font-size:12.5px;opacity:.92;line-height:1.25">${esc(a.body)}</div>` : ''}<span class="bb">${esc(a.cta || 'Découvrir')} ${svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 15, '#3A1646', 2.5)}</span></div></a>`;
};
export const bindAds = root => root.querySelectorAll('a[data-ext]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.open(a.href, a.href.startsWith('http') ? '_system' : '_self'); }));

export const adLive = a => { const d = new Date().toISOString().slice(0, 10); return a.active !== false && (!a.starts_on || a.starts_on <= d) && (!a.ends_on || a.ends_on >= d); };
