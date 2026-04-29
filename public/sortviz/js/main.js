// 排序可视化 - main.js（面向对象版）
// ✅ 把逻辑打包成类 SortVisualizer
// ✅ 增强 1：hover 显示值（浮动 tooltip：值 + 下标）
// ✅ 增强 2：归并/快排范围提示（range shading：当前处理区间淡色高亮）
//
// 说明：
// - 不依赖任何外部文件；不影响你站点全局 data-theme 机制
// - 通过 JS 给 #bars 容器注入 overlay（range shading）+ tooltip（hover 值）
// - 归并/快排会在关键步骤 push {type:'range', ...}，执行时渲染当前区间背景

class SortVisualizer {
  constructor(options = {}) {
    this.dom = {
      barsEl: document.getElementById('bars'),
      algoSelect: document.getElementById('algoSelect'),
      sizeRange: document.getElementById('sizeRange'),
      speedRange: document.getElementById('speedRange'),
      sizeText: document.getElementById('sizeText'),
      speedText: document.getElementById('speedText'),

      btnRandom: document.getElementById('btnRandom'),
      btnReverse: document.getElementById('btnReverse'),
      btnNearly: document.getElementById('btnNearly'),

      btnStart: document.getElementById('btnStart'),
      btnPause: document.getElementById('btnPause'),
      btnStep: document.getElementById('btnStep'),
      btnReset: document.getElementById('btnReset'),

      cmpCountEl: document.getElementById('cmpCount'),
      swapCountEl: document.getElementById('swapCount'),
      statusTextEl: document.getElementById('statusText'),
    };

    this.opts = {
      minVal: 1,
      maxVal: 100,
      ...options,
    };

    // 数据
    this.arr = [];
    this.originalArr = [];
    this.bars = [];

    // steps
    this.steps = [];
    this.stepIndex = 0;

    // 运行状态
    this.running = false;
    this.paused = false;
    this.inSorting = false;

    // 统计
    this.cmpCount = 0;
    this.swapCount = 0;

    // 高亮
    this.activeA = -1;
    this.activeB = -1;
    this.pivotIdx = -1;
    this.sortedSet = new Set();

    // range shading（增强2）
    this.currentRange = null; // {l,r,kind}

    // tooltip（增强1）
    this.tooltip = null;
    this.hoveredIndex = -1;

    // 绑定 this
    this.runLoop = this.runLoop.bind(this);
  }

  // -----------------------------
  // Init
  // -----------------------------
  init() {
    this.ensureEnhancementLayers();
    this.initUI();
    this.resetAll({ keepArray: false });
    this.attachEvents();
  }

  initUI() {
    this.dom.sizeText.textContent = this.dom.sizeRange.value;
    this.dom.speedText.textContent = this.dom.speedRange.value;
    this.setStatus('就绪');
    this.updateCounters();
  }

  // -----------------------------
  // Enhancements layer injection
  // -----------------------------
  ensureEnhancementLayers() {
    const { barsEl } = this.dom;
    if (!barsEl) return;

    // 让 bars 容器可放 overlay
    barsEl.style.position = 'relative';

    // overlay（range shading）
    if (!barsEl.querySelector('.range-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'range-overlay';
      overlay.style.position = 'absolute';
      overlay.style.left = '10px'; // 对齐 .bars padding（你的 CSS 是 padding:10px）
      overlay.style.right = '10px';
      overlay.style.top = '10px';
      overlay.style.bottom = '10px';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '0';
      barsEl.prepend(overlay);
    }

    // tooltip（hover 值）
    if (!document.querySelector('.sort-tooltip')) {
      const tip = document.createElement('div');
      tip.className = 'sort-tooltip';
      tip.style.position = 'fixed';
      tip.style.zIndex = '9999';
      tip.style.pointerEvents = 'none';
      tip.style.padding = '8px 10px';
      tip.style.borderRadius = '10px';
      tip.style.border = '1px solid var(--border)';
      tip.style.background = 'var(--card)';
      tip.style.boxShadow = 'var(--shadow)';
      tip.style.color = 'var(--text)';
      tip.style.fontSize = '12px';
      tip.style.fontFamily = 'var(--mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace)';
      tip.style.opacity = '0';
      tip.style.transform = 'translateY(-4px)';
      tip.style.transition = 'opacity .12s ease, transform .12s ease';
      document.body.appendChild(tip);
      this.tooltip = tip;
    } else {
      this.tooltip = document.querySelector('.sort-tooltip');
    }
  }

  // -----------------------------
  // Utils
  // -----------------------------
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  setStatus(text) {
    this.dom.statusTextEl.textContent = text;
  }

  updateCounters() {
    this.dom.cmpCountEl.textContent = String(this.cmpCount);
    this.dom.swapCountEl.textContent = String(this.swapCount);
  }

  resetCounters() {
    this.cmpCount = 0;
    this.swapCount = 0;
    this.updateCounters();
  }

  getDelayMs() {
    // slider 1..100，数值越大越快
    const s = Number(this.dom.speedRange.value);
    const t = 140 - Math.pow(s / 100, 0.8) * 135;
    return this.clamp(Math.round(t), 5, 140);
  }

  // -----------------------------
  // Array generation
  // -----------------------------
  genRandomArray(n) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      out[i] = Math.floor(Math.random() * (this.opts.maxVal - this.opts.minVal + 1)) + this.opts.minVal;
    }
    return out;
  }

  makeNearlySorted(a) {
    const b = [...a].sort((x, y) => x - y);
    const swaps = Math.max(1, Math.floor(b.length * 0.08));
    for (let k = 0; k < swaps; k++) {
      const i = Math.floor(Math.random() * b.length);
      const j = Math.floor(Math.random() * b.length);
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  reverseArray(a) {
    return [...a].sort((x, y) => y - x);
  }

  // -----------------------------
  // Render bars
  // -----------------------------
  renderBars() {
    const { barsEl } = this.dom;
    // 清空除 overlay 外的内容（overlay 在最前面）
    const overlay = barsEl.querySelector('.range-overlay');
    barsEl.innerHTML = '';
    if (overlay) barsEl.appendChild(overlay);

    this.bars = this.arr.map((v, i) => {
      const d = document.createElement('div');
      d.className = 'bar';
      d.style.height = `${v}%`;
      d.dataset.index = String(i);
      d.dataset.value = String(v);
      d.title = `#${i} = ${v}`;
      d.style.position = 'relative';
      d.style.zIndex = '1'; // 在 overlay 之上

      // hover tooltip（增强1）
      d.addEventListener('mouseenter', () => this.showTooltipForBar(i));
      d.addEventListener('mousemove', (e) => this.moveTooltip(e));
      d.addEventListener('mouseleave', () => this.hideTooltip());

      barsEl.appendChild(d);
      return d;
    });

    this.refreshBarClasses();
    this.renderRangeOverlay(); // 重新渲染区间背景
  }

  refreshBarHeights() {
    for (let i = 0; i < this.arr.length; i++) {
      if (this.bars[i]) {
        this.bars[i].style.height = `${this.arr[i]}%`;
        this.bars[i].dataset.value = String(this.arr[i]);
        this.bars[i].title = `#${i} = ${this.arr[i]}`;
      }
    }
  }

  refreshBarClasses() {
    for (let i = 0; i < this.bars.length; i++) {
      const el = this.bars[i];
      el.classList.toggle('active', i === this.activeA || i === this.activeB);
      el.classList.toggle('pivot', i === this.pivotIdx);
      el.classList.toggle('sorted', this.sortedSet.has(i));
    }
  }

  clearHighlights() {
    this.activeA = -1;
    this.activeB = -1;
    this.pivotIdx = -1;
    this.sortedSet.clear();
    this.currentRange = null;
    this.refreshBarClasses();
    this.renderRangeOverlay();
  }

  // -----------------------------
  // Tooltip (Enhancement #1)
  // -----------------------------
  showTooltipForBar(i) {
    if (!this.tooltip) return;
    this.hoveredIndex = i;
    const v = this.arr[i];
    this.tooltip.innerHTML = `<div style="font-weight:650;">值：${v}</div><div style="opacity:.8;margin-top:2px;">下标：${i}</div>`;
    this.tooltip.style.opacity = '1';
    this.tooltip.style.transform = 'translateY(0px)';
  }

  moveTooltip(e) {
    if (!this.tooltip) return;
    // 偏移一点，避免遮住鼠标
    const offsetX = 14;
    const offsetY = 14;
    this.tooltip.style.left = `${e.clientX + offsetX}px`;
    this.tooltip.style.top = `${e.clientY + offsetY}px`;
  }

  hideTooltip() {
    if (!this.tooltip) return;
    this.hoveredIndex = -1;
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'translateY(-4px)';
  }

  // -----------------------------
  // Range overlay (Enhancement #2)
  // -----------------------------
  renderRangeOverlay() {
    const overlay = this.dom.barsEl.querySelector('.range-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';

    if (!this.currentRange || this.arr.length <= 0) return;

    const { l, r, kind } = this.currentRange;
    const n = this.arr.length;
    const L = this.clamp(l, 0, n - 1);
    const R = this.clamp(r, 0, n - 1);
    if (L > R) return;

    // 用百分比估算（flex + gap 会有小误差，但视觉足够）
    const leftPct = (L / n) * 100;
    const widthPct = ((R - L + 1) / n) * 100;

    const seg = document.createElement('div');
    seg.style.position = 'absolute';
    seg.style.left = `${leftPct}%`;
    seg.style.width = `${widthPct}%`;
    seg.style.top = '0';
    seg.style.bottom = '0';
    seg.style.borderRadius = '10px';
    seg.style.border = '1px solid rgba(255,255,255,0.10)';
    seg.style.background =
      kind === 'quick'
        ? 'rgba(250, 173, 20, 0.10)'  // 快排区间：偏黄
        : 'rgba(74, 144, 217, 0.10)'; // 归并区间：偏蓝
    seg.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.05)';
    overlay.appendChild(seg);

    // 在区间左上角加一个小 label（不依赖 CSS）
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.left = `${leftPct}%`;
    label.style.top = '6px';
    label.style.transform = 'translateX(6px)';
    label.style.padding = '4px 8px';
    label.style.borderRadius = '999px';
    label.style.fontSize = '11px';
    label.style.border = '1px solid var(--border)';
    label.style.background = 'var(--card)';
    label.style.color = 'var(--text)';
    label.style.opacity = '0.92';
    label.style.boxShadow = 'var(--shadow)';
    label.textContent = `${kind === 'quick' ? 'Quick' : 'Merge'} 区间 [${L}, ${R}]`;
    overlay.appendChild(label);
  }

  // -----------------------------
  // Steps execution
  // -----------------------------
  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async runLoop() {
    if (this.running) return;
    this.running = true;

    while (this.running) {
      if (!this.inSorting) break;

      if (this.paused) {
        await this.sleep(40);
        continue;
      }

      const ok = this.doOneStep();
      if (!ok) {
        this.inSorting = false;
        this.paused = false;
        this.running = false;
        this.finalizeSorted();
        this.setStatus('完成 ✅');
        this.toggleButtonsIdle();
        break;
      }

      await this.sleep(this.getDelayMs());
    }
  }

  doOneStep() {
    if (this.stepIndex >= this.steps.length) return false;

    const step = this.steps[this.stepIndex++];

    // 默认清比较/交换高亮，但保留 sortedSet + currentRange
    this.activeA = -1;
    this.activeB = -1;
    this.pivotIdx = -1;

    switch (step.type) {
      case 'compare': {
        this.cmpCount++;
        this.activeA = step.i;
        this.activeB = step.j;
        break;
      }
      case 'swap': {
        this.swapCount++;
        this.activeA = step.i;
        this.activeB = step.j;
        [this.arr[step.i], this.arr[step.j]] = [this.arr[step.j], this.arr[step.i]];
        this.refreshBarHeights();
        break;
      }
      case 'set': {
        this.swapCount++; // 写入也算一次
        this.activeA = step.index;
        this.arr[step.index] = step.value;
        this.refreshBarHeights();
        break;
      }
      case 'pivot': {
        this.pivotIdx = step.index;
        break;
      }
      case 'markSorted': {
        (step.indices || []).forEach((i) => this.sortedSet.add(i));
        break;
      }
      case 'range': {
        this.currentRange = { l: step.l, r: step.r, kind: step.kind || 'merge' };
        this.renderRangeOverlay();
        break;
      }
      case 'clearRange': {
        this.currentRange = null;
        this.renderRangeOverlay();
        break;
      }
      case 'done': {
        this.updateCounters();
        this.refreshBarClasses();
        return false;
      }
      default:
        break;
    }

    this.updateCounters();
    this.refreshBarClasses();
    return true;
  }

  finalizeSorted() {
    this.sortedSet.clear();
    for (let i = 0; i < this.arr.length; i++) this.sortedSet.add(i);
    this.activeA = -1;
    this.activeB = -1;
    this.pivotIdx = -1;
    this.currentRange = null;
    this.refreshBarClasses();
    this.renderRangeOverlay();
  }

  // -----------------------------
  // Step generators
  // -----------------------------
  buildSteps(algo, inputArr) {
    const a = [...inputArr];
    const out = [];

    const pushCompare = (i, j) => out.push({ type: 'compare', i, j });
    const pushSwap = (i, j) => out.push({ type: 'swap', i, j });
    const pushSet = (index, value) => out.push({ type: 'set', index, value });
    const pushPivot = (index) => out.push({ type: 'pivot', index });
    const pushMarkSorted = (indices) => out.push({ type: 'markSorted', indices });

    const pushRange = (l, r, kind) => out.push({ type: 'range', l, r, kind });
    const clearRange = () => out.push({ type: 'clearRange' });

    if (algo === 'bubble') {
      const n = a.length;
      for (let end = n - 1; end > 0; end--) {
        let swapped = false;
        for (let i = 0; i < end; i++) {
          pushCompare(i, i + 1);
          if (a[i] > a[i + 1]) {
            [a[i], a[i + 1]] = [a[i + 1], a[i]];
            pushSwap(i, i + 1);
            swapped = true;
          }
        }
        pushMarkSorted([end]);
        if (!swapped) {
          const rest = [];
          for (let k = 0; k <= end; k++) rest.push(k);
          pushMarkSorted(rest);
          break;
        }
      }
    }

    if (algo === 'selection') {
      const n = a.length;
      for (let i = 0; i < n; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
          pushCompare(minIdx, j);
          if (a[j] < a[minIdx]) minIdx = j;
        }
        if (minIdx !== i) {
          [a[i], a[minIdx]] = [a[minIdx], a[i]];
          pushSwap(i, minIdx);
        }
        pushMarkSorted([i]);
      }
    }

    if (algo === 'insertion') {
      const n = a.length;
      pushMarkSorted([0]);
      for (let i = 1; i < n; i++) {
        let j = i;
        while (j > 0) {
          pushCompare(j - 1, j);
          if (a[j - 1] > a[j]) {
            [a[j - 1], a[j]] = [a[j], a[j - 1]];
            pushSwap(j - 1, j);
            j--;
          } else {
            break;
          }
        }
        const done = [];
        for (let k = 0; k <= i; k++) done.push(k);
        pushMarkSorted(done);
      }
    }

    if (algo === 'merge') {
      this.mergeSortSteps(a, 0, a.length - 1, pushCompare, pushSet, pushMarkSorted, pushRange, clearRange);
      const all = Array.from({ length: a.length }, (_, i) => i);
      pushMarkSorted(all);
      clearRange();
    }

    if (algo === 'quick') {
      this.quickSortSteps(a, 0, a.length - 1, pushCompare, pushSwap, pushPivot, pushMarkSorted, pushRange, clearRange);
      const all = Array.from({ length: a.length }, (_, i) => i);
      pushMarkSorted(all);
      clearRange();
    }

    out.push({ type: 'done' });
    return out;
  }

  // 归并：每次 merge 前 pushRange(l,r,'merge')，merge 完后可 markSorted(l..r)
  mergeSortSteps(a, l, r, pushCompare, pushSet, pushMarkSorted, pushRange, clearRange) {
    if (l >= r) return;
    const mid = (l + r) >> 1;

    this.mergeSortSteps(a, l, mid, pushCompare, pushSet, pushMarkSorted, pushRange, clearRange);
    this.mergeSortSteps(a, mid + 1, r, pushCompare, pushSet, pushMarkSorted, pushRange, clearRange);

    // ✅ 增强2：标记当前合并区间
    pushRange(l, r, 'merge');

    const tmp = [];
    let i = l, j = mid + 1;
    while (i <= mid && j <= r) {
      pushCompare(i, j);
      if (a[i] <= a[j]) tmp.push(a[i++]);
      else tmp.push(a[j++]);
    }
    while (i <= mid) tmp.push(a[i++]);
    while (j <= r) tmp.push(a[j++]);

    for (let k = 0; k < tmp.length; k++) {
      a[l + k] = tmp[k];
      pushSet(l + k, tmp[k]);
    }

    // 合并完成，标记区间（可选但更直观）
    const seg = [];
    for (let x = l; x <= r; x++) seg.push(x);
    pushMarkSorted(seg);

    // 让区间背景保留一小会儿（靠动画步骤自然停留）
    // clearRange 不在这里调用，避免闪烁；由上层排序完成统一 clearRange
  }

  // 快排：每次分区 pushRange(l,r,'quick')；pivot 使用 pivot step
  quickSortSteps(a, l, r, pushCompare, pushSwap, pushPivot, pushMarkSorted, pushRange, clearRange) {
    if (l > r) return;
    if (l === r) {
      pushMarkSorted([l]);
      return;
    }

    // ✅ 增强2：当前分区区间
    pushRange(l, r, 'quick');

    // Lomuto partition
    const pivot = a[r];
    pushPivot(r);

    let i = l;
    for (let j = l; j < r; j++) {
      pushCompare(j, r);
      if (a[j] < pivot) {
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          pushSwap(i, j);
        }
        i++;
      }
    }

    [a[i], a[r]] = [a[r], a[i]];
    pushSwap(i, r);
    pushMarkSorted([i]);

    this.quickSortSteps(a, l, i - 1, pushCompare, pushSwap, pushPivot, pushMarkSorted, pushRange, clearRange);
    this.quickSortSteps(a, i + 1, r, pushCompare, pushSwap, pushPivot, pushMarkSorted, pushRange, clearRange);
  }

  // -----------------------------
  // Controls
  // -----------------------------
  toggleButtonsIdle() {
    this.dom.btnStart.disabled = false;
    this.dom.btnPause.disabled = true;
    this.dom.btnStep.disabled = true;

    this.dom.btnRandom.disabled = false;
    this.dom.btnReverse.disabled = false;
    this.dom.btnNearly.disabled = false;

    this.dom.algoSelect.disabled = false;
    this.dom.sizeRange.disabled = false;

    this.dom.btnPause.textContent = '⏸ 暂停';
  }

  toggleButtonsSorting() {
    this.dom.btnStart.disabled = true;
    this.dom.btnPause.disabled = false;
    this.dom.btnStep.disabled = false;

    this.dom.btnRandom.disabled = true;
    this.dom.btnReverse.disabled = true;
    this.dom.btnNearly.disabled = true;

    this.dom.algoSelect.disabled = true;
    this.dom.sizeRange.disabled = true;
  }

  resetAll({ keepArray = false } = {}) {
    this.running = false;
    this.paused = false;
    this.inSorting = false;

    this.steps = [];
    this.stepIndex = 0;

    this.hideTooltip();
    this.clearHighlights();
    this.resetCounters();

    if (!keepArray) {
      this.arr = this.genRandomArray(Number(this.dom.sizeRange.value));
      this.originalArr = [...this.arr];
    } else {
      this.arr = [...this.originalArr];
    }

    this.renderBars();
    this.setStatus('就绪');
    this.toggleButtonsIdle();
  }

  startSorting() {
    if (this.inSorting) return;

    this.hideTooltip();
    this.clearHighlights();
    this.resetCounters();

    const algo = this.dom.algoSelect.value;
    this.steps = this.buildSteps(algo, this.arr);
    this.stepIndex = 0;

    this.inSorting = true;
    this.paused = false;

    this.setStatus('排序中…');
    this.toggleButtonsSorting();
    this.runLoop();
  }

  pauseSorting() {
    if (!this.inSorting) return;
    this.paused = !this.paused;
    this.setStatus(this.paused ? '已暂停' : '排序中…');
    this.dom.btnPause.textContent = this.paused ? '▶ 继续' : '⏸ 暂停';
  }

  stepOnce() {
    if (!this.inSorting) return;

    this.paused = true;
    this.dom.btnPause.textContent = '▶ 继续';
    this.setStatus('单步（已暂停）');

    const ok = this.doOneStep();
    if (!ok) {
      this.inSorting = false;
      this.finalizeSorted();
      this.setStatus('完成 ✅');
      this.toggleButtonsIdle();
    }
  }

  // -----------------------------
  // Events
  // -----------------------------
  attachEvents() {
    // slider 文本
    this.dom.sizeRange.addEventListener('input', () => {
      this.dom.sizeText.textContent = this.dom.sizeRange.value;
    });
    this.dom.speedRange.addEventListener('input', () => {
      this.dom.speedText.textContent = this.dom.speedRange.value;
    });

    // 数量 change：重置
    this.dom.sizeRange.addEventListener('change', () => {
      if (this.inSorting) return;
      this.resetAll({ keepArray: false });
    });

    // 数组生成
    this.dom.btnRandom.addEventListener('click', () => {
      if (this.inSorting) return;
      this.arr = this.genRandomArray(Number(this.dom.sizeRange.value));
      this.originalArr = [...this.arr];
      this.hideTooltip();
      this.clearHighlights();
      this.resetCounters();
      this.renderBars();
      this.setStatus('已随机');
    });

    this.dom.btnReverse.addEventListener('click', () => {
      if (this.inSorting) return;
      this.arr = this.reverseArray(this.arr);
      this.originalArr = [...this.arr];
      this.hideTooltip();
      this.clearHighlights();
      this.resetCounters();
      this.renderBars();
      this.setStatus('已反转');
    });

    this.dom.btnNearly.addEventListener('click', () => {
      if (this.inSorting) return;
      this.arr = this.makeNearlySorted(this.arr);
      this.originalArr = [...this.arr];
      this.hideTooltip();
      this.clearHighlights();
      this.resetCounters();
      this.renderBars();
      this.setStatus('已生成近乎有序');
    });

    // 控制按钮
    this.dom.btnStart.addEventListener('click', () => this.startSorting());
    this.dom.btnPause.addEventListener('click', () => this.pauseSorting());
    this.dom.btnStep.addEventListener('click', () => this.stepOnce());

    this.dom.btnReset.addEventListener('click', () => {
      // 重置为“当前数组初始状态”
      this.resetAll({ keepArray: true });
    });

    // 页面离开时关 tooltip
    window.addEventListener('blur', () => this.hideTooltip());
  }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
  const app = new SortVisualizer();
  app.init();
  // 可选：挂到全局调试
  window.SortVisualizerApp = app;
});
