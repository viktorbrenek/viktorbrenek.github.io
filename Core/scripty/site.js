const FONT_PRECONNECTS = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com"
];

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap";

const RUNES = [
  { match: /about\.html/, rune: "fehu" },
  { match: /blog\.html/, rune: "uruz" },
  { match: /gamedev\.html|game dev/, rune: "thurisaz" },
  { match: /design\.html/, rune: "ansuz" },
  { match: /illustrations\.html/, rune: "kenaz" },
  { match: /uxdesign\.html|ux\/ui/, rune: "algiz" },
  { match: /youtube/, rune: "isa" },
  { match: /instagram/, rune: "fehu" },
  { match: /facebook/, rune: "uruz" },
  { match: /discord/, rune: "algiz" },
  { match: /twitch/, rune: "teiwaz" },
  { match: /mailto:/, rune: "isa" }
];

function ensureFonts() {
  FONT_PRECONNECTS.forEach((href) => {
    if (document.head.querySelector(`link[href="${href}"]`)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    if (href.includes("gstatic")) {
      link.crossOrigin = "anonymous";
    }
    document.head.appendChild(link);
  });

  if (!document.head.querySelector(`link[href="${FONT_HREF}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }
}

function createSpores() {
  const container = document.createElement("div");
  container.id = "spore-bg";

  for (let i = 0; i < 32; i += 1) {
    const spore = document.createElement("span");
    spore.className = "spore";
    spore.style.setProperty("--size", `${Math.random() * 14 + 8}px`);
    spore.style.setProperty("--left", `${Math.random() * 100}%`);
    spore.style.setProperty("--duration", `${Math.random() * 12 + 14}s`);
    spore.style.setProperty("--delay", `${Math.random() * -14}s`);
    spore.style.setProperty("--drift", `${(Math.random() - 0.5) * 180}px`);
    spore.style.setProperty("--alpha", `${Math.random() * 0.25 + 0.55}`);
    container.appendChild(spore);
  }

  document.body.prepend(container);
}

function getJsonPath(file) {
  const isArticle =
    document.body.dataset.page === "article" ||
    window.location.pathname.includes("/articles/");
  return `${isArticle ? "../" : ""}${file}`;
}

function runeForLink(link) {
  const source = `${link.getAttribute("href") || ""} ${link.textContent || ""}`.toLowerCase();
  const entry = RUNES.find((item) => item.match.test(source));
  return entry ? entry.rune : "isa";
}

function createRuneMarkup(name, compact) {
  const wrapper = document.createElement("span");
  wrapper.className = `rune rune--${name}${compact ? " rune--compact" : ""}`;

  const shadow = document.createElement("span");
  shadow.className = "shadow";
  const staff = document.createElement("span");
  staff.className = "staff";

  wrapper.appendChild(shadow);
  wrapper.appendChild(staff);
  return wrapper;
}

function createPath(documentRef, ns, d, width, color, duration, delay) {
  const path = documentRef.createElementNS(ns, "path");
  path.setAttribute("d", d);
  path.setAttribute("stroke-width", width);
  path.setAttribute("stroke", color);
  path.setAttribute("pathLength", "1");
  path.setAttribute("class", "rpg-vine");
  path.style.setProperty("--duration", `${duration}s`);
  path.style.setProperty("--width", `${width}px`);
  path.style.animationDelay = `${delay}s, ${duration}s`;
  return path;
}

function createSpore(documentRef, ns, x, y, delay) {
  const spore = documentRef.createElementNS(ns, "circle");
  spore.setAttribute("cx", x);
  spore.setAttribute("cy", y);
  spore.setAttribute("r", (2.4 + Math.random() * 2.8).toFixed(2));
  spore.setAttribute("fill", Math.random() > 0.55 ? "#5d6b46" : "#4f3c2e");
  spore.setAttribute("class", "rpg-spore");
  spore.style.setProperty("--cx", `${x}px`);
  spore.style.setProperty("--cy", `${y}px`);
  spore.style.setProperty("--delay", `${delay}s`);
  return spore;
}

function generateEdge(svg, startX, startY, endX, endY, steps, mainColor, timeOffset) {
  const ns = "http://www.w3.org/2000/svg";
  const documentRef = document;
  let d = `M ${startX} ${startY}`;

  const stepX = (endX - startX) / steps;
  const stepY = (endY - startY) / steps;

  let normX = -stepY;
  let normY = stepX;
  const normLength = Math.hypot(normX, normY) || 1;
  normX /= normLength;
  normY /= normLength;

  for (let i = 1; i <= steps; i += 1) {
    const noiseX = (Math.random() - 0.5) * 2.4;
    const noiseY = (Math.random() - 0.5) * 2.4;
    let nextX = startX + stepX * i + noiseX;
    let nextY = startY + stepY * i + noiseY;

    if (i === steps) {
      nextX = endX;
      nextY = endY;
    }

    d += ` L ${nextX} ${nextY}`;

    if (Math.random() > 0.66) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const branchLength = 4 + Math.random() * 6;
      const bx = nextX + normX * branchLength * direction + (Math.random() - 0.5) * 3;
      const by = nextY + normY * branchLength * direction + (Math.random() - 0.5) * 3;
      const branchD =
        `M ${nextX} ${nextY} Q ${nextX + normX * 2} ${nextY + normY * 2} ${bx} ${by}`;

      svg.appendChild(
        createPath(documentRef, ns, branchD, 1.1 + Math.random() * 1.5, "#364124", 0.95, timeOffset + i * 0.06)
      );

      if (Math.random() > 0.4) {
        svg.appendChild(createSpore(documentRef, ns, bx, by, timeOffset + i * 0.06 + 0.35));
      }
    }
  }

  svg.appendChild(createPath(documentRef, ns, d, 2.8 + Math.random() * 1.4, mainColor, 1.6, timeOffset));
}

function mountPanelBorder(panel) {
  const ns = "http://www.w3.org/2000/svg";
  const existing = panel.querySelector(".rpg-border");
  if (existing) {
    existing.remove();
  }

  const bounds = panel.getBoundingClientRect();
  const inset = 12;
  const width = Math.max(220, Math.round(bounds.width));
  const height = Math.max(140, Math.round(bounds.height));
  const viewWidth = width + inset * 2;
  const viewHeight = height + inset * 2;

  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "rpg-border");
  svg.setAttribute("viewBox", `0 0 ${viewWidth} ${viewHeight}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.left = `${-inset}px`;
  svg.style.top = `${-inset}px`;
  svg.style.width = `${viewWidth}px`;
  svg.style.height = `${viewHeight}px`;

  const ox = inset;
  const oy = inset;
  const c1 = "#2c331d";
  const c2 = "#3a2d21";

  generateEdge(svg, ox, oy, ox + width, oy, Math.max(12, Math.round(width / 28)), c1, 0);
  generateEdge(svg, ox + width, oy, ox + width, oy + height, Math.max(8, Math.round(height / 32)), c2, 0.35);
  generateEdge(svg, ox + width, oy + height, ox, oy + height, Math.max(12, Math.round(width / 28)), c1, 0.7);
  generateEdge(svg, ox, oy + height, ox, oy, Math.max(8, Math.round(height / 32)), c2, 1.05);

  panel.appendChild(svg);
}

function decoratePanels() {
  const panels = document.querySelectorAll(".page-hero, .section-card, .archive-year, .article-panel, .tool-panel");
  let frame = 0;

  const render = () => {
    panels.forEach((panel) => mountPanelBorder(panel));
  };

  render();

  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
  });

  panels.forEach((panel) => observer.observe(panel));

  window.setInterval(() => {
    if (!document.hidden) {
      render();
    }
  }, 16000);
}

function createActionBar() {
  const nav = document.querySelector(".site-nav");
  const social = document.querySelector(".social-links");
  const toggle = document.querySelector(".nav-toggle");

  if (!nav || !social) {
    return;
  }

  document.body.classList.add("chrome-ready");

  const shell = document.createElement("div");
  shell.className = "action-bar-shell";

  const tray = document.createElement("div");
  tray.className = "spell-tray";
  tray.id = "spell-tray";

  const bar = document.createElement("nav");
  bar.className = "action-bar";
  bar.setAttribute("aria-label", "Action bar");

  Array.from(nav.querySelectorAll("a")).forEach((link, index) => {
    const clone = link.cloneNode(true);
    const label = clone.textContent.trim();
    const rune = runeForLink(link);
    clone.className = "action-slot";
    clone.setAttribute("data-slot", String(index + 1));
    clone.setAttribute("data-rune", rune);
    clone.setAttribute("aria-label", label);
    clone.textContent = "";
    clone.appendChild(createRuneMarkup(rune, true));
    const text = document.createElement("span");
    text.className = "action-slot__label";
    text.textContent = label;
    clone.appendChild(text);
    bar.appendChild(clone);
  });

  const extraLinks = [
    {
      href: "https://www.youtube.com/@ViktorB%C5%99enekYT",
      label: "YouTube kanál"
    }
  ];

  const socialLinks = Array.from(social.querySelectorAll("a")).map((a) => ({
    href: a.getAttribute("href"),
    label: a.textContent.trim()
  }));

  extraLinks.forEach((entry) => {
    if (!socialLinks.some((link) => link.href === entry.href)) {
      socialLinks.unshift(entry);
    }
  });

  socialLinks.forEach((entry, index) => {
    const link = document.createElement("a");
    link.href = entry.href;
    link.target = "_blank";
    link.rel = "noreferrer";
    const clone = link.cloneNode(true);
    const label = entry.label;
    const rune = runeForLink(link);
    clone.className = "spell-link";
    clone.setAttribute("data-rank", String(index + 1));
    clone.setAttribute("data-rune", rune);
    clone.textContent = "";
    clone.appendChild(createRuneMarkup(rune, false));
    const text = document.createElement("span");
    text.className = "spell-link__label";
    text.textContent = label;
    clone.appendChild(text);
    tray.appendChild(clone);
  });

  const trayToggle = document.createElement("button");
  trayToggle.type = "button";
  trayToggle.className = "action-slot action-slot--utility";
  trayToggle.setAttribute("aria-expanded", "false");
  trayToggle.setAttribute("aria-controls", "spell-tray");
  trayToggle.setAttribute("data-rune", "isa");
  trayToggle.appendChild(createRuneMarkup("isa", true));
  trayToggle.insertAdjacentHTML("beforeend", '<span class="action-slot__label">Runy</span>');

  trayToggle.addEventListener("click", () => {
    const expanded = shell.classList.toggle("is-open");
    trayToggle.setAttribute("aria-expanded", String(expanded));
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(expanded));
    }
  });

  shell.appendChild(tray);
  shell.appendChild(bar);
  shell.appendChild(trayToggle);
  document.body.appendChild(shell);

  if (toggle) {
    toggle.textContent = "Runy";
    toggle.addEventListener("click", () => {
      const expanded = shell.classList.toggle("is-open");
      trayToggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-expanded", String(expanded));
    });
  }
}

async function initArchiveWidget() {
  const tipElement = document.getElementById("loading-tip");
  const btnNext = document.getElementById("next-tip-btn");
  const progressFill = document.getElementById("progress-fill");

  if (!tipElement || !btnNext || !progressFill) {
    return;
  }

  const timePerTip = 12000;
  let tips = [];
  let currentInterval = null;

  try {
    const response = await fetch(getJsonPath("archive-tips.json"), { cache: "no-cache" });
    tips = await response.json();
  } catch (error) {
    tipElement.textContent = "Archiv je zatím tichý. Vrať se později pro další záznam.";
    return;
  }

  if (!Array.isArray(tips) || tips.length === 0) {
    tipElement.textContent = "Archiv je zatím tichý. Vrať se později pro další záznam.";
    return;
  }

  function getRandomTip() {
    let nextTip = tips[Math.floor(Math.random() * tips.length)];

    if (tips.length > 1) {
      while (nextTip === tipElement.textContent) {
        nextTip = tips[Math.floor(Math.random() * tips.length)];
      }
    }

    return nextTip;
  }

  function changeTip() {
    tipElement.style.opacity = "0";
    progressFill.style.transition = "none";
    progressFill.style.width = "0%";

    window.setTimeout(() => {
      tipElement.textContent = getRandomTip();
      tipElement.style.opacity = "1";

      requestAnimationFrame(() => {
        progressFill.style.transition = `width ${timePerTip}ms linear`;
        progressFill.style.width = "100%";
      });
    }, 260);
  }

  function resetTimer() {
    clearInterval(currentInterval);
    changeTip();
    currentInterval = window.setInterval(changeTip, timePerTip);
  }

  btnNext.addEventListener("click", resetTimer);
  tipElement.textContent = getRandomTip();

  window.setTimeout(() => {
    progressFill.style.transition = `width ${timePerTip}ms linear`;
    progressFill.style.width = "100%";
  }, 100);

  currentInterval = window.setInterval(changeTip, timePerTip);
}

async function initYoutubeWidget() {
  const listContainer = document.getElementById("yt-list");
  const spinner = document.getElementById("loading-spinner");
  const refreshBtn = document.getElementById("refresh-btn");

  if (!listContainer || !spinner || !refreshBtn) {
    return;
  }

  const channelId = "UCtU9oaLRlJDKtEJlHMPjckw";
  const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

  async function fetchYoutubeVideos() {
    spinner.classList.add("active");
    listContainer.innerHTML = "";

    try {
      const response = await fetch(apiUrl, { cache: "no-cache" });
      const data = await response.json();

      if (data.status === "ok") {
        data.items.slice(0, 5).forEach((video, index) => {
          const item = document.createElement("a");
          item.href = video.link;
          item.target = "_blank";
          item.rel = "noreferrer";
          item.className = "yt-item";
          item.style.animationDelay = `${index * 0.08}s`;

          const pubDate = new Date(video.pubDate).toLocaleDateString("cs-CZ");
          item.innerHTML = `
            <img class="yt-thumbnail" src="${video.thumbnail}" alt="Náhled videa" loading="lazy">
            <div class="yt-info">
              <span class="yt-title">${video.title}</span>
              <span class="yt-date">Publikováno: </span>
            </div>
          `;

          listContainer.appendChild(item);
        });
      } else {
        listContainer.innerHTML = '<li class="widget-error">Krystal neodpověděl. Zkus to později.</li>';
      }
    } catch (error) {
      listContainer.innerHTML = '<li class="widget-error">Signál se ztratil v mlze. Zkus to později.</li>';
    }

    spinner.classList.remove("active");
  }

  refreshBtn.addEventListener("click", () => {
    if (!spinner.classList.contains("active")) {
      fetchYoutubeVideos();
    }
  });

  fetchYoutubeVideos();
}

window.addEventListener("DOMContentLoaded", () => {
  ensureFonts();
  createSpores();
  decoratePanels();
  createActionBar();
  initArchiveWidget();
  initYoutubeWidget();
});
