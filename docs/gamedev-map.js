import FastNoiseLite from "https://cdn.jsdelivr.net/npm/fastnoise-lite@1.1.0/FastNoiseLite.js";

const f32 = Math.fround;
const COLORS = {
  waterDeep: [175, 160, 130, 255],
  waterShallow: [195, 180, 150, 255],
  beach: [210, 198, 170, 255],
  peaks: [50, 40, 30, 255],
  mountain: [85, 70, 50, 255],
  forest: [130, 120, 80, 255],
  plains: [190, 178, 148, 255]
};

let rng;
let noise;
let seedOffsetX = 0;
let seedOffsetY = 0;
let nodeIdCounter = 0;
let requiredWaystones = [];

const nodes = [];
const edges = [];
const activeTips = [];

function getSharedHash(str) {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0;
}

class CustomRandom {
  constructor(seed) {
    this.state = seed >>> 0;
  }

  value() {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  rangeFloat(min, max) {
    return min + this.value() * (max - min);
  }

  rangeInt(min, max) {
    return min + Math.floor(this.value() * (max - min));
  }
}

function getJsonPath(file) {
  const isArticle =
    document.body.dataset.page === "article" ||
    window.location.pathname.includes("/articles/");
  return `${isArticle ? "../" : ""}${file}`;
}

function fbm(x, y, octaves, extraOffset, width, height) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 0.004;

  for (let i = 0; i < octaves; i += 1) {
    const nx = f32(f32(x * frequency) + seedOffsetX + extraOffset);
    const ny = f32(f32(y * frequency) + seedOffsetY + extraOffset);
    value += amplitude * noise.GetNoise(nx, ny);
    frequency *= 2;
    amplitude *= 0.5;
  }

  return value;
}

function getBiome(e, m) {
  if (e < -0.15) {
    return { color: COLORS.waterDeep, type: "water" };
  }
  if (e < 0.0) {
    return { color: COLORS.waterShallow, type: "water" };
  }
  if (e < 0.08) {
    return { color: COLORS.beach, type: "beach" };
  }
  if (e > 0.55) {
    if (e > 0.75) {
      return { color: COLORS.peaks, type: "mountain" };
    }
    return { color: COLORS.mountain, type: "mountain" };
  }
  if (m > 0.2) {
    return { color: COLORS.forest, type: "forest" };
  }
  return { color: COLORS.plains, type: "plains" };
}

function getTerrainAt(x, y, width, height) {
  let e = fbm(x, y, 6, 0, width, height);
  const m = fbm(x, y, 4, 5000, width, height);
  const dx = (x / width) * 2 - 1;
  const dy = (y / height) * 2 - 1;
  const dist = Math.max(Math.abs(dx), Math.abs(dy));
  e -= dist * dist * 0.6;
  return getBiome(e, m);
}

function tryGrow(parent, width, height) {
  const numCandidates = 8;
  let bestPos = null;
  let bestBiome = null;
  let bestScore = -9999;

  for (let i = 0; i < numCandidates; i += 1) {
    let angle = rng.rangeFloat(0, Math.PI * 2);
    if (!parent.isHub) {
      const dirX = parent.x - width / 2;
      const dirY = parent.y - height / 2;
      const baseAngle = Math.atan2(dirY, dirX);
      angle = baseAngle + rng.rangeFloat(-Math.PI * 0.6, Math.PI * 0.6);
    }

    const distance = rng.rangeFloat(35, 65);
    const nx = f32(parent.x + f32(Math.cos(angle)) * distance);
    const ny = f32(parent.y + f32(Math.sin(angle)) * distance);

    if (nx < 40 || nx > width - 40 || ny < 40 || ny > height - 40) {
      continue;
    }

    const biomeInfo = getTerrainAt(nx, ny, width, height);
    let score = rng.value() * 10;

    if (biomeInfo.type === "water") {
      score -= rng.value() > 0.9 ? 50 : 1000;
    } else {
      score += 100;
      if (biomeInfo.type === "plains") {
        score += 20;
      }
    }

    let tooClose = false;
    for (const node of nodes) {
      const dx = node.x - nx;
      const dy = node.y - ny;
      if (dx * dx + dy * dy < 30 * 30) {
        tooClose = true;
        break;
      }
    }

    if (tooClose) {
      score -= 1000;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPos = { x: nx, y: ny };
      bestBiome = biomeInfo;
    }
  }

  if (bestPos && bestScore > -500) {
    return { x: bestPos.x, y: bestPos.y, isHub: false, biome: bestBiome };
  }

  return null;
}

function buildNetwork(width, height) {
  nodes.length = 0;
  edges.length = 0;
  activeTips.length = 0;
  nodeIdCounter = 0;

  const targetNodeCount = requiredWaystones.length;
  if (targetNodeCount <= 0) {
    return;
  }

  const hub = {
    id: nodeIdCounter++,
    waystoneIndex: 0,
    x: width / 2,
    y: height / 2,
    isHub: true,
    biome: getTerrainAt(width / 2, height / 2, width, height)
  };

  nodes.push(hub);
  activeTips.push(hub);

  let safetyNet = 0;
  while (nodes.length < targetNodeCount && safetyNet < 1000) {
    safetyNet += 1;

    if (activeTips.length === 0) {
      activeTips.push(nodes[rng.rangeInt(0, nodes.length)]);
    }

    const parentIndex = rng.rangeInt(0, activeTips.length);
    const parent = activeTips[parentIndex];
    const child = tryGrow(parent, width, height);

    if (child) {
      child.id = nodeIdCounter++;
      child.waystoneIndex = nodes.length;
      nodes.push(child);
      edges.push({ from: parent, to: child });
      activeTips.push(child);

      const connections = edges.filter((edge) => edge.from === parent || edge.to === parent).length;
      if (connections >= 3) {
        activeTips.splice(parentIndex, 1);
      }
    } else {
      activeTips.splice(parentIndex, 1);
    }
  }
}

function openGrimoire(title, desc, color) {
  const widget = document.getElementById("info-widget");
  const titleEl = document.getElementById("w-title");
  const descEl = document.getElementById("w-desc");
  const statusEl = document.getElementById("w-status");

  if (!widget || !titleEl || !descEl || !statusEl) {
    return;
  }

  titleEl.textContent = title;
  titleEl.style.color = color;
  descEl.textContent = desc;
  statusEl.textContent = "Svitek otevřen";
  widget.classList.remove("hidden");
}

function closeGrimoire() {
  const widget = document.getElementById("info-widget");
  const statusEl = document.getElementById("w-status");
  if (statusEl) {
    statusEl.textContent = "Spojení navázáno";
  }
  if (widget) {
    widget.classList.add("hidden");
  }
}

function renderNodes(width, height) {
  const poiLayer = document.getElementById("poi-layer");
  if (!poiLayer) {
    return;
  }

  poiLayer.innerHTML = "";
  nodes.sort((a, b) => a.waystoneIndex - b.waystoneIndex);

  nodes.forEach((node) => {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `node-marker${node.isHub ? " hub" : ""}`;
    marker.style.left = `${(node.x / width) * 100}%`;
    marker.style.top = `${100 - (node.y / height) * 100}%`;

    const item = requiredWaystones[node.waystoneIndex];
    const title = item?.name || "Neznámá lokace";
    const desc = item?.desc || "Pustá část Oparu bez dalších informací.";

    marker.setAttribute("aria-label", title);
    marker.addEventListener("click", () => {
      openGrimoire(title, desc, node.isHub ? "#d8a247" : "#00ff9d");
    });

    poiLayer.appendChild(marker);
  });
}

function renderPaths(width, height) {
  const pathLayer = document.getElementById("path-layer");
  if (!pathLayer) {
    return;
  }

  pathLayer.innerHTML = "";
  edges.forEach((edge) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", edge.from.x);
    line.setAttribute("y1", height - edge.from.y);
    line.setAttribute("x2", edge.to.x);
    line.setAttribute("y2", height - edge.to.y);
    line.setAttribute("stroke", "rgba(255, 255, 255, 0.58)");
    line.setAttribute("stroke-width", "1.5");
    pathLayer.appendChild(line);
  });
}

function renderTerrain(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let e = fbm(x, y, 6, 0, width, height);
      const m = fbm(x, y, 4, 5000, width, height);
      const dx = (x / width) * 2 - 1;
      const dy = (y / height) * 2 - 1;
      const squareDist = Math.max(Math.abs(dx), Math.abs(dy));
      const circularDist = Math.sqrt(dx * dx + dy * dy);

      e -= squareDist * squareDist * 0.6;

      const biome = getBiome(e, m);
      const grain = (rng.value() - 0.5) * 12.5;
      const renderY = height - 1 - y;
      const index = (renderY * width + x) * 4;

      const r = Math.max(0, Math.min(255, biome.color[0] + grain));
      const g = Math.max(0, Math.min(255, biome.color[1] + grain));
      const b = Math.max(0, Math.min(255, biome.color[2] + grain));
      const vignette = Math.max(0, Math.min(1, 1.3 - circularDist * 1.1));

      data[index] = r * vignette;
      data[index + 1] = g * vignette;
      data[index + 2] = b * vignette;
      data[index + 3] = biome.color[3];
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function updateSyncStatus(text) {
  const el = document.getElementById("map-sync-status");
  if (el) {
    el.textContent = text;
  }
}

function generateMap() {
  const canvas = document.getElementById("world-canvas");
  const characterInput = document.getElementById("character-name");

  if (!canvas || !characterInput || requiredWaystones.length === 0) {
    return;
  }

  const seedName = characterInput.value.trim() || "Unknown";
  const baseSeed = getSharedHash(seedName);
  rng = new CustomRandom(baseSeed);
  noise = new FastNoiseLite(baseSeed);
  noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
  noise.SetFrequency(1);

  seedOffsetX = rng.rangeFloat(1000, 9000);
  seedOffsetY = rng.rangeFloat(1000, 9000);

  renderTerrain(canvas);
  buildNetwork(canvas.width, canvas.height);
  renderPaths(canvas.width, canvas.height);
  renderNodes(canvas.width, canvas.height);
  closeGrimoire();
  updateSyncStatus(`Synchronizováno pro: ${seedName}`);
}

async function loadLocations() {
  const response = await fetch(getJsonPath("world-map-locations.json"), { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load locations: ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Location list is empty.");
  }

  requiredWaystones = data;
}

async function initGamedevMap() {
  const root = document.querySelector("[data-map-root]");
  if (!root) {
    return;
  }

  const generateButton = document.getElementById("btn-generate");
  const closeButton = document.getElementById("map-close-button");
  const characterInput = document.getElementById("character-name");

  try {
    updateSyncStatus("Načítám atlas...");
    await loadLocations();
    generateMap();
  } catch (error) {
    updateSyncStatus("Atlas se nepodařilo načíst");
    openGrimoire(
      "Archiv nenalezen",
      "Lokace mapy se nepodařilo načíst z JSONu. Zkontroluj prosím soubor world-map-locations.json.",
      "#d8a247"
    );
    return;
  }

  generateButton?.addEventListener("click", generateMap);
  closeButton?.addEventListener("click", closeGrimoire);
  characterInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      generateMap();
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initGamedevMap();
});
