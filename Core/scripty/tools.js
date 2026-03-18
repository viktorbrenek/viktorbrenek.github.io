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

  rangeFloat(min, max) {
    return min + this.value() * (max - min);
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
  initAvatarForge();
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

const AVATAR_EASTLANDER_TONES = ["#f2ceb1", "#dfb48d", "#ca8f63", "#b1784f"];
const AVATAR_MAOR_TONES = ["#9f6843", "#875636", "#6d452b", "#573623"];
const AVATAR_HAIR_COLORS = ["#2b1b15", "#4b2318", "#6b3a22", "#8b5a2b", "#d7c1a0", "#5f5f66"];
const AVATAR_EYE_COLORS = ["#4d6a88", "#5a8757", "#8a6f45", "#7d5c92", "#64806a"];
const AVATAR_CLOTH_COLORS = ["#3e4c5f", "#6a3d2a", "#4d5d45", "#5d4158", "#3b3b42", "#655240"];
const AVATAR_ACCENT_COLORS = ["#d8a247", "#77c6a1", "#c36f5d", "#9d7ad6", "#b7d36a"];
const AVATAR_BACKGROUNDS = ["embers", "forest", "dusk", "arcane"];
const AVATAR_MASTER_CANVAS = {
  width: 702,
  height: 704,
  rootX: 0.79375,
  rootY: 0.79375
};
const AVATAR_RENDER_BOXES = {
  default: {
    width: AVATAR_MASTER_CANVAS.width,
    height: AVATAR_MASTER_CANVAS.height,
    paddingX: 24,
    paddingTop: 18,
    paddingBottom: 0,
    offsetXRatio: 0.5
  },
  valrug: {
    width: AVATAR_MASTER_CANVAS.width,
    height: AVATAR_MASTER_CANVAS.height,
    paddingX: 18,
    paddingTop: 14,
    paddingBottom: 0,
    offsetXRatio: 0.5
  }
};
const AVATAR_RACE_OPTIONS = ["eastlander", "maor", "valrug", "robot", "kabadeon"];
const AVATAR_BODY_VARIANTS = ["body", "body2", "body3"];
const AVATAR_VALRUG_TRIBES = {
  westernHive: ["#cf6344", "#b94b3d", "#da7e5f"],
  southernHive: ["#cfbf45", "#b9ad39", "#ddd168"],
  easternHive: ["#8aac47", "#7d9d41", "#a2bc5f"]
};
const AVATAR_KABADEON_TRIBES = {
  green: ["#6f8d3f", "#7ea34d", "#92b15d"],
  purple: ["#7f4da5", "#935cbc", "#a773d2"]
};
const AVATAR_ROBOT_METALS = ["#7a7974", "#8d8176", "#9d9688", "#6d7077"];

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => {
    const clamped = Math.max(0, Math.min(255, Math.round(value)));
    return clamped.toString(16).padStart(2, "0");
  }).join("")}`;
}

function mixHex(colorA, colorB, amount) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount
  });
}

function replaceRgb(svgText, fromRgb, toHex) {
  const expression = new RegExp(`rgb\\(${fromRgb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "g");
  const { r, g, b } = hexToRgb(toHex);
  return svgText.replace(expression, `rgb(${r},${g},${b})`);
}

function extractSvgInnerContent(svgText) {
  return svgText
    .replace(/<\?xml[\s\S]*?\?>/i, "")
    .replace(/<!DOCTYPE[\s\S]*?>/i, "")
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();
}

function getRootTransformOffset(svgText) {
  const match = svgText.match(/<g\s+transform="matrix\(1,0,0,1,([-\d.]+),([-\d.]+)\)"/i);
  if (!match) {
    return { x: AVATAR_MASTER_CANVAS.rootX, y: AVATAR_MASTER_CANVAS.rootY };
  }
  return {
    x: Number.parseFloat(match[1]),
    y: Number.parseFloat(match[2])
  };
}

function pickFromList(list, rng) {
  return list[rng.rangeInt(0, list.length)];
}

function getBodyVariant(rng) {
  return pickFromList(AVATAR_BODY_VARIANTS, rng);
}

function getSeedRace(rng) {
  return pickFromList(AVATAR_RACE_OPTIONS, rng);
}

function getRaceRenderBox(race) {
  return AVATAR_RENDER_BOXES[race] || AVATAR_RENDER_BOXES.default;
}

function getHumanSkinPalette(base) {
  return {
    skinBase: base,
    skinHighlight: mixHex(base, "#fff2e5", 0.18),
    lipColor: mixHex(base, "#c45773", 0.34)
  };
}

function getValrugPalette(base, hairBase, accentColor, rng) {
  const connector = hairBase;
  return {
    skinBase: base,
    valrugHeadBase: mixHex(base, accentColor, 0.08),
    valrugHighlight: mixHex(base, "#fff4ae", 0.22),
    valrugShade: mixHex(base, "#65431d", 0.28),
    valrugConnector: connector,
    valrugUndertone: mixHex(connector, base, 0.24),
    valrugDeep: mixHex(base, "#4a2d19", 0.36),
    valrugTextureMode: rng.value() > 0.45 ? "scales" : "mottled"
  };
}

function getRobotPalette(base, accentColor) {
  return {
    robotBase: base,
    robotLight: mixHex(base, "#d9d4ca", 0.34),
    robotDark: mixHex(base, "#3d3938", 0.42),
    robotRust: mixHex(accentColor, "#7c472b", 0.48),
    robotRustDeep: mixHex(accentColor, "#4c2a1d", 0.38),
    robotBrass: mixHex(base, "#c7a97a", 0.28)
  };
}

function getKabadeonPalette(base, tribe) {
  const darkTarget = tribe === "purple" ? "#3d2453" : "#29451f";
  return {
    kabadeonBase: base,
    kabadeonDeep: mixHex(base, darkTarget, 0.38),
    kabadeonBone: mixHex("#b89673", "#d8cb98", 0.35),
    kabadeonBoneLight: "#dccb8a",
    kabadeonWarm: mixHex(base, "#b18a61", 0.28)
  };
}

function getBodyReplacements(bodyVariant, state) {
  if (bodyVariant === "body2") {
    return [
      ["97,44,50", state.clothShadow],
      ["103,60,63", mixHex(state.clothShadow, state.clothColor, 0.28)],
      ["113,85,81", mixHex(state.clothColor, state.clothShadow, 0.2)],
      ["141,141,141", state.clothMid],
      ["183,183,183", state.clothLight]
    ];
  }

  if (bodyVariant === "body3") {
    return [
      ["195,105,14", state.clothColor],
      ["211,137,61", state.clothMid],
      ["154,67,27", state.clothShadow],
      ["178,106,81", mixHex(state.clothColor, state.clothLight, 0.18)],
      ["132,74,54", mixHex(state.clothShadow, "#241716", 0.2)],
      ["179,106,80", mixHex(state.clothColor, state.clothLight, 0.28)],
      ["154,91,27", mixHex(state.clothColor, "#865628", 0.34)],
      ["118,60,34", mixHex(state.clothShadow, "#1d110f", 0.18)]
    ];
  }

  return [["195,105,14", state.clothColor]];
}

function initAvatarForge() {
  const canvas = document.getElementById("avatar-canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) {
    return;
  }

  const els = {
    name: document.getElementById("avatar-name"),
    autoSeed: document.getElementById("avatar-auto-seed"),
    iteration: document.getElementById("avatar-iteration"),
    race: document.getElementById("avatar-race"),
    hairStyle: document.getElementById("avatar-hair-style"),
    beardStyle: document.getElementById("avatar-beard-style"),
    bgStyle: document.getElementById("avatar-bg-style"),
    skinColor: document.getElementById("avatar-skin-color"),
    hairColor: document.getElementById("avatar-hair-color"),
    eyeColor: document.getElementById("avatar-eye-color"),
    clothColor: document.getElementById("avatar-cloth-color"),
    accentColor: document.getElementById("avatar-accent-color"),
    btnGenerate: document.getElementById("btn-generate-avatar"),
    btnNext: document.getElementById("btn-next-avatar"),
    btnDownload: document.getElementById("btn-download-avatar")
  };

  const assetFiles = {
    body: "body.svg",
    body2: "body2.svg",
    body3: "body3.svg",
    neck: "krk.svg",
    head: "head.svg",
    ear: "ear.svg",
    underhair: "underhair.svg",
    hair1: "hair1.svg",
    hair2: "hair2.svg",
    hair3: "hair3.svg",
    eyebrowLeft: "lefteyebrow.svg",
    eyebrowRight: "righteyebrow.svg",
    eyeLeft: "lefteye.svg",
    eyeRight: "righteye.svg",
    nose: "nose.svg",
    mouth: "mouth.svg",
    beard: "manbeard.svg",
    beard2: "beard2.svg",
    robotNeck: "robotkrk.svg",
    robotHead1: "robothead1.svg",
    robotHead2: "robothead2.svg",
    robotHead3: "robothead3.svg",
    robotHead4: "robothead4.svg",
    kabadeonNeck: "neckkabadeon.svg",
    kabadeonHead1: "kabadeonhead1.svg",
    kabadeonHead2: "kabadeonhead2.svg",
    kabadeonHead3: "kabadeonhead3.svg",
    valrugHead1: "valrughead1.svg",
    valrugHead2: "valrughead2.svg",
    valrugHead3: "valrughead3.svg"
  };

  let assetCachePromise;
  let renderSerial = 0;

  function getSeedKey() {
    return `${els.name.value || "avatar"}::${els.iteration.value || 0}`;
  }

  function getAutoPreset(raceOverride) {
    const rng = new CustomRandom(getSharedHash(getSeedKey()));
    const race = raceOverride || getSeedRace(rng);
    const tribeKeys = Object.keys(AVATAR_VALRUG_TRIBES);
    const kabadeonTribes = Object.keys(AVATAR_KABADEON_TRIBES);
    let skinBase = pickFromList(AVATAR_EASTLANDER_TONES, rng);
    let hairBase = pickFromList(AVATAR_HAIR_COLORS, rng);
    let eyeColor = pickFromList(AVATAR_EYE_COLORS, rng);
    let accentColor = pickFromList(AVATAR_ACCENT_COLORS, rng);

    if (race === "maor") {
      skinBase = pickFromList(AVATAR_MAOR_TONES, rng);
    } else if (race === "valrug") {
      const tribe = pickFromList(tribeKeys, rng);
      skinBase = pickFromList(AVATAR_VALRUG_TRIBES[tribe], rng);
      hairBase = mixHex(skinBase, "#913d1d", 0.42);
      eyeColor = mixHex(skinBase, "#f0d96e", 0.4);
      accentColor = mixHex(skinBase, "#f2cd6e", 0.2);
    } else if (race === "robot") {
      skinBase = pickFromList(AVATAR_ROBOT_METALS, rng);
      hairBase = mixHex(skinBase, "#503127", 0.5);
      eyeColor = mixHex(pickFromList(AVATAR_ACCENT_COLORS, rng), "#ffffff", 0.16);
      accentColor = pickFromList(["#cb7a52", "#d0ae67", "#6eb6c5", "#83c971"], rng);
    } else if (race === "kabadeon") {
      const tribe = pickFromList(kabadeonTribes, rng);
      skinBase = pickFromList(AVATAR_KABADEON_TRIBES[tribe], rng);
      hairBase = mixHex(skinBase, "#4a2f1d", 0.36);
      eyeColor = mixHex(skinBase, "#eadc8e", 0.3);
      accentColor = tribe === "purple" ? "#a86fe0" : "#88c25d";
    }

    const beardPreset = ["none", "beard", "beard2"][rng.rangeInt(0, 3)];
    return {
      race,
      bodyVariant: getBodyVariant(rng),
      hairStyle: race === "eastlander" || race === "maor" ? ["hair1", "hair2", "hair3", "none"][rng.rangeInt(0, 4)] : "none",
      beardStyle: race === "eastlander" || race === "maor" ? beardPreset : "none",
      bgStyle: AVATAR_BACKGROUNDS[rng.rangeInt(0, AVATAR_BACKGROUNDS.length)],
      skinColor: skinBase,
      hairColor: hairBase,
      eyeColor,
      clothColor: AVATAR_CLOTH_COLORS[rng.rangeInt(0, AVATAR_CLOTH_COLORS.length)],
      accentColor
    };
  }

  function syncUIWithSeed() {
    const preset = getAutoPreset();
    els.race.value = preset.race;
    els.hairStyle.value = preset.hairStyle;
    els.beardStyle.value = preset.beardStyle;
    els.bgStyle.value = preset.bgStyle;
    els.skinColor.value = preset.skinColor;
    els.hairColor.value = preset.hairColor;
    els.eyeColor.value = preset.eyeColor;
    els.clothColor.value = preset.clothColor;
    els.accentColor.value = preset.accentColor;
  }

  function getState() {
    const rng = new CustomRandom(getSharedHash(getSeedKey()));
    const race = els.race.value || "eastlander";
    const skinBase = els.skinColor.value;
    const accent = els.accentColor.value;
    const hairBase = els.hairColor.value;
    const hairDark = mixHex(hairBase, "#120d0a", 0.42);
    const valrugTribe = pickFromList(Object.keys(AVATAR_VALRUG_TRIBES), rng);
    const valrugPalette = getValrugPalette(skinBase, hairBase, accent, rng);
    const kabadeonTribe = pickFromList(Object.keys(AVATAR_KABADEON_TRIBES), rng);
    const kabadeonPalette = getKabadeonPalette(skinBase, kabadeonTribe);
    const robotPalette = getRobotPalette(skinBase, accent);
    const bodyVariant = getBodyVariant(rng);
    const clothShadow = mixHex(els.clothColor.value, "#241716", 0.34);
    const clothMid = mixHex(els.clothColor.value, "#b8ada3", 0.18);
    const clothLight = mixHex(els.clothColor.value, "#e3d8cf", 0.3);
    const humanPalette = getHumanSkinPalette(skinBase);
    return {
      rng,
      seed: getSeedKey(),
      race,
      bodyVariant,
      hairStyle: els.hairStyle.value,
      beardStyle: els.beardStyle.value === "auto" ? ["none", "beard", "beard2"][rng.rangeInt(0, 3)] : els.beardStyle.value,
      bgStyle: els.bgStyle.value === "auto" ? AVATAR_BACKGROUNDS[rng.rangeInt(0, AVATAR_BACKGROUNDS.length)] : els.bgStyle.value,
      skinBase,
      skinHighlight: humanPalette.skinHighlight,
      lipColor: humanPalette.lipColor,
      hairBase,
      hairDark,
      eyebrowColor: hairDark,
      eyeColor: els.eyeColor.value,
      clothColor: els.clothColor.value,
      clothShadow,
      clothMid,
      clothLight,
      accentColor: accent,
      accentSoft: mixHex(accent, "#ffffff", 0.18),
      valrugTribe,
      valrugHead: pickFromList(["valrugHead1", "valrugHead2", "valrugHead3"], rng),
      valrugHeadBase: valrugPalette.valrugHeadBase,
      valrugHighlight: valrugPalette.valrugHighlight,
      valrugShade: valrugPalette.valrugShade,
      valrugConnector: valrugPalette.valrugConnector,
      valrugUndertone: valrugPalette.valrugUndertone,
      valrugDeep: valrugPalette.valrugDeep,
      valrugTextureMode: valrugPalette.valrugTextureMode,
      robotHead: pickFromList(["robotHead1", "robotHead2", "robotHead3", "robotHead4"], rng),
      robotBase: robotPalette.robotBase,
      robotLight: robotPalette.robotLight,
      robotDark: robotPalette.robotDark,
      robotRust: robotPalette.robotRust,
      robotRustDeep: robotPalette.robotRustDeep,
      robotBrass: robotPalette.robotBrass,
      kabadeonTribe,
      kabadeonHead: pickFromList(["kabadeonHead1", "kabadeonHead2", "kabadeonHead3"], rng),
      kabadeonBase: kabadeonPalette.kabadeonBase,
      kabadeonDeep: kabadeonPalette.kabadeonDeep,
      kabadeonBone: kabadeonPalette.kabadeonBone,
      kabadeonBoneLight: kabadeonPalette.kabadeonBoneLight,
      kabadeonWarm: kabadeonPalette.kabadeonWarm
    };
  }

  function getAssets() {
    if (!assetCachePromise) {
      const entries = Object.entries(assetFiles);
      assetCachePromise = Promise.all(entries.map(async ([key, filename]) => {
        const response = await fetch(`assets/svg/${filename}`);
        const text = await response.text();
        return [key, text];
      })).then((pairs) => Object.fromEntries(pairs));
    }
    return assetCachePromise;
  }

  function svgToImage(svgText) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      img.src = url;
    });
  }

  function tintAsset(svgText, replacements) {
    return replacements.reduce((output, [fromRgb, toHex]) => replaceRgb(output, fromRgb, toHex), svgText);
  }

  function getAvatarLayerOrder(state) {
    const bodyLayer = [state.bodyVariant, getBodyReplacements(state.bodyVariant, state)];

    if (state.race === "valrug") {
      const valrugHeadLayers = {
        valrugHead1: [
          ["104,126,62", state.valrugHeadBase],
          ["146,162,116", state.valrugHighlight],
          ["162,98,71", state.valrugConnector]
        ],
        valrugHead2: [
          ["106,39,39", state.valrugDeep],
          ["235,67,63", state.valrugHeadBase],
          ["162,98,71", state.valrugConnector]
        ],
        valrugHead3: [
          ["202,114,0", state.valrugHeadBase],
          ["206,74,0", state.valrugDeep],
          ["162,98,71", state.valrugConnector]
        ]
      };

      return [
        ["neck", [["205,140,74", state.skinBase]]],
        bodyLayer,
        [state.valrugHead, valrugHeadLayers[state.valrugHead] || valrugHeadLayers.valrugHead1]
      ];
    }

    if (state.race === "robot") {
      const robotLayers = [
        ["98,42,45", state.robotDark],
        ["155,111,74", state.robotBrass]
      ];
      const robotHeadLayers = [
        ["173,168,164", state.robotBase],
        ["199,147,125", state.robotLight],
        ["176,144,114", state.robotLight],
        ["114,86,82", state.robotRust],
        ["88,46,46", state.robotRustDeep],
        ["85,39,42", state.robotRustDeep],
        ["164,88,72", state.robotRust],
        ["18,17,13", "#141311"]
      ];

      return [
        ["robotNeck", robotLayers],
        bodyLayer,
        [state.robotHead, robotHeadLayers]
      ];
    }

    if (state.race === "kabadeon") {
      const kabadeonHeadLayers = [
        ["147,123,95", state.kabadeonBone],
        ["205,196,147", state.kabadeonBoneLight],
        ["220,200,127", state.kabadeonBoneLight],
        ["110,136,62", state.kabadeonBase],
        ["89,97,46", state.kabadeonDeep],
        ["116,62,136", state.kabadeonBase],
        ["74,46,97", state.kabadeonDeep],
        ["155,111,74", state.kabadeonWarm],
        ["176,144,114", mixHex(state.kabadeonBone, "#ffffff", 0.12)],
        ["18,17,13", "#151413"],
        ["13,12,10", "#11100f"]
      ];

      return [
        ["kabadeonNeck", [["89,97,46", state.kabadeonBase], ["155,111,74", state.kabadeonWarm]]],
        bodyLayer,
        [state.kabadeonHead, kabadeonHeadLayers]
      ];
    }

    return [
      ["neck", [["205,140,74", state.skinBase]]],
      bodyLayer,
      ["head", [["204,141,72", state.skinBase], ["224,148,74", state.skinHighlight]]],
      ...(state.hairStyle !== "none" ? [["underhair", [["76,20,29", state.hairDark]]]] : []),
      ...(state.hairStyle === "hair1" ? [["hair1", [["71,13,28", state.hairDark]]]] : []),
      ...(state.hairStyle === "hair2" ? [["hair2", [["190,79,35", state.hairBase]]]] : []),
      ...(state.hairStyle === "hair3" ? [["hair3", [["190,79,35", state.hairBase]]]] : []),
      ["ear", [["205,140,72", state.skinBase]]],
      ["eyeRight", [["245,246,230", "#f4f1e8"], ["115,155,95", mixHex(state.eyeColor, "#ffffff", 0.08)]]],
      ["eyebrowLeft", [["42,13,9", state.eyebrowColor]]],
      ["eyebrowRight", [["76,20,29", state.eyebrowColor]]],
      ["eyeLeft", [["233,231,192", "#f4f1e8"], ["90,136,87", state.eyeColor], ["40,49,30", "#1b1817"]]],
      ["nose", []],
      ["mouth", [["219,96,127", state.lipColor]]],
      ...(state.beardStyle === "beard" ? [["beard", [["181,83,38", state.hairBase]]]] : []),
      ...(state.beardStyle === "beard2" ? [["beard2", [["217,126,91", state.hairBase]]]] : [])
    ];
  }

  async function buildCompositeImage(state) {
    const sources = await getAssets();
    const layerOrder = getAvatarLayerOrder(state);

    const compositeContent = layerOrder.map(([key, replacements]) => {
      const tinted = tintAsset(sources[key], replacements);
      const sourceOffset = getRootTransformOffset(sources[key]);
      const translateX = AVATAR_MASTER_CANVAS.rootX - sourceOffset.x;
      const translateY = AVATAR_MASTER_CANVAS.rootY - sourceOffset.y;
      return `<g transform="translate(${translateX} ${translateY})">${extractSvgInnerContent(tinted)}</g>`;
    }).join("\n");

    const compositeSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:serif="http://www.serif.com/" xml:space="preserve" viewBox="0 0 ${AVATAR_MASTER_CANVAS.width} ${AVATAR_MASTER_CANVAS.height}" width="${AVATAR_MASTER_CANVAS.width}" height="${AVATAR_MASTER_CANVAS.height}" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">${compositeContent}</svg>`;
    return svgToImage(compositeSvg);
  }

  function drawBackground(state) {
    const { rng, bgStyle, accentColor, accentSoft, clothColor } = state;
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    if (bgStyle === "embers") {
      gradient.addColorStop(0, "#24110d");
      gradient.addColorStop(1, "#120f12");
    } else if (bgStyle === "forest") {
      gradient.addColorStop(0, "#13211a");
      gradient.addColorStop(1, "#0a0f0d");
    } else if (bgStyle === "arcane") {
      gradient.addColorStop(0, "#181020");
      gradient.addColorStop(1, "#0b0a11");
    } else {
      gradient.addColorStop(0, "#1b2235");
      gradient.addColorStop(1, "#0b0d14");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    if (state.race === "eastlander") {
      const glow = ctx.createRadialGradient(140, 120, 20, 140, 120, 220);
      glow.addColorStop(0, `${mixHex(accentColor, "#f3d6a1", 0.32)}24`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 512, 512);
    } else if (state.race === "maor") {
      ctx.fillStyle = `${mixHex(clothColor, "#3b2518", 0.45)}2a`;
      for (let index = 0; index < 6; index += 1) {
        const y = 66 + index * 58;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.quadraticCurveTo(256, y - 22, 472, y + 6);
        ctx.strokeStyle = `${mixHex(accentColor, "#f2d29b", 0.28)}20`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else if (state.race === "valrug") {
      for (let ring = 0; ring < 3; ring += 1) {
        ctx.beginPath();
        ctx.strokeStyle = `${mixHex(accentColor, "#f0db7c", 0.24)}22`;
        ctx.lineWidth = 2 + ring;
        ctx.arc(256, 228, 122 + ring * 54, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = `${mixHex(accentColor, "#8ca94d", 0.42)}16`;
      ctx.beginPath();
      ctx.ellipse(408, 126, 84, 38, -0.42, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.race === "robot") {
      ctx.strokeStyle = `${mixHex(accentColor, "#c2c7cf", 0.22)}26`;
      ctx.lineWidth = 2;
      for (let line = 0; line < 5; line += 1) {
        const x = 72 + line * 92;
        ctx.beginPath();
        ctx.moveTo(x, 36);
        ctx.lineTo(x, 350);
        ctx.stroke();
      }
      ctx.fillStyle = `${mixHex(accentColor, "#d48c56", 0.24)}18`;
      ctx.fillRect(0, 384, 512, 48);
    } else if (state.race === "kabadeon") {
      const orbColor = state.kabadeonTribe === "purple"
        ? mixHex(accentColor, "#a06dd8", 0.24)
        : mixHex(accentColor, "#93c862", 0.24);
      for (let index = 0; index < 5; index += 1) {
        ctx.beginPath();
        ctx.fillStyle = `${orbColor}${index % 2 === 0 ? "20" : "15"}`;
        ctx.arc(88 + index * 92, 96 + (index % 2) * 40, 42 + index * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let index = 0; index < 7; index += 1) {
      const size = rng.rangeFloat(72, 180);
      const x = rng.rangeFloat(-20, 512);
      const y = rng.rangeFloat(-20, 512);
      ctx.beginPath();
      ctx.fillStyle = index % 2 === 0 ? `${mixHex(accentColor, "#ffffff", 0.06)}22` : `${mixHex(clothColor, accentColor, 0.4)}18`;
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = `${accentSoft}55`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(256, 220, 150, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(256, 220, 188, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `${accentColor}22`;
    ctx.fillRect(0, 372, 512, 140);
  }

  function drawValrugTexture(avatarCtx, state, offsetX, offsetY, targetWidth, targetHeight) {
    const textureRng = new CustomRandom(getSharedHash(`${state.seed}::valrug-texture`));
    const maskTop = offsetY + targetHeight * 0.14;
    const maskBottom = offsetY + targetHeight * 0.72;
    const topY = offsetY + targetHeight * 0.36;
    const bottomY = offsetY + targetHeight * 0.72;

    avatarCtx.save();
    avatarCtx.globalCompositeOperation = "source-atop";
    avatarCtx.beginPath();
    avatarCtx.moveTo(offsetX + targetWidth * 0.25, maskBottom);
    avatarCtx.quadraticCurveTo(offsetX + targetWidth * 0.22, offsetY + targetHeight * 0.48, offsetX + targetWidth * 0.36, maskTop);
    avatarCtx.quadraticCurveTo(offsetX + targetWidth * 0.5, offsetY + targetHeight * 0.02, offsetX + targetWidth * 0.72, offsetY + targetHeight * 0.1);
    avatarCtx.quadraticCurveTo(offsetX + targetWidth * 0.86, offsetY + targetHeight * 0.2, offsetX + targetWidth * 0.82, offsetY + targetHeight * 0.44);
    avatarCtx.quadraticCurveTo(offsetX + targetWidth * 0.8, offsetY + targetHeight * 0.6, offsetX + targetWidth * 0.7, maskBottom);
    avatarCtx.closePath();
    avatarCtx.clip();

    if (state.valrugTextureMode === "scales") {
      for (let row = 0; row < 7; row += 1) {
        const y = topY + row * ((bottomY - topY) / 7);
        const scaleWidth = targetWidth * (0.26 + row * 0.045);
        const centerX = offsetX + targetWidth * 0.5 + textureRng.rangeFloat(-8, 8);
        const count = 4 + row;

        for (let index = 0; index < count; index += 1) {
          const t = count === 1 ? 0.5 : index / (count - 1);
          const x = centerX - scaleWidth / 2 + scaleWidth * t + textureRng.rangeFloat(-6, 6);
          const radiusX = targetWidth * textureRng.rangeFloat(0.028, 0.046);
          const radiusY = targetHeight * textureRng.rangeFloat(0.012, 0.021);

          avatarCtx.beginPath();
          avatarCtx.fillStyle = `${state.valrugShade}22`;
          avatarCtx.ellipse(x, y + textureRng.rangeFloat(-5, 5), radiusX, radiusY, textureRng.rangeFloat(-0.25, 0.25), 0, Math.PI * 2);
          avatarCtx.fill();

          avatarCtx.beginPath();
          avatarCtx.strokeStyle = `${state.valrugHighlight}2e`;
          avatarCtx.lineWidth = 1.25;
          avatarCtx.arc(x, y, radiusX, Math.PI * 1.08, Math.PI * 1.92);
          avatarCtx.stroke();
        }
      }
    } else {
      for (let index = 0; index < 38; index += 1) {
        const blotX = offsetX + targetWidth * textureRng.rangeFloat(0.26, 0.74);
        const blotY = offsetY + targetHeight * textureRng.rangeFloat(0.24, 0.72);
        const blotSize = targetWidth * textureRng.rangeFloat(0.012, 0.035);
        avatarCtx.beginPath();
        avatarCtx.fillStyle = index % 3 === 0 ? `${state.valrugDeep}14` : `${state.valrugShade}10`;
        avatarCtx.arc(blotX, blotY, blotSize, 0, Math.PI * 2);
        avatarCtx.fill();
      }
    }

    avatarCtx.restore();
  }

  async function renderAvatar() {
    const serial = ++renderSerial;
    const state = getState();
    ctx.clearRect(0, 0, 512, 512);
    drawBackground(state);
    try {
      const composite = await buildCompositeImage(state);
      if (serial !== renderSerial) {
        return;
      }

      ctx.imageSmoothingEnabled = true;

      const renderBox = getRaceRenderBox(state.race);
      const availableWidth = 512 - renderBox.paddingX * 2;
      const availableHeight = 512 - renderBox.paddingTop - renderBox.paddingBottom;
      const scale = Math.min(availableWidth / renderBox.width, availableHeight / renderBox.height);
      const targetWidth = renderBox.width * scale;
      const targetHeight = renderBox.height * scale;
      const offsetX = (512 - targetWidth) * renderBox.offsetXRatio;
      const offsetY = 512 - renderBox.paddingBottom - targetHeight;
      const avatarBuffer = document.createElement("canvas");
      avatarBuffer.width = 512;
      avatarBuffer.height = 512;
      const avatarCtx = avatarBuffer.getContext("2d");

      avatarCtx.imageSmoothingEnabled = true;
      avatarCtx.drawImage(composite, offsetX, offsetY, targetWidth, targetHeight);

      avatarCtx.globalCompositeOperation = "source-atop";

      const lightGradient = avatarCtx.createLinearGradient(offsetX, offsetY, offsetX + targetWidth, offsetY);
      lightGradient.addColorStop(0, "rgba(18, 12, 10, 0.22)");
      lightGradient.addColorStop(0.32, "rgba(18, 12, 10, 0.1)");
      lightGradient.addColorStop(0.7, "rgba(255, 244, 224, 0.08)");
      lightGradient.addColorStop(1, "rgba(255, 244, 224, 0.22)");
      avatarCtx.fillStyle = lightGradient;
      avatarCtx.fillRect(offsetX, offsetY, targetWidth, targetHeight);

      const topShade = avatarCtx.createLinearGradient(0, offsetY, 0, offsetY + targetHeight);
      topShade.addColorStop(0, "rgba(255, 255, 255, 0.06)");
      topShade.addColorStop(0.38, "rgba(255, 255, 255, 0)");
      topShade.addColorStop(1, "rgba(0, 0, 0, 0.08)");
      avatarCtx.fillStyle = topShade;
      avatarCtx.fillRect(offsetX, offsetY, targetWidth, targetHeight);

      if (state.race === "valrug") {
        drawValrugTexture(avatarCtx, state, offsetX, offsetY, targetWidth, targetHeight);
      }

      avatarCtx.globalCompositeOperation = "source-over";
      ctx.drawImage(avatarBuffer, 0, 0);

      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, 0, 512, 512);
    } catch (error) {
      console.error("Avatar render failed", error);
      ctx.fillStyle = "rgba(9, 8, 8, 0.55)";
      ctx.fillRect(32, 180, 448, 120);
      ctx.fillStyle = "#f1e5d3";
      ctx.font = "20px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("Avatar se nepodarilo vykreslit.", 256, 236);
      ctx.fillStyle = "#c2b5a3";
      ctx.font = "14px Georgia";
      ctx.fillText("Mrkni do konzole, uz tam vypisuju presnou chybu rendereru.", 256, 264);
    }
  }

  els.name.addEventListener("input", () => {
    if (els.autoSeed.checked) {
      syncUIWithSeed();
    }
    renderAvatar();
  });

  els.iteration.addEventListener("input", () => {
    if (els.autoSeed.checked) {
      syncUIWithSeed();
    }
    renderAvatar();
  });

  els.race?.addEventListener("input", () => {
    if (els.autoSeed.checked) {
      syncUIWithSeed();
    }
    renderAvatar();
  });

  [
    els.hairStyle,
    els.beardStyle,
    els.bgStyle,
    els.skinColor,
    els.hairColor,
    els.eyeColor,
    els.clothColor,
    els.accentColor
  ].forEach((input) => {
    input.addEventListener("input", () => {
      els.autoSeed.checked = false;
      renderAvatar();
    });
  });

  els.autoSeed.addEventListener("change", () => {
    if (els.autoSeed.checked) {
      syncUIWithSeed();
    }
    renderAvatar();
  });

  els.btnGenerate?.addEventListener("click", renderAvatar);
  els.btnNext?.addEventListener("click", () => {
    els.iteration.value = String((Number.parseInt(els.iteration.value, 10) || 0) + 1);
    if (els.autoSeed.checked) {
      syncUIWithSeed();
    }
    renderAvatar();
  });
  els.btnDownload?.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `avatar_${(els.name.value || "postava").replace(/\s+/g, "_")}_${els.iteration.value || 0}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  syncUIWithSeed();
  renderAvatar();
}
