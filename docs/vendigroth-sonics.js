(function () {
  if (document.body.dataset.page !== "tool-sonics") {
    return;
  }

  function getSharedHash(str) {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash | 0;
  }

  class CustomRandom {
    constructor(seed) { this.state = seed >>> 0; }
    value() { this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0; return this.state / 4294967296; }
    rangeFloat(min, max) { return min + this.value() * (max - min); }
    rangeInt(min, max) { return min + Math.floor(this.value() * (max - min)); }
    pick(list) { return list[this.rangeInt(0, list.length)]; }
  }

  // === HUDEBNÍ TEORIE A FREKVENCE S UNIKÁTNÍMI NÁSTROJI ===
  const BIOME_CONFIG = {
    ashlands: { label: "Popelavé pláně", scale: [73.42, 82.41, 87.31, 103.83, 110.00, 123.47, 138.59], baseFreq: 73.42, windCenter: 380, windRange: 420, droneFilter: 165, colors: ["#d8a247", "#6b5131"], pluckMult: 1.5, fluteMult: 0.2, celloMult: 0.8, drumMult: 0.4,
      samples: { pluck: "acousticGuitar", flute: "fluteA4", pad: "arcoF5", drum: "drum1", texture: "scrape" } },
    bamboo: { label: "Otrávený bambus", scale: [98.00, 103.83, 123.47, 130.81, 146.83, 155.56, 185.00], baseFreq: 98, windCenter: 620, windRange: 260, droneFilter: 240, colors: ["#00ff9d", "#7ab37d"], pluckMult: 1.2, fluteMult: 1.8, celloMult: 0.5, drumMult: 0.6,
      samples: { pluck: "koto", flute: "dizzi", pad: "arcoF5", drum: "drumHard", texture: "shakuTex" } },
    dunes: { label: "Mrtvé duny", scale: [69.30, 73.42, 87.31, 98.00, 103.83, 123.47, 138.59], baseFreq: 69.3, windCenter: 500, windRange: 600, droneFilter: 140, colors: ["#ffbb6b", "#8b6132"], pluckMult: 1.1, fluteMult: 0.8, celloMult: 0.7, drumMult: 1.2,
      samples: { pluck: "oudC3", flute: "dudukC3", pad: "arcoF5", drum: "doumbek", texture: "oudTex" } },
    fungal: { label: "Houbové bažiny", scale: [82.41, 92.50, 103.83, 116.54, 123.47, 138.59, 155.56], baseFreq: 82.41, windCenter: 320, windRange: 180, droneFilter: 200, colors: ["#5effd1", "#7b5d9c"], pluckMult: 0.6, fluteMult: 1.2, celloMult: 1.2, drumMult: 0.5,
      samples: { pluck: "harpC5", flute: "fluteE6", pad: "arcoF5", drum: "drumMuted", texture: "bowlLong" } },
    ruins: { label: "Vendigrothské ruiny", scale: [65.41, 73.42, 77.78, 92.50, 98.00, 103.83, 123.47], baseFreq: 65.41, windCenter: 240, windRange: 160, droneFilter: 120, colors: ["#ff7e62", "#c2b5a3"], pluckMult: 0.4, fluteMult: 0.1, celloMult: 1.6, drumMult: 1.8,
      samples: { pluck: "kayageum", flute: "fluteA4v2", pad: "arcoF5", drum: "guitarImpact", texture: "fluteTex" } },
    catacombs: { label: "Kořenové katakomby", scale: [61.74, 65.41, 77.78, 87.31, 92.50, 103.83, 116.54], baseFreq: 61.74, windCenter: 180, windRange: 140, droneFilter: 100, colors: ["#8eff78", "#73644b"], pluckMult: 0.7, fluteMult: 0.5, celloMult: 1.4, drumMult: 1.1,
      samples: { pluck: "pizzG5", flute: "fluteA4", pad: "arcoF5", drum: "drumMuted", texture: "scrapeLow" } }
  };

  const MOOD_CONFIG = {
    meditative: { label: "Meditativní", density: 0.7, octaveChance: 0.15 },
    pilgrim: { label: "Poutnický", density: 0.9, octaveChance: 0.28 },
    ominous: { label: "Zlověstný", density: 1.05, octaveChance: 0.12 },
    ritual: { label: "Rituální", density: 1.2, octaveChance: 0.34 }
  };

  const STYLE_CONFIG = {
    wandering: { label: "Poutnický", phraseBias: 0.85, silence: 1.2, cello: 0.8, drums: 0.4, ensemble: 0.65 },
    desolate: { label: "Pustý", phraseBias: 0.9, silence: 1.35, cello: 1.1, drums: 0.3, ensemble: 0.7 },
    epic: { label: "Epický", phraseBias: 1.15, silence: 0.8, cello: 1.2, drums: 1.2, ensemble: 1.3 },
    ritualistic: { label: "Starobylý", phraseBias: 1.0, silence: 1.0, cello: 0.95, drums: 1.05, ensemble: 0.95 }
  };

  // Pomalé a rozvážné rytmy pro drnkání
  const RHYTHM_PATTERNS = [
    [2, 2, 4], [3, 1, 4], [4, 2, 2], [2, 4, 2], [3, 3, 2], [2, 1.5, 2.5, 2]
  ];

  const PHASE_LIBRARY = {
    "Pustina": { name: "Pustina", bpm: 60, pluck: 0.18, flute: 0.0, cello: 0.22, drums: 0.0, ensemble: 0.0, bundle: 1, gapMin: 1500, gapMax: 3500, leadPresence: 0.58, responsePresence: 0.0 },
    "Očekávání": { name: "Očekávání", bpm: 80, pluck: 0.34, flute: 0.08, cello: 0.28, drums: 0.05, ensemble: 0.0, bundle: 2, gapMin: 800, gapMax: 2000, leadPresence: 0.78, responsePresence: 0.52 },
    "Pochod": { name: "Pochod", bpm: 100, pluck: 0.72, flute: 0.16, cello: 0.34, drums: 0.18, ensemble: 0.08, bundle: 2, gapMin: 500, gapMax: 1200, leadPresence: 0.92, responsePresence: 0.72 },
    "Katarze": { name: "Katarze", bpm: 110, pluck: 0.78, flute: 0.3, cello: 0.62, drums: 0.28, ensemble: 0.34, bundle: 3, gapMin: 300, gapMax: 800, leadPresence: 0.98, responsePresence: 0.86 },
    "Popel": { name: "Popel", bpm: 60, pluck: 0.2, flute: 0.04, cello: 0.18, drums: 0.02, ensemble: 0.0, bundle: 1, gapMin: 2000, gapMax: 4000, leadPresence: 0.54, responsePresence: 0.34 }
  };

  const CURVES_CONFIG = {
    slow_burn: ["Pustina", "Očekávání", "Pochod", "Katarze", "Popel"], 
    sudden_danger: ["Očekávání", "Katarze", "Pochod", "Katarze", "Popel"], 
    ambient_waves: ["Pustina", "Očekávání", "Pustina", "Očekávání", "Popel"], 
    constant_tension: ["Pochod", "Katarze", "Pochod", "Katarze", "Popel"] 
  };

  const CHORD_PROGRESSION_LIBRARY = [
    [0, 4, 5, 3], [5, 3, 0, 4], [0, 3, 4, 0], [0, 5, 3, 4], [5, 4, 3, 4], [0, 2, 5, 4] 
  ];

  // === BANKA ZVUKŮ ===
  const SOUND_BANK = {
    // Drnkací (Plucks) - ZAPOJENY VŠECHNY Z TVÉHO SCREENSHOTU
    pizzE4: { url: "assets/zvuky/violin-pizz-e4.wav", baseFreq: 329.63, buffer: null },
    pizzG5: { url: "assets/zvuky/violin-pizz-g5.wav", baseFreq: 783.99, buffer: null },
    acousticGuitar: { url: "assets/zvuky/acoustic-guitar.wav", baseFreq: 261.63, buffer: null }, 
    guitar: { url: "assets/zvuky/guitar-pluck.mp3", baseFreq: 261.63, buffer: null }, 
    oudC3: { url: "assets/zvuky/oud-c3.wav", baseFreq: 130.81, buffer: null },
    koto: { url: "assets/zvuky/koto.wav", baseFreq: 261.63, buffer: null },
    kayageum: { url: "assets/zvuky/kayageum.wav", baseFreq: 261.63, buffer: null },
    harpC5: { url: "assets/zvuky/celtic-harp-c5.wav", baseFreq: 523.25, buffer: null },

    // Dechy a Melodie (Flutes)
    fluteA4: { url: "assets/zvuky/flute-a4.wav", baseFreq: 440.00, buffer: null },
    fluteA4v2: { url: "assets/zvuky/flute-a4-version-2.wav", baseFreq: 440.00, buffer: null },
    fluteE6: { url: "assets/zvuky/flute-e6.wav", baseFreq: 1318.51, buffer: null },
    dizzi: { url: "assets/zvuky/flute-dizzi-c.wav", baseFreq: 523.25, buffer: null },
    dudukC3: { url: "assets/zvuky/duduk-c3.wav", baseFreq: 130.81, buffer: null },
    
    // Smyčce (Pads/Cello)
    arcoF5: { url: "assets/zvuky/violin-arco-f5.wav", baseFreq: 698.46, buffer: null },

    // Bubny a Perkuse
    drum1: { url: "assets/zvuky/drum-1.wav", baseFreq: null, buffer: null },
    drumHard: { url: "assets/zvuky/drum-hard.wav", baseFreq: null, buffer: null },
    drumMuted: { url: "assets/zvuky/drum-muted.wav", baseFreq: null, buffer: null },
    doumbek: { url: "assets/zvuky/doumbek.wav", baseFreq: null, buffer: null },
    guitarImpact: { url: "assets/zvuky/guitar-impact.wav", baseFreq: null, buffer: null },

    // DLOUHÉ ATMOSFÉRICKÉ TEXTURY
    shakuTex: { url: "assets/zvuky/shakuhachi-sequence-16.wav", baseFreq: null, buffer: null },
    guzhengTex: { url: "assets/zvuky/guzheng-melody.wav", baseFreq: null, buffer: null },
    fluteTex: { url: "assets/zvuky/flute-melodie.wav", baseFreq: null, buffer: null },
    oudTex: { url: "assets/zvuky/oud-motif-d2.wav", baseFreq: null, buffer: null },
    bowlRing: { url: "assets/zvuky/sing-bowl-ring.wav", baseFreq: null, buffer: null },
    bowlLong: { url: "assets/zvuky/tibetan-singing-bowl-long.wav", baseFreq: null, buffer: null },
    scrape: { url: "assets/zvuky/violin-broken-string.wav", baseFreq: null, buffer: null },
    scrapeLow: { url: "assets/zvuky/violing-broken-string-a3.wav", baseFreq: null, buffer: null } // Nechal jsem to s tím překlepem "violing", jak to máš ty pojmenované!
  };

  let isSoundBankLoaded = false;

  const els = {
    trackName: document.getElementById("track-name"), autoSeed: document.getElementById("auto-seed"), biome: document.getElementById("audio-biome"), mood: document.getElementById("audio-mood"), style: document.getElementById("composition-style"), storyCurve: document.getElementById("story-curve"), stringsMode: document.getElementById("strings-mode"), volDrone: document.getElementById("vol-drone"), volWind: document.getElementById("vol-wind"), freqPluck: document.getElementById("freq-pluck"), freqFlute: document.getElementById("freq-flute"), freqBells: document.getElementById("freq-bells"), density: document.getElementById("tempo-density"), reverb: document.getElementById("reverb-depth"), btnPlay: document.getElementById("btn-play"), btnRecord: document.getElementById("btn-record"), canvas: document.getElementById("audio-canvas"), status: document.getElementById("status-text"), biomeReadout: document.getElementById("biome-readout"), moodReadout: document.getElementById("mood-readout"), recordProgress: document.getElementById("record-progress"), patternReadout: document.getElementById("pattern-readout")
  };

  let audioCtx, analyser, dataArray, canvasCtx = els.canvas?.getContext("2d");
  let masterGain, droneGain, windGain, instrumentGain, textureGain, delayNode, feedbackNode, delayFilter;
  let mediaRecorder, recordedChunks = [], recordingTimer, stopRecordingTimeout, recordGain;
  let engineTimeout, windTimeout, droneOscillators = [], droneFilter, windNodes = {};
  let isPlaying = false, isRecording = false, visualFrame = 0;
  let engineStartedAt = 0, phraseStep = 0, compositionState = null, measureCount = 0;

  function getSeed() { return getSharedHash(els.trackName?.value || "Vendigroth"); }
  function getRng(offset = 0) { return new CustomRandom((getSeed() + offset) >>> 0); }
  function currentBiome() { return BIOME_CONFIG[els.biome?.value] || BIOME_CONFIG.ashlands; }
  function currentMood() { return MOOD_CONFIG[els.mood?.value] || MOOD_CONFIG.meditative; }
  function currentStyle() { return STYLE_CONFIG[els.style?.value] || STYLE_CONFIG.wandering; }

  function updateReadout() {
    if (els.biomeReadout) els.biomeReadout.textContent = currentBiome().label;
    if (els.moodReadout) els.moodReadout.textContent = `${currentMood().label} / ${currentStyle().label}`;
  }

  function updatePatternHint(text) {
    if (els.patternReadout) els.patternReadout.textContent = text;
  }

  function currentElapsed() {
    if (!audioCtx || !engineStartedAt) return 0;
    return audioCtx.currentTime - engineStartedAt;
  }

  async function loadSoundBank() {
    if (isSoundBankLoaded) return;
    const promises = Object.keys(SOUND_BANK).map(async (key) => {
      try {
        const response = await fetch(SOUND_BANK[key].url);
        const arrayBuffer = await response.arrayBuffer();
        SOUND_BANK[key].buffer = await audioCtx.decodeAudioData(arrayBuffer);
      } catch (e) {
        console.warn(`Nepodařilo se načíst zvuk: ${SOUND_BANK[key].url}. Zkontroluj cestu k souboru!`, e);
      }
    });
    await Promise.all(promises);
    isSoundBankLoaded = true;
  }

  function generateComposition() {
    const rng = getRng(404 + phraseStep * 3);
    const progressionTemplate = rng.pick(CHORD_PROGRESSION_LIBRARY);
    const progression = progressionTemplate.map((degree) => {
      const rootIndex = Math.min(currentBiome().scale.length - 1, degree);
      return { degree, rootIndex, tones: buildChordIndexes(rootIndex, currentBiome().scale.length) };
    });

    compositionState = {
      progression, rhythm: rng.pick(RHYTHM_PATTERNS), phraseArc: 0,
      coreMotifOffsets: null, coreMotifDurations: null,
      lastLeadIndex: null, lastChordPosition: -1, chordPhraseCount: 0,
      motifEvolutionCycle: 0
    };
  }

  function getPhaseState() {
    const style = currentStyle(); const biome = currentBiome(); const curveName = els.storyCurve?.value || "slow_burn";
    const timeline = CURVES_CONFIG[curveName] || CURVES_CONFIG.slow_burn;
    let pIdx = Math.floor(measureCount / 16); if (pIdx >= timeline.length) pIdx = timeline.length - 1;
    const phaseDef = PHASE_LIBRARY[timeline[pIdx]];

    return {
      name: phaseDef.name, bpm: phaseDef.bpm,
      pluck: phaseDef.pluck * (biome.pluckMult || 1), flute: phaseDef.flute * (biome.fluteMult || 1),
      cello: phaseDef.cello * style.cello * (biome.celloMult || 1), drums: phaseDef.drums * style.drums * (biome.drumMult || 1),
      ensemble: phaseDef.ensemble * style.ensemble, phraseScale: style.phraseBias, bundle: phaseDef.bundle,
      gapMin: phaseDef.gapMin, gapMax: phaseDef.gapMax, leadPresence: phaseDef.leadPresence, responsePresence: phaseDef.responsePresence
    };
  }

  function buildChordIndexes(rootIndex, scaleLength) { return [rootIndex, (rootIndex + 2) % scaleLength, (rootIndex + 4) % scaleLength]; }
  function clampIndex(index, scaleLength) { return Math.max(0, Math.min(scaleLength - 1, index)); }

  function currentChordPosition() {
    if (!compositionState) generateComposition();
    const elapsed = currentElapsed();
    return Math.floor(elapsed / 12) % compositionState.progression.length;
  }

  function getPhraseRole(phase, chordPosition) {
    if (compositionState.lastChordPosition !== chordPosition) {
      if (chordPosition === 0) compositionState.motifEvolutionCycle++;
      compositionState.lastChordPosition = chordPosition; 
      compositionState.chordPhraseCount = 0;
    }
    const chordVisit = compositionState.chordPhraseCount;
    compositionState.chordPhraseCount += 1;
    return chordVisit === 0 ? "statement" : chordVisit === 1 ? "variation" : "resolve";
  }

  function buildLeadPhrase(scale, chord, phase, rng, role) {
    const phrase = []; const root = chord.rootIndex;
    let shouldGenerateNewMotif = !compositionState.coreMotifOffsets || (role === "statement" && compositionState.lastChordPosition === 0 && rng.value() < 0.25);

    if (shouldGenerateNewMotif) {
      const lengths = phase.name === "Pustina" ? [2, 3] : phase.name === "Katarze" ? [4, 5] : [2, 3, 4];
      const motifLength = rng.pick(lengths);
      const offsets = [0]; const durations = []; const currentRhythm = rng.pick(RHYTHM_PATTERNS); 
      
      let currentOffset = 0;
      for(let i = 1; i < motifLength; i++) {
        let maxJump = phase.name === "Katarze" ? 3 : phase.name === "Pochod" ? 2 : 1;
        let step = rng.pick([-maxJump, -1, 1, maxJump]); 
        currentOffset += step; offsets.push(currentOffset); durations.push(currentRhythm[i % currentRhythm.length]);
      }
      durations.push(rng.pick([4, 6])); 
      compositionState.coreMotifOffsets = offsets; compositionState.coreMotifDurations = durations; compositionState.rhythm = currentRhythm; 
    } else if (role === "variation" && rng.value() < 0.5) {
      let mutIndex = rng.rangeInt(1, compositionState.coreMotifOffsets.length);
      compositionState.coreMotifOffsets[mutIndex] += rng.pick([-1, 1]); 
    }

    const offsets = compositionState.coreMotifOffsets; const durations = compositionState.coreMotifDurations;
    
    for (let i = 0; i < offsets.length; i++) {
      let absoluteIndex = root + offsets[i];
      if (role === "variation" && i >= offsets.length - 2) absoluteIndex = root - offsets[i] + (rng.value() > 0.5 ? 1 : -1);
      if (role === "resolve" && i === offsets.length - 1) absoluteIndex = rng.pick([root, chord.tones[1], chord.tones[2]]);
      absoluteIndex = clampIndex(absoluteIndex, scale.length);
      
      let freq = scale[absoluteIndex];
      if (phase.name === "Katarze" && rng.value() < 0.3) freq *= 2; 
      else if (phase.name === "Pustina" && rng.value() < 0.2) freq *= 0.5;

      phrase.push({ index: absoluteIndex, freq: freq, duration: durations[i] });
    }
    return phrase;
  }

  function buildResponseNotes(scale, chord, phase, leadPhrase, rng, role) {
    const response = []; 
    const leadTop = leadPhrase[leadPhrase.length - 1]?.index ?? chord.rootIndex;
    let interval = rng.pick([1, 2, 3]); let dir = rng.pick([-1, 1]);

    response.push({ index: clampIndex(leadTop + (interval * dir), scale.length), freq: scale[clampIndex(leadTop + (interval * dir), scale.length)] * 2, duration: rng.pick([3, 4]) });
    response.push({ index: clampIndex(leadTop, scale.length), freq: scale[clampIndex(leadTop, scale.length)] * 2, duration: rng.pick([4, 6]) });
    return response;
  }

  function getChordAtPosition(position) {
    if (!compositionState) generateComposition();
    return compositionState.progression[((position % compositionState.progression.length) + compositionState.progression.length) % compositionState.progression.length];
  }

  function getBundleCount(phase, density) {
    const base = phase.bundle || 1;
    if (phase.name === "Katarze" && density > 0.9) return 3;
    if ((phase.name === "Pochod" || phase.name === "Očekávání") && density > 0.65) return Math.max(base, 2);
    return base;
  }

  function evolvePhraseRole(role, bundleIndex) {
    if (bundleIndex === 0) return role;
    if (role === "statement") return bundleIndex === 1 ? "variation" : "climb";
    return bundleIndex === 1 ? "variation" : "resolve";
  }

  function syncUIWithHash() {
    const rng = getRng(101);
    const biomes = Object.keys(BIOME_CONFIG); const moods = Object.keys(MOOD_CONFIG);
    const styles = Object.keys(STYLE_CONFIG); const curves = Object.keys(CURVES_CONFIG);
    if(els.biome) els.biome.value = rng.pick(biomes); if(els.mood) els.mood.value = rng.pick(moods);
    if(els.style) els.style.value = rng.pick(styles); if(els.storyCurve) els.storyCurve.value = rng.pick(curves);
    if(els.stringsMode) els.stringsMode.value = rng.value() > 0.5 ? "lead" : "rhythmic";
    if(els.volDrone) els.volDrone.value = rng.rangeFloat(0.35, 0.75).toFixed(2);
    if(els.volWind) els.volWind.value = rng.rangeFloat(0.2, 0.65).toFixed(2);
    if(els.freqPluck) els.freqPluck.value = rng.rangeFloat(0.2, 0.7).toFixed(2);
    if(els.freqFlute) els.freqFlute.value = rng.rangeFloat(0.05, 0.45).toFixed(2);
    if(els.freqBells) els.freqBells.value = rng.rangeFloat(0.05, 0.35).toFixed(2);
    if(els.density) els.density.value = rng.rangeFloat(0.45, 1.15).toFixed(2);
    if(els.reverb) els.reverb.value = rng.rangeFloat(0.35, 0.85).toFixed(2);
    compositionState = null; updateReadout();
  }

  function updateVolumes() {
    if (!audioCtx) { updateReadout(); return; }
    const now = audioCtx.currentTime;
    droneGain.gain.setTargetAtTime(parseFloat(els.volDrone?.value || 0.5), now, 0.2);
    windGain.gain.setTargetAtTime(parseFloat(els.volWind?.value || 0.4), now, 0.4);
    instrumentGain.gain.setTargetAtTime(0.85, now, 0.3);
    textureGain.gain.setTargetAtTime(0.45, now, 0.5); 
    feedbackNode.gain.setTargetAtTime((parseFloat(els.reverb?.value || 0.5)) * 0.72, now, 0.4);
    delayNode.delayTime.setTargetAtTime(0.55 + (parseFloat(els.reverb?.value || 0.5)) * 1.2, now, 0.4);
    delayFilter.frequency.setTargetAtTime(900 + (parseFloat(els.reverb?.value || 0.5)) * 800, now, 0.5);
    updateReadout();
  }

  function createNoiseBuffer(seconds) {
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * seconds, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (0.7 - Math.random() * 0.2);
    return buffer;
  }

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser(); analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    masterGain = audioCtx.createGain(); droneGain = audioCtx.createGain(); windGain = audioCtx.createGain(); 
    instrumentGain = audioCtx.createGain(); textureGain = audioCtx.createGain(); 
    compressor = audioCtx.createDynamicsCompressor(); compressor.threshold.value = -12; compressor.ratio.value = 10;

    delayNode = audioCtx.createDelay(3); feedbackNode = audioCtx.createGain();
    delayFilter = audioCtx.createBiquadFilter(); delayFilter.type = "lowpass";

    droneGain.connect(masterGain); windGain.connect(masterGain); instrumentGain.connect(masterGain); textureGain.connect(masterGain);
    instrumentGain.connect(delayNode); droneGain.connect(delayNode); textureGain.connect(delayNode); 
    delayNode.connect(feedbackNode); feedbackNode.connect(delayFilter); delayFilter.connect(delayNode);
    delayNode.connect(masterGain); masterGain.connect(compressor); compressor.connect(analyser); analyser.connect(audioCtx.destination);

    recordGain = audioCtx.createGain(); masterGain.connect(recordGain);
    const destination = audioCtx.createMediaStreamDestination(); recordGain.connect(destination);
    
    mediaRecorder = new MediaRecorder(destination.stream);
    mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunks.push(event.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "audio/webm" }); recordedChunks = [];
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url;
      link.download = `vendigroth_${(els.trackName?.value || "track").replace(/\s+/g, "_")}.webm`; link.click(); URL.revokeObjectURL(url);
    };

    updateVolumes();
  }

  function createDroneVoice(freq, type, detune, gainValue) {
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq; osc.detune.value = detune; gain.gain.value = gainValue;
    osc.connect(gain); gain.connect(droneFilter); osc.start();
    droneOscillators.push({ osc, gain });
  }

  function startDrone() {
    const biome = currentBiome();
    droneFilter = audioCtx.createBiquadFilter(); droneFilter.type = "lowpass";
    droneFilter.frequency.value = biome.droneFilter; droneFilter.Q.value = 0.7; droneFilter.connect(droneGain);

    createDroneVoice(biome.baseFreq, "triangle", -4, 0.13);
    createDroneVoice(biome.baseFreq * 0.5, "sine", 2, 0.21);
    createDroneVoice(biome.baseFreq * 1.498, "sine", -2, 0.045);

    const lfo = audioCtx.createOscillator(); const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.04 + Math.random() * 0.03; lfoGain.gain.value = 18;
    lfo.connect(lfoGain); lfoGain.connect(droneFilter.frequency); lfo.start();
    droneOscillators.push({ osc: lfo, gain: lfoGain, isLfo: true });
  }

  function scheduleWindGust() {
    if (!isPlaying || !audioCtx) return;
    const biome = currentBiome(); const rng = getRng(Math.floor(audioCtx.currentTime * 1000) + 707);
    const now = audioCtx.currentTime; const base = windNodes.baseFilter; const gust = windNodes.gustFilter; 
    const gustGain = windNodes.gustGain; const baseGain = windNodes.baseGain;
    const windVol = parseFloat(els.volWind?.value || 0.4);

    base.frequency.setTargetAtTime(biome.windCenter + rng.rangeFloat(-90, biome.windRange), now, 1.8);
    gust.frequency.setTargetAtTime(biome.windCenter + rng.rangeFloat(60, biome.windRange + 220), now, 1.1);

    baseGain.gain.setTargetAtTime(rng.rangeFloat(0.3, 0.9) * windVol, now, 2.0);
    const lift = rng.rangeFloat(0.0, 0.35) * windVol;
    gustGain.gain.cancelScheduledValues(now); 
    gustGain.gain.setTargetAtTime(lift, now, rng.rangeFloat(0.5, 1.5));
    gustGain.gain.setTargetAtTime(0.01, now + rng.rangeFloat(1.5, 3.0), rng.rangeFloat(1.0, 2.0));

    windTimeout = window.setTimeout(scheduleWindGust, rng.rangeInt(3000, 6000));
  }

  function startWind() {
    const buffer = createNoiseBuffer(4); const source = audioCtx.createBufferSource(); source.buffer = buffer; source.loop = true;
    const baseFilter = audioCtx.createBiquadFilter(); baseFilter.type = "bandpass"; baseFilter.Q.value = 0.45;
    const baseGain = audioCtx.createGain(); baseGain.gain.value = 0.8;
    const gustFilter = audioCtx.createBiquadFilter(); gustFilter.type = "bandpass"; gustFilter.Q.value = 1.1;
    const gustGain = audioCtx.createGain(); gustGain.gain.value = 0.04;
    const highCut = audioCtx.createBiquadFilter(); highCut.type = "lowpass"; highCut.frequency.value = 1600;

    source.connect(baseFilter); source.connect(gustFilter); baseFilter.connect(baseGain); gustFilter.connect(gustGain);
    baseGain.connect(highCut); gustGain.connect(highCut); highCut.connect(windGain); source.start();
    windNodes = { source, baseFilter, gustFilter, gustGain, baseGain, highCut }; scheduleWindGust();
  }

  function scheduleVoice(delayMs, callback) {
    if (!isPlaying || !audioCtx) return;
    const exactTime = audioCtx.currentTime + (delayMs / 1000);
    callback(exactTime);
  }

  function playSample(bankKey, freq, time, volumeMultiplier = 1, isTexture = false) {
    const bankItem = SOUND_BANK[bankKey];
    if (!bankItem || !bankItem.buffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = bankItem.buffer;
    
    if (bankItem.baseFreq && freq && !isTexture) {
      source.playbackRate.value = freq / bankItem.baseFreq;
    } else if (isTexture && Math.random() > 0.5) {
      source.playbackRate.value = 0.5;
    }

    const gainNode = audioCtx.createGain();
    
    if (isTexture) {
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.4 * volumeMultiplier, time + 2.0); 
      gainNode.gain.setTargetAtTime(0.001, time + source.buffer.duration - 2.0, 1.5);
      source.connect(gainNode);
      gainNode.connect(textureGain);
    } else {
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(0.6 * volumeMultiplier, time + 0.02);
      gainNode.gain.setTargetAtTime(0.001, time + source.buffer.duration - 0.1, 0.1);
      source.connect(gainNode);
      gainNode.connect(instrumentGain);
    }
    
    source.start(time);
  }

  function playPluck(freq, time, rng) { playSample(currentBiome().samples.pluck, freq, time, rng.rangeFloat(0.8, 1.2)); }
  function playFlute(freq, time, rng) { playSample(currentBiome().samples.flute, freq, time, rng.rangeFloat(0.7, 1.0)); }
  function playGuitar(freq, time, rng) { playSample("guitar", freq, time, rng.rangeFloat(0.9, 1.3)); }
  function playIndustrialHit(time, rng) { playSample("drumHard", null, time, rng.rangeFloat(0.8, 1.1)); }
  function playDeepThump(time, rng) { playSample("drumMuted", null, time, rng.rangeFloat(0.9, 1.3)); }
  function playScrape(freq, time, rng) { playSample("scrape", null, time, rng.rangeFloat(0.6, 1.0)); }
  function playTaiko(time, rng) { playSample(currentBiome().samples.drum, null, time, rng.rangeFloat(0.7, 1.0)); }

  function playCello(freq, time, rng, swell = 1) {
    const bankKey = currentBiome().samples.pad;
    const bankItem = SOUND_BANK[bankKey];
    if (!bankItem || !bankItem.buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = bankItem.buffer;
    source.playbackRate.value = freq / bankItem.baseFreq;
    const gainNode = audioCtx.createGain();
    
    gainNode.gain.setValueAtTime(0.001, time);
    gainNode.gain.linearRampToValueAtTime(0.4 * swell, time + 0.4); 
    gainNode.gain.setTargetAtTime(0.001, time + 2.5, 0.5);

    source.connect(gainNode); gainNode.connect(instrumentGain); source.start(time);
  }
  
  function scheduleTexture(time, phase, rng) {
    const chance = (currentMood().label === "Meditativní" || currentMood().label === "Rituální") ? 0.65 : 0.40;
    if (rng.value() < chance) {
      playSample(currentBiome().samples.texture, null, time, rng.rangeFloat(0.3, 0.6), true);
    }
  }

  function performPluckPhrase(note, time, rng, isChord = false) {
    if (!isChord) { playPluck(note.freq, time, rng); return; }
    const chordIndexes = buildChordIndexes(note.index, currentBiome().scale.length);
    chordIndexes.slice(0, 2).forEach((index, offset) => {
      const scale = currentBiome().scale; let f = scale[Math.min(scale.length - 1, index)];
      playPluck(f, time + (offset * 28)/1000, getRng(index + phraseStep * 113));
    });
  }

  function scheduleBassLine(scale, chord, phase, rng, spacing, answerStart) {
    const shouldPlay = rng.value() < parseFloat(els.freqBells?.value || 0.1) * phase.cello;
    if (!shouldPlay) return;
    const rootFreq = scale[chord.rootIndex] * 0.5;
    scheduleVoice(answerStart + rng.rangeInt(120, 320), (t) => { playCello(rootFreq, t, getRng(phraseStep * 59), 0.82 + phase.ensemble); });
  }

  function scheduleLeadLine(motif, phase, rng, spacing, startOffset = 0) {
    const leadChance = Math.min(0.98, parseFloat(els.freqPluck?.value || 0.5) * phase.pluck * phase.leadPresence * 1.25);
    const phraseActive = rng.value() < leadChance;
    let cursor = startOffset;
    motif.forEach((note, index) => {
      if (phraseActive && (phase.name !== "Pustina" || rng.value() < 0.85)) {
        scheduleVoice(cursor, (t) => {
          const phraseRng = getRng(index + phraseStep * 31);
          const useChord = els.stringsMode?.value === "rhythmic" && phase.ensemble > 0.16 && index === 0 && phraseRng.value() > 0.4;
          if (index === 0 && phase.name !== "Pustina" && phraseRng.value() > 0.6) playCello(note.freq * 0.5, t, phraseRng, 0.38 + phase.ensemble * 0.2);
          performPluckPhrase(note, t, phraseRng, useChord);
        });
      }
      cursor += note.duration * spacing;
    });
    return cursor;
  }

  function scheduleResponseLine(response, phase, rng, spacing, answerStart) {
    const responseChance = Math.min(0.95, parseFloat(els.freqFlute?.value || 0.3) * Math.max(0.4, phase.flute * 2.2) * phase.responsePresence * 1.4);
    const phraseActive = phase.flute > 0 && rng.value() < responseChance;
    let cursor = answerStart;
    response.forEach((note, index) => {
      if (phraseActive && (index === 0 || rng.value() < 0.85)) {
        scheduleVoice(cursor, (t) => { playFlute(note.freq * (index === 0 ? 1 : rng.rangeFloat(0.98, 1.02)), t, getRng(index + phraseStep * 43)); });
      }
      cursor += note.duration * spacing;
    });
    return cursor;
  }

  function scheduleStringsPad(scale, chord, response, phase, rng, spacing, answerStart) {
    if (!(phase.ensemble > 0.01 && rng.value() < parseFloat(els.freqBells?.value || 0.1) * phase.ensemble)) return;
    const chordIndexes = chord.tones;
    scheduleVoice(answerStart + spacing, (t) => {
      chordIndexes.forEach((idx, chordOffset) => { playCello(scale[idx], t + (chordOffset * 160)/1000, getRng(phraseStep * (71 + chordOffset)), 0.58 + phase.ensemble * 0.55); });
    });
  }

  // === HLAVNÍ HUDEBNÍ TEP ===
  function generativeTick() {
    if (!isPlaying || !audioCtx) return;
    const biome = currentBiome(); const mood = currentMood(); const style = currentStyle();
    
    const phase = getPhaseState(); 
    const rng = getRng(Math.floor(audioCtx.currentTime * 1000) + 303 + phraseStep * 17);
    const scale = biome.scale; const chordPosition = currentChordPosition();
    const chord = getChordAtPosition(chordPosition); const phraseRole = getPhraseRole(phase, chordPosition);
    const density = parseFloat(els.density?.value || 0.8) * mood.density * phase.phraseScale * style.phraseBias;
    const spacing = ((60 / phase.bpm) * 1000) / 2;
    const bundleCount = getBundleCount(phase, density);
    let bundleCursor = 0;

    for (let bundleIndex = 0; bundleIndex < bundleCount; bundleIndex += 1) {
      const localRole = evolvePhraseRole(phraseRole, bundleIndex);
      const localChordPosition = (chordPosition + (bundleIndex > 0 && phase.name !== "Pustina" && phase.name !== "Popel" ? bundleIndex % 2 : 0)) % compositionState.progression.length;
      const localChord = getChordAtPosition(localChordPosition);
      const localRng = getRng(Math.floor(audioCtx.currentTime * 1000) + 303 + phraseStep * 17 + bundleIndex * 131);
      
      const motif = buildLeadPhrase(scale, localChord, phase, localRng, localRole);
      const response = buildResponseNotes(scale, localChord, phase, motif, localRng, localRole);
      let questionLength = 0; motif.forEach((note) => { questionLength += note.duration * spacing; });
      const answerStart = bundleCursor + questionLength + spacing * (bundleIndex === 0 ? 0.55 : 0.35);
      let answerLength = 0; response.forEach((note) => { answerLength += note.duration * spacing; });

      scheduleLeadLine(motif, phase, localRng, spacing, bundleCursor);
      scheduleResponseLine(response, phase, localRng, spacing, answerStart);
      scheduleBassLine(scale, localChord, phase, localRng, spacing, answerStart);
      scheduleStringsPad(scale, localChord, response, phase, localRng, spacing, answerStart);

      const biomeKey = els.biome?.value || "ashlands";
      if (biomeKey === "ruins" && localRng.value() < 0.35 * phase.drums) {
        scheduleVoice(bundleCursor, (t) => playIndustrialHit(t, localRng)); 
      } else if (biomeKey === "fungal" && localRng.value() < 0.4 * phase.ensemble) {
        scheduleVoice(bundleCursor, (t) => playGuitar(scale[localRng.rangeInt(0, scale.length)] * 2, t, localRng)); 
      } else if (biomeKey === "dunes" && localRng.value() < 0.15) {
        scheduleVoice(bundleCursor, (t) => playGuitar(scale[localChord.rootIndex] * 0.5, t, localRng)); 
      } else if (biomeKey === "ashlands" && localRng.value() < 0.25 * phase.pluck) {
        scheduleVoice(bundleCursor, (t) => playScrape(null, t, localRng)); 
      } else if (biomeKey === "bamboo" && localRng.value() < 0.3 * phase.drums) {
        scheduleVoice(bundleCursor + spacing * 2, (t) => playIndustrialHit(t, localRng)); 
      } else if (biomeKey === "catacombs" && localRng.value() < 0.2 * phase.cello) {
        scheduleVoice(bundleCursor, (t) => playDeepThump(t, localRng)); 
      }

      if (phase.drums > 0.01 && localRng.value() < phase.drums * (bundleIndex === bundleCount - 1 ? 1.2 : 0.75)) {
        scheduleVoice(bundleCursor + Math.max(180, spacing * 2), (t) => { playTaiko(t, getRng(phraseStep * 97 + bundleIndex * 29)); });
      }

      if (bundleIndex === 0 && localRole === "statement") {
        scheduleVoice(bundleCursor, (t) => { scheduleTexture(t, phase, localRng); });
      }
      
      bundleCursor = answerStart + answerLength;
    }

    updatePatternHint(`${phase.name} / Akord ${chordPosition + 1}/${compositionState.progression.length} | Mutace: ${compositionState.motifEvolutionCycle}`);
    phraseStep += 1; measureCount += 1;

    const calculatedGap = Math.floor((phase.gapMax * style.silence) / Math.max(0.5, density));
    const safeGap = Math.min(8000, Math.max(phase.gapMin, calculatedGap + rng.rangeInt(0, 2000)));
    const wait = Math.floor(bundleCursor + safeGap); 

    engineTimeout = window.setTimeout(generativeTick, wait);
  }

  function startEngine() {
    engineStartedAt = audioCtx.currentTime; phraseStep = 0; measureCount = 0;
    generateComposition(); startDrone(); startWind(); generativeTick();
  }

  function stopAll() {
    window.clearTimeout(engineTimeout); window.clearTimeout(windTimeout);
    if(stopRecordingTimeout) window.clearTimeout(stopRecordingTimeout);
    droneOscillators.forEach((node) => { try { node.osc.stop(); } catch (error) { return; } }); droneOscillators = [];
    if (windNodes.source) { try { windNodes.source.stop(); } catch (error) { return; } } windNodes = {};
    engineStartedAt = 0; compositionState = null;
  }

  // === VIZUALIZACE A UI ===
  function drawVisualizer() {
    if (!isPlaying || !analyser) return;
    visualFrame = requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    const biome = currentBiome(); const [primary, secondary] = biome.colors;
    const width = els.canvas.width; const height = els.canvas.height;
    const cx = width / 2; const cy = height / 2; const baseRadius = 78;

    canvasCtx.clearRect(0, 0, width, height);
    const bg = canvasCtx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.5);
    bg.addColorStop(0, "rgba(33, 28, 24, 0.88)"); bg.addColorStop(1, "rgba(5, 5, 5, 0.96)");
    canvasCtx.fillStyle = bg; canvasCtx.fillRect(0, 0, width, height);

    canvasCtx.strokeStyle = `${secondary}55`; canvasCtx.lineWidth = 1;
    for (let ring = 0; ring < 4; ring += 1) {
      canvasCtx.beginPath(); canvasCtx.arc(cx, cy, baseRadius + ring * 32, 0, Math.PI * 2); canvasCtx.stroke();
    }

    canvasCtx.beginPath();
    for (let i = 0; i < dataArray.length; i += 1) {
      const angle = (i / dataArray.length) * Math.PI * 2;
      const energy = dataArray[i] / 255; const radius = baseRadius + energy * 76;
      const x = cx + Math.cos(angle) * radius; const y = cy + Math.sin(angle) * radius;
      if (i === 0) canvasCtx.moveTo(x, y); else canvasCtx.lineTo(x, y);
    }
    canvasCtx.closePath();
    canvasCtx.strokeStyle = primary; canvasCtx.lineWidth = 2.2;
    canvasCtx.shadowColor = primary; canvasCtx.shadowBlur = 18; canvasCtx.stroke(); canvasCtx.shadowBlur = 0;

    canvasCtx.beginPath(); canvasCtx.arc(cx, cy, 48 + (dataArray[3] / 255) * 28, 0, Math.PI * 2);
    const core = canvasCtx.createRadialGradient(cx, cy, 0, cx, cy, 92);
    core.addColorStop(0, `${primary}bb`); core.addColorStop(1, `${secondary}22`);
    canvasCtx.fillStyle = core; canvasCtx.fill();
  }

  function setPlayingState(playing, isLoading = false) {
    isPlaying = playing && !isLoading;
    if (isLoading) {
      els.btnPlay.textContent = "Načítám samply..."; if(els.status) els.status.textContent = "Stahuji zvukové nástroje z lokální složky...";
      els.btnPlay.style.borderColor = "#ffcc00"; els.btnPlay.style.color = "#ffcc00";
    } else if (playing) {
      els.btnPlay.textContent = "Zastavit syntézu"; if(els.status) els.status.textContent = "Generuji krajinu...";
      els.btnPlay.style.borderColor = "rgba(255, 126, 98, 0.36)"; els.btnPlay.style.color = "#ffb7a4";
    } else {
      els.btnPlay.textContent = "Zahájit syntézu"; if(els.status) els.status.textContent = "Neaktivní. Spusť syntézu a nech nástroj vytvořit vlastní temný soundscape.";
      els.btnPlay.style.borderColor = ""; els.btnPlay.style.color = "";
      cancelAnimationFrame(visualFrame); canvasCtx.clearRect(0, 0, els.canvas.width, els.canvas.height);
    }
  }

  async function togglePlay() {
    initAudio(); audioCtx.resume();
    if (!isPlaying) { 
      setPlayingState(true, true); 
      await loadSoundBank();
      setPlayingState(true, false); 
      updateVolumes(); startEngine(); drawVisualizer(); 
    } 
    else { setPlayingState(false); stopAll(); }
  }

  function restartIfPlaying() {
    updateReadout();
    if (!isPlaying) return;
    stopAll(); updateVolumes(); startEngine();
  }

  function toggleRecording() {
    if (!isPlaying || !mediaRecorder) return;
    
    if (isRecording) {
      window.clearInterval(recordingTimer);
      if(els.btnRecord) els.btnRecord.disabled = true;
      if(els.recordProgress) els.recordProgress.textContent = "Ukončuji a aplikuji fade-out (3s)...";
      
      const now = audioCtx.currentTime;
      recordGain.gain.cancelScheduledValues(now);
      recordGain.gain.setValueAtTime(recordGain.gain.value, now);
      recordGain.gain.linearRampToValueAtTime(0.001, now + 3.0);
      
      stopRecordingTimeout = window.setTimeout(() => {
        mediaRecorder.stop();
        isRecording = false;
        if(els.btnRecord) { els.btnRecord.disabled = false; els.btnRecord.textContent = "Nahrát 120s smyčku"; els.btnRecord.style.opacity = "1"; }
        if(els.recordProgress) els.recordProgress.textContent = "Hotovo. Soubor se stahuje.";
      }, 3200);
      
    } else {
      isRecording = true; let seconds = 0; recordedChunks = []; 
      const now = audioCtx.currentTime;
      recordGain.gain.cancelScheduledValues(now); recordGain.gain.setValueAtTime(0.001, now); recordGain.gain.linearRampToValueAtTime(1.0, now + 3.0);
      
      mediaRecorder.start();
      if(els.recordProgress) els.recordProgress.textContent = "Nahrávám: 0s / 120s (Fade-in...)";
      if(els.btnRecord) els.btnRecord.textContent = "Ukončit nahrávání";
      
      recordingTimer = window.setInterval(() => {
        seconds += 1;
        if(els.recordProgress) els.recordProgress.textContent = `Nahrávám: ${seconds}s / 120s`;
        if (seconds >= 120) toggleRecording();
      }, 1000);
    }
  }

  const manualInputs = document.querySelectorAll(".manual-input");
  if(els.trackName) els.trackName.addEventListener("input", () => { if (els.autoSeed && els.autoSeed.checked) syncUIWithHash(); restartIfPlaying(); });
  manualInputs.forEach((input) => { input.addEventListener("input", () => { if(els.autoSeed) els.autoSeed.checked = false; updateVolumes(); restartIfPlaying(); }); });
  if(els.autoSeed) els.autoSeed.addEventListener("change", () => { if (els.autoSeed.checked) { syncUIWithHash(); restartIfPlaying(); } });
  if(els.btnPlay) els.btnPlay.addEventListener("click", togglePlay);
  if(els.btnRecord) els.btnRecord.addEventListener("click", toggleRecording);

  syncUIWithHash(); updateReadout();
})();