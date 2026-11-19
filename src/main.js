import './style.css';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { configured } from './core.js';
import { runLeave } from './ui.js';
import { home } from './screens/home.js';
import { search, categories, favsPage } from './screens/explore.js';
import { mapScreen } from './screens/map.js';
import { place } from './screens/place.js';
import { messages, chat } from './screens/messages.js';
import { claim, adminClaims } from './screens/claims.js';
import { profil } from './screens/profile.js';
import { agent, newPlace, syncQueue } from './screens/agent.js';
import { manageList, manage } from './screens/manage.js';

function route() {
  runLeave();
  const ap = document.getElementById('app'); if (ap) { ap.classList.remove('pg'); void ap.offsetWidth; ap.classList.add('pg'); }
  const [path, qs] = (location.hash.slice(1) || '/').split('?'), params = new URLSearchParams(qs || '');
  let m;
  if (path === '/' || path === '') home();
  else if (path === '/search') search(params);
  else if (path === '/categories') categories();
  else if (path === '/map') mapScreen();
  else if ((m = path.match(/^\/place\/([\w-]+)$/))) place(m[1]);
  else if (path === '/messages') messages();
  else if ((m = path.match(/^\/chat\/([\w-]+)$/))) chat(m[1]);
  else if (path === '/profil') profil();
  else if (path === '/favs') favsPage();
  else if (path === '/agent') agent();
  else if (path === '/claim') claim();
  else if ((m = path.match(/^\/claim\/([\w-]+)$/))) claim(m[1]);
  else if (path === '/admin') adminClaims();
  else if (path === '/agent/new') newPlace();
  else if (path === '/manage') manageList();
  else if ((m = path.match(/^\/manage\/([\w-]+)$/))) manage(m[1]);
  else home();
}
addEventListener('hashchange', route);
addEventListener('online', () => { if (configured) syncQueue().catch(() => { }); });
const back = CapApp.addListener('backButton', () => { const h = location.hash; (!h || h === '#/' || h === '#') ? CapApp.exitApp() : history.back(); });
back?.catch?.(() => { });
route();

/* retour tactile : léger tremblement sur les boutons, onglets, cartes */
document.addEventListener('pointerdown', e => { if (e.target.closest('.btn,.nav a,.gi,.row2,.zc,.fc,.back,.tabs button,.cv')) Haptics.impact({ style: ImpactStyle.Light }).catch(() => { }); }, { passive: true });
setTimeout(() => SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => { }), 350);
