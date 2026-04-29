// Drum Pad - main.js
// 纯合成：Kick/Snare/Hat/Clap + 简单空间效果 + 16-step sequencer + 录制 1 小节

class DrumPadApp {
  constructor() {
    // DOM
    this.el = {
      btnAudio: document.getElementById('btnAudio'),
      bpm: document.getElementById('bpm'),
      bpmText: document.getElementById('bpmText'),
      master: document.getElementById('master'),
      masterText: document.getElementById('masterText'),
      kickTone: document.getElementById('kickTone'),
      kickToneText: document.getElementById('kickToneText'),
      snareNoise: document.getElementById('snareNoise'),
      snareNoiseText: document.getElementById('snareNoiseText'),
      hatBright: document.getElementById('hatBright'),
      hatBrightText: document.getElementById('hatBrightText'),
      spaceFx: document.getElementById('spaceFx'),
      spaceFxText: document.getElementById('spaceFxText'),

      btnPlay: document.getElementById('btnPlay'),
      btnStop: document.getElementById('btnStop'),
      btnRec: document.getElementById('btnRec'),
      btnClear: document.getElementById('btnClear'),

      status: document.getElementById('status'),
      padGrid: document.getElementById('padGrid'),
      sequencer: document.getElementById('sequencer'),
    };

    // Pads / mapping
    this.pads = [
      { id: 'kick',  name: 'Kick',  key: 'Q', code: 'KeyQ' },
      { id: 'snare', name: 'Snare', key: 'W', code: 'KeyW' },
      { id: 'hatc',  name: 'Hat C', key: 'E', code: 'KeyE' },
      { id: 'hato',  name: 'Hat O', key: 'R', code: 'KeyR' },

      { id: 'clap',  name: 'Clap',  key: 'A', code: 'KeyA' },
      { id: 'tom',   name: 'Tom',   key: 'S', code: 'KeyS' },
      { id: 'perc',  name: 'Perc',  key: 'D', code: 'KeyD' },
      { id: 'ride',  name: 'Ride',  key: 'F', code: 'KeyF' },

      { id: 'kick2', name: 'Kick2', key: 'Z', code: 'KeyZ' },
      { id: 'snare2',name: 'Snare2',key: 'X', code: 'KeyX' },
      { id: 'hat2',  name: 'Hat 2', key: 'C', code: 'KeyC' },
      { id: 'fx',    name: 'FX',    key: 'V', code: 'KeyV' },

      { id: 'mute1', name: 'Ghost', key: '1', code: 'Digit1' },
      { id: 'mute2', name: 'Ghost', key: '2', code: 'Digit2' },
      { id: 'mute3', name: 'Ghost', key: '3', code: 'Digit3' },
      { id: 'mute4', name: 'Ghost', key: '4', code: 'Digit4' },
    ];

    // 实际用于音序器的“行”（给用户简单：4 行）
    this.tracks = [
      { id: 'kick',  label: 'KICK' },
      { id: 'snare', label: 'SNARE' },
      { id: 'hat',   label: 'HAT' },
      { id: 'clap',  label: 'CLAP' },
    ];

    this.stepsN = 16;
    this.pattern = this.makeEmptyPattern(); // pattern[trackId][step] = bool

    // transport
    this.isPlaying = false;
    this.isRecording = false;
    this.playStep = 0;
    this.timer = null;

    // audio
    this.ctx = null;
    this.masterGain = null;
    this.fxSend = null;
    this.fxReturn = null;

    // nodes for FX
    this.delay = null;
    this.delayFb = null;
    this.delayMix = null;

    // noise buffer cache
    this.noiseBuffer = null;

    // UI cache
    this.padButtons = new Map();  // id -> button
    this.stepCells = new Map();   // `${trackId}:${i}` -> td div

    // init
    this.renderPads();
    this.renderSequencer();
    this.bindUI();
    this.syncAllLabels();
    this.setStatus('未启用音频');
  }

  // --------------------
  // Pattern
  // --------------------
  makeEmptyPattern() {
    const p = {};
    this.tracks.forEach(t => {
      p[t.id] = new Array(this.stepsN).fill(false);
    });
    return p;
  }

  clearPattern() {
    this.pattern = this.makeEmptyPattern();
    this.refreshSequencerUI();
  }

  // --------------------
  // UI render
  // --------------------
  renderPads() {
    const grid = this.el.padGrid;
    grid.innerHTML = '';

    this.pads.forEach(p => {
      const btn = document.createElement('div');
      btn.className = 'pad';
      btn.tabIndex = 0;
      btn.dataset.id = p.id;

      btn.innerHTML = `
        <div class="name">${p.name}</div>
        <div class="meta">
          <span>${p.id.toUpperCase()}</span>
          <span>${p.key}</span>
        </div>
      `.trim();

      btn.addEventListener('click', () => this.triggerPad(p.id));
      btn.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.triggerPad(p.id);
        }
      });

      grid.appendChild(btn);
      this.padButtons.set(p.id, btn);
    });
  }

  renderSequencer() {
    const wrap = this.el.sequencer;
    wrap.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'seq-table';

    const tbody = document.createElement('tbody');

    this.tracks.forEach(track => {
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.className = 'seq-row-label';
      th.textContent = track.label;
      tr.appendChild(th);

      for (let i = 0; i < this.stepsN; i++) {
        const td = document.createElement('td');
        const cell = document.createElement('div');
        cell.className = 'step';
        if ((i + 1) % 4 === 0 && i !== this.stepsN - 1) cell.classList.add('barline');

        cell.dataset.track = track.id;
        cell.dataset.step = String(i);

        cell.addEventListener('click', () => {
          this.toggleStep(track.id, i);
        });

        td.appendChild(cell);
        tr.appendChild(td);

        this.stepCells.set(`${track.id}:${i}`, cell);
      }

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);

    this.refreshSequencerUI();
  }

  toggleStep(trackId, i) {
    this.pattern[trackId][i] = !this.pattern[trackId][i];
    this.refreshSequencerUI();
  }

  refreshSequencerUI() {
    this.tracks.forEach(track => {
      for (let i = 0; i < this.stepsN; i++) {
        const cell = this.stepCells.get(`${track.id}:${i}`);
        if (!cell) continue;
        cell.classList.toggle('on', !!this.pattern[track.id][i]);
      }
    });
  }

  setPlayhead(step) {
    // clear old
    this.stepCells.forEach(cell => cell.classList.remove('playhead'));
    // set new
    this.tracks.forEach(t => {
      const cell = this.stepCells.get(`${t.id}:${step}`);
      if (cell) cell.classList.add('playhead');
    });
  }

  flashPad(id) {
    const el = this.padButtons.get(id);
    if (!el) return;
    el.classList.add('on');
    setTimeout(() => el.classList.remove('on'), 90);
  }

  // --------------------
  // UI + events
  // --------------------
  bindUI() {
    // sliders label
    const bindRange = (input, textEl) => {
      input.addEventListener('input', () => {
        textEl.textContent = input.value;
      });
    };

    bindRange(this.el.bpm, this.el.bpmText);
    bindRange(this.el.master, this.el.masterText);
    bindRange(this.el.kickTone, this.el.kickToneText);
    bindRange(this.el.snareNoise, this.el.snareNoiseText);
    bindRange(this.el.hatBright, this.el.hatBrightText);
    bindRange(this.el.spaceFx, this.el.spaceFxText);

    // audio enable
    this.el.btnAudio.addEventListener('click', async () => {
      await this.enableAudio();
    });

    // transport
    this.el.btnPlay.addEventListener('click', () => this.play());
    this.el.btnStop.addEventListener('click', () => this.stop());
    this.el.btnRec.addEventListener('click', () => this.toggleRec());
    this.el.btnClear.addEventListener('click', () => this.clearPattern());

    // master volume live
    this.el.master.addEventListener('input', () => {
      if (this.masterGain) this.masterGain.gain.value = this.el.master.value / 100;
    });
    this.el.spaceFx.addEventListener('input', () => {
      if (this.fxSend) this.fxSend.gain.value = this.el.spaceFx.value / 100;
    });

    // keyboard
    window.addEventListener('keydown', (e) => {
      // space => play/pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (!this.ctx) return;
        this.isPlaying ? this.stop() : this.play();
        return;
      }

      // map pads
      const pad = this.pads.find(p => p.code === e.code);
      if (pad) {
        e.preventDefault();
        this.triggerPad(pad.id);
      }
    });
  }

  syncAllLabels() {
    this.el.bpmText.textContent = this.el.bpm.value;
    this.el.masterText.textContent = this.el.master.value;
    this.el.kickToneText.textContent = this.el.kickTone.value;
    this.el.snareNoiseText.textContent = this.el.snareNoise.value;
    this.el.hatBrightText.textContent = this.el.hatBright.value;
    this.el.spaceFxText.textContent = this.el.spaceFx.value;
  }

  setStatus(text) {
    this.el.status.textContent = text;
  }

  setTransportEnabled(on) {
    this.el.btnPlay.disabled = !on;
    this.el.btnStop.disabled = !on;
    this.el.btnRec.disabled = !on;
  }

  // --------------------
  // Audio
  // --------------------
  async enableAudio() {
    if (this.ctx) {
      // if suspended, resume
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.setStatus('音频已启用');
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // master
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.el.master.value / 100;
    this.masterGain.connect(this.ctx.destination);

    // fx send/return (simple delay reverb-ish)
    this.fxSend = this.ctx.createGain();
    this.fxReturn = this.ctx.createGain();
    this.fxSend.gain.value = this.el.spaceFx.value / 100;
    this.fxReturn.gain.value = 0.6;

    // delay + feedback
    this.delay = this.ctx.createDelay(1.0);
    this.delay.delayTime.value = 0.17;
    this.delayFb = this.ctx.createGain();
    this.delayFb.gain.value = 0.25;

    // wet mix
    this.delayMix = this.ctx.createGain();
    this.delayMix.gain.value = 0.85;

    // chain: send -> delay -> feedback loop -> mix -> return -> master
    this.fxSend.connect(this.delay);
    this.delay.connect(this.delayMix);
    this.delayMix.connect(this.fxReturn);
    this.fxReturn.connect(this.masterGain);

    // feedback loop
    this.delay.connect(this.delayFb);
    this.delayFb.connect(this.delay);

    // Make noise buffer
    this.noiseBuffer = this.createNoiseBuffer(1.0);

    // unlock
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.setTransportEnabled(true);
    this.el.btnAudio.textContent = '✅ 音频已启用';
    this.el.btnAudio.disabled = true;
    this.setStatus('就绪：可以敲鼓了');
  }

  createNoiseBuffer(seconds) {
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, seconds * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    return buffer;
  }

  // Generic helpers
  envGain(gainNode, t, a = 0.001, d = 0.12, peak = 1.0) {
    gainNode.gain.cancelScheduledValues(t);
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.linearRampToValueAtTime(peak, t + a);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  triggerPad(id, time = null) {
    if (!this.ctx) {
      this.setStatus('先点「启用音频」哦');
      return;
    }

    const t = time ?? this.ctx.currentTime;
    this.flashPad(id);

    // 录制：把这次触发写进当前 playStep（只录 1 小节）
    if (this.isRecording) {
      // 只记录 4 个 track，按 pad id 映射
      const step = this.playStep % this.stepsN;
      const map = this.padToTrack(id);
      if (map) {
        this.pattern[map][step] = true;
        this.refreshSequencerUI();
      }
    }

    // synth
    switch (id) {
      case 'kick':  return this.playKick(t, 1.0);
      case 'kick2': return this.playKick(t, 0.7);
      case 'snare': return this.playSnare(t, 1.0);
      case 'snare2':return this.playSnare(t, 0.75);
      case 'hatc':  return this.playHat(t, 'closed');
      case 'hato':  return this.playHat(t, 'open');
      case 'hat2':  return this.playHat(t, 'closed2');
      case 'clap':  return this.playClap(t);
      case 'tom':   return this.playTom(t);
      case 'perc':  return this.playPerc(t);
      case 'ride':  return this.playRide(t);
      case 'fx':    return this.playFX(t);
      default:
        // ghost pads do nothing, but keep flash
        return;
    }
  }

  padToTrack(id) {
    if (id.startsWith('kick')) return 'kick';
    if (id.startsWith('snare')) return 'snare';
    if (id.startsWith('hat')) return 'hat';
    if (id === 'clap') return 'clap';
    return null;
  }

  // --------------------
  // Synth instruments
  // --------------------
  playKick(t, level = 1.0) {
    const tone = Number(this.el.kickTone.value); // 30..90
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';

    const gain = this.ctx.createGain();
    const drive = this.ctx.createWaveShaper();

    // mild drive curve
    drive.curve = this.makeDriveCurve(220);
    drive.oversample = '2x';

    // pitch sweep
    const f0 = tone;
    osc.frequency.setValueAtTime(f0 * 3.2, t);
    osc.frequency.exponentialRampToValueAtTime(f0, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.62, t + 0.16);

    // amp envelope
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.95 * level, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(drive);
    drive.connect(gain);

    // dry + fx
    gain.connect(this.masterGain);
    gain.connect(this.fxSend);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playSnare(t, level = 1.0) {
    const noiseAmt = Number(this.el.snareNoise.value) / 100; // 0..1

    // noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 1800;

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, t);
    nGain.gain.linearRampToValueAtTime(0.85 * noiseAmt * level, t + 0.002);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    noise.connect(nFilter);
    nFilter.connect(nGain);

    // tone
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t);

    const oGain = this.ctx.createGain();
    oGain.gain.setValueAtTime(0.0001, t);
    oGain.gain.linearRampToValueAtTime(0.35 * (1 - noiseAmt * 0.5) * level, t + 0.003);
    oGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

    osc.connect(oGain);

    // mix
    const mix = this.ctx.createGain();
    nGain.connect(mix);
    oGain.connect(mix);

    mix.connect(this.masterGain);
    mix.connect(this.fxSend);

    noise.start(t);
    noise.stop(t + 0.16);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  playHat(t, type = 'closed') {
    const bright = Number(this.el.hatBright.value) / 100; // 0..1
    const dur = type === 'open' ? 0.30 : (type === 'closed2' ? 0.09 : 0.06);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6500 + bright * 3500;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 9000 + bright * 2500;
    bp.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    noise.connect(hp);
    hp.connect(bp);
    bp.connect(gain);

    gain.connect(this.masterGain);
    gain.connect(this.fxSend);

    noise.start(t);
    noise.stop(t + dur + 0.01);
  }

  playClap(t) {
    // multi short noise bursts
    const burstTimes = [0.0, 0.015, 0.03];
    const out = this.ctx.createGain();

    burstTimes.forEach(dt => {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2200;
      bp.Q.value = 0.8;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.linearRampToValueAtTime(0.7, t + dt + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.06);

      noise.connect(bp);
      bp.connect(g);
      g.connect(out);

      noise.start(t + dt);
      noise.stop(t + dt + 0.08);
    });

    out.connect(this.masterGain);
    out.connect(this.fxSend);
  }

  playTom(t) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.55, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.20);

    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.fxSend);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  playPerc(t) {
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, t);

    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    osc.connect(filt);
    filt.connect(gain);

    gain.connect(this.masterGain);
    gain.connect(this.fxSend);

    osc.start(t);
    osc.stop(t + 0.10);
  }

  playRide(t) {
    // metal-ish: noise + resonant bandpass
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 7200;
    bp.Q.value = 6;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    noise.connect(bp);
    bp.connect(gain);

    gain.connect(this.masterGain);
    gain.connect(this.fxSend);

    noise.start(t);
    noise.stop(t + 0.4);
  }

  playFX(t) {
    // fun sweep
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.18);

    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(400, t);
    filt.frequency.exponentialRampToValueAtTime(3800, t + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(filt);
    filt.connect(gain);

    gain.connect(this.masterGain);
    gain.connect(this.fxSend);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  makeDriveCurve(amount = 200) {
    const n = 44100;
    const curve = new Float32Array(n);
    const k = typeof amount === 'number' ? amount : 200;
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // --------------------
  // Transport / Sequencer
  // --------------------
  getStepIntervalMs() {
    // 16 steps per bar (4/4, 16th notes)
    const bpm = Number(this.el.bpm.value);
    const beatMs = 60000 / bpm;
    const stepMs = beatMs / 4;
    return stepMs;
  }

  play() {
    if (!this.ctx) return;
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.setStatus(this.isRecording ? '播放中（录制）…' : '播放中…');

    this.el.btnPlay.textContent = '⏸ 暂停';
    this.el.btnPlay.onclick = () => this.pause();

    this.playStep = this.playStep % this.stepsN;
    this.setPlayhead(this.playStep);

    const tick = () => {
      // schedule events at currentTime for tightness
      const t = this.ctx.currentTime;

      // play pattern hits
      this.tracks.forEach(tr => {
        if (this.pattern[tr.id][this.playStep]) {
          // map track to pad trigger
          if (tr.id === 'kick') this.triggerPad('kick', t);
          if (tr.id === 'snare') this.triggerPad('snare', t);
          if (tr.id === 'hat') this.triggerPad('hatc', t);
          if (tr.id === 'clap') this.triggerPad('clap', t);
        }
      });

      // advance
      this.playStep = (this.playStep + 1) % this.stepsN;
      this.setPlayhead(this.playStep);

      if (!this.isPlaying) return;
      this.timer = setTimeout(tick, this.getStepIntervalMs());
    };

    this.timer = setTimeout(tick, 0);
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;

    this.el.btnPlay.textContent = '▶ 播放';
    this.el.btnPlay.onclick = () => this.play();

    this.setStatus(this.isRecording ? '已暂停（录制）' : '已暂停');
  }

  stop() {
    if (!this.ctx) return;
    this.isPlaying = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.playStep = 0;
    this.setPlayhead(0);

    this.el.btnPlay.textContent = '▶ 播放';
    this.el.btnPlay.onclick = () => this.play();

    this.setStatus(this.isRecording ? '停止（录制）' : '已停止');
  }

  toggleRec() {
    if (!this.ctx) return;
    this.isRecording = !this.isRecording;
    this.el.btnRec.textContent = this.isRecording ? '🛑 停止录制' : '⏺ 录制';
    this.setStatus(this.isRecording ? '录制中：敲鼓写入当前小节' : (this.isPlaying ? '播放中…' : '就绪'));
  }
}

// boot
document.addEventListener('DOMContentLoaded', () => {
  window.DrumPadApp = new DrumPadApp();
});
