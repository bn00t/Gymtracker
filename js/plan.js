import { beschikbaar, byId } from './exercises.js';

// Sets/reps per doel. rir = reps in reserve (hoe zwaar het moet voelen).
const DOELEN = {
  kracht:      { sets: 5, min: 3,  max: 5,  rust: 180, rir: 2 },
  spiermassa:  { sets: 3, min: 8,  max: 12, rust: 90,  rir: 2 },
  conditie:    { sets: 3, min: 12, max: 15, rust: 60,  rir: 3 },
};

// Splits per frequentie: welke spiergroepen krijgen welke dag de nadruk.
const SPLITS = {
  2: [ { naam: 'Full body A', focus: ['benen','duwen','trekken','core'] },
       { naam: 'Full body B', focus: ['benen','trekken','duwen','core'] } ],
  3: [ { naam: 'Full body A', focus: ['benen','duwen','trekken'] },
       { naam: 'Full body B', focus: ['trekken','benen','duwen'] },
       { naam: 'Full body C', focus: ['duwen','trekken','benen','core'] } ],
  4: [ { naam: 'Upper A', focus: ['duwen','trekken','duwen','trekken'] },
       { naam: 'Lower A', focus: ['benen','benen','benen','core'] },
       { naam: 'Upper B', focus: ['trekken','duwen','trekken','duwen'] },
       { naam: 'Lower B', focus: ['benen','benen','benen','core'] } ],
  5: [ { naam: 'Push',    focus: ['duwen','duwen','duwen','duwen'] },
       { naam: 'Pull',    focus: ['trekken','trekken','trekken','trekken'] },
       { naam: 'Benen',   focus: ['benen','benen','benen','core'] },
       { naam: 'Upper',   focus: ['duwen','trekken','duwen','trekken'] },
       { naam: 'Lower',   focus: ['benen','benen','benen','core'] } ],
};

// Beginners doen minder volume; gevorderden meer.
const VOLUME = { beginner: 4, gemiddeld: 5, gevorderd: 6 };

/**
 * Stelt een schema samen op basis van niveau, frequentie, doel en apparatuur.
 * Kiest per dag compounds eerst, dan isolatie, zonder herhaling binnen een dag.
 */
export function maakSchema({ niveau, frequentie, doel, apparatuur }) {
  const pool = beschikbaar(apparatuur);
  if (pool.length === 0) return { dagen: [], waarschuwing: 'Geen oefeningen mogelijk met de gekozen apparatuur.' };

  const cfg = DOELEN[doel] ?? DOELEN.spiermassa;
  const perDag = VOLUME[niveau] ?? 5;
  const freq = SPLITS[frequentie] ? frequentie : 3;
  const gebruikt = new Map(); // id -> hoe vaak in het hele schema

  const dagen = SPLITS[freq].map(dag => {
    const gekozen = [];
    const opDeze = new Set();

    for (let i = 0; i < perDag; i++) {
      const groep = dag.focus[i % dag.focus.length];
      // Eerste helft van de dag: compounds. Daarna isolatie als aanvulling.
      const wilCompound = i < Math.ceil(perDag / 2);
      const kandidaten = pool
        .filter(e => e.groep === groep && !opDeze.has(e.id))
        .filter(e => (wilCompound ? e.type === 'compound' : true))
        .sort((a, b) => (gebruikt.get(a.id) ?? 0) - (gebruikt.get(b.id) ?? 0));

      const keuze = kandidaten[0]
        ?? pool.filter(e => !opDeze.has(e.id))
               .sort((a, b) => (gebruikt.get(a.id) ?? 0) - (gebruikt.get(b.id) ?? 0))[0];
      if (!keuze) break;

      opDeze.add(keuze.id);
      gebruikt.set(keuze.id, (gebruikt.get(keuze.id) ?? 0) + 1);
      gekozen.push({
        oefening: keuze.id,
        sets: keuze.type === 'isolatie' ? Math.max(2, cfg.sets - 1) : cfg.sets,
        min: cfg.min, max: cfg.max, rust: cfg.rust, rir: cfg.rir,
      });
    }
    return { naam: dag.naam, oefeningen: gekozen };
  });

  return { niveau, frequentie: freq, doel, dagen, gemaaktOp: new Date().toISOString() };
}

/**
 * Volgende streefgewicht op basis van de laatste uitvoering (dubbele progressie).
 * Alle sets op de bovengrens gehaald -> gewicht omhoog met de stap van de oefening.
 * Onder de ondergrens gebleven -> 10% eraf (deload).
 */
export function volgendDoel(oefeningId, laatste, plan) {
  const ex = byId(oefeningId);
  const stap = ex?.stap ?? 2.5;

  // Isometrische oefeningen (planks) hebben geen gewicht: daar is de tijd de
  // progressie. Haal je de bovengrens, dan gaat er tien seconden bij.
  if (ex?.eenheid === 'sec') {
    const gedaan = werk(laatste?.sets);
    if (!gedaan.length) return null;
    const beste = Math.max(...gedaan.map(s => s.reps || 0));
    return beste >= plan.max
      ? { gewicht: 0, reden: 'omhoog', reps: beste + 10 }
      : { gewicht: 0, reden: 'gelijk', reps: Math.min(plan.max, beste + 5) };
  }
  const gedaan = werk(laatste?.sets);
  if (!gedaan.length) return null;

  const gewicht = Math.max(...gedaan.map(s => s.gewicht || 0));
  const werkSets = gedaan.filter(s => (s.gewicht || 0) >= gewicht - 0.01);
  const alleTop = werkSets.length >= plan.sets && werkSets.every(s => s.reps >= plan.max);
  const teZwaar = werkSets.some(s => s.reps < plan.min);

  // De dumbbellset houdt op bij een bepaald gewicht. Dan blijft het gewicht staan
  // en bouw je verder op in reps, voorbij het normale repbereik.
  const plafond = ex?.plafond;
  if (alleTop && plafond != null && gewicht + stap > plafond) {
    const reps = Math.max(...werkSets.map(s => s.reps));
    return { gewicht: rond(Math.min(gewicht, plafond)), reden: 'plafond', reps: reps + 1 };
  }

  if (alleTop) return { gewicht: rond(gewicht + stap), reden: 'omhoog', reps: plan.min };
  if (teZwaar) return { gewicht: rond(gewicht * 0.9), reden: 'deload', reps: plan.min };
  return { gewicht: rond(gewicht), reden: 'gelijk', reps: Math.min(plan.max, (Math.max(...werkSets.map(s => s.reps)) || plan.min) + 1) };
}

const rond = w => Math.round(w * 4) / 4;

/** Alleen de werksets: warming-ups tellen nergens in mee. */
export const werk = sets => (sets ?? []).filter(s => !s.opwarm);

/** Totaal tilvolume van een workout: som van sets x reps x gewicht. */
export const volume = w =>
  (w.oefeningen ?? []).reduce((t, o) =>
    t + werk(o.sets).reduce((s, set) => s + (set.reps || 0) * (set.gewicht || 0), 0), 0);

/** Totalen van een enkele oefening, voor de regel onder de sets. */
export function oefeningTotalen(sets) {
  const w = werk(sets);
  const gewicht = w.reduce((t, s) => t + (s.reps || 0) * (s.gewicht || 0), 0);
  const reps = w.reduce((t, s) => t + (s.reps || 0), 0);
  return { gewicht, reps, gemiddeld: reps ? gewicht / reps : 0, sets: w.length };
}

/** Totalen van de hele workout, voor het samenvattingskaartje. */
export function workoutTotalen(oefeningen) {
  return (oefeningen ?? []).reduce((t, o) => {
    const x = oefeningTotalen(o.sets);
    return { gewicht: t.gewicht + x.gewicht, reps: t.reps + x.reps, sets: t.sets + x.sets };
  }, { gewicht: 0, reps: 0, sets: 0 });
}

// ---------- blokken: een schema dat over maanden roteert ----------
//
// Een langer schema bestaat uit blokken van een paar weken. Elk blok heeft zijn
// eigen oefeningen, zodat je varieert, en zijn eigen nadruk, zodat je opbouwt.
// Een schema zonder blokken (één vaste set dagen) blijft gewoon werken: dat
// behandelen we als één blok dat nooit afloopt.

export const heeftBlokken = schema => Array.isArray(schema?.blokken) && schema.blokken.length > 0;

/** De blokken van een schema, of het schema zelf als één blok. */
export function blokken(schema) {
  if (heeftBlokken(schema)) return schema.blokken;
  if (schema?.dagen) return [{ naam: schema.naam ?? 'Schema', weken: null, dagen: schema.dagen }];
  return [];
}

/**
 * In welk blok en welke week zit je? Geteld vanaf de startdatum van het schema,
 * of vanaf je eerste training als die eerder viel. Na het laatste blok blijf je
 * in het laatste blok hangen in plaats van terug naar nul te vallen.
 */
export function huidigeStand(schema, workouts = []) {
  const lijst = blokken(schema);
  if (!lijst.length) return null;

  const eerste = workouts.filter(w => w.status === 'gedaan')
    .map(w => w.datum).sort()[0];
  const start = [schema?.startDatum, eerste].filter(Boolean).sort()[0]
    ?? new Date().toISOString().slice(0, 10);

  const dagenBezig = Math.max(0,
    Math.floor((new Date() - new Date(start + 'T12:00:00')) / 86400000));
  let week = Math.floor(dagenBezig / 7);

  for (let i = 0; i < lijst.length; i++) {
    const duur = lijst[i].weken ?? Infinity;
    if (week < duur || i === lijst.length - 1) {
      return {
        index: i, blok: lijst[i], aantal: lijst.length,
        weekInBlok: Math.min(week, (lijst[i].weken ?? week + 1) - 1) + 1,
        wekenInBlok: lijst[i].weken ?? null,
        start,
      };
    }
    week -= duur;
  }
  return null;
}

/** Totale looptijd van het schema in weken, of null als het onbeperkt is. */
export function looptijd(schema) {
  const lijst = blokken(schema);
  return lijst.every(b => b.weken) ? lijst.reduce((t, b) => t + b.weken, 0) : null;
}

/** Geschatte 1RM (Epley), voor progressiegrafieken per oefening. */
export const e1rm = (gewicht, reps) =>
  reps > 0 && gewicht > 0 ? gewicht * (1 + reps / 30) : 0;

/**
 * Hoe goed volgde een workout het schema? Vergelijkt uitgevoerde sets met de planning.
 * Geeft een percentage plus een korte tekstuele duiding.
 */
export function schemaTrouw(workout, schemaDag) {
  if (!schemaDag) return null;
  const gepland = schemaDag.oefeningen;
  let geplandeSets = 0, gehaaldeSets = 0, inBereik = 0, totaal = 0;

  for (const p of gepland) {
    geplandeSets += p.sets;
    const gedaan = workout.oefeningen.find(o => o.oefening === p.oefening);
    if (!gedaan) continue;
    const sets = werk(gedaan.sets);
    gehaaldeSets += Math.min(sets.length, p.sets);
    for (const s of sets) { totaal++; if (s.reps >= p.min && s.reps <= p.max + 2) inBereik++; }
  }
  const pct = geplandeSets ? Math.round((gehaaldeSets / geplandeSets) * 100) : 0;
  const kwaliteit = totaal ? Math.round((inBereik / totaal) * 100) : 0;
  let duiding;
  if (pct >= 95 && kwaliteit >= 80) duiding = 'Volgens schema';
  else if (pct >= 70) duiding = 'Grotendeels volgens schema';
  else if (pct > 0) duiding = 'Afgeweken van schema';
  else duiding = 'Vrije training';
  return { pct, kwaliteit, duiding };
}

/**
 * Werksets per spiergroep per week, gemiddeld over de afgelopen weken.
 *
 * Dit is de maat waarop hypertrofie stuurt: niet hoeveel je tilt, maar hoeveel
 * harde sets een spiergroep per week krijgt. De veelgebruikte richtlijn is
 * ongeveer 10 tot 20 sets per week per spiergroep.
 */
export function setsPerSpier(workouts, weken = 4) {
  const grens = new Date();
  grens.setDate(grens.getDate() - weken * 7);

  const recent = workouts.filter(w => new Date(w.datum + 'T12:00:00') >= grens);
  const telling = {};
  for (const w of recent) {
    for (const o of w.oefeningen ?? []) {
      const ex = byId(o.oefening);
      if (!ex) continue;
      telling[ex.spier] = (telling[ex.spier] ?? 0) + werk(o.sets).length;
    }
  }
  // Delen door het aantal weken geeft een weekgemiddelde, ook bij een gemiste week.
  return Object.entries(telling)
    .map(([spier, sets]) => ({ spier, perWeek: sets / weken, totaal: sets }))
    .sort((a, b) => b.perWeek - a.perWeek);
}

/** Hoeveel sets het schema per spiergroep per week vóórschrijft. */
export function geplandPerSpier(schema) {
  const telling = {};
  for (const dag of schema?.dagen ?? []) {
    for (const o of dag.oefeningen ?? []) {
      const ex = byId(o.oefening);
      if (!ex) continue;
      telling[ex.spier] = (telling[ex.spier] ?? 0) + (o.sets ?? 0);
    }
  }
  return telling;
}

/** Trainingen per week over de afgelopen n weken, tegen de streeffrequentie. */
export function frequentieTrouw(workouts, streef, weken = 8) {
  const nu = new Date();
  const rijen = [];
  for (let i = weken - 1; i >= 0; i--) {
    const eind = new Date(nu); eind.setDate(eind.getDate() - i * 7);
    const start = new Date(eind); start.setDate(start.getDate() - 7);
    const n = workouts.filter(w => { const d = new Date(w.datum); return d > start && d <= eind; }).length;
    rijen.push({ week: eind.toISOString().slice(0, 10), aantal: n, streef });
  }
  return rijen;
}
