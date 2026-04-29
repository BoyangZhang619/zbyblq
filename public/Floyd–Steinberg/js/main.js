(() => {
  const $ = (s) => document.querySelector(s);

  // Required (与之前一致)
  const dropzone = $("#dropzone");
  const fileInput = $("#fileInput");
  const canvas = $("#canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const emptyState = $("#emptyState");

  const btnExport = $("#btnExport");
  const btnFit = $("#btnFit");
  const btnReset = $("#btnReset");

  const txtOrig = $("#txtOrig");
  const txtOut = $("#txtOut");
  const txtStatus = $("#txtStatus");

  // New controls for dithering
  const selMode = $("#selMode");          // "bw" | "palette"
  const selColors = $("#selColors");      // 2 | 4 | 8 | 16 (palette mode)
  const rangeStrength = $("#rangeStrength"); // 0..100 (误差扩散强度)
  const valStrength = $("#valStrength");  // 显示 strength %

  // Offscreen
  const srcCanvas = document.createElement("canvas");
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });

  const tmpCanvas = document.createElement("canvas");
  const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });

  let img = new Image();
  let hasImage = false;

  const state = {
    mode: "bw",
    colors: 4,
    strength: 1.0, // 0..1
    maxOutW: 1600,
    maxOutH: 900,
  };

  function setStatus(s, muted = true) {
    if (!txtStatus) return;
    txtStatus.textContent = s;
    txtStatus.classList.toggle("muted", muted);
  }

  function showEmpty(show) {
    if (!emptyState) return;
    emptyState.style.display = show ? "flex" : "none";
  }

  function updateUIEnabled(enabled) {
    if (btnExport) btnExport.disabled = !enabled;
    if (btnFit) btnFit.disabled = !enabled;
    if (btnReset) btnReset.disabled = !enabled;
    if (selMode) selMode.disabled = !enabled;
    if (selColors) selColors.disabled = !enabled || state.mode !== "palette";
    if (rangeStrength) rangeStrength.disabled = !enabled;
  }

  function setCanvasSize(w, h) {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
  }

  function fitToNiceCanvas(w, h) {
    const rw = state.maxOutW / w;
    const rh = state.maxOutH / h;
    const r = Math.min(1, rw, rh);
    return {
      w: Math.max(1, Math.round(w * r)),
      h: Math.max(1, Math.round(h * r)),
      scale: r,
    };
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // --- Color helpers ---
  function srgbToLinear(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function linearToSrgb(v) {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.round(clamp(c * 255, 0, 255));
  }
  function luminance(r, g, b) {
    // perceptual luminance (linear space)
    const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  // Build palette:
  // - bw: [0,0,0] and [255,255,255] but with a tiny warm tint optional? (这里纯黑白)
  // - palette: N-level grayscale OR N-level limited color?
  //   为了“报纸/GameBoy/掌机风”更稳定，这里做：灰阶 N 色（你要彩色限定色我也可以升级）
  function buildPalette(mode, colors) {
    if (mode === "bw") {
      return [
        [0, 0, 0],
        [255, 255, 255],
      ];
    }
    const n = clamp(colors | 0, 2, 16);
    const pal = [];
    for (let i = 0; i < n; i++) {
      const v = Math.round((i / (n - 1)) * 255);
      pal.push([v, v, v]);
    }
    return pal;
  }

  function nearestInPalette(r, g, b, palette) {
    // Use luminance distance in linear space for grayscale palette
    const L = luminance(r, g, b);
    let best = palette[0], bestD = Infinity;
    for (const p of palette) {
      const pL = luminance(p[0], p[1], p[2]);
      const d = (L - pL) * (L - pL);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  // Floyd–Steinberg dithering on ImageData
  function floydSteinberg(imageData, palette, strength01) {
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;

    // error buffers per channel (float)
    // 为了速度与清晰度：直接在 data 上“就地加误差”，并用 float 临时数组存误差也行
    // 这里采用：每像素取 data 值（可包含之前加的误差），输出后把误差分发到邻居（加回 data）
    // 注意：要用 float 计算，最后写回 data 时 clamp 到 0..255
    const s = clamp(strength01, 0, 1);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;

        const a = data[idx + 3];
        if (a === 0) continue; // skip transparent

        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];

        // 找最近色
        const [nr, ng, nb] = nearestInPalette(r, g, b, palette);

        // 误差（乘强度）
        const er = (r - nr) * s;
        const eg = (g - ng) * s;
        const eb = (b - nb) * s;

        // 写回新色
        data[idx] = nr;
        data[idx + 1] = ng;
        data[idx + 2] = nb;

        // distribute error
        // (x+1, y)   7/16
        // (x-1, y+1) 3/16
        // (x,   y+1) 5/16
        // (x+1, y+1) 1/16
        // helper to add error into neighbor pixel
        const addErr = (nx, ny, wr) => {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) return;
          const nidx = (ny * w + nx) * 4;
          if (data[nidx + 3] === 0) return;
          data[nidx]     = clamp(data[nidx]     + er * wr, 0, 255);
          data[nidx + 1] = clamp(data[nidx + 1] + eg * wr, 0, 255);
          data[nidx + 2] = clamp(data[nidx + 2] + eb * wr, 0, 255);
        };

        addErr(x + 1, y,     7 / 16);
        addErr(x - 1, y + 1, 3 / 16);
        addErr(x,     y + 1, 5 / 16);
        addErr(x + 1, y + 1, 1 / 16);
      }
    }
    return imageData;
  }

  function render() {
    if (!hasImage) return;

    const outW = canvas.width;
    const outH = canvas.height;

    // 先把原图缩放到输出画布大小（tmp）
    tmpCanvas.width = outW;
    tmpCanvas.height = outH;
    tmpCtx.imageSmoothingEnabled = true;
    tmpCtx.clearRect(0, 0, outW, outH);
    tmpCtx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, 0, 0, outW, outH);

    // dithering on tmp
    const id = tmpCtx.getImageData(0, 0, outW, outH);
    const palette = buildPalette(state.mode, state.colors);
    const out = floydSteinberg(id, palette, state.strength);
    tmpCtx.putImageData(out, 0, 0);

    // draw to main
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, outW, outH);
    ctx.drawImage(tmpCanvas, 0, 0);

    if (txtOut) txtOut.textContent = `${outW} × ${outH}`;
  }

  function exportPNG() {
    if (!hasImage) return;
    const a = document.createElement("a");
    const ts = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const name = `dither_${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.png`;
    a.download = name;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  function fitCanvasToImage() {
    if (!hasImage) return;
    const fitted = fitToNiceCanvas(img.naturalWidth, img.naturalHeight);
    setCanvasSize(fitted.w, fitted.h);
    render();
    setStatus(`画布已适配（缩放 ${(fitted.scale * 100).toFixed(0)}%）`);
  }

  function resetParams() {
    state.mode = "bw";
    state.colors = 4;
    state.strength = 1.0;

    if (selMode) selMode.value = "bw";
    if (selColors) selColors.value = "4";
    if (rangeStrength) rangeStrength.value = "100";
    if (valStrength) valStrength.textContent = "100";

    if (selColors) selColors.disabled = true;

    if (hasImage) render();
    setStatus("已重置参数");
  }

  function loadFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("请选择图片文件", false);
      return;
    }

    const url = URL.createObjectURL(file);
    img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);

      hasImage = true;
      showEmpty(false);
      updateUIEnabled(true);

      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      srcCtx.clearRect(0, 0, srcCanvas.width, srcCanvas.height);
      srcCtx.drawImage(img, 0, 0);

      if (txtOrig) txtOrig.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;

      const fitted = fitToNiceCanvas(img.naturalWidth, img.naturalHeight);
      setCanvasSize(fitted.w, fitted.h);

      render();
      setStatus("已加载图片");
    };
    img.onerror = () => setStatus("图片加载失败", false);
    img.src = url;
  }

  // --- Events ---
  if (dropzone) {
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") fileInput.click();
    });

    ["dragenter", "dragover"].forEach((ev) => {
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((ev) => {
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.remove("dragover");
      });
    });
    dropzone.addEventListener("drop", (e) => {
      const file = e.dataTransfer?.files?.[0];
      loadFile(file);
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      loadFile(file);
      fileInput.value = "";
    });
  }

  if (selMode) {
    selMode.addEventListener("change", () => {
      state.mode = selMode.value === "palette" ? "palette" : "bw";
      if (selColors) selColors.disabled = state.mode !== "palette";
      if (hasImage) render();
    });
  }

  if (selColors) {
    selColors.addEventListener("change", () => {
      state.colors = Number(selColors.value) || 4;
      if (hasImage) render();
    });
  }

  if (rangeStrength) {
    rangeStrength.addEventListener("input", () => {
      const v = Number(rangeStrength.value) || 100;
      state.strength = clamp(v / 100, 0, 1);
      if (valStrength) valStrength.textContent = String(v);
      if (hasImage) render();
    });
  }

  if (btnExport) btnExport.addEventListener("click", exportPNG);
  if (btnFit) btnFit.addEventListener("click", fitCanvasToImage);
  if (btnReset) btnReset.addEventListener("click", resetParams);

  // Init
  updateUIEnabled(false);
  showEmpty(true);
  setStatus("等待上传图片");
})();
