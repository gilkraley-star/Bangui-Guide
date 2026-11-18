import './style.css';
import { App as CapApp } from '@capacitor/app';
import { configured } from './core.js';
import { runLeave } from './ui.js';
import { home } from './screens/home.js';
import { search, categories, favsPage } from './screens/explore.js';
import { mapScreen } from './screens/map.js';
import { place } from './screens/place.js';
import { messages, chat } from './screens/messages.js';
import { profil } from './screens/profile.js';
import { agent, newPlace, syncQueue } from './screens/agent.js';
import { manageList, manage } from './screens/manage.js';

function route() {
  runLeave();
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
