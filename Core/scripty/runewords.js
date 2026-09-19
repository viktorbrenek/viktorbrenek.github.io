// Diablo Hub — Runewords databáze a interaktivní filtr/tooltip
// Zdroj dat: d4guides.gg (datamining, 16. 9. 2026) — čísla se do vydání mohou změnit.

const RUNE_GLYPHS = {
  Mal: "ᛗ",
  Tir: "ᛏ",
  Ral: "ᚱ",
  Jah: "ᛃ",
  Ith: "ᛁ",
  Ber: "ᛒ",
  Tal: "ᛞ",
  Sol: "ᛊ",
  Thul: "ᚦ",
  Ort: "ᛟ",
  Amn: "ᚨ",
  Eth: "ᛖ",
  Vex: "ᚹ",
  Lo: "ᛚ",
  Ohm: "ᚩ",
  Ist: "ᛈ"
};

const RUNE_ICON_BASE = "assets/images/runewords/runes/";
const ITEM_ICON_BASE = "assets/images/runewords/items/";
const GEM_ICON_BASE = "assets/images/runewords/gems/";

// Mapuje slot na soubor s ikonou — kde nebyla přesná ikona k dispozici,
// použitá je ikona nejbližší kategorie (zbroj pro zbroj, palcát pro cep atd.).
const ITEM_ICON_FILE = {
  chest: "armor",
  helm: "armor",
  staff: "staff",
  quarterstaff: "staff",
  dagger: "dagger",
  axe: "axe",
  berserkerAxe: "axe",
  mace: "mace",
  flail: "mace",
  sword: "sword",
  oneHand: "sword",
  phaseBlade: "phaseblade",
  focus: "focus",
  shield: "focus",
  totem: "focus",
  bow: "bow",
  crossbow: "bow",
  polearm: "polearm",
  glaive: "polearm"
};

const SLOT_LABELS = {
  chest: "Hrudní zbroj",
  helm: "Přilba",
  staff: "Hůl",
  dagger: "Dýka",
  bow: "Luk",
  crossbow: "Kuše",
  polearm: "Tyčová zbraň",
  glaive: "Glaive",
  quarterstaff: "Bojová hůl",
  axe: "Sekera",
  mace: "Palcát",
  flail: "Cep",
  sword: "Meč",
  focus: "Fokus",
  shield: "Štít",
  totem: "Totem",
  berserkerAxe: "Berserker Axe",
  phaseBlade: "Phase Blade",
  oneHand: "Jednoruční zbraň"
};

const RUNEWORDS = [
  {
    id: "prudence",
    name: "Prudence",
    runes: ["Mal", "Tir"],
    slots: ["chest"],
    variants: null,
    power: null,
    inherent: null,
    stats: [
      "+500 Resistance to All Elements",
      "10.0% Damage Reduction",
      "25.0% Impairment Reduction",
      "+[20.0–35.0]% Total Armor",
      "+2 Primary Resource On Kill",
      "10.0% Dodge Chance"
    ]
  },
  {
    id: "leaf",
    name: "Leaf",
    runes: ["Tir", "Ral"],
    slots: ["staff"],
    variants: null,
    power: null,
    inherent: null,
    stats: [
      "+2 Primary Resource On Kill",
      "+17.5% Cold Resistance",
      "10.0% Resource Generation"
    ]
  },
  {
    id: "insight",
    name: "Insight",
    runes: ["Ral", "Tir", "Tal", "Sol"],
    slots: ["bow", "crossbow", "polearm"],
    variants: 7,
    power: null,
    inherent: null,
    stats: [
      "+17.5% Attack Speed",
      "+[8.0–23.0]% Critical Strike Chance",
      "+[104–173] Weapon Damage",
      "+[150–180] All Stats",
      "100% (mult.) Critical Strike Damage Multiplier"
    ]
  },
  {
    id: "enigma",
    name: "Enigma",
    runes: ["Jah", "Ith", "Ber"],
    slots: ["chest"],
    variants: null,
    power: "Tvůj Evade je nahrazen Sorcererovým Teleportem a stojí 33 primárního zdroje.",
    inherent: null,
    stats: [
      "+2 to All Skills",
      "+45% Movement Speed",
      "12.0% Damage Reduction",
      "40.0% Maximum Life",
      "+[981–1,225] Armor"
    ]
  },
  {
    id: "spirit",
    name: "Spirit",
    runes: ["Tal", "Thul", "Ort", "Amn"],
    slots: ["oneHand"],
    variants: 10,
    power: null,
    inherent: null,
    stats: [
      "+5 to All Skills",
      "+[25.0–35.0]% Attack Speed",
      "50% (mult.) All Damage Multiplier",
      "+[20–56] Maximum Resource",
      "50.0% Impairment Reduction"
    ]
  },
  {
    id: "holy-thunder",
    name: "Holy Thunder",
    runes: ["Eth", "Ral", "Ort", "Tal"],
    slots: ["flail", "mace"],
    variants: 2,
    power: "Vyzařuješ Crackling Energy — zasažení nepřátelé po 3 s dostávají o [20–35] % víc Holy/Fire/Lightning/Physical poškození od tebe.",
    inherent: null,
    stats: [
      "+35.0% Lightning Resistance",
      "50% (mult.) All Damage Multiplier",
      "+20.0% Lucky Hit Chance"
    ]
  },
  {
    id: "kings-grace",
    name: "King's Grace",
    runes: ["Amn", "Ral", "Thul"],
    slots: ["flail", "mace", "sword"],
    variants: 3,
    power: null,
    inherent: null,
    stats: [
      "+? Damage to Demons",
      "+? Damage to Undead",
      "+[789–948] Life On Hit",
      "+50.0% Lucky Hit Chance",
      "75% (mult.) All Damage Multiplier"
    ]
  },
  {
    id: "phoenix",
    name: "Phoenix",
    runes: ["Vex", "Vex", "Jah", "Lo"],
    slots: ["oneHand"],
    variants: 10,
    power: "Při level-upu odpálíš Rank 40 Ring of Fire. Lucky Hit: až [15–30] % šance odpálit Rank 22 Fire Spear.",
    inherent: null,
    stats: [
      "+[526–632] Life On Kill",
      "Lucky Hit: až 40 % šance na +1,500 Fire Damage",
      "+20.0% Deadly Strike Chance",
      "50% (mult.) All Damage Multiplier"
    ]
  },
  {
    id: "pattern",
    name: "Pattern",
    runes: ["Tal", "Ort", "Thul"],
    slots: ["dagger"],
    variants: null,
    power: null,
    inherent: "30.0% Block Chance (i bez štítu)",
    stats: [
      "50% (mult.) All Damage Multiplier",
      "+10.0% All Stats",
      "Lucky Hit: až 40 % šance na [1,100–1,600] Poisoning Damage po dobu 10 s",
      "+[10.0–20.0]% Critical Strike Chance",
      "+[325–400] Resistance to All Elements"
    ]
  },
  {
    id: "rain",
    name: "Rain",
    runes: ["Ort", "Mal", "Ith"],
    slots: ["chest"],
    variants: null,
    power: "Lucky Hit: až [15–30] % šance odpálit Rank 15 Druid Tornado. 50 % šance odpálit Rank 15 Druid Cyclone Armor při Dodge.",
    inherent: null,
    stats: [
      "+[25–40] Maximum Resource",
      "+5 to Nature Magic Skills",
      "10.0% Damage Reduction",
      "+35.0% Lightning Resistance",
      "10.0% Dodge Chance"
    ]
  },
  {
    id: "call-to-arms",
    name: "Call to Arms",
    runes: ["Amn", "Ral", "Mal", "Ohm", "Ist"],
    slots: ["axe", "dagger", "flail", "focus", "mace"],
    variants: 9,
    power: "Dokud jsi pod účinkem Shout skillu: +5 Ranks to all Skills, +15% Maximum Life, +15% Maximum Primary Resource.",
    inherent: null,
    stats: [
      "+[200–250] Weapon Damage",
      "+1 to All Skills",
      "40% (mult.) All Damage Multiplier",
      "+5 to Shout Skills",
      "+40.0% Attack Speed"
    ]
  },
  {
    id: "edge",
    name: "Edge",
    runes: ["Tir", "Tal", "Amn"],
    slots: ["bow", "crossbow", "glaive", "polearm", "quarterstaff"],
    variants: 10,
    power: null,
    inherent: "+7.5% šance na extra item od Purveyor of Curiosities",
    stats: [
      "+17.5% Attack Speed",
      "+? Damage to Demons",
      "Lucky Hit: až 40 % šance na [1,100–1,600] Poisoning Damage po dobu 10 s",
      "+[150–180] All Stats",
      "+[0.75–1.0] Thorns",
      "+? Damage to Undead"
    ]
  },
  {
    id: "ancients-pledge",
    name: "Ancient's Pledge",
    runes: ["Ral", "Ort", "Tal"],
    slots: ["focus", "shield", "totem"],
    variants: 3,
    power: null,
    inherent: null,
    stats: [
      "35% (mult.) All Damage Multiplier",
      "+35.0% Cold Resistance",
      "+35.0% Fire Resistance",
      "+35.0% Lightning Resistance",
      "+35.0% Poison Resistance",
      "35.0% Damage Reduction"
    ]
  },
  {
    id: "strength",
    name: "Strength",
    runes: ["Amn", "Tir"],
    slots: ["axe", "dagger", "flail", "focus", "mace"],
    variants: 9,
    power: null,
    inherent: "Lucky Hit: až 25.0 % šance na Crushing Blow",
    stats: [
      "+10.0% Strength",
      "+[1,831–2,200] Maximum Life",
      "+[789–948] Life On Hit",
      "+2 Primary Resource On Kill",
      "50% (mult.) All Damage Multiplier"
    ]
  },
  {
    id: "grief",
    name: "Grief",
    runes: ["Eth", "Tir", "Lo", "Mal", "Ral"],
    slots: ["berserkerAxe", "phaseBlade"],
    variants: 2,
    power: null,
    inherent: "Indestructible",
    stats: [
      "Přímé poškození způsobí 40 % bonusového Poisoning damage po dobu 5 s",
      "+[750–1,000] Weapon Damage",
      "+20.0% Deadly Strike Chance",
      "+[30.0–40.0]% Attack Speed",
      "+? Damage to Demons",
      "+2 Primary Resource On Kill"
    ]
  },
  {
    id: "lore",
    name: "Lore",
    runes: ["Ort", "Sol"],
    slots: ["helm"],
    variants: null,
    power: null,
    inherent: null,
    stats: [
      "+2 to All Skills",
      "+25 Maximum Resource",
      "10.0% Damage Reduction",
      "+[2,275–2,800] Lightning Resistance",
      "+2 Primary Resource On Kill",
      "+[1,963–2,500] Armor"
    ]
  },
  {
    id: "infinity",
    name: "Infinity",
    runes: ["Ber", "Ber", "Mal", "Ist"],
    slots: ["bow", "crossbow", "glaive", "polearm", "quarterstaff"],
    variants: 10,
    power: "50 % šance odpálit Rank 10 Sorcerer Chain Lightning při zabití nepřítele. Získáváš Rank 11 pasivku Druid's Cyclone Armor. Blízcí nepřátelé jsou Vulnerable a berou od tebe o 62.5 % (mult.) víc poškození.",
    inherent: "Lucky Hit: až 20.0 % šance na Crushing Blow",
    stats: [
      "+17.5% Movement Speed",
      "+[1,831–2,200] Maximum Life",
      "+[50–100]% Gold Drop Rate"
    ]
  },
  {
    id: "stealth",
    name: "Stealth",
    runes: ["Eth", "Tal"],
    slots: ["chest"],
    variants: null,
    power: null,
    inherent: null,
    stats: [
      "+[1,831–2,200] Maximum Life",
      "+25.0% Attack Speed",
      "25.0% Impairment Reduction",
      "15.0% Resource Generation",
      "+25% Movement Speed",
      "15.0% Damage Reduction"
    ]
  },
  {
    id: "zephyr",
    name: "Zephyr",
    runes: ["Ort", "Eth"],
    slots: ["bow", "crossbow"],
    variants: 2,
    power: "Při Dodge odpálíš Dust Devil.",
    inherent: null,
    stats: [
      "12.5% Dodge Chance",
      "+12.5% Attack Speed",
      "+12.5% Movement Speed",
      "62.5% (mult.) All Damage Multiplier",
      "Lucky Hit: až 40 % šance na +1,500 Lightning Damage"
    ]
  }
];

// Vylepšování run v Horadric Cube — nižší runy + případně gem => vyšší runa.
const RUNE_UPGRADES = [
  { from: "Tir", count: 3, extra: null, to: "Eth" },
  { from: "Eth", count: 3, extra: null, to: "Ith" },
  { from: "Ith", count: 3, extra: null, to: "Tal" },
  { from: "Tal", count: 3, extra: null, to: "Ral" },
  { from: "Ral", count: 3, extra: null, to: "Ort" },
  { from: "Ort", count: 3, extra: null, to: "Thul" },
  { from: "Thul", count: 3, extra: { name: "Chipped Topaz", icon: "chipped_topaz_gem_diablo4_wiki_guide" }, to: "Amn" },
  { from: "Amn", count: 3, extra: { name: "Chipped Amethyst", icon: "chipped_amethyst_gem_diablo4_wiki_guide" }, to: "Sol" },
  { from: "Mal", count: 2, extra: { name: "Flawless Amethyst", icon: "flawless_amethyst_gem_diablo4_wiki_guide" }, to: "Ist" },
  { from: "Ist", count: 2, extra: { name: "Flawless Ruby", icon: "flawless_ruby_gem_diablo4_wiki_guide" }, to: "Vex" },
  { from: "Vex", count: 2, extra: { name: "Flawless Emerald", icon: "flawless_emerald_gem_diablo4_wiki_guide" }, to: "Ohm" },
  { from: "Ohm", count: 2, extra: { name: "Flawless Diamond", icon: "flawless_diamond_gem_diablo4_wiki_guide" }, to: "Lo" },
  { from: "Lo", count: 2, extra: { name: "Grand Topaz", icon: "grand_topaz_gem_diablo4_wiki_guide_130px" }, to: "Ber" },
  { from: "Ber", count: 2, extra: { name: "Grand Sapphire", icon: "grand_sapphire_gem_diablo4_wiki_guide_130px" }, to: "Jah" }
];

// Další (quest) recepty do Horadric Cube — zatím bez obrázků itemů.
const OTHER_RECIPES = [
  { inputs: ["Torn Page", "Rusty Cow Bell ×3"], result: "Outcast's Travel Pouch" },
  { inputs: ["Horadric Coin", "Engagement Ring ×2", "Lost Amulet"], result: "Sack of Ill Trinkets" },
  { inputs: ["10 Gold"], result: "Torn Net" },
  { inputs: ["Cheap Bangles", "Lost Amulet", "Useless Key", "Holy Chalice", "Engagement Ring"], result: "Worthless Gold Cache" },
  { inputs: ["Neyrelle's Hand", "Rusted Bardiche", "Stamina Potion"], result: "Trophy of the Faithful" }
];

const OWNED_RUNES_KEY = "diablo-hub-owned-runes";

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function formatStatLine(text) {
  const safe = escapeHtml(text);
  return safe.replace(/\?/g, '<span class="rw-unknown" title="Hodnota zatím není v datech vyčíslená (datamining) — dorovná se před vydáním.">?</span>');
}

function slotLabel(slot) {
  return SLOT_LABELS[slot] || slot;
}

function loadOwnedRunes() {
  try {
    const raw = window.localStorage.getItem(OWNED_RUNES_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((r) => Object.prototype.hasOwnProperty.call(RUNE_GLYPHS, r)));
    }
  } catch (err) {
    // localStorage nedostupné nebo poškozené — pokračuj s prázdnou sadou.
  }
  return new Set();
}

function saveOwnedRunes(owned) {
  try {
    window.localStorage.setItem(OWNED_RUNES_KEY, JSON.stringify(Array.from(owned)));
  } catch (err) {
    // Ukládání selhalo (private mode apod.) — ownership zůstane jen pro tuhle session.
  }
}

function runeIconImg(rune, sizeClass) {
  const glyph = escapeHtml(RUNE_GLYPHS[rune] || "?");
  return `<img class="${sizeClass}" src="${RUNE_ICON_BASE}${rune.toLowerCase()}.webp" alt="${escapeHtml(rune)}" title="${escapeHtml(rune)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'${sizeClass} rw-glyph-fallback',textContent:'${glyph}'}))">`;
}

function itemIconImg(slot, sizeClass) {
  const file = ITEM_ICON_FILE[slot];
  if (!file) {
    return "";
  }
  const label = escapeHtml(slotLabel(slot));
  return `<img class="${sizeClass}" src="${ITEM_ICON_BASE}${file}.webp" alt="${label}" title="${label}" loading="lazy" onerror="this.remove()">`;
}

function gemIconImg(icon, name, sizeClass) {
  const label = escapeHtml(name);
  return `<img class="${sizeClass}" src="${GEM_ICON_BASE}${icon}.png" alt="${label}" title="${label}" loading="lazy" onerror="this.remove()">`;
}

function buildLegend(container, owned, onToggle) {
  container.innerHTML = "";
  Object.keys(RUNE_GLYPHS).forEach((rune) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rw-legend__item";
    btn.dataset.rune = rune;
    btn.setAttribute("aria-pressed", owned.has(rune) ? "true" : "false");
    btn.innerHTML = `
      <span class="rw-legend__glyph" aria-hidden="true">${runeIconImg(rune, "rw-legend__icon")}</span>
      <span class="rw-legend__name">${rune}</span>
    `;
    btn.addEventListener("click", () => onToggle(rune, btn));
    container.appendChild(btn);
  });
}

function buildItemTypeOptions(select) {
  const used = new Set();
  RUNEWORDS.forEach((rw) => rw.slots.forEach((s) => used.add(s)));
  const sorted = Array.from(used).sort((a, b) => slotLabel(a).localeCompare(slotLabel(b), "cs"));
  sorted.forEach((slot) => {
    const opt = document.createElement("option");
    opt.value = slot;
    opt.textContent = slotLabel(slot);
    select.appendChild(opt);
  });
}

function buildSocketFilters(container, onChange) {
  const counts = Array.from(new Set(RUNEWORDS.map((rw) => rw.runes.length))).sort((a, b) => a - b);
  counts.forEach((count) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rw-chip-filter";
    btn.dataset.sockets = String(count);
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = `${count} sokety`;
    btn.addEventListener("click", () => {
      const active = btn.getAttribute("aria-pressed") === "true";
      container.querySelectorAll(".rw-chip-filter").forEach((el) => el.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", active ? "false" : "true");
      onChange(active ? null : count);
    });
    container.appendChild(btn);
  });
}

function runeStatus(rune, owned) {
  return owned.has(rune) ? "is-owned" : "is-missing";
}

function renderChain(runes, owned) {
  return runes
    .map((rune, index) => {
      const isLast = index === runes.length - 1;
      const statusClass = owned ? ` ${runeStatus(rune, owned)}` : "";
      return `
        <span class="rw-chip${statusClass}" title="${escapeHtml(rune)}">
          <span class="rw-chip__index">${index + 1}</span>
          <span class="rw-chip__glyph" aria-hidden="true">${runeIconImg(rune, "rw-chip__icon")}</span>
          <span class="rw-chip__name">${escapeHtml(rune)}</span>
        </span>
        ${isLast ? "" : '<span class="rw-chip__connector" aria-hidden="true">+</span>'}
      `;
    })
    .join("");
}

function readinessStatus(rw, owned) {
  const uniqueRunes = Array.from(new Set(rw.runes));
  const missing = uniqueRunes.filter((r) => !owned.has(r));
  if (missing.length === 0) {
    return "ready";
  }
  if (missing.length === 1) {
    return "short";
  }
  return "more";
}

function renderCard(rw, owned) {
  const article = document.createElement("article");
  article.className = "rw-card";
  article.dataset.id = rw.id;
  article.dataset.runes = rw.runes.join(",");
  article.dataset.slots = rw.slots.join(",");
  article.dataset.search = [
    rw.name,
    rw.runes.join(" "),
    rw.slots.map(slotLabel).join(" "),
    rw.stats.join(" "),
    rw.power || "",
    rw.inherent || ""
  ]
    .join(" ")
    .toLowerCase();

  const variantsText = rw.variants ? ` · ${rw.variants} variant itemu` : "";
  const slotsText = rw.slots.map(slotLabel).join(" / ");
  const code = rw.runes.join("").toUpperCase();

  article.innerHTML = `
    <div class="rw-card__recipe">
      <div class="rw-card__heading">
        <h3 class="rw-card__title">${escapeHtml(rw.name)}</h3>
        <span class="rw-card__code">${escapeHtml(code)}</span>
      </div>
      <div class="rw-card__chain">${renderChain(rw.runes, owned)}</div>
      <p class="rw-card__bases"><span class="rw-card__bases-label">Bases:</span> ${escapeHtml(slotsText)}${variantsText} · ${rw.runes.length} sokety</p>
      <button type="button" class="rw-card__copy" data-copy="${escapeHtml(rw.runes.join("-"))}">
        Kopírovat recept (${escapeHtml(rw.runes.join("-"))})
      </button>
    </div>
    <div class="rw-tooltip">
      <div class="rw-tooltip__icons">${rw.slots.map((slot) => itemIconImg(slot, "rw-tooltip__icon")).join("")}</div>
      <p class="rw-tooltip__name">${escapeHtml(rw.name)}</p>
      <p class="rw-tooltip__type">Unique · ${escapeHtml(slotsText)}</p>
      <div class="rw-tooltip__divider" aria-hidden="true"></div>
      ${rw.power ? `<p class="rw-tooltip__power"><strong>Efekt:</strong> ${formatStatLine(rw.power)}</p>` : ""}
      ${rw.inherent ? `<p class="rw-tooltip__inherent"><strong>Vrozené:</strong> ${formatStatLine(rw.inherent)}</p>` : ""}
      <ul class="rw-tooltip__stats">
        ${rw.stats.map((stat) => `<li>${formatStatLine(stat)}</li>`).join("")}
      </ul>
      <p class="rw-tooltip__footer">Recept: ${rw.runes.map((r) => escapeHtml(r)).join(" + ")}</p>
    </div>
  `;

  const copyBtn = article.querySelector(".rw-card__copy");
  copyBtn.addEventListener("click", () => {
    const text = copyBtn.dataset.copy;
    const done = () => {
      const original = copyBtn.textContent;
      copyBtn.textContent = "Zkopírováno ✓";
      copyBtn.classList.add("is-copied");
      setTimeout(() => {
        copyBtn.textContent = original;
        copyBtn.classList.remove("is-copied");
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  });

  return article;
}

function buildRuneUpgrades(container) {
  container.innerHTML = "";
  RUNE_UPGRADES.forEach((u) => {
    const row = document.createElement("div");
    row.className = "rw-upgrade-row";
    const gemHtml = u.extra
      ? `<span class="rw-upgrade-row__plus" aria-hidden="true">+</span>
         <span class="rw-upgrade-row__gem" title="${escapeHtml(u.extra.name)}">${gemIconImg(u.extra.icon, u.extra.name, "rw-upgrade-row__gem-icon")}<span class="rw-upgrade-row__gem-name">${escapeHtml(u.extra.name)}</span></span>`
      : "";
    row.innerHTML = `
      <span class="rw-upgrade-row__from">
        ${runeIconImg(u.from, "rw-upgrade-row__icon")}
        <span class="rw-upgrade-row__count">×${u.count}</span>
        <span class="rw-upgrade-row__name">${escapeHtml(u.from)}</span>
      </span>
      ${gemHtml}
      <span class="rw-upgrade-row__arrow" aria-hidden="true">→</span>
      <span class="rw-upgrade-row__to">
        ${runeIconImg(u.to, "rw-upgrade-row__icon")}
        <span class="rw-upgrade-row__name">${escapeHtml(u.to)}</span>
      </span>
    `;
    container.appendChild(row);
  });
}

function buildOtherRecipes(container) {
  container.innerHTML = "";
  OTHER_RECIPES.forEach((r) => {
    const row = document.createElement("div");
    row.className = "rw-other-recipe";
    row.innerHTML = `
      <span class="rw-other-recipe__inputs">${r.inputs.map((i) => escapeHtml(i)).join(" + ")}</span>
      <span class="rw-other-recipe__arrow" aria-hidden="true">→</span>
      <span class="rw-other-recipe__result">${escapeHtml(r.result)}</span>
    `;
    container.appendChild(row);
  });
}

function initRunewordsHub() {
  const list = document.getElementById("rw-list");
  const legend = document.getElementById("rune-legend");
  const ownedReset = document.getElementById("rw-owned-reset");
  const search = document.getElementById("rw-search");
  const itemType = document.getElementById("rw-itemtype");
  const socketFilters = document.getElementById("rw-sockets");
  const resetBtn = document.getElementById("rw-reset");
  const count = document.getElementById("rw-count");
  const tabs = document.getElementById("rw-tabs");
  const countAll = document.getElementById("rw-count-all");
  const countReady = document.getElementById("rw-count-ready");
  const countShort = document.getElementById("rw-count-short");
  const upgrades = document.getElementById("rw-upgrades");
  const otherRecipes = document.getElementById("rw-other-recipes");

  if (upgrades) {
    buildRuneUpgrades(upgrades);
  }
  if (otherRecipes) {
    buildOtherRecipes(otherRecipes);
  }

  if (!list || !legend) {
    return;
  }

  const owned = loadOwnedRunes();

  const state = {
    query: "",
    slot: "",
    sockets: null,
    tab: "all"
  };

  function rerenderCards() {
    list.innerHTML = "";
    RUNEWORDS.forEach((rw) => list.appendChild(renderCard(rw, owned)));
  }

  rerenderCards();
  buildLegend(legend, owned, (rune, btn) => {
    if (owned.has(rune)) {
      owned.delete(rune);
      btn.setAttribute("aria-pressed", "false");
    } else {
      owned.add(rune);
      btn.setAttribute("aria-pressed", "true");
    }
    saveOwnedRunes(owned);
    rerenderCards();
    applyFilters();
  });
  buildItemTypeOptions(itemType);
  buildSocketFilters(socketFilters, (sockets) => {
    state.sockets = sockets;
    applyFilters();
  });

  if (ownedReset) {
    ownedReset.addEventListener("click", () => {
      owned.clear();
      saveOwnedRunes(owned);
      legend.querySelectorAll(".rw-legend__item").forEach((el) => el.setAttribute("aria-pressed", "false"));
      rerenderCards();
      applyFilters();
    });
  }

  function applyFilters() {
    let visible = 0;
    let readyTotal = 0;
    let shortTotal = 0;

    list.querySelectorAll(".rw-card").forEach((card) => {
      const rw = RUNEWORDS.find((r) => r.id === card.dataset.id);
      const status = readinessStatus(rw, owned);
      if (status === "ready") {
        readyTotal += 1;
      } else if (status === "short") {
        shortTotal += 1;
      }

      const matchesQuery = !state.query || card.dataset.search.includes(state.query);
      const matchesSlot = !state.slot || card.dataset.slots.split(",").includes(state.slot);
      const matchesSockets = !state.sockets || card.dataset.runes.split(",").length === state.sockets;
      const matchesTab = state.tab === "all" || status === state.tab;
      const show = matchesQuery && matchesSlot && matchesSockets && matchesTab;
      card.classList.toggle("is-hidden", !show);
      if (show) {
        visible += 1;
      }
    });

    count.textContent = `Zobrazeno ${visible} z ${RUNEWORDS.length} runewords`;
    if (countAll) {
      countAll.textContent = String(RUNEWORDS.length);
    }
    if (countReady) {
      countReady.textContent = String(readyTotal);
    }
    if (countShort) {
      countShort.textContent = String(shortTotal);
    }
  }

  search.addEventListener("input", () => {
    state.query = search.value.trim().toLowerCase();
    applyFilters();
  });

  itemType.addEventListener("change", () => {
    state.slot = itemType.value;
    applyFilters();
  });

  if (tabs) {
    tabs.addEventListener("click", (event) => {
      const btn = event.target.closest(".rw-tabs__btn");
      if (!btn) {
        return;
      }
      tabs.querySelectorAll(".rw-tabs__btn").forEach((el) => el.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      state.tab = btn.dataset.tab;
      applyFilters();
    });
  }

  resetBtn.addEventListener("click", () => {
    state.query = "";
    state.slot = "";
    state.sockets = null;
    state.tab = "all";
    search.value = "";
    itemType.value = "";
    socketFilters.querySelectorAll(".rw-chip-filter").forEach((el) => el.setAttribute("aria-pressed", "false"));
    if (tabs) {
      tabs.querySelectorAll(".rw-tabs__btn").forEach((el) => el.setAttribute("aria-pressed", el.dataset.tab === "all" ? "true" : "false"));
    }
    applyFilters();
  });

  applyFilters();
}

function initJournalAudio() {
  const audio = document.getElementById("rw-journal-audio");
  const btn = document.getElementById("rw-journal-audio-btn");
  if (!audio || !btn) {
    return;
  }
  const icon = btn.querySelector(".rw-audio-player__icon");
  const text = btn.querySelector(".rw-audio-player__text");

  const setPlaying = (isPlaying) => {
    btn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    icon.textContent = isPlaying ? "⏸" : "▶";
    text.textContent = isPlaying ? "Pozastavit" : "Přehrát namluvený deník";
  };

  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("ended", () => setPlaying(false));
}

window.addEventListener("DOMContentLoaded", initRunewordsHub);
window.addEventListener("DOMContentLoaded", initJournalAudio);

function initQuestNav() {
  const links = document.querySelectorAll(".rw-quest-nav__list a");
  if (!links.length) {
    return;
  }

  const sections = Array.from(links)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  function setActive(id) {
    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    }, {
      rootMargin: "-20% 0px -60% 0px"
    });

    sections.forEach((section) => observer.observe(section));
  }
}

window.addEventListener("DOMContentLoaded", initQuestNav);
