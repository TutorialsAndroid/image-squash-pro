(function () {
  // ────────────── DOM Refs ──────────────
  const uploadZone = document.getElementById("uploadZone");
  const compactUpload = document.getElementById("compactUpload");
  const fileInput = document.getElementById("fileInput");
  const compactFileInput = document.getElementById("compactFileInput");
  const resultsSection = document.getElementById("resultsSection");
  const imageGrid = document.getElementById("imageGrid");
  const resultsCount = document.getElementById("resultsCount");
  const summaryBar = document.getElementById("summaryBar");
  const sumCount = document.getElementById("sumCount");
  const sumOriginal = document.getElementById("sumOriginal");
  const sumCompressed = document.getElementById("sumCompressed");
  const sumSavings = document.getElementById("sumSavings");
  const compressAllBtn = document.getElementById("compressAllBtn");
  const downloadAllBtn = document.getElementById("downloadAllBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const qualitySlider = document.getElementById("qualitySlider");
  const qualityValue = document.getElementById("qualityValue");
  const maxDimensionInput = document.getElementById("maxDimension");
  const outputFormatSelect = document.getElementById("outputFormat");
  const presetPills = document.getElementById("presetPills");
  const toastContainer = document.getElementById("toastContainer");
  const qualityGroup = document.getElementById("qualityGroup");
  const dimensionGroup = document.getElementById("dimensionGroup");

  // ────────────── State ──────────────
  let imageItems = []; // { id, file, originalSize, compressedBlob, compressedSize, compressedUrl, status }
  let itemIdCounter = 0;
  let currentPreset = "high";

  // ─── Performance threshold constants ───
  const PERF_TEST_WIDTH = 800; // realistic canvas size
  const PERF_SLOW_THRESHOLD_MS = 400; // warn if compression takes > 400 ms

  // ────────────── Presets ──────────────
  const presets = {
    maximum: {
      quality: 20,
      maxDimension: 1280,
      format: "image/webp",
      label: "Maximum",
    },
    high: {
      quality: 35,
      maxDimension: 1920,
      format: "image/webp",
      label: "High",
    },
    medium: {
      quality: 55,
      maxDimension: 2560,
      format: "image/webp",
      label: "Medium",
    },
    low: {
      quality: 75,
      maxDimension: 3840,
      format: "image/webp",
      label: "Low",
    },
  };

  function applyPreset(name) {
    currentPreset = name;
    if (name === "custom") {
      // Keep current values, just update active pill
      updatePillActive("custom");
      qualityGroup.style.opacity = "1";
      dimensionGroup.style.opacity = "1";
      return;
    }
    const p = presets[name];
    if (p) {
      qualitySlider.value = p.quality;
      qualityValue.textContent = p.quality + "%";
      maxDimensionInput.value = p.maxDimension;
      outputFormatSelect.value = p.format;
      updatePillActive(name);
      qualityGroup.style.opacity = "0.55";
      dimensionGroup.style.opacity = "0.55";
    }
  }

  function updatePillActive(name) {
    presetPills.querySelectorAll(".preset-pill").forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.preset === name);
    });
  }

  function getCurrentSettings() {
    return {
      quality: parseInt(qualitySlider.value) / 100,
      maxDimension: parseInt(maxDimensionInput.value),
      format: outputFormatSelect.value,
    };
  }

  // ────────────── Event: Preset Pills ──────────────
  presetPills.addEventListener("click", (e) => {
    const pill = e.target.closest(".preset-pill");
    if (!pill) return;
    applyPreset(pill.dataset.preset);
  });

  // ────────────── Event: Sliders & Inputs (triggers custom) ──────────────
  qualitySlider.addEventListener("input", () => {
    qualityValue.textContent = qualitySlider.value + "%";
    if (currentPreset !== "custom") {
      applyPreset("custom");
    }
  });
  maxDimensionInput.addEventListener("input", () => {
    if (currentPreset !== "custom") {
      applyPreset("custom");
    }
  });
  outputFormatSelect.addEventListener("change", () => {
    if (currentPreset !== "custom") {
      applyPreset("custom");
    }
  });

  // ────────────── File Handling ──────────────
  function handleFiles(files) {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (validFiles.length === 0) {
      showToast("⚠️ Please select valid image files.");
      return;
    }
    if (validFiles.length < files.length) {
      showToast(
        `⚠️ ${files.length - validFiles.length} non-image file(s) skipped.`,
      );
    }
    validFiles.forEach((file) => {
      const item = {
        id: ++itemIdCounter,
        file: file,
        originalSize: file.size,
        compressedBlob: null,
        compressedSize: null,
        compressedUrl: null,
        status: "pending", // pending | compressing | done | error
        errorMsg: null,
      };
      imageItems.push(item);
    });
    renderAll();
    showToast(
      `✅ ${validFiles.length} image(s) added. Click "Compress All" to start.`,
    );
  }

  // ────────────── Compression Engine ──────────────
  async function compressItem(item, settings) {
    item.status = "compressing";
    item.errorMsg = null;
    renderAll();
    try {
      // Read file
      const dataUrl = await readFileAsDataURL(item.file);
      // Load image
      const img = await loadImage(dataUrl);
      // Calculate target dimensions
      const { width, height } = calculateDimensions(
        img.width,
        img.height,
        settings.maxDimension,
      );
      // Draw to canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // For JPEG output, fill white background (handles transparency)
      if (settings.format === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Convert to blob
      const blob = await canvasToBlob(
        canvas,
        settings.format,
        settings.quality,
      );
      // If compressed is larger than original, keep original (for already-small files)
      let finalBlob = blob;
      if (blob.size >= item.originalSize && item.originalSize < 500 * 1024) {
        // For small originals, if compression doesn't help, keep original
        finalBlob = item.file;
        console.log(
          `[${item.file.name}] Compression didn't reduce size, keeping original.`,
        );
      }
      // Revoke old URL if exists
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      const url = URL.createObjectURL(finalBlob);
      item.compressedBlob = finalBlob;
      item.compressedSize = finalBlob.size;
      item.compressedUrl = url;
      item.status = "done";
    } catch (err) {
      console.error("Compression error:", err);
      item.status = "error";
      item.errorMsg = err.message || "Unknown error";
    }
    renderAll();
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = dataUrl;
    });
  }

  function calculateDimensions(origW, origH, maxDim) {
    if (origW <= maxDim && origH <= maxDim) {
      return { width: origW, height: origH };
    }
    const ratio = origW / origH;
    let width, height;
    if (origW >= origH) {
      width = maxDim;
      height = Math.round(maxDim / ratio);
    } else {
      height = maxDim;
      width = Math.round(maxDim * ratio);
    }
    return { width, height };
  }

  function canvasToBlob(canvas, format, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        format,
        quality,
      );
    });
  }

  // ────────────── Batch Compression ──────────────
  async function compressAll() {
    // ── Performance check ──
    const msPerMP = await estimateDevicePerformance();
    if (msPerMP > PERF_SLOW_THRESHOLD_MS) {
      const proceed = await new Promise((resolve) => {
        showPerformanceWarning(resolve);
      });
      if (!proceed) {
        showToast("🛑 Compression cancelled.");
        return;
      }
    }

    const pendingItems = imageItems.filter(
      (i) => i.status === "pending" || i.status === "error",
    );
    if (pendingItems.length === 0) {
      // Re-compress all
      const allItems = imageItems.filter((i) => i.status === "done");
      if (allItems.length === 0) {
        showToast("⚠️ No images to compress.");
        return;
      }
      allItems.forEach((i) => {
        i.status = "pending";
        i.compressedBlob = null;
        i.compressedSize = null;
        if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
        i.compressedUrl = null;
      });
      renderAll();
    }
    const toCompress = imageItems.filter(
      (i) => i.status === "pending" || i.status === "error",
    );
    if (toCompress.length === 0) {
      showToast("⚠️ All images are already compressed.");
      return;
    }
    const settings = getCurrentSettings();
    compressAllBtn.disabled = true;
    showToast(`🔄 Compressing ${toCompress.length} image(s)...`);
    for (let i = 0; i < toCompress.length; i++) {
      await compressItem(toCompress[i], settings);
      // Small delay for UI breathing room
      await sleep(50);
    }
    compressAllBtn.disabled = false;
    const doneCount = imageItems.filter((i) => i.status === "done").length;
    const errorCount = imageItems.filter((i) => i.status === "error").length;
    if (errorCount > 0) {
      showToast(`⚠️ ${doneCount} compressed, ${errorCount} failed.`);
    } else {
      showToast(`✅ Successfully compressed ${doneCount} image(s)!`);
    }
    updateSummary();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ────────────── Download Single ──────────────
  function downloadSingle(item) {
    if (!item.compressedBlob || item.status !== "done") {
      showToast("⚠️ Image not yet compressed.");
      return;
    }
    const ext = getFileExtension(item.compressedBlob.type);
    const originalName = item.file.name.replace(/\.[^.]+$/, "");
    const downloadName = `${originalName}_compressed.${ext}`;
    triggerDownload(item.compressedBlob, downloadName);
  }

  function getFileExtension(mimeType) {
    const map = {
      "image/webp": "webp",
      "image/jpeg": "jpg",
      "image/png": "png",
    };
    return map[mimeType] || "jpg";
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ────────────── Download All as ZIP ──────────────
  async function downloadAllZip() {
    const doneItems = imageItems.filter(
      (i) => i.status === "done" && i.compressedBlob,
    );
    if (doneItems.length === 0) {
      showToast("⚠️ No compressed images to download.");
      return;
    }
    if (typeof JSZip === "undefined") {
      showToast("⚠️ ZIP library not loaded. Downloading individually...");
      doneItems.forEach((item) => downloadSingle(item));
      return;
    }
    showToast("📦 Preparing ZIP file...");
    const zip = new JSZip();
    const usedNames = new Set();
    doneItems.forEach((item) => {
      const ext = getFileExtension(item.compressedBlob.type);
      let baseName = item.file.name.replace(/\.[^.]+$/, "");
      // Sanitize filename
      baseName = baseName.replace(/[^a-zA-Z0-9_\- ]/g, "_").substring(0, 60);
      let filename = `${baseName}_compressed.${ext}`;
      // Avoid duplicates
      let counter = 1;
      while (usedNames.has(filename)) {
        filename = `${baseName}_compressed_${counter}.${ext}`;
        counter++;
      }
      usedNames.add(filename);
      zip.file(filename, item.compressedBlob);
    });
    try {
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .substring(0, 19);
      triggerDownload(zipBlob, `imagesquash_${timestamp}.zip`);
      showToast(`✅ ZIP downloaded with ${doneItems.length} image(s)!`);
    } catch (err) {
      console.error("ZIP generation error:", err);
      showToast("⚠️ ZIP failed. Try downloading individually.");
    }
  }

  // ────────────── Clear All ──────────────
  function clearAll() {
    imageItems.forEach((item) => {
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    });
    imageItems = [];
    itemIdCounter = 0;
    renderAll();
    showToast("🗑 All images cleared.");
  }

  // ────────────── Remove Single ──────────────
  function removeItem(id) {
    const idx = imageItems.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const item = imageItems[idx];
    if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    imageItems.splice(idx, 1);
    renderAll();
    showToast("🗑 Image removed.");
  }

  // ────────────── Render ──────────────
  function renderAll() {
    renderImageGrid();
    updateSummary();
    updateVisibility();
  }

  function renderImageGrid() {
    imageGrid.innerHTML = "";
    if (imageItems.length === 0) {
      resultsSection.style.display = "none";
      return;
    }
    resultsSection.style.display = "block";
    resultsCount.textContent = `(${imageItems.length} file${imageItems.length !== 1 ? "s" : ""})`;
    imageItems.forEach((item) => {
      const card = createImageCard(item);
      imageGrid.appendChild(card);
    });
  }

  function createImageCard(item) {
    const card = document.createElement("div");
    card.className = "image-card";
    card.style.animationDelay = "0s";

    // Preview
    const previewDiv = document.createElement("div");
    previewDiv.className = "card-preview";
    if (item.status === "compressing") {
      previewDiv.innerHTML = `
                        <div class="status-overlay">
                            <div class="spinner"></div> Compressing...
                        </div>`;
    } else if (item.status === "error") {
      previewDiv.innerHTML = `
                        <div class="status-overlay" style="background:rgba(239,68,68,0.7);">
                            ⚠️ Error
                        </div>`;
    } else if (item.status === "done" && item.compressedUrl) {
      const img = document.createElement("img");
      img.src = item.compressedUrl;
      img.alt = item.file.name;
      img.loading = "lazy";
      previewDiv.appendChild(img);
    } else if (item.status === "pending") {
      // Show a placeholder instead of loading the huge original
      const placeholder = document.createElement("div");
      placeholder.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f1f5f9;
            color: #64748b;
            font-size: 13px;
            font-weight: 500;
            flex-direction: column;
            gap: 6px;
          `;
      placeholder.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:#94a3b8;">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Preview pending</span>
          `;
      previewDiv.appendChild(placeholder);
    }
    card.appendChild(previewDiv);

    // Body
    const body = document.createElement("div");
    body.className = "card-body";

    const filename = document.createElement("div");
    filename.className = "card-filename";
    filename.title = item.file.name;
    filename.textContent = item.file.name;
    body.appendChild(filename);

    const stats = document.createElement("div");
    stats.className = "card-stats";
    const origBadge = document.createElement("span");
    origBadge.className = "stat-badge stat-original";
    origBadge.textContent = "Orig: " + formatSize(item.originalSize);
    stats.appendChild(origBadge);

    if (item.status === "done" && item.compressedSize !== null) {
      const compBadge = document.createElement("span");
      compBadge.className = "stat-badge stat-compressed";
      compBadge.textContent = "Now: " + formatSize(item.compressedSize);
      stats.appendChild(compBadge);

      const savingPercent = Math.round(
        (1 - item.compressedSize / item.originalSize) * 100,
      );
      const saveBadge = document.createElement("span");
      saveBadge.className = "stat-badge stat-saving";
      if (savingPercent >= 70) saveBadge.classList.add("great");
      if (savingPercent < 20) saveBadge.classList.add("poor");
      const arrow = savingPercent >= 0 ? "↓" : "↑";
      saveBadge.textContent = `${arrow} ${Math.abs(savingPercent)}%`;
      stats.appendChild(saveBadge);
    } else if (item.status === "error") {
      const errBadge = document.createElement("span");
      errBadge.className = "stat-badge";
      errBadge.style.cssText = "background:#fef2f2;color:#ef4444;";
      errBadge.textContent = "Failed";
      stats.appendChild(errBadge);
    } else if (item.status === "pending") {
      const pendBadge = document.createElement("span");
      pendBadge.className = "stat-badge";
      pendBadge.style.cssText = "background:#fffbeb;color:#b45309;";
      pendBadge.textContent = "Pending";
      stats.appendChild(pendBadge);
    }
    body.appendChild(stats);

    // Actions
    const actions = document.createElement("div");
    actions.className = "card-actions";
    if (item.status === "done") {
      const dlBtn = document.createElement("button");
      dlBtn.className = "btn btn-success btn-xs";
      dlBtn.textContent = "⬇ Download";
      dlBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadSingle(item);
      });
      actions.appendChild(dlBtn);
    }
    if (item.status === "error" || item.status === "pending") {
      const retryBtn = document.createElement("button");
      retryBtn.className = "btn btn-primary btn-xs";
      retryBtn.textContent = "🔄 Compress";
      retryBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        item.status = "pending";
        item.errorMsg = null;
        renderAll();
        await compressItem(item, getCurrentSettings());
        updateSummary();
      });
      actions.appendChild(retryBtn);
    }
    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-danger btn-xs";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeItem(item.id);
    });
    actions.appendChild(removeBtn);
    body.appendChild(actions);

    card.appendChild(body);

    // Click on preview to download (if done)
    if (item.status === "done") {
      previewDiv.style.cursor = "pointer";
      previewDiv.addEventListener("click", () => downloadSingle(item));
    }

    return card;
  }

  function updateSummary() {
    const total = imageItems.length;
    if (total === 0) {
      summaryBar.style.display = "none";
      return;
    }
    summaryBar.style.display = "flex";
    const origTotal = imageItems.reduce((sum, i) => sum + i.originalSize, 0);
    const compTotal = imageItems.reduce(
      (sum, i) => sum + (i.compressedSize || i.originalSize),
      0,
    );
    sumCount.textContent = total;
    sumOriginal.textContent = formatSize(origTotal);
    sumCompressed.textContent = formatSize(compTotal);
    const saving =
      origTotal > 0 ? Math.round((1 - compTotal / origTotal) * 100) : 0;
    sumSavings.textContent =
      saving >= 0 ? `↓ ${saving}%` : `↑ ${Math.abs(saving)}%`;
    if (saving >= 50) sumSavings.style.color = "var(--success)";
    else if (saving >= 20) sumSavings.style.color = "var(--warning)";
    else sumSavings.style.color = "var(--danger)";
  }

  function updateVisibility() {
    if (imageItems.length > 0) {
      compactUpload.style.display = "block";
      uploadZone.style.opacity = "0.6";
      uploadZone.style.pointerEvents = "none";
    } else {
      compactUpload.style.display = "none";
      uploadZone.style.opacity = "1";
      uploadZone.style.pointerEvents = "auto";
      resultsSection.style.display = "none";
      summaryBar.style.display = "none";
    }
  }

  // ────────────── Utility: Format Size ──────────────
  function formatSize(bytes) {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  }

  // ────────────── Toast ──────────────
  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);
    // Auto-remove after animation
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  // ────────────── Drag & Drop ──────────────
  const allDropZones = [uploadZone, compactUpload, document.body];

  allDropZones.forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add("drag-over");
    });
    zone.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Only remove if truly leaving
      if (!uploadZone.contains(e.relatedTarget) && e.target === uploadZone) {
        uploadZone.classList.remove("drag-over");
      }
    });
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove("drag-over");
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    });
  });

  // Global drag-over cleanup
  document.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  document.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    // If dropped outside our zones, ignore
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Check if drop target is within our app
      const appContainer = document.querySelector(".app-container");
      const header = document.querySelector(".app-header");
      if (
        appContainer &&
        (appContainer.contains(e.target) ||
          header.contains(e.target) ||
          uploadZone.contains(e.target) ||
          compactUpload.contains(e.target))
      ) {
        handleFiles(files);
      }
    }
  });

  // ────────────── File Input Events ──────────────
  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    fileInput.value = "";
  });
  compactFileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    compactFileInput.value = "";
  });

  // ────────────── Button Events ──────────────
  compressAllBtn.addEventListener("click", compressAll);
  downloadAllBtn.addEventListener("click", downloadAllZip);
  clearAllBtn.addEventListener("click", clearAll);

  // ────────────── Keyboard Shortcuts ──────────────
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      compressAll();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "d") {
      e.preventDefault();
      downloadAllZip();
    }
  });

  // ────────────── Initialize ──────────────
  applyPreset("high");
  renderAll();
  console.log(
    "%c🚀 ImageSquash Pro Ready %c| %cDrop images or click to begin.",
    "font-weight:bold;color:#4f46e5;",
    "",
    "color:#64748b;",
  );
  console.log(
    "%c💡 Tip: Use Ctrl+Enter to compress all | Ctrl+D to download ZIP",
    "color:#10b981;font-weight:500;",
  );
  console.log(
    "%c📐 High preset: 35% quality WebP @ 1920px → ~200KB from 80MB images",
    "color:#f59e0b;",
  );

  // ─── Estimate device performance ───
  async function estimateDevicePerformance() {
    const canvas = document.createElement("canvas");
    canvas.width = PERF_TEST_WIDTH;
    canvas.height = PERF_TEST_WIDTH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#4f46e5";
    ctx.fillRect(0, 0, PERF_TEST_WIDTH, PERF_TEST_WIDTH);

    const start = performance.now();
    await canvasToBlob(canvas, "image/webp", 0.8);
    const elapsed = performance.now() - start;
    return elapsed; // total milliseconds
  }

  // ─── Show SweetAlert‑style warning ───
  function showPerformanceWarning(callback) {
    // Remove any existing overlay
    const existing = document.querySelector(".perf-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "perf-overlay";

    overlay.innerHTML = `
    <div class="perf-dialog">
      <div class="perf-icon">⚠️</div>
      <div class="perf-title">Device Performance Notice</div>
      <div class="perf-message">
        Compression might be <strong>slower</strong> on this device, especially
        with many or large images.<br/>
        You can still proceed, but consider reducing dimensions or using
        a smaller batch for a smoother experience.
      </div>
      <div class="perf-actions">
        <button class="btn btn-secondary" id="perfCancel">Cancel</button>
        <button class="btn btn-primary" id="perfProceed">Compress Anyway</button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    const close = (proceed) => {
      overlay.remove();
      callback(proceed);
    };

    overlay.querySelector("#perfCancel").onclick = () => close(false);
    overlay.querySelector("#perfProceed").onclick = () => close(true);
  }
})();
