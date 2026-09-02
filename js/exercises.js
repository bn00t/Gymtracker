// Oefeningencatalogus van de sportruimte: elke oefening die hier uitvoerbaar is,
// met alles wat de app ermee moet kunnen. Eén lijst, gebruikt door zowel de
// schemagenerator als het overzicht op het tabblad Oefeningen.
//
// Per oefening:
//   equipment  id's uit INVENTARIS; alle genoemde apparaten moeten aanstaan
//   spier      primaire spiergroep, bepaalt de indeling in het overzicht
//   groep      bewegingspatroon (benen/duwen/trekken/core), stuurt de split
//   type       compound of isolatie, bepaalt de volgorde binnen een trainingsdag
//   stap       hoeveel kilo de progressie per keer omhooggaat
//   plafond    optioneel; boven dit gewicht bouwt de app reps op in plaats van kilo's
//   eenheid    optioneel 'sec'; dan is min/max een tijd in seconden, geen aantal reps
//   video      uitlegvideo van Renaissance Periodization

// De inventaris van deze sportruimte: precies wat er staat, niets meer.
// Vink je iets uit (kapot, bezet), dan filtert de app de bijbehorende oefeningen
// automatisch uit je schema. Komt er iets bij? Toevoegen kan in Instellingen
// ("Eigen apparaat"), of hier een regel erbij zetten.
export const INVENTARIS = [
  // Vrije gewichten
  { id: 'barbell',     naam: 'Olympische halterstang + schijven', categorie: 'Vrije gewichten' },
  { id: 'dumbbell',    naam: 'Dumbbellset',                       categorie: 'Vrije gewichten' },

  // Rekken en banken
  { id: 'squatrek',    naam: 'Squat-/powerrack',                  categorie: 'Rekken en banken' },
  { id: 'bank',        naam: 'Vlakke bank',                       categorie: 'Rekken en banken' },
  { id: 'schuinebank', naam: 'Verstelbare (schuine) bank',        categorie: 'Rekken en banken' },
  { id: 'optrekstang', naam: 'Optrekhandvatten aan het rack',      categorie: 'Rekken en banken' },

  // Kabels
  { id: 'kabeltoren',  naam: 'Kabeltoren met verstelbare hoogte',  categorie: 'Kabels' },
  { id: 'hogekabel',   naam: 'Vaste hoge katrol (stang of touw)',  categorie: 'Kabels' },
  { id: 'seatedrowm',  naam: 'Seated row machine',                categorie: 'Kabels' },
  { id: 'kabelstang',  naam: 'Opzetstuk: rechte stang',            categorie: 'Kabels' },
  { id: 'kabeltouw',   naam: 'Opzetstuk: touw',                    categorie: 'Kabels' },
  { id: 'kabelhandvat',naam: 'Opzetstuk: handvatten (V via karabijn)', categorie: 'Kabels' },

  // Machines
  { id: 'legpressm',   naam: 'Legpress',                          categorie: 'Machines' },

  // Cardio en overig
  { id: 'crosstrainer',naam: 'Crosstrainer',                      categorie: 'Cardio en overig' },
  { id: 'skierg',      naam: 'SkiErg',                            categorie: 'Cardio en overig' },
  { id: 'roeier',      naam: 'Roeitrainer',                       categorie: 'Cardio en overig' },
  { id: 'fiets',       naam: 'Hometrainer',                       categorie: 'Cardio en overig' },
  { id: 'mat',         naam: 'Matten / vrije vloer',              categorie: 'Cardio en overig' },
  { id: 'opstap',      naam: 'Opstapverhoging (drie hoogtes)',     categorie: 'Cardio en overig' },
  { id: 'plyobox',     naam: 'Plyoboxen (2, meerzijdig)',          categorie: 'Cardio en overig' },
];

// Oefeningen zonder apparatuur hebben een lege equipment-lijst.
export const EQUIPMENT = INVENTARIS.map(i => i.id);

// INVENTARIS is exact wat er in deze ruimte staat, dus alles staat standaard aan.
// Uitvinken blijft nuttig: een kapot of bezet apparaat haal je zo tijdelijk uit je schema.
export const STANDAARD_AANWEZIG = [...EQUIPMENT];

// De dumbbellset loopt tot 20 kg. Oefeningen met een `plafond` gaan daarboven
// niet verder in gewicht; de app bouwt dan reps op in plaats van kilo's.
export const DUMBBELL_MAX = 20;

export const categorieen = () => [...new Set(INVENTARIS.map(i => i.categorie))];

// Uitlegvideo's: Renaissance Periodization sorteert per spiergroep, niet per oefening.
// Daarom koppelt elke oefening aan een `spier` en linkt de app naar die playlist.
// Wil je een specifieke video bij een oefening? Zet de URL in `video` — die wint.
export const PLAYLISTS = {
  biceps:     { naam: 'Biceps',      lijst: 'PLyqKj7LwU2Rt1cwOsHwdXa2TiRzjA6uoB' },
  quadriceps: { naam: 'Quads',       lijst: 'PLyqKj7LwU2RuAg-us4mzap6izNcc1fuRW' },
  borst:      { naam: 'Chest',       lijst: 'PLyqKj7LwU2RuyZwWCIiDHuFZGN11QW3Ff' },
  zijdelt:    { naam: 'Side Delts',  lijst: 'PLyqKj7LwU2RuNVJBl0CtfZdxQ99IhKCcu' },
  achterdelt: { naam: 'Rear Delts',  lijst: 'PLyqKj7LwU2Rv-tzrJev2STMTIGt_JeugT' },
  hamstrings: { naam: 'Hamstrings',  lijst: 'PLyqKj7LwU2Rvx_O313dzJNFKPiEqRMWiV' },
  bilspieren: { naam: 'Glutes',      lijst: 'PLyqKj7LwU2RtZnGDmtpyhDdvUHFvVyZnA' },
  voordelt:   { naam: 'Front Delts', lijst: 'PLyqKj7LwU2RtjiVutSXk5uC2h7KVMu1Az' },
  onderarmen: { naam: 'Forearms',    lijst: 'PLyqKj7LwU2RvQpfrgpWoyz-Jj2Xog_3Zx' },
  triceps:    { naam: 'Triceps',     lijst: 'PLyqKj7LwU2RtMd8vP3NEoig1RPJQK78Ea' },
  kuiten:     { naam: 'Calves',      lijst: 'PLyqKj7LwU2RtQyn5wWMJbD0rCV-cSkiK3' },
  trapezius:  { naam: 'Traps',       lijst: 'PLyqKj7LwU2RvynkwL93EcfuPUaDrWNOEc' },
  buik:       { naam: 'Abs',         lijst: 'PLyqKj7LwU2RvTgEW_QlCCjtIL5d_KP_-I' },
  rug:        { naam: 'Back',        lijst: 'PLyqKj7LwU2RsCtKw3UlE85HYgPM3-xoO1' },
};

/** Link naar uitleg bij een oefening: eigen video, anders de playlist van de spiergroep. */
export function uitleg(oefening) {
  if (oefening.video) return { url: oefening.video, label: 'Uitleg' };
  const pl = PLAYLISTS[oefening.spier];
  return pl
    ? { url: `https://www.youtube.com/playlist?list=${pl.lijst}`, label: `Uitleg: ${pl.naam}` }
    : null;
}

export const EXERCISES = [
  // --- benen ---
  { id: 'barbell-hip-thrust', naam: 'Barbell Hip Thrust', groep: 'benen', type: 'compound', equipment: ['bank', 'barbell'], spier: 'bilspieren', stap: 5, video: 'EF7jXP17DPE' },
  { id: 'barbell-split-squat', naam: 'Barbell Split Squat', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'quadriceps', stap: 5, video: 'VfsPxffCAd0' },
  { id: 'barbell-walking-lunge', naam: 'Barbell Walking Lunge', groep: 'benen', type: 'compound', equipment: ['barbell'], spier: 'bilspieren', stap: 5, video: '_meXEWq5MOQ' },
  { id: 'db-reverse-lunge', naam: 'DB Reverse Lunge', groep: 'benen', type: 'compound', equipment: ['dumbbell'], spier: 'bilspieren', stap: 2, plafond: DUMBBELL_MAX, video: 'D-c2CWwEweo' },
  { id: 'db-split-squat', naam: 'DB Split Squat', groep: 'benen', type: 'compound', equipment: ['dumbbell'], spier: 'bilspieren', stap: 2, plafond: DUMBBELL_MAX, video: 'pjAewD4LxXs' },
  { id: 'deadlift', naam: 'Deadlift', groep: 'benen', type: 'compound', equipment: ['barbell'], spier: 'bilspieren', stap: 5, video: 'AweC3UaM14o' },
  { id: 'deadlift-from-12-inch-blocks', naam: 'Deadlift from 12 Inch Blocks', groep: 'benen', type: 'compound', equipment: ['barbell', 'plyobox'], spier: 'bilspieren', stap: 5, video: 'Db5iv-hi1ik' },
  { id: 'deadlift-from-4-inch-blocks', naam: 'Deadlift from 4 Inch Blocks', groep: 'benen', type: 'compound', equipment: ['barbell', 'plyobox'], spier: 'bilspieren', stap: 5, video: '-cf8izxkSCM' },
  { id: 'deadlift-from-8-inch-blocks', naam: 'Deadlift from 8 Inch Blocks', groep: 'benen', type: 'compound', equipment: ['barbell', 'plyobox'], spier: 'bilspieren', stap: 5, video: '0Dq4XibjBWU' },
  { id: 'deficit-25s-deadlift', naam: 'Deficit 25s Deadlift', groep: 'benen', type: 'compound', equipment: ['barbell', 'opstap'], spier: 'bilspieren', stap: 5, video: 'kvWcDHH62j0' },
  { id: 'deficit-deadlift', naam: 'Deficit Deadlift', groep: 'benen', type: 'compound', equipment: ['barbell', 'opstap'], spier: 'bilspieren', stap: 5, video: 'X-uKkAukJVA' },
  { id: 'dumbbell-stiff-legged-deadlift', naam: 'Dumbbell Stiff Legged Deadlift', groep: 'benen', type: 'compound', equipment: ['dumbbell'], spier: 'hamstrings', stap: 2, plafond: DUMBBELL_MAX, video: 'cYKYGwcg0U8' },
  { id: 'dumbbell-walking-lunge', naam: 'Dumbbell Walking Lunge', groep: 'benen', type: 'compound', equipment: ['dumbbell'], spier: 'bilspieren', stap: 2, plafond: DUMBBELL_MAX, video: 'eFWCn5iEbTU' },
  { id: 'front-squat', naam: 'Front Squat', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'quadriceps', stap: 5, video: 'HHxNbhP16UE' },
  { id: 'front-squat-cross-grip', naam: 'Front Squat Cross Grip', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'quadriceps', stap: 5, video: '0DQvn2qsOG4' },
  { id: 'high-bar-good-morning', naam: 'High Bar Good Morning', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'hamstrings', stap: 5, video: 'dEJ0FTm-CEk' },
  { id: 'high-bar-half-squat', naam: 'High Bar Half Squat', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'quadriceps', stap: 5, video: 'dDHLBiswGNA' },
  { id: 'high-bar-parallel-squat', naam: 'High Bar Parallel Squat', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'quadriceps', stap: 5, video: '8w94JRax4yg' },
  { id: 'high-bar-quarter-squat', naam: 'High Bar Quarter Squat', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'quadriceps', stap: 5, video: 'q3mO8UssOWQ' },
  { id: 'high-bar-squat', naam: 'High Bar Squat', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'quadriceps', stap: 5, video: 'i7J5h7BJ07g' },
  { id: 'high-bar-third-squat', naam: 'High Bar Third Squat', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'quadriceps', stap: 5, video: 'ZNZfURzjrnM' },
  { id: 'leg-press', naam: 'Leg Press', groep: 'benen', type: 'compound', equipment: ['legpressm'], spier: 'quadriceps', stap: 5, video: 'yZmx_Ac3880' },
  { id: 'leg-press-calves', naam: 'Leg Press Calves', groep: 'benen', type: 'compound', equipment: ['legpressm'], spier: 'kuiten', stap: 5, video: 'KxEYX_cuesM' },
  { id: 'low-bar-good-morning', naam: 'Low Bar Good Morning', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'hamstrings', stap: 5, video: 'mnxn-7SO9Ks' },
  { id: 'narrow-stance-squat', naam: 'Narrow Stance Squat', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'quadriceps', stap: 5, video: '1IIPcUCKxcE' },
  { id: 'reverse-lunge', naam: 'Reverse Lunge', groep: 'benen', type: 'compound', equipment: ['barbell'], spier: 'bilspieren', stap: 5, video: 'TQfhY5oJ_Sc' },
  { id: 'single-leg-db-hip-thrust', naam: 'Single Leg DB Hip Thrust', groep: 'benen', type: 'compound', equipment: ['bank', 'dumbbell'], spier: 'bilspieren', stap: 2, plafond: DUMBBELL_MAX, video: 'CSXVj047Ss4' },
  { id: 'single-leg-hip-thrust', naam: 'Single Leg Hip Thrust', groep: 'benen', type: 'compound', equipment: ['bank', 'barbell'], spier: 'bilspieren', stap: 5, video: 'lzDgRRuBdqY' },
  { id: 'split-squat', naam: 'Split Squat', groep: 'benen', type: 'compound', equipment: [], spier: 'bilspieren', stap: 2.5, video: 'jNihW0WDIL4' },
  { id: 'stiff-legged-deadlift', naam: 'Stiff Legged Deadlift', groep: 'benen', type: 'compound', equipment: ['barbell'], spier: 'hamstrings', stap: 5, video: 'CN_7cz3P-1U' },
  { id: 'stiff-legged-deadlift-from-4-inch-blocks', naam: 'Stiff Legged Deadlift from 4 Inch Blocks', groep: 'benen', type: 'compound', equipment: ['barbell', 'plyobox'], spier: 'hamstrings', stap: 5, video: 'P-RWTcby_G4' },
  { id: 'stiff-legged-deadlift-from-8-inch-blocks', naam: 'Stiff Legged Deadlift from 8 Inch Blocks', groep: 'benen', type: 'compound', equipment: ['barbell', 'plyobox'], spier: 'hamstrings', stap: 5, video: 'nQQ30A-R25M' },
  { id: 'stiff-legged-deadlift-from-12-inch-blocks', naam: 'Stiff-Legged Deadlift from 12 Inch Blocks', groep: 'benen', type: 'compound', equipment: ['barbell', 'plyobox'], spier: 'hamstrings', stap: 5, video: 'nYi-rVXnRD0' },
  { id: 'sumo-deadlift', naam: 'Sumo Deadlift', groep: 'benen', type: 'compound', equipment: ['barbell'], spier: 'bilspieren', stap: 5, video: 'pfSMst14EFk' },
  { id: 'sumo-deficit-deadlift', naam: 'Sumo Deficit Deadlift', groep: 'benen', type: 'compound', equipment: ['barbell', 'opstap'], spier: 'bilspieren', stap: 5, video: 'bnYekgCKfv0' },
  { id: 'sumo-squat', naam: 'Sumo Squat', groep: 'benen', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'bilspieren', stap: 5, video: '4eDJa5MnAmY' },
  { id: 'cable-pull-through', naam: 'Cable Pull Through', groep: 'benen', type: 'isolatie', equipment: ['kabeltoren'], spier: 'bilspieren', stap: 2.5, video: 'pv8e6OSyETE' },
  { id: 'single-leg-stair-claves', naam: 'Single Leg Stair Claves', groep: 'benen', type: 'isolatie', equipment: ['opstap'], spier: 'kuiten', stap: 2.5, video: '_gEx2ijsmNM' },
  { id: 'stair-calves', naam: 'Stair Calves', groep: 'benen', type: 'isolatie', equipment: ['opstap'], spier: 'kuiten', stap: 2.5, video: '__qfDhdByMY' },

  // --- duwen ---
  { id: 'barbell-upright-row', naam: 'Barbell Upright Row', groep: 'duwen', type: 'compound', equipment: ['barbell'], spier: 'zijdelt', stap: 5, video: 'um3VVzqunPU' },
  { id: 'cable-upright-row', naam: 'Cable Upright Row', groep: 'duwen', type: 'compound', equipment: ['kabeltoren'], spier: 'zijdelt', stap: 2.5, video: 'qr3ziolhjvQ' },
  { id: 'deficit-pushup', naam: 'Deficit Pushup', groep: 'duwen', type: 'compound', equipment: ['mat', 'opstap'], spier: 'borst', stap: 0, video: 'gmNlqsE3Onc' },
  { id: 'dumbbell-upright-row', naam: 'Dumbbell Upright Row', groep: 'duwen', type: 'compound', equipment: ['dumbbell'], spier: 'zijdelt', stap: 2, plafond: DUMBBELL_MAX, video: 'Ub6QruNKfbY' },
  { id: 'flat-dumbbell-bench-press', naam: 'Flat Dumbbell Bench Press', groep: 'duwen', type: 'compound', equipment: ['bank', 'dumbbell'], spier: 'borst', stap: 2, plafond: DUMBBELL_MAX, video: 'YQ2s_Y7g5Qk' },
  { id: 'flat-dumbbell-press-flye', naam: 'Flat Dumbbell Press Flye', groep: 'duwen', type: 'compound', equipment: ['bank', 'dumbbell'], spier: 'borst', stap: 2, plafond: DUMBBELL_MAX, video: 'BhlL-esnitU' },
  { id: 'high-incline-dumbbell-press', naam: 'High Incline Dumbbell Press', groep: 'duwen', type: 'compound', equipment: ['dumbbell', 'schuinebank'], spier: 'borst', stap: 2, plafond: DUMBBELL_MAX, video: 'GFYrRBoov3w' },
  { id: 'incline-dumbbell-press', naam: 'Incline Dumbbell Press', groep: 'duwen', type: 'compound', equipment: ['dumbbell', 'schuinebank'], spier: 'borst', stap: 2, plafond: DUMBBELL_MAX, video: '5CECBjd7HLQ' },
  { id: 'incline-dumbbell-press-flye', naam: 'Incline Dumbbell Press Flye', groep: 'duwen', type: 'compound', equipment: ['dumbbell', 'schuinebank'], spier: 'borst', stap: 2, plafond: DUMBBELL_MAX, video: 'lTfiohnjbyM' },
  { id: 'incline-medium-grip-bench-press', naam: 'Incline Medium Grip Bench Press', groep: 'duwen', type: 'compound', equipment: ['barbell', 'schuinebank'], spier: 'borst', stap: 5, video: 'lJ2o89kcnxY' },
  { id: 'incline-narrow-grip-bench-press', naam: 'Incline Narrow Grip Bench Press', groep: 'duwen', type: 'compound', equipment: ['barbell', 'schuinebank'], spier: 'borst', stap: 5, video: 'Zfi0KcIJi6c' },
  { id: 'incline-wide-grip-bench-press', naam: 'Incline Wide Grip Bench Press', groep: 'duwen', type: 'compound', equipment: ['barbell', 'schuinebank'], spier: 'borst', stap: 5, video: 'FxQ0XEoFYQk' },
  { id: 'jm-press', naam: 'JM Press', groep: 'duwen', type: 'compound', equipment: ['bank', 'barbell'], spier: 'triceps', stap: 5, video: 'Tih5iHyELsE' },
  { id: 'low-incline-dumbbell-press', naam: 'Low Incline Dumbbell Press', groep: 'duwen', type: 'compound', equipment: ['dumbbell', 'schuinebank'], spier: 'borst', stap: 2, plafond: DUMBBELL_MAX, video: 'B09ZkYsnKko' },
  { id: 'medium-grip-bench-press', naam: 'Medium Grip Bench Press', groep: 'duwen', type: 'compound', equipment: ['bank', 'barbell'], spier: 'borst', stap: 5, video: 'gMgvBspQ9lk' },
  { id: 'narrow-grip-bench-press', naam: 'Narrow Grip Bench Press', groep: 'duwen', type: 'compound', equipment: ['bank', 'barbell'], spier: 'borst', stap: 5, video: 'FiQUzPtS90E' },
  { id: 'narrow-pushup', naam: 'Narrow Pushup', groep: 'duwen', type: 'compound', equipment: ['mat'], spier: 'borst', stap: 0, video: 'Lz1aFtuNvEQ' },
  { id: 'pushup', naam: 'Pushup', groep: 'duwen', type: 'compound', equipment: ['mat'], spier: 'borst', stap: 0, video: 'mm6_WcoCVTA' },
  { id: 'seated-barbell-shoulder-press', naam: 'Seated Barbell Shoulder Press', groep: 'duwen', type: 'compound', equipment: ['bank', 'barbell'], spier: 'voordelt', stap: 5, video: 'IuzRCN6eG6Y' },
  { id: 'seated-dumbbell-shoulder-press', naam: 'Seated Dumbbell Shoulder Press', groep: 'duwen', type: 'compound', equipment: ['bank', 'dumbbell'], spier: 'voordelt', stap: 2, plafond: DUMBBELL_MAX, video: 'HzIiNhHhhtA' },
  { id: 'standing-barbell-shoulder-press', naam: 'Standing Barbell Shoulder Press', groep: 'duwen', type: 'compound', equipment: ['barbell'], spier: 'voordelt', stap: 5, video: 'G2qpTG1Eh40' },
  { id: 'standing-dumbbell-shoulder-press', naam: 'Standing Dumbbell Shoulder Press', groep: 'duwen', type: 'compound', equipment: ['dumbbell'], spier: 'voordelt', stap: 2, plafond: DUMBBELL_MAX, video: 'Raemd3qWgJc' },
  { id: 'wide-grip-bench-press', naam: 'Wide Grip Bench Press', groep: 'duwen', type: 'compound', equipment: ['bank', 'barbell'], spier: 'borst', stap: 5, video: 'EeE3f4VWFDo' },
  { id: 'barbell-front-raise', naam: 'Barbell Front Raise', groep: 'duwen', type: 'isolatie', equipment: ['barbell'], spier: 'voordelt', stap: 5, video: '_ikCPws1mbE' },
  { id: 'barbell-skullcrusher', naam: 'Barbell Skullcrusher', groep: 'duwen', type: 'isolatie', equipment: ['bank', 'barbell'], spier: 'triceps', stap: 5, video: 'l3rHYPtMUo8' },
  { id: 'barbell-triceps-overhead-extension', naam: 'Barbell Triceps Overhead Extension', groep: 'duwen', type: 'isolatie', equipment: ['barbell'], spier: 'triceps', stap: 5, video: 'q5X9thiKofE' },
  { id: 'cable-bent-flye', naam: 'Cable Bent Flye', groep: 'duwen', type: 'isolatie', equipment: ['kabeltoren'], spier: 'borst', stap: 2.5, video: 'Cj6P91eFXkM' },
  { id: 'cable-cross-body-lateral-raise', naam: 'Cable Cross Body Lateral Raise', groep: 'duwen', type: 'isolatie', equipment: ['kabelhandvat', 'kabeltoren'], spier: 'zijdelt', stap: 2.5, video: '2OMbdPF7mz4' },
  { id: 'cable-flye', naam: 'Cable Flye', groep: 'duwen', type: 'isolatie', equipment: ['kabeltoren'], spier: 'borst', stap: 2.5, video: '4mfLHnFL0Uw' },
  { id: 'cable-overhead-triceps-extension', naam: 'Cable Overhead Triceps Extension', groep: 'duwen', type: 'isolatie', equipment: ['hogekabel'], spier: 'triceps', stap: 2.5, video: '1u18yJELsh0' },
  { id: 'cable-single-arm-pushdown', naam: 'Cable Single Arm Pushdown', groep: 'duwen', type: 'isolatie', equipment: ['hogekabel', 'kabelhandvat'], spier: 'triceps', stap: 2.5, video: 'Cp_bShvMY4c' },
  { id: 'cable-triceps-pushdown', naam: 'Cable Triceps Pushdown', groep: 'duwen', type: 'isolatie', equipment: ['hogekabel'], spier: 'triceps', stap: 2.5, video: '6Fzep104f0s' },
  { id: 'cable-underhand-flye', naam: 'Cable Underhand Flye', groep: 'duwen', type: 'isolatie', equipment: ['kabeltoren'], spier: 'borst', stap: 2.5, video: 'e_8HLu59-to' },
  { id: 'cable-underhand-front-raise', naam: 'Cable Underhand Front Raise', groep: 'duwen', type: 'isolatie', equipment: ['kabeltoren'], spier: 'voordelt', stap: 2.5, video: 'yIoAcMD3jcE' },
  { id: 'dumbbell-front-raise', naam: 'Dumbbell Front Raise', groep: 'duwen', type: 'isolatie', equipment: ['dumbbell'], spier: 'voordelt', stap: 1, plafond: DUMBBELL_MAX, video: 'hRJ6tR5-if0' },
  { id: 'dumbbell-skullcrusher', naam: 'Dumbbell Skullcrusher', groep: 'duwen', type: 'isolatie', equipment: ['bank', 'dumbbell'], spier: 'triceps', stap: 2, plafond: DUMBBELL_MAX, video: 'jPjhQ2hsAds' },
  { id: 'flat-dumbbell-flye', naam: 'Flat Dumbbell Flye', groep: 'duwen', type: 'isolatie', equipment: ['bank', 'dumbbell'], spier: 'borst', stap: 2, plafond: DUMBBELL_MAX, video: 'JFm8KbhjibM' },
  { id: 'incline-dumbbell-flye', naam: 'Incline Dumbbell Flye', groep: 'duwen', type: 'isolatie', equipment: ['dumbbell', 'schuinebank'], spier: 'borst', stap: 2, plafond: DUMBBELL_MAX, video: '8oR5hBwbIBc' },
  { id: 'inverted-skullcrusher', naam: 'Inverted Skullcrusher', groep: 'duwen', type: 'isolatie', equipment: ['bank', 'barbell'], spier: 'triceps', stap: 5, video: '1lrjpLuXH4w' },
  { id: 'lateral-raise', naam: 'Lateral Raise', groep: 'duwen', type: 'isolatie', equipment: ['dumbbell'], spier: 'zijdelt', stap: 1, plafond: DUMBBELL_MAX, video: 'OuG1smZTsQQ' },
  { id: 'leaning-cable-lateral-raise', naam: 'Leaning Cable Lateral Raise', groep: 'duwen', type: 'isolatie', equipment: ['kabeltoren'], spier: 'zijdelt', stap: 2.5, video: 'lq7eLC30b9w' },
  { id: 'rope-overhead-triceps-extension', naam: 'Rope Overhead Triceps Extension', groep: 'duwen', type: 'isolatie', equipment: ['hogekabel', 'kabeltouw'], spier: 'triceps', stap: 2.5, video: 'kqidUIf1eJE' },
  { id: 'rope-pushdown', naam: 'Rope Pushdown', groep: 'duwen', type: 'isolatie', equipment: ['hogekabel', 'kabeltouw'], spier: 'triceps', stap: 2.5, video: '-xa-6cQaZKY' },
  { id: 'seated-barbell-overhead-triceps-extension', naam: 'Seated Barbell Overhead Triceps Extension', groep: 'duwen', type: 'isolatie', equipment: ['bank', 'barbell'], spier: 'triceps', stap: 5, video: 'ktU2H0DDmwk' },
  { id: 'thumbs-down-lateral-raise', naam: 'Thumbs Down Lateral Raise', groep: 'duwen', type: 'isolatie', equipment: ['dumbbell'], spier: 'zijdelt', stap: 1, plafond: DUMBBELL_MAX, video: 'D1f7d1OcobY' },
  { id: 'top-hold-lateral-raise', naam: 'Top Hold Lateral Raise', groep: 'duwen', type: 'isolatie', equipment: ['dumbbell'], spier: 'zijdelt', stap: 1, plafond: DUMBBELL_MAX, video: 'SKf8wHlIFX0' },

  // --- trekken ---
  { id: 'barbell-bent-over-row', naam: 'Barbell Bent Over Row', groep: 'trekken', type: 'compound', equipment: ['barbell'], spier: 'rug', stap: 5, video: '6FZHJGzMFEc' },
  { id: 'barbell-curl-narrow-grip', naam: 'Barbell Curl Narrow Grip', groep: 'trekken', type: 'compound', equipment: ['barbell'], spier: 'biceps', stap: 5, video: 'pUS6HBQjRmc' },
  { id: 'barbell-flexion-row', naam: 'Barbell Flexion Row', groep: 'trekken', type: 'compound', equipment: ['barbell'], spier: 'rug', stap: 5, video: 'Lt3d1UKq7RQ' },
  { id: 'barbell-row-to-chest', naam: 'Barbell Row to Chest', groep: 'trekken', type: 'compound', equipment: ['barbell'], spier: 'rug', stap: 5, video: 'UPGuwx7GQ9s' },
  { id: 'chest-supported-row', naam: 'Chest Supported Row', groep: 'trekken', type: 'compound', equipment: ['schuinebank'], spier: 'rug', stap: 2.5, video: '0UBRfiO4zDs' },
  { id: 'incline-dumbbell-row', naam: 'Incline Dumbbell Row', groep: 'trekken', type: 'compound', equipment: ['dumbbell', 'schuinebank'], spier: 'rug', stap: 2, plafond: DUMBBELL_MAX, video: 'tZUYS7X50so' },
  { id: 'inverted-row', naam: 'Inverted Row', groep: 'trekken', type: 'compound', equipment: ['barbell', 'squatrek'], spier: 'rug', stap: 5, video: 'KOaCM1HMwU0' },
  { id: 'normal-grip-pulldown', naam: 'Normal Grip Pulldown', groep: 'trekken', type: 'compound', equipment: ['hogekabel'], spier: 'rug', stap: 2.5, video: 'EUIri47Epcg' },
  { id: 'normal-grip-pullup', naam: 'Normal Grip Pullup', groep: 'trekken', type: 'compound', equipment: ['optrekstang'], spier: 'rug', stap: 2.5, video: 'iWpoegdfgtc' },
  { id: 'parallel-grip-pullup', naam: 'Parallel Grip Pullup', groep: 'trekken', type: 'compound', equipment: ['optrekstang'], spier: 'rug', stap: 2.5, video: 'XWt6FQAK5wM' },
  { id: 'parallel-pulldown', naam: 'Parallel Pulldown', groep: 'trekken', type: 'compound', equipment: ['hogekabel'], spier: 'rug', stap: 2.5, video: '--utaPT7XYQ' },
  { id: 'seal-row', naam: 'Seal Row', groep: 'trekken', type: 'compound', equipment: ['plyobox', 'schuinebank'], spier: 'rug', stap: 2.5, video: '4H2ItXwUTp8' },
  { id: 'seated-cable-row', naam: 'Seated Cable Row', groep: 'trekken', type: 'compound', equipment: ['seatedrowm'], spier: 'rug', stap: 2.5, video: 'UCXxvVItLoM' },
  { id: 'single-arm-supported-dumbbell-row', naam: 'Single Arm Supported Dumbbell Row', groep: 'trekken', type: 'compound', equipment: ['dumbbell'], spier: 'rug', stap: 2, plafond: DUMBBELL_MAX, video: 'DMo3HJoawrU' },
  { id: 'straight-arm-pulldown', naam: 'Straight Arm Pulldown', groep: 'trekken', type: 'compound', equipment: ['hogekabel'], spier: 'rug', stap: 2.5, video: 'G9uNaXGTJ4w' },
  { id: 'two-arm-dumbbell-row', naam: 'Two Arm Dumbbell Row', groep: 'trekken', type: 'compound', equipment: ['dumbbell'], spier: 'rug', stap: 2, plafond: DUMBBELL_MAX, video: '5PoEksoJNaw' },
  { id: 'underhand-pulldown', naam: 'Underhand Pulldown', groep: 'trekken', type: 'compound', equipment: ['hogekabel'], spier: 'rug', stap: 2.5, video: 'VprlTxpB1rk' },
  { id: 'underhand-pullup', naam: 'Underhand Pullup', groep: 'trekken', type: 'compound', equipment: ['optrekstang'], spier: 'rug', stap: 2.5, video: '9JC1EwqezGY' },
  { id: 'wide-grip-pulldown', naam: 'Wide Grip Pulldown', groep: 'trekken', type: 'compound', equipment: ['barbell', 'hogekabel'], spier: 'rug', stap: 5, video: 'YCKPD4BSD2E' },
  { id: 'wide-grip-pullup', naam: 'Wide Grip Pullup', groep: 'trekken', type: 'compound', equipment: ['barbell', 'optrekstang'], spier: 'rug', stap: 5, video: 'GRgWPT9XSQQ' },
  { id: 'alternating-dumbbell-curl', naam: 'Alternating Dumbbell Curl', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell'], spier: 'biceps', stap: 1, plafond: DUMBBELL_MAX, video: 'iixND1P2lik' },
  { id: 'barbell-bent-shrug', naam: 'Barbell Bent Shrug', groep: 'trekken', type: 'isolatie', equipment: ['barbell'], spier: 'trapezius', stap: 5, video: 'd9daNDIXtK8' },
  { id: 'barbell-curl-normal-grip', naam: 'Barbell Curl Normal Grip', groep: 'trekken', type: 'isolatie', equipment: ['barbell'], spier: 'biceps', stap: 5, video: 'JnLFSFurrqQ' },
  { id: 'barbell-facepull', naam: 'Barbell Facepull', groep: 'trekken', type: 'isolatie', equipment: ['barbell'], spier: 'achterdelt', stap: 5, video: 'hPWYuhJMUhU' },
  { id: 'barbell-shrug', naam: 'Barbell Shrug', groep: 'trekken', type: 'isolatie', equipment: ['barbell'], spier: 'trapezius', stap: 5, video: 'M_MjF5Nm_h4' },
  { id: 'barbell-standing-wrist-curl', naam: 'Barbell Standing Wrist Curl', groep: 'trekken', type: 'isolatie', equipment: ['barbell'], spier: 'onderarmen', stap: 5, video: 'lfQR7oVS8eo' },
  { id: 'bent-lateral-raise', naam: 'Bent Lateral Raise', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell'], spier: 'achterdelt', stap: 1, plafond: DUMBBELL_MAX, video: '34gVHrkaiz0' },
  { id: 'cable-bent-shrug', naam: 'Cable Bent Shrug', groep: 'trekken', type: 'isolatie', equipment: ['kabeltoren'], spier: 'trapezius', stap: 2.5, video: 'nOn_Bz0zrwQ' },
  { id: 'cable-cross-body-bent-lateral-raise', naam: 'Cable Cross Body Bent Lateral Raise', groep: 'trekken', type: 'isolatie', equipment: ['kabelhandvat', 'kabeltoren'], spier: 'achterdelt', stap: 2.5, video: 'f0g5NkYiWUY' },
  { id: 'cable-ez-bar-curl', naam: 'Cable EZ Bar Curl', groep: 'trekken', type: 'isolatie', equipment: ['kabelstang', 'kabeltoren'], spier: 'biceps', stap: 2.5, video: 'opFVuRi_3b8' },
  { id: 'cable-ez-bar-curl-wide-grip', naam: 'Cable EZ Bar Curl Wide Grip', groep: 'trekken', type: 'isolatie', equipment: ['kabelstang', 'kabeltoren'], spier: 'biceps', stap: 2.5, video: 'yuozln3CC94' },
  { id: 'cable-rope-facepull', naam: 'Cable Rope Facepull', groep: 'trekken', type: 'isolatie', equipment: ['hogekabel', 'kabeltouw'], spier: 'achterdelt', stap: 2.5, video: '-MODnZdnmAQ' },
  { id: 'cable-shrug', naam: 'Cable Shrug', groep: 'trekken', type: 'isolatie', equipment: ['kabeltoren'], spier: 'trapezius', stap: 2.5, video: 'YykmcX2b-LY' },
  { id: 'cable-side-shrug', naam: 'Cable Side Shrug', groep: 'trekken', type: 'isolatie', equipment: ['kabeltoren'], spier: 'trapezius', stap: 2.5, video: '2zaT3WAgZi0' },
  { id: 'cable-single-arm-rear-delt-raise', naam: 'Cable Single Arm Rear Delt Raise', groep: 'trekken', type: 'isolatie', equipment: ['kabelhandvat', 'kabeltoren'], spier: 'achterdelt', stap: 2.5, video: 'qz1OLup4W_M' },
  { id: 'cable-single-arm-side-shrug', naam: 'Cable Single Arm Side Shrug', groep: 'trekken', type: 'isolatie', equipment: ['kabelhandvat', 'kabeltoren'], spier: 'trapezius', stap: 2.5, video: 'BeIcUXQ3RDc' },
  { id: 'cable-wrist-curl', naam: 'Cable Wrist Curl', groep: 'trekken', type: 'isolatie', equipment: ['kabeltoren'], spier: 'onderarmen', stap: 2.5, video: 'WVAaKJvToe0' },
  { id: 'dumbbell-bench-wrist-curl', naam: 'Dumbbell Bench Wrist Curl', groep: 'trekken', type: 'isolatie', equipment: ['bank', 'dumbbell'], spier: 'onderarmen', stap: 1, plafond: DUMBBELL_MAX, video: '2wPpcJBe03o' },
  { id: 'dumbbell-bent-shrug', naam: 'Dumbbell Bent Shrug', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell'], spier: 'trapezius', stap: 2, plafond: DUMBBELL_MAX, video: '5z7ZtboxbBY' },
  { id: 'dumbbell-facepull', naam: 'Dumbbell Facepull', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell'], spier: 'achterdelt', stap: 1, plafond: DUMBBELL_MAX, video: 'nzTY7j9ocR8' },
  { id: 'dumbbell-lean-shrug', naam: 'Dumbbell Lean Shrug', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell'], spier: 'trapezius', stap: 2, plafond: DUMBBELL_MAX, video: 'GH_l85Ky3vA' },
  { id: 'dumbbell-pullover', naam: 'Dumbbell Pullover', groep: 'trekken', type: 'isolatie', equipment: ['bank', 'dumbbell'], spier: 'rug', stap: 2, plafond: DUMBBELL_MAX, video: 'jQjWlIwG4sI' },
  { id: 'dumbbell-shrug', naam: 'Dumbbell Shrug', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell'], spier: 'trapezius', stap: 2, plafond: DUMBBELL_MAX, video: '_t3lrPI6Ns4' },
  { id: 'dumbbell-single-arm-preacher-curl', naam: 'Dumbbell Single Arm Preacher Curl', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell', 'schuinebank'], spier: 'biceps', stap: 1, plafond: DUMBBELL_MAX, video: 'fuK3nFvwgXk' },
  { id: 'dumbbell-spider-curl', naam: 'Dumbbell Spider Curl', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell', 'schuinebank'], spier: 'biceps', stap: 1, plafond: DUMBBELL_MAX, video: 'ke2shAeQ0O8' },
  { id: 'dumbbell-standing-wrist-curl', naam: 'Dumbbell Standing Wrist Curl', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell'], spier: 'onderarmen', stap: 1, plafond: DUMBBELL_MAX, video: 'iQ4JjOK73PE' },
  { id: 'dumbbell-twist-curl', naam: 'Dumbbell Twist Curl', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell'], spier: 'biceps', stap: 1, plafond: DUMBBELL_MAX, video: 'tRXw8HQ7-oA' },
  { id: 'hammer-curl', naam: 'Hammer Curl', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell'], spier: 'biceps', stap: 1, plafond: DUMBBELL_MAX, video: 'XOEL4MgekYE' },
  { id: 'incline-dumbbell-curl', naam: 'Incline Dumbbell Curl', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell', 'schuinebank'], spier: 'biceps', stap: 1, plafond: DUMBBELL_MAX, video: 'aTYlqC_JacQ' },
  { id: 'incline-dumbbell-facepull', naam: 'Incline Dumbbell Facepull', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell', 'schuinebank'], spier: 'achterdelt', stap: 1, plafond: DUMBBELL_MAX, video: '90cE3rCLtmo' },
  { id: 'incline-dumbbell-lateral-raise', naam: 'Incline Dumbbell Lateral Raise', groep: 'trekken', type: 'isolatie', equipment: ['dumbbell', 'schuinebank'], spier: 'achterdelt', stap: 1, plafond: DUMBBELL_MAX, video: 'z3PRz2aVA10' },
  { id: 'kneeling-cable-facepull', naam: 'Kneeling Cable Facepull', groep: 'trekken', type: 'isolatie', equipment: ['hogekabel'], spier: 'achterdelt', stap: 2.5, video: '8CGMuud1ANw' },
  { id: 'rope-twist-curl', naam: 'Rope Twist Curl', groep: 'trekken', type: 'isolatie', equipment: ['kabeltoren', 'kabeltouw'], spier: 'biceps', stap: 2.5, video: '2CDKTFFp5fA' },
  { id: 'seated-dumbbell-shrug', naam: 'Seated Dumbbell Shrug', groep: 'trekken', type: 'isolatie', equipment: ['bank', 'dumbbell'], spier: 'trapezius', stap: 2, plafond: DUMBBELL_MAX, video: 'zgToz5FiI-E' },

  // --- core ---
  { id: 'front-plank', naam: 'Front Plank', groep: 'core', type: 'isolatie', equipment: ['mat'], spier: 'buik', stap: 0, eenheid: 'sec', video: 'Ff4_A3y7JR0' },
  { id: 'front-plank-with-limb-raises', naam: 'Front Plank with Limb Raises', groep: 'core', type: 'isolatie', equipment: ['mat'], spier: 'buik', stap: 0, eenheid: 'sec', video: 'DrRSNSidnQc' },
  { id: 'hanging-knee-raise', naam: 'Hanging Knee Raise', groep: 'core', type: 'isolatie', equipment: ['optrekstang'], spier: 'buik', stap: 0, video: 'RD_A-Z15ER4' },
  { id: 'hanging-straight-leg-raise', naam: 'Hanging Straight Leg Raise', groep: 'core', type: 'isolatie', equipment: ['optrekstang'], spier: 'buik', stap: 0, video: '7FwGZ8qY5OU' },
  { id: 'hollow-body-hold', naam: 'Hollow Body Hold', groep: 'core', type: 'isolatie', equipment: ['mat'], spier: 'buik', stap: 0, eenheid: 'sec', video: 'eJh4JmC80Q8' },
  { id: 'modified-candlestick', naam: 'Modified Candlestick', groep: 'core', type: 'isolatie', equipment: ['mat'], spier: 'buik', stap: 0, video: 'T_X5rb3G5lk' },
  { id: 'reaching-situp', naam: 'Reaching Situp', groep: 'core', type: 'isolatie', equipment: ['mat'], spier: 'buik', stap: 0, video: 'pXg8qppif7I' },
  { id: 'rope-crunch', naam: 'Rope Crunch', groep: 'core', type: 'isolatie', equipment: ['hogekabel', 'kabeltouw'], spier: 'buik', stap: 2.5, video: '6GMKPQVERzw' },
  { id: 'side-plank', naam: 'Side Plank', groep: 'core', type: 'isolatie', equipment: ['mat'], spier: 'buik', stap: 0, eenheid: 'sec', video: 'KzEakx0Oja8' },
  { id: 'side-plank-with-limb-raises', naam: 'Side Plank with Limb Raises', groep: 'core', type: 'isolatie', equipment: ['mat'], spier: 'buik', stap: 0, eenheid: 'sec', video: 'rNDhOJjF8TI' },
  { id: 'v-up', naam: 'V-Up', groep: 'core', type: 'isolatie', equipment: ['mat'], spier: 'buik', stap: 0, video: 'BIOM5eSsJ_8' },

];

export const byId = id => EXERCISES.find(e => e.id === id);

// Nederlandse namen van de spiergroepen, voor de indeling in het overzicht.
export const SPIERGROEPEN = {
  borst: 'Borst', rug: 'Rug', quadriceps: 'Quadriceps', hamstrings: 'Hamstrings',
  bilspieren: 'Bilspieren', kuiten: 'Kuiten', voordelt: 'Voorkant schouder',
  zijdelt: 'Zijkant schouder', achterdelt: 'Achterkant schouder', biceps: 'Biceps',
  triceps: 'Triceps', trapezius: 'Trapezius', onderarmen: 'Onderarmen', buik: 'Buik',
};

/** Leesbare namen van de apparatuur die een oefening vraagt. */
export const apparatuurNamen = oefening =>
  oefening.equipment.map(id => INVENTARIS.find(i => i.id === id)?.naam ?? id);

/**
 * Zoeken op naam, spiergroep of apparatuur. Matcht op woordbegin, niet op
 * willekeurige deelstrings: "row" vindt wel "Barbell Bent Over Row" maar niet
 * "Narrow Pushup". Meerdere woorden moeten allemaal voorkomen.
 */
export function zoek(term, lijst = EXERCISES) {
  const woorden = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!woorden.length) return lijst;
  const patronen = woorden.map(w => new RegExp('\\b' + ontsnap(w), 'i'));
  return lijst.filter(o => {
    const hooiberg = `${o.naam} ${SPIERGROEPEN[o.spier] ?? o.spier} ${apparatuurNamen(o).join(' ')}`;
    return patronen.every(p => p.test(hooiberg));
  });
}

// Leestekens in de zoekterm mogen geen regex-betekenis krijgen.
const ontsnap = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Oefeningen die uitvoerbaar zijn met de aanwezige apparatuur. */
export function beschikbaar(aanwezig) {
  const set = new Set(aanwezig);
  return EXERCISES.filter(e => e.equipment.every(eq => set.has(eq)));
}

