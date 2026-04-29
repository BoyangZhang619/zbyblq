(() => {
  const $ = (sel) => document.querySelector(sel);

  const dropzone = $("#dropzone");
  const fileInput = $("#fileInput");

  const canvas = $("#canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // offscreen
  const srcCanvas = document.createElement("canvas");
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });

  const tmpCanvas = document.createElement("canvas");
  const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });

  const rangeBlock = $("#rangeBlock");
  const valBlock = $("#valBlock");

  const chkPalette = $("#chkPalette");
  const selPalette = $("#selPalette");
  const paletteWrap = $("#paletteWrap");

  const btnExport = $("#btnExport");
  const btnFit = $("#btnFit");
  const btnReset = $("#btnReset");

  const txtOrig = $("#txtOrig");
  const txtOut = $("#txtOut");
  const txtStatus = $("#txtStatus");
  const emptyState = $("#emptyState");

  let img = new Image();
  let hasImage = false;

  // State
  const state = {
    blockSize: Number(rangeBlock.value) || 16,
    quantizeEnabled: false,
    paletteSize: Number(selPalette.value) || 16,
    // 输出最大边（用于适配画布逻辑）
    maxOutW: 1600,
    maxOutH: 900,
  };

  function setStatus(s, muted = true) {
    txtStatus.textContent = s;
    txtStatus.classList.toggle("muted", muted);
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function updateUIEnabled(enabled) {
    btnExport.disabled = !enabled;
    btnFit.disabled = !enabled;
    btnReset.disabled = !enabled;
  }

  function showEmpty(show) {
    emptyState.style.display = show ? "flex" : "none";
  }

  function setCanvasSize(w, h) {
    canvas.width = w;
    canvas.height = h;
    // 默认把画布清干净
    ctx.clearRect(0, 0, w, h);
  }

  function fitToNiceCanvas(w, h) {
    // 把输出限制在 maxOutW/H 内（保持比例）
    const rw = state.maxOutW / w;
    const rh = state.maxOutH / h;
    const r = Math.min(1, rw, rh);
    return {
      w: Math.max(1, Math.round(w * r)),
      h: Math.max(1, Math.round(h * r)),
      scale: r,
    };
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
      updateUIEnabled(true);
      showEmpty(false);

      // 原图画到 srcCanvas
      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      srcCtx.clearRect(0, 0, srcCanvas.width, srcCanvas.height);
      srcCtx.drawImage(img, 0, 0);

      txtOrig.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;

      // 初次适配画布
      const fitted = fitToNiceCanvas(img.naturalWidth, img.naturalHeight);
      setCanvasSize(fitted.w, fitted.h);

      render();
      setStatus("已加载图片");
    };
    img.onerror = () => {
      setStatus("图片加载失败", false);
    };
    img.src = url;
  }

  // 颜色量化：把每个通道压到给定 levels
  // 例如 paletteSize=16 -> 16 色不是严格全局聚类，而是“通道分箱”近似量化，快速且复古味明显
  function quantizeImageData(imageData, paletteSize) {
    // 将 paletteSize 映射成每通道 levels（近似）
    // 8色 -> levels=2 (2^3=8)
    // 16色 -> levels=4 (4^3=64) 但视觉上明显减少，且速度快
    // 32色 -> levels=5 (5^3=125)
    const levelsMap = { 8: 2, 16: 4, 32: 5 };
    const levels = levelsMap[paletteSize] || 4;

    const data = imageData.data;
    const step = 255 / (levels - 1);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // alpha 保持
      data[i]     = Math.round(r / step) * step;
      data[i + 1] = Math.round(g / step) * step;
      data[i + 2] = Math.round(b / step) * step;
    }
    return imageData;
  }

  function render() {
    if (!hasImage) return;

    const outW = canvas.width;
    const outH = canvas.height;

    // 像素块大小：基于输出画布
    const bs = clamp(state.blockSize, 2, 200);

    // 第一步：缩小到（outW/bs, outH/bs）
    const smallW = Math.max(1, Math.floor(outW / bs));
    const smallH = Math.max(1, Math.floor(outH / bs));

    tmpCanvas.width = smallW;
    tmpCanvas.height = smallH;

    // 关键：缩小时允许平滑（让平均更自然），也可以关掉更硬核
    tmpCtx.imageSmoothingEnabled = true;
    tmpCtx.clearRect(0, 0, smallW, smallH);
    tmpCtx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, 0, 0, smallW, smallH);

    // 可选：颜色量化（在 small 上做，更快）
    if (state.quantizeEnabled) {
      const id = tmpCtx.getImageData(0, 0, smallW, smallH);
      const qd = quantizeImageData(id, state.paletteSize);
      tmpCtx.putImageData(qd, 0, 0);
    }

    // 第二步：放大回输出尺寸，关闭平滑 = 最近邻
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, outW, outH);
    ctx.drawImage(tmpCanvas, 0, 0, smallW, smallH, 0, 0, outW, outH);

    txtOut.textContent = `${outW} × ${outH}`;
    valBlock.textContent = String(state.blockSize);
  }

  function exportPNG() {
    if (!hasImage) return;
    const a = document.createElement("a");
    const ts = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const name = `pixelate_${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.png`;
    a.download = name;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  function resetParams() {
    state.blockSize = 16;
    state.quantizeEnabled = false;
    state.paletteSize = 16;

    rangeBlock.value = "16";
    valBlock.textContent = "16";

    chkPalette.checked = false;
    selPalette.value = "16";
    selPalette.disabled = true;
    paletteWrap.classList.remove("enabled");
    paletteWrap.setAttribute("aria-hidden", "true");

    if (hasImage) render();
    setStatus("已重置参数");
  }

  function fitCanvasToImage() {
    if (!hasImage) return;
    const fitted = fitToNiceCanvas(img.naturalWidth, img.naturalHeight);
    setCanvasSize(fitted.w, fitted.h);
    render();
    setStatus(`画布已适配（缩放 ${(fitted.scale * 100).toFixed(0)}%）`);
  }

  // Events: upload
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") fileInput.click();
  });
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    loadFile(file);
    fileInput.value = "";
  });

  // Drag & drop
  ["dragenter", "dragover"].forEach((ev) => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    loadFile(file);
  });

  // Controls
  rangeBlock.addEventListener("input", () => {
    state.blockSize = Number(rangeBlock.value) || 16;
    valBlock.textContent = String(state.blockSize);
    if (hasImage) render();
  });

  chkPalette.addEventListener("change", () => {
    state.quantizeEnabled = chkPalette.checked;
    selPalette.disabled = !state.quantizeEnabled;

    if (state.quantizeEnabled) {
      paletteWrap.classList.add("enabled");
      paletteWrap.setAttribute("aria-hidden", "false");
      setStatus("已开启限制色板");
    } else {
      paletteWrap.classList.remove("enabled");
      paletteWrap.setAttribute("aria-hidden", "true");
      setStatus("已关闭限制色板");
    }

    if (hasImage) render();
  });

  selPalette.addEventListener("change", () => {
    state.paletteSize = Number(selPalette.value) || 16;
    if (hasImage) render();
  });

  btnExport.addEventListener("click", exportPNG);
  btnReset.addEventListener("click", resetParams);
  btnFit.addEventListener("click", fitCanvasToImage);

  // Init
  updateUIEnabled(false);
  showEmpty(true);
  setStatus("等待上传图片");
})();
