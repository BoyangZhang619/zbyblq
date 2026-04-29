// Kalimba - main.js
// 纯 WebAudio 合成拇指琴：
// - 主振荡器（triangle/sine）
// - 轻微 detune + click（噪声短脉冲）模拟拨片起音
// - lowpass 控亮度
// - ADSR（快起音 + 长释放）
// - vibrato（LFO 调频）
// - delay 作为空间感（简易）

class KalimbaApp {
  constructor() {
    this.el = {
      btnAudio: document.getElementById('btnAudio'),
      scaleSelect: document.getElementById('scaleSelect'),
      master: document.getElementById('master'),
      masterText: document.getElementById('masterText'),
      release: document.getElementById('release'),
      releaseText: document.getElementById('releaseText'),
      brightness: document.getElementById('brightness'),
      brightnessText: document.getElementById('brightnessText'),
      vibrato: document.getElementById('vibrato'),
      vibratoText: document.getElementById('vibratoText'),
      space: document.getElementById('space'),
      spaceText: document.getElementById('spaceText'),

      btnRec: document.getElementById('btnRec'),
      btnPlay: document.getElementById('btnPlay'),
      btnClear: document.getElementById('btnClear'),
      btnRandomSong: document.getElementById('btnRandomSong'),

      status: document.getElementById('status'),
      keys: document.getElementById('keys'),
    };

    // 17-key kalimba layout (center high-ish, alternating left/right)
    // 我们用 C 大调为基础：C4..E6（含重复音阶）
    // 标准常见 17 键：C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 A5 B5 C6 D6 E6
    this.baseNotes = [
      'C4','D4','E4','F4','G4','A4','B4',
      'C5','D5','E5','F5','G5','A5','B5',
      'C6','D6','E6'
    ];

    // 键盘映射（17 个）
    // 1..9 + Q..I + A..G（共 9 + 9 + 7 = 25，我们只取前 17）
    this.keyMap = [
      'Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9',
      'KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI'
    ];
    this.keyLabel = ['1','2','3','4','5','6','7','8','9','Q','W','E','R','T','Y','U','I'];

    // scales
    this.scales = {
      c_major: (note) => note, // 原样
      a_minor: (note) => this.mapToScale(note, ['A','B','C','D','E','F','G']), // 自然小调同音集
      pentatonic: (note) => this.mapToScale(note, ['C','D','E','G','A']),     // 五声音阶
    };

    // audio
    this.ctx = null;
    this.masterGain = null;

    this.fxSend = null;
    this.fxReturn = null;
    this.delay = null;
    this.delayFb = null;
    this.delayMix = null;

    this.noiseBuffer = null;

    // record
    this.isRec = false;
    this.isPlaying = false;
    this.record = []; // {tMs, index, vel}
    this.playTimer = null;
    this.playStartAt = 0;

    // ui
    this.keyButtons = [];
    this.bindUI();
    this.renderKeys();
    this.syncLabels();
    this.setControlsEnabled(false);
    this.setStatus('未启用音频');
  }

  // ---------------- UI ----------------
  bindUI() {
    const bindRange = (input, textEl) => {
      input.addEventListener('input', () => {
        textEl.textContent = input.value;
        if (this.masterGain && input === this.el.master) {
          this.masterGain.gain.value = Number(input.value) / 100;
        }
        if (this.fxSend && input === this.el.space) {
          this.fxSend.gain.value = Number(input.value) / 100;
        }
      });
    };

    bindRange(this.el.master, this.el.masterText);
    bindRange(this.el.release, this.el.releaseText);
    bindRange(this.el.brightness, this.el.brightnessText);
    bindRange(this.el.vibrato, this.el.vibratoText);
    bindRange(this.el.space, this.el.spaceText);

    this.el.btnAudio.addEventListener('click', async () => this.enableAudio());

    this.el.scaleSelect.addEventListener('change', () => {
      this.setStatus('已切换调式');
    });

    this.el.btnRec.addEventListener('click', () => this.toggleRec());
    this.el.btnPlay.addEventListener('click', () => this.togglePlay());
    this.el.btnClear.addEventListener('click', () => this.clearRecord());

    this.el.btnRandomSong.addEventListener('click', () => this.playRandomMelody());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!this.ctx) return;
        this.togglePlay();
        return;
      }
      const idx = this.keyMap.indexOf(e.code);
      if (idx >= 0) {
        e.preventDefault();
        this.playKey(idx, 1.0);
      }
    });
  }

  syncLabels() {
    this.el.masterText.textContent = this.el.master.value;
    this.el.releaseText.textContent = this.el.release.value;
    this.el.brightnessText.textContent = this.el.brightness.value;
    this.el.vibratoText.textContent = this.el.vibrato.value;
    this.el.spaceText.textContent = this.el.space.value;
  }

  setStatus(text) {
    this.el.status.textContent = text;
  }

  setControlsEnabled(on) {
    this.el.btnRec.disabled = !on;
    this.el.btnPlay.disabled = !on;
    this.el.btnClear.disabled = !on;
    this.el.btnRandomSong.disabled = !on;
  }

  flashKey(i) {
    const b = this.keyButtons[i];
    if (!b) return;
    b.classList.add('on');
    setTimeout(() => b.classList.remove('on'), 90);
  }

  renderKeys() {
    const wrap = this.el.keys;
    wrap.innerHTML = '';
    this.keyButtons = [];

    // Kalimba 常见：中间最长，两侧渐短
    // 我们简单用一个“高度曲线”让中心更高，边缘更低
    const heights = this.makeHeights(this.baseNotes.length);

    this.baseNotes.forEach((note, i) => {
      const btn = document.createElement('div');
      btn.className = 'key';
      btn.tabIndex = 0;
      btn.style.height = `${heights[i]}px`;

      btn.innerHTML = `
        <div class="note">${note.replace(/(\d)/, '<span style="opacity:.8">$1</span>')}</div>
        <div class="klabel">${this.keyLabel[i] || ''}</div>
      `;

      btn.addEventListener('click', () => this.playKey(i, 1.0));
      btn.addEventListener('keydown', (e) => {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          this.playKey(i, 1.0);
        }
      });

      wrap.appendChild(btn);
      this.keyButtons.push(btn);
    });
  }

  makeHeights(n) {
    // 让中间最长，边缘短（视觉像拇指琴）
    const base = 130;
    const peak = 220;
    const mid = (n - 1) / 2;
    const out = [];
    for (let i = 0; i < n; i++) {
      const d = Math.abs(i - mid) / mid; // 0..1
      const h = peak - (peak - base) * Math.pow(d, 1.3);
      out.push(Math.round(h));
    }
    return out;
  }

  // ---------------- Audio ----------------
  async enableAudio() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.setStatus('音频已启用');
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // master
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = Number(this.el.master.value) / 100;
    this.masterGain.connect(this.ctx.destination);

    // fx (delay space)
    this.fxSend = this.ctx.createGain();
    this.fxReturn = this.ctx.createGain();
    this.fxSend.gain.value = Number(this.el.space.value) / 100;
    this.fxReturn.gain.value = 0.55;

    this.delay = this.ctx.createDelay(1.2);
    this.delay.delayTime.value = 0.22; // kalimba 很适合 200ms 左右
    this.delayFb = this.ctx.createGain();
    this.delayFb.gain.value = 0.22;

    this.delayMix = this.ctx.createGain();
    this.delayMix.gain.value = 0.9;

    this.fxSend.connect(this.delay);
    this.delay.connect(this.delayMix);
    this.delayMix.connect(this.fxReturn);
    this.fxReturn.connect(this.masterGain);

    this.delay.connect(this.delayFb);
    this.delayFb.connect(this.delay);

    this.noiseBuffer = this.createNoiseBuffer(0.25);

    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.el.btnAudio.textContent = '✅ 音频已启用';
    this.el.btnAudio.disabled = true;

    this.setControlsEnabled(true);
    this.setStatus('就绪：可以演奏了');
  }

  createNoiseBuffer(seconds) {
    const sr = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, Math.floor(seconds * sr), sr);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    return buffer;
  }

  noteToFreq(note) {
    // note like "C4"
    const m = note.match(/^([A-G])(#?)(\d)$/);
    if (!m) return 440;
    const name = m[1] + (m[2] || '');
    const oct = Number(m[3]);

    const map = {
      'C': 0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11
    };
    const semitone = map[name];
    const midi = (oct + 1) * 12 + semitone; // MIDI note number
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  mapToScale(note, allowedLetters) {
    // 把 baseNotes 里的 note 映射到允许集合里：不在集合则向下找最近
    // 例如五声音阶：C D E G A
    const m = note.match(/^([A-G])(#?)(\d)$/);
    if (!m) return note;
    let letter = m[1];
    let oct = Number(m[3]);

    // 如果有升号，先把它降为自然音（简单处理）
    // 你的 baseNotes 都是自然音，这段主要为了健壮
    if (m[2] === '#') {
      // C# -> C
      // 这里简化：直接去掉 #（更“温柔”也更简单）
      // 更精确可做半音回退映射
      letter = m[1];
    }

    if (allowedLetters.includes(letter)) return `${letter}${oct}`;

    // 向下找最近允许音
    const order = ['C','B','A','G','F','E','D']; // 粗略
    let idx = order.indexOf(letter);
    if (idx < 0) idx = 0;
    for (let k = 0; k < order.length; k++) {
      const cand = order[(idx + k) % order.length];
      if (allowedLetters.includes(cand)) return `${cand}${oct}`;
    }
    return `${allowedLetters[0]}${oct}`;
  }

  getScaledNote(baseNote) {
    const key = this.el.scaleSelect.value;
    const fn = this.scales[key] || this.scales.c_major;
    return fn(baseNote);
  }

  playKey(index, vel = 1.0, when = null) {
    if (!this.ctx) {
      this.setStatus('先点「启用音频」哦');
      return;
    }

    const t = when ?? this.ctx.currentTime;
    this.flashKey(index);

    const baseNote = this.baseNotes[index];
    const note = this.getScaledNote(baseNote);
    const f = this.noteToFreq(note);

    // 录制
    if (this.isRec) {
      const nowMs = performance.now();
      if (!this.recStartMs) this.recStartMs = nowMs;
      this.record.push({ tMs: nowMs - this.recStartMs, index, vel });
    }

    // synth voice
    this.playPluck(f, t, vel);
  }

  playPluck(freq, t, vel) {
    // params
    const releaseMs = Number(this.el.release.value);     // 40..1800
    const release = Math.max(0.05, releaseMs / 1000);    // seconds
    const brightness = Number(this.el.brightness.value) / 100; // 0..1
    const vib = Number(this.el.vibrato.value) / 100;          // 0..1

    // main osc
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    // subtle detune pair (adds "chorus")
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq, t);
    osc2.detune.setValueAtTime(-6, t);

    // filter (brightness)
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200 + brightness * 5200, t);
    lp.Q.setValueAtTime(0.8 + brightness * 1.2, t);

    // gain envelope
    const gain = this.ctx.createGain();
    const peak = 0.55 * vel;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + release);

    // pluck click (noise burst)
    const click = this.ctx.createBufferSource();
    click.buffer = this.noiseBuffer;

    const clickHP = this.ctx.createBiquadFilter();
    clickHP.type = 'highpass';
    clickHP.frequency.value = 2000 + brightness * 4000;

    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.0001, t);
    clickGain.gain.linearRampToValueAtTime(0.18 * vel, t + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    // vibrato (LFO)
    let lfo = null;
    let lfoGain = null;
    if (vib > 0.001) {
      lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(5.0 + vib * 4.0, t);

      lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0, t);
      // vibrato depth: 0..12 cents
      lfoGain.gain.linearRampToValueAtTime(6 + vib * 10, t + 0.04);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      lfoGain.connect(osc2.detune);
    }

    // mix
    const mix = this.ctx.createGain();
    mix.gain.value = 1.0;

    osc.connect(lp);
    osc2.connect(lp);
    lp.connect(gain);
    gain.connect(mix);

    click.connect(clickHP);
    clickHP.connect(clickGain);
    clickGain.connect(mix);

    // dry + fx send
    mix.connect(this.masterGain);
    mix.connect(this.fxSend);

    // start/stop
    osc.start(t);
    osc2.start(t);
    click.start(t);

    const stopAt = t + Math.max(0.06, release + 0.05);
    osc.stop(stopAt);
    osc2.stop(stopAt);
    click.stop(t + 0.03);

    if (lfo) {
      lfo.start(t);
      lfo.stop(stopAt);
    }
  }

  // ---------------- Record / Play ----------------
  toggleRec() {
    if (!this.ctx) return;

    this.isRec = !this.isRec;
    if (this.isRec) {
      this.record = [];
      this.recStartMs = performance.now();
      this.setStatus('录制中：开始弹一段吧…（Space 可直接播放/暂停）');
      this.el.btnRec.textContent = '🛑 停止录制';
    } else {
      this.setStatus(this.record.length ? `录制完成：${this.record.length} 个音` : '录制结束：没有记录到音');
      this.el.btnRec.textContent = '⏺ 录制';
    }
  }

  clearRecord() {
    this.record = [];
    this.isPlaying = false;
    if (this.playTimer) clearTimeout(this.playTimer);
    this.playTimer = null;
    this.setStatus('已清空录音');
  }

  togglePlay() {
    if (!this.ctx) return;
    if (!this.record.length) {
      this.setStatus('还没有录音：先点「录制」弹一段');
      return;
    }
    this.isPlaying ? this.stopPlay() : this.startPlay();
  }

  startPlay() {
    this.isPlaying = true;
    this.el.btnPlay.textContent = '⏸ 暂停';
    this.setStatus('播放中…（循环）');

    const loopLenMs = Math.max(1200, this.record[this.record.length - 1].tMs + 400);
    const startAt = this.ctx.currentTime + 0.03;

    const schedule = () => {
      if (!this.isPlaying) return;
      const base = this.ctx.currentTime + 0.02;

      this.record.forEach(evt => {
        const t = base + (evt.tMs / 1000);
        this.playKey(evt.index, evt.vel, t);
      });

      this.playTimer = setTimeout(schedule, loopLenMs);
    };

    schedule();
  }

  stopPlay() {
    this.isPlaying = false;
    this.el.btnPlay.textContent = '▶ 播放';
    if (this.playTimer) clearTimeout(this.playTimer);
    this.playTimer = null;
    this.setStatus('已暂停');
  }

  // ---------------- Fun ----------------
  async playRandomMelody() {
    if (!this.ctx) return;

    // 自动生成一段温柔的随机旋律并写入 record
    // 使用当前调式，随机挑音，节奏偏稀疏
    this.record = [];
    this.recStartMs = performance.now();

    const steps = 16;
    const baseGap = 170; // ms
    let t = 0;

    for (let i = 0; i < steps; i++) {
      const hit = Math.random() < 0.55;
      if (hit) {
        const idx = this.pickNiceIndex();
        const vel = 0.7 + Math.random() * 0.25;
        this.record.push({ tMs: t, index: idx, vel });
      }
      t += baseGap + Math.random() * 60;
    }

    this.setStatus(`生成随机小旋律：${this.record.length} 个音（Space 播放/暂停）`);
    this.startPlay();
  }

  pickNiceIndex() {
    // 偏向中间区域更像拇指琴
    const mid = 8;
    const spread = 6;
    const x = mid + Math.round((Math.random() * 2 - 1) * spread);
    return Math.max(0, Math.min(this.baseNotes.length - 1, x));
  }
}

// boot
document.addEventListener('DOMContentLoaded', () => {
  window.KalimbaApp = new KalimbaApp();
});
