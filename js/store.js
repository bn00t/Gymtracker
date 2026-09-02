// Opslag-adapter. Twee implementaties met dezelfde interface:
//   local  -> localStorage, werkt direct, per browser
//   sheets -> Google Apps Script Web App, spreadsheet met een tab per gebruiker
// Welke van de twee het wordt, bepaalt BACKEND_URL in config.js; de rest van
// de app merkt het verschil niet.

import { BACKEND_URL } from './config.js';

const KEY = 'gymtracker';

const leeg = () => ({ profiel: null, schema: null, workouts: [], apparatuur: [] });

class LocalStore {
  constructor(gebruiker) { this.gebruiker = gebruiker; }
  get _key() { return `${KEY}:${this.gebruiker}`; }

  async laden() {
    try { return { ...leeg(), ...JSON.parse(localStorage.getItem(this._key) || '{}') }; }
    catch { return leeg(); }
  }
  async opslaan(data) {
    localStorage.setItem(this._key, JSON.stringify(data));
    return data;
  }
  static gebruikers() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(KEY + ':'))
      .map(k => k.slice(KEY.length + 1));
  }
}

class SheetsStore {
  constructor(gebruiker, url) { this.gebruiker = gebruiker; this.url = url; }

  async _call(actie, payload) {
    // Apps Script accepteert text/plain zonder CORS-preflight.
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ actie, gebruiker: this.gebruiker, ...payload }),
    });
    if (!res.ok) throw new Error(`Backend gaf ${res.status}`);
    const json = await res.json();
    if (json.fout) throw new Error(json.fout);
    return json;
  }
  async laden()          { const r = await this._call('laden'); return { ...leeg(), ...(r.data || {}) }; }
  async opslaan(data)    { await this._call('opslaan', { data }); return data; }
  async gebruikers()     { const r = await this._call('gebruikers'); return r.gebruikers || []; }
}

export function maakStore({ gebruiker }) {
  return BACKEND_URL
    ? new SheetsStore(gebruiker, BACKEND_URL)
    : new LocalStore(gebruiker);
}

/** Waar de app op dit moment opslaat, voor de regel in Instellingen. */
export const opslagSoort = () => (BACKEND_URL ? 'spreadsheet' : 'deze browser');

/**
 * Namen om uit te kiezen op het aanmeldscherm. Met een spreadsheet komt die
 * lijst uit de tabbladen daar, zodat je op een nieuw apparaat je eigen naam
 * ziet staan in plaats van een leeg vak.
 */
export async function bestaandeGebruikers() {
  if (!BACKEND_URL) return LocalStore.gebruikers();
  try {
    return await new SheetsStore('_', BACKEND_URL).gebruikers();
  } catch {
    return LocalStore.gebruikers();   // backend onbereikbaar: toon wat we lokaal weten
  }
}

// Instellingen van de app zelf (welke backend, welke gebruiker) staan altijd lokaal.
export const config = {
  lees() {
    try { return JSON.parse(localStorage.getItem(KEY + ':config') || '{}'); }
    catch { return {}; }
  },
  schrijf(c) { localStorage.setItem(KEY + ':config', JSON.stringify(c)); },
};
