"use strict";

window.addEventListener("DOMContentLoaded", () => {
  const upload = document.getElementById("upload");
  const widthInput = document.getElementById("width");
  const heightInput = document.getElementById("height");
  const centerXInput = document.getElementById("centerX");
  const centerYInput = document.getElementById("centerY");
  const removeBg = document.getElementById("removeBg");
  const bgColor = document.getElementById("bgColor");
  const bgColorRow = document.getElementById("bgColorRow");
  const isoGround = document.getElementById("isoGround");
  const previewCanvas = document.getElementById("previewCanvas");
  const downloadArea = document.getElementById("downloadArea");
  const downloadBtn = document.getElementById("downloadBtn");
  const artUpload = document.getElementById("artUpload");

  let currentImage = null;

  upload.addEventListener("change", handleUpdate);

  widthInput.addEventListener("input", () => {
    centerXInput.value = Math.floor((parseInt(widthInput.value) || 40) / 2);
    processImage();
  });
  heightInput.addEventListener("input", () => {
    centerYInput.value = Math.floor((parseInt(heightInput.value) || 40) / 2);
    processImage();
  });

  [centerXInput, centerYInput].forEach(el => el.addEventListener("input", processImage));
  isoGround.addEventListener("change", processImage);
  removeBg.addEventListener("change", () => {
    bgColorRow.style.display = removeBg.checked ? "flex" : "none";
    processImage();
  });
  bgColor.addEventListener("input", processImage);

  function handleUpdate(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        currentImage = img;
        widthInput.value = img.naturalWidth;
        heightInput.value = img.naturalHeight;
        centerXInput.value = Math.floor(img.naturalWidth / 2);
        centerYInput.value = Math.floor(img.naturalHeight / 2);
        processImage();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function processImage() {
    if (!currentImage) return;

    const targetW = parseInt(widthInput.value) || 40;
    const targetH = parseInt(heightInput.value) || 40;

    previewCanvas.width = targetW;
    previewCanvas.height = targetH;
    previewCanvas.style.width = "200px";
    previewCanvas.style.height = "auto";

    const ctx = previewCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, targetW, targetH);

    if (isoGround.checked) {
      ctx.save();
      ctx.translate(targetW / 2, targetH / 2);
      ctx.scale(1, 0.5);
      ctx.rotate(45 * Math.PI / 180);
      const fit = 0.7;
      ctx.drawImage(currentImage, -(targetW * fit) / 2, -(targetH * fit) / 2, targetW * fit, targetH * fit);
      ctx.restore();
    } else {
      ctx.drawImage(currentImage, 0, 0, targetW, targetH);
    }

    if (removeBg.checked) {
      const hex = bgColor.value;
      const tr = parseInt(hex.slice(1, 3), 16);
      const tg = parseInt(hex.slice(3, 5), 16);
      const tb = parseInt(hex.slice(5, 7), 16);
      const imageData = ctx.getImageData(0, 0, targetW, targetH);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.abs(data[i] - tr) <= 30 && Math.abs(data[i + 1] - tg) <= 30 && Math.abs(data[i + 2] - tb) <= 30) {
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    downloadArea.style.display = "block";
  }

  downloadBtn.onclick = () => {
    exportArcanumAssets(previewCanvas);
  };

  function exportArcanumAssets(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const idata = ctx.getImageData(0, 0, w, h).data;

    const centerX = parseInt(centerXInput.value) || Math.floor(w / 2);
    const centerY = parseInt(centerYInput.value) || Math.floor(h / 2);

    const palette = [{ r: 0, g: 0, b: 0 }];
    const colorCounts = new Map();
    for (let i = 0; i < idata.length; i += 4) {
      const r = idata[i], g = idata[i + 1], b = idata[i + 2];
      if (r === 0 && g === 0 && b === 0) continue;
      const key = `${r},${g},${b}`;
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    }
    const sortedColors = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < Math.min(255, sortedColors.length); i++) {
      const [r, g, b] = sortedColors[i][0].split(",").map(Number);
      palette.push({ r, g, b });
    }
    while (palette.length < 256) palette.push({ r: 0, g: 0, b: 0 });

    const indexedPixels = new Uint8Array(w * h);
    for (let i = 0; i < idata.length; i += 4) {
      const r = idata[i], g = idata[i + 1], b = idata[i + 2];
      let minIndex = 0, minDist = Infinity;
      for (let j = 0; j < 256; j++) {
        const dist = Math.pow(r - palette[j].r, 2) + Math.pow(g - palette[j].g, 2) + Math.pow(b - palette[j].b, 2);
        if (dist < minDist) { minDist = dist; minIndex = j; if (dist === 0) break; }
      }
      indexedPixels[i / 4] = minIndex;
    }

    const head = new Uint32Array(33);
    head[0] = 1; head[1] = 8; head[2] = 8;
    head[3] = 0x0012F9F8;
    head[8] = 1;
    for (let i = 9; i <= 16; i++) head[i] = 0x00AB0210;
    for (let i = 17; i <= 24; i++) head[i] = 0x00000023;
    const artHeader = new Uint8Array(head.buffer);

    const artPalette = new Uint8Array(1024);
    for (let i = 0; i < 256; i++) {
      const off = i * 4;
      artPalette[off] = palette[i].b;
      artPalette[off + 1] = palette[i].g;
      artPalette[off + 2] = palette[i].r;
      artPalette[off + 3] = 0;
    }

    const fInfo = new Int32Array(7);
    fInfo[0] = w; fInfo[1] = h; fInfo[2] = w * h;
    fInfo[3] = centerX; fInfo[4] = centerY; fInfo[5] = 0;
    const frameHeader = new Uint8Array(fInfo.buffer);

    const padding = new Uint8Array(4);
    const artBlob = new Blob([artHeader, artPalette, frameHeader, indexedPixels, padding], { type: "application/octet-stream" });
    downloadFile(artBlob, `item_${w}x${h}.art`);
  }

  artUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => parseAndRenderArt(event.target.result);
    reader.readAsArrayBuffer(file);
  });

  function parseAndRenderArt(arrayBuffer) {
    if (arrayBuffer.byteLength < 1188) {
      alert("Neplatný .art soubor (příliš malý).");
      return;
    }

    const bytes = new Uint8Array(arrayBuffer);
    const dv = new DataView(arrayBuffer);

    const palette = [];
    for (let i = 0; i < 256; i++) {
      const off = 132 + i * 4;
      palette.push([bytes[off + 2], bytes[off + 1], bytes[off]]);
    }

    const w = dv.getInt32(1156, true);
    const h = dv.getInt32(1160, true);
    const centerX = dv.getInt32(1168, true);
    const centerY = dv.getInt32(1172, true);

    if (w <= 0 || h <= 0 || w > 4096 || h > 4096) {
      alert(`Neplatné rozměry v souboru: ${w}×${h}`);
      return;
    }

    const artCanvas = document.getElementById("artCanvas");
    const scale = Math.max(1, Math.floor(200 / Math.max(w, h)));
    artCanvas.width = w;
    artCanvas.height = h;
    artCanvas.style.width = (w * scale) + "px";
    artCanvas.style.height = (h * scale) + "px";

    const ctx = artCanvas.getContext("2d");
    const imageData = ctx.createImageData(w, h);

    for (let i = 0; i < w * h; i++) {
      const idx = bytes[1184 + i];
      const [r, g, b] = palette[idx];
      imageData.data[i * 4] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    document.getElementById("artInfo").textContent = `${w}×${h} px  |  Střed: (${centerX}, ${centerY})`;
    document.getElementById("artPreviewArea").style.display = "block";
  }

  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
});
