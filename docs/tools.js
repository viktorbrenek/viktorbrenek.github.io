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

  rangeInt(min, max) {
    return min + Math.floor(this.value() * (max - min));
  }
}

const HERALDIC_COLORS = [
  "#c1121f",
  "#003049",
  "#1a1a1a",
  "#ffffff",
  "#d8a247",
  "#386641",
  "#590d22",
  "#3a3a3a",
  "#e0e0e0",
  "#3e1f47"
];

const SHAPES = ["heater", "kite", "round", "banner"];
const PATTERNS = ["solid", "per-pale", "per-fess", "quarterly", "chevron"];
const SYMBOLS = [
  "none", "skull", "sword", "axe", "eye", "crown", "gear", "anvil",
  "tree", "moon", "sun", "star", "lightning", "crystal", "tower",
  "fire", "drop", "chalice", "serpent", "raven", "spider", "anchor", "key"
];

function adjustColor(color, amount) {
  return `#${color.replace(/^#/, "").replace(/../g, (part) => {
    const value = Math.min(255, Math.max(0, parseInt(part, 16) + amount));
    return `0${value.toString(16)}`.slice(-2);
  })}`;
}

function drawSymbol(ctx, type, color) {
  ctx.save();
  ctx.translate(128, 128);
  ctx.scale(0.8, 0.8);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();

  if (type === "skull") {
    ctx.arc(0, -20, 45, Math.PI, 0);
    ctx.lineTo(30, 40);
    ctx.lineTo(-30, 40);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(-18, -10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(18, -10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-6, 20);
    ctx.lineTo(6, 20);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else if (type === "sword") {
    ctx.moveTo(-20, 60);
    ctx.lineTo(20, 60);
    ctx.moveTo(0, 60);
    ctx.lineTo(0, 90);
    ctx.arc(0, 95, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, 60);
    ctx.lineTo(-6, -30);
    ctx.lineTo(0, -10);
    ctx.lineTo(8, -40);
    ctx.lineTo(10, 60);
    ctx.fill();
  } else if (type === "axe") {
    ctx.moveTo(-10, -50);
    ctx.lineTo(-10, 60);
    ctx.lineTo(10, 60);
    ctx.lineTo(10, -50);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -30);
    ctx.lineTo(40, -40);
    ctx.quadraticCurveTo(60, -10, 40, 20);
    ctx.lineTo(10, 10);
    ctx.fill();
  } else if (type === "eye") {
    ctx.moveTo(-60, 0);
    ctx.quadraticCurveTo(0, -60, 60, 0);
    ctx.quadraticCurveTo(0, 60, -60, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "crown") {
    ctx.moveTo(-50, 40);
    ctx.lineTo(50, 40);
    ctx.lineTo(60, -30);
    ctx.lineTo(25, 10);
    ctx.lineTo(0, -50);
    ctx.lineTo(-25, 10);
    ctx.lineTo(-60, -30);
    ctx.closePath();
    ctx.fill();
  } else if (type === "gear") {
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.lineWidth = 15;
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.moveTo(Math.cos(angle) * 40, Math.sin(angle) * 40);
      ctx.lineTo(Math.cos(angle) * 60, Math.sin(angle) * 60);
    }
    ctx.stroke();
  } else if (type === "anvil") {
    ctx.moveTo(-30, 50);
    ctx.lineTo(30, 50);
    ctx.lineTo(15, 20);
    ctx.lineTo(25, -10);
    ctx.lineTo(40, -10);
    ctx.lineTo(40, -30);
    ctx.lineTo(-40, -30);
    ctx.lineTo(-40, -10);
    ctx.lineTo(-15, 20);
    ctx.closePath();
    ctx.fill();
  } else if (type === "tree") {
    ctx.lineWidth = 8;
    ctx.moveTo(0, 60);
    ctx.lineTo(0, -10);
    ctx.moveTo(0, 20);
    ctx.quadraticCurveTo(-30, 0, -35, -30);
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(30, -10, 35, -40);
    ctx.moveTo(0, -10);
    ctx.lineTo(-15, -50);
    ctx.moveTo(0, -10);
    ctx.lineTo(15, -50);
    ctx.stroke();
  } else if (type === "moon") {
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(15, -15, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else if (type === "sun") {
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 35, Math.sin(angle) * 35);
      ctx.lineTo(Math.cos(angle) * 55, Math.sin(angle) * 55);
      ctx.stroke();
    }
  } else if (type === "star") {
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? 55 : 20;
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();
  } else if (type === "lightning") {
    ctx.moveTo(10, -50);
    ctx.lineTo(-20, 10);
    ctx.lineTo(10, 10);
    ctx.lineTo(-10, 60);
    ctx.lineTo(20, 0);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
  } else if (type === "crystal") {
    ctx.moveTo(0, -50);
    ctx.lineTo(30, 0);
    ctx.lineTo(0, 60);
    ctx.lineTo(-30, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(0, 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
  } else if (type === "tower") {
    ctx.moveTo(-30, 60);
    ctx.lineTo(30, 60);
    ctx.lineTo(25, -30);
    ctx.lineTo(-25, -30);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.rect(-30, -50, 15, 20);
    ctx.rect(-7.5, -50, 15, 20);
    ctx.rect(15, -50, 15, 20);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(0, 35, 12, Math.PI, 0);
    ctx.lineTo(12, 60);
    ctx.lineTo(-12, 60);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else if (type === "fire") {
    ctx.moveTo(0, -50);
    ctx.quadraticCurveTo(30, -10, 25, 20);
    ctx.quadraticCurveTo(20, 50, 0, 50);
    ctx.quadraticCurveTo(-20, 50, -25, 20);
    ctx.quadraticCurveTo(-30, -10, 0, -50);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(15, 15, 10, 35);
    ctx.quadraticCurveTo(5, 50, 0, 50);
    ctx.quadraticCurveTo(-5, 50, -10, 35);
    ctx.quadraticCurveTo(-15, 15, 0, -10);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else if (type === "drop") {
    ctx.moveTo(0, -40);
    ctx.bezierCurveTo(40, 10, 40, 50, 0, 50);
    ctx.bezierCurveTo(-40, 50, -40, 10, 0, -40);
    ctx.fill();
  } else if (type === "chalice") {
    ctx.moveTo(-25, 50);
    ctx.lineTo(25, 50);
    ctx.lineTo(10, 40);
    ctx.lineTo(5, 10);
    ctx.lineTo(30, -30);
    ctx.lineTo(-30, -30);
    ctx.lineTo(-5, 10);
    ctx.lineTo(-10, 40);
    ctx.closePath();
    ctx.fill();
  } else if (type === "serpent") {
    ctx.moveTo(0, -40);
    ctx.bezierCurveTo(40, -40, 40, 0, 0, 0);
    ctx.bezierCurveTo(-40, 0, -40, 40, 0, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -40, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "raven") {
    ctx.moveTo(0, 20);
    ctx.lineTo(10, -10);
    ctx.lineTo(50, -30);
    ctx.quadraticCurveTo(20, -10, 0, -30);
    ctx.quadraticCurveTo(-20, -10, -50, -30);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fill();
  } else if (type === "spider") {
    ctx.arc(0, 10, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 5;
    const legs = [
      [0, -10, 30, -30, 40, -10],
      [0, -5, 35, -5, 45, 15],
      [0, 0, 30, 20, 40, 40],
      [0, 5, 20, 35, 25, 55],
      [0, -10, -30, -30, -40, -10],
      [0, -5, -35, -5, -45, 15],
      [0, 0, -30, 20, -40, 40],
      [0, 5, -20, 35, -25, 55]
    ];
    legs.forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();
    });
  } else if (type === "anchor") {
    ctx.arc(0, -40, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(0, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.lineTo(20, -10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 20, 30, 0, Math.PI);
    ctx.stroke();
  } else if (type === "key") {
    ctx.arc(0, -30, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 50);
    ctx.moveTo(0, 30);
    ctx.lineTo(20, 30);
    ctx.moveTo(0, 45);
    ctx.lineTo(20, 45);
    ctx.stroke();
  }

  ctx.restore();
}

function initCrestForge() {
  const canvas = document.getElementById("icon-canvas");
  const ctx = canvas?.getContext("2d");
  const autoSeedCheckbox = document.getElementById("auto-seed");
  const nameInput = document.getElementById("crest-name");
  const manualInputs = document.querySelectorAll(".manual-input");

  if (!canvas || !ctx || !autoSeedCheckbox || !nameInput) {
    return;
  }

  function syncUIWithHash() {
    const rng = new CustomRandom(getSharedHash(nameInput.value || "Unknown"));
    document.getElementById("crest-shape").value = SHAPES[rng.rangeInt(0, SHAPES.length)];
    document.getElementById("crest-pattern").value = PATTERNS[rng.rangeInt(0, PATTERNS.length)];
    document.getElementById("color-primary").value = HERALDIC_COLORS[rng.rangeInt(0, HERALDIC_COLORS.length)];
    document.getElementById("color-secondary").value = HERALDIC_COLORS[rng.rangeInt(0, HERALDIC_COLORS.length)];
    document.getElementById("crest-symbol").value = SYMBOLS[rng.rangeInt(0, SYMBOLS.length)];
    document.getElementById("color-symbol").value = HERALDIC_COLORS[rng.rangeInt(0, HERALDIC_COLORS.length)];
    document.getElementById("color-border").value = HERALDIC_COLORS[rng.rangeInt(0, HERALDIC_COLORS.length)];
    document.getElementById("show-border").checked = rng.value() > 0.18;
    document.getElementById("crest-roughness").value = rng.rangeInt(10, 80);
  }

  function drawShieldShape(shape) {
    ctx.beginPath();
    if (shape === "heater") {
      ctx.moveTo(50, 40);
      ctx.lineTo(206, 40);
      ctx.bezierCurveTo(206, 140, 160, 220, 128, 240);
      ctx.bezierCurveTo(96, 220, 50, 140, 50, 40);
    } else if (shape === "kite") {
      ctx.moveTo(128, 20);
      ctx.lineTo(200, 60);
      ctx.lineTo(180, 160);
      ctx.lineTo(128, 240);
      ctx.lineTo(76, 160);
      ctx.lineTo(56, 60);
    } else if (shape === "round") {
      ctx.arc(128, 128, 100, 0, Math.PI * 2);
    } else {
      ctx.moveTo(60, 20);
      ctx.lineTo(196, 20);
      ctx.lineTo(196, 230);
      ctx.lineTo(128, 190);
      ctx.lineTo(60, 230);
    }
    ctx.closePath();
  }

  function generateCrest() {
    const name = nameInput.value || "Unknown";
    const shape = document.getElementById("crest-shape").value;
    const pattern = document.getElementById("crest-pattern").value;
    const color1 = document.getElementById("color-primary").value;
    const color2 = document.getElementById("color-secondary").value;
    const symbol = document.getElementById("crest-symbol").value;
    const colorSymbol = document.getElementById("color-symbol").value;
    const colorBorder = document.getElementById("color-border").value;
    const showBorder = document.getElementById("show-border").checked;
    const roughness = Number.parseInt(document.getElementById("crest-roughness").value, 10);
    const rng = new CustomRandom(getSharedHash(name));

    ctx.clearRect(0, 0, 256, 256);
    drawShieldShape(shape);
    ctx.save();
    ctx.clip();

    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = color2;
    ctx.beginPath();
    if (pattern === "per-pale") {
      ctx.rect(128, 0, 128, 256);
    } else if (pattern === "per-fess") {
      ctx.rect(0, 128, 256, 128);
    } else if (pattern === "quarterly") {
      ctx.rect(128, 0, 128, 128);
      ctx.rect(0, 128, 128, 128);
    } else if (pattern === "chevron") {
      ctx.moveTo(0, 256);
      ctx.lineTo(128, 100);
      ctx.lineTo(256, 256);
      ctx.lineTo(256, 180);
      ctx.lineTo(128, 20);
      ctx.lineTo(0, 180);
    }
    if (pattern !== "solid") {
      ctx.fill();
    }

    const gloss = ctx.createLinearGradient(0, 0, 256, 256);
    gloss.addColorStop(0, "rgba(255, 255, 255, 0.18)");
    gloss.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    gloss.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, 256, 256);

    if (symbol !== "none") {
      drawSymbol(ctx, symbol, colorSymbol);
    }

    if (roughness > 0) {
      ctx.globalCompositeOperation = "source-atop";
      const dots = roughness * 100;
      for (let i = 0; i < dots; i += 1) {
        ctx.fillStyle = rng.value() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.12)";
        ctx.fillRect(rng.rangeInt(0, 256), rng.rangeInt(0, 256), rng.rangeInt(1, 3), rng.rangeInt(1, 3));
      }
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 1;
      const scratches = roughness / 5;
      for (let i = 0; i < scratches; i += 1) {
        const startX = rng.rangeInt(20, 230);
        const startY = rng.rangeInt(20, 230);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + rng.rangeInt(-30, 30), startY + rng.rangeInt(-30, 30));
        ctx.stroke();
      }
    }

    ctx.restore();
    if (showBorder) {
      drawShieldShape(shape);
      ctx.lineWidth = 12;
      const borderGradient = ctx.createLinearGradient(0, 0, 256, 256);
      borderGradient.addColorStop(0, adjustColor(colorBorder, 40));
      borderGradient.addColorStop(0.5, colorBorder);
      borderGradient.addColorStop(1, adjustColor(colorBorder, -40));
      ctx.strokeStyle = borderGradient;
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      ctx.stroke();
    }
  }

  nameInput.addEventListener("input", () => {
    if (autoSeedCheckbox.checked) {
      syncUIWithHash();
    }
    generateCrest();
  });

  manualInputs.forEach((input) => {
    input.addEventListener("input", () => {
      autoSeedCheckbox.checked = false;
      generateCrest();
    });
  });

  autoSeedCheckbox.addEventListener("change", () => {
    if (autoSeedCheckbox.checked) {
      syncUIWithHash();
      generateCrest();
    }
  });

  document.getElementById("btn-generate").addEventListener("click", generateCrest);
  document.getElementById("btn-download").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `crest_${(nameInput.value || "erb").replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  syncUIWithHash();
  generateCrest();
}

window.addEventListener("DOMContentLoaded", () => {
  initCrestForge();
  initWaystoneForge();
});

function initWaystoneForge() {
  const canvas = document.getElementById("stone-canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) {
    return;
  }

  function smoothNoise(x, y, seed) {
    let value = Math.sin(x * 0.05 + seed) * Math.cos(y * 0.05 + seed);
    value += Math.sin(x * 0.02 - y * 0.03) * 0.5;
    return value;
  }

  function drawCracks(rng, edgePoints) {
    const numCracks = rng.rangeInt(2, 4);
    for (let i = 0; i < numCracks; i += 1) {
      const startIndex = rng.rangeInt(0, edgePoints.length);
      let currentX = edgePoints[startIndex].x;
      let currentY = edgePoints[startIndex].y;
      const steps = rng.rangeInt(3, 5);
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      for (let step = 0; step < steps; step += 1) {
        currentX += (128 - currentX) * 0.2 + rng.rangeInt(-15, 16);
        currentY += (128 - currentY) * 0.2 + rng.rangeInt(-15, 16);
        ctx.lineTo(currentX, currentY);
      }
      ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawRune(rng, style, colorHex, thicknessMultiplier) {
    const runeGrid = [
      { x: 90, y: 80 }, { x: 128, y: 80 }, { x: 166, y: 80 },
      { x: 90, y: 128 }, { x: 128, y: 128 }, { x: 166, y: 128 },
      { x: 90, y: 176 }, { x: 128, y: 176 }, { x: 166, y: 176 }
    ];
    const linesToDraw = rng.rangeInt(4, 7);
    const path = [runeGrid[rng.rangeInt(0, 9)]];
    for (let i = 0; i < linesToDraw; i += 1) {
      path.push(runeGrid[rng.rangeInt(0, 9)]);
    }

    function tracePath() {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i += 1) {
        const previous = path[i - 1];
        const current = path[i];
        if (style === "organic" || style === "waves") {
          const curvePower = style === "waves" ? 0.6 : 0.3;
          const cpX = previous.x + (current.x - previous.x) * 0.5 - (current.y - previous.y) * curvePower;
          const cpY = previous.y + (current.y - previous.y) * 0.5 + (current.x - previous.x) * curvePower;
          ctx.quadraticCurveTo(cpX, cpY, current.x, current.y);
        } else if (style === "circuit") {
          ctx.lineTo(current.x, previous.y);
          ctx.lineTo(current.x, current.y);
        } else if (style === "constellation") {
          ctx.arc(current.x, current.y, 3 * thicknessMultiplier, 0, Math.PI * 2);
          ctx.moveTo(current.x, current.y);
          ctx.lineTo(previous.x, previous.y);
        } else {
          ctx.lineTo(current.x, current.y);
        }
      }
    }

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.translate(0, 2);
    ctx.lineWidth = 12 * thicknessMultiplier;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    tracePath();
    ctx.stroke();
    ctx.translate(0, -2);
    ctx.lineWidth = 12 * thicknessMultiplier;
    ctx.strokeStyle = "#0a0908";
    tracePath();
    ctx.stroke();
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 15;
    ctx.lineWidth = 6 * thicknessMultiplier;
    ctx.strokeStyle = colorHex;
    ctx.globalAlpha = 0.8;
    tracePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2 * thicknessMultiplier;
    ctx.strokeStyle = "#ffffff";
    ctx.shadowBlur = 8;
    tracePath();
    ctx.stroke();
    ctx.restore();
  }

  function generateStone() {
    const name = document.getElementById("stone-name").value || "Unknown";
    const shape = document.getElementById("stone-shape").value;
    const runeStyle = document.getElementById("rune-style").value;
    const runeColor = document.getElementById("rune-color").value;
    const runeThickness = Number.parseFloat(document.getElementById("rune-thickness").value);
    const stoneRoughness = Number.parseInt(document.getElementById("stone-roughness").value, 10);
    const hasRitualBorder = document.getElementById("ritual-border").checked;

    const seed = getSharedHash(name);
    const rng = new CustomRandom(seed);
    ctx.clearRect(0, 0, 256, 256);

    let basePoints = [];
    const isPerfectCircle = shape === "circle";

    if (shape === "stone") {
      basePoints = [
        { x: 128, y: 30 }, { x: 210, y: 90 }, { x: 180, y: 210 },
        { x: 128, y: 230 }, { x: 76, y: 210 }, { x: 46, y: 90 }
      ];
    } else if (shape === "medallion" || isPerfectCircle) {
      const points = isPerfectCircle ? 32 : 12;
      for (let i = 0; i < points; i += 1) {
        const angle = (i / points) * Math.PI * 2;
        basePoints.push({ x: 128 + Math.cos(angle) * 95, y: 128 + Math.sin(angle) * 95 });
      }
    } else if (shape === "square") {
      basePoints = [{ x: 50, y: 50 }, { x: 206, y: 50 }, { x: 206, y: 206 }, { x: 50, y: 206 }];
    } else {
      basePoints = [{ x: 128, y: 30 }, { x: 220, y: 128 }, { x: 128, y: 226 }, { x: 36, y: 128 }];
    }

    const jaggedPoints = [];
    const segments = isPerfectCircle ? 1 : 12;
    for (let i = 0; i < basePoints.length; i += 1) {
      const current = basePoints[i];
      const next = basePoints[(i + 1) % basePoints.length];
      for (let segment = 0; segment < segments; segment += 1) {
        const t = segment / segments;
        let x = current.x + (next.x - current.x) * t;
        let y = current.y + (next.y - current.y) * t;
        if (!isPerfectCircle) {
          const displacement = smoothNoise(x, y, seed) * 12;
          const angleFromCenter = Math.atan2(y - 128, x - 128);
          x += Math.cos(angleFromCenter) * displacement;
          y += Math.sin(angleFromCenter) * displacement;
        }
        jaggedPoints.push({ x, y });
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(jaggedPoints[0].x, jaggedPoints[0].y);
    jaggedPoints.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();

    const stoneGradient = ctx.createRadialGradient(100, 80, 20, 128, 128, 120);
    stoneGradient.addColorStop(0, "#66605a");
    stoneGradient.addColorStop(0.6, "#383330");
    stoneGradient.addColorStop(1, "#151412");
    ctx.fillStyle = stoneGradient;
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.clip();

    ctx.beginPath();
    ctx.moveTo(128, 128);
    const facetEndIndex = Math.floor(jaggedPoints.length * 0.45);
    for (let i = 0; i <= facetEndIndex; i += 1) {
      ctx.lineTo(jaggedPoints[i].x, jaggedPoints[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();

    if (shape === "stone" || shape === "medallion" || shape === "rhombus") {
      drawCracks(rng, jaggedPoints);
    }

    ctx.globalCompositeOperation = "overlay";
    const dots = stoneRoughness * 80;
    for (let i = 0; i < dots; i += 1) {
      ctx.fillStyle = rng.value() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)";
      ctx.fillRect(rng.rangeInt(20, 236), rng.rangeInt(20, 236), 2, 2);
    }
    ctx.globalCompositeOperation = "source-over";

    if (hasRitualBorder) {
      ctx.save();
      ctx.translate(128, 128);
      [0.86, 0.83].forEach((scale) => {
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-128, -128);
        ctx.beginPath();
        ctx.moveTo(jaggedPoints[0].x, jaggedPoints[0].y);
        jaggedPoints.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.lineWidth = scale > 0.84 ? 1.5 : 0.8;
        ctx.strokeStyle = runeColor;
        ctx.globalAlpha = scale > 0.84 ? 0.4 : 0.2;
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
    }

    ctx.restore();
    drawRune(rng, runeStyle, runeColor, runeThickness);
  }

  [
    "stone-name",
    "stone-shape",
    "rune-style",
    "rune-color",
    "ritual-border",
    "rune-thickness",
    "stone-roughness"
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", generateStone);
  });

  document.getElementById("btn-generate-stone")?.addEventListener("click", generateStone);
  document.getElementById("btn-download-stone")?.addEventListener("click", () => {
    const name = document.getElementById("stone-name").value || "waystone";
    const link = document.createElement("a");
    link.download = `waystone_${name.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  window.setTimeout(generateStone, 100);
}
