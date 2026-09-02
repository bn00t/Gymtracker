// De app weet welke oefeningen hier kunnen en wat je doel is, maar niet hoe je
// daar een goed onderbouwd schema van maakt. Dat laat hij aan een AI-chat over:
// hij stelt de vraag samen met alle harde gegevens erbij, en leest het antwoord
// weer in. Zo hoeft de trainingsleer niet in deze code te zitten.

import { EXERCISES, beschikbaar, byId, apparatuurNamen, SPIERGROEPEN, DUMBBELL_MAX } from './exercises.js';

const NIVEAU_UITLEG = {
  beginner: 'begint net met gestructureerd krachttrainen',
  gemiddeld: 'traint al een jaar of langer serieus',
  gevorderd: 'traint al jaren en zit dicht bij zijn genetische plafond',
};

/** Bouwt de prompt: profiel, apparatuur, alle bruikbare oefeningen en het gevraagde antwoordformaat. */
export function maakPrompt({ niveau, frequentie, doel, apparatuur }) {
  const lijst = beschikbaar(apparatuur);
  const perSpier = Object.entries(SPIERGROEPEN)
    .map(([spier, label]) => [label, lijst.filter(o => o.spier === spier)])
    .filter(([, o]) => o.length);

  return `Ik wil een trainingsschema dat zo goed mogelijk wetenschappelijk onderbouwd is.

## Mijn situatie
- Niveau: ${niveau} (${NIVEAU_UITLEG[niveau] ?? niveau})
- Trainingsfrequentie: ${frequentie}x per week
- Doel: ${doel}

## Belangrijke beperkingen van mijn sportruimte
- De kleinste schijf is 2,5 kg, dus de kleinste sprong met de halterstang is 5 kg.
- De dumbbells gaan tot ${DUMBBELL_MAX} kg. Daarboven kan ik alleen nog in reps opbouwen.
- De verstelbare bank kan wel positief (incline), niet negatief (decline).
- Er is geen leg curl machine. Voor de hamstrings kan ik alleen heupscharnieren
  (deadliftvarianten, good mornings) en de Nordic curl; let op dat die spiergroep
  daardoor snel ondervertegenwoordigd raakt.

## Oefeningen die ik kan doen (${lijst.length})
Gebruik uitsluitend oefeningen uit deze lijst en neem de naam exact over.

${perSpier.map(([label, o]) =>
  `### ${label} (${o.length})\n` +
  o.map(x => `- ${x.naam} — ${x.type}, ${x.equipment.length ? apparatuurNamen(x).join(' + ') : 'eigen lichaamsgewicht'}`).join('\n')
).join('\n\n')}

## Wat ik terug wil
Een plan van een half jaar, opgedeeld in **zes blokken van vier weken**, met
${frequentie} trainingsdagen per blok.

Zorg dat het plan roteert en opbouwt:
- **Rotatie.** Wissel per blok van oefening binnen dezelfde beweging, zodat ik
  gevarieerd train zonder de opbouw te verliezen. Houd de zware basisbewegingen
  wel over meerdere blokken vast; wissel vooral de accessoires.
- **Opbouw.** Laat het volume of de intensiteit over de blokken oplopen, en plan
  waar nodig een rustiger blok in. Zeg per blok kort wat de nadruk is.
- **Volledigheid.** Elke spiergroep moet over het hele half jaar aan bod komen.

Onderbouw je keuzes kort: wekelijks volume per spiergroep, frequentie per
spiergroep, hoe de blokken op elkaar voortbouwen, en waarom je deze oefeningen kiest.

Geef daarna het plan als JSON in een codeblok, exact in deze vorm en zonder
verdere tekst in dat blok:

\`\`\`json
{
  "naam": "korte naam van het plan",
  "blokken": [
    {
      "naam": "Blok 1 - Basis",
      "weken": 4,
      "focus": "techniek leren en volume opbouwen",
      "dagen": [
        {
          "naam": "Dag 1 - Full body A",
          "oefeningen": [
            { "oefening": "Medium Grip Bench Press", "sets": 3, "min": 8, "max": 12, "rust": 90, "rir": 2 }
          ]
        }
      ]
    }
  ]
}
\`\`\`

Regels voor de JSON:
- Zes blokken van vier weken, elk met precies ${frequentie} dagen.
- "oefening" moet exact overeenkomen met een naam uit de lijst hierboven.
- "sets" is een geheel getal, "min" en "max" zijn het repbereik, "rust" is in
  seconden, "rir" is het aantal reps dat ik in reserve houd.
- Bij planks en holds zijn "min" en "max" seconden in plaats van reps; dat weet
  mijn app zelf, geef ze gewoon als getal.`;
}

/**
 * Leest het antwoord terug. Accepteert een heel chatantwoord met een JSON-codeblok,
 * kale JSON, of een CSV-tabel (dag, oefening, sets, min, max, rust, rir).
 * Onbekende oefeningnamen worden gemeld in plaats van stil overgeslagen.
 */
export function leesSchema(tekst) {
  const ruw = tekst.trim();
  if (!ruw) throw new Error('Er is niets geplakt.');

  const json = pakJson(ruw);
  const ruweBlokken = json ? uitJson(json) : [{ naam: null, weken: null, dagen: uitCsv(ruw) }];
  if (!ruweBlokken.some(b => b.dagen.length)) {
    throw new Error('Geen dagen gevonden. Plak het hele antwoord, inclusief het JSON-blok.');
  }

  // Namen omzetten naar oefening-id's; wat niet bestaat, melden we.
  const onbekend = new Set();
  const opgelost = ruweBlokken.map((b, i) => ({
    naam: b.naam ?? `Blok ${i + 1}`,
    weken: heelGetal(b.weken, null),
    focus: b.focus ?? null,
    dagen: b.dagen.map(d => ({
      naam: d.naam,
      oefeningen: d.oefeningen.map(o => {
        const ex = zoekOefening(o.oefening);
        if (!ex) { onbekend.add(o.oefening); return null; }
        return {
          oefening: ex.id,
          sets: heelGetal(o.sets, 3),
          min: heelGetal(o.min, 8),
          max: heelGetal(o.max, 12),
          rust: heelGetal(o.rust, 90),
          rir: heelGetal(o.rir, 2),
        };
      }).filter(Boolean),
    })).filter(d => d.oefeningen.length),
  })).filter(b => b.dagen.length);

  if (!opgelost.length) {
    throw new Error(`Geen enkele oefening herkend. Onbekend: ${[...onbekend].slice(0, 3).join(', ')}`);
  }
  return { naam: json?.naam, blokken: opgelost, onbekend: [...onbekend] };
}

// --- hulpjes ---

function pakJson(tekst) {
  const blok = tekst.match(/```(?:json)?\s*([\s\S]*?)```/);
  const kandidaat = blok ? blok[1] : tekst;
  try { return JSON.parse(kandidaat.trim()); } catch { /* geen JSON */ }
  // JSON zonder codeblok, ergens in een langere tekst.
  const i = kandidaat.indexOf('{'), j = kandidaat.lastIndexOf('}');
  if (i >= 0 && j > i) {
    try { return JSON.parse(kandidaat.slice(i, j + 1)); } catch { /* niet te redden */ }
  }
  return null;
}

const leesDag = d => ({
  naam: d.naam ?? d.name ?? 'Dag',
  oefeningen: (d.oefeningen ?? d.exercises ?? []).map(o => ({
    oefening: o.oefening ?? o.exercise ?? o.naam ?? o.name,
    sets: o.sets, min: o.min, max: o.max, rust: o.rust ?? o.rest, rir: o.rir,
  })),
});

/** Blokken uit de JSON; een antwoord met alleen `dagen` wordt één blok. */
function uitJson(j) {
  const bl = j.blokken ?? j.blocks ?? j.phases;
  if (Array.isArray(bl) && bl.length) {
    return bl.map(b => ({
      naam: b.naam ?? b.name ?? null,
      weken: b.weken ?? b.weeks ?? null,
      focus: b.focus ?? b.nadruk ?? null,
      dagen: (b.dagen ?? b.days ?? []).map(leesDag),
    }));
  }
  return [{ naam: null, weken: null, focus: null,
            dagen: (j.dagen ?? j.days ?? []).map(leesDag) }];
}

/** CSV of een plakbare tabel: dag, oefening, sets, min, max, rust, rir. */
function uitCsv(tekst) {
  const dagen = new Map();
  for (const regel of tekst.split(/\r?\n/)) {
    const velden = regel.split(/\s*[,;|\t]\s*/).map(v => v.replace(/^\||\|$/g, '').trim());
    if (velden.length < 3) continue;
    const [dag, oefening, sets, min, max, rust, rir] = velden;
    if (!oefening || /^-+$/.test(oefening) || /^oefening$/i.test(oefening)) continue;
    if (!dagen.has(dag)) dagen.set(dag, { naam: dag, oefeningen: [] });
    dagen.get(dag).oefeningen.push({ oefening, sets, min, max, rust, rir });
  }
  return [...dagen.values()];
}

/** Naam naar oefening: exact, anders hoofdletterongevoelig, anders zonder leestekens. */
function zoekOefening(naam) {
  if (!naam) return null;
  const n = String(naam).trim();
  return EXERCISES.find(e => e.naam === n)
    ?? EXERCISES.find(e => e.naam.toLowerCase() === n.toLowerCase())
    ?? EXERCISES.find(e => kaal(e.naam) === kaal(n))
    ?? byId(n);
}
const kaal = t => t.toLowerCase().replace(/[^a-z0-9]/g, '');

function heelGetal(waarde, terugval) {
  const n = parseInt(waarde, 10);
  return Number.isFinite(n) && n > 0 ? n : terugval;
}
