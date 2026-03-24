import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

const DEFAULT_PALETTE_COLORS = [
  { name: "Red", color: "#ff0000" },
  { name: "Green", color: "#00ff00" },
  { name: "Blue", color: "#0000ff" },
  { name: "Magenta", color: "#ff00ff" },
  { name: "Yellow", color: "#ffff00" },
  { name: "Cyan", color: "#00ffff" },
  { name: "Black", color: "#000000" },
  { name: "White", color: "#ffffff" },
  { name: "Orange", color: "#ff8800" }
];

const ANALYSIS_EMPTY_ID = 65535;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createDefaultPaletteCanvas() {
  const canvas = document.createElement("canvas");
  const size = 1024;
  const cell = size / 3;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  DEFAULT_PALETTE_COLORS.forEach((entry, index) => {
    const x = (index % 3) * cell;
    const y = Math.floor(index / 3) * cell;
    context.fillStyle = entry.color;
    context.fillRect(x, y, cell, cell);
  });

  return canvas;
}

function buildPaletteFromCanvas(canvas) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const cellWidth = canvas.width / 3;
  const cellHeight = canvas.height / 3;
  const palette = [];

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const sampleX = Math.min(canvas.width - 1, Math.floor(col * cellWidth + cellWidth * 0.5));
      const sampleY = Math.min(canvas.height - 1, Math.floor(row * cellHeight + cellHeight * 0.5));
      const pixel = context.getImageData(sampleX, sampleY, 1, 1).data;

      palette.push({
        id: row * 3 + col,
        name: DEFAULT_PALETTE_COLORS[row * 3 + col]?.name || `Pole ${row * 3 + col + 1}`,
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
        uv: new THREE.Vector2((col + 0.5) / 3, 1 - (row + 0.5) / 3)
      });
    }
  }

  return palette;
}

function createPaletteTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

function createIdentityPaletteRemap() {
  return DEFAULT_PALETTE_COLORS.map((_, index) => index);
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Soubor se nepodařilo načíst."));
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Obrázek se nepodařilo načíst."));
    };
    image.src = url;
  });
}

function imageToCanvas(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  return canvas;
}

function textureToSource(originalTexture, fallbackCanvas = null) {
  const sourceImage = fallbackCanvas !== null ? fallbackCanvas : originalTexture?.image;

  if (!sourceImage) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(sourceImage, 0, 0);

  // Zjistíme rotaci: JEN pro případ, že model PŮVODNĚ NEMĚL texturu
  let needsManualFlip = false; 
  if (!originalTexture) {
    // Pro modely úplně bez textur tipneme formát (GLB se netočí, FBX jo)
    const fileInput = document.getElementById("uv-model-file");
    const fileName = fileInput.files?.[0]?.name || "";
    if (!fileName.toLowerCase().endsWith(".glb")) {
      needsManualFlip = true;
    }
  }

  return {
    canvas,
    context,
    width: canvas.width,
    height: canvas.height,
    data: context.getImageData(0, 0, canvas.width, canvas.height).data,
    transformUv(uv) {
      const transformed = uv.clone();
      
      if (originalTexture) {
        // Tady to zařídí všechno původní ThreeJS! Žádný ruční obrat.
        originalTexture.updateMatrix();
        originalTexture.transformUv(transformed);
      } else if (needsManualFlip) {
        // Tohle zachrání jen naše FBX overridy bez původní textury
        transformed.y = 1 - transformed.y;
      }
      
      return transformed;
    }
  };
}

function cloneImageData(data) {
  return new Uint8ClampedArray(data);
}

function resizeImageDataNearest(source, targetWidth, targetHeight) {
  if (source.width === targetWidth && source.height === targetHeight) {
    return cloneImageData(source.data);
  }

  const result = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(source.height - 1, Math.floor((y / targetHeight) * source.height));
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.floor((x / targetWidth) * source.width));
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      const targetIndex = (y * targetWidth + x) * 4;

      result[targetIndex] = source.data[sourceIndex];
      result[targetIndex + 1] = source.data[sourceIndex + 1];
      result[targetIndex + 2] = source.data[sourceIndex + 2];
      result[targetIndex + 3] = source.data[sourceIndex + 3];
    }
  }

  return result;
}

function blurImageData(data, width, height, radius) {
  if (radius <= 0) {
    return cloneImageData(data);
  }

  let current = cloneImageData(data);

  for (let pass = 0; pass < radius; pass += 1) {
    const next = new Uint8ClampedArray(current.length);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let totalA = 0;
        let count = 0;

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const sampleX = clamp(x + offsetX, 0, width - 1);
            const sampleY = clamp(y + offsetY, 0, height - 1);
            const index = (sampleY * width + sampleX) * 4;

            totalR += current[index];
            totalG += current[index + 1];
            totalB += current[index + 2];
            totalA += current[index + 3];
            count += 1;
          }
        }

        const targetIndex = (y * width + x) * 4;
        next[targetIndex] = Math.round(totalR / count);
        next[targetIndex + 1] = Math.round(totalG / count);
        next[targetIndex + 2] = Math.round(totalB / count);
        next[targetIndex + 3] = Math.round(totalA / count);
      }
    }

    current = next;
  }

  return current;
}

function luminance(color) {
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
}

function normalizeColorForAnalysis(color, settings) {
  const normalized = { ...color };
  const lightness = luminance(normalized);

  if (lightness > 0 && lightness < settings.shadowThreshold) {
    const scale = settings.shadowThreshold / lightness;
    normalized.r = clamp(Math.round(normalized.r * scale), 0, 255);
    normalized.g = clamp(Math.round(normalized.g * scale), 0, 255);
    normalized.b = clamp(Math.round(normalized.b * scale), 0, 255);
  }

  return normalized;
}

function buildKMeansClusters(data, width, height, clusterCount, alphaThreshold) {
  const samples = [];
  const totalPixels = width * height;
  const stride = Math.max(1, Math.floor(Math.sqrt(totalPixels / 5000)));

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < alphaThreshold) {
        continue;
      }

      samples.push([data[index], data[index + 1], data[index + 2]]);
    }
  }

  if (samples.length === 0) {
    return [{ r: 255, g: 255, b: 255 }];
  }

  const centroids = [];
  const actualClusterCount = Math.min(clusterCount, samples.length);
  const step = Math.max(1, Math.floor(samples.length / actualClusterCount));

  for (let index = 0; index < actualClusterCount; index += 1) {
    const sample = samples[Math.min(samples.length - 1, index * step)];
    centroids.push({ r: sample[0], g: sample[1], b: sample[2] });
  }

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const accumulators = centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

    samples.forEach((sample) => {
      let bestIndex = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      for (let centroidIndex = 0; centroidIndex < centroids.length; centroidIndex += 1) {
        const centroid = centroids[centroidIndex];
        const distance =
          (sample[0] - centroid.r) ** 2 +
          (sample[1] - centroid.g) ** 2 +
          (sample[2] - centroid.b) ** 2;

        if (distance < minDistance) {
          minDistance = distance;
          bestIndex = centroidIndex;
        }
      }

      const accumulator = accumulators[bestIndex];
      accumulator.r += sample[0];
      accumulator.g += sample[1];
      accumulator.b += sample[2];
      accumulator.count += 1;
    });

    accumulators.forEach((accumulator, index) => {
      if (accumulator.count === 0) {
        return;
      }

      centroids[index] = {
        r: accumulator.r / accumulator.count,
        g: accumulator.g / accumulator.count,
        b: accumulator.b / accumulator.count
      };
    });
  }

  return centroids;
}

function mergeCloseClusters(clusters, tolerance) {
  if (clusters.length <= 1 || tolerance <= 0) {
    return clusters;
  }

  const merged = [];
  const thresholdSquared = tolerance ** 2;

  clusters.forEach((cluster) => {
    const target = merged.find((entry) => (
      (entry.r - cluster.r) ** 2 +
      (entry.g - cluster.g) ** 2 +
      (entry.b - cluster.b) ** 2
    ) <= thresholdSquared);

    if (!target) {
      merged.push({ ...cluster, samples: 1 });
      return;
    }

    const nextSamples = target.samples + 1;
    target.r = (target.r * target.samples + cluster.r) / nextSamples;
    target.g = (target.g * target.samples + cluster.g) / nextSamples;
    target.b = (target.b * target.samples + cluster.b) / nextSamples;
    target.samples = nextSamples;
  });

  return merged.map(({ samples, ...cluster }) => cluster);
}

function getNearestClusterIndex(color, clusters) {
  let bestIndex = 0;
  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < clusters.length; index += 1) {
    const cluster = clusters[index];
    const distance =
      (color.r - cluster.r) ** 2 +
      (color.g - cluster.g) ** 2 +
      (color.b - cluster.b) ** 2;

    if (distance < minDistance) {
      minDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function cleanupClusterMap(clusterMap, width, height, passes) {
  if (passes <= 0) {
    return clusterMap;
  }

  let current = new Uint16Array(clusterMap);

  for (let pass = 0; pass < passes; pass += 1) {
    const next = new Uint16Array(current);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const counts = new Map();

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const sampleX = clamp(x + offsetX, 0, width - 1);
            const sampleY = clamp(y + offsetY, 0, height - 1);
            const id = current[sampleY * width + sampleX];
            counts.set(id, (counts.get(id) || 0) + 1);
          }
        }

        next[y * width + x] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      }
    }

    current = next;
  }

  return current;
}

function createAnalysisSource(source, settings) {
  if (!source) {
    return null;
  }

  const scale = Math.min(1, settings.analysisSize / Math.max(source.width, source.height));
  const width = Math.max(8, Math.round(source.width * scale));
  const height = Math.max(8, Math.round(source.height * scale));
  const resizedData = resizeImageDataNearest(source, width, height);
  const blurredData = blurImageData(resizedData, width, height, settings.blurRadius);
  const normalizedData = new Uint8ClampedArray(blurredData.length);

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const index = pixelIndex * 4;
    const color = normalizeColorForAnalysis({
      r: blurredData[index],
      g: blurredData[index + 1],
      b: blurredData[index + 2],
      a: blurredData[index + 3]
    }, settings);

    normalizedData[index] = color.r;
    normalizedData[index + 1] = color.g;
    normalizedData[index + 2] = color.b;
    normalizedData[index + 3] = color.a;
  }

  const clusters = buildKMeansClusters(
    normalizedData,
    width,
    height,
    settings.clusterCount,
    settings.alphaThreshold
  );
  const mergedClusters = mergeCloseClusters(clusters, settings.colorTolerance);

  let clusterMap = new Uint16Array(width * height);
  const analysisData = new Uint8ClampedArray(width * height * 4);

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const index = pixelIndex * 4;
    const alpha = normalizedData[index + 3];

    if (alpha < settings.alphaThreshold) {
      clusterMap[pixelIndex] = ANALYSIS_EMPTY_ID;
      analysisData[index + 3] = 0;
      continue;
    }

    const clusterIndex = getNearestClusterIndex(
      { r: normalizedData[index], g: normalizedData[index + 1], b: normalizedData[index + 2] },
      mergedClusters
    );

    clusterMap[pixelIndex] = clusterIndex;
  }

  clusterMap = cleanupClusterMap(clusterMap, width, height, settings.majorityPasses);

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const targetIndex = pixelIndex * 4;
    const clusterIndex = clusterMap[pixelIndex];

    if (clusterIndex === ANALYSIS_EMPTY_ID) {
      analysisData[targetIndex] = 0;
      analysisData[targetIndex + 1] = 0;
      analysisData[targetIndex + 2] = 0;
      analysisData[targetIndex + 3] = 0;
      continue;
    }

    const cluster = mergedClusters[clusterIndex];
    analysisData[targetIndex] = Math.round(cluster.r);
    analysisData[targetIndex + 1] = Math.round(cluster.g);
    analysisData[targetIndex + 2] = Math.round(cluster.b);
    analysisData[targetIndex + 3] = 255;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.putImageData(new ImageData(analysisData, width, height), 0, 0);

  return {
    canvas,
    width,
    height,
    data: analysisData,
    clusterMap,
    clusters: mergedClusters,
    transformUv: source.transformUv
  };
}

function createBakedPaletteCanvas(analysisSource, palette, remap = null) {
  if (!analysisSource) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = analysisSource.width;
  canvas.height = analysisSource.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = context.createImageData(canvas.width, canvas.height);
  const paletteIdMap = new Uint16Array(analysisSource.width * analysisSource.height);

  for (let pixelIndex = 0; pixelIndex < analysisSource.width * analysisSource.height; pixelIndex += 1) {
    const targetIndex = pixelIndex * 4;
    const clusterIndex = analysisSource.clusterMap[pixelIndex];

    if (clusterIndex === ANALYSIS_EMPTY_ID) {
      paletteIdMap[pixelIndex] = ANALYSIS_EMPTY_ID;
      imageData.data[targetIndex + 3] = 0;
      continue;
    }

    const cluster = analysisSource.clusters[clusterIndex];
    const paletteEntry = resolvePaletteEntry(getNearestPaletteEntry(cluster, palette), palette, remap);
    paletteIdMap[pixelIndex] = paletteEntry.id;

    imageData.data[targetIndex] = paletteEntry.r;
    imageData.data[targetIndex + 1] = paletteEntry.g;
    imageData.data[targetIndex + 2] = paletteEntry.b;
    imageData.data[targetIndex + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  return {
    canvas,
    paletteIdMap,
    width: analysisSource.width,
    height: analysisSource.height,
    transformUv: analysisSource.transformUv
  };
}

function getNearestPaletteEntry(color, palette) {
  let bestEntry = palette[0];
  let minDistance = Number.POSITIVE_INFINITY;

  palette.forEach((entry) => {
    const distance =
      (color.r - entry.r) ** 2 +
      (color.g - entry.g) ** 2 +
      (color.b - entry.b) ** 2;

    if (distance < minDistance) {
      minDistance = distance;
      bestEntry = entry;
    }
  });

  return bestEntry;
}

function resolvePaletteEntry(entry, palette, remap) {
  const remappedId = remap?.[entry.id] ?? entry.id;
  return palette.find((candidate) => candidate.id === remappedId) || entry;
}

function generateBarycentricSamples(divisions) {
  const samples = [];

  for (let a = 0; a <= divisions; a += 1) {
    for (let b = 0; b <= divisions - a; b += 1) {
      const u = a / divisions;
      const v = b / divisions;
      const w = 1 - u - v;
      samples.push([u, v, w]);
    }
  }

  samples.push([1 / 3, 1 / 3, 1 / 3]);
  return samples;
}

function interpolateUv(uv0, uv1, uv2, barycentric) {
  const [u, v, w] = barycentric;
  return new THREE.Vector2(
    uv0.x * w + uv1.x * u + uv2.x * v,
    uv0.y * w + uv1.y * u + uv2.y * v
  );
}

function sampleClusterIndex(source, uv) {
  const x = Math.min(source.width - 1, Math.max(0, Math.floor(uv.x * (source.width - 1))));
  const y = Math.min(source.height - 1, Math.max(0, Math.floor(uv.y * (source.height - 1))));
  return source.clusterMap[y * source.width + x];
}

function samplePaletteId(source, uv) {
  const x = Math.min(source.width - 1, Math.max(0, Math.floor(uv.x * (source.width - 1))));
  const y = Math.min(source.height - 1, Math.max(0, Math.floor(uv.y * (source.height - 1))));
  return source.paletteIdMap[y * source.width + x];
}

function materialIndexForTriangle(groups, vertexIndex) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return 0;
  }

  return groups.find((group) => vertexIndex >= group.start && vertexIndex < group.start + group.count)?.materialIndex || 0;
}

function triangleUvArea(uv0, uv1, uv2) {
  return Math.abs(
    (uv1.x - uv0.x) * (uv2.y - uv0.y) -
    (uv2.x - uv0.x) * (uv1.y - uv0.y)
  ) * 0.5;
}

function sampleTrianglePaletteCoverage(uv0, uv1, uv2, bakedSource, settings) {
  const fallbackId = settings.fallbackId;

  if (!bakedSource) {
    return {
      dominantId: fallbackId,
      uniqueColorCount: 1,
      confidence: 0,
      usedFallback: true,
      shouldSubdivide: false
    };
  }

  const divisions = Math.max(4, settings.sampleDensity + 2);
  const samples = generateBarycentricSamples(divisions);
  const counts = new Map();
  let usedSamples = 0;

  samples.forEach((sample) => {
    const uv = interpolateUv(uv0, uv1, uv2, sample);
    const transformedUv = bakedSource.transformUv(uv);
    const paletteId = samplePaletteId(bakedSource, transformedUv);

    if (paletteId === ANALYSIS_EMPTY_ID) {
      return;
    }

    counts.set(paletteId, (counts.get(paletteId) || 0) + 1);
    usedSamples += 1;
  });

  if (usedSamples === 0 || counts.size === 0) {
    return {
      dominantId: fallbackId,
      uniqueColorCount: 1,
      confidence: 0,
      usedFallback: true,
      shouldSubdivide: false
    };
  }

  const sortedCounts = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  const dominantId = sortedCounts[0][0];
  const dominantShare = sortedCounts[0][1] / usedSamples;
  const secondaryShare = sortedCounts[1] ? sortedCounts[1][1] / usedSamples : 0;

  return {
    dominantId,
    uniqueColorCount: counts.size,
    confidence: dominantShare,
    usedFallback: false,
    shouldSubdivide: counts.size > 1 && secondaryShare > settings.edgeTolerance
  };
}

function createVertexRecord(geometry, index) {
  const attributes = {};

  Object.entries(geometry.attributes).forEach(([name, attribute]) => {
    const itemSize = attribute.itemSize;
    const values = new Array(itemSize);

    for (let component = 0; component < itemSize; component += 1) {
      values[component] = attribute.array[index * itemSize + component];
    }

    attributes[name] = values;
  });

  return attributes;
}

function cloneVertexRecord(record) {
  const clone = {};

  Object.entries(record).forEach(([name, values]) => {
    clone[name] = values.slice();
  });

  return clone;
}

function lerpVertexRecord(left, right, alpha) {
  const result = {};

  Object.keys(left).forEach((name) => {
    const leftValues = left[name];
    const rightValues = right[name];
    result[name] = leftValues.map((value, index) => value + (rightValues[index] - value) * alpha);
  });

  return result;
}

function getVertexUv(record) {
  const uv = record.uv || [0.5, 0.5];
  return new THREE.Vector2(uv[0], uv[1]);
}

function createTriangleRecord(geometry, startIndex, materialIndex) {
  return {
    materialIndex,
    vertices: [
      createVertexRecord(geometry, startIndex),
      createVertexRecord(geometry, startIndex + 1),
      createVertexRecord(geometry, startIndex + 2)
    ]
  };
}

function splitTriangleIntoFour(triangle) {
  const [a, b, c] = triangle.vertices;
  const ab = lerpVertexRecord(a, b, 0.5);
  const bc = lerpVertexRecord(b, c, 0.5);
  const ca = lerpVertexRecord(c, a, 0.5);

  return [
    { materialIndex: triangle.materialIndex, vertices: [cloneVertexRecord(a), ab, ca] },
    { materialIndex: triangle.materialIndex, vertices: [ab, cloneVertexRecord(b), bc] },
    { materialIndex: triangle.materialIndex, vertices: [ca, bc, cloneVertexRecord(c)] },
    { materialIndex: triangle.materialIndex, vertices: [ab, bc, ca] }
  ];
}

function buildAdaptiveSubmeshGeometry(sourceMesh, geometry, bakedSources, groups, settings, palette) {
  const attributeMeta = Object.entries(geometry.attributes).map(([name, attribute]) => ({
    name,
    itemSize: attribute.itemSize,
    arrayType: attribute.array.constructor,
    normalized: attribute.normalized
  }));
  const attributeBuckets = Object.fromEntries(attributeMeta.map((meta) => [meta.name, []]));
  const groupBuckets = new Map();
  const queue = [];
  const stats = {
    originalTriangles: geometry.getAttribute("uv").count / 3,
    generatedTriangles: 0,
    splitTriangles: 0,
    fallbackTriangles: 0,
    skipped: false,
    confidenceTotal: 0
  };

  if (sourceMesh.isSkinnedMesh) {
    stats.skipped = true;
    return { geometry: geometry.clone(), stats };
  }

  for (let vertexIndex = 0; vertexIndex < geometry.getAttribute("uv").count; vertexIndex += 3) {
    queue.push({
      triangle: createTriangleRecord(geometry, vertexIndex, materialIndexForTriangle(groups, vertexIndex)),
      depth: 0
    });
  }

  while (queue.length > 0) {
    const current = queue.shift();
    const { triangle, depth } = current;
    const [va, vb, vc] = triangle.vertices;
    const uv0 = getVertexUv(va);
    const uv1 = getVertexUv(vb);
    const uv2 = getVertexUv(vc);
    const bakedSource = bakedSources[triangle.materialIndex] || bakedSources[0] || null;
    const coverage = sampleTrianglePaletteCoverage(uv0, uv1, uv2, bakedSource, settings);
    const uvAreaPixels = triangleUvArea(uv0, uv1, uv2) * settings.analysisSize * settings.analysisSize;

    const canSplit =
      !coverage.usedFallback &&
      coverage.shouldSubdivide &&
      depth < settings.submeshMaxDepth &&
      uvAreaPixels > settings.submeshMinArea &&
      stats.generatedTriangles + queue.length + 4 <= settings.submeshBudget;

    if (canSplit) {
      stats.splitTriangles += 1;
      splitTriangleIntoFour(triangle).forEach((subTriangle) => {
        queue.push({ triangle: subTriangle, depth: depth + 1 });
      });
      continue;
    }

    const paletteEntry = palette.find((entry) => entry.id === coverage.dominantId)
      || palette.find((entry) => entry.id === settings.fallbackId)
      || palette[0];

    triangle.vertices.forEach((vertex) => {
      const outputVertex = cloneVertexRecord(vertex);
      outputVertex.uv = [paletteEntry.uv.x, paletteEntry.uv.y];

      attributeMeta.forEach((meta) => {
        attributeBuckets[meta.name].push(...outputVertex[meta.name]);
      });
    });

    stats.generatedTriangles += 1;
    stats.confidenceTotal += coverage.confidence;

    if (coverage.usedFallback) {
      stats.fallbackTriangles += 1;
    }

    groupBuckets.set(
      triangle.materialIndex,
      (groupBuckets.get(triangle.materialIndex) || 0) + 3
    );
  }

  const adaptiveGeometry = new THREE.BufferGeometry();

  attributeMeta.forEach((meta) => {
    const array = new meta.arrayType(attributeBuckets[meta.name]);
    adaptiveGeometry.setAttribute(meta.name, new THREE.BufferAttribute(array, meta.itemSize, meta.normalized));
  });

  adaptiveGeometry.clearGroups();
  let groupStart = 0;
  [...groupBuckets.entries()]
    .sort((left, right) => left[0] - right[0])
    .forEach(([materialIndex, count]) => {
      adaptiveGeometry.addGroup(groupStart, count, materialIndex);
      groupStart += count;
    });

  adaptiveGeometry.computeBoundingBox();
  adaptiveGeometry.computeBoundingSphere();

  if (adaptiveGeometry.getAttribute("normal")) {
    adaptiveGeometry.computeVertexNormals();
  }

  return { geometry: adaptiveGeometry, stats };
}

function getVertexPosition(record) {
  const position = record.position || [0, 0, 0];
  return new THREE.Vector3(position[0], position[1], position[2]);
}

function triangleCentroid(positions) {
  return new THREE.Vector3()
    .add(positions[0])
    .add(positions[1])
    .add(positions[2])
    .multiplyScalar(1 / 3);
}

function triangleNormal(positions) {
  const ab = new THREE.Vector3().subVectors(positions[1], positions[0]);
  const ac = new THREE.Vector3().subVectors(positions[2], positions[0]);
  const normal = new THREE.Vector3().crossVectors(ab, ac);

  if (normal.lengthSq() === 0) {
    return new THREE.Vector3(0, 1, 0);
  }

  return normal.normalize();
}

function quantizePositionKey(position, precision = 1000) {
  return [
    Math.round(position.x * precision),
    Math.round(position.y * precision),
    Math.round(position.z * precision)
  ].join(":");
}

function makeEdgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function buildPlanarCleanupGeometry(sourceMesh, geometry, bakedSources, groups, settings, palette) {
  const uvs = geometry.getAttribute("uv");
  const triangleCount = uvs.count / 3;
  const triangles = [];
  const edgeMap = new Map();
  const neighbors = Array.from({ length: triangleCount }, () => new Set());
  const cosineThreshold = Math.cos(THREE.MathUtils.degToRad(settings.planarNormalTolerance));
  const stats = {
    originalTriangles: triangleCount,
    generatedTriangles: triangleCount,
    fallbackTriangles: 0,
    skipped: false,
    confidenceTotal: 0,
    cleanedRegions: 0,
    reassignedTriangles: 0
  };

  if (sourceMesh.isSkinnedMesh) {
    stats.skipped = true;
    return { geometry: geometry.clone(), stats };
  }

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const vertexIndex = triangleIndex * 3;
    const materialIndex = materialIndexForTriangle(groups, vertexIndex);
    const vertices = [
      createVertexRecord(geometry, vertexIndex),
      createVertexRecord(geometry, vertexIndex + 1),
      createVertexRecord(geometry, vertexIndex + 2)
    ];
    const positions = vertices.map(getVertexPosition);
    const uv0 = getVertexUv(vertices[0]);
    const uv1 = getVertexUv(vertices[1]);
    const uv2 = getVertexUv(vertices[2]);
    const bakedSource = bakedSources[materialIndex] || bakedSources[0] || null;
    const coverage = sampleTrianglePaletteCoverage(uv0, uv1, uv2, bakedSource, settings);
    const centroid = triangleCentroid(positions);
    const normal = triangleNormal(positions);
    const planeDistance = normal.dot(centroid);
    const vertexKeys = positions.map((position) => quantizePositionKey(position));

    triangles.push({
      triangleIndex,
      materialIndex,
      vertices,
      positions,
      centroid,
      normal,
      planeDistance,
      paletteId: coverage.dominantId,
      confidence: coverage.confidence,
      usedFallback: coverage.usedFallback
    });

    for (let edgeIndex = 0; edgeIndex < 3; edgeIndex += 1) {
      const edgeKey = makeEdgeKey(vertexKeys[edgeIndex], vertexKeys[(edgeIndex + 1) % 3]);
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, []);
      }
      edgeMap.get(edgeKey).push(triangleIndex);
    }
  }

  edgeMap.forEach((triangleIndices) => {
    if (triangleIndices.length < 2) {
      return;
    }

    for (let index = 0; index < triangleIndices.length; index += 1) {
      for (let next = index + 1; next < triangleIndices.length; next += 1) {
        neighbors[triangleIndices[index]].add(triangleIndices[next]);
        neighbors[triangleIndices[next]].add(triangleIndices[index]);
      }
    }
  });

  const visited = new Uint8Array(triangleCount);

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    if (visited[triangleIndex]) {
      continue;
    }

    const seed = triangles[triangleIndex];
    const region = [];
    const queue = [triangleIndex];
    visited[triangleIndex] = 1;
    const paletteCounts = new Map();

    while (queue.length > 0) {
      const currentIndex = queue.shift();
      const current = triangles[currentIndex];
      region.push(current);
      paletteCounts.set(current.paletteId, (paletteCounts.get(current.paletteId) || 0) + 1);

      if (region.length >= settings.planarMaxRegionSize) {
        continue;
      }

      neighbors[currentIndex].forEach((neighborIndex) => {
        if (visited[neighborIndex]) {
          return;
        }

        const neighbor = triangles[neighborIndex];
        const normalSimilarity = current.normal.dot(neighbor.normal);
        const planeDelta = Math.abs(seed.normal.dot(neighbor.centroid) - seed.planeDistance);
        const samePalette = neighbor.paletteId === seed.paletteId;
        const rescueTriangle = neighbor.confidence < settings.planarRescueConfidence;

        if (
          neighbor.materialIndex !== seed.materialIndex ||
          normalSimilarity < cosineThreshold ||
          planeDelta > settings.planarDistanceTolerance ||
          (!samePalette && !rescueTriangle)
        ) {
          return;
        }

        visited[neighborIndex] = 1;
        queue.push(neighborIndex);
      });
    }

    // ... (tady nahoře končí while (queue.length > 0) cyklus)

    const dominantPaletteId = [...paletteCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? seed.paletteId;

    if (region.length > 1) {
      stats.cleanedRegions += 1;
    }

    region.forEach((triangle) => {
      if (triangle.paletteId !== dominantPaletteId) {
        stats.reassignedTriangles += 1;
      }
      
      // Přiřadíme barvu celému regionu
      triangle.paletteId = dominantPaletteId;
      
      // ZMĚNA: UV souřadnice tady zatím nevyplňujeme. Necháme to až po topologickém vyhlazení!
    });
  } // <-- Tady končí hlavní cyklus `for (let triangleIndex = 0...`

  // ----------------------------------------------------------------------
  // NOVINKA: 3D Topologické vyhlazení (Majority Vote na úrovni meshů)
  // ----------------------------------------------------------------------
  // Použijeme hodnotu ze slideru "Cleanup průchodů" a přidáme 1 defaultní, 
  // aby to automaticky "sežralo" to nejhorší smetí i na nule.
  const topologyPasses = settings.majorityPasses + 1; 

  let currentPaletteIds = new Uint16Array(triangleCount);
  for (let i = 0; i < triangleCount; i += 1) {
    currentPaletteIds[i] = triangles[i].paletteId;
  }

  for (let pass = 0; pass < topologyPasses; pass += 1) {
    const nextPaletteIds = new Uint16Array(currentPaletteIds);
    let changed = false;

    for (let i = 0; i < triangleCount; i += 1) {
      const neighborSet = neighbors[i];
      if (neighborSet.size === 0) continue;

      const counts = new Map();
      // Přidáme vlastní barvu s malou vahou (1), abychom neblikali tam a zpět
      counts.set(currentPaletteIds[i], 1);

      neighborSet.forEach((nIndex) => {
        const pid = currentPaletteIds[nIndex];
        counts.set(pid, (counts.get(pid) || 0) + 1);
      });

      let maxCount = 0;
      let bestId = currentPaletteIds[i];

      // Kdo má v sousedství nejvíc hlasů?
      counts.forEach((count, pid) => {
        if (count > maxCount) {
          maxCount = count;
          bestId = pid;
        }
      });

      // Změníme barvu trojúhelníku, pokud ho sousedi jasně převálcovali
      if (bestId !== currentPaletteIds[i]) {
        nextPaletteIds[i] = bestId;
        changed = true;
      }
    }

    currentPaletteIds = nextPaletteIds;
    // Pokud se v tomto průchodu už nic nezměnilo, můžeme skončit dřív a ušetřit výkon
    if (!changed) break; 
  }

  // ----------------------------------------------------------------------
  // FINÁLNÍ ZÁPIS: Proměněné barvy zapíšeme zpět a aplikujeme UV
  // ----------------------------------------------------------------------
  
  // 1. Zjistíme globální velikost a střed všech původních UVček na modelu
  const originalUvs = geometry.getAttribute("uv");
  let minUvX = Infinity, minUvY = Infinity, maxUvX = -Infinity, maxUvY = -Infinity;
  for (let i = 0; i < originalUvs.count; i += 1) {
    minUvX = Math.min(minUvX, originalUvs.getX(i));
    minUvY = Math.min(minUvY, originalUvs.getY(i));
    maxUvX = Math.max(maxUvX, originalUvs.getX(i));
    maxUvY = Math.max(maxUvY, originalUvs.getY(i));
  }
  
  const sizeX = maxUvX - minUvX;
  const sizeY = maxUvY - minUvY;
  const maxSize = Math.max(sizeX, sizeY) || 1;
  const centerX = minUvX + sizeX / 2;
  const centerY = minUvY + sizeY / 2;
  
  // 2. Vypočítáme bezpečné měřítko (buňka má 33.3 %, my použijeme cca 28 % a zbytek bude padding)
  const safeArea = (1 / 3) * 0.85; 
  const globalUvScale = safeArea / maxSize;

  triangles.forEach((triangle, i) => {
    triangle.paletteId = currentPaletteIds[i];
    
    const finalEntry = palette.find((entry) => entry.id === triangle.paletteId)
      || palette.find((entry) => entry.id === settings.fallbackId)
      || palette[0];

    triangle.vertices.forEach((vertex) => {
      const uv = vertex.uv || [0.5, 0.5];
      // 3. Posuneme UV do středu buňky a aplikujeme globální zmenšení.
      // Tím se zachová původní tvar i proporce celého UV layoutu!
      const mappedX = finalEntry.uv.x + (uv[0] - centerX) * globalUvScale;
      const mappedY = finalEntry.uv.y + (uv[1] - centerY) * globalUvScale;
      vertex.uv = [mappedX, mappedY];
    });
  });

  const cleanedGeometry = geometry.clone();
  const cleanedUvs = cleanedGeometry.getAttribute("uv");

  triangles.forEach((triangle) => {
    triangle.vertices.forEach((vertex, vertexOffset) => {
      const uv = vertex.uv || [0.5, 0.5];
      cleanedUvs.setXY(triangle.triangleIndex * 3 + vertexOffset, uv[0], uv[1]);
    });

    stats.confidenceTotal += triangle.confidence;
    if (triangle.usedFallback) {
      stats.fallbackTriangles += 1;
    }
  });

  cleanedUvs.needsUpdate = true;
  cleanedGeometry.computeBoundingBox();
  cleanedGeometry.computeBoundingSphere();

  return { geometry: cleanedGeometry, stats };
}

function formatPercent(value) {
  return `${Math.round(value * 100)} %`;
}

function initUvPaletteMapper() {
  if (document.body.dataset.page !== "tool-uv-mapper") {
    return;
  }

  const stage = document.getElementById("uv-mapper-stage");
  const modelInput = document.getElementById("uv-model-file");
  const fallbackTextureInput = document.getElementById("uv-fallback-texture");
  const paletteInput = document.getElementById("uv-palette-file");
  const forceTextureInput = document.getElementById("uv-force-texture");
  const workflowInput = document.getElementById("uv-workflow");
  const modeInput = document.getElementById("uv-mode");
  const densityInput = document.getElementById("uv-density");
  const alphaThresholdInput = document.getElementById("uv-alpha-threshold");
  const analysisSizeInput = document.getElementById("uv-analysis-size");
  const clusterCountInput = document.getElementById("uv-cluster-count");
  const blurRadiusInput = document.getElementById("uv-blur-radius");
  const majorityPassesInput = document.getElementById("uv-majority-passes");
  const colorToleranceInput = document.getElementById("uv-color-tolerance");
  const shadowThresholdInput = document.getElementById("uv-shadow-threshold");
  const submeshDepthInput = document.getElementById("uv-submesh-depth");
  const submeshToleranceInput = document.getElementById("uv-submesh-tolerance");
  const submeshMinAreaInput = document.getElementById("uv-submesh-min-area");
  const submeshBudgetInput = document.getElementById("uv-submesh-budget");
  const planarNormalInput = document.getElementById("uv-planar-normal");
  const planarDistanceInput = document.getElementById("uv-planar-distance");
  const planarRegionInput = document.getElementById("uv-planar-region");
  const planarRescueInput = document.getElementById("uv-planar-rescue");
  const statusEl = document.getElementById("uv-status");
  const processButton = document.getElementById("uv-process-btn");
  const resetButton = document.getElementById("uv-reset-btn");
  const exportButton = document.getElementById("uv-export-btn");
  const exportPngButton = document.getElementById("uv-export-png-btn");
  const reportButton = document.getElementById("uv-report-btn");
  const reportPreview = document.getElementById("uv-report-preview");
  const palettePreview = document.getElementById("uv-palette-preview");
  const analysisPreview = document.getElementById("uv-analysis-preview");
  const secondaryPanel = analysisPreview?.closest(".uv-mapper-card")?.parentElement || null;

  const statMeshes = document.getElementById("uv-stat-meshes");
  const statTriangles = document.getElementById("uv-stat-triangles");
  const statFallback = document.getElementById("uv-stat-fallback");
  const statConfidence = document.getElementById("uv-stat-confidence");
  const rangeInputs = [
    densityInput,
    alphaThresholdInput,
    analysisSizeInput,
    clusterCountInput,
    blurRadiusInput,
    majorityPassesInput,
    colorToleranceInput,
    shadowThresholdInput,
    planarNormalInput,
    planarDistanceInput,
    planarRegionInput,
    planarRescueInput
  ];
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(stage.clientWidth || 720, stage.clientHeight || 520, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090807);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(2.8, 2.2, 4.8);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.8, 0);
  controls.screenSpacePanning = true;

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  const mainLight = new THREE.DirectionalLight(0xf5dfbe, 1.8);
  mainLight.position.set(6, 8, 4);
  scene.add(mainLight);

  const rimLight = new THREE.DirectionalLight(0x5cffc0, 0.55);
  rimLight.position.set(-4, 2, -6);
  scene.add(rimLight);

  const grid = new THREE.GridHelper(10, 20, 0x5f553f, 0x28231e);
  grid.position.y = -1.4;
  scene.add(grid);

  const basePaletteCanvas = createDefaultPaletteCanvas();
  let paletteCanvas = basePaletteCanvas;
  let palette = buildPaletteFromCanvas(paletteCanvas);
  let paletteTexture = createPaletteTexture(paletteCanvas);
  let sourceRoot = null;
  let previewRoot = null;
  let fallbackTextureCanvas = null;
  let lastReport = null;
  let lastAnalysisCanvas = null;
  let lastBakedCanvas = null;
  let paletteRemap = createIdentityPaletteRemap();
 const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let colorPickerPopup = null;
  let pickedCurrentId = null;

  // Funkce, která vyrobí to plovoucí okýnko s 9 barvami
  // Funkce, která vyrobí to plovoucí okýnko s 9 barvami
  function buildColorPickerPopup() {
    colorPickerPopup = document.createElement("div");
    Object.assign(colorPickerPopup.style, {
      position: "fixed",
      display: "none",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "4px",
      background: "#1a1a1a",
      padding: "8px",
      borderRadius: "8px",
      border: "1px solid #333",
      zIndex: 1000,
      boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
    });

    // HACK: Vizuální prohození horní a dolní řady
    // Klíče jsou logická ID, hodnoty jsou ID barev, které chceme ukázat očím.
    const visualMap = {
      0: 6, // target 0 (Red) se vykreslí jako Black
      1: 7, // target 1 (Green) se vykreslí jako White
      2: 8, // target 2 (Blue) se vykreslí jako Orange
      3: 3, // Magenta zůstává
      4: 4, // Yellow zůstává
      5: 5, // Cyan zůstává
      6: 0, // target 6 (Black) se vykreslí jako Red
      7: 1, // target 7 (White) se vykreslí jako Green
      8: 2  // target 8 (Orange) se vykreslí jako Blue
    };

    // Vygenerujeme tlačítka pro každou barvu v paletě
    DEFAULT_PALETTE_COLORS.forEach((color, targetId) => {
      // Vytáhneme si barvu, kterou reálně chceme ukázat
      const visualColorHex = DEFAULT_PALETTE_COLORS[visualMap[targetId]].color;

      const btn = document.createElement("button");
      Object.assign(btn.style, {
        width: "32px",
        height: "32px",
        background: visualColorHex, // Tady aplikujeme náš vizuální hack
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "4px",
        cursor: "pointer"
      });

      // Co se stane, když vybereš novou barvu (logika pracuje s původním targetId!)
      btn.addEventListener("click", () => {
        if (pickedCurrentId !== null) {
          // Najdeme všechny barvy, které se teď mapují na to, na co jsi kliknul, a přepíšeme je na novou
          for (let originalId = 0; originalId < paletteRemap.length; originalId += 1) {
            if (paletteRemap[originalId] === pickedCurrentId) {
              paletteRemap[originalId] = targetId;
              
              // Rovnou aktualizujeme i ten postranní panel, ať je to synchro
              const selects = document.querySelectorAll(".uv-remap-select");
              if (selects[originalId]) {
                selects[originalId].value = targetId;
              }
            }
          }
          colorPickerPopup.style.display = "none";
          setStatus("Aplikuju novou barvu na model...", "success");
          window.setTimeout(processSourceModel, 24); // Spustí remap
        }
      });

      colorPickerPopup.appendChild(btn);
    });

    document.body.appendChild(colorPickerPopup);

    // Zavření okýnka při kliknutí jinam
    window.addEventListener("pointerdown", (e) => {
      if (e.target.closest("#uv-mapper-stage") === null && e.target.closest("div") !== colorPickerPopup) {
        colorPickerPopup.style.display = "none";
      }
    });
  }

  buildColorPickerPopup();

  // Událost kliknutí přímo do 3D scény
  stage.addEventListener("pointerdown", (event) => {
    // Reagovat jen na levé tlačítko a jen když je hotový model
    if (event.button !== 0 || !previewRoot || exportButton.disabled) {
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(previewRoot, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const uv = hit.uv;

      if (!uv) {
        return;
      }

      // Zjistíme, jaká je to teď barva podle UV souřadnice faceu
      let nearestDist = Number.POSITIVE_INFINITY;
      let nearestId = 0;

      palette.forEach((entry) => {
        const dist = uv.distanceToSquared(entry.uv);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestId = entry.id;
        }
      });

      pickedCurrentId = nearestId; // Zapamatujeme si, na co se kliklo

      // Otevřeme plovoucí paletu kousek od kurzoru
      colorPickerPopup.style.display = "grid";
      colorPickerPopup.style.left = `${event.clientX + 15}px`;
      colorPickerPopup.style.top = `${event.clientY + 15}px`;
    } else {
      colorPickerPopup.style.display = "none";
    }
  });
  function drawPalettePreview() {
    const context = palettePreview.getContext("2d");
    context.clearRect(0, 0, palettePreview.width, palettePreview.height);
    context.drawImage(paletteCanvas, 0, 0, palettePreview.width, palettePreview.height);
  }

  function drawAnalysisPreview(canvas = null) {
    const context = analysisPreview.getContext("2d");
    context.clearRect(0, 0, analysisPreview.width, analysisPreview.height);

    if (!canvas) {
      context.fillStyle = "rgba(255,255,255,0.05)";
      context.fillRect(0, 0, analysisPreview.width, analysisPreview.height);
      return;
    }

    context.save();
    context.translate(0, analysisPreview.height);
    context.scale(1, -1);
    context.drawImage(canvas, 0, 0, analysisPreview.width, analysisPreview.height);
    context.restore();
  }

  function buildRemapControls() {
    if (!secondaryPanel) {
      return;
    }

    const previousPanel = document.getElementById("uv-remap-panel");
    if (previousPanel) {
      previousPanel.remove();
    }

    const panel = document.createElement("article");
    panel.className = "uv-mapper-card uv-remap-panel";
    panel.id = "uv-remap-panel";

    const title = document.createElement("p");
    title.className = "uv-mapper-card__label";
    title.textContent = "Paletovy remap";
    panel.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "uv-remap-grid";

    DEFAULT_PALETTE_COLORS.forEach((entry, index) => {
      const row = document.createElement("label");
      row.className = "uv-remap-row";

      const label = document.createElement("span");
      label.className = "uv-remap-label";
      label.textContent = entry.name;

      const select = document.createElement("select");
      select.className = "uv-remap-select";

      DEFAULT_PALETTE_COLORS.forEach((target, targetIndex) => {
        const option = document.createElement("option");
        option.value = String(targetIndex);
        option.textContent = target.name;
        option.selected = paletteRemap[index] === targetIndex;
        select.appendChild(option);
      });

      select.addEventListener("change", () => {
        paletteRemap[index] = Number(select.value);
        if (sourceRoot) {
          setStatus("Paletovy remap je zmeneny. Spust znovu premapovani, aby se propsal do modelu.", "success");
        }
      });

      row.append(label, select);
      grid.appendChild(row);
    });

    panel.appendChild(grid);
    secondaryPanel.insertBefore(panel, reportPreview.closest(".uv-mapper-card"));
  }

  function setStatus(message, tone = "default") {
    statusEl.textContent = message;
    statusEl.classList.remove("tool-workbench__status--warning", "tool-workbench__status--success");

    if (tone === "warning") {
      statusEl.classList.add("tool-workbench__status--warning");
    }

    if (tone === "success") {
      statusEl.classList.add("tool-workbench__status--success");
    }
  }

  function setReportPreview(report) {
    if (!report) {
      reportPreview.textContent = "Čekám na zpracování...";
      return;
    }

    reportPreview.textContent = JSON.stringify({
      format: report.format,
      workflow: report.settings.workflow,
      meshes: report.meshCount,
      triangles: report.totalTriangles,
      remapped: report.remappedTriangles,
      fallbackTriangles: report.fallbackTriangles,
      skippedMeshes: report.skippedMeshes,
      averageConfidence: Number(report.averageConfidence.toFixed(3)),
      analysisSize: report.settings.analysisSize,
      clusters: report.settings.clusterCount,
      blur: report.settings.blurRadius
      ,
      tolerance: report.settings.colorTolerance,
      shadowLift: report.settings.shadowThreshold,
      submeshDepth: report.settings.submeshMaxDepth,
      submeshTolerance: report.settings.edgeTolerance,
      submeshMinArea: report.settings.submeshMinArea,
      submeshBudget: report.settings.submeshBudget,
      adaptiveSplits: report.adaptiveSplits || 0,
      planarRegions: report.planarRegions || 0,
      planarReassigned: report.planarReassigned || 0,
      planarNormalTolerance: report.settings.planarNormalTolerance,
      planarDistanceTolerance: report.settings.planarDistanceTolerance,
      planarMaxRegionSize: report.settings.planarMaxRegionSize,
      planarRescueConfidence: report.settings.planarRescueConfidence
    }, null, 2);
  }

  function updateStats(report = null) {
    statMeshes.textContent = report ? String(report.meshCount) : "0";
    statTriangles.textContent = report ? String(report.totalTriangles) : "0";
    statFallback.textContent = report ? String(report.fallbackTriangles) : "0";
    statConfidence.textContent = report ? formatPercent(report.averageConfidence) : "0 %";
    setReportPreview(report);
  }

  function disposePreviewRoot() {
    if (!previewRoot) {
      return;
    }

    scene.remove(previewRoot);
    previewRoot.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material?.dispose?.());
        } else {
          child.material?.dispose?.();
        }
      }
    });
    previewRoot = null;
  }

  function frameObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const center = sphere.center.clone();
    const radius = sphere.radius || 2;
    const aspect = Math.max(1, renderer.domElement.clientWidth / Math.max(renderer.domElement.clientHeight, 1));
    const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const verticalDistance = radius / Math.tan(halfFov);
    const horizontalDistance = radius / (Math.tan(halfFov) * aspect);
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.35;

    controls.target.copy(center);
    camera.position.copy(center.clone().add(new THREE.Vector3(distance * 0.72, distance * 0.48, distance)));
    camera.near = Math.max(0.01, radius / 100);
    camera.far = Math.max(100, radius * 18);
    camera.updateProjectionMatrix();
    controls.update();
  }

  function updateRangeValue(input) {
    const valueEl = input?.parentElement?.querySelector(".tool-workbench__range-value");

    if (!input || !valueEl) {
      return;
    }

    valueEl.textContent = input.value;
  }

  function createPreviewMaterial(sourceMesh) {
    const baseMaterial = Array.isArray(sourceMesh.material) ? sourceMesh.material[0] : sourceMesh.material;
    const material = new THREE.MeshStandardMaterial({
      map: paletteTexture,
      metalness: 0,
      roughness: 0.92,
      side: baseMaterial?.side ?? THREE.DoubleSide
    });

    if (sourceMesh.isSkinnedMesh) {
      material.skinning = true;
    }

    return material;
  }

  function createPreviewMaterialWithMap(sourceMesh, mapTexture) {
    const baseMaterial = Array.isArray(sourceMesh.material) ? sourceMesh.material[0] : sourceMesh.material;
    const material = new THREE.MeshStandardMaterial({
      map: mapTexture,
      metalness: 0,
      roughness: 0.92,
      side: baseMaterial?.side ?? THREE.DoubleSide,
      transparent: baseMaterial?.transparent ?? false,
      alphaTest: baseMaterial?.alphaTest ?? 0
    });

    if (sourceMesh.isSkinnedMesh) {
      material.skinning = true;
    }

    return material;
  }

  function cloneOriginalForPreview(root) {
    const clone = root.clone(true);

    clone.traverse((child) => {
      if (child.isMesh) {
        child.geometry = child.geometry.clone();
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => material.clone())
          : child.material.clone();
      }
    });

    return clone;
  }

  function resizeRenderer() {
    const width = stage.clientWidth || 720;
    const height = stage.clientHeight || 520;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if (previewRoot) {
      frameObject(previewRoot);
    }
  }

  function assignRemapIds(root) {
    let meshIndex = 0;

    root.traverse((child) => {
      if (child.isMesh) {
        child.userData.remapId = `mesh-${meshIndex}`;
        meshIndex += 1;
      }
    });
  }

  function normalizeLoadedRoot(root) {
    // Tady už žádné škálování ani centrování neděláme, 
    // aby si model do exportu zachoval transformaci 1, 1, 1.
    assignRemapIds(root);
    root.updateMatrixWorld(true);
    return root;
  }

  async function parseModelFile(file) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const buffer = await readFileAsArrayBuffer(file);

    if (extension === "glb") {
      return new Promise((resolve, reject) => {
        new GLTFLoader().parse(buffer, "", (gltf) => resolve(gltf.scene), reject);
      });
    }

    if (extension === "fbx") {
      return new FBXLoader().parse(buffer, "");
    }

    throw new Error("Podporovaný je zatím jen import .glb a .fbx.");
  }

  function getProcessingSettings() {
    return {
      workflow: "planar_cleanup",
      mode: "dominant",
      sampleDensity: Number(densityInput.value),
      alphaThreshold: Number(alphaThresholdInput.value),
      analysisSize: Number(analysisSizeInput.value),
      clusterCount: Number(clusterCountInput.value),
      blurRadius: Number(blurRadiusInput.value),
      majorityPasses: Number(majorityPassesInput.value),
      colorTolerance: Number(colorToleranceInput.value),
      shadowThreshold: Number(shadowThresholdInput.value),
      fallbackId: 7,
      submeshMaxDepth: 0,
      edgeTolerance: 0.06,
      submeshMinArea: 20,
      submeshBudget: 24000,
      planarNormalTolerance: Number(planarNormalInput.value),
      planarDistanceTolerance: Number(planarDistanceInput.value) / 100,
      planarMaxRegionSize: Number(planarRegionInput.value),
      planarRescueConfidence: Number(planarRescueInput.value) / 100,
      paletteRemap: [...paletteRemap]
    };
  }

  function getMaterialTextureSource(material) {
    const shouldForceFallback = forceTextureInput.checked && fallbackTextureCanvas;
    const sourceTexture = shouldForceFallback ? null : material?.map || null;
    const source = textureToSource(sourceTexture, fallbackTextureCanvas);

    if (!source && fallbackTextureCanvas) {
      return textureToSource(null, fallbackTextureCanvas);
    }

    return source;
  }

function analyzeTriangle(uv0, uv1, uv2, analysisSource, settings) {
    if (!analysisSource) {
      const fallbackEntry = resolvePaletteEntry(
        palette.find((entry) => entry.id === settings.fallbackId) || palette[0],
        palette,
        settings.paletteRemap
      );
      return { entry: fallbackEntry, confidence: 0, usedFallback: true };
    }

    const samples = generateBarycentricSamples(settings.sampleDensity);
    const clusterCounts = new Map();
    const average = { r: 0, g: 0, b: 0 };
    let usedSamples = 0;

    samples.forEach((sample) => {
      const uv = interpolateUv(uv0, uv1, uv2, sample);
      const transformedUv = analysisSource.transformUv(uv);
      const clusterIndex = sampleClusterIndex(analysisSource, transformedUv);

      if (clusterIndex === ANALYSIS_EMPTY_ID) {
        return;
      }

      const cluster = analysisSource.clusters[clusterIndex];
      clusterCounts.set(clusterIndex, (clusterCounts.get(clusterIndex) || 0) + 1);
      average.r += cluster.r;
      average.g += cluster.g;
      average.b += cluster.b;
      usedSamples += 1;
    });

    if (usedSamples === 0) {
      const fallbackEntry = resolvePaletteEntry(
        palette.find((entry) => entry.id === settings.fallbackId) || palette[0],
        palette,
        settings.paletteRemap
      );
      return { entry: fallbackEntry, confidence: 0, usedFallback: true };
    }

    average.r /= usedSamples;
    average.g /= usedSamples;
    average.b /= usedSamples;

    const dominantClusterIndex = [...clusterCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const dominantCluster = analysisSource.clusters[dominantClusterIndex];
    const dominantEntry = resolvePaletteEntry(getNearestPaletteEntry(dominantCluster, palette), palette, settings.paletteRemap);
    const averageEntry = resolvePaletteEntry(getNearestPaletteEntry(average, palette), palette, settings.paletteRemap);
    const dominantConfidence = (clusterCounts.get(dominantClusterIndex) || 0) / usedSamples;

    if (settings.mode === "average") {
      return { entry: averageEntry, confidence: dominantConfidence, usedFallback: false };
    }

    if (settings.mode === "hybrid" && dominantConfidence < 0.6) {
      return { entry: averageEntry, confidence: dominantConfidence, usedFallback: false };
    }

  return { entry: dominantEntry, confidence: dominantConfidence, usedFallback: false };
}

function analyzeTriangleFromBakedPalette(uv0, uv1, uv2, bakedSource, settings, palette) {
  if (!bakedSource) {
    const fallbackEntry = resolvePaletteEntry(
      palette.find((entry) => entry.id === settings.fallbackId) || palette[0],
      palette,
      settings.paletteRemap
    );
    return { entry: fallbackEntry, confidence: 0, usedFallback: true };
  }

  const samples = generateBarycentricSamples(settings.sampleDensity);
  const counts = new Map();
  let usedSamples = 0;

  samples.forEach((sample) => {
    const uv = interpolateUv(uv0, uv1, uv2, sample);
    const transformedUv = bakedSource.transformUv(uv);
    const paletteId = samplePaletteId(bakedSource, transformedUv);

    if (paletteId === ANALYSIS_EMPTY_ID) {
      return;
    }

    counts.set(paletteId, (counts.get(paletteId) || 0) + 1);
    usedSamples += 1;
  });

  if (usedSamples === 0) {
    const fallbackEntry = resolvePaletteEntry(
      palette.find((entry) => entry.id === settings.fallbackId) || palette[0],
      palette,
      settings.paletteRemap
    );
    return { entry: fallbackEntry, confidence: 0, usedFallback: true };
  }

  const dominantPaletteId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const dominantEntry = resolvePaletteEntry(
    palette.find((entry) => entry.id === dominantPaletteId) || palette[0],
    palette,
    settings.paletteRemap
  );
  const confidence = (counts.get(dominantPaletteId) || 0) / usedSamples;
  return { entry: dominantEntry, confidence, usedFallback: false };
}

  function showOriginalPreview() {
    if (!sourceRoot) {
      return;
    }

    disposePreviewRoot();
    previewRoot = cloneOriginalForPreview(sourceRoot);
    scene.add(previewRoot);
    frameObject(previewRoot);
  }

  function processSourceModel() {
    if (!sourceRoot) {
      return;
    }

    const processedRoot = sourceRoot.clone(true);
    const settings = getProcessingSettings();
    const report = {
      format: modelInput.files?.[0]?.name.split(".").pop()?.toLowerCase() || "unknown",
      meshCount: 0,
      totalTriangles: 0,
      remappedTriangles: 0,
      fallbackTriangles: 0,
      skippedMeshes: 0,
      adaptiveSplits: 0,
      planarRegions: 0,
      planarReassigned: 0,
      confidenceTotal: 0,
      averageConfidence: 0,
      settings,
      meshes: []
    };

    let firstAnalysisCanvas = null;
    let firstBakedCanvas = null;

    processedRoot.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      report.meshCount += 1;

      const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
      const uvs = geometry.getAttribute("uv");

      if (!uvs) {
        report.skippedMeshes += 1;
        child.geometry = BufferGeometryUtils.mergeVertices(geometry);
        child.material = createPreviewMaterial(child);
        report.meshes.push({
          name: child.name || child.userData.remapId,
          skipped: true,
          reason: "Mesh nemá UV."
        });
        return;
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const analysisSources = materials.map((material) => createAnalysisSource(getMaterialTextureSource(material), settings));
      const bakedSources = analysisSources.map((analysisSource) =>
        createBakedPaletteCanvas(analysisSource, palette, settings.paletteRemap)
      );
      const primarySource = analysisSources.find(Boolean);

      if (!firstAnalysisCanvas && primarySource?.canvas) {
        firstAnalysisCanvas = primarySource.canvas;
      }

      if (!firstBakedCanvas && bakedSources.find(Boolean)?.canvas) {
        firstBakedCanvas = bakedSources.find(Boolean).canvas;
      }

      const groups = geometry.groups.length > 0 ? geometry.groups : [{ start: 0, count: uvs.count, materialIndex: 0 }];
      const triangleCount = uvs.count / 3;
      let meshFallbackTriangles = 0;
      let meshConfidence = 0;

      report.totalTriangles += triangleCount;

      if (settings.workflow === "planar_cleanup") {
        const result = buildPlanarCleanupGeometry(child, geometry, bakedSources, groups, settings, palette);
        const resultingTriangleCount = result.geometry.getAttribute("uv").count / 3;
        const averageMeshConfidence = resultingTriangleCount > 0
          ? result.stats.confidenceTotal / resultingTriangleCount
          : 0;

        child.geometry = BufferGeometryUtils.mergeVertices(result.geometry);
        child.material = createPreviewMaterial(child);
        report.remappedTriangles += resultingTriangleCount;
        report.planarRegions += result.stats.cleanedRegions;
        report.planarReassigned += result.stats.reassignedTriangles;
        report.confidenceTotal += averageMeshConfidence * resultingTriangleCount;
        meshConfidence = averageMeshConfidence * resultingTriangleCount;
        meshFallbackTriangles = result.stats.fallbackTriangles;
        report.fallbackTriangles += result.stats.fallbackTriangles;

        if (result.stats.skipped) {
          report.skippedMeshes += 1;
        }
      } else if (settings.workflow === "adaptive_submesh") {
        const result = buildAdaptiveSubmeshGeometry(child, geometry, bakedSources, groups, settings, palette);
        const averageMeshConfidence = result.stats.generatedTriangles > 0
          ? result.stats.confidenceTotal / result.stats.generatedTriangles
          : 0;

        child.geometry = BufferGeometryUtils.mergeVertices(result.geometry);
        child.material = createPreviewMaterial(child);
        report.remappedTriangles += result.stats.generatedTriangles;
        report.totalTriangles += result.stats.generatedTriangles - triangleCount;
        report.adaptiveSplits += result.stats.splitTriangles;
        report.confidenceTotal += averageMeshConfidence * result.stats.generatedTriangles;
        meshConfidence = averageMeshConfidence * result.stats.generatedTriangles;
        meshFallbackTriangles = result.stats.fallbackTriangles;
        report.fallbackTriangles += result.stats.fallbackTriangles;

        if (result.stats.skipped) {
          report.skippedMeshes += 1;
        }
      } else if (settings.workflow === "triangle_uv" || settings.workflow === "baked_to_triangle_uv") {
        for (let vertexIndex = 0; vertexIndex < uvs.count; vertexIndex += 3) {
          const materialIndex = materialIndexForTriangle(groups, vertexIndex);
          const uv0 = new THREE.Vector2(uvs.getX(vertexIndex), uvs.getY(vertexIndex));
          const uv1 = new THREE.Vector2(uvs.getX(vertexIndex + 1), uvs.getY(vertexIndex + 1));
          const uv2 = new THREE.Vector2(uvs.getX(vertexIndex + 2), uvs.getY(vertexIndex + 2));
          const result = settings.workflow === "baked_to_triangle_uv"
            ? analyzeTriangleFromBakedPalette(
                uv0,
                uv1,
                uv2,
                bakedSources[materialIndex] || bakedSources[0] || null,
                settings,
                palette
              )
            : analyzeTriangle(
                uv0,
                uv1,
                uv2,
                analysisSources[materialIndex] || analysisSources[0] || null,
                settings
              );

          uvs.setXY(vertexIndex, result.entry.uv.x, result.entry.uv.y);
          uvs.setXY(vertexIndex + 1, result.entry.uv.x, result.entry.uv.y);
          uvs.setXY(vertexIndex + 2, result.entry.uv.x, result.entry.uv.y);

          meshConfidence += result.confidence;
          report.remappedTriangles += 1;

          if (result.usedFallback) {
            meshFallbackTriangles += 1;
            report.fallbackTriangles += 1;
          }
        }

        geometry.attributes.uv.needsUpdate = true;
        child.geometry = BufferGeometryUtils.mergeVertices(geometry);
        child.material = createPreviewMaterial(child);
      } else {
        const bakedTextures = bakedSources.map((bakedSource) => {
          if (!bakedSource) {
            return null;
          }

          const bakedTexture = createPaletteTexture(bakedSource.canvas);
          bakedTexture.colorSpace = THREE.SRGBColorSpace;
          return bakedTexture;
        });

        child.geometry = BufferGeometryUtils.mergeVertices(geometry);
        child.material = Array.isArray(child.material)
          ? child.material.map((material, materialIndex) =>
              createPreviewMaterialWithMap(child, bakedTextures[materialIndex] || paletteTexture)
            )
          : createPreviewMaterialWithMap(child, bakedTextures[0] || paletteTexture);

        report.remappedTriangles += triangleCount;
        meshConfidence = triangleCount;

        if (!bakedTextures.some(Boolean)) {
          meshFallbackTriangles += triangleCount;
          report.fallbackTriangles += triangleCount;
        }
      }

      const averageMeshConfidence = triangleCount > 0 ? meshConfidence / triangleCount : 0;
      if (settings.workflow !== "adaptive_submesh") {
        report.confidenceTotal += averageMeshConfidence * triangleCount;
      }
      report.meshes.push({
        name: child.name || child.userData.remapId,
        triangles: settings.workflow === "adaptive_submesh"
          ? child.geometry.getAttribute("uv").count / 3
          : triangleCount,
        fallbackTriangles: meshFallbackTriangles,
        averageConfidence: Number((settings.workflow === "adaptive_submesh"
          ? (child.geometry.getAttribute("uv").count / 3 > 0 ? meshConfidence / (child.geometry.getAttribute("uv").count / 3) : 0)
          : averageMeshConfidence).toFixed(4))
      });
    });

    report.averageConfidence = report.totalTriangles > 0 ? report.confidenceTotal / report.totalTriangles : 0;
    lastReport = report;
    lastAnalysisCanvas = firstAnalysisCanvas;
    lastBakedCanvas = firstBakedCanvas;

    disposePreviewRoot();
    previewRoot = processedRoot;
    scene.add(previewRoot);
    frameObject(previewRoot);
    updateStats(report);
    drawAnalysisPreview(lastAnalysisCanvas);
    exportButton.disabled = false;
    exportPngButton.disabled = !lastBakedCanvas;
    reportButton.disabled = false;

    setStatus(
      `Hotovo. Přemapováno ${report.remappedTriangles} trojúhelníků, fallback použitý u ${report.fallbackTriangles}.`,
      "success"
    );
  }

  async function handleModelChange() {
    const file = modelInput.files?.[0];

    if (!file) {
      return;
    }

    try {
      setStatus(`Načítám ${file.name}...`);
      const loaded = await parseModelFile(file);
      sourceRoot = normalizeLoadedRoot(loaded);
      disposePreviewRoot();
      previewRoot = cloneOriginalForPreview(sourceRoot);
      scene.add(previewRoot);
      frameObject(previewRoot);
      processButton.disabled = false;
      resetButton.disabled = false;
      exportButton.disabled = true;
      exportPngButton.disabled = true;
      reportButton.disabled = true;
      lastReport = null;
      lastAnalysisCanvas = null;
      lastBakedCanvas = null;
      updateStats(null);
      drawAnalysisPreview(null);
      setStatus(`Model ${file.name} je připravený. Teď můžeš spustit přemapování.`, "success");
    } catch (error) {
      setStatus(error.message || "Model se nepodařilo načíst.", "warning");
    }
  }

  async function handleFallbackTextureChange() {
    const file = fallbackTextureInput.files?.[0];

    if (!file) {
      fallbackTextureCanvas = null;
      setStatus("Fallback textura odebrána.");
      return;
    }

    try {
      const image = await readFileAsImage(file);
      fallbackTextureCanvas = imageToCanvas(image);
      setStatus(`Fallback textura ${file.name} je připravená.`);
    } catch (error) {
      setStatus(error.message || "Fallback textura se nepodařila načíst.", "warning");
    }
  }

  async function handlePaletteChange() {
    const file = paletteInput.files?.[0];

    try {
      if (!file) {
        paletteCanvas = basePaletteCanvas;
      } else {
        const image = await readFileAsImage(file);
        paletteCanvas = imageToCanvas(image);
      }

      palette = buildPaletteFromCanvas(paletteCanvas);
      paletteTexture.dispose();
      paletteTexture = createPaletteTexture(paletteCanvas);
      drawPalettePreview();

      if (previewRoot) {
        previewRoot.traverse((child) => {
          if (!child.isMesh) {
            return;
          }

          if (Array.isArray(child.material)) {
            child.material.forEach((material) => {
              material.map = paletteTexture;
              material.needsUpdate = true;
            });
          } else if (child.material) {
            child.material.map = paletteTexture;
            child.material.needsUpdate = true;
          }
        });
      }

      setStatus(file ? `Paleta ${file.name} je načtená.` : "Vrátil jsem výchozí 3x3 paletu.");
    } catch (error) {
      setStatus(error.message || "Paletu se nepodařilo načíst.", "warning");
    }
  }

  function exportProcessedGlb() {
    if (!previewRoot) {
      return;
    }

    const exporter = new GLTFExporter();
    setStatus("Exportuju GLB...");

    exporter.parse(
      previewRoot,
      (result) => {
        const blob = new Blob([result], { type: "model/gltf-binary" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `uv-palette-mapped-${Date.now()}.glb`;
        link.click();
        URL.revokeObjectURL(url);
        setStatus("GLB export je hotový.", "success");
      },
      (error) => {
        setStatus(`Export selhal: ${error.message || error}`, "warning");
      },
      { binary: true, trs: false, onlyVisible: true, maxTextureSize: 2048 }
    );
  }

  function exportBakedPng() {
    if (!lastBakedCanvas) {
      return;
    }

    lastBakedCanvas.toBlob((blob) => {
      if (!blob) {
        setStatus("PNG texturu se nepodařilo vytvořit.", "warning");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `uv-palette-baked-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("PNG textura je stažená.", "success");
    }, "image/png");
  }

  function exportReport() {
    if (!lastReport) {
      return;
    }

    const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `uv-palette-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  modelInput.addEventListener("change", handleModelChange);
  fallbackTextureInput.addEventListener("change", handleFallbackTextureChange);
  paletteInput.addEventListener("change", handlePaletteChange);
  processButton.addEventListener("click", () => {
    if (!sourceRoot) {
      return;
    }

    setStatus("Vytvářím analytickou texturu a přemapovávám UV...");
    window.setTimeout(processSourceModel, 24);
  });

  resetButton.addEventListener("click", () => {
    if (!sourceRoot) {
      return;
    }

    showOriginalPreview();
    exportButton.disabled = true;
    exportPngButton.disabled = true;
    reportButton.disabled = true;
    lastReport = null;
    lastAnalysisCanvas = null;
    lastBakedCanvas = null;
    updateStats(null);
    drawAnalysisPreview(null);
    setStatus("Vrácený původní náhled modelu.");
  });

  exportButton.addEventListener("click", exportProcessedGlb);
  exportPngButton.addEventListener("click", exportBakedPng);
  reportButton.addEventListener("click", exportReport);
  rangeInputs.forEach((input) => {
    updateRangeValue(input);
    input.addEventListener("input", () => updateRangeValue(input));
  });

  window.addEventListener("resize", resizeRenderer);

  drawPalettePreview();
  drawAnalysisPreview(null);
  buildRemapControls();
  updateStats(null);
  resizeRenderer();

  (function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  })();
}

initUvPaletteMapper();
