(function () {
  "use strict";
  if (!document.body || document.body.dataset.page !== "tool-sonics") {
    return;
  }

  /* =====================================================================
     Vendigroth Sonics – generátor hudby
     1. Skladatel: ze seedu složí téma (4 fráze), harmonii a formu skladby.
     2. Hráč: události naplánuje do Web Audio (samply + syntéza + ozvěna).
     Skladba je daná seedem, takže stejný název zní vždy stejně.
     ===================================================================== */

  /* ---------- Náhoda ---------- */
  function hashStr(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function Rng(seed) { this.s = seed >>> 0; }
  Rng.prototype.next = function () {
    let t = (this.s = (this.s + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Rng.prototype.range = function (a, b) { return a + this.next() * (b - a); };
  Rng.prototype.int = function (a, b) { return a + Math.floor(this.next() * (b - a)); };
  Rng.prototype.pick = function (list) { return list[this.int(0, list.length)]; };
  Rng.prototype.chance = function (p) { return this.next() < p; };

  function sub(seed, key) {
    let h = (seed ^ Math.imul(key + 0x9E3779B9, 0x85EBCA6B)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0;
    return new Rng(h ^ (h >>> 16));
  }

  const mod = (a, n) => ((a % n) + n) % n;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "B", "H"];

  /* ---------- Stupnice ----------
     st   = půltóny od tóniky
     bass = stupně, na které smí harmonie odejít z tóniky */
  const SCALES = {
    minPent: { label: "mollová pentatonika", st: [0, 3, 5, 7, 10], bass: [4, 2, 3, 1] },
    majPent: { label: "durová pentatonika", st: [0, 2, 4, 7, 9], bass: [4, 3, 1] },
    hira: { label: "hirajóši", st: [0, 2, 3, 7, 8], bass: [4, 3] },
    insen: { label: "in-sen", st: [0, 1, 5, 7, 10], bass: [4, 2, 3] },
    kumoi: { label: "kumoi", st: [0, 2, 3, 7, 9], bass: [3, 1] },
    yo: { label: "jó", st: [0, 2, 5, 7, 9], bass: [2, 3, 1] },
    dorian: { label: "dórská", st: [0, 2, 3, 5, 7, 9, 10], bass: [6, 3, 4, 2] },
    phryg: { label: "frygická", st: [0, 1, 3, 5, 7, 8, 10], bass: [1, 6, 3, 5] },
    hijaz: { label: "hidžáz", st: [0, 1, 4, 5, 7, 8, 10], bass: [1, 6, 3] },
    aeol: { label: "aiolská", st: [0, 2, 3, 5, 7, 8, 10], bass: [5, 6, 3, 4] }
  };

  function stepToSemi(scale, step) {
    const n = scale.st.length;
    return 12 * Math.floor(step / n) + scale.st[mod(step, n)];
  }

  // Tóny akordu nad basem: prima, kvinta, tercie; u pentatonik se doplní kvarta nebo septima.
  function chordPcs(scale, bassIdx) {
    const b = scale.st[bassIdx];
    const rel = (p) => mod(p - b, 12);
    const pcs = scale.st.filter((p) => [0, 7, 3, 4].includes(rel(p)));
    [5, 10, 2].forEach((want) => {
      if (pcs.length >= 3) return;
      const hit = scale.st.find((p) => rel(p) === want && !pcs.includes(p));
      if (hit !== undefined) pcs.push(hit);
    });
    return pcs;
  }

  function isChordStep(scale, pcs, step) {
    return pcs.includes(scale.st[mod(step, scale.st.length)]);
  }

  function nearestChordStep(scale, pcs, step, excludeIdx) {
    const n = scale.st.length;
    for (let d = 0; d <= n; d += 1) {
      const order = d === 0 ? [step] : [step - d, step + d];
      for (let i = 0; i < order.length; i += 1) {
        const s = order[i];
        if (isChordStep(scale, pcs, s) && (excludeIdx === undefined || mod(s, n) !== excludeIdx)) return s;
      }
    }
    return step;
  }

  /* ---------- Samply ----------
     Základní frekvence jsou změřené z nahrávek, ne odhadnuté z názvů souborů. */
  const SAMPLE_PATH = "assets/zvuky/sonics/";
  // Zdroje a licence: assets/zvuky/sonics/ZDROJE.md
  const BANK = {
    kay: { url: "kajagum-g4.flac" },
    harp: { url: "harfa-c5.flac" },
    oudG: { url: "ud-g2.flac" },
    oudA: { url: "ud-a2.flac" },
    oudC: { url: "ud-c3.flac" },
    gtrLow: { url: "kytara-e2.flac" },
    gtrG3: { url: "kytara-g3.flac" },
    gtrGesture: { url: "kytara-gesto.flac" },
    bassG1: { url: "basa-g1.flac" },
    bassH1: { url: "basa-h1.flac" },
    bassD2: { url: "basa-d2.flac" },
    bassG2: { url: "basa-g2.flac" },
    bassA2: { url: "basa-a2.flac" },
    bassD3: { url: "basa-d3.flac" },
    kalimba: { url: "kalimba-a3.flac" },
    pizz: { url: "pizzicato-e5.flac" },
    shakLow: { url: "sakuhaci-dis3.flac" },
    shakE: { url: "sakuhaci-e4.flac" },
    shakG: { url: "sakuhaci-g4.flac" },
    bambus: { url: "bambus-g3.flac" },
    duduk: { url: "duduk-c4.flac" },
    fluteA: { url: "fletna-a5.flac" },
    fluteE: { url: "fletna-e6.flac" },
    violin: { url: "housle-fis6.flac" },
    taiko: { url: "buben-taiko.flac" },
    drumMid: { url: "buben-stredni.flac" },
    drumSoft: { url: "buben-tlumeny.flac" },
    tek: { url: "buben-tek.flac" },
    impact: { url: "kytara-rana.flac" },
    bowlLow: { url: "misa-hluboka.flac" },
    bowlHi: { url: "misa-vysoka.flac" },
    scrape: { url: "housle-skrip.flac" }
  };

  /* ---------- Nástroje ----------
     pluck = drnkací (tón doznívá sám), sus = držený tón (dechy, smyčce).
     U držených tónů: off = začátek stabilní části nahrávky, win = její délka,
     scoopOff = začátek s přirozeným nájezdem na tón. */
  const INST = {
    kayageum: { kind: "pluck", label: "kajagum", zones: [{ k: "kay", f: 392.0 }], lo: 50, hi: 77, center: 64, acc: 55, gain: 0.34, ring: 3.4 },
    harp: { kind: "pluck", label: "harfa", zones: [{ k: "harp", f: 525.0 }], lo: 57, hi: 84, center: 69, acc: 60, gain: 0.3, ring: 3.0 },
    oud: { kind: "pluck", label: "úd", zones: [{ k: "oudG", f: 98.0 }, { k: "oudA", f: 110.2 }, { k: "oudC", f: 131.1 }], lo: 38, hi: 62, center: 52, acc: 45, gain: 0.34, ring: 2.6 },
    guitar: { kind: "pluck", label: "kytara", zones: [{ k: "gtrLow", f: 83.3 }, { k: "gtrG3", f: 195.8 }], lo: 38, hi: 64, center: 53, acc: 47, gain: 0.4, ring: 3.2 },
    bass: { kind: "pluck", label: "basa", zones: [{ k: "bassG1", f: 48.5 }, { k: "bassH1", f: 62.05 }, { k: "bassD2", f: 73.74 }, { k: "bassG2", f: 98.69 }, { k: "bassA2", f: 110.9 }, { k: "bassD3", f: 148.7 }], lo: 28, hi: 50, center: 40, acc: 40, gain: 0.42, ring: 3.4 },
    kalimba: { kind: "pluck", label: "kalimba", zones: [{ k: "kalimba", f: 220.3 }], lo: 52, hi: 84, center: 69, acc: 62, gain: 0.3, ring: 2.4 },
    pizz: { kind: "pluck", label: "pizzicato", zones: [{ k: "pizz", f: 658.0 }], lo: 64, hi: 93, center: 81, acc: 76, gain: 0.2, ring: 1.2 },
    bowl: { kind: "pluck", label: "mísa", zones: [{ k: "bowlHi", f: 759.0 }], lo: 67, hi: 93, center: 81, acc: 79, gain: 0.26, ring: 2.0 },
    shaku: {
      kind: "sus", label: "šakuhači",
      zones: [
        { k: "shakLow", f: 153.9, off: 0.62, win: 1.9 },
        { k: "shakE", f: 328.7, off: 4.3, win: 3.8, scoopOff: 1.4, scoopWin: 6.6 },
        { k: "shakG", f: 397.7, off: 2.3, win: 3.8, scoopOff: 0.78, scoopWin: 5.3 }
      ],
      lo: 52, hi: 76, center: 66, atk: 0.09, rel: 0.4, gain: 0.34
    },
    bamboo: { kind: "sus", label: "bambusová flétna", zones: [{ k: "bambus", f: 197.3, off: 0.3, win: 3.4 }], lo: 48, hi: 62, center: 55, atk: 0.14, rel: 0.5, gain: 0.3 },
    duduk: { kind: "sus", label: "duduk", zones: [{ k: "duduk", f: 261.3, off: 0.05, win: 3.75 }], lo: 50, hi: 70, center: 60, atk: 0.05, rel: 0.35, gain: 0.3, vib: [4.7, 13] },
    flute: {
      kind: "sus", label: "flétna",
      zones: [{ k: "fluteA", f: 878.5, off: 0.04, win: 6.4 }, { k: "fluteE", f: 1319.6, off: 0.25, win: 8.6 }],
      lo: 65, hi: 88, center: 75, atk: 0.06, rel: 0.32, gain: 0.3
    },
    violin: { kind: "sus", label: "housle", zones: [{ k: "violin", f: 1508.0, off: 0.3, win: 4.9 }], lo: 66, hi: 90, center: 78, atk: 0.7, rel: 1.4, gain: 0.16 }
  };

  /* ---------- Atmosféry ---------- */
  const BIOMES = {
    tavern: { label: "Bazar", colors: ["#ffdd55", "#d8a247"], scales: ["dorian", "hijaz", "minPent"], bpm: [84, 96], leads: ["duduk", "flute"], pluck: "guitar", acc: "oud", bass: "oud", kit: "bazaar", spore: 0.1, grit: 0, wind: 0.5, flow: 1.35, droneCut: 300, texInst: "pizz" },
    ashlands: { label: "Terasové pole popela", colors: ["#d8a247", "#6b5131"], scales: ["hira", "insen", "minPent"], bpm: [58, 68], leads: ["shaku", "duduk"], pluck: "kayageum", acc: "kayageum", bass: "bass", kit: "taiko", spore: 0.2, grit: 0.5, wind: 0.9, flow: 0.8, droneCut: 240, texInst: "bowl", call: true },
    bamboo: { label: "Lotosové břehy rzi", colors: ["#00ff9d", "#7ab37d"], scales: ["yo", "majPent", "kumoi"], bpm: [66, 78], leads: ["flute", "shaku"], pluck: "harp", acc: "kayageum", bass: "oud", kit: "taiko", spore: 0.35, grit: 0.15, wind: 0.6, flow: 1.1, droneCut: 320, texInst: "kalimba", call: true },
    dunes: { label: "Pohřebiště vzducholodí", colors: ["#ffbb6b", "#8b6132"], scales: ["phryg", "hijaz", "aeol"], bpm: [60, 72], leads: ["duduk", "shaku"], pluck: "guitar", acc: "oud", bass: "bass", kit: "bazaar", spore: 0.1, grit: 0.8, wind: 1, flow: 0.9, droneCut: 220, texInst: "pizz", call: true },
    fungal: { label: "Visuté město", colors: ["#5effd1", "#7b5d9c"], scales: ["minPent", "dorian", "kumoi"], bpm: [54, 64], leads: ["flute", "duduk"], pluck: "harp", acc: "kayageum", bass: "oud", kit: "taiko", spore: 1, grit: 0.1, wind: 0.5, flow: 0.8, droneCut: 340, texInst: "bowl", bowls: true },
    ruins: { label: "Průsmyk šeptajících spór", colors: ["#ff7e62", "#c2b5a3"], scales: ["insen", "hira", "phryg"], bpm: [50, 60], leads: ["shaku", "duduk"], pluck: "kayageum", acc: "guitar", bass: "bass", kit: "taiko", spore: 0.7, grit: 1, wind: 0.9, flow: 0.7, droneCut: 200, texInst: "pizz", scrape: true, call: true },
    catacombs: { label: "Labyrint zrcadlových očí", colors: ["#8eff78", "#73644b"], scales: ["hira", "kumoi", "insen"], bpm: [48, 56], leads: ["shaku", "flute"], pluck: "harp", acc: "kayageum", bass: "oud", kit: "taiko", spore: 0.5, grit: 0.3, wind: 0.4, flow: 0.6, droneCut: 260, texInst: "kalimba", bowls: true, scrape: true, call: true }
  };

  const MOODS = {
    meditative: { label: "Meditativní", tempo: 0.9, drums: -1, flow: 0.55, grit: 0 },
    pilgrim: { label: "Poutnická", tempo: 1.0, drums: 0, flow: 1.15, grit: 0, accUp: true },
    melancholy: { label: "Melancholická", tempo: 0.84, drums: -1, flow: 0.7, grit: 0, low: true },
    ominous: { label: "Zlověstná", tempo: 0.9, drums: 0, flow: 0.7, grit: 0.6, impact: true },
    ritual: { label: "Rituální", tempo: 0.96, drums: 1, flow: 0.6, grit: 0.1, bowls: true }
  };

  /* ---------- Forma ---------- */
  const RECIPES = {
    intro: { label: "Úvod", bars: 4, theme: null, lead: "none", acc: "sparse", drums: 0, pad: 0.55, bass: false, intensity: 0.2, hint: true },
    theme: { label: "Téma", bars: 8, theme: "A", lead: "solo", acc: "punct", drums: 0, pad: 0.8, bass: false, intensity: 0.45 },
    answer: { label: "Odpověď", bars: 8, theme: "A", lead: "call", acc: "punct", drums: 1, pad: 0.85, bass: true, intensity: 0.6 },
    echo: { label: "Ozvěna", bars: 8, theme: "B", lead: "pluck", acc: "none", drums: 0, pad: 0.75, bass: false, intensity: 0.4 },
    develop: { label: "Rozvedení", bars: 8, theme: "B", lead: "solo2", acc: "ostinato", drums: 1, pad: 0.9, bass: true, intensity: 0.75 },
    peak: { label: "Vrchol", bars: 8, theme: "A", lead: "solo", acc: "ostinato", drums: 2, pad: 1, bass: true, strings: true, grit: true, intensity: 1 },
    breath: { label: "Nádech", bars: 4, theme: null, lead: "none", acc: "sparse", drums: 0, pad: 0.6, bass: false, intensity: 0.25, gesture: true }
  };

  const CURVES = {
    slow_burn: { form: ["intro", "theme", "answer", "develop", "peak", "breath"], drums: 0 },
    sudden_danger: { form: ["peak", "develop", "breath", "theme", "answer", "peak"], drums: 0, strike: true },
    ambient_waves: { form: ["intro", "theme", "breath", "echo", "answer", "breath"], drums: -1 },
    constant_tension: { form: ["answer", "develop", "peak", "echo", "develop", "peak"], drums: 1 }
  };

  /* ---------- Rytmy frází (v dobách, součet 8; záporná hodnota = pomlka) ---------- */
  const RHY_SLOW = [
    [3, 1, 2, -2], [2, 1, 1, 2.5, -1.5], [1.5, 0.5, 2, 1, 1.5, -1.5], [1, 1, 1, 3, -2], [4, 2, -2],
    [1.5, 1.5, 1, 2.5, -1.5], [2, 0.5, 0.5, 1, 2.5, -1.5], [3, 0.5, 0.5, 2.5, -1.5], [1, 2, 1, 2.5, -1.5], [2, 2, 1, 1.5, -1.5]
  ];
  const RHY_FLOW = [
    [1, 0.5, 0.5, 2, 2, -2], [0.5, 0.5, 1, 2, 1, 1.5, -1.5], [1, 0.5, 0.5, 1, 1, 0.5, 0.5, 1.5, -1.5],
    [1.5, 0.5, 1, 1, 1.5, 0.5, 1, -1], [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1.5, -1.5], [1, 1, 0.5, 0.5, 1, 2.5, -1.5],
    [0.5, 0.5, 0.5, 0.5, 2, 1, 1, 1.5, -1.5]
  ];

  // Doprovodné figury: index do tónů akordu odspodu, -1 = pomlka. Osm osmin v taktu.
  const OSTINATI = [
    [0, -1, 1, -1, 2, -1, 1, -1], [0, -1, 1, 2, -1, 1, 2, -1], [0, 1, 2, 1, 3, 1, 2, 1], [0, -1, -1, 1, 2, -1, 1, -1],
    [0, -1, 2, -1, 1, -1, 2, 3], [0, 1, -1, 2, -1, 1, 2, -1], [0, -1, 2, 1, -1, 2, -1, 1]
  ];

  // Bicí: [osmina v dvoutaktí (0–15), nástroj, síla]
  const DRUMS = {
    taiko: {
      1: [[0, "taiko", 0.8], [12, "drumSoft", 0.45]],
      2: [[0, "taiko", 0.85], [6, "drumMid", 0.5], [8, "taiko", 0.6], [11, "drumSoft", 0.4], [12, "drumSoft", 0.5], [14, "drumMid", 0.5]],
      3: [[0, "taiko", 0.95], [3, "drumSoft", 0.35], [4, "drumMid", 0.55], [6, "drumSoft", 0.4], [8, "taiko", 0.7], [10, "drumMid", 0.5], [11, "drumSoft", 0.35], [12, "drumMid", 0.6], [14, "drumSoft", 0.45], [15, "drumMid", 0.4]]
    },
    bazaar: {
      1: [[0, "drumMid", 0.75], [3, "tek", 0.4], [4, "drumMid", 0.55], [6, "tek", 0.45], [8, "drumMid", 0.7], [11, "tek", 0.4], [12, "drumMid", 0.5], [14, "tek", 0.45]],
      2: [[0, "drumMid", 0.85], [1, "tek", 0.5], [3, "tek", 0.55], [4, "drumMid", 0.65], [6, "tek", 0.55], [8, "drumMid", 0.8], [9, "tek", 0.5], [11, "tek", 0.55], [12, "drumMid", 0.65], [14, "tek", 0.6], [15, "drumSoft", 0.4]],
      3: [[0, "drumMid", 0.95], [1, "tek", 0.55], [2, "drumSoft", 0.35], [3, "tek", 0.6], [4, "drumMid", 0.7], [5, "drumSoft", 0.35], [6, "tek", 0.6], [7, "drumSoft", 0.4], [8, "drumMid", 0.9], [9, "tek", 0.55], [10, "drumSoft", 0.35], [11, "tek", 0.6], [12, "drumMid", 0.7], [13, "tek", 0.45], [14, "tek", 0.65], [15, "tek", 0.5]]
    }
  };

  /* =====================================================================
     SKLADATEL
     ===================================================================== */

  function walk(rng, rhythm, start, shape, lo, hi, wide) {
    const notes = [];
    const count = rhythm.filter((d) => d > 0).length;
    let t = 0, cur = start, lastMv = 0, i = 0;
    rhythm.forEach((d) => {
      if (d < 0) { t += -d; return; }
      if (i > 0) {
        const ph = i / Math.max(1, count - 1);
        let dir;
        if (shape === "arch") dir = ph <= 0.5 ? 1 : -1;
        else if (shape === "vale") dir = ph <= 0.5 ? -1 : 1;
        else if (shape === "rise") dir = 1;
        else if (shape === "fall") dir = -1;
        else dir = i % 4 < 2 ? 1 : -1;
        const stride = wide && rng.chance(0.35) ? 2 : 1;
        const r = rng.next();
        let mv;
        if (Math.abs(lastMv) >= 2) mv = -Math.sign(lastMv);
        else if (r < 0.1) mv = 0;
        else if (r < 0.7) mv = dir * stride;
        else if (r < 0.84) mv = -dir;
        else mv = dir * (rng.chance(0.7) ? 2 : 3);
        if (cur + mv > hi) mv = -1;
        if (cur + mv < lo) mv = 1;
        cur += mv;
        lastMv = mv;
      }
      notes.push({ t: t, d: d, step: cur });
      t += d;
      i += 1;
    });
    return notes;
  }

  const cloneNotes = (notes) => notes.map((n) => ({ t: n.t, d: n.d, step: n.step }));

  function settleLongs(notes, scale, pcs) {
    notes.forEach((n, i) => {
      if (n.d >= 2 || i === 0) n.step = nearestChordStep(scale, pcs, n.step);
    });
  }

  function holdLast(notes) {
    const last = notes[notes.length - 1];
    last.d = Math.max(last.d, Math.min(2.5, 6.75 - last.t));
  }

  function endOpen(notes, scale, pcs, avoidTonic) {
    const L = notes.length;
    const last = notes[L - 1];
    last.step = nearestChordStep(scale, pcs, last.step, avoidTonic ? 0 : undefined);
    if (L > 1 && notes[L - 2].step === last.step) notes[L - 2].step += 1;
    holdLast(notes);
  }

  function endCadence(notes, scale, rng) {
    const n = scale.st.length;
    const L = notes.length;
    const ref = L > 1 ? notes[L - 2].step : notes[L - 1].step;
    const ton = Math.round(ref / n) * n;
    const last = notes[L - 1];
    last.step = ton;
    if (L > 1) {
      const ap = notes[L - 2];
      if (ap.step === ton) ap.step = ton + (rng.chance(0.6) ? 1 : -1);
      else if (Math.abs(ap.step - ton) > 2) ap.step = ton + Math.sign(ap.step - ton);
    }
    last.d = Math.max(last.d, Math.min(3.5, 7 - last.t));
  }

  // Téma = čtyři dvoutaktové fráze: otázka, obměna, kontrast, návrat se závěrem na tónice.
  function genTheme(rng, scale, prog, opt) {
    const n = scale.st.length;
    const wide = n >= 7;
    const lo = -Math.ceil(n * 0.6), hi = n + 1;
    const pcs = prog.map((b) => chordPcs(scale, b));
    const pool = (flowP) => (rng.chance(flowP) ? RHY_FLOW : RHY_SLOW);
    const R1 = rng.pick(pool(opt.flow));
    let R2 = rng.pick(pool(Math.min(1, opt.flow + 0.2)));
    if (R2 === R1) R2 = rng.pick(RHY_SLOW);

    const starts = [];
    for (let s = opt.high ? 2 : 0; s <= (opt.high ? n : n - 1); s += 1) if (isChordStep(scale, pcs[0], s)) starts.push(s);
    const start = starts.length ? rng.pick(starts) : 0;
    const shapes = opt.high ? ["fall", "wave", "vale"] : ["arch", "arch", "rise", "wave"];

    const p1 = walk(rng, R1, start, rng.pick(shapes), lo, hi, wide);
    settleLongs(p1, scale, pcs[0]);
    endOpen(p1, scale, pcs[0], prog[0] === 0);

    // Obměna: nejdřív zkus sekvenci (stejný motiv o stupeň jinde), jinak nový konec.
    let p2 = null;
    const shifts = [1, -1, 2, -2].sort(() => rng.next() - 0.5);
    for (let i = 0; i < shifts.length && !p2; i += 1) {
      const cand = cloneNotes(p1).map((x) => { x.step += shifts[i]; return x; });
      const okRange = cand.every((x) => x.step >= lo && x.step <= hi);
      if (okRange && isChordStep(scale, pcs[1], cand[cand.length - 1].step)) p2 = cand;
    }
    if (!p2) {
      p2 = cloneNotes(p1);
      const from = Math.ceil(p2.length / 2);
      for (let i = from; i < p2.length; i += 1) {
        const mv = rng.chance(0.7) ? -1 : 1;
        p2[i].step = clamp(p2[i - 1].step + mv, lo, hi);
      }
    }
    settleLongs(p2, scale, pcs[1]);
    endOpen(p2, scale, pcs[1], false);

    const top = Math.max.apply(null, p1.map((x) => x.step));
    const s3 = nearestChordStep(scale, pcs[2], Math.min(hi - 1, top + 1));
    const p3 = walk(rng, R2, s3, rng.chance(0.6) ? "fall" : "arch", lo, hi, wide);
    settleLongs(p3, scale, pcs[2]);
    endOpen(p3, scale, pcs[2], false);

    const p4 = cloneNotes(p1);
    if (prog[3] === 0) endCadence(p4, scale, rng);
    else endOpen(p4, scale, pcs[3], false);

    return { prog: prog, phrases: [p1, p2, p3, p4] };
  }

  function pickProg(rng, scale, home) {
    const X = scale.bass[rng.chance(0.55) ? 0 : rng.int(0, scale.bass.length)];
    const others = scale.bass.filter((b) => b !== X);
    const Y = others.length ? rng.pick(others) : X;
    const list = home
      ? [[0, X, Y, 0], [0, 0, X, 0], [0, X, X, 0], [0, X, 0, 0]]
      : [[X, 0, Y, X], [X, Y, 0, Y], [X, X, Y, 0], [0, X, Y, X]];
    return rng.pick(list);
  }

  function buildPlan(cfg) {
    const seed = hashStr(cfg.name || "Vendigroth");
    const biome = BIOMES[cfg.biome] || BIOMES.ashlands;
    const mood = MOODS[cfg.mood] || MOODS.meditative;
    const curve = CURVES[cfg.curve] || CURVES.slow_burn;
    const density = clamp(Number(cfg.density) || 0.8, 0.2, 1.4);
    const r = sub(seed, 1);

    const scaleKey = r.pick(biome.scales);
    const scale = SCALES[scaleKey];
    const tonic = 45 + r.int(0, 12);
    const bpm = Math.round(r.range(biome.bpm[0], biome.bpm[1]) * mood.tempo);
    const flow = clamp((density - 0.45) * 0.75 * biome.flow * mood.flow, 0, 0.95);

    let lead1 = cfg.lead && INST[cfg.lead] ? cfg.lead : (r.chance(0.7) ? biome.leads[0] : biome.leads[1]);
    const lead2 = biome.leads.find((x) => x !== lead1) || lead1;
    if (!INST[lead1]) lead1 = biome.leads[0];

    const progA = pickProg(sub(seed, 2), scale, true);
    const themeA = genTheme(sub(seed, 3), scale, progA, { flow: flow, high: false });

    let beat = 0;
    const sections = curve.form.map((key, i) => {
      const rec = RECIPES[key];
      const sec = { key: key, rec: rec, index: i, startBeat: beat, beats: rec.bars * 4, strike: !!curve.strike && i === 0 };
      beat += sec.beats;
      return sec;
    });

    return {
      seed: seed, cfg: cfg, biome: biome, mood: mood, curve: curve, density: density, flow: flow,
      scaleKey: scaleKey, scale: scale, tonic: tonic, bpm: bpm, beat: 60 / bpm,
      lead1: lead1, lead2: lead2, themeA: themeA, sections: sections, cycleBeats: beat,
      ostinato: sub(seed, 4).pick(OSTINATI), themeBCache: {}
    };
  }

  function themeB(plan, cycle) {
    if (!plan.themeBCache[cycle]) {
      const prog = pickProg(sub(plan.seed, 50 + cycle), plan.scale, false);
      plan.themeBCache[cycle] = genTheme(sub(plan.seed, 70 + cycle), plan.scale, prog, { flow: Math.min(0.95, plan.flow + 0.15), high: true });
    }
    return plan.themeBCache[cycle];
  }

  // Najde oktávu tóniky tak, aby téma sedělo do rozsahu nástroje.
  function tonicFor(plan, theme, inst, center) {
    const semis = [];
    theme.phrases.forEach((p) => p.forEach((x) => semis.push(stepToSemi(plan.scale, x.step))));
    const mean = semis.reduce((a, b) => a + b, 0) / semis.length;
    const lowest = Math.min.apply(null, semis), highest = Math.max.apply(null, semis);
    let best = plan.tonic, bestScore = Infinity;
    for (let k = -2; k <= 4; k += 1) {
      const ton = plan.tonic + 12 * k;
      let score = Math.abs(ton + mean - center);
      if (ton + lowest < inst.lo) score += (inst.lo - ton - lowest) * 3;
      if (ton + highest > inst.hi) score += (ton + highest - inst.hi) * 3;
      if (score < bestScore) { bestScore = score; best = ton; }
    }
    return best;
  }

  function fitMidi(midi, inst) {
    let m = midi;
    while (m < inst.lo) m += 12;
    while (m > inst.hi) m -= 12;
    return m;
  }

  // Tóny akordu odspodu, začíná basovým tónem poblíž zadané výšky.
  function chordLadder(plan, bassIdx, nearMidi, count) {
    const scale = plan.scale, n = scale.st.length;
    const pcs = chordPcs(scale, bassIdx);
    let root = bassIdx;
    while (plan.tonic + stepToSemi(scale, root) > nearMidi + 3) root -= n;
    while (plan.tonic + stepToSemi(scale, root) < nearMidi - 8) root += n;
    const out = [];
    for (let s = root; out.length < count; s += 1) {
      if (isChordStep(scale, pcs, s)) out.push(plan.tonic + stepToSemi(scale, s));
    }
    return out;
  }

  function padVoicing(plan, bassIdx) {
    const scale = plan.scale;
    const b = scale.st[bassIdx];
    let root = plan.tonic + b;
    while (root > 55) root -= 12;
    while (root < 43) root += 12;
    const has = (rel) => scale.st.some((p) => mod(p - b, 12) === rel);
    const fifth = has(7) ? 7 : (has(5) ? 5 : 12);
    const color = has(3) ? 3 : has(4) ? 4 : has(10) ? 10 : has(2) ? 2 : 12;
    return [root, root + fifth, root + 12 + color];
  }

  function emitPhrase(plan, ev, notes, baseBeat, instName, role, rng, intensity, ornament) {
    const inst = INST[instName];
    const isSus = inst.kind === "sus";
    const theme = role.theme;
    let center = role.center || inst.center;
    if (plan.mood.low && isSus) center -= 3;
    const ton = tonicFor(plan, theme, inst, center);
    const L = notes.length;
    const beat = plan.beat;
    notes.forEach((x, i) => {
      const midi = fitMidi(ton + stepToSemi(plan.scale, x.step), inst);
      const arc = L > 1 ? Math.sin(Math.PI * (0.15 + 0.7 * (i / (L - 1)))) : 1;
      let vel = (0.5 + 0.3 * arc + (x.d >= 2 ? 0.06 : 0) + rng.range(-0.05, 0.05)) * (0.72 + 0.28 * intensity);
      let t = baseBeat + x.t;
      let d = x.d;
      const grace = ornament && i > 0 && x.d >= 1.5 && rng.chance(0.3);
      if (grace) {
        const gm = fitMidi(ton + stepToSemi(plan.scale, x.step + (isSus ? 1 : -1)), inst);
        ev.push({ t: t - 0.16, type: "note", inst: instName, midi: gm, dur: 0.18 * beat, vel: vel * 0.7, bus: role.bus, pan: role.pan });
      }
      const durSec = isSus ? d * beat * (i < L - 1 ? 1.03 : 0.95) : d * beat;
      const scoop = isSus && i === 0 && d * beat >= 1.7 && rng.chance(0.65);
      ev.push({ t: t, type: "note", inst: instName, midi: midi, dur: durSec, vel: vel, bus: role.bus, pan: role.pan, scoop: scoop, human: 0.012 });
      if (!isSus && x.d >= 2 && midi - 12 >= inst.lo) {
        ev.push({ t: t + 0.02, type: "note", inst: instName, midi: midi - 12, dur: durSec, vel: vel * 0.55, bus: role.bus, pan: role.pan });
      }
    });
  }

  function sectionEvents(plan, cycle, si) {
    const sec = plan.sections[si];
    const rec = sec.rec;
    const biome = plan.biome, mood = plan.mood, scale = plan.scale;
    const rng = sub(plan.seed, 1000 + cycle * 97 + si * 13);
    const ev = [];
    const phrases = rec.bars / 2;
    const theme = rec.theme === "A" ? plan.themeA : rec.theme === "B" ? themeB(plan, cycle) : null;
    const prog = theme ? theme.prog : [0, 0, 0, 0];
    const intensity = rec.intensity;
    const swap = cycle % 2 === 1;
    const leadA = swap ? plan.lead2 : plan.lead1;
    const leadB = swap ? plan.lead1 : plan.lead2;
    const next = plan.sections[(si + 1) % plan.sections.length];
    const gritAmt = clamp(biome.grit + mood.grit, 0, 1);

    let drumLv = 0;
    if (rec.theme) drumLv = clamp(rec.drums + mood.drums + plan.curve.drums, 0, 3);
    if (rec.theme && rec.drums === 0 && mood.drums + plan.curve.drums <= 0) drumLv = 0;
    let acc = rec.acc;
    if (mood.accUp && acc === "punct") acc = "ostinato";
    if (plan.density < 0.45 && acc === "ostinato") acc = "punct";

    ev.push({ t: 0, type: "wind", level: 0.35 + 0.65 * (1 - intensity) });

    for (let p = 0; p < phrases; p += 1) {
      const pb = p * 8;
      const bassIdx = prog[p % prog.length];
      const pcs = chordPcs(scale, bassIdx);
      const accInst = INST[biome.acc];
      const ladder = chordLadder(plan, bassIdx, accInst.acc, 5).map((m) => fitMidi(m, accInst));

      // Plocha pod vším
      ev.push({ t: pb, type: "pad", midis: padVoicing(plan, bassIdx), dur: 8 * plan.beat, vel: rec.pad });

      // Hlavní hlas
      let pluckBusy = false, restFrom = 0;
      if (theme) {
        const notes = theme.phrases[p % 4];
        const lastN = notes[notes.length - 1];
        restFrom = lastN.t + lastN.d;
        let who = null;
        if (rec.lead === "solo") who = leadA;
        else if (rec.lead === "solo2") who = leadB;
        else if (rec.lead === "call") who = p % 2 === 0 ? leadA : biome.pluck;
        else if (rec.lead === "pluck") who = biome.pluck;
        if (who) {
          const isPl = INST[who].kind === "pluck";
          pluckBusy = isPl && who === biome.acc;
          emitPhrase(plan, ev, notes, pb, who, { theme: theme, bus: isPl ? "pluck" : "lead", pan: isPl ? 0.22 : -0.08 }, rng, intensity, cycle > 0 || sec.key === "peak");
        }
      }

      // Doprovod strun
      if (acc === "ostinato" && !pluckBusy) {
        for (let bar = 0; bar < 2; bar += 1) {
          plan.ostinato.forEach((idx, slot) => {
            if (idx < 0) return;
            if (bar === 1 && slot >= 6 && p === phrases - 1) return;
            const v = (slot === 0 ? 0.62 : slot === 4 ? 0.52 : 0.4) + rng.range(-0.04, 0.04);
            ev.push({ t: pb + bar * 4 + slot * 0.5, type: "note", inst: biome.acc, midi: ladder[Math.min(idx, ladder.length - 1)], dur: 1.2, vel: v * (0.7 + 0.3 * intensity), bus: "pluck", pan: -0.28, human: 0.01 });
          });
        }
      } else if (acc === "punct" && !pluckBusy) {
        ev.push({ t: pb, type: "note", inst: biome.acc, midi: ladder[0], dur: 2, vel: 0.6, bus: "pluck", pan: -0.28 });
        ev.push({ t: pb + (rng.chance(0.5) ? 1 : 1.5), type: "note", inst: biome.acc, midi: ladder[1], dur: 2, vel: 0.42, bus: "pluck", pan: -0.28 });
        const at = Math.max(restFrom + 0.25, 6);
        if (at <= 7.1 && rng.chance(0.65)) {
          for (let k = 0; k < 4; k += 1) {
            ev.push({ t: pb + at + k * (0.2 + k * 0.03), type: "note", inst: biome.acc, midi: ladder[Math.min(k + 1, ladder.length - 1)], dur: 2, vel: 0.34 + k * 0.05, bus: "pluck", pan: -0.28 + k * 0.1 });
          }
        }
      } else if (acc === "sparse") {
        ev.push({ t: pb, type: "note", inst: biome.acc, midi: ladder[0], dur: 3, vel: 0.5, bus: "pluck", pan: -0.25 });
        ev.push({ t: pb + 3, type: "note", inst: biome.acc, midi: ladder[2], dur: 3, vel: 0.36, bus: "pluck", pan: -0.1 });
        if (rec.hint && p === phrases - 1) {
          // Úvod napoví první tóny tématu.
          const pl = INST[biome.pluck];
          const ton = tonicFor(plan, plan.themeA, pl, pl.center);
          plan.themeA.phrases[0].slice(0, 3).forEach((x, i) => {
            ev.push({ t: pb + 4 + i * 1.25, type: "note", inst: biome.pluck, midi: fitMidi(ton + stepToSemi(scale, x.step), pl), dur: 2.5, vel: 0.42 + i * 0.04, bus: "pluck", pan: 0.22 });
          });
        } else if (rng.chance(0.6)) {
          ev.push({ t: pb + 5.5, type: "note", inst: biome.acc, midi: ladder[1], dur: 3, vel: 0.32, bus: "pluck", pan: 0.1 });
        }
      }

      // Bas
      if (rec.bass && plan.density >= 0.35) {
        const bi = INST[biome.bass];
        let bm = plan.tonic + scale.st[bassIdx];
        while (bm > 47) bm -= 12;
        bm = fitMidi(bm, bi);
        ev.push({ t: pb, type: "note", inst: biome.bass, midi: bm, dur: 3, vel: 0.62, bus: "bass", pan: 0.05 });
        if (intensity > 0.7) ev.push({ t: pb + 4, type: "note", inst: biome.bass, midi: bm, dur: 2.5, vel: 0.5, bus: "bass", pan: 0.05 });
        if (intensity > 0.9 && rng.chance(0.6)) ev.push({ t: pb + 7, type: "note", inst: biome.bass, midi: fitMidi(chordLadder(plan, bassIdx, bm, 2)[1], bi), dur: 1, vel: 0.42, bus: "bass", pan: 0.05 });
      }

      // Bicí
      if (drumLv > 0) {
        const pat = DRUMS[biome.kit][drumLv];
        const fill = p === phrases - 1 && next.rec.intensity > intensity;
        pat.forEach((h) => {
          if (fill && h[0] >= 12) return;
          ev.push({ t: pb + h[0] * 0.5, type: "drum", k: h[1], vel: h[2] * rng.range(0.88, 1.05), rate: rng.range(0.97, 1.03) });
        });
        if (fill) {
          [0.32, 0.42, 0.55, 0.72].forEach((v, k) => {
            ev.push({ t: pb + 6 + k * 0.5, type: "drum", k: k === 3 ? "taiko" : "drumMid", vel: v, rate: 1 + k * 0.02 });
          });
        }
      }

      // Vzdálené smyčce
      if (rec.strings) {
        const vi = INST.violin;
        const top = chordLadder(plan, bassIdx, 74, 3);
        ev.push({ t: pb + 0.5, type: "note", inst: "violin", midi: fitMidi(top[p % 2 === 0 ? 1 : 2], vi), dur: 6.5 * plan.beat, vel: 0.5, bus: "strings", pan: 0.3 });
      }

      // Spóry: tiché kapky vysoko, hlavně v pauzách melodie
      if (rng.chance(biome.spore * 0.75)) {
        const ti = INST[biome.texInst];
        const k = rng.int(2, 6);
        let at = pb + (theme ? Math.max(restFrom, 5.5) + rng.range(0, 0.6) : rng.range(1, 6));
        let step = rng.int(0, scale.st.length * 2);
        for (let i = 0; i < k; i += 1) {
          const midi = fitMidi(plan.tonic + 24 + stepToSemi(scale, step), ti);
          ev.push({ t: at, type: "note", inst: biome.texInst, midi: midi, dur: 1.5, vel: rng.range(0.22, 0.4), bus: "tex", pan: rng.range(-0.8, 0.8) });
          at += Math.max(0.14, 0.5 - i * 0.08) * rng.range(0.85, 1.15);
          step += rng.pick([-2, -1, 1, 1, 2]);
        }
      }

      // Tibetská mísa na tónice
      if ((biome.bowls || mood.bowls || !rec.theme) && p === 0 && (rec.theme ? rng.chance(0.5) : true)) {
        let f = midiToFreq(plan.tonic);
        while (f > 150) f /= 2;
        while (f < 80) f *= 2;
        ev.push({ t: pb + 0.02, type: "sample", k: "bowlLow", rate: f / 107.2, vel: 0.5, bus: "tex", pan: -0.15, dur: 9, rel: 2.5 });
      }
    }

    // Dystopie: zkreslený kytarový tah a rána
    if (rec.grit && rng.chance(0.25 + gritAmt * 0.75)) {
      let gm = plan.tonic;
      while (gm > 45) gm -= 12;
      ev.push({ t: 0, type: "grit", midi: gm, dur: 7 * plan.beat, vel: 0.35 + gritAmt * 0.45 });
      if (gritAmt > 0.6) {
        let g2 = plan.tonic + scale.st[prog[2]];
        while (g2 > 45) g2 -= 12;
        ev.push({ t: 16, type: "grit", midi: g2, dur: 6 * plan.beat, vel: 0.3 + gritAmt * 0.35 });
      }
    }
    if ((sec.strike || (sec.key === "peak" && (mood.impact || gritAmt > 0.55))) && rng.chance(sec.strike ? 1 : 0.8)) {
      let f = midiToFreq(plan.tonic);
      while (f > 72) f /= 2;
      ev.push({ t: 0, type: "sample", k: "impact", rate: clamp(f / 53.8, 0.75, 1.4), vel: 0.6, bus: "drums", pan: 0, dur: 5, rel: 1 });
    }
    if (!rec.theme && (biome.scrape || mood.impact) && rng.chance(0.55)) {
      const f = midiToFreq(fitMidi(plan.tonic + 7, { lo: 59, hi: 68 }));
      ev.push({ t: rng.range(6, 11), type: "sample", k: "scrape", rate: (f / 370) * 0.5, vel: 0.35, bus: "tex", pan: rng.range(-0.5, 0.5), dur: 5, rel: 1.5 });
    }

    // Kytarové gesto v nádechu (nahrávka má tři tóny, ladí se podle stupnice)
    if (rec.gesture || (sec.key === "intro" && rng.chance(0.4))) {
      const has4 = scale.st.includes(5), has2 = scale.st.includes(2);
      if (has4 || has2) {
        const base = has4 ? 331.4 : 110.0;
        let f = midiToFreq(plan.tonic);
        while (f / base > 1.36) f /= 2;
        while (f / base < 0.7) f *= 2;
        ev.push({ t: rec.gesture ? 8.5 : 6, type: "sample", k: "gtrGesture", rate: f / base, vel: 0.5, bus: "pluck", pan: 0.3, dur: 4, rel: 1 });
      }
    }

    // Vzdálené volání hluboké bambusové flétny v tichých částech
    if (biome.call && !rec.theme) {
      const cr = sub(plan.seed, 5000 + cycle * 97 + si * 13);
      if (cr.chance(0.85)) {
        const bi = INST.bamboo;
        const at = rec.gesture ? 1.5 : 7;
        const first = fitMidi(plan.tonic + (cr.chance(0.5) ? 7 : scale.st[scale.st.length - 1]), bi);
        ev.push({ t: at, type: "note", inst: "bamboo", midi: first, dur: 1.6 * plan.beat, vel: 0.5, bus: "lead", pan: 0.25 });
        ev.push({ t: at + 1.5, type: "note", inst: "bamboo", midi: fitMidi(plan.tonic, bi), dur: Math.min(3.2, 3 * plan.beat), vel: 0.58, bus: "lead", pan: 0.25 });
      }
    }

    ev.sort((a, b) => a.t - b.t);
    return ev;
  }

  function endingEvents(plan) {
    const ev = [];
    const pl = INST[plan.biome.pluck];
    const ld = INST[plan.lead1];
    ev.push({ t: 0, type: "pad", midis: padVoicing(plan, 0), dur: 8 * plan.beat, vel: 0.8 });
    ev.push({ t: 0, type: "note", inst: plan.lead1, midi: fitMidi(plan.tonic + 12, ld), dur: 5 * plan.beat, vel: 0.6, bus: "lead", pan: -0.08, scoop: true });
    const ladder = chordLadder(plan, 0, pl.acc, 4);
    ladder.forEach((m, i) => ev.push({ t: 1 + i * 0.6, type: "note", inst: plan.biome.pluck, midi: fitMidi(m, pl), dur: 4, vel: 0.5 - i * 0.05, bus: "pluck", pan: 0.2 }));
    return ev;
  }

  /* =====================================================================
     ZVUK
     ===================================================================== */

  const bankData = {};
  let impulseCache = null;

  function neededKeys(plan) {
    const keys = { taiko: 1, drumMid: 1, drumSoft: 1, tek: 1, impact: 1, bowlLow: 1, scrape: 1, gtrGesture: 1, violin: 1 };
    const b = plan.biome;
    if (b.call) keys.bambus = 1;
    [plan.lead1, plan.lead2, b.pluck, b.acc, b.bass, b.texInst].forEach((name) => INST[name].zones.forEach((z) => { keys[z.k] = 1; }));
    return Object.keys(keys);
  }

  async function loadBank(ctx, keys) {
    await Promise.all(keys.map(async (key) => {
      if (bankData[key]) return;
      try {
        const res = await fetch(SAMPLE_PATH + BANK[key].url);
        const buf = await ctx.decodeAudioData(await res.arrayBuffer());
        let peak = 0;
        const ch0 = buf.getChannelData(0);
        for (let c = 0; c < buf.numberOfChannels; c += 1) {
          const d = buf.getChannelData(c);
          for (let i = 0; i < d.length; i += 1) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
        }
        let onset = 0;
        const thr = peak * 0.03;
        while (onset < ch0.length && Math.abs(ch0[onset]) < thr) onset += 1;
        bankData[key] = { buffer: buf, norm: peak > 0 ? 1 / peak : 1, onset: Math.max(0, onset / buf.sampleRate - 0.004) };
      } catch (e) {
        console.warn("Nepodařilo se načíst zvuk: " + BANK[key].url, e);
      }
    }));
  }

  function makeImpulse(ctx) {
    const sr = ctx.sampleRate;
    if (impulseCache && impulseCache.sampleRate === sr) return impulseCache;
    const len = Math.floor(sr * 3.6);
    const buf = ctx.createBuffer(2, len, sr);
    const rng = new Rng(90210);
    for (let c = 0; c < 2; c += 1) {
      const d = buf.getChannelData(c);
      let y = 0, energy = 0;
      const pre = Math.floor(sr * 0.018);
      for (let i = pre; i < len; i += 1) {
        const t = (i - pre) / sr;
        const fc = 900 + 7500 * Math.exp(-t * 1.5);
        const a = Math.exp(-2 * Math.PI * fc / sr);
        y = (1 - a) * (rng.next() * 2 - 1) + a * y;
        const v = y * Math.exp(-t * 1.7) * Math.min(1, t / 0.035);
        d[i] = v;
        energy += v * v;
      }
      const k = 1 / Math.sqrt(energy);
      for (let i = 0; i < len; i += 1) d[i] *= k;
    }
    impulseCache = buf;
    return buf;
  }

  function makeNoise(ctx, seconds) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    const rng = new Rng(1337);
    let b = 0;
    for (let i = 0; i < d.length; i += 1) {
      const w = rng.next() * 2 - 1;
      b = 0.985 * b + 0.15 * w;
      d[i] = b * 1.6 + w * 0.12;
    }
    return buf;
  }

  function gritCurve() {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(x * 5) * 0.8;
    }
    return c;
  }

  // trim = výchozí hlasitost vrstvy, změřená na renderu jednotlivých stop
  const BUS_DEF = {
    drone: { group: "drone", trim: 0.16, rv: 0.3, dl: 0 },
    pad: { group: "pad", trim: 0.34, rv: 0.55, dl: 0 },
    strings: { group: "pad", trim: 0.55, rv: 0.9, dl: 0.15 },
    pluck: { group: "pluck", trim: 0.32, rv: 0.34, dl: 0.2 },
    bass: { group: "pluck", trim: 0.7, rv: 0.14, dl: 0 },
    lead: { group: "lead", trim: 0.45, rv: 0.46, dl: 0.2 },
    drums: { group: "drums", trim: 0.6, rv: 0.3, dl: 0 },
    tex: { group: "wind", trim: 0.5, rv: 0.8, dl: 0.5 },
    wind: { group: "wind", trim: 0.25, rv: 0.12, dl: 0 }
  };

  /* Jedno přehrání skladby: vlastní mix, efekty a plánovač. */
  function createSession(ctx, plan, dest, opts) {
    opts = opts || {};
    const S = { ctx: ctx, plan: plan, t0: 0, live: [], stopped: false };
    const beat = plan.beat;

    const out = ctx.createGain();
    const sum = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass"; tone.frequency.value = 20000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 2.5; comp.attack.value = 0.012; comp.release.value = 0.28;
    const makeup = ctx.createGain(); makeup.gain.value = 1.5;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -2.5; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.12;
    sum.connect(tone); tone.connect(comp); comp.connect(makeup); makeup.connect(limiter); limiter.connect(out); out.connect(dest);

    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx);
    const wet = ctx.createGain();
    reverb.connect(wet); wet.connect(sum);

    // Ping-pong ozvěna v rytmu skladby
    const dIn = ctx.createGain();
    const dL = ctx.createDelay(3), dR = ctx.createDelay(3);
    dL.delayTime.value = beat * 0.75; dR.delayTime.value = beat * 0.75;
    const dLp = ctx.createBiquadFilter(); dLp.type = "lowpass"; dLp.frequency.value = 2400;
    const dHp = ctx.createBiquadFilter(); dHp.type = "highpass"; dHp.frequency.value = 280;
    const fb = ctx.createGain(); fb.gain.value = 0.36;
    const dWet = ctx.createGain();
    dIn.connect(dLp); dLp.connect(dHp); dHp.connect(dL); dL.connect(dR); dR.connect(fb); fb.connect(dLp);
    const pL = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    const pR = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (pL.pan) { pL.pan.value = -0.6; pR.pan.value = 0.6; }
    dL.connect(pL); dR.connect(pR); pL.connect(dWet); pR.connect(dWet);
    dWet.connect(sum);
    const dToRv = ctx.createGain(); dToRv.gain.value = 0.3;
    dWet.connect(dToRv); dToRv.connect(reverb);

    const buses = {};
    Object.keys(BUS_DEF).forEach((name) => {
      const def = BUS_DEF[name];
      const g = ctx.createGain();
      g.gain.value = opts.solo && opts.solo !== name ? 0 : def.trim;
      g.connect(sum);
      const rs = ctx.createGain(); rs.gain.value = def.rv; g.connect(rs); rs.connect(reverb);
      if (def.dl > 0) { const ds = ctx.createGain(); ds.gain.value = def.dl; g.connect(ds); ds.connect(dIn); }
      const input = ctx.createGain();
      input.connect(g);
      buses[name] = { input: input, gain: g, group: def.group };
    });
    S.buses = buses; S.tone = tone; S.wet = wet; S.dWet = dWet; S.out = out;

    S.setMix = function (mix, when) {
      const t = when === undefined ? ctx.currentTime : when;
      Object.keys(buses).forEach((name) => {
        const b = buses[name];
        let v = mix[b.group] === undefined ? 1 : mix[b.group];
        if (opts.solo && opts.solo !== name) v = 0;
        b.input.gain.setTargetAtTime(v, t, 0.08);
      });
      const rv = mix.reverb === undefined ? 0.65 : mix.reverb;
      wet.gain.setTargetAtTime(0.25 + rv * 1.15, t, 0.1);
      dWet.gain.setTargetAtTime(0.25 + rv * 0.9, t, 0.1);
    };

    function track(node, end) { S.live.push({ node: node, end: end }); }

    function voiceOut(bus, pan) {
      if (ctx.createStereoPanner && pan) {
        const p = ctx.createStereoPanner();
        p.pan.value = clamp(pan, -1, 1);
        p.connect(buses[bus].input);
        return p;
      }
      return buses[bus].input;
    }

    function pickZone(inst, freq) {
      let best = inst.zones[0], bd = Infinity;
      inst.zones.forEach((z) => {
        const d = Math.abs(Math.log2(freq / z.f));
        if (d < bd && bankData[z.k]) { bd = d; best = z; }
      });
      return best;
    }

    function playNote(e, t) {
      const inst = INST[e.inst];
      const freq = midiToFreq(e.midi);
      const zone = pickZone(inst, freq);
      const data = bankData[zone.k];
      if (!data) return;
      const rate = freq / zone.f;
      const src = ctx.createBufferSource();
      src.buffer = data.buffer;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      const peak = e.vel * inst.gain * data.norm;
      let end;
      if (inst.kind === "pluck") {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = 1500 + e.vel * e.vel * 9000; lp.Q.value = 0.3;
        src.connect(lp); lp.connect(g);
        const ring = Math.min(inst.ring, Math.max(e.dur * 1.6, 1.4));
        g.gain.setValueAtTime(peak, t);
        g.gain.setTargetAtTime(0, t + ring, 0.25);
        end = t + ring + 1.2;
        src.start(t, data.onset);
      } else {
        src.connect(g);
        const useScoop = e.scoop && zone.scoopOff !== undefined;
        const off = useScoop ? zone.scoopOff : zone.off;
        const win = (useScoop ? zone.scoopWin : zone.win) / rate;
        const dur = Math.max(0.12, Math.min(e.dur, win - inst.rel * 0.6));
        const atk = Math.min(inst.atk, dur * 0.4);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak * 0.82, t + atk);
        g.gain.linearRampToValueAtTime(peak, t + atk + Math.min(1.0, dur * 0.45));
        g.gain.setTargetAtTime(0, t + dur, inst.rel / 3.5);
        end = t + dur + inst.rel * 1.6;
        if (inst.vib && dur > 0.9 && src.detune) {
          const lfo = ctx.createOscillator(); lfo.frequency.value = inst.vib[0];
          const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t);
          lg.gain.setValueAtTime(0, t + 0.3);
          lg.gain.linearRampToValueAtTime(inst.vib[1], t + 0.9);
          lfo.connect(lg); lg.connect(src.detune);
          lfo.start(t); lfo.stop(end); track(lfo, end);
        }
        src.start(t, off);
      }
      g.connect(voiceOut(e.bus, e.pan));
      src.stop(end);
      track(src, end);
    }

    function playSample(e, t) {
      const data = bankData[e.k];
      if (!data) return;
      const src = ctx.createBufferSource();
      src.buffer = data.buffer; src.playbackRate.value = e.rate || 1;
      const g = ctx.createGain();
      const peak = e.vel * data.norm * (e.type === "drum" ? 0.5 : 0.3);
      g.gain.setValueAtTime(peak, t);
      let end = t + data.buffer.duration / (e.rate || 1) + 0.1;
      if (e.dur) { g.gain.setTargetAtTime(0, t + e.dur, (e.rel || 1) / 3); end = Math.min(end, t + e.dur + (e.rel || 1) * 1.6); }
      src.connect(g);
      g.connect(voiceOut(e.type === "drum" ? "drums" : e.bus, e.pan || 0));
      src.start(t, data.onset); src.stop(end); track(src, end);
    }

    function playPad(e, t) {
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = 0.4;
      lp.frequency.setValueAtTime(520, t);
      lp.frequency.linearRampToValueAtTime(900 + e.vel * 300, t + e.dur * 0.5);
      lp.frequency.linearRampToValueAtTime(560, t + e.dur + 1.5);
      const end = t + e.dur + 3.2;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05 * e.vel, t + Math.min(2.2, e.dur * 0.4));
      g.gain.setTargetAtTime(0, t + e.dur - 0.4, 0.9);
      const sides = [lp, lp];
      if (ctx.createStereoPanner) {
        [-0.5, 0.5].forEach((pv, j) => { const p = ctx.createStereoPanner(); p.pan.value = pv; p.connect(lp); sides[j] = p; });
      }
      e.midis.forEach((m, i) => {
        [-6, 6].forEach((det, j) => {
          const o = ctx.createOscillator();
          o.type = i === 2 ? "triangle" : "sawtooth";
          o.frequency.value = midiToFreq(m); o.detune.value = det + i * 1.5;
          const og = ctx.createGain(); og.gain.value = i === 0 ? 1 : i === 1 ? 0.7 : 0.85;
          o.connect(og);
          og.connect(sides[j]);
          o.start(t); o.stop(end); track(o, end);
        });
      });
      lp.connect(g); g.connect(buses.pad.input);
    }

    function playGrit(e, t) {
      const f = midiToFreq(e.midi);
      const pre = ctx.createGain(); pre.gain.value = 0.5;
      const ws = ctx.createWaveShaper(); ws.curve = gritCurve(); ws.oversample = "2x";
      const bp = ctx.createBiquadFilter(); bp.type = "peaking"; bp.frequency.value = 750; bp.gain.value = 7; bp.Q.value = 0.9;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1700; lp.Q.value = 0.5;
      const g = ctx.createGain();
      const end = t + e.dur + 3;
      [[1, -7], [1, 6], [1.4983, 0], [2, 3]].forEach((v, i) => {
        const o = ctx.createOscillator(); o.type = "sawtooth";
        o.frequency.value = f * v[0]; o.detune.value = v[1];
        const og = ctx.createGain(); og.gain.value = i < 2 ? 0.5 : 0.28;
        o.connect(og); og.connect(pre); o.start(t); o.stop(end); track(o, end);
      });
      pre.connect(ws); ws.connect(bp); bp.connect(lp); lp.connect(g);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.085 * e.vel, t + Math.min(2.5, e.dur * 0.45));
      g.gain.setTargetAtTime(0, t + e.dur * 0.6, e.dur * 0.3);
      g.connect(buses.strings.input);
    }

    let windGain = null;
    function startBeds(t) {
      // Dron: tónika s kvintou, pomalu se nadechuje
      const root = (function () { let f = midiToFreq(plan.tonic); while (f > 100) f /= 2; return f; })();
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = plan.biome.droneCut; lp.Q.value = 0.8;
      const dg = ctx.createGain(); dg.gain.setValueAtTime(0, t); dg.gain.linearRampToValueAtTime(0.11, t + 5);
      [[1, -5, "sawtooth", 0.5], [1, 6, "sawtooth", 0.5], [0.5, 0, "sine", 0.9], [1.4983, 2, "triangle", 0.32], [2, -3, "triangle", 0.16]].forEach((v) => {
        const o = ctx.createOscillator(); o.type = v[2]; o.frequency.value = root * v[0]; o.detune.value = v[1];
        const og = ctx.createGain(); og.gain.value = v[3];
        o.connect(og); og.connect(lp); o.start(t); S.beds.push(o);
      });
      const l1 = ctx.createOscillator(); l1.frequency.value = 0.045;
      const l1g = ctx.createGain(); l1g.gain.value = plan.biome.droneCut * 0.3;
      l1.connect(l1g); l1g.connect(lp.frequency); l1.start(t); S.beds.push(l1);
      const l2 = ctx.createOscillator(); l2.frequency.value = 0.07;
      const l2g = ctx.createGain(); l2g.gain.value = 0.025;
      l2.connect(l2g); l2g.connect(dg.gain); l2.start(t); S.beds.push(l2);
      lp.connect(dg); dg.connect(buses.drone.input);
      S.droneGain = dg;

      // Vítr
      const n = ctx.createBufferSource(); n.buffer = makeNoise(ctx, 6); n.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 500; bp.Q.value = 0.7;
      windGain = ctx.createGain(); windGain.gain.value = 0;
      n.connect(bp); bp.connect(windGain); windGain.connect(buses.wind.input);
      n.start(t); S.beds.push(n);
      S.windBp = bp;
    }

    function windSection(level, t, dur) {
      const rng = sub(plan.seed, Math.floor(t * 10) + 7);
      let at = t;
      while (at < t + dur) {
        const gust = rng.range(0.25, 1) * level * plan.biome.wind * 0.16;
        windGain.gain.setTargetAtTime(gust, at, rng.range(0.8, 1.8));
        S.windBp.frequency.setTargetAtTime(rng.range(300, 900), at, 1.5);
        at += rng.range(2.5, 5.5);
      }
    }

    function fire(e, secStart, secDur) {
      const jitter = e.human ? (sub(plan.seed, Math.floor((secStart + e.t) * 977)).next() - 0.4) * 2 * e.human : 0;
      const t = Math.max(secStart + e.t * beat + jitter, ctx.currentTime + 0.01);
      if (e.type === "note") playNote(e, t);
      else if (e.type === "drum" || e.type === "sample") playSample(e, t);
      else if (e.type === "pad") playPad(e, t);
      else if (e.type === "grit") playGrit(e, t);
      else if (e.type === "wind") windSection(e.level, t, secDur);
    }

    S.beds = [];
    const cur = { cycle: 0, si: 0, idx: 0, list: null, ending: false, done: false };

    S.start = function (t0) {
      S.t0 = t0;
      startBeds(t0);
    };

    function secStartTime(cycle, si) {
      return S.t0 + (cycle * plan.cycleBeats + plan.sections[si].startBeat) * beat;
    }

    S.scheduleUntil = function (limit) {
      while (!cur.done && !S.stopped) {
        let start, dur;
        if (cur.ending) {
          start = S.t0 + plan.cycleBeats * (opts.cycles || 1) * beat; dur = 8 * beat;
          if (!cur.list) cur.list = endingEvents(plan);
        } else {
          start = secStartTime(cur.cycle, cur.si); dur = plan.sections[cur.si].beats * beat;
          if (!cur.list) cur.list = sectionEvents(plan, cur.cycle, cur.si);
        }
        while (cur.idx < cur.list.length && start + cur.list[cur.idx].t * beat < limit) {
          fire(cur.list[cur.idx], start, dur);
          cur.idx += 1;
        }
        if (cur.idx < cur.list.length) return;
        if (start + dur >= limit) return;
        cur.list = null; cur.idx = 0;
        if (cur.ending) { cur.done = true; return; }
        cur.si += 1;
        if (cur.si >= plan.sections.length) {
          cur.si = 0; cur.cycle += 1;
          if (opts.cycles && cur.cycle >= opts.cycles) cur.ending = true;
        }
      }
    };

    S.position = function (now) {
      const beats = Math.max(0, (now - S.t0) / beat);
      const inCycle = beats % plan.cycleBeats;
      let si = 0;
      plan.sections.forEach((s, i) => { if (inCycle >= s.startBeat) si = i; });
      return { cycle: Math.floor(beats / plan.cycleBeats), section: si, progress: inCycle / plan.cycleBeats };
    };

    S.prune = function () {
      const now = ctx.currentTime;
      S.live = S.live.filter((v) => v.end > now);
    };

    S.stop = function () {
      if (S.stopped) return;
      S.stopped = true;
      const now = ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setTargetAtTime(0, now, 0.08);
      window.setTimeout(() => {
        S.live.forEach((v) => { try { v.node.stop(); } catch (err) { /* už dohrál */ } });
        S.beds.forEach((n) => { try { n.stop(); } catch (err) { /* už dohrál */ } });
        try { out.disconnect(); } catch (err) { /* odpojeno */ }
        S.live = [];
      }, 500);
    };

    return S;
  }

  /* ---------- Export do WAV ---------- */
  function encodeWav(buffer, gain) {
    const ch = buffer.numberOfChannels, len = buffer.length, sr = buffer.sampleRate;
    const data = new DataView(new ArrayBuffer(44 + len * ch * 2));
    const str = (o, s) => { for (let i = 0; i < s.length; i += 1) data.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); data.setUint32(4, 36 + len * ch * 2, true); str(8, "WAVE"); str(12, "fmt ");
    data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
    data.setUint32(24, sr, true); data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true);
    str(36, "data"); data.setUint32(40, len * ch * 2, true);
    const chans = [];
    for (let c = 0; c < ch; c += 1) chans.push(buffer.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i += 1) {
      for (let c = 0; c < ch; c += 1) {
        const v = clamp(chans[c][i] * gain, -1, 1);
        data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7FFF, true);
        o += 2;
      }
    }
    return new Blob([data], { type: "audio/wav" });
  }

  async function renderOffline(cfg, mix, opts) {
    opts = opts || {};
    const plan = buildPlan(cfg);
    const sr = 44100;
    const cycles = opts.cycles || 1;
    const musicDur = plan.cycleBeats * cycles * plan.beat + 8 * plan.beat;
    const total = (opts.maxSeconds ? Math.min(opts.maxSeconds, musicDur) : musicDur) + 7;
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const off = new Off(2, Math.ceil(total * sr), sr);
    await loadBank(off, neededKeys(plan));
    const S = createSession(off, plan, off.destination, { cycles: cycles, solo: opts.solo });
    S.setMix(mix || {}, 0);
    S.start(0.1);
    const limit = opts.maxSeconds ? opts.maxSeconds : Infinity;
    if (typeof off.suspend === "function") {
      // Plánuj po kouscích: tisíce hlasů naráz by render zbytečně brzdily.
      const step = 4;
      for (let t = step; t < total - 0.5; t += step) {
        off.suspend(t).then(() => {
          S.scheduleUntil(Math.min(limit, t + step + 0.5));
          S.prune();
          off.resume();
        });
      }
      S.scheduleUntil(Math.min(limit, step + 0.5));
    } else {
      S.scheduleUntil(limit);
    }
    S.droneGain.gain.setTargetAtTime(0, total - 9, 2.2);
    S.out.gain.setValueAtTime(1, total - 3);
    S.out.gain.linearRampToValueAtTime(0, total - 0.05);
    const buffer = await off.startRendering();
    return { buffer: buffer, plan: plan };
  }

  /* =====================================================================
     STRÁNKA
     ===================================================================== */

  const $ = (id) => document.getElementById(id);
  const els = {
    trackName: $("track-name"), preset: $("preset"), autoSeed: $("auto-seed"), biome: $("audio-biome"), mood: $("audio-mood"), lead: $("lead-inst"),
    storyCurve: $("story-curve"), volDrone: $("vol-drone"), volWind: $("vol-wind"), volPluck: $("vol-pluck"), volFlute: $("vol-flute"),
    volPad: $("vol-pad"), volDrums: $("vol-drums"), density: $("tempo-density"), reverb: $("reverb-depth"),
    btnPlay: $("btn-play"), btnRecord: $("btn-record"), canvas: $("audio-canvas"), status: $("status-text"),
    biomeReadout: $("biome-readout"), moodReadout: $("mood-readout"), recordProgress: $("record-progress"), patternReadout: $("pattern-readout"),
    tlCanvas: $("timeline-canvas"), tlLabels: $("timeline-labels")
  };
  const canvasCtx = els.canvas ? els.canvas.getContext("2d") : null;
  const tlCtx = els.tlCanvas ? els.tlCanvas.getContext("2d") : null;

  let audioCtx = null, analyser = null, dataArray = null, session = null, schedTimer = null;
  let isPlaying = false, isExporting = false, visualFrame = 0, playToken = 0;
  let joystickX = 0, joystickY = 0, targetJX = 0, targetJY = 0, isDragging = false;
  let timelinePhase = 0, currentProgressPercent = 0;

  const num = (el, fallback) => (el ? parseFloat(el.value) : fallback);

  function readCfg() {
    return {
      name: (els.trackName && els.trackName.value) || "Vendigroth",
      biome: els.biome ? els.biome.value : "ashlands",
      mood: els.mood ? els.mood.value : "meditative",
      curve: els.storyCurve ? els.storyCurve.value : "slow_burn",
      lead: els.lead && els.lead.value !== "auto" ? els.lead.value : null,
      density: num(els.density, 0.8)
    };
  }

  function readMix() {
    const jx = joystickX / 140;
    return {
      drone: num(els.volDrone, 0.55) * 1.6 + (jx < 0 ? -jx * 0.6 : 0),
      wind: num(els.volWind, 0.4) * 2,
      pluck: num(els.volPluck, 0.6) * 1.6,
      lead: num(els.volFlute, 0.6) * 1.6,
      pad: num(els.volPad, 0.5) * 1.8,
      drums: num(els.volDrums, 0.5) * 1.8,
      reverb: clamp(num(els.reverb, 0.65) + (jx > 0 ? jx * 0.5 : 0), 0, 1.5)
    };
  }

  function describe(plan) {
    return NOTE_NAMES[mod(plan.tonic, 12)] + " " + plan.scale.label + " · " + plan.bpm + " BPM · sólo: " + INST[plan.lead1].label;
  }

  function updateReadout() {
    const plan = buildPlan(readCfg());
    if (els.biomeReadout) els.biomeReadout.textContent = plan.biome.label;
    if (els.moodReadout) els.moodReadout.textContent = plan.mood.label;
    if (els.patternReadout) els.patternReadout.textContent = describe(plan);
    renderTimelineLabels(plan);
    return plan;
  }

  function renderTimelineLabels(plan) {
    if (!els.tlLabels) return;
    els.tlLabels.innerHTML = "";
    plan.sections.forEach((sec) => {
      const span = document.createElement("span");
      span.textContent = sec.rec.label;
      els.tlLabels.appendChild(span);
    });
  }

  function updateTimelineLabelsActive(idx) {
    if (!els.tlLabels) return;
    els.tlLabels.querySelectorAll("span").forEach((span, i) => {
      span.classList.toggle("is-active", i <= idx);
    });
  }

  function syncUIWithHash() {
    const rng = sub(hashStr((els.trackName && els.trackName.value) || "Vendigroth"), 101);
    const set = (el, v) => { if (el) el.value = v; };
    set(els.biome, rng.pick(Object.keys(BIOMES)));
    set(els.mood, rng.pick(Object.keys(MOODS)));
    set(els.storyCurve, rng.pick(Object.keys(CURVES)));
    set(els.lead, "auto");
    set(els.volDrone, rng.range(0.4, 0.7).toFixed(2));
    set(els.volWind, rng.range(0.25, 0.6).toFixed(2));
    set(els.volPluck, rng.range(0.5, 0.75).toFixed(2));
    set(els.volFlute, rng.range(0.5, 0.75).toFixed(2));
    set(els.volPad, rng.range(0.35, 0.65).toFixed(2));
    set(els.volDrums, rng.range(0.35, 0.65).toFixed(2));
    set(els.density, rng.range(0.55, 1.1).toFixed(2));
    set(els.reverb, rng.range(0.45, 0.8).toFixed(2));
    updateReadout();
  }

  // Hotová nastavení. Pořadí hodnot mixu: flétny, struny, plochy, bicí, drony, vítr, hustota, ozvěna.
  const PRESETS = {
    spory: { name: "Spóry v mlze", biome: "fungal", mood: "ominous", lead: "auto", curve: "sudden_danger", mix: [0.65, 0.55, 0.6, 0.9, 0.45, 0.25, 0.7, 0.7] },
    popel: { name: "Vítr nad popelem", biome: "ashlands", mood: "meditative", lead: "shaku", curve: "slow_burn", mix: [0.65, 0.6, 0.5, 0.5, 0.5, 0.45, 0.7, 0.75] },
    bazar: { name: "Bazar u brány", biome: "tavern", mood: "pilgrim", lead: "duduk", curve: "constant_tension", mix: [0.6, 0.65, 0.45, 0.6, 0.35, 0.2, 1.0, 0.5] },
    vraky: { name: "Pohřebiště vzducholodí", biome: "dunes", mood: "ominous", lead: "duduk", curve: "slow_burn", mix: [0.6, 0.65, 0.55, 0.55, 0.55, 0.45, 0.8, 0.7] },
    lotos: { name: "Lotosový břeh", biome: "bamboo", mood: "meditative", lead: "flute", curve: "ambient_waves", mix: [0.65, 0.6, 0.55, 0.3, 0.4, 0.3, 0.85, 0.75] },
    prusmyk: { name: "Šeptající průsmyk", biome: "ruins", mood: "ritual", lead: "shaku", curve: "slow_burn", mix: [0.6, 0.6, 0.55, 0.65, 0.55, 0.4, 0.6, 0.8] }
  };

  function applyPreset(key) {
    const pr = PRESETS[key];
    if (!pr) return false;
    const set = (el, v) => { if (el) el.value = v; };
    set(els.trackName, pr.name); set(els.biome, pr.biome); set(els.mood, pr.mood); set(els.lead, pr.lead); set(els.storyCurve, pr.curve);
    [els.volFlute, els.volPluck, els.volPad, els.volDrums, els.volDrone, els.volWind, els.density, els.reverb].forEach((el, i) => set(el, pr.mix[i]));
    if (els.autoSeed) els.autoSeed.checked = false;
    updateReadout();
    return true;
  }

  const markCustom = () => { if (els.preset) els.preset.value = "custom"; };

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.connect(audioCtx.destination);
  }

  function stopSession() {
    window.clearInterval(schedTimer);
    if (session) { session.stop(); session = null; }
    currentProgressPercent = 0;
    updateTimelineLabelsActive(-1);
  }

  function startSession(plan) {
    session = createSession(audioCtx, plan, analyser, {});
    session.setMix(readMix());
    session.start(audioCtx.currentTime + 0.15);
    const tick = () => {
      if (!session) return;
      session.scheduleUntil(audioCtx.currentTime + 2.5);
      session.prune();
    };
    tick();
    schedTimer = window.setInterval(tick, 200);
  }

  function setPlayingState(playing, isLoading) {
    isPlaying = playing && !isLoading;
    if (!els.btnPlay) return;
    if (isLoading) {
      els.btnPlay.textContent = "Načítám samply...";
      if (els.status) els.status.textContent = "Stahuji nástroje pro tuhle skladbu...";
      els.btnPlay.style.borderColor = "#ffcc00"; els.btnPlay.style.color = "#ffcc00";
    } else if (playing) {
      els.btnPlay.textContent = "Zastavit hudbu";
      if (els.status) els.status.textContent = "Když popadneš střed kruhu (klikem a tažením), můžeš hudbu deformovat jako na gamepadu!";
      els.btnPlay.style.borderColor = "rgba(255, 126, 98, 0.36)"; els.btnPlay.style.color = "#ffb7a4";
    } else {
      els.btnPlay.textContent = "Zahrát skladbu";
      if (els.status) els.status.textContent = "Neaktivní. Spusť hudbu a nech nástroj složit skladbu podle názvu.";
      els.btnPlay.style.borderColor = ""; els.btnPlay.style.color = "";
      cancelAnimationFrame(visualFrame);
      if (canvasCtx) canvasCtx.clearRect(0, 0, els.canvas.width, els.canvas.height);
      if (tlCtx) tlCtx.clearRect(0, 0, els.tlCanvas.width, els.tlCanvas.height);
    }
  }

  async function beginPlayback() {
    const token = (playToken += 1);
    const plan = updateReadout();
    stopSession();
    setPlayingState(true, true);
    await loadBank(audioCtx, neededKeys(plan));
    if (token !== playToken) return;
    setPlayingState(true, false);
    startSession(plan);
    cancelAnimationFrame(visualFrame);
    drawVisualizer();
  }

  function togglePlay() {
    initAudio();
    audioCtx.resume();
    if (isPlaying || session) {
      playToken += 1;
      stopSession();
      setPlayingState(false);
    } else {
      beginPlayback();
    }
  }

  function restartIfPlaying() {
    updateReadout();
    if (isPlaying) beginPlayback();
  }

  async function exportWav() {
    if (isExporting) return;
    isExporting = true;
    if (els.btnRecord) { els.btnRecord.disabled = true; els.btnRecord.style.opacity = "0.6"; }
    if (els.recordProgress) els.recordProgress.textContent = "Renderuji skladbu...";
    try {
      const res = await renderOffline(readCfg(), readMix(), { cycles: 1 });
      let peak = 0;
      for (let c = 0; c < res.buffer.numberOfChannels; c += 1) {
        const d = res.buffer.getChannelData(c);
        for (let i = 0; i < d.length; i += 1) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
      }
      const blob = encodeWav(res.buffer, peak > 0 ? Math.min(1.6, 0.89 / peak) : 1);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "vendigroth_" + ((els.trackName && els.trackName.value) || "skladba").trim().replace(/\s+/g, "_") + ".wav";
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      if (els.recordProgress) els.recordProgress.textContent = "Hotovo, " + Math.round(res.buffer.duration) + " s. Soubor se stahuje.";
    } catch (err) {
      console.error(err);
      if (els.recordProgress) els.recordProgress.textContent = "Export se nepovedl.";
    }
    isExporting = false;
    if (els.btnRecord) { els.btnRecord.disabled = false; els.btnRecord.style.opacity = "1"; }
  }

  /* ---------- Joystick v kruhu ---------- */
  function getCanvasPos(e) {
    const rect = els.canvas.getBoundingClientRect();
    const sx = els.canvas.width / rect.width, sy = els.canvas.height / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
  }

  function handleDown(e) {
    if (!isPlaying) return;
    const pos = getCanvasPos(e);
    const dx = pos.x - (els.canvas.width / 2 + joystickX), dy = pos.y - (els.canvas.height / 2 + joystickY);
    if (Math.sqrt(dx * dx + dy * dy) < 90) isDragging = true;
  }

  function handleMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    let mx = pos.x - els.canvas.width / 2, my = pos.y - els.canvas.height / 2;
    const dist = Math.sqrt(mx * mx + my * my);
    if (dist > 140) { mx = (mx / dist) * 140; my = (my / dist) * 140; }
    targetJX = mx; targetJY = my;
  }

  function handleUp() { isDragging = false; targetJX = 0; targetJY = 0; }

  if (els.canvas) {
    els.canvas.addEventListener("mousedown", handleDown);
    els.canvas.addEventListener("touchstart", handleDown, { passive: false });
    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
  }

  function drawVisualizer() {
    if (!isPlaying || !analyser || !canvasCtx) return;
    visualFrame = requestAnimationFrame(drawVisualizer);

    joystickX += (targetJX - joystickX) * 0.12;
    joystickY += (targetJY - joystickY) * 0.12;
    const moving = Math.abs(joystickX) > 0.5 || Math.abs(joystickY) > 0.5;

    if (session) {
      const jNy = joystickY / 140;
      const now = audioCtx.currentTime;
      if (jNy > 0.01) {
        session.tone.type = "lowpass";
        session.tone.frequency.setTargetAtTime(Math.max(300, 20000 - jNy * 19700), now, 0.1);
      } else if (jNy < -0.01) {
        session.tone.type = "highshelf";
        session.tone.frequency.setTargetAtTime(4000, now, 0.05);
        session.tone.gain.setTargetAtTime(Math.abs(jNy) * 12, now, 0.1);
      } else if (session.tone.type !== "lowpass" || session.tone.frequency.value < 19000) {
        session.tone.type = "lowpass";
        session.tone.frequency.setTargetAtTime(20000, now, 0.1);
      }
      if (moving) session.setMix(readMix());
      const pos = session.position(now);
      currentProgressPercent = pos.progress * 100;
      updateTimelineLabelsActive(pos.section);
    }

    analyser.getByteFrequencyData(dataArray);
    const colors = (BIOMES[els.biome ? els.biome.value : "ashlands"] || BIOMES.ashlands).colors;
    const primary = colors[0], secondary = colors[1];
    const width = els.canvas.width, height = els.canvas.height;
    const cx = width / 2, cy = height / 2, baseRadius = 78;
    canvasCtx.clearRect(0, 0, width, height);

    const bg = canvasCtx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.5);
    bg.addColorStop(0, "rgba(33, 28, 24, 0.88)"); bg.addColorStop(1, "rgba(5, 5, 5, 0.96)");
    canvasCtx.fillStyle = bg; canvasCtx.fillRect(0, 0, width, height);

    if (Math.abs(joystickX) > 2 || Math.abs(joystickY) > 2) {
      canvasCtx.beginPath(); canvasCtx.moveTo(cx, cy); canvasCtx.lineTo(cx + joystickX, cy + joystickY);
      canvasCtx.strokeStyle = primary + "66"; canvasCtx.lineWidth = 6; canvasCtx.stroke();
    }

    canvasCtx.strokeStyle = secondary + "55"; canvasCtx.lineWidth = 1;
    for (let ring = 0; ring < 4; ring += 1) {
      canvasCtx.beginPath(); canvasCtx.arc(cx, cy, baseRadius + ring * 32, 0, Math.PI * 2); canvasCtx.stroke();
    }

    canvasCtx.beginPath();
    for (let i = 0; i < dataArray.length; i += 1) {
      const angle = (i / dataArray.length) * Math.PI * 2;
      const radius = baseRadius + (dataArray[i] / 255) * 76;
      const x = cx + Math.cos(angle) * radius, y = cy + Math.sin(angle) * radius;
      if (i === 0) canvasCtx.moveTo(x, y); else canvasCtx.lineTo(x, y);
    }
    canvasCtx.closePath();
    canvasCtx.strokeStyle = primary; canvasCtx.lineWidth = 2.2;
    canvasCtx.shadowColor = primary; canvasCtx.shadowBlur = 18; canvasCtx.stroke(); canvasCtx.shadowBlur = 0;

    const coreX = cx + joystickX, coreY = cy + joystickY;
    canvasCtx.beginPath(); canvasCtx.arc(coreX, coreY, 48 + (dataArray[3] / 255) * 28, 0, Math.PI * 2);
    const core = canvasCtx.createRadialGradient(coreX, coreY, 0, coreX, coreY, 92);
    core.addColorStop(0, primary + "bb"); core.addColorStop(1, secondary + "22");
    canvasCtx.fillStyle = core; canvasCtx.fill();

    if (tlCtx) {
      timelinePhase += 0.02;
      const tw = els.tlCanvas.width, th = els.tlCanvas.height;
      tlCtx.clearRect(0, 0, tw, th);
      const waveY = (x) => {
        const nx = x / tw;
        return th / 2 + Math.sin(nx * 12 + timelinePhase) * 12 * Math.sin(nx * Math.PI) + Math.cos(nx * 24 - timelinePhase * 1.5) * 4;
      };
      const drawWave = (limitX, color, lineW, blur) => {
        tlCtx.beginPath();
        for (let x = 0; x <= limitX; x += 4) { if (x === 0) tlCtx.moveTo(x, waveY(x)); else tlCtx.lineTo(x, waveY(x)); }
        tlCtx.strokeStyle = color; tlCtx.lineWidth = lineW; tlCtx.shadowColor = color; tlCtx.shadowBlur = blur; tlCtx.stroke();
      };
      tlCtx.lineCap = "round"; tlCtx.lineJoin = "round";
      drawWave(tw, "rgba(194, 181, 163, 0.15)", 3, 0);
      const progX = tw * (currentProgressPercent / 100);
      drawWave(progX, primary, 4, 12);
      if (progX > 0 && progX < tw) {
        tlCtx.beginPath(); tlCtx.arc(progX, waveY(progX), 6, 0, Math.PI * 2);
        tlCtx.fillStyle = "#fff"; tlCtx.shadowColor = primary; tlCtx.shadowBlur = 15; tlCtx.fill();
      }
    }
  }

  /* ---------- Ovládání ---------- */
  if (els.trackName) {
    els.trackName.addEventListener("input", () => {
      markCustom();
      if (els.autoSeed && els.autoSeed.checked) syncUIWithHash();
      restartIfPlaying();
    });
  }
  // Volby, které mění skladbu, ji spustí znovu.
  document.querySelectorAll(".manual-input").forEach((input) => {
    input.addEventListener("change", () => {
      markCustom();
      if (els.autoSeed) els.autoSeed.checked = false;
      restartIfPlaying();
    });
  });
  // Posuvníky mixu působí hned, bez restartu.
  document.querySelectorAll(".mix-input").forEach((input) => {
    input.addEventListener("input", () => {
      markCustom();
      if (els.autoSeed) els.autoSeed.checked = false;
      if (session) session.setMix(readMix());
    });
  });
  if (els.autoSeed) {
    els.autoSeed.addEventListener("change", () => {
      if (els.autoSeed.checked) { markCustom(); syncUIWithHash(); restartIfPlaying(); }
    });
  }
  if (els.preset) {
    els.preset.addEventListener("change", () => {
      if (applyPreset(els.preset.value)) {
        if (session) session.setMix(readMix());
        restartIfPlaying();
      }
    });
  }
  if (els.btnPlay) els.btnPlay.addEventListener("click", togglePlay);
  if (els.btnRecord) els.btnRecord.addEventListener("click", exportWav);

  window.VendigrothSonics = { buildPlan: buildPlan, sectionEvents: sectionEvents, themeB: themeB, renderOffline: renderOffline, describe: describe, PRESETS: PRESETS, SCALES: SCALES, BIOMES: BIOMES, MOODS: MOODS, CURVES: CURVES };

  if (els.preset && applyPreset(els.preset.value)) { /* výchozí předvolba */ }
  else if (els.autoSeed && els.autoSeed.checked) syncUIWithHash();
  else updateReadout();
})();
