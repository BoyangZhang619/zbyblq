import jpeg from "https://esm.sh/jpeg-js@0.4.4";

const $ = (id) => document.getElementById(id);

const els = {
  file: $("file"),
  status: $("status"),
  meta: $("meta"),

  q1: $("q1"), q1v: $("q1v"),
  scale: $("scale"), scaleV: $("scaleV"),
  q2: $("q2"), q2v: $("q2v"),
  loops: $("loops"), loopsV: $("loopsV"),

  warm: $("warm"), warmV: $("warmV"),
  desat: $("desat"), desatV: $("desatV"),
  contrast: $("contrast"), contrastV: $("contrastV"),
  grime: $("grime"), grimeV: $("grimeV"),
  grain: $("grain"), grainV: $("grainV"),
  vignette: $("vignette"), vignetteV: $("vignetteV"),
  sharpen: $("sharpen"), sharpenV: $("sharpenV"),
  scanlines: $("scanlines"), scanV: $("scanV"),

  randomBtn: $("randomBtn"),
  resetBtn: $("resetBtn"),
  downloadPng: $("downloadPng"),
  downloadJpg: $("downloadJpg"),

  srcCanvas: $("srcCanvas"),
  outCanvas: $("outCanvas"),
  srcInfo: $("srcInfo"),
  outInfo: $("outInfo"),
  perf: $("perf"),
};

const srcCtx = els.srcCanvas.getContext("2d", { willReadFrequently: true });
const outCtx = els.outCanvas.getContext("2d", { willReadFrequently: true });

// 离屏画布
const cA = document.createElement("canvas");
const cB = document.createElement("canvas");
const cC = document.createElement("canvas");
const aCtx = cA.getContext("2d", { willReadFrequently: true });
const bCtx = cB.getContext("2d", { willReadFrequently: true });
const cCtx = cC.getContext("2d", { willReadFrequently: true });

let loaded = false;
let imgW = 0, imgH = 0;

const defaults = {
  q1: 55,
  scale: 0.72,
  q2: 35,
  loops: 1,
  warm: 0.26,
  desat: 0.18,
  contrast: 0.12,
  grime: 0.22,
  grain: 0.12,
  vignette: 0.16,
  sharpen: 0.22,
  scanlines: 0.08,
};

function clamp255(x){ return x < 0 ? 0 : (x > 255 ? 255 : x); }

function setStatus(text){ els.status.textContent = text; }

function updateLabels(){
  els.q1v.textContent = els.q1.value;
  els.q2v.textContent = els.q2.value;
  els.scaleV.textContent = (+els.scale.value).toFixed(2);
  els.loopsV.textContent = els.loops.value;

  els.warmV.textContent = (+els.warm.value).toFixed(2);
  els.desatV.textContent = (+els.desat.value).toFixed(2);
  els.contrastV.textContent = (+els.contrast.value).toFixed(2);
  els.grimeV.textContent = (+els.grime.value).toFixed(2);
  els.grainV.textContent = (+els.grain.value).toFixed(2);
  els.vignetteV.textContent = (+els.vignette.value).toFixed(2);
  els.sharpenV.textContent = (+els.sharpen.value).toFixed(2);
  els.scanV.textContent = (+els.scanlines.value).toFixed(2);
}

function applyDefaults(){
  els.q1.value = defaults.q1;
  els.scale.value = defaults.scale;
  els.q2.value = defaults.q2;
  els.loops.value = defaults.loops;

  els.warm.value = defaults.warm;
  els.desat.value = defaults.desat;
  els.contrast.value = defaults.contrast;
  els.grime.value = defaults.grime;
  els.grain.value = defaults.grain;
  els.vignette.value = defaults.vignette;
  els.sharpen.value = defaults.sharpen;
  els.scanlines.value = defaults.scanlines;

  updateLabels();
}

function fitToMax(img, maxSide=1400){
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const s = Math.min(1, maxSide / Math.max(w, h));
  return { w: Math.max(1, Math.round(w*s)), h: Math.max(1, Math.round(h*s)) };
}

/**
 * 真 JPEG 回环：canvas RGBA -> jpeg.encode -> jpeg.decode -> putImageData
 * 关键兜底：decode 可能返回 RGB(3通道) 或 RGBA(4通道)，统一转 RGBA + alpha=255
 */
function jpegRoundTrip(ctx, w, h, quality){
  const img = ctx.getImageData(0, 0, w, h);
  const raw = { data: img.data, width: w, height: h };

  const encoded = jpeg.encode(raw, quality);
  const decoded = jpeg.decode(encoded.data, { useTArray: true });

  const outRGBA = ensureRGBA(decoded.data, decoded.width, decoded.height);
  const out = new ImageData(outRGBA, decoded.width, decoded.height);
  ctx.putImageData(out, 0, 0);

  return encoded.data.byteLength;
}

function ensureRGBA(decodedData, w, h){
  // decodedData 可能是 Uint8Array（RGB 或 RGBA）
  const len = decodedData.length;
  const px = w * h;

  if(len === px * 4){
    // 确保 alpha=255（有些环境 alpha 不是 255 时会黑/透明）
    const out = new Uint8ClampedArray(decodedData);
    for(let i=3; i<out.length; i+=4) out[i] = 255;
    return out;
  }

  if(len === px * 3){
    const out = new Uint8ClampedArray(px * 4);
    for(let i=0, j=0; i<len; i+=3, j+=4){
      out[j] = decodedData[i];
      out[j+1] = decodedData[i+1];
      out[j+2] = decodedData[i+2];
      out[j+3] = 255;
    }
    return out;
  }

  // 兜底：异常长度，直接返回全不透明黑底（但正常不会到这里）
  const out = new Uint8ClampedArray(px * 4);
  for(let i=3; i<out.length; i+=4) out[i] = 255;
  return out;
}

/** 先缩小再放大：制造细节损失与块感 */
function scaleDegrade(fromCanvas, w, h, ratio){
  const tw = Math.max(1, Math.round(w * ratio));
  const th = Math.max(1, Math.round(h * ratio));

  // B：缩小
  cB.width = tw; cB.height = th;
  bCtx.imageSmoothingEnabled = true;
  bCtx.clearRect(0,0,tw,th);
  bCtx.drawImage(fromCanvas, 0, 0, tw, th);

  // A：放大回原尺寸
  cA.width = w; cA.height = h;
  aCtx.imageSmoothingEnabled = true;
  aCtx.clearRect(0,0,w,h);
  aCtx.drawImage(cB, 0, 0, w, h);
}

/** 色调老化：轻曲线 + 去饱和 + 泛黄偏绿一点点 */
function toneAging(ctx, w, h, warm, desat, contrastWeird){
  const img = ctx.getImageData(0,0,w,h);
  const d = img.data;

  const a = contrastWeird * 0.55;
  const b = contrastWeird * 0.35;

  for(let i=0;i<d.length;i+=4){
    let r=d[i], g=d[i+1], b0=d[i+2];

    const nr = r/255, ng = g/255, nb = b0/255;
    let rr = nr + a*(nr-0.5) - b*(nr*nr - nr);
    let gg = ng + a*(ng-0.5) - b*(ng*ng - ng);
    let bb = nb + a*(nb-0.5) - b*(nb*nb - nb);

    r = clamp255(Math.round(rr*255));
    g = clamp255(Math.round(gg*255));
    b0= clamp255(Math.round(bb*255));

    const lum = (0.2126*r + 0.7152*g + 0.0722*b0);
    r = r + (lum - r) * desat;
    g = g + (lum - g) * desat;
    b0= b0+ (lum - b0)* desat;

    r = r + 34*warm;
    g = g + 28*warm;  // 稍微更“旧”
    b0= b0 - 28*warm;
    g = g + 8*warm;   // 很轻微的“脏绿”

    d[i]   = clamp255(r);
    d[i+1] = clamp255(g);
    d[i+2] = clamp255(b0);
    d[i+3] = 255;
  }
  ctx.putImageData(img,0,0);
}

/** 脏污：随机斑点 + blur + multiply */
function addGrime(ctx, w, h, amount){
  if(amount<=0) return;

  cC.width = w; cC.height = h;
  cCtx.clearRect(0,0,w,h);

  const count = Math.round((w*h/50000) * (8 + amount*40));
  for(let i=0;i<count;i++){
    const x = Math.random()*w;
    const y = Math.random()*h;
    const r = (10 + Math.random()*90) * (0.35 + amount);
    const a = (0.02 + Math.random()*0.12) * amount;
    const hue = 28 + Math.random()*18;
    cCtx.fillStyle = `hsla(${hue}, 35%, ${18+Math.random()*20}%, ${a})`;
    cCtx.beginPath();
    cCtx.ellipse(x,y,r,r*(0.6+Math.random()*0.9),Math.random()*Math.PI,0,Math.PI*2);
    cCtx.fill();
  }

  const tmp = document.createElement("canvas");
  tmp.width = w; tmp.height = h;
  const t = tmp.getContext("2d");
  t.filter = `blur(${Math.max(6, 10*amount)}px)`;
  t.drawImage(cC,0,0);

  cCtx.clearRect(0,0,w,h);
  cCtx.drawImage(tmp,0,0);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.85 * amount;
  ctx.drawImage(cC,0,0);
  ctx.restore();
}

/** 颗粒噪点 */
function addGrain(ctx, w, h, amount){
  if(amount<=0) return;
  const img = ctx.getImageData(0,0,w,h);
  const d = img.data;
  const strength = 18 * amount;

  for(let i=0;i<d.length;i+=4){
    const n = (Math.random()*2 - 1) * strength;
    d[i]   = clamp255(d[i]   + n);
    d[i+1] = clamp255(d[i+1] + n);
    d[i+2] = clamp255(d[i+2] + n);
    d[i+3] = 255;
  }
  ctx.putImageData(img,0,0);
}

/** 暗角 */
function addVignette(ctx, w, h, amount){
  if(amount<=0) return;
  const g = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.2, w/2, h/2, Math.max(w,h)*0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${0.75*amount})`);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);
  ctx.restore();
}

/** 扫描线 */
function addScanlines(ctx, w, h, amount){
  if(amount<=0) return;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.22 * amount;
  ctx.fillStyle = "rgba(0,0,0,1)";
  const step = 2;
  for(let y=0;y<h;y+=step){
    if((y/step)%2===0) ctx.fillRect(0,y,w,1);
  }
  ctx.restore();
}

/** 轻锐化：orig + k*(orig - blur) */
function unsharp(ctx, w, h, amount){
  if(amount<=0) return;

  cB.width=w; cB.height=h;
  bCtx.clearRect(0,0,w,h);
  bCtx.drawImage(ctx.canvas,0,0);

  cC.width=w; cC.height=h;
  cCtx.clearRect(0,0,w,h);
  cCtx.filter = "blur(1.2px)";
  cCtx.drawImage(cB,0,0);
  cCtx.filter = "none";

  const orig = bCtx.getImageData(0,0,w,h);
  const blur = cCtx.getImageData(0,0,w,h);
  const o = orig.data, bl = blur.data;

  const k = 0.9 * amount;
  for(let i=0;i<o.length;i+=4){
    o[i]   = clamp255(o[i]   + k*(o[i]   - bl[i]));
    o[i+1] = clamp255(o[i+1] + k*(o[i+1] - bl[i+1]));
    o[i+2] = clamp255(o[i+2] + k*(o[i+2] - bl[i+2]));
    o[i+3] = 255;
  }
  ctx.putImageData(orig,0,0);
}

let rafPending = false;
function requestProcess(){
  if(!loaded) return;
  if(rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    process();
  });
}

function process(){
  if(!loaded) return;
  updateLabels();

  const t0 = performance.now();

  const w = imgW, h = imgH;

  const q1 = +els.q1.value;
  const q2 = +els.q2.value;
  const ratio = +els.scale.value;
  const loops = +els.loops.value;

  const warm = +els.warm.value;
  const desat = +els.desat.value;
  const contrast = +els.contrast.value;
  const grime = +els.grime.value;
  const grain = +els.grain.value;
  const vig = +els.vignette.value;
  const sharp = +els.sharpen.value;
  const scan = +els.scanlines.value;

  // 从原图开始
  cA.width=w; cA.height=h;
  aCtx.clearRect(0,0,w,h);
  aCtx.drawImage(els.srcCanvas,0,0);

  // JPEG #1
  const bytes1 = jpegRoundTrip(aCtx, w, h, q1);

  // 缩放劣化
  scaleDegrade(cA, w, h, ratio);

  // JPEG #2
  const bytes2 = jpegRoundTrip(aCtx, w, h, q2);

  // 额外回环（每次轻微抖动缩放）
  let extraBytes = 0;
  for(let i=0;i<loops;i++){
    const qq = Math.max(5, Math.round(q2 - i*5));
    extraBytes = jpegRoundTrip(aCtx, w, h, qq);
    const rr = Math.max(0.25, Math.min(1, ratio - 0.03 + Math.random()*0.06));
    scaleDegrade(cA, w, h, rr);
  }

  // 旧色 & 脏感
  toneAging(aCtx, w, h, warm, desat, contrast);
  addGrime(aCtx, w, h, grime);
  addGrain(aCtx, w, h, grain);
  addVignette(aCtx, w, h, vig);
  addScanlines(aCtx, w, h, scan);
  unsharp(aCtx, w, h, sharp);

  // 输出
  outCtx.clearRect(0,0,w,h);
  outCtx.drawImage(cA,0,0);

  const t1 = performance.now();
  els.perf.textContent = `耗时 ${(t1-t0).toFixed(1)} ms | JPEG#1 ${(bytes1/1024).toFixed(1)} KB | JPEG#2 ${(bytes2/1024).toFixed(1)} KB | extra ${(extraBytes/1024).toFixed(1)} KB`;
  els.meta.textContent = `q1=${q1}  scale=${ratio.toFixed(2)}  q2=${q2}  loops=${loops}`;
  setStatus("已生成");
}

function drawToSrc(img){
  const { w, h } = fitToMax(img, 1400);
  imgW = w; imgH = h;

  els.srcCanvas.width = w;
  els.srcCanvas.height = h;
  els.outCanvas.width = w;
  els.outCanvas.height = h;

  srcCtx.imageSmoothingEnabled = true;
  srcCtx.clearRect(0,0,w,h);
  srcCtx.drawImage(img,0,0,w,h);

  outCtx.clearRect(0,0,w,h);
  outCtx.drawImage(els.srcCanvas,0,0);

  els.srcInfo.textContent = `${w}×${h}`;
  els.outInfo.textContent = `${w}×${h}`;

  loaded = true;
  setStatus("已加载");
  requestProcess();
}

function loadFile(file){
  if(!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); drawToSrc(img); };
  img.onerror = () => { URL.revokeObjectURL(url); setStatus("加载失败"); };
  img.src = url;
}

// 下载
function download(dataUrl, filename){
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

els.downloadPng.addEventListener("click", () => {
  if(!loaded) return;
  download(els.outCanvas.toDataURL("image/png"), "baojiang.png");
});

els.downloadJpg.addEventListener("click", () => {
  if(!loaded) return;
  // 下载 JPEG 再“最后一压”，用 q2 作为质量参考
  const q = Math.max(0.05, Math.min(0.95, (+els.q2.value)/100));
  download(els.outCanvas.toDataURL("image/jpeg", q), "baojiang.jpg");
});

// 随机
els.randomBtn.addEventListener("click", () => {
  if(!loaded) return;
  const rnd = (a,b)=> a + Math.random()*(b-a);

  els.q1.value = Math.round(rnd(35, 70));
  els.q2.value = Math.round(rnd(18, 48));
  els.scale.value = rnd(0.45, 0.85).toFixed(2);
  els.loops.value = Math.random() < 0.6 ? Math.round(rnd(0,2)) : Math.round(rnd(2,4));

  els.warm.value = rnd(0.10, 0.45).toFixed(2);
  els.desat.value = rnd(0.05, 0.35).toFixed(2);
  els.contrast.value = rnd(0.05, 0.25).toFixed(2);

  els.grime.value = rnd(0.05, 0.55).toFixed(2);
  els.grain.value = rnd(0.05, 0.35).toFixed(2);
  els.vignette.value = rnd(0.05, 0.40).toFixed(2);
  els.sharpen.value = rnd(0.05, 0.45).toFixed(2);
  els.scanlines.value = (Math.random()<0.5 ? rnd(0,0.18) : rnd(0.05,0.35)).toFixed(2);

  requestProcess();
});

// 重置
els.resetBtn.addEventListener("click", () => {
  applyDefaults();
  requestProcess();
});

// 监听参数变化
[
  els.q1, els.q2, els.scale, els.loops,
  els.warm, els.desat, els.contrast, els.grime, els.grain, els.vignette, els.sharpen, els.scanlines
].forEach(el => el.addEventListener("input", requestProcess));

// 文件选择
els.file.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if(f) loadFile(f);
  e.target.value = "";
});

// 初始占位（白色简约）
(function initPlaceholder(){
  applyDefaults();

  const w=900, h=520;
  els.srcCanvas.width = w; els.srcCanvas.height = h;
  els.outCanvas.width = w; els.outCanvas.height = h;

  const draw = (ctx, title) => {
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,w,h);

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.strokeRect(16,16,w-32,h-32);

    ctx.fillStyle = "#111827";
    ctx.font = "700 18px ui-sans-serif,system-ui";
    ctx.fillText(title, 36, 70);

    ctx.fillStyle = "#6b7280";
    ctx.font = "13px ui-sans-serif,system-ui";
    ctx.fillText("点击右上角「选择图片」开始", 36, 100);
    ctx.fillText("正常效果应为：糊 + 块状压缩 + 偏黄 + 脏污，而不是全黑", 36, 128);

    ctx.fillStyle = "#2563eb";
    ctx.font = "600 13px ui-sans-serif,system-ui";
    ctx.fillText("提示：q2=20~35，loops=2~4，会更“祖传”", 36, 160);
  };

  draw(srcCtx, "原图预览");
  draw(outCtx, "包浆预览");
  els.srcInfo.textContent = "—";
  els.outInfo.textContent = "—";
  els.perf.textContent = "—";
})();
