const YOUTUBE_MEMBER_NAME_CANDIDATES = ["clen", "member", "jmeno", "name"];
const YOUTUBE_MEMBER_LEVEL_CANDIDATES = ["aktualni uroven", "current level", "uroven", "level"];
const YOUTUBE_MEMBER_DEFAULT_ORDER = ["zednar", "kral", "baron", "slechtic", "rytir", "panos"];

function normalizeYouTubeMemberText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function initYouTubeMemberExporter() {
  if (document.body.dataset.page !== "tool-youtube-members") {
    return;
  }

  const fileInput = document.getElementById("csv-file");
  const outputText = document.getElementById("output-text");
  const sortableList = document.getElementById("sortable-list");
  const stepUpload = document.getElementById("step-upload");
  const stepSort = document.getElementById("step-sort");
  const stepResult = document.getElementById("step-result");
  const confirmSortButton = document.getElementById("btn-confirm-sort");
  const copyButton = document.getElementById("btn-copy");
  const downloadButton = document.getElementById("btn-download");
  const resetButton = document.getElementById("btn-reset");

  if (!fileInput || !outputText || !sortableList || !stepUpload || !stepSort || !stepResult) {
    return;
  }

  let parsedData = {};
  let detectedLevels = [];

  function switchStep(activeStep) {
    [stepUpload, stepSort, stepResult].forEach((step) => {
      step.classList.toggle("youtube-exporter-step--active", step === activeStep);
    });
  }

  function resetExporter() {
    parsedData = {};
    detectedLevels = [];
    fileInput.value = "";
    outputText.value = "";
    sortableList.innerHTML = "";
    switchStep(stepUpload);
  }

  function renderSortableList() {
    sortableList.innerHTML = "";

    detectedLevels.forEach((level, index) => {
      const item = document.createElement("li");
      item.className = "youtube-exporter-list__item";

      const label = document.createElement("span");
      label.className = "youtube-exporter-list__label";
      label.textContent = `${level} (${parsedData[level]?.length || 0} členů)`;

      const controls = document.createElement("div");
      controls.className = "youtube-exporter-list__controls";

      const upButton = document.createElement("button");
      upButton.type = "button";
      upButton.className = "youtube-exporter-list__button";
      upButton.textContent = "Nahoru";
      upButton.disabled = index === 0;
      upButton.addEventListener("click", () => {
        const moved = [...detectedLevels];
        [moved[index - 1], moved[index]] = [moved[index], moved[index - 1]];
        detectedLevels = moved;
        renderSortableList();
      });

      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.className = "youtube-exporter-list__button";
      downButton.textContent = "Dolů";
      downButton.disabled = index === detectedLevels.length - 1;
      downButton.addEventListener("click", () => {
        const moved = [...detectedLevels];
        [moved[index], moved[index + 1]] = [moved[index + 1], moved[index]];
        detectedLevels = moved;
        renderSortableList();
      });

      controls.append(upButton, downButton);
      item.append(label, controls);
      sortableList.appendChild(item);
    });
  }

  function generateOutput(orderedLevels) {
    const lines = [];

    orderedLevels.forEach((level) => {
      const members = [...(parsedData[level] || [])].sort((a, b) => a.localeCompare(b, "cs"));

      if (members.length === 0) {
        return;
      }

      lines.push(`${level}:`);
      members.forEach((member) => lines.push(member));
      lines.push("");
    });

    outputText.value = `${lines.join("\n").trim()}\n`;
    switchStep(stepResult);
  }

  function processData(rows, headers) {
    const safeHeaders = Array.isArray(headers) ? headers.filter(Boolean) : [];
    const normalizedHeaders = safeHeaders.map((header) => normalizeYouTubeMemberText(header));
    const nameIndex = normalizedHeaders.findIndex((header) => YOUTUBE_MEMBER_NAME_CANDIDATES.includes(header));
    const levelIndex = normalizedHeaders.findIndex((header) => YOUTUBE_MEMBER_LEVEL_CANDIDATES.includes(header));
    const nameKey = safeHeaders[nameIndex];
    const levelKey = safeHeaders[levelIndex];

    if (!nameKey || !levelKey) {
      window.alert("V CSV jsem nenašel potřebné sloupce pro jméno a aktuální úroveň člena.");
      resetExporter();
      return;
    }

    parsedData = {};

    rows.forEach((row) => {
      const name = String(row?.[nameKey] || "").trim();
      const level = String(row?.[levelKey] || "").trim();

      if (!name || !level) {
        return;
      }

      if (!parsedData[level]) {
        parsedData[level] = [];
      }

      parsedData[level].push(name);
    });

    detectedLevels = Object.keys(parsedData);

    if (detectedLevels.length === 0) {
      window.alert("V souboru jsem nenašel žádné členy s vyplněným jménem a úrovní.");
      resetExporter();
      return;
    }

    const allLevelsKnown = detectedLevels.every((level) =>
      YOUTUBE_MEMBER_DEFAULT_ORDER.includes(normalizeYouTubeMemberText(level))
    );

    if (allLevelsKnown) {
      const sortedLevels = [...detectedLevels].sort((a, b) =>
        YOUTUBE_MEMBER_DEFAULT_ORDER.indexOf(normalizeYouTubeMemberText(a)) -
        YOUTUBE_MEMBER_DEFAULT_ORDER.indexOf(normalizeYouTubeMemberText(b))
      );

      generateOutput(sortedLevels);
      return;
    }

    renderSortableList();
    switchStep(stepSort);
  }

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!window.Papa) {
      window.alert("Parser CSV se nenačetl. Zkus stránku obnovit.");
      return;
    }

    window.Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        processData(results.data || [], results.meta?.fields || []);
      },
      error(error) {
        window.alert(`Chyba při čtení CSV: ${error.message}`);
        resetExporter();
      }
    });
  });

  confirmSortButton?.addEventListener("click", () => {
    generateOutput(detectedLevels);
  });

  copyButton?.addEventListener("click", async () => {
    if (!outputText.value.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(outputText.value);
      const originalText = copyButton.textContent;
      copyButton.textContent = "Zkopírováno";
      window.setTimeout(() => {
        copyButton.textContent = originalText || "Kopírovat text";
      }, 1800);
    } catch (error) {
      window.alert("Text se nepodařilo zkopírovat do schránky.");
    }
  });

  downloadButton?.addEventListener("click", () => {
    if (!outputText.value.trim()) {
      return;
    }

    const blob = new Blob([outputText.value], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clenove_podle_urovni.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  });

  resetButton?.addEventListener("click", resetExporter);
}

document.addEventListener("DOMContentLoaded", initYouTubeMemberExporter);
