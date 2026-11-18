export const CATS = [
  ['restaurant','Restaurants','#E2541F','#FFF1E8'],['hotel','Hôtels','#2A4A8A','#EAF1FF'],
  ['pharmacie','Pharmacies','#1E7A43','#EAF8EF'],['banque','Banques','#6B3FA0','#F3EEFF'],
  ['hopital','Santé','#C23B3B','#FFF1F0'],['ecole','Écoles','#B5560C','#FFF8E6'],
  ['universite','Universités','#2A4A8A','#EAF1FF'],['transport','Transport','#0E8A8A','#E9F7F7'],
  ['admin','Administration','#142A52','#EAEEF7'],['culte','Lieux de culte','#6B3FA0','#F3EEFF'],
  ['commerce','Commerces','#B5560C','#FFF8E6'],['salon','Salons','#C2417A','#FFEFF6'],
  ['garage','Garages','#3A3F52','#F1F2F6'],['btp','BTP','#B5560C','#FFF4E6'],
  ['voyage','Voyages','#0E8A8A','#E9F7F7'],['organisation','Organisations','#2E9E5B','#EAF8EF']
].map(([id,label,fg,bg]) => ({ id, label, fg, bg }));
export const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
export const QUARTIERS = ['Centre-ville','Avenue de l’Indépendance','Lakouanga','Km5','Boganda','Bangui M’Poko','Koudoukou','Bimbo','Bégoua','Gobongo','Fatima','Miskine','Castors','Ouango','Autre'];
