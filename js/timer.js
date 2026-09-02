// Trainingstimer. Start alleen als jij hem start: nergens in de app wordt hij
// automatisch aangezet. De stand overleeft een herlaadbeurt, want een telefoon
// die in je zak in slaap valt of een tab die ververst mag je tijd niet wissen.

const SLEUTEL = 'gymtracker:timer';

let verstreken = 0;      // milliseconden die al geteld zijn
let sinds = null;        // moment waarop de huidige loop begon, of null bij pauze
let tik = null;
let opWijziging = () => {};

// Een training duurt geen halve dag. Loopt de timer langer, dan is hij vergeten
// aan te zetten of aan te laten staan; die tijd is onzin en zou als "duur" in het
// logboek belanden. Zulke standen gooien we weg in plaats van ze te bewaren.
const MAX_DUUR = 6 * 60 * 60 * 1000;

// Stand terughalen na een herlaadbeurt.
try {
  const bewaard = JSON.parse(localStorage.getItem(SLEUTEL) || 'null');
  if (bewaard) {
    const zou = (bewaard.verstreken ?? 0) +
      (bewaard.sinds ? Date.now() - bewaard.sinds : 0);
    if (zou <= MAX_DUUR) {
      verstreken = bewaard.verstreken ?? 0;
      sinds = bewaard.sinds ?? null;
    }
  }
} catch { /* beschadigde stand negeren we */ }

function schrijf() {
  try { localStorage.setItem(SLEUTEL, JSON.stringify({ verstreken, sinds })); }
  catch { /* opslag vol of geblokkeerd: de timer werkt gewoon door */ }
}

export const loopt = () => sinds !== null;
export const tijd = () => verstreken + (sinds ? Date.now() - sinds : 0);

export function bij(callback) {
  opWijziging = callback;
  if (sinds && !tik) tik = setInterval(opWijziging, 250);  // liep nog door
}

export function start() {
  if (sinds) return;
  sinds = Date.now();
  tik = setInterval(opWijziging, 250);
  schrijf();
  opWijziging();
}

export function pauzeer() {
  if (!sinds) return;
  verstreken += Date.now() - sinds;
  sinds = null;
  clearInterval(tik); tik = null;
  schrijf();
  opWijziging();
}

export function nul() {
  clearInterval(tik); tik = null;
  verstreken = 0;
  sinds = null;
  schrijf();
  opWijziging();
}

/** Milliseconden als uu:mm:ss, voor de kopbalk. */
export function format(ms = tijd()) {
  const s = Math.floor(ms / 1000);
  return [s / 3600, (s % 3600) / 60, s % 60]
    .map(n => String(Math.floor(n)).padStart(2, '0')).join(':');
}

/** Milliseconden als "1 u 12 min" of "48 min", voor het logboek. */
export function kort(ms) {
  const min = Math.round(ms / 60000);
  if (min < 1) return 'korter dan een minuut';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} u ${String(min % 60).padStart(2, '0')} min`;
}
