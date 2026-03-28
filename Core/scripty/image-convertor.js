"use strict";

window.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("upload");
  const formatSelect = document.getElementById("format");
  const qualityInput = document.getElementById("quality");
  const qualityVal = document.getElementById("quality-val");
  const convertBtn = document.getElementById("convertBtn");
  const resetBtn = document.getElementById("resetBtn");
  const infoEl = document.getElementById("info");
  const originalPreview = document.getElementById("originalPreview");
  const convertedPreview = document.getElementById("convertedPreview");
  const imageDimensions = document.getElementById("imageDimensions");
  const imageOriginalSize = document.getElementById("imageOriginalSize");
  const imageConvertedSize = document.getElementById("imageConvertedSize");
  const imageSavings = document.getElementById("imageSavings");

  if (
    !uploadInput ||
    !formatSelect ||
    !qualityInput ||
    !qualityVal ||
    !convertBtn ||
    !resetBtn ||
    !infoEl ||
    !originalPreview ||
    !convertedPreview ||
    !imageDimensions ||
    !imageOriginalSize ||
    !imageConvertedSize ||
    !imageSavings
  ) {
    return;
  }

  let currentImage = null;
  let originalFile = null;
  let originalUrl = "";
  let convertedUrl = "";

  const formatSize = (sizeInBytes) => `${(sizeInBytes / 1024).toFixed(2)} KB`;

  const getExtension = (mimeType) => {
    if (mimeType === "image/jpeg") {
      return "jpg";
    }
    if (mimeType === "image/png") {
      return "png";
    }
    return "webp";
  };

  const updateStatus = (message, variant) => {
    infoEl.textContent = message;
    infoEl.classList.remove("tool-workbench__status--warning", "tool-workbench__status--success");

    if (variant === "warning") {
      infoEl.classList.add("tool-workbench__status--warning");
    }

    if (variant === "success") {
      infoEl.classList.add("tool-workbench__status--success");
    }
  };

  const revokeUrl = (url) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const resetPreviews = () => {
    originalPreview.removeAttribute("src");
    convertedPreview.removeAttribute("src");
    originalPreview.classList.remove("is-ready");
    convertedPreview.classList.remove("is-ready");
    imageDimensions.textContent = "-";
    imageOriginalSize.textContent = "-";
    imageConvertedSize.textContent = "-";
    imageSavings.textContent = "-";
  };

  const clearTool = () => {
    revokeUrl(originalUrl);
    revokeUrl(convertedUrl);
    originalUrl = "";
    convertedUrl = "";
    currentImage = null;
    originalFile = null;
    uploadInput.value = "";
    formatSelect.value = "image/webp";
    qualityInput.value = "0.8";
    qualityVal.textContent = "80%";
    convertBtn.disabled = true;
    resetPreviews();
    updateStatus("Zatím nebyl nahrán žádný obrázek.");
  };

  qualityInput.addEventListener("input", (event) => {
    qualityVal.textContent = `${Math.round(Number(event.target.value) * 100)}%`;
  });

  uploadInput.addEventListener("change", () => {
    const [file] = uploadInput.files || [];

    revokeUrl(originalUrl);
    originalUrl = "";
    revokeUrl(convertedUrl);
    convertedUrl = "";
    convertedPreview.removeAttribute("src");
    convertedPreview.classList.remove("is-ready");
    imageConvertedSize.textContent = "-";
    imageSavings.textContent = "-";

    if (!file) {
      currentImage = null;
      originalFile = null;
      convertBtn.disabled = true;
      resetPreviews();
      updateStatus("Nebyl vybrán žádný soubor.");
      return;
    }

    originalFile = file;
    originalUrl = URL.createObjectURL(file);

    const img = new Image();
    img.onload = () => {
      currentImage = img;
      convertBtn.disabled = false;
      originalPreview.src = originalUrl;
      originalPreview.classList.add("is-ready");
      imageDimensions.textContent = `${img.width} × ${img.height}`;
      imageOriginalSize.textContent = formatSize(file.size);
      updateStatus(
        `Načteno ${file.name}. Můžeš změnit formát, doladit kvalitu a spustit převod.`,
        "success"
      );
    };
    img.onerror = () => {
      revokeUrl(originalUrl);
      originalUrl = "";
      currentImage = null;
      originalFile = null;
      convertBtn.disabled = true;
      resetPreviews();
      updateStatus("Obrázek se nepodařilo načíst. Zkus jiný soubor nebo jiný formát.", "warning");
    };
    img.src = originalUrl;
  });

  convertBtn.addEventListener("click", () => {
    if (!currentImage || !originalFile) {
      return;
    }

    const mimeType = formatSelect.value;
    const extension = getExtension(mimeType);
    const quality = Number.parseFloat(qualityInput.value);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      updateStatus("Prohlížeč nepodporuje canvas API potřebné pro převod.", "warning");
      return;
    }

    canvas.width = currentImage.width;
    canvas.height = currentImage.height;

    if (mimeType === "image/jpeg") {
      context.fillStyle = "#f7f0e4";
      context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(currentImage, 0, 0);
    convertBtn.disabled = true;
    updateStatus("Převádím obrázek a připravuji soubor ke stažení...");

    canvas.toBlob(
      (blob) => {
        convertBtn.disabled = false;

        if (!blob) {
          updateStatus("Převod selhal. Zkus jiný formát nebo jiný zdrojový obrázek.", "warning");
          return;
        }

        revokeUrl(convertedUrl);
        convertedUrl = URL.createObjectURL(blob);
        convertedPreview.src = convertedUrl;
        convertedPreview.classList.add("is-ready");

        const originalSize = originalFile.size;
        const newSize = blob.size;
        const savingsPercent = Math.round(100 - (newSize / originalSize) * 100);
        let diffText = "Beze změny";

        if (savingsPercent > 0) {
          diffText = `Ušetřeno ${savingsPercent} %`;
        } else if (savingsPercent < 0) {
          diffText = `Narostlo o ${Math.abs(savingsPercent)} %`;
        }

        imageConvertedSize.textContent = formatSize(newSize);
        imageSavings.textContent = diffText;

        const newFileName = `${originalFile.name.replace(/\.[^/.]+$/, "")}.${extension}`;
        updateStatus(
          `Hotovo. ${newFileName} je připravený a stahování se spustí automaticky.`,
          "success"
        );

        const anchor = document.createElement("a");
        anchor.href = convertedUrl;
        anchor.download = newFileName;
        anchor.click();
      },
      mimeType,
      mimeType === "image/png" ? undefined : quality
    );
  });

  resetBtn.addEventListener("click", clearTool);

  clearTool();
});
