// Ingesloten YouTube-speler. Twee niveaus:
//   1. `video` op de oefening -> die ene video (het meest specifiek)
//   2. anders de playlist van de spiergroep, ingesloten als afspeellijst
// De speler laadt pas als je hem opent, zodat een workout met acht oefeningen
// niet acht iframes tegelijk ophaalt.

import { PLAYLISTS } from './exercises.js';

// Accepteert een kale ID of een volledige YouTube-URL in het `video`-veld.
export function videoId(waarde) {
  if (!waarde) return null;
  if (/^[\w-]{11}$/.test(waarde)) return waarde;
  const m = String(waarde).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Wat er te zien is bij een oefening: een losse video, een playlist, of niets. */
export function bron(oefening) {
  const id = videoId(oefening.video);
  if (id) return { soort: 'video', id, label: 'Uitleg' };
  const pl = PLAYLISTS[oefening.spier];
  if (pl) return { soort: 'playlist', id: pl.lijst, label: `Uitleg: ${pl.naam}` };
  return null;
}

export function insluitUrl(b) {
  // youtube-nocookie zet geen advertentiecookies voordat je afspeelt.
  const basis = 'https://www.youtube-nocookie.com/embed/';
  return b.soort === 'video'
    ? `${basis}${b.id}?rel=0`
    : `${basis}videoseries?list=${b.id}&rel=0`;
}

export function kijkUrl(b) {
  return b.soort === 'video'
    ? `https://www.youtube.com/watch?v=${b.id}`
    : `https://www.youtube.com/playlist?list=${b.id}`;
}

/**
 * Bouwt de speler. Niet elke video mag ingesloten worden; als de uploader dat
 * heeft uitgezet blijft het kader leeg, dus staat er altijd een link naast.
 */
export function speler(b) {
  const doos = document.createElement('div');
  doos.className = 'video';
  doos.innerHTML = `
    <div class="video-kader">
      <iframe src="${insluitUrl(b)}" title="${b.label}" loading="lazy"
        allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
    <p class="sub">Speelt de video niet af? <a href="${kijkUrl(b)}" target="_blank"
      rel="noopener">Openen op YouTube</a></p>`;
  return doos;
}
