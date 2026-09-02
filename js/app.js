import { EXERCISES, INVENTARIS, STANDAARD_AANWEZIG, SPIERGROEPEN, byId, beschikbaar,
         apparatuurNamen, zoek } from './exercises.js';
import { maakSchema, volgendDoel, volume, e1rm, schemaTrouw, frequentieTrouw,
         werk, oefeningTotalen, workoutTotalen, setsPerSpier, geplandPerSpier,
         blokken, huidigeStand, looptijd, heeftBlokken } from './plan.js';
import { maakStore, bestaandeGebruikers, config, opslagSoort } from './store.js';
import { lijn, staven } from './charts.js';
import * as timer from './timer.js';
import * as video from './video.js';
import { maakPrompt, leesSchema } from './schemaprompt.js';

let store, data, cfg;
// Eén oefening tegelijk open, en de ingevulde sets los van het scherm: een
// dichtgeklapte tegel bestaat niet meer in de DOM, dus wat je typte moet ergens
// anders staan of het is weg.
let openOefening = null;              // id van de oefening die openstaat
let ingevoerd = new Map();            // oefening-id -> [{gewicht, reps, opwarm}]
let gekozenDagIndex = null;           // welke schemadag je deze keer doet
let bibliotheekFilter = '';           // zoekterm in Alle oefeningen

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const datumNL = d => new Date(d + 'T12:00:00')
  .toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
const kort = d => new Date(d + 'T12:00:00')
  .toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' });

// ---------- opstarten ----------

async function start() {
  cfg = config.lees();
  if (!cfg.gebruiker) return toonAanmelden();
  store = maakStore(cfg);
  try {
    data = await store.laden();
  } catch (e) {
    melding(`Kon de spreadsheet niet bereiken: ${e.message}. Probeer het zo opnieuw.`);
    data = { profiel: null, schema: null, workouts: [], apparatuur: [] };
  }
  migreer();
  if (!data.apparatuur?.length) { data.apparatuur = [...STANDAARD_AANWEZIG]; await bewaar(); }

  $('#aanmelden').hidden = true;
  $('#app').hidden = false;
  $('#huidige-gebruiker').textContent = cfg.gebruiker;
  timer.bij(toonTimer);
  toonTimer();
  ganaarTab(location.hash.slice(1) || 'workout');
}

/** Oudere data had geen datum-only veld, status of volgorde. */
function migreer() {
  let veranderd = false;
  for (const w of data.workouts ?? []) {
    if (w.datum?.length > 10) { w.datum = datumSleutel(w.datum); veranderd = true; }
    if (w.status !== 'gedaan') { w.status = 'gedaan'; veranderd = true; }
    if (w.volgorde != null) { delete w.volgorde; veranderd = true; }
  }
  if (veranderd) bewaar();
}

async function bewaar() {
  try { await store.opslaan(data); }
  catch (e) { melding(`Opslaan mislukt: ${e.message}`); }
}

async function toonAanmelden() {
  $('#aanmelden').hidden = false;
  $('#app').hidden = true;
  const lijstEl = $('#bestaande-gebruikers');
  const namen = await bestaandeGebruikers();
  lijstEl.innerHTML = '';
  lijstEl.hidden = namen.length === 0;
  namen.forEach(n => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = n;
    b.onclick = () => kiesGebruiker(n);
    lijstEl.append(b);
  });
}

function kiesGebruiker(naam) {
  config.schrijf({ ...config.lees(), gebruiker: naam });
  start();
}

function ganaarTab(naam) {
  location.hash = naam;
  $$('.tab').forEach(t => t.classList.toggle('actief', t.dataset.tab === naam));
  $$('.scherm').forEach(s => (s.hidden = s.id !== 'scherm-' + naam));
  ({ workout: rendWorkout, oefeningen: rendBibliotheek, log: rendLog,
     progressie: rendProgressie, schema: rendSchema,
     instellingen: rendInstellingen }[naam] ?? rendWorkout)();
}

// ---------- hulpmiddelen ----------

const vandaag = () => new Date().toISOString().slice(0, 10);

const gedaanLijst = () => (data.workouts ?? [])
  .filter(w => w.status === 'gedaan')
  .sort((a, b) => a.datum.localeCompare(b.datum));

/** De laatst afgeronde workout, voor de regel bovenin het workoutscherm. */
const laatsteGedaan = () => gedaanLijst().at(-1) ?? null;

/** Welke schemadag ligt voor de hand: de volgende in de rotatie. */
/** Het blok waarin je nu zit, plus in welke week daarvan. */
const stand = () => huidigeStand(data.schema, data.workouts ?? []);

/** De trainingsdagen van dat blok. */
const huidigeDagen = () => stand()?.blok.dagen ?? [];

function voorgesteldeDag() {
  const dagen = huidigeDagen();
  if (!dagen.length) return 0;
  const laatste = laatsteGedaan();
  return laatste?.dagIndex != null ? (laatste.dagIndex + 1) % dagen.length : 0;
}

const actieveDagIndex = () => gekozenDagIndex ?? voorgesteldeDag();

// ---------- workoutscherm ----------

function rendWorkout() {
  const doel = $('#scherm-workout');
  const dagen = huidigeDagen();
  if (!dagen.length) {
    doel.innerHTML = `<div class="kaart"><div class="leeg-kaart">
      <h2>Nog geen schema</h2>
      <p class="sub">Maak eerst een schema; daarna kies je hier je workout.</p>
      <div style="margin-top:1rem"><button class="knop primair" id="naar-schema">Schema opstellen</button></div>
    </div></div>`;
    $('#naar-schema').onclick = () => ganaarTab('schema');
    return;
  }

  const idx = Math.min(actieveDagIndex(), dagen.length - 1);
  const dag = dagen[idx];
  const vorige = laatsteGedaan();
  const st = stand();

  doel.innerHTML = `
    <div class="kaart">
      <div class="kaart-kop"><div>
        <h2>Workout</h2>
        <p class="sub">${vorige
          ? `Laatst gedaan: <strong>${vorige.dagNaam}</strong> op ${datumNL(vorige.datum)}`
          : 'Nog geen workout afgerond.'}</p>
      </div></div>
      ${st && st.aantal > 1 ? `<div class="blokbalk">
        <span class="blokmerk">Blok ${st.index + 1} van ${st.aantal}</span>
        <span><strong>${st.blok.naam}</strong>${st.wekenInBlok
          ? ` &middot; week ${st.weekInBlok} van ${st.wekenInBlok}` : ''}
          ${st.blok.focus ? `<br><span class="sub">${st.blok.focus}</span>` : ''}</span>
      </div>` : ''}
      <div class="dagkeuze" role="tablist" aria-label="Kies je workout">
        ${dagen.map((d, i) => `
          <button role="tab" aria-selected="${i === idx}" class="${i === idx ? 'actief' : ''}"
            data-dag="${i}">${d.naam}
            ${i === voorgesteldeDag() ? '<span class="tip">volgende</span>' : ''}</button>`).join('')}
      </div>
    </div>
    <div id="blokken"></div>
    <div class="kaart" id="samenvatting"></div>
    <div class="acties"><button class="knop primair" id="bewaar-workout">Workout afronden</button></div>`;

  $$('.dagkeuze button').forEach(b => (b.onclick = () => {
    if (ingevoerd.size && !confirm('Je wisselt van dag; wat je hebt ingevuld gaat verloren. Doorgaan?')) return;
    gekozenDagIndex = parseInt(b.dataset.dag, 10);
    openOefening = null;
    ingevoerd.clear();
    rendWorkout();
  }));

  const houder = $('#blokken');
  dag.oefeningen.forEach(plan => houder.append(oefeningBlok(plan)));
  werkTotalenBij();

  $('#bewaar-workout').onclick = () => bewaarWorkout(idx, dag);
}

// ---------- oefeningblok: dicht is een tegel, open zijn het de sets ----------

function oefeningBlok(plan) {
  const ex = byId(plan.oefening);
  const eenheid = ex?.eenheid === 'sec' ? 'sec' : 'reps';
  const laatste = laatsteUitvoering(plan.oefening);
  const streef = volgendDoel(plan.oefening, laatste, plan);
  const b = ex && video.bron(ex);
  const uit = openOefening === plan.oefening;

  const blok = document.createElement('div');
  blok.className = 'kaart oefening';
  blok.dataset.oefening = plan.oefening;
  blok.innerHTML = `
    <button class="blok-kop" aria-expanded="${uit}">
      <span class="pijl">${uit ? '&#9662;' : '&#9656;'}</span>
      <span class="blok-titel">
        <strong>${ex?.naam ?? plan.oefening}</strong>
        <span class="sub">${plan.sets}&times;${plan.min}-${plan.max}${
          eenheid === 'sec' ? ' sec' : ''}${
          streef && streef.gewicht > 0 ? ` &middot; ${streef.gewicht} kg` : ''}</span>
      </span>
      <span class="blok-stand" data-stand></span>
    </button>
    <div class="blok-body" ${uit ? '' : 'hidden'}></div>`;

  blok.querySelector('.blok-kop').onclick = () => {
    // Openen sluit de vorige; de invoer daarvan staat al in `ingevoerd`.
    openOefening = uit ? null : plan.oefening;
    rendWorkout();
    if (openOefening) {
      $(`#blokken [data-oefening="${CSS.escape(openOefening)}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };
  if (uit) vulOefeningBody(blok.querySelector('.blok-body'), plan, ex, streef, b, eenheid);
  return blok;
}

function vulOefeningBody(body, plan, ex, streef, b, eenheid = 'reps') {
  body.innerHTML = `
    <p class="context">${streef
      ? `${streef.gewicht > 0 ? `Streef <strong>${streef.gewicht} kg</strong> &middot; ` : ''}${
          { omhoog: 'verhoogd, vorige keer alles gehaald',
            deload: 'verlaagd, vorige keer te zwaar',
            gelijk: 'zelfde gewicht, probeer een rep meer',
            plafond: `zwaarste dumbbell, ga naar ${streef.reps} reps` }[streef.reden]}`
      : 'Eerste keer: zoek een gewicht waarbij de laatste reps zwaar zijn.'}
      <br><span class="sub">${plan.sets} werksets van ${plan.min}-${plan.max} ${eenheid} &middot;
      ${plan.rust}s rust &middot; stop ${plan.rir} reps voor falen${
        ex ? ` &middot; traint ${SPIERNAAM[ex.spier] ?? ex.spier}` : ''}</span></p>
    ${b ? '<div class="video-plek"></div><button class="rij-knop" data-video><span class="plus">&#9654;</span>Uitleg bekijken</button>' : ''}
    <button class="rij-knop" data-opwarm><span class="plus">+</span>Warming-up</button>
    <table class="sets"><tbody></tbody></table>
    <button class="rij-knop" data-set><span class="plus">+</span>Set</button>`;

  const tbody = body.querySelector('tbody');
  const eerder = ingevoerd.get(plan.oefening);
  if (eerder?.length) {
    // Terug van weggeweest: precies tonen wat je eerder had ingevuld.
    eerder.forEach(s => tbody.append(setRij(s.gewicht || '', s.reps || '', s.opwarm, eenheid, true)));
  } else {
    for (let i = 0; i < plan.sets; i++) {
      tbody.append(setRij(streef?.gewicht, streef?.reps ?? plan.min, false, eenheid));
    }
  }

  if (b) body.querySelector('[data-video]').onclick = e => {
    const plek = body.querySelector('.video-plek');
    if (plek.firstChild) { plek.replaceChildren(); e.currentTarget.classList.remove('aan'); }
    else { plek.append(video.speler(b)); e.currentTarget.classList.add('aan'); }
  };
  body.querySelector('[data-opwarm]').onclick = () => {
    const rij = setRij(streef ? Math.round(streef.gewicht * 0.5) : '', '', true, eenheid);
    const laatsteOpwarm = [...tbody.children].filter(r => r.classList.contains('is-opwarm')).pop();
    laatsteOpwarm ? laatsteOpwarm.after(rij) : tbody.prepend(rij);
    hernummer(body); ingevoerd.set(plan.oefening, leesSets(body)); werkTotalenBij();
  };
  body.querySelector('[data-set]').onclick = () => {
    tbody.append(setRij(streef?.gewicht, streef?.reps ?? plan.min, false, eenheid));
    hernummer(body); ingevoerd.set(plan.oefening, leesSets(body)); werkTotalenBij();
  };
  const onthoud = () => {
    ingevoerd.set(plan.oefening, leesSets(body));
    werkTotalenBij();
  };
  body.addEventListener('input', onthoud);
  body.addEventListener('click', e => {
    if (!e.target.matches('.rij-weg')) return;
    e.target.closest('tr').remove();
    hernummer(body); onthoud();
  });
  hernummer(body);
  onthoud();   // ook de voorgevulde gewichten alvast vastleggen
}

const SPIERNAAM = {
  borst: 'de borst', rug: 'de rug', quadriceps: 'de quadriceps', hamstrings: 'de hamstrings',
  bilspieren: 'de bilspieren', kuiten: 'de kuiten', voordelt: 'de voorste schouder',
  zijdelt: 'de zijkant van de schouder', achterdelt: 'de achterste schouder',
  biceps: 'de biceps', triceps: 'de triceps', trapezius: 'de trapezius',
  onderarmen: 'de onderarmen', buik: 'de buik',
};

function setRij(gewicht, reps, opwarm, eenheid = 'reps', ingevuldeWaarde = false) {
  const tr = document.createElement('tr');
  if (opwarm) tr.className = 'is-opwarm';
  tr.innerHTML = `
    <td class="setnr"></td>
    <td class="veld"><label>
      <input type="number" step="0.25" min="0" inputmode="decimal" class="in-gewicht"
        value="${gewicht ?? ''}" aria-label="Gewicht"><span class="eenheid">kg</span></label></td>
    <td class="veld"><label>
      <input type="number" step="1" min="0" inputmode="numeric" class="in-reps"
        ${ingevuldeWaarde ? `value="${reps ?? ''}"` : `placeholder="${reps ?? ''}"`}
        aria-label="${eenheid === 'sec' ? 'Seconden' : 'Reps'}"><span class="eenheid">${eenheid}</span></label></td>
    <td class="acties-cel"><button class="rij-weg" title="Set verwijderen" aria-label="Set verwijderen">&times;</button></td>`;
  return tr;
}

function hernummer(wortel) {
  let n = 0;
  wortel.querySelectorAll('tbody tr').forEach(tr => {
    const cel = tr.querySelector('.setnr');
    if (tr.classList.contains('is-opwarm')) cel.innerHTML = '<span class="opwarm-teken">W</span>';
    else cel.textContent = ++n;
  });
}

function laatsteUitvoering(oefeningId) {
  const eerder = gedaanLijst();
  for (let i = eerder.length - 1; i >= 0; i--) {
    const o = eerder[i].oefeningen.find(x => x.oefening === oefeningId);
    if (werk(o?.sets).length) return o;
  }
  return null;
}

function leesSets(blok) {
  return [...blok.querySelectorAll('tbody tr')].map(tr => ({
    gewicht: parseFloat(tr.querySelector('.in-gewicht').value) || 0,
    reps: parseInt(tr.querySelector('.in-reps').value, 10) || 0,
    opwarm: tr.classList.contains('is-opwarm'),
  }));
}

/** Wat er nu in de open blokken staat; dichte blokken houden hun eerdere invoer niet vast. */
/**
 * Wat er nu is ingevuld, gelezen uit `ingevoerd` in plaats van uit het scherm.
 * Alleen de open tegel bestaat in de DOM; de rest zou anders leeg lijken.
 */
function huidigeOefeningen() {
  return (huidigeDagen()[Math.min(actieveDagIndex(), huidigeDagen().length - 1)]?.oefeningen ?? [])
    .map(plan => ({
      oefening: plan.oefening,
      sets: (ingevoerd.get(plan.oefening) ?? []).filter(s => s.reps > 0),
    }));
}

function werkTotalenBij() {
  const oefeningen = huidigeOefeningen();
  // Stand per tegel, zodat je ook dichtgeklapt ziet wat er al staat.
  $$('#blokken .oefening').forEach(blok => {
    const o = oefeningen.find(x => x.oefening === blok.dataset.oefening);
    const t = oefeningTotalen(o?.sets ?? []);
    const el = blok.querySelector('[data-stand]');
    el.textContent = t.sets ? `${t.sets} sets` : '';
    el.className = 'blok-stand' + (t.sets ? ' gevuld' : '');
  });
  const t = workoutTotalen(oefeningen);
  const bezig = timer.tijd();
  $('#samenvatting').innerHTML = `
    <div class="kaart-kop"><h3>Samenvatting</h3>
      ${bezig > 0 ? `<span class="sub">${timer.kort(bezig)} bezig</span>` : ''}</div>
    <dl class="totalen" style="border-top:0">
      <div><dt>Totaal gewicht</dt><dd>${format(t.gewicht)}</dd></div>
      <div><dt>Totaal sets</dt><dd>${t.sets}</dd></div>
      <div><dt>Totaal reps</dt><dd>${t.reps}</dd></div>
    </dl>`;
}

function format(kg) {
  return kg >= 1000
    ? `${(kg / 1000).toFixed(1).replace('.', ',')}<small>ton</small>`
    : `${Math.round(kg)}<small>kg</small>`;
}

/** Afronden: de workout gaat met de datum van vandaag naar het logboek. */
async function bewaarWorkout(dagIndex, dag) {
  const oefeningen = huidigeOefeningen().filter(o => werk(o.sets).length > 0);
  if (!oefeningen.length) return melding('Nog geen sets ingevuld. Klap een oefening open en vul je sets in.');

  const workout = {
    id: crypto.randomUUID(),
    datum: vandaag(),
    dagIndex, dagNaam: dag.naam,
    status: 'gedaan',
    oefeningen,
  };
  workout.trouw = schemaTrouw(workout, dag);
  // De tijd die de timer heeft geteld gaat mee het logboek in. Stond hij nooit
  // aan, dan slaan we niets op in plaats van een misleidende nul.
  timer.pauzeer();
  const duur = timer.tijd();
  if (duur > 0) workout.duur = duur;

  data.workouts = [...(data.workouts ?? []), workout];
  await bewaar();
  timer.nul();
  openOefening = null;
  ingevoerd.clear();
  gekozenDagIndex = null;
  melding(`${dag.naam} afgerond${duur > 0 ? ` in ${timer.kort(duur)}` : ''} en in het logboek gezet: ${workout.trouw.duiding}.`);
  ganaarTab('log');
}

// ---------- logboek ----------

function rendLog() {
  const doel = $('#scherm-log');
  const alles = gedaanLijst().reverse();
  if (!alles.length) {
    doel.innerHTML = '<div class="kaart"><div class="leeg-kaart"><p class="sub">Nog geen workouts afgerond.</p></div></div>';
    return;
  }
  doel.innerHTML = `<div class="kaart">
    <div class="kaart-kop"><h2>Logboek</h2>
      <span class="sub">${alles.length} workouts</span></div>
    <div id="loglijst"></div></div>`;
  const houder = $('#loglijst');

  alles.forEach(w => {
    const t = w.trouw ?? { pct: 0, duiding: 'Vrije training' };
    const tot = workoutTotalen(w.oefeningen);
    const d = document.createElement('details');
    d.className = 'logitem';
    d.innerHTML = `
      <summary>
        <span class="datum">${datumNL(w.datum)}</span>
        <span class="naam">${w.dagNaam}</span>
        <span class="badge ${t.pct >= 95 ? 'goed' : t.pct >= 70 ? 'ok' : ''}">${t.duiding}</span>
        ${w.duur ? `<span class="duur sub">${timer.kort(w.duur)}</span>` : ''}
      </summary>
      <div class="detail">
        <table><tbody>${w.oefeningen.map(o => `
          <tr><th>${byId(o.oefening)?.naam ?? o.oefening}</th>
          <td>${werk(o.sets).map(x => `${x.gewicht}&times;${x.reps}`).join('  ')}</td></tr>`).join('')}
        </tbody></table>
        <dl class="totalen" style="margin-top:.75rem;border-radius:var(--radius-klein)">
          <div><dt>Volume</dt><dd>${format(volume(w))}</dd></div>
          <div><dt>Sets</dt><dd>${tot.sets}</dd></div>
          <div><dt>Reps</dt><dd>${tot.reps}</dd></div>
          ${w.duur ? `<div><dt>Duur</dt><dd>${Math.round(w.duur / 60000)}<small>min</small></dd></div>` : ''}
        </dl>
        <div style="margin-top:.75rem">
          <button class="knop klein stil" data-verwijder="${w.id}">Verwijderen</button></div>
      </div>`;
    houder.append(d);
  });

  $$('[data-verwijder]').forEach(b => (b.onclick = async () => {
    if (!confirm('Deze workout verwijderen?')) return;
    data.workouts = data.workouts.filter(w => w.id !== b.dataset.verwijder);
    await bewaar();
    rendLog();
  }));
}

// ---------- alle oefeningen ----------

function rendBibliotheek() {
  const doel = $('#scherm-oefeningen');
  const mogelijk = beschikbaar(data.apparatuur ?? []);
  const treffers = zoek(bibliotheekFilter, mogelijk);

  const perSpier = Object.entries(SPIERGROEPEN)
    .map(([spier, label]) => [spier, label, treffers.filter(o => o.spier === spier)])
    .filter(([, , lijst]) => lijst.length);

  doel.innerHTML = `
    <div class="kaart">
      <div class="kaart-kop"><div>
        <h2>Alle oefeningen</h2>
        <p class="sub">${treffers.length}${treffers.length !== mogelijk.length ? ` van ${mogelijk.length}` : ''}
          oefeningen die kunnen met de apparatuur die aanstaat, elk met de uitlegvideo.</p>
      </div></div>
      <div class="kaart-body" style="padding-top:0">
        <input id="zoek" type="search" placeholder="Zoek op naam, spiergroep of apparaat"
          value="${bibliotheekFilter}" aria-label="Zoeken">
      </div>
    </div>
    ${perSpier.map(([spier, label, lijst]) => `
      <div class="kaart">
        <div class="kaart-kop"><h3>${label}</h3><span class="sub">${lijst.length}</span></div>
        <div class="biblijst">
          ${lijst.map(o => `
            <div class="bibitem" data-oefening="${o.id}">
              <button class="blok-kop">
                <span class="pijl">&#9656;</span>
                <span class="blok-titel"><strong>${o.naam}</strong>
                  <span class="sub">${o.type}${o.equipment.length ? ' &middot; ' + apparatuurNamen(o).join(' &middot; ') : ' &middot; eigen lichaamsgewicht'}</span></span>
              </button>
              <div class="blok-body" hidden></div>
            </div>`).join('')}
        </div>
      </div>`).join('') ||
      '<div class="kaart"><div class="leeg-kaart"><p class="sub">Niets gevonden.</p></div></div>'}`;

  $('#zoek').oninput = e => {
    bibliotheekFilter = e.target.value;
    rendBibliotheek();
    const v = $('#zoek');
    v.focus();
    v.setSelectionRange(v.value.length, v.value.length);
  };

  // Er staat er altijd hoogstens één open, zodat er nooit meer dan één iframe
  // geladen is; sluiten gooit het iframe echt weg in plaats van het te verbergen.
  const sluit = item => {
    const body = item.querySelector('.blok-body');
    body.replaceChildren();
    body.hidden = true;
    item.classList.remove('open');
    const kop = item.querySelector('.blok-kop');
    kop.querySelector('.pijl').innerHTML = '&#9656;';
    kop.setAttribute('aria-expanded', 'false');
  };

  $$('.bibitem .blok-kop').forEach(kop => (kop.onclick = () => {
    const item = kop.closest('.bibitem');
    const wasOpen = item.classList.contains('open');
    $$('.bibitem.open').forEach(sluit);
    if (wasOpen) return;

    const ex = byId(item.dataset.oefening);
    const body = item.querySelector('.blok-body');
    body.replaceChildren(video.speler(video.bron(ex)));
    body.hidden = false;
    item.classList.add('open');
    kop.querySelector('.pijl').innerHTML = '&#9662;';
    kop.setAttribute('aria-expanded', 'true');
    item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }));
}

// ---------- progressie ----------

function rendProgressie() {
  const doel = $('#scherm-progressie');
  const gedaan = gedaanLijst();
  const oefeningen = new Set(gedaan.flatMap(w => w.oefeningen.map(o => o.oefening)));
  const keuzes = [...oefeningen];

  doel.innerHTML = `
    <div class="kaart">
      <div class="kaart-kop"><div>
        <h2>Sets per spiergroep</h2>
        <p class="sub">Werksets per week, gemiddeld over de laatste vier weken.
          De band toont 10 tot 20 sets: het bereik waar spiergroei het best op reageert.</p>
      </div></div>
      <div id="spier-tabel"></div>
    </div>
    <div class="kaart">
      <div class="kaart-kop"><div>
        <h2>Trainingsfrequentie</h2>
        <p class="sub">Per week tegen je streef van ${data.schema?.frequentie ?? '-'}&times;.</p>
      </div></div>
      <div class="kaart-body" style="padding-top:0"><div id="freq-grafiek"></div></div>
      <div id="freq-oordeel" class="oordeel" style="padding-bottom:.875rem"></div>
    </div>
    <div class="kaart">
      <div class="kaart-kop"><div>
        <h2>Kracht per oefening</h2><p class="sub">Geschatte 1RM per training.</p>
      </div></div>
      <div class="kaart-body" style="padding-top:0">
        <select id="kies-oefening" ${keuzes.length ? '' : 'disabled'}>
          ${keuzes.map(id => `<option value="${id}">${byId(id)?.naam ?? id}</option>`).join('')}
        </select>
        <div id="kracht-grafiek" style="margin-top:.75rem"></div></div>
    </div>
    <div class="kaart">
      <div class="kaart-kop"><div>
        <h2>Totaal tilvolume</h2><p class="sub">Kilo's per training.</p>
      </div></div>
      <div class="kaart-body" style="padding-top:0"><div id="volume-grafiek"></div></div>
    </div>`;

  const streef = data.schema?.frequentie ?? 3;
  const freq = frequentieTrouw(gedaan.map(w => ({ ...w, datum: w.datum + 'T12:00:00' })), streef);
  $('#freq-grafiek').append(staven(freq.map(r => ({ x: kort(r.week), y: r.aantal })), { streef }));
  const gem = freq.reduce((s, r) => s + r.aantal, 0) / (freq.length || 1);
  $('#freq-oordeel').textContent = gedaan.length === 0
    ? 'Nog geen trainingen om te beoordelen.'
    : gem >= streef - 0.25
      ? `Gemiddeld ${gem.toFixed(1).replace('.', ',')} per week: je zit op schema.`
      : `Gemiddeld ${gem.toFixed(1).replace('.', ',')} per week tegen een streef van ${streef}. Haalbaarder is een schema van ${Math.max(2, Math.round(gem))}× per week.`;

  const tekenKracht = () => {
    const id = $('#kies-oefening').value;
    const punten = gedaan
      .filter(w => w.oefeningen.some(o => o.oefening === id))
      .map(w => {
        const o = w.oefeningen.find(x => x.oefening === id);
        return { x: kort(w.datum), y: Math.max(...werk(o.sets).map(s => e1rm(s.gewicht, s.reps))) };
      })
      .filter(p => p.y > 0);
    $('#kracht-grafiek').replaceChildren(lijn(punten));
  };
  if (keuzes.length) { $('#kies-oefening').onchange = tekenKracht; tekenKracht(); }
  else $('#kracht-grafiek').append(lijn([]));

  $('#volume-grafiek').append(lijn(gedaan.map(w => ({ x: kort(w.datum), y: volume(w) }))));

  // sets per spiergroep, met wat het schema voorschrijft ernaast
  const gedaanSets = setsPerSpier(gedaan);
  const gepland = geplandPerSpier(data.schema);
  const spieren = [...new Set([...gedaanSets.map(r => r.spier), ...Object.keys(gepland)])];
  $('#spier-tabel').innerHTML = spieren.length ? `
    <table class="spiertabel">
      <thead><tr><th>Spiergroep</th><th>Gedaan</th><th>Gepland</th><th class="balk-kop">10&ndash;20 sets</th></tr></thead>
      <tbody>${spieren.map(spier => {
        const r = gedaanSets.find(x => x.spier === spier);
        const perWeek = r?.perWeek ?? 0;
        const plan = gepland[spier] ?? 0;
        // 0 tot 25 sets over de volle breedte; de band 10-20 als grijs vlak.
        const pct = v => Math.min(100, (v / 25) * 100);
        return `<tr>
          <th>${SPIERGROEPEN[spier] ?? spier}</th>
          <td class="getal">${perWeek.toFixed(1).replace('.', ',')}</td>
          <td class="getal sub">${plan || '&mdash;'}</td>
          <td class="balk-cel">
            <span class="band" style="left:${pct(10)}%;width:${pct(20) - pct(10)}%"></span>
            <span class="balk" style="width:${pct(perWeek)}%"></span>
            ${plan ? `<span class="merk" style="left:${pct(plan)}%"></span>` : ''}
          </td></tr>`;
      }).join('')}</tbody>
    </table>
    <p class="oordeel">${oordeelSpieren(gedaanSets, gepland)}</p>`
    : '<div class="leeg-kaart"><p class="sub">Nog geen sets gelogd.</p></div>';
}

/** Korte duiding: welke spiergroepen krijgen te weinig, welke te veel. */
function oordeelSpieren(gedaan, gepland) {
  if (!gedaan.length) return 'Nog geen trainingen om te beoordelen.';
  const laag = gedaan.filter(r => r.perWeek > 0 && r.perWeek < 8).map(r => SPIERGROEPEN[r.spier] ?? r.spier);
  const hoog = gedaan.filter(r => r.perWeek > 22).map(r => SPIERGROEPEN[r.spier] ?? r.spier);
  // Wat het schema voorschrijft maar wat je niet doet, is het scherpste signaal.
  const gemist = Object.keys(gepland).filter(s => !gedaan.some(r => r.spier === s && r.perWeek > 0))
    .map(s => SPIERGROEPEN[s] ?? s);

  const delen = [];
  if (gemist.length) delen.push(`Staat wel in je schema maar doe je niet: ${gemist.join(', ')}.`);
  if (laag.length) delen.push(`Onder de tien sets per week: ${laag.join(', ')}.`);
  if (hoog.length) delen.push(`Boven de twintig: ${hoog.join(', ')}.`);
  return delen.join(' ') || 'Alle getrainde spiergroepen zitten in of rond het bereik van tien tot twintig sets.';
}

// ---------- schema ----------

function rendSchema() {
  const doel = $('#scherm-schema');
  const s = data.schema;
  const p = data.profiel ?? { niveau: 'beginner', frequentie: 3, doel: 'spiermassa' };
  const mogelijk = beschikbaar(data.apparatuur ?? []).length;

  doel.innerHTML = `
    <div class="kaart">
      <div class="kaart-kop"><div>
        <h2>Schema</h2>
        <p class="sub">Je startpunt en hoe vaak je realistisch traint.</p>
      </div></div>
      <div class="kaart-body" style="padding-top:0">
        <div class="formulier">
          <label>Niveau <select id="f-niveau">${['beginner','gemiddeld','gevorderd']
            .map(n => `<option ${p.niveau === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label>Keer per week <select id="f-freq">${[2,3,4,5]
            .map(n => `<option value="${n}" ${p.frequentie == n ? 'selected' : ''}>${n}&times;</option>`).join('')}</select></label>
          <label>Doel <select id="f-doel">${['kracht','spiermassa','conditie']
            .map(n => `<option ${p.doel === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        </div>
        <p class="sub" style="margin-top:.75rem">${(data.apparatuur ?? []).length} apparaten aan &middot;
          ${mogelijk} van ${EXERCISES.length} oefeningen bruikbaar.</p>
      </div>
    </div>

    <div class="kaart">
      <div class="kaart-kop"><div>
        <h3>Laten opstellen door een AI-chat</h3>
        <p class="sub">De app kent je apparatuur en je doel, maar niet de trainingsleer.
          Kopieer de vraag, plak hem in je AI-chat, en plak het antwoord hieronder terug.</p>
      </div></div>
      <div class="kaart-body" style="padding-top:0">
        <div class="acties-inline" style="margin-top:0">
          <button class="knop" id="kopieer-prompt">Vraag kopi&euml;ren</button>
          <button class="knop klein stil" id="toon-prompt">Bekijken</button>
        </div>
        <pre id="prompt-voorbeeld" class="promptblok" hidden></pre>
        <label for="plak-schema" style="margin-top:1rem">Antwoord van de chat</label>
        <textarea id="plak-schema" rows="5"
          placeholder="Plak hier het hele antwoord, inclusief het JSON-blok"></textarea>
        <div class="acties-inline">
          <button class="knop primair" id="lees-schema" style="width:auto">Schema inlezen</button>
          <label class="knop klein" for="schema-bestand" style="margin:0;cursor:pointer">Of een bestand kiezen</label>
          <input type="file" id="schema-bestand" accept=".json,.csv,.txt,.md" hidden>
        </div>
      </div>
    </div>

    <div class="kaart">
      <div class="kaart-kop"><div>
        <h3>Zelf laten samenstellen</h3>
        <p class="sub">De app kiest oefeningen op patroon en apparatuur. Snel, maar
          zonder onderbouwing.</p>
      </div></div>
      <div class="kaart-body" style="padding-top:0">
        <button class="knop" id="genereer" style="width:100%">${s ? 'Vervangen door een eigen schema' : 'Schema samenstellen'}</button>
      </div>
    </div>

    <div id="schema-weergave"></div>`;

  const profiel = () => ({
    niveau: $('#f-niveau').value,
    frequentie: parseInt($('#f-freq').value, 10),
    doel: $('#f-doel').value,
    apparatuur: data.apparatuur ?? [],
  });

  $('#kopieer-prompt').onclick = async () => {
    const tekst = maakPrompt(profiel());
    try {
      await navigator.clipboard.writeText(tekst);
      melding(`Vraag gekopieerd (${mogelijk} oefeningen). Plak hem in je AI-chat.`);
    } catch {
      // Klembord geweigerd: toon de tekst dan maar, zodat je hem zelf kunt kopiëren.
      $('#prompt-voorbeeld').textContent = tekst;
      $('#prompt-voorbeeld').hidden = false;
      melding('Kopiëren mocht niet. De vraag staat hieronder; selecteer en kopieer zelf.');
    }
  };
  $('#toon-prompt').onclick = () => {
    const el = $('#prompt-voorbeeld');
    el.textContent = maakPrompt(profiel());
    el.hidden = !el.hidden;
  };

  $('#lees-schema').onclick = () => verwerkSchema($('#plak-schema').value);
  $('#schema-bestand').onchange = async e => {
    const bestand = e.target.files?.[0];
    if (bestand) verwerkSchema(await bestand.text());
  };

  $('#genereer').onclick = async () => {
    if (s && !confirm('Je huidige schema wordt vervangen. Doorgaan?')) return;
    const { apparatuur, ...rest } = profiel();
    data.profiel = rest;
    data.schema = maakSchema({ ...rest, apparatuur });
    await bewaar();
    rendSchema();
  };

  if (s) toonSchema(s);
}

/** Antwoord van de chat inlezen, controleren en opslaan. */
async function verwerkSchema(tekst) {
  let gelezen;
  try {
    gelezen = leesSchema(tekst);
  } catch (e) {
    return melding(e.message);
  }
  if (data.schema && !confirm('Je huidige schema wordt vervangen. Doorgaan?')) return;

  const { apparatuur, ...rest } = {
    niveau: $('#f-niveau').value,
    frequentie: parseInt($('#f-freq').value, 10),
    doel: $('#f-doel').value,
    apparatuur: data.apparatuur ?? [],
  };
  data.profiel = rest;
  data.schema = {
    ...rest,
    naam: gelezen.naam,
    bron: 'ai',
    blokken: gelezen.blokken,
    startDatum: new Date().toISOString().slice(0, 10),
    gemaaktOp: new Date().toISOString(),
  };
  await bewaar();

  const dagen = gelezen.blokken.reduce((t, b) => t + b.dagen.length, 0);
  const oef = gelezen.blokken.reduce((t, b) =>
    t + b.dagen.reduce((x, d) => x + d.oefeningen.length, 0), 0);
  const wkn = looptijd(data.schema);
  melding([
    gelezen.blokken.length > 1
      ? `${gelezen.blokken.length} blokken ingelezen${wkn ? ` (${wkn} weken)` : ''}, ${dagen} trainingsdagen, ${oef} oefeningen.`
      : `${dagen} dagen ingelezen met ${oef} oefeningen.`,
    gelezen.onbekend.length ? `Niet herkend en overgeslagen: ${gelezen.onbekend.join(', ')}.` : '',
  ].filter(Boolean).join(' '));
  rendSchema();
}

function toonSchema(s) {
  const lijst = blokken(s);
  const st = huidigeStand(s, data.workouts ?? []);
  const wkn = looptijd(s);

  $('#schema-weergave').innerHTML = `
    <div class="kaart"><div class="kaart-kop"><div>
      <h3>${s.naam ?? 'Huidig schema'}</h3>
      <p class="sub">${lijst.length > 1
        ? `${lijst.length} blokken${wkn ? ` &middot; ${wkn} weken` : ''} &middot; gestart ${
            s.startDatum ? datumNL(s.startDatum) : 'onbekend'}`
        : `${lijst[0]?.dagen.length ?? 0} dagen`} &middot; ${
        s.bron === 'ai' ? 'ingelezen uit een AI-chat' : 'door de app samengesteld'}</p>
    </div></div></div>

    ${lijst.map((blok, i) => {
      const nu = st?.index === i;
      return `<div class="kaart blok ${nu ? 'nu' : ''}">
        <button class="blok-kop" data-blok="${i}">
          <span class="pijl">&#9656;</span>
          <span class="blok-titel">
            <strong>${blok.naam}</strong>
            <span class="sub">${blok.weken ? `${blok.weken} weken &middot; ` : ''}${
              blok.dagen.length} dagen${blok.focus ? ` &middot; ${blok.focus}` : ''}</span>
          </span>
          ${nu ? '<span class="blok-stand gevuld">nu</span>' : ''}
        </button>
        <div class="blok-body" hidden>
          ${blok.dagen.map(dag => `
            <div class="dagblok">
              <h4>${dag.naam}</h4>
              <table>${dag.oefeningen.map(o => {
                const ex = byId(o.oefening);
                return `<tr><th>${ex?.naam ?? o.oefening}</th>
                  <td>${o.sets}&times;${o.min}-${o.max}${ex?.eenheid === 'sec' ? ' sec' : ''}</td></tr>`;
              }).join('')}</table>
            </div>`).join('')}
        </div>
      </div>`;
    }).join('')}`;

  // Blokken open- en dichtklappen; het huidige blok staat meteen open.
  $$('#schema-weergave .blok-kop').forEach(kop => (kop.onclick = () => {
    const body = kop.nextElementSibling;
    body.hidden = !body.hidden;
    kop.querySelector('.pijl').innerHTML = body.hidden ? '&#9656;' : '&#9662;';
  }));
  const huidige = $(`#schema-weergave .blok.nu .blok-kop`);
  if (huidige) huidige.click();
}

// ---------- instellingen ----------

function rendInstellingen() {
  const aan = new Set(data.apparatuur ?? []);
  const inv = INVENTARIS;

  $('#scherm-instellingen').innerHTML = `
    <div class="kaart">
      <div class="kaart-kop"><div><h2>Apparatuur in de ruimte</h2>
        <p class="sub">Vink iets uit als het kapot of bezet is.</p></div></div>
      <div class="kaart-body" style="padding-top:0"><div class="acties-inline" style="margin-top:0">
        <button class="knop klein" id="alles-aan">Alles aan</button>
        <button class="knop klein" id="alles-uit">Alles uit</button>
      </div></div>
      ${[...new Set(inv.map(i => i.categorie))].map(cat => `
        <fieldset class="inventaris"><legend>${cat}</legend>
          ${inv.filter(i => i.categorie === cat).map(i => `
            <label class="vink"><input type="checkbox" value="${i.id}"
              ${aan.has(i.id) ? 'checked' : ''}> ${i.naam}</label>`).join('')}
        </fieldset>`).join('')}
    </div>
    <div class="kaart">
      <div class="kaart-kop"><h2>Gebruiker</h2></div>
      <div class="kaart-body" style="padding-top:0">
        <p class="sub">Ingelogd als <strong>${cfg.gebruiker}</strong>,
          opgeslagen in <strong>${opslagSoort()}</strong>.</p>
        <div class="acties-inline">
          <button class="knop" id="uitloggen">Wissel gebruiker</button>
        </div>
      </div>
    </div>`;

  const vinkjes = () => $$('#scherm-instellingen .vink input');
  const sync = async () => {
    data.apparatuur = vinkjes().filter(c => c.checked).map(c => c.value);
    await bewaar(); rendInstellingen();
  };
  vinkjes().forEach(c => (c.onchange = sync));
  $('#alles-aan').onclick = () => { vinkjes().forEach(c => (c.checked = true)); sync(); };
  $('#alles-uit').onclick = () => { vinkjes().forEach(c => (c.checked = false)); sync(); };

  $('#uitloggen').onclick = () => { config.schrijf({ thema: config.lees().thema }); toonAanmelden(); };
}


// ---------- timer ----------

function toonTimer() {
  $('#timer').textContent = timer.format();
  const knop = $('#timer-schakel');
  if (knop) {
    knop.textContent = timer.loopt() ? '⏸' : '▶';
    knop.title = timer.loopt() ? 'Pauzeren' : 'Starten';
  }
  $('#timer').classList.toggle('loopt', timer.loopt());
}

// ---------- thema ----------

const THEMAS = ['auto', 'licht', 'donker'];
function pasThemaToe(thema) {
  if (thema === 'auto') document.documentElement.removeAttribute('data-thema');
  else document.documentElement.setAttribute('data-thema', thema);
  const knop = $('#thema-knop');
  if (knop) {
    knop.textContent = { auto: '◐', licht: '☀', donker: '☾' }[thema];
    knop.title = { auto: 'Thema: volgt je systeem', licht: 'Thema: licht', donker: 'Thema: donker' }[thema];
  }
}

// ---------- meldingen ----------

let meldingTimer;
function melding(tekst) {
  const m = $('#melding');
  m.textContent = tekst;
  m.hidden = false;
  clearTimeout(meldingTimer);
  meldingTimer = setTimeout(() => (m.hidden = true), 5000);
}

// ---------- bedrading ----------

pasThemaToe(config.lees().thema ?? 'auto');
$('#thema-knop').onclick = () => {
  const nu = config.lees();
  const volgende = THEMAS[(THEMAS.indexOf(nu.thema ?? 'auto') + 1) % THEMAS.length];
  config.schrijf({ ...nu, thema: volgende });
  pasThemaToe(volgende);
};
$('#timer-schakel').onclick = () => (timer.loopt() ? timer.pauzeer() : timer.start());
$('#timer-nul').onclick = () => timer.nul();
$$('.tab').forEach(t => (t.onclick = () => ganaarTab(t.dataset.tab)));
$('#start-knop').onclick = () => {
  const naam = $('#gebruikersnaam').value.trim();
  if (!naam) return melding('Vul een naam in.');
  kiesGebruiker(naam);
};
$('#gebruikersnaam').addEventListener('keydown', e => e.key === 'Enter' && $('#start-knop').click());

start();
