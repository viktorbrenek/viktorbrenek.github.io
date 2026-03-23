const TOOLS_DIRECTORY_STORAGE_KEY = "vb-pinned-tools";

function loadPinnedTools() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TOOLS_DIRECTORY_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch (error) {
    return [];
  }
}

function savePinnedTools(pinnedTools) {
  try {
    window.localStorage.setItem(TOOLS_DIRECTORY_STORAGE_KEY, JSON.stringify(pinnedTools));
  } catch (error) {
    // Ignore storage failures so the directory still works without persistence.
  }
}

function renderPinnedTools(cards, pinnedTools) {
  const parent = cards[0]?.parentElement;
  const noteCard = parent?.querySelector(".feature-card--tool-note");

  if (!parent) {
    return;
  }

  const pinnedSet = new Set(pinnedTools);
  const sortedCards = [...cards].sort((a, b) => {
    const aId = a.dataset.toolId || "";
    const bId = b.dataset.toolId || "";
    const aPinnedIndex = pinnedTools.indexOf(aId);
    const bPinnedIndex = pinnedTools.indexOf(bId);

    if (aPinnedIndex !== -1 && bPinnedIndex !== -1) {
      return aPinnedIndex - bPinnedIndex;
    }

    if (aPinnedIndex !== -1) {
      return -1;
    }

    if (bPinnedIndex !== -1) {
      return 1;
    }

    return 0;
  });

  sortedCards.forEach((card) => {
    const toolId = card.dataset.toolId || "";
    const button = card.querySelector(".feature-card__pin");
    const isPinned = pinnedSet.has(toolId);

    card.classList.toggle("is-pinned", isPinned);

    if (button) {
      button.setAttribute("aria-pressed", String(isPinned));
      button.textContent = isPinned ? "Připnuto" : "Připnout";
      button.setAttribute(
        "aria-label",
        `${isPinned ? "Odepnout" : "Připnout"} nástroj ${card.querySelector(".feature-card__title")?.textContent?.trim() || ""}`
      );
    }

    if (noteCard) {
      parent.insertBefore(card, noteCard);
    } else {
      parent.appendChild(card);
    }
  });
}

function initToolsDirectory() {
  if (document.body.dataset.page !== "tools") {
    return;
  }

  const cards = Array.from(document.querySelectorAll(".tools-directory [data-tool-id]"));

  if (cards.length === 0) {
    return;
  }

  let pinnedTools = loadPinnedTools().filter((toolId) => cards.some((card) => card.dataset.toolId === toolId));
  renderPinnedTools(cards, pinnedTools);

  cards.forEach((card) => {
    const button = card.querySelector(".feature-card__pin");

    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const toolId = card.dataset.toolId;

      if (!toolId) {
        return;
      }

      if (pinnedTools.includes(toolId)) {
        pinnedTools = pinnedTools.filter((item) => item !== toolId);
      } else {
        pinnedTools = [...pinnedTools, toolId];
      }

      savePinnedTools(pinnedTools);
      renderPinnedTools(cards, pinnedTools);
    });
  });
}

document.addEventListener("DOMContentLoaded", initToolsDirectory);
