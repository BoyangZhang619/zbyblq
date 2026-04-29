/* =========================================================
  Color Vision Screening (A) + Threshold (B)
  - No external deps
  - Mobile friendly, seed reproducible
========================================================= */

/* ------------------ Utilities ------------------ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function clamp01(x) { return Math.min(1, Math.max(0, x)); }
function clamp(x, min, max) { return Math.min(max, Math.max(min, x)); }

function hexSeed(u32) {
    return u32.toString(16).padStart(8, "0");
}
function parseSeedFromUrl() {
    const p = new URLSearchParams(location.search);
    const s = p.get("seed");
    if (!s) return null;
    const n = parseInt(s, 16);
    if (Number.isFinite(n) && n >= 0) return (n >>> 0);
    return null;
}
function setSeedToUrl(u32) {
    const url = new URL(location.href);
    url.searchParams.set("seed", hexSeed(u32));
    history.replaceState(null, "", url.toString());
}
function copyText(txt) {
    return navigator.clipboard?.writeText(txt).catch(() => {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
    });
}

// Mulberry32 (seedable RNG)
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a += 0x6D2B79F5;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function randInt(rng, a, b) { // inclusive
    return Math.floor(rng() * (b - a + 1)) + a;
}
function shuffleInPlace(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/* ------------------ Color: sRGB <-> Lab ------------------ */
/* D65/2° reference */
function srgbToLinear(c) {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c) {
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(clamp01(c) * 255);
}
function rgbToXyz({ r, g, b }) {
    const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
    // sRGB to XYZ (D65)
    const x = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
    const y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750;
    const z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;
    return { x, y, z };
}
function xyzToRgb({ x, y, z }) {
    // XYZ to linear RGB
    let R = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
    let G = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
    let B = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
    return { r: linearToSrgb(R), g: linearToSrgb(G), b: linearToSrgb(B) };
}
function fLab(t) {
    return t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
}
function finvLab(t) {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
}
function xyzToLab({ x, y, z }) {
    // D65 reference white
    const Xn = 0.95047, Yn = 1.0, Zn = 1.08883;
    const fx = fLab(x / Xn);
    const fy = fLab(y / Yn);
    const fz = fLab(z / Zn);
    const L = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);
    return { L, a, b };
}
function labToXyz({ L, a, b }) {
    const Xn = 0.95047, Yn = 1.0, Zn = 1.08883;
    const fy = (L + 16) / 116;
    const fx = fy + a / 500;
    const fz = fy - b / 200;
    const x = Xn * finvLab(fx);
    const y = Yn * finvLab(fy);
    const z = Zn * finvLab(fz);
    return { x, y, z };
}
function rgbToLab(rgb) {
    return xyzToLab(rgbToXyz(rgb));
}
function labToRgb(lab) {
    return xyzToRgb(labToXyz(lab));
}
function deltaE76(l1, l2) {
    const dL = l1.L - l2.L, da = l1.a - l2.a, db = l1.b - l2.b;
    return Math.sqrt(dL * dL + da * da + db * db);
}
function labToLch(lab) {
    const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
    let h = Math.atan2(lab.b, lab.a) * 180 / Math.PI;
    if (h < 0) h += 360;
    return { L: lab.L, C, h };
}
function lchToLab({ L, C, h }) {
    const hr = h * Math.PI / 180;
    return { L, a: C * Math.cos(hr), b: C * Math.sin(hr) };
}

/* ------------------ CVD Simulation (approx) ------------------
  这些矩阵是常见的近似（严重程度接近“强”缺陷的模拟），用于题板生成筛选；
  不是临床级模拟，但足够做“随机题板”稳定性约束。
-------------------------------------------------------------- */
const CVD_M = {
    protan: [
        [0.152286, 1.052583, -0.204868],
        [0.114503, 0.786281, 0.099216],
        [-0.003882, -0.048116, 1.051998]
    ],
    deutan: [
        [0.367322, 0.860646, -0.227968],
        [0.280085, 0.672501, 0.047413],
        [-0.011820, 0.042940, 0.968881]
    ],
    tritan: [
        [1.255528, -0.076749, -0.178779],
        [-0.078411, 0.930809, 0.147602],
        [0.004733, 0.691367, 0.303900]
    ]
};
function simCvdRgb(rgb, type) {
    const m = CVD_M[type];
    if (!m) return { ...rgb };
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const rr = clamp01(m[0][0] * r + m[0][1] * g + m[0][2] * b);
    const gg = clamp01(m[1][0] * r + m[1][1] * g + m[1][2] * b);
    const bb = clamp01(m[2][0] * r + m[2][1] * g + m[2][2] * b);
    return { r: Math.round(rr * 255), g: Math.round(gg * 255), b: Math.round(bb * 255) };
}

/* ------------------ Canvas sizing ------------------ */
function fitCanvas(canvas, cssW, cssH) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
}
function fitSquareCanvasToCss(canvas, fallback = 520) {
    const w = canvas.getBoundingClientRect().width || fallback;
    return fitCanvas(canvas, w, w);
}

function fitRectCanvasToCss(canvas, fallbackW = 320, fallbackH = 220) {
    const r = canvas.getBoundingClientRect();
    const w = r.width || fallbackW;
    const h = r.height || fallbackH;
    return fitCanvas(canvas, w, h);
}


/* ------------------ Tabs ------------------ */
function initTabs() {
    const tabs = $$(".tab");
    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");

            const target = btn.dataset.tab;
            $$(".panel").forEach(p => p.classList.remove("active"));
            $("#panel" + target).classList.add("active");

            requestAnimationFrame(() => {
                resizeAllCanvases();
                requestAnimationFrame(resizeAllCanvases);
            });
        });
    });
}

/* =========================================================
  Seed / Share link
========================================================= */
let SEED = parseSeedFromUrl();
if (SEED == null) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    SEED = buf[0] >>> 0;
    setSeedToUrl(SEED);
}
let rng = mulberry32(SEED);
$("#seedView").textContent = hexSeed(SEED);

$("#copyLinkBtn").addEventListener("click", async () => {
    await copyText(location.href);
    toast("已复制可分享链接");
});
$("#newSeedBtn").addEventListener("click", () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    SEED = buf[0] >>> 0;
    rng = mulberry32(SEED);
    setSeedToUrl(SEED);
    $("#seedView").textContent = hexSeed(SEED);
    resetA();
    resetB();
    toast("已切换新的随机 Seed");
});

function toast(msg) {
    // lightweight toast
    let el = document.querySelector(".toast");
    if (!el) {
        el = document.createElement("div");
        el.className = "toast";
        el.style.position = "fixed";
        el.style.left = "50%";
        el.style.bottom = "18px";
        el.style.transform = "translateX(-50%)";
        el.style.padding = "10px 12px";
        el.style.border = "1px solid rgba(255,255,255,.18)";
        el.style.borderRadius = "14px";
        el.style.background = "rgba(0,0,0,.60)";
        el.style.color = "rgba(255,255,255,.92)";
        el.style.zIndex = "9999";
        el.style.backdropFilter = "blur(8px)";
        el.style.fontSize = "13px";
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = "0"; }, 1400);
}

/* =========================================================
  Module A: Screening plates (random pseudo-isochromatic)
========================================================= */
const plateCanvas = $("#plate");
let plateCtx = null;

// A state
let A_RUNNING = false;
let A_ITEMS = [];
let A_INDEX = 0;
let A_TIMER = null;
let A_TICK = null;
let A_TIME_LEFT = 0;
let A_PER_Q = 8;

// records
let A_REC = []; // {type, expected, answer, seenType, ms, timeout, correct}

// Enable start when checklist ok
["#okNight", "#okLight", "#okExplain"].forEach(id => {
    $(id).addEventListener("change", updateStartAEnable);
});
function updateStartAEnable() {
    const ok = $("#okNight").checked && $("#okLight").checked && $("#okExplain").checked;
    $("#startA").disabled = !ok || A_RUNNING;
}
updateStartAEnable();

$("#startA").addEventListener("click", startA);
$("#resetA").addEventListener("click", resetA);

$("#submitAns").addEventListener("click", () => submitA(false));
$("#cantSee").addEventListener("click", () => submitA(true));
$("#ans").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitA(false);
});

function buildATestPlan() {
    const total = clamp(parseInt($("#aCount").value || "16", 10), 10, 30);
    A_PER_Q = clamp(parseInt($("#aTime").value || "8", 10), 4, 15);
    const includeTritan = $("#aIncludeTritan").checked;
    const moreBlank = $("#aMoreBlank").checked;

    // We’ll allocate:
    // - control: ~35%
    // - protan: ~25%
    // - deutan: ~25%
    // - blank: 1 or 2
    // - tritan: 1 or 2 (optional)
    const items = [];
    const nBlank = moreBlank ? Math.max(1, Math.round(total * 0.12)) : 0;
    const nTritan = includeTritan ? Math.max(1, Math.round(total * 0.12)) : 0;

    const remain = total - nBlank - nTritan;
    const nControl = Math.max(4, Math.round(remain * 0.38));
    const nRG = remain - nControl;
    const nProtan = Math.floor(nRG / 2);
    const nDeutan = nRG - nProtan;

    for (let i = 0; i < nControl; i++) items.push({ type: "control" });
    for (let i = 0; i < nProtan; i++) items.push({ type: "protan" });
    for (let i = 0; i < nDeutan; i++) items.push({ type: "deutan" });
    for (let i = 0; i < nBlank; i++) items.push({ type: "blank" });
    for (let i = 0; i < nTritan; i++) items.push({ type: "tritan" });

    // shuffle with seed-derived rng (but stable per SEED)
    // Use a derived rng so A order doesn't depend on B usage
    const rr = mulberry32((SEED ^ 0xA11CE) >>> 0);
    shuffleInPlace(items, rr);

    // assign digits (two-digit) for non-blank
    items.forEach(it => {
        if (it.type === "blank") {
            it.expected = null;
        } else {
            it.expected = randInt(rr, 12, 99);
        }
    });
    return items;
}

function startA() {
    resetA();
    A_ITEMS = buildATestPlan();
    A_RUNNING = true;
    $("#startA").disabled = true;
    $("#resetA").disabled = false;
    $("#aQTotal").textContent = String(A_ITEMS.length);
    A_INDEX = 0;
    A_REC = [];
    $("#resultA").innerHTML = `<h2>模块A结果</h2><div class="muted">进行中…</div>`;
    nextA();
}

function resetA() {
    A_RUNNING = false;
    A_ITEMS = [];
    A_INDEX = 0;
    A_REC = [];
    clearATimers();
    $("#aQIndex").textContent = "—";
    $("#aQTotal").textContent = "—";
    $("#aProgressBar").style.width = "0%";
    $("#aTimerBar").style.width = "0%";
    $("#aTimerText").textContent = "—";
    $("#ans").value = "";
    $("#resetA").disabled = true;
    updateStartAEnable();
    // clear canvas
    if (plateCtx) {
        plateCtx.clearRect(0, 0, plateCanvas.width, plateCanvas.height);
    }
    $("#resultA").innerHTML = `<h2>模块A结果</h2><div class="muted">开始测试后，这里会显示统计与倾向提示。</div>`;
}

function clearATimers() {
    if (A_TIMER) clearTimeout(A_TIMER);
    if (A_TICK) clearInterval(A_TICK);
    A_TIMER = null; A_TICK = null;
}

function nextA() {
    clearATimers();
    if (A_INDEX >= A_ITEMS.length) {
        A_RUNNING = false;
        updateStartAEnable();
        $("#resetA").disabled = false;
        renderAResult();
        return;
    }

    $("#ans").value = "";
    $("#ans").focus({ preventScroll: true });

    const item = A_ITEMS[A_INDEX];
    $("#aQIndex").textContent = String(A_INDEX + 1);

    const p = ((A_INDEX) / A_ITEMS.length) * 100;
    $("#aProgressBar").style.width = p.toFixed(1) + "%";

    // draw plate
    drawPlate(item);

    // timer
    A_TIME_LEFT = A_PER_Q;
    $("#aTimerText").textContent = String(A_TIME_LEFT);
    $("#aTimerBar").style.width = "100%";

    const t0 = performance.now();
    A_TICK = setInterval(() => {
        const dt = (performance.now() - t0) / 1000;
        const left = Math.max(0, A_PER_Q - dt);
        const sec = Math.ceil(left);
        if (sec !== A_TIME_LEFT) {
            A_TIME_LEFT = sec;
            $("#aTimerText").textContent = String(A_TIME_LEFT);
        }
        $("#aTimerBar").style.width = (left / A_PER_Q * 100).toFixed(1) + "%";
    }, 80);

    A_TIMER = setTimeout(() => {
        // timeout
        submitA(false, true);
    }, A_PER_Q * 1000);
}

function submitA(cantSee, isTimeout = false) {
    if (!A_RUNNING) return;
    clearATimers();

    const item = A_ITEMS[A_INDEX];
    const expected = item.expected;
    const raw = ($("#ans").value || "").trim();
    const ans = cantSee ? null : (raw === "" ? null : parseInt(raw, 10));
    const ms = (A_PER_Q - Math.max(0, A_TIME_LEFT)) * 1000; // approx
    let correct = false;

    if (item.type === "blank") {
        // blank: correct if user says can't see (or leaves empty)
        correct = (ans == null);
    } else {
        correct = (ans === expected);
    }

    A_REC.push({
        type: item.type,
        expected,
        answer: ans,
        cantSee,
        timeout: isTimeout,
        ms: Math.round(ms),
        correct
    });

    A_INDEX++;
    $("#aProgressBar").style.width = ((A_INDEX) / A_ITEMS.length * 100).toFixed(1) + "%";
    nextA();
}

/* ------------------ Plate generation & rendering ------------------ */

// Spatial hash to avoid overlapping circles
function makeSpatialHash(cell) {
    const map = new Map();
    const key = (cx, cy) => (cx << 16) ^ cy;
    return {
        add(x, y, r, idx) {
            const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
            const k = key(cx, cy);
            if (!map.has(k)) map.set(k, []);
            map.get(k).push(idx);
        },
        near(x, y) {
            const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
            const out = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const k = key(cx + dx, cy + dy);
                    const arr = map.get(k);
                    if (arr) out.push(...arr);
                }
            }
            return out;
        }
    };
}

// Create digit mask (Uint8Array) at given size
function makeDigitMask(size, digit, rr) {
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const ctx = off.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    if (digit == null) return { mask: new Uint8Array(size * size), bbox: null };

    // slight random rotate/scale for anti-memorization
    const rot = (rr() * 2 - 1) * (Math.PI / 180) * 6; // ±6°
    const scale = 1 + (rr() * 2 - 1) * 0.08;          // ±8%
    const fontSize = Math.floor(size * 0.75 * scale);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(rot);
    ctx.translate(-size / 2, -size / 2);

    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "PingFang SC","Microsoft YaHei", Arial`;
    ctx.fillText(String(digit), size / 2, size / 2);

    // make edges a bit softer
    ctx.globalAlpha = 0.26;
    ctx.filter = "blur(1.2px)";
    ctx.fillText(String(digit), size / 2, size / 2);
    ctx.restore();

    // read mask
    const img = ctx.getImageData(0, 0, size, size).data;
    const mask = new Uint8Array(size * size);
    let minX = size, minY = size, maxX = 0, maxY = 0;
    let any = false;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            // black text => low R,G,B => treat as inside
            const v = img[i]; // red
            const inside = v < 70; // threshold
            if (inside) {
                mask[y * size + x] = 1;
                any = true;
                if (x < minX) minX = x; if (y < minY) minY = y;
                if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
        }
    }
    const bbox = any ? { minX, minY, maxX, maxY } : null;
    return { mask, bbox };
}

// pick color pair for plate type, with validation
function pickColorPair(type, rr) {
    // target constraints (ΔE in normal vs simulated)
    const targetSim = (type === "protan" || type === "deutan" || type === "tritan") ? type : null;

    // thresholds
    const normalMin = 14, normalMax = 26;
    const targetMax = 8;   // under target CVD, make it hard
    const othersMin = 10;  // under non-target CVD, keep still somewhat separable (soft constraint)

    let best = null;
    let bestScore = -1e9;

    for (let attempt = 0; attempt < 80; attempt++) {
        // base in Lab mid region
        const bg = {
            L: 55 + rr() * 22,        // 55..77
            a: (rr() * 2 - 1) * 22,       // -22..22
            b: (rr() * 2 - 1) * 22
        };

        // make fg by moving mostly along axis depending on type
        let fg = { ...bg };
        if (type === "tritan") {
            fg.b += (rr() < 0.5 ? -1 : 1) * (18 + rr() * 18); // push b axis
            fg.a += (rr() * 2 - 1) * 8;
        } else {
            // red-green
            fg.a += (rr() < 0.5 ? -1 : 1) * (18 + rr() * 18); // push a axis
            fg.b += (rr() * 2 - 1) * 10;
        }
        // control: moderate hue shift
        if (type === "control") {
            fg.a += (rr() * 2 - 1) * 10;
            fg.b += (rr() * 2 - 1) * 10;
            fg.L += (rr() * 2 - 1) * 6;
        }

        // bound Lab
        bg.L = clamp(bg.L, 35, 85);
        fg.L = clamp(fg.L, 35, 85);

        const bgRgb = labToRgb(bg);
        const fgRgb = labToRgb(fg);

        // basic gamut check (after conversion, values already clamped to 0..255 by our linearToSrgb)
        // but if it clamps too much, colors become distorted; detect by re-convert and compare error.
        const bg2 = rgbToLab(bgRgb);
        const fg2 = rgbToLab(fgRgb);
        const err = deltaE76(bg, bg2) + deltaE76(fg, fg2);
        if (err > 8) continue;

        const dN = deltaE76(bg2, fg2);
        if (dN < normalMin || dN > normalMax) continue;

        // simulate
        const dP = deltaE76(rgbToLab(simCvdRgb(bgRgb, "protan")), rgbToLab(simCvdRgb(fgRgb, "protan")));
        const dD = deltaE76(rgbToLab(simCvdRgb(bgRgb, "deutan")), rgbToLab(simCvdRgb(fgRgb, "deutan")));
        const dT = deltaE76(rgbToLab(simCvdRgb(bgRgb, "tritan")), rgbToLab(simCvdRgb(fgRgb, "tritan")));

        let ok = true;
        if (targetSim) {
            const dTarget = targetSim === "protan" ? dP : targetSim === "deutan" ? dD : dT;
            if (dTarget > targetMax) ok = false;
            // soft keep others not too low
            if (targetSim !== "protan" && dP < othersMin) ok = false;
            if (targetSim !== "deutan" && dD < othersMin) ok = false;
            if (targetSim !== "tritan" && dT < othersMin) ok = false;
        } else {
            // control: all sims should still have some separability
            if (dP < 10 || dD < 10) ok = false;
        }
        if (!ok) continue;

        // Additional heuristic: protan vs deutan separation
        // For "protan" try to make red channel more critical (fg or bg with higher R)
        let score = dN;
        if (type === "protan") {
            score += (Math.abs(fgRgb.r - bgRgb.r) - Math.abs(fgRgb.g - bgRgb.g)) * 0.15;
            score += (dD - dP) * 0.55; // ideally deutan sees it better than protan
        } else if (type === "deutan") {
            score += (Math.abs(fgRgb.g - bgRgb.g) - Math.abs(fgRgb.r - bgRgb.r)) * 0.15;
            score += (dP - dD) * 0.55; // ideally protan sees it better than deutan
        } else if (type === "tritan") {
            score += (dP + dD) * 0.05; // keep RG okay
        }

        if (score > bestScore) {
            bestScore = score;
            best = { bgRgb, fgRgb, stats: { dN, dP, dD, dT } };
        }
    }

    // fallback
    if (!best) {
        const bgRgb = { r: 90, g: 105, b: 140 };
        const fgRgb = (type === "tritan") ? { r: 100, g: 110, b: 110 } : { r: 120, g: 110, b: 90 };
        best = { bgRgb, fgRgb, stats: null };
    }
    return best;
}

function jitterRgb(rr, rgb, amt = 10) {
    return {
        r: clamp(Math.round(rgb.r + (rr() * 2 - 1) * amt), 0, 255),
        g: clamp(Math.round(rgb.g + (rr() * 2 - 1) * amt), 0, 255),
        b: clamp(Math.round(rgb.b + (rr() * 2 - 1) * amt), 0, 255)
    };
}
let debugShowMask = false;
function drawPlate(item) {
    console.log("Drawing plate:", item);
    if (!plateCtx) plateCtx = fitSquareCanvasToCss(plateCanvas);
    const ctx = plateCtx;

    const size = plateCanvas.getBoundingClientRect().width; // CSS px
    const S = Math.round(size);
    // re-fit to ensure correct pixel mapping
    plateCtx = fitCanvas(plateCanvas, S, S);

    const rr = mulberry32(((SEED ^ 0xA0A0A0) + A_INDEX * 97) >>> 0);

    // create digit mask
    const { mask } = makeDigitMask(S, item.expected, rr);
    let maskSum = 0;
    for (let i = 0; i < mask.length; i++) maskSum += mask[i];
    const fillRatio = maskSum / (S * S);

    // 2 位数字通常 fillRatio 大概在 0.01~0.06（看字体/大小）
    // 如果太小，说明数字基本没画出来
    if (item.expected != null && fillRatio < 0.004) {
        // 退化策略：用更宽松阈值重做一次
        const dm = makeDigitMaskLooser(S, item.expected, rr); // 你按下面补丁2加这个函数
        mask.set(dm.mask);
    }
    // pick colors with validation
    const pair = pickColorPair(item.type, rr);
    const bg = pair.bgRgb;
    const fg = pair.fgRgb;

    // background fill
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
    ctx.fillRect(0, 0, S, S);

    // dots packing
    const minR = Math.max(2, Math.floor(S * 0.006));
    const maxR = Math.max(minR + 2, Math.floor(S * 0.017));
    const targetDots = Math.floor(S * S / (Math.PI * ((minR + maxR) / 2) ** 2) * 0.22);

    const cell = maxR + 2;
    const hash = makeSpatialHash(cell);
    const dots = [];
    const tries = targetDots * 12;

    for (let t = 0; t < tries && dots.length < targetDots; t++) {
        const r = minR + rr() * (maxR - minR);
        const x = r + rr() * (S - 2 * r);
        const y = r + rr() * (S - 2 * r);
        const nearIdx = hash.near(x, y);

        let ok = true;
        for (const idx of nearIdx) {
            const d = dots[idx];
            const dx = d.x - x, dy = d.y - y;
            const minDist = d.r + r + 0.8;
            if (dx * dx + dy * dy < minDist * minDist) { ok = false; break; }
        }
        if (!ok) continue;

        // determine fg/bg by mask at center
        const mx = Math.floor(x), my = Math.floor(y);
        function maskHit(mask, S, x, y) {
            const pts = [
                [0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]
            ];
            for (const [dx, dy] of pts) {
                const xx = clamp(Math.floor(x + dx), 0, S - 1);
                const yy = clamp(Math.floor(y + dy), 0, S - 1);
                if (mask[yy * S + xx] === 1) return true;
            }
            return false;
        }
        const inside = (item.expected != null) ? maskHit(mask, S, x, y) : false;

        dots.push({ x, y, r, inside });
        hash.add(x, y, r, dots.length - 1);
    }

    // draw dots
    for (const d of dots) {
        const base = d.inside ? fg : bg;
        const col = jitterRgb(rr, base, d.inside ? 12 : 10);

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
        ctx.fill();
    }

    // subtle grain overlay (helps reduce edge cues)
    ctx.globalAlpha = 0.10;
    for (let i = 0; i < 800; i++) {
        const x = rr() * S, y = rr() * S;
        ctx.fillStyle = rr() < 0.5 ? "rgba(0,0,0,.8)" : "rgba(255,255,255,.8)";
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // border vignette
    const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.15, S / 2, S / 2, S * 0.62);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.16)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    console.log(item.type, item.expected, fillRatio, JSON.stringify(pair));
    if (debugShowMask && item.expected != null) {
        const img = plateCtx.createImageData(S, S);
        for (let i = 0; i < S * S; i++) {
            if (mask[i]) {
                img.data[i * 4 + 0] = 0;
                img.data[i * 4 + 1] = 0;
                img.data[i * 4 + 2] = 0;
                img.data[i * 4 + 3] = 35; // 透明黑
            }
        }
        plateCtx.putImageData(img, 0, 0);
    }

}
function makeDigitMaskLooser(size, digit, rr) {
    const off = document.createElement("canvas");
    off.width = size; off.height = size;
    const ctx = off.getContext("2d");
    ctx.clearRect(0, 0, size, size);

    if (digit == null) return { mask: new Uint8Array(size * size), bbox: null };

    const rot = (rr() * 2 - 1) * (Math.PI / 180) * 4;
    const scale = 1 + (rr() * 2 - 1) * 0.06;
    const fontSize = Math.floor(size * 0.36 * scale);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(rot);
    ctx.translate(-size / 2, -size / 2);

    ctx.globalAlpha = 1;
    ctx.filter = "none";              // 关键：不要 blur
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "PingFang SC","Microsoft YaHei", Arial`;
    ctx.fillText(String(digit), size / 2, size / 2);
    ctx.restore();

    const img = ctx.getImageData(0, 0, size, size).data;
    const mask = new Uint8Array(size * size);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            // 放宽阈值：<120 而不是 <70
            if (img[i] < 120) mask[y * size + x] = 1;
        }
    }
    return { mask, bbox: null };
}

function renderAResult() {
    // aggregate
    const by = (t) => A_REC.filter(x => x.type === t);
    const stats = (arr) => {
        const n = arr.length;
        const ok = arr.filter(x => x.correct).length;
        const cant = arr.filter(x => x.cantSee).length;
        const to = arr.filter(x => x.timeout).length;
        return { n, ok, acc: n ? ok / n : 0, cant, to };
    };

    const sControl = stats(by("control"));
    const sProtan = stats(by("protan"));
    const sDeutan = stats(by("deutan"));
    const sTritan = stats(by("tritan"));
    const sBlank = stats(by("blank"));

    // reliability flags
    const reliability = [];
    if (sControl.n && sControl.acc < 0.6) reliability.push({ lvl: "warn", txt: "控制组正确率偏低：可能受环境/屏幕设置/操作影响，结果可信度下降。" });
    if (sBlank.n) {
        const fp = by("blank").filter(x => x.answer != null).length; // false positives
        const fpRate = fp / sBlank.n;
        if (fpRate > 0.35) reliability.push({ lvl: "warn", txt: `空板误报率偏高（${Math.round(fpRate * 100)}%）：可能存在猜测/输入习惯，结果需谨慎解读。` });
    }
    const timeoutRate = A_REC.filter(x => x.timeout).length / Math.max(1, A_REC.length);
    if (timeoutRate > 0.25) reliability.push({ lvl: "warn", txt: `超时比例偏高（${Math.round(timeoutRate * 100)}%）：建议放慢节奏或增加每题限时后重测。` });

    // tendency
    // Simple logic:
    // - If RG groups both low vs control, suspect red-green.
    // - Compare protan vs deutan to give leaning.
    // - Tritan used only if enabled.
    let tendency = { lvl: "ok", title: "未见明显异常（筛查）", detail: "你的表现更接近一般人群在此类筛查中的范围。若你仍有自觉困扰，建议在稳定环境下重测或做专业检查确认。" };

    const rgAcc = (sProtan.n + sDeutan.n) ? ((sProtan.ok + sDeutan.ok) / (sProtan.n + sDeutan.n)) : null;
    const ctrlAcc = sControl.n ? sControl.acc : null;

    if (ctrlAcc != null && rgAcc != null) {
        const drop = ctrlAcc - rgAcc;
        if (drop > 0.20 && rgAcc < 0.70) {
            // red-green suspicious
            let lean = "红绿色觉异常筛查阳性倾向";
            let subtype = "（protan/deutan 倾向待定）";
            if (sProtan.n && sDeutan.n) {
                const diff = sDeutan.acc - sProtan.acc;
                if (diff > 0.12) subtype = "（更偏 protan 倾向）";
                else if (diff < -0.12) subtype = "（更偏 deutan 倾向）";
                else subtype = "（protan/deutan 倾向接近）";
            }
            tendency = {
                lvl: "bad",
                title: lean + " " + subtype,
                detail: "这仍不是诊断。建议在不同设备/光线下重测；如与职业要求或日常困扰相关，可到眼科做标准色觉检查确认。"
            };
        }
    }

    if ($("#aIncludeTritan").checked && sTritan.n) {
        // If tritan group much worse than control and RG not as bad, note it.
        if (sControl.n && sTritan.acc < sControl.acc - 0.25 && (rgAcc == null || rgAcc > 0.65)) {
            tendency = {
                lvl: "warn",
                title: "蓝黄色觉异常可能性（筛查提示）",
                detail: "蓝黄筛查更容易受屏幕色温/校准影响。建议关闭色温调整后复测；若仍明显偏低，可考虑专业检查确认。"
            };
        }
    }

    const badge = (lvl) => {
        const map = {
            ok: { txt: "OK", cls: "ok" },
            warn: { txt: "注意", cls: "warn" },
            bad: { txt: "提示", cls: "bad" }
        };
        const b = map[lvl] || map.ok;
        return `<span class="badge ${b.cls}">${b.txt}</span>`;
    };

    // render
    const lines = [];
    lines.push(`<div class="row" style="margin:6px 0 10px;gap:10px;align-items:flex-start">
    ${badge(tendency.lvl)}
    <div>
      <div style="font-weight:800;font-size:15px">${escapeHtml(tendency.title)}</div>
      <div class="muted small" style="margin-top:4px">${escapeHtml(tendency.detail)}</div>
    </div>
  </div>`);

    lines.push(`<div class="gridStats">
    ${statCard("控制组", sControl)}
    ${statCard("Protan 组", sProtan)}
    ${statCard("Deutan 组", sDeutan)}
    ${$("#aIncludeTritan").checked ? statCard("Tritan 组", sTritan) : ""}
    ${$("#aMoreBlank").checked ? statCard("空板", sBlank, true) : ""}
  </div>`);

    if (reliability.length) {
        lines.push(`<div class="warnBox">
      <div style="font-weight:800;margin-bottom:6px">可靠性提示</div>
      <ul style="margin:0;padding-left:18px">
        ${reliability.map(r => `<li class="muted small">${escapeHtml(r.txt)}</li>`).join("")}
      </ul>
    </div>`);
    }

    lines.push(`<details class="adv" style="margin-top:10px">
    <summary>查看作答明细（用于自查）</summary>
    <div class="muted small" style="margin-top:8px;line-height:1.55">
      ${A_REC.map((r, i) => {
        const exp = r.expected == null ? "空" : r.expected;
        const ans = r.answer == null ? "—" : r.answer;
        const ok = r.correct ? "✅" : "❌";
        const tag = r.type;
        const extra = r.timeout ? "（超时）" : (r.cantSee ? "（看不清）" : "");
        return `<div>${i + 1}. [${tag}] 期望：<strong>${exp}</strong> / 你的：<strong>${ans}</strong> ${ok} ${extra}</div>`;
    }).join("")}
    </div>
  </details>`);

    $("#resultA").innerHTML = `<h2>模块A结果</h2>${lines.join("")}`;

    // extra styles injected (small)
    injectExtraStyles();
}

function statCard(name, s, isBlank = false) {
    const acc = (s.acc * 100).toFixed(0);
    let sub = `正确 ${s.ok}/${s.n}（${acc}%）`;
    if (isBlank) {
        const fp = byType("blank").filter(x => x.answer != null).length;
        sub = `“没有/看不清” ${s.ok}/${s.n}（${acc}%） · 误报 ${fp}/${s.n}`;
    }
    return `<div class="stat">
    <div class="muted small">${escapeHtml(name)}</div>
    <div style="font-weight:900;font-size:18px;margin-top:2px">${acc}%</div>
    <div class="muted small" style="margin-top:2px">${escapeHtml(sub)}</div>
    <div class="muted small" style="margin-top:2px">看不清：${s.cant} · 超时：${s.to}</div>
  </div>`;
}
function byType(t) { return A_REC.filter(x => x.type === t); }

function escapeHtml(s) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function injectExtraStyles() {
    if (document.getElementById("extraStyles")) return;
    const st = document.createElement("style");
    st.id = "extraStyles";
    st.textContent = `
    .badge{ display:inline-flex; align-items:center; justify-content:center; padding:8px 10px;
      border-radius:999px; border:1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08);
      font-weight:900; font-size:12px; min-width:52px;
    }
    .badge.ok{ outline: 2px solid rgba(110,255,190,.25); }
    .badge.warn{ outline: 2px solid rgba(255,210,120,.25); }
    .badge.bad{ outline: 2px solid rgba(255,120,120,.25); }

    .gridStats{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; margin-top:10px; }
    @media (max-width: 720px){ .gridStats{ grid-template-columns: 1fr; } }
    .stat{ padding:12px; border-radius:16px; border:1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); }

    .warnBox{ margin-top:10px; padding:12px; border-radius:16px; border:1px dashed rgba(255,210,120,.35);
      background: rgba(255,210,120,.08);
    }
  `;
    document.head.appendChild(st);
}

/* =========================================================
  Module B: 2AFC threshold via staircase
========================================================= */
const stimA = $("#stimA");
const stimB = $("#stimB");
let stimCtxA = null, stimCtxB = null;

let B_RUNNING = false;
let B_PLAN = []; // axes to run
let B_AXIS_INDEX = 0;
let B_TRIALS = 34;

let B_STATE = null; // per axis: {axis, trial, total, delta, ...}
let B_REC = []; // {axis, delta, correct, targetIsA, baseLab, diffLab, ms, reversal}

$("#startB").addEventListener("click", startB);
$("#resetB").addEventListener("click", resetB);
$("#pickA").addEventListener("click", () => submitB(true));
$("#pickB").addEventListener("click", () => submitB(false));

document.addEventListener("keydown", (e) => {
    if (!B_RUNNING) return;
    if (e.key.toLowerCase() === "a") submitB(true);
    if (e.key.toLowerCase() === "b") submitB(false);
});

function startB() {
    resetB();
    B_TRIALS = clamp(parseInt($("#bTrials").value || "34", 10), 20, 60);
    const order = $("#bOrder").value;
    if (order === "all") B_PLAN = ["hue", "lum", "sat"];
    else B_PLAN = [order];

    B_RUNNING = true;
    $("#resetB").disabled = false;
    $("#startB").disabled = true;
    B_AXIS_INDEX = 0;
    B_REC = [];
    $("#resultB").innerHTML = `<h2>模块B结果</h2><div class="muted">进行中…</div>`;
    nextAxis();
}

function resetB() {
    B_RUNNING = false;
    B_PLAN = [];
    B_AXIS_INDEX = 0;
    B_STATE = null;
    B_REC = [];
    $("#resetB").disabled = true;
    $("#startB").disabled = false;
    $("#bAxisName").textContent = "—";
    $("#bQIndex").textContent = "—";
    $("#bQTotal").textContent = "—";
    $("#bProgressBar").style.width = "0%";
    $("#bDeltaPill").textContent = "Δ —";
    if (stimCtxA) stimCtxA.clearRect(0, 0, stimA.width, stimA.height);
    if (stimCtxB) stimCtxB.clearRect(0, 0, stimB.width, stimB.height);
    $("#resultB").innerHTML = `<h2>模块B结果</h2><div class="muted">完成测试后，这里会显示阈值估计。</div>`;
}

function nextAxis() {
    if (B_AXIS_INDEX >= B_PLAN.length) {
        B_RUNNING = false;
        $("#startB").disabled = false;
        renderBResult();
        return;
    }

    const axis = B_PLAN[B_AXIS_INDEX];

    // axis-specific deltas & scaling
    const axisCfg = {
        hue: { delta0: 26, min: 2.5, max: 60, label: "Hue", unit: "°", factor: 0.86 },
        lum: { delta0: 14, min: 1.0, max: 30, label: "Luminance", unit: "L*", factor: 0.86 },
        sat: { delta0: 16, min: 1.2, max: 35, label: "Saturation", unit: "C*", factor: 0.86 }
    }[axis];

    B_STATE = {
        axis,
        label: axisCfg.label,
        unit: axisCfg.unit,
        trial: 0,
        total: B_TRIALS,
        delta: axisCfg.delta0,
        min: axisCfg.min,
        max: axisCfg.max,
        factor: axisCfg.factor,
        correctStreak: 0,     // for 2-down 1-up
        lastDir: null,        // "up" or "down"
        reversals: [],        // store delta at reversal
        t0: 0,
        targetIsA: true,
        baseLab: null,
        diffLab: null
    };

    $("#bAxisName").textContent = axisCfg.label;
    $("#bQTotal").textContent = String(B_TRIALS);
    $("#bQIndex").textContent = "1";
    $("#bProgressBar").style.width = "0%";

    nextTrial();
}

function nextTrial() {
    // stop if finished axis
    if (B_STATE.trial >= B_STATE.total) {
        B_AXIS_INDEX++;
        nextAxis();
        return;
    }

    // update UI
    $("#bQIndex").textContent = String(B_STATE.trial + 1);
    $("#bProgressBar").style.width = ((B_STATE.trial) / B_STATE.total * 100).toFixed(1) + "%";
    $("#bDeltaPill").textContent = `Δ ${B_STATE.delta.toFixed(1)}${B_STATE.unit}`;

    // choose base color in LCh (safer perceptual steps)
    const rr = mulberry32(((SEED ^ 0xBEEFB00) + B_AXIS_INDEX * 10007 + B_STATE.trial * 131) >>> 0);

    const L = 62 + (rr() * 2 - 1) * 10;      // 52..72
    const C = 26 + rr() * 14;            // 26..40
    const h = rr() * 360;

    const base = lchToLab({ L, C, h });
    const delta = B_STATE.delta;

    let diffLch = { L, C, h };
    if (B_STATE.axis === "hue") {
        diffLch.h = (h + (rr() < 0.5 ? -1 : 1) * delta + 360) % 360;
    } else if (B_STATE.axis === "lum") {
        diffLch.L = clamp(L + (rr() < 0.5 ? -1 : 1) * delta, 30, 90);
    } else if (B_STATE.axis === "sat") {
        diffLch.C = clamp(C + (rr() < 0.5 ? -1 : 1) * delta, 2, 60);
    }

    const diff = lchToLab(diffLch);

    // choose which side is target
    B_STATE.targetIsA = rr() < 0.5;
    B_STATE.baseLab = base;
    B_STATE.diffLab = diff;

    // render stimuli
    renderStimulus(B_STATE.targetIsA ? diff : base, stimA, true);
    renderStimulus(B_STATE.targetIsA ? base : diff, stimB, false);

    B_STATE.t0 = performance.now();
}

function renderStimulus(lab, canvas, isLeft) {
    if (canvas === stimA) {
        stimCtxA = fitRectCanvasToCss(stimA);
    } else {
        stimCtxB = fitRectCanvasToCss(stimB);
    }
    const ctx = (canvas === stimA) ? stimCtxA : stimCtxB;

    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    // base fill color (convert from Lab)
    const rgb = labToRgb(lab);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    ctx.fillRect(0, 0, w, h);

    // add subtle noise texture so edges aren't the only cue
    const rr = mulberry32(((SEED ^ 0x1234567) + (isLeft ? 7 : 11) + B_AXIS_INDEX * 19 + B_STATE.trial * 101) >>> 0);
    ctx.globalAlpha = 0.10;
    for (let i = 0; i < 1400; i++) {
        const x = rr() * w, y = rr() * h;
        const v = rr() < 0.5 ? 0 : 255;
        ctx.fillStyle = `rgba(${v},${v},${v},0.55)`;
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // add non-color cue as pattern (same for both) to avoid “只能靠颜色”的无障碍问题
    // IMPORTANT: pattern identical on A/B so it won't leak answer.
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "rgba(0,0,0,.7)";
    ctx.lineWidth = 1;
    const step = 16;
    for (let y = 0; y < h + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y - step);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // border vignette
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.1, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
}

function submitB(pickA) {
    if (!B_RUNNING || !B_STATE) return;
    const ms = Math.round(performance.now() - B_STATE.t0);
    const correct = (pickA === B_STATE.targetIsA);

    // 2-down 1-up staircase
    let dir = null;
    if (correct) {
        B_STATE.correctStreak++;
        if (B_STATE.correctStreak >= 2) {
            // go down (harder)
            const prev = B_STATE.delta;
            B_STATE.delta = Math.max(B_STATE.min, B_STATE.delta * B_STATE.factor);
            B_STATE.correctStreak = 0;
            dir = "down";
            // reversal check
            if (B_STATE.lastDir && B_STATE.lastDir !== dir) {
                B_STATE.reversals.push(prev);
            }
            B_STATE.lastDir = dir;
        }
    } else {
        // go up (easier)
        const prev = B_STATE.delta;
        B_STATE.delta = Math.min(B_STATE.max, B_STATE.delta / B_STATE.factor);
        B_STATE.correctStreak = 0;
        dir = "up";
        if (B_STATE.lastDir && B_STATE.lastDir !== dir) {
            B_STATE.reversals.push(prev);
        }
        B_STATE.lastDir = dir;
    }

    B_REC.push({
        axis: B_STATE.axis,
        delta: B_STATE.delta,
        correct,
        targetIsA: B_STATE.targetIsA,
        ms,
        reversal: (dir && B_STATE.reversals.length && B_STATE.reversals[B_STATE.reversals.length - 1] === (dir === "up" || dir === "down" ? undefined : undefined)) ? true : false
    });

    B_STATE.trial++;
    $("#bProgressBar").style.width = ((B_STATE.trial) / B_STATE.total * 100).toFixed(1) + "%";
    nextTrial();
}

function estimateThresholdForAxis(axis) {
    const rec = B_REC.filter(x => x.axis === axis);
    if (!rec.length) return null;

    // derive reversals from state snapshots:
    // We'll reconstruct reversals approximately by checking direction change in delta series
    const deltas = rec.map(x => x.delta);
    const dirs = [];
    for (let i = 1; i < deltas.length; i++) {
        const d = deltas[i] - deltas[i - 1];
        dirs.push(d > 0 ? "up" : d < 0 ? "down" : "flat");
    }
    const rev = [];
    for (let i = 1; i < dirs.length; i++) {
        if (dirs[i] !== "flat" && dirs[i - 1] !== "flat" && dirs[i] !== dirs[i - 1]) {
            rev.push(deltas[i]); // near reversal
        }
    }

    const tail = deltas.slice(-10);
    const median = (arr) => {
        const a = [...arr].sort((x, y) => x - y);
        const m = Math.floor(a.length / 2);
        return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
    };

    const est = (rev.length >= 6)
        ? median(rev.slice(-8))
        : median(tail);

    const correctRate = rec.filter(x => x.correct).length / rec.length;

    return {
        axis,
        est: +est.toFixed(2),
        correctRate: +(correctRate * 100).toFixed(0)
    };
}

function renderBResult() {
    const thHue = estimateThresholdForAxis("hue");
    const thLum = estimateThresholdForAxis("lum");
    const thSat = estimateThresholdForAxis("sat");

    const rows = [];
    if (thHue) rows.push(rowB("Hue", thHue.est, "°", thHue.correctRate));
    if (thLum) rows.push(rowB("Luminance", thLum.est, "L*", thLum.correctRate));
    if (thSat) rows.push(rowB("Saturation", thSat.est, "C*", thSat.correctRate));

    let note = `<p class="muted small">
    解释：阈值越大，表示需要更大的差异才能稳定分辨（筛查性质）。结果会受屏幕与环境影响。
  </p>`;
    $("#resultB").innerHTML = `<h2>模块B结果</h2>
    <div class="bTable">${rows.join("")}</div>${note}`;

    injectBStyles();
    updateExport();
}

function rowB(name, v, unit, rate) {
    return `<div class="bRow">
    <div class="muted small">${name}</div>
    <div class="bVal">${v}<span class="muted small"> ${unit}</span></div>
    <div class="muted small">正确率 ${rate}%</div>
  </div>`;
}

function injectBStyles() {
    if (document.getElementById("bStyles")) return;
    const st = document.createElement("style");
    st.id = "bStyles";
    st.textContent = `
    .bTable{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; margin-top:10px; }
    @media (max-width:720px){ .bTable{ grid-template-columns: 1fr; } }
    .bRow{ padding:12px; border-radius:16px; border:1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); }
    .bVal{ font-weight: 950; font-size: 20px; margin-top: 2px; }
  `;
    document.head.appendChild(st);
}

/* =========================================================
  Export results
========================================================= */
$("#exportBtn").addEventListener("click", updateExport);
$("#copyJsonBtn").addEventListener("click", async () => {
    updateExport();
    const txt = $("#exportOut").textContent || "";
    if (!txt.trim()) return;
    await copyText(txt);
    toast("结果 JSON 已复制");
});

function updateExport() {
    const exportObj = {
        seed: hexSeed(SEED),
        timeISO: new Date().toISOString(),
        moduleA: {
            config: {
                count: $("#aCount").value,
                secondsPerQ: $("#aTime").value,
                includeTritan: $("#aIncludeTritan").checked,
                moreBlank: $("#aMoreBlank").checked
            },
            records: A_REC
        },
        moduleB: {
            config: {
                order: $("#bOrder").value,
                trialsPerAxis: $("#bTrials").value
            },
            thresholds: {
                hue: estimateThresholdForAxis("hue"),
                luminance: estimateThresholdForAxis("lum"),
                saturation: estimateThresholdForAxis("sat")
            },
            records: B_REC
        }
    };
    $("#exportOut").textContent = JSON.stringify(exportObj, null, 2);
}

/* =========================================================
  Resize handling
========================================================= */
function resizeAllCanvases() {
    // plate
    if ($("#panelA").classList.contains("active")) {
        plateCtx = fitSquareCanvasToCss(plateCanvas);
        if (A_RUNNING && A_ITEMS[A_INDEX]) drawPlate(A_ITEMS[A_INDEX]);
    } else {
        // keep stable
        plateCtx = fitSquareCanvasToCss(plateCanvas);
    }

    // stimuli
    stimCtxA = fitRectCanvasToCss(stimA);
    stimCtxB = fitRectCanvasToCss(stimB);
    // re-render current B trial if running
    if (B_RUNNING && B_STATE) {
        renderStimulus(B_STATE.targetIsA ? B_STATE.diffLab : B_STATE.baseLab, stimA, true);
        renderStimulus(B_STATE.targetIsA ? B_STATE.baseLab : B_STATE.diffLab, stimB, false);
    }
}
window.addEventListener("resize", () => requestAnimationFrame(resizeAllCanvases));
window.addEventListener("orientationchange", () => setTimeout(resizeAllCanvases, 50));

/* Init */
initTabs();
requestAnimationFrame(() => {
    resizeAllCanvases();
    updateExport();
});
