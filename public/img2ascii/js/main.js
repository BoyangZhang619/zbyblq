// 图片转 ASCII - main.js
// 支持：纯文本 / 彩色 ASCII、亮度/对比度、反相、宽度与字号控制、导出 TXT/PNG

class ImageToASCII {
  constructor() {
    // DOM
    this.drop = document.getElementById('drop');
    this.fileInput = document.getElementById('fileInput');
    this.pickBtn = document.getElementById('pickBtn');
    this.fileHint = document.getElementById('fileHint');

    this.widthRange = document.getElementById('widthRange');
    this.fontRange = document.getElementById('fontRange');
    this.charsetSelect = document.getElementById('charsetSelect');
    this.brightnessRange = document.getElementById('brightnessRange');
    this.contrastRange = document.getElementById('contrastRange');
    this.invertChk = document.getElementById('invertChk');
    this.colorChk = document.getElementById('colorChk');

    this.btnExample = document.getElementById('btnExample');
    this.btnRender = document.getElementById('btnRender');
    this.btnCopy = document.getElementById('btnCopy');
    this.btnDownloadTxt = document.getElementById('btnDownloadTxt');
    this.btnDownloadPng = document.getElementById('btnDownloadPng');

    this.metaInfo = document.getElementById('metaInfo');
    this.metaMode = document.getElementById('metaMode');

    this.outColor = document.getElementById('outColor');
    this.outText = document.getElementById('outText');

    this.srcCanvas = document.getElementById('srcCanvas');
    this.ctx = this.srcCanvas.getContext('2d', { willReadFrequently: true });

    // State
    this.img = null;           // HTMLImageElement
    this.lastText = '';        // 纯文本输出
    this.lastColoredHTML = ''; // 彩色输出（innerHTML）
    this.lastConfig = null;

    // Charsets
    this.charsets = {
      detailed: " .'`^\",:;Il!i~+_-?][}{1)(|\\/*tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
      simple: " .:-=+*#%@",
      blocks: " ░▒▓█",
      binary: " 01",
    };

    this.bindUI();
    this.syncLabels();
    this.setEnabled(false);
    this.setModeUI();
  }

  bindUI() {
    // pick
    this.pickBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (f) this.loadFile(f);
    });

    // drag drop
    this.drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.drop.classList.add('dragover');
    });
    this.drop.addEventListener('dragleave', () => this.drop.classList.remove('dragover'));
    this.drop.addEventListener('drop', (e) => {
      e.preventDefault();
      this.drop.classList.remove('dragover');
      const f = e.dataTransfer.files?.[0];
      if (f) this.loadFile(f);
    });

    // controls
    const onAnyChange = () => {
      this.syncLabels();
      this.setModeUI();
      if (this.img) this.render(); // 有图就实时更新
    };

    this.widthRange.addEventListener('input', onAnyChange);
    this.fontRange.addEventListener('input', onAnyChange);
    this.charsetSelect.addEventListener('change', onAnyChange);
    this.brightnessRange.addEventListener('input', onAnyChange);
    this.contrastRange.addEventListener('input', onAnyChange);
    this.invertChk.addEventListener('change', onAnyChange);
    this.colorChk.addEventListener('change', onAnyChange);

    // actions
    this.btnRender.addEventListener('click', () => this.render());
    this.btnCopy.addEventListener('click', () => this.copy());
    this.btnDownloadTxt.addEventListener('click', () => this.downloadTxt());
    this.btnDownloadPng.addEventListener('click', () => this.downloadPng());

    // example image
    this.btnExample.addEventListener('click', async () => {
      const img = await this.makeExampleImage();
      this.setImage(img, '示例图（本地生成）');
    });

    // 防止误选文字导致滚动不舒服（可删）
    this.outColor.addEventListener('mousedown', (e) => {
      if (e.detail > 1) e.preventDefault();
    });
  }

  syncLabels() {
    document.getElementById('widthText').textContent = this.widthRange.value;
    document.getElementById('fontText').textContent = this.fontRange.value;
    document.getElementById('brightnessText').textContent = this.brightnessRange.value;
    document.getElementById('contrastText').textContent = this.contrastRange.value;

    const size = Number(this.fontRange.value);
    this.outColor.style.fontSize = `${size}px`;
    this.outText.style.fontSize = `${size}px`;
  }

  setEnabled(hasImage) {
    this.btnRender.disabled = !hasImage;
    this.btnCopy.disabled = !hasImage;
    this.btnDownloadTxt.disabled = !hasImage;
    this.btnDownloadPng.disabled = !hasImage;
  }

  setModeUI() {
    const color = this.colorChk.checked;
    this.outColor.style.display = color ? 'block' : 'none';
    this.outText.style.display = color ? 'none' : 'block';
    this.metaMode.textContent = `模式：${color ? '彩色 ASCII' : '纯文本 ASCII'}`;
  }

  async loadFile(file) {
    if (!file.type.startsWith('image/')) {
      this.fileHint.textContent = '这不是图片文件哦';
      return;
    }
    this.fileHint.textContent = `已选择：${file.name}`;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      URL.revokeObjectURL(url);
      this.setImage(img, file.name);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      this.fileHint.textContent = '图片加载失败';
    };
    img.src = url;
  }

  setImage(img, label) {
    this.img = img;
    this.metaInfo.textContent = `${label} | ${img.naturalWidth}×${img.naturalHeight}`;
    this.setEnabled(true);
    this.render();
  }

  getConfig() {
    return {
      widthCols: Number(this.widthRange.value),
      fontSize: Number(this.fontRange.value),
      charsetKey: this.charsetSelect.value,
      brightness: Number(this.brightnessRange.value), // -50..50
      contrast: Number(this.contrastRange.value),     // -50..50
      invert: !!this.invertChk.checked,
      color: !!this.colorChk.checked,
    };
  }

  // 亮度/对比度处理：输入 0..255 -> 0..255
  applyBC(v, brightness, contrast) {
    // brightness: [-50,50] -> [-128,128] roughly
    const b = (brightness / 50) * 64;

    // contrast: [-50,50] -> factor
    // classic: f = (259*(c+255))/(255*(259-c))
    const c = (contrast / 50) * 128;
    const f = (259 * (c + 255)) / (255 * (259 - c));

    let out = f * (v - 128) + 128 + b;
    out = Math.max(0, Math.min(255, out));
    return out;
  }

  // 将 RGB 转亮度（0..255）
  luminance(r, g, b) {
    // Rec. 709
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  render() {
    if (!this.img) return;

    const cfg = this.getConfig();
    this.lastConfig = cfg;

    const charset = this.charsets[cfg.charsetKey] || this.charsets.detailed;
    const chars = charset.split('');
    const nChars = chars.length;

    // 根据字体的“字符宽高比”做校正（字符通常比高更窄）
    // 经验比：0.55~0.65，取 0.6 附近
    const aspectFix = 0.55;

    const srcW = this.img.naturalWidth;
    const srcH = this.img.naturalHeight;

    const outW = cfg.widthCols;
    const outH = Math.max(1, Math.round((srcH / srcW) * outW * aspectFix));

    // draw to canvas
    this.srcCanvas.width = outW;
    this.srcCanvas.height = outH;
    this.ctx.clearRect(0, 0, outW, outH);
    this.ctx.drawImage(this.img, 0, 0, outW, outH);

    const imgData = this.ctx.getImageData(0, 0, outW, outH);
    const data = imgData.data;

    let textLines = new Array(outH);
    let colorLinesHTML = new Array(outH);

    // 背景/前景：根据主题适配（纯文本更像“终端”）
    const theme = document.documentElement.getAttribute('data-theme');
    const isDark = theme === 'dark';

    for (let y = 0; y < outH; y++) {
      let lineChars = '';
      let lineHTML = '<span class="ascii-line">';

      for (let x = 0; x < outW; x++) {
        const idx = (y * outW + x) * 4;
        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];
        const a = data[idx + 3];

        // 透明像素：当成背景
        if (a === 0) {
          const ch = ' ';
          lineChars += ch;
          lineHTML += `<span class="ascii-char" style="color:transparent">${ch}</span>`;
          continue;
        }

        // 亮度/对比度
        r = this.applyBC(r, cfg.brightness, cfg.contrast);
        g = this.applyBC(g, cfg.brightness, cfg.contrast);
        b = this.applyBC(b, cfg.brightness, cfg.contrast);

        let lum = this.luminance(r, g, b); // 0..255
        if (cfg.invert) lum = 255 - lum;

        // map luminance to char
        const t = lum / 255; // 0..1
        // 亮 -> 更“空”，暗 -> 更“密”，所以反向取索引
        const ci = Math.floor((1 - t) * (nChars - 1));
        const ch = chars[this.clamp(ci, 0, nChars - 1)];

        lineChars += ch;

        if (cfg.color) {
          // 彩色输出：字符上色
          // 让深色主题更亮一点、浅色主题更稳一点
          const rr = r;
          const gg = g;
          const bb = b;

          lineHTML += `<span class="ascii-char" style="color: rgb(${rr},${gg},${bb})">${this.escapeHTML(ch)}</span>`;
        } else {
          // 纯文本（不需要 span）
        }
      }

      lineHTML += '</span>';
      textLines[y] = lineChars;
      colorLinesHTML[y] = lineHTML;
    }

    // 输出
    this.lastText = textLines.join('\n');
    this.outText.textContent = this.lastText;

    this.lastColoredHTML = colorLinesHTML.join('');
    this.outColor.innerHTML = this.lastColoredHTML;

    // 输出区域背景适配（更像“屏幕”）
    const bg = isDark ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.03)';
    this.outColor.style.background = bg;
    this.outText.style.background = bg;

    // meta
    this.metaInfo.textContent = `${srcW}×${srcH} → ${outW}×${outH}（字符）`;
    this.setEnabled(true);
  }

  escapeHTML(s) {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  async copy() {
    if (!this.img) return;

    const cfg = this.getConfig();
    const text = this.lastText || '';

    try {
      // 彩色模式也复制纯文本（更通用）
      await navigator.clipboard.writeText(text);
      this.flashMeta('已复制到剪贴板 ✅');
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.flashMeta('已复制到剪贴板 ✅');
    }
  }

  downloadTxt() {
    if (!this.img) return;
    const blob = new Blob([this.lastText || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    this.downloadURL(url, 'ascii.txt');
    URL.revokeObjectURL(url);
  }

  async downloadPng() {
    if (!this.img) return;

    const cfg = this.getConfig();

    // 用 canvas 重新绘制“字符画”为 PNG（即使当前是纯文本也能导出）
    // 1) 计算字符行列
    const widthCols = cfg.widthCols;
    const text = this.lastText || '';
    const lines = text.split('\n');
    const heightRows = lines.length;

    const fontSize = cfg.fontSize;
    const fontFamily = getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace';

    // 经验：字符宽度 ~ 0.62em（你 CSS 里也是）
    const charW = Math.max(6, Math.round(fontSize * 0.62));
    const charH = Math.max(8, Math.round(fontSize * 1.02));

    const pad = 16;
    const canvas = document.createElement('canvas');
    canvas.width = pad * 2 + charW * widthCols;
    canvas.height = pad * 2 + charH * heightRows;

    const ctx = canvas.getContext('2d');
    const theme = document.documentElement.getAttribute('data-theme');
    const isDark = theme === 'dark';

    // 背景
    ctx.fillStyle = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    // 2) 若彩色：再从 srcCanvas 采样一次，给每个字符设置颜色
    //    颜色采样使用 render() 时的 outW/outH
    let colorData = null;
    if (cfg.color) {
      // render() 已经把 srcCanvas 设置为 outW/outH 并 drawImage 过
      // 这里直接取同一份 imageData（重新取一遍更稳）
      const outW = this.srcCanvas.width;
      const outH = this.srcCanvas.height;
      const imgData = this.ctx.getImageData(0, 0, outW, outH);
      colorData = { data: imgData.data, w: outW, h: outH };
    }

    for (let y = 0; y < heightRows; y++) {
      const line = lines[y] || '';
      for (let x = 0; x < widthCols; x++) {
        const ch = line[x] ?? ' ';

        if (cfg.color && colorData && x < colorData.w && y < colorData.h) {
          const idx = (y * colorData.w + x) * 4;
          const r = colorData.data[idx];
          const g = colorData.data[idx + 1];
          const b = colorData.data[idx + 2];
          const a = colorData.data[idx + 3] / 255;

          // 透明就跳过
          if (a <= 0.01) continue;
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0.9, a)})`;
        } else {
          ctx.fillStyle = isDark ? 'rgba(230,230,230,0.95)' : 'rgba(30,30,30,0.95)';
        }

        ctx.fillText(ch, pad + x * charW, pad + y * charH);
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      this.downloadURL(url, 'ascii.png');
      URL.revokeObjectURL(url);
      this.flashMeta('已导出 PNG ✅');
    }, 'image/png');
  }

  downloadURL(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  flashMeta(text) {
    const old = this.metaInfo.textContent;
    this.metaInfo.textContent = text;
    setTimeout(() => (this.metaInfo.textContent = old), 1200);
  }

  // 生成一张本地示例图（不走网络）
  async makeExampleImage() {
    const c = document.createElement('canvas');
    c.width = 900;
    c.height = 520;
    const ctx = c.getContext('2d');

    // 背景渐变
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, '#4a90d9');
    g.addColorStop(0.55, '#ffffff');
    g.addColorStop(1, '#ff4d4f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);

    // 几何图形
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      const x = Math.random() * c.width;
      const y = Math.random() * c.height;
      const r = 30 + Math.random() * 120;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 文字
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.font = 'bold 68px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial';
    ctx.fillText('zby ASCII', 40, 120);
    ctx.font = '28px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial';
    ctx.fillText('Image → Text', 44, 170);

    // 转成 Image
    const img = new Image();
    img.decoding = 'async';
    await new Promise((res) => {
      img.onload = () => res();
      img.src = c.toDataURL('image/png');
    });
    return img;
  }

  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
}

// boot
document.addEventListener('DOMContentLoaded', () => {
  window.ImageToASCIIApp = new ImageToASCII();
});
