/**
 * SimplePiano - 一个轻量级的 Web Audio API 钢琴引擎
 * - 支持从 ../json/puzi.json 异步加载谱子
 * - 支持 ensemble 合奏（Canon = canonBass + canon）
 * - 兼容 gate+release 包络：播放前自动适配短音/短休止
 */
class SimplePiano {
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.defaultSustain = options.sustain || 1.5;
        this.oscType = options.oscType || 'triangle';

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        const unlockCtx = () => {
            this._ensureContextRunning('user-gesture');
        };
        ['pointerdown', 'touchstart', 'keydown'].forEach(evt => {
            window.addEventListener(evt, unlockCtx, { once: true, passive: true, capture: true });
        });

        this.activeNotes = new Map();

        // 播放状态（注意：现在支持 overlay，所以这里的“isPlaying”仅用于 UI 控制）
        this.isPlaying = false;
        this.playTimeouts = [];
        this.scheduledSheetNodes = [];
        this.onNotePlay = null;
        this.onSheetEnd = null;

        // Master bus
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.12;

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        // 谱子：改为外部加载
        this.sheets = {};
        this.sheetsLoaded = false;

        // 88 键频率表
        this.noteFrequencies = {
            "A0": 27.50, "A#0": 29.14, "B0": 30.87,
            "C1": 32.70, "C#1": 34.65, "D1": 36.71, "D#1": 38.89, "E1": 41.20, "F1": 43.65, "F#1": 46.25, "G1": 49.00, "G#1": 51.91, "A1": 55.00, "A#1": 58.27, "B1": 61.74,
            "C2": 65.41, "C#2": 69.30, "D2": 73.42, "D#2": 77.78, "E2": 82.41, "F2": 87.31, "F#2": 92.50, "G2": 98.00, "G#2": 103.83, "A2": 110.00, "A#2": 116.54, "B2": 123.47,
            "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
            "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
            "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
            "C6": 1046.50, "C#6": 1108.73, "D6": 1174.66, "D#6": 1244.51, "E6": 1318.51, "F6": 1396.91, "F#6": 1479.98, "G6": 1567.98, "G#6": 1661.22, "A6": 1760.00, "A#6": 1864.66, "B6": 1975.53,
            "C7": 2093.00, "C#7": 2217.46, "D7": 2349.32, "D#7": 2489.02, "E7": 2637.02, "F7": 2793.83, "F#7": 2959.96, "G7": 3135.96, "G#7": 3322.44, "A7": 3520.00, "A#7": 3729.31, "B7": 3951.07,
            "C8": 4186.01
        };

        this.log('Piano Engine Initialized');
    }

    _ensureContextRunning(reason = '') {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
            this.log(`AudioContext resumed (${reason})`);
        }
    }

    // ====== gate+release: 单音 ======
    play(noteName, duration, startTime, trackList) {
        const freq = this.noteFrequencies[noteName];
        if (!freq) {
            console.warn(`[Piano] Note not found: ${noteName}`);
            return;
        }

        const targetStart = startTime ?? this.ctx.currentTime;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this.log('AudioContext resumed');
                this._triggerSound(freq, duration, targetStart, trackList);
            });
        } else {
            this._triggerSound(freq, duration, targetStart, trackList);
        }
    }

    _triggerSound(freq, duration, startTime = this.ctx.currentTime, trackList) {
        const start = Math.max(startTime ?? this.ctx.currentTime, this.ctx.currentTime);
        const slot = duration || this.defaultSustain;

        const gate = Math.max(0.02, slot * 0.90);
        const release = Math.min(0.12, Math.max(0.03, slot * 0.25));
        const stopAt = start + gate + release;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = this.oscType;
        osc.frequency.setValueAtTime(freq, start);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4200, start); // 比你原来稍亮一点
        filter.Q.setValueAtTime(0.6, start);

        const peak = 0.70;
        const sustain = 0.18;

        gain.gain.cancelScheduledValues(start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(peak, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(sustain, start + 0.045);
        gain.gain.setValueAtTime(sustain, start + gate);
        gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain ?? this.ctx.destination);

        osc.start(start);
        osc.stop(stopAt + 0.005);

        const voiceInfo = { osc, gain, startTime: start, stopTime: stopAt };
        if (trackList) trackList.push(voiceInfo);

        const cleanupDelay = Math.max(0, (voiceInfo.stopTime - this.ctx.currentTime) * 1000 + 200);
        setTimeout(() => {
            try { osc.disconnect(); filter.disconnect(); gain.disconnect(); } catch (e) { }
            if (trackList) {
                const idx = trackList.indexOf(voiceInfo);
                if (idx !== -1) trackList.splice(idx, 1);
            }
        }, cleanupDelay);

        return voiceInfo;
    }

    getNoteList() {
        return Object.keys(this.noteFrequencies);
    }

    startNote(noteName) {
        if (this.activeNotes.has(noteName)) this.stopNote(noteName);

        const freq = this.noteFrequencies[noteName];
        if (!freq) {
            console.warn(`[Piano] Note not found: ${noteName}`);
            return;
        }

        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = this.oscType;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.6, t + 0.02);
        gain.gain.setValueAtTime(0.5, t + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        this.activeNotes.set(noteName, { osc, gain });
        this.log(`Start: ${noteName} (${freq}Hz)`);
    }

    stopNote(noteName) {
        const note = this.activeNotes.get(noteName);
        if (!note) return;

        const { osc, gain } = note;
        const t = this.ctx.currentTime;

        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.stop(t + 0.3);

        setTimeout(() => {
            try { osc.disconnect(); gain.disconnect(); } catch (e) { }
        }, 350);

        this.activeNotes.delete(noteName);
        this.log(`Stop: ${noteName}`);
    }

    stopAllNotes() {
        for (const noteName of this.activeNotes.keys()) this.stopNote(noteName);
    }

    // ====== 和弦播放（多音）======
    playChord(notes, duration, startTime, trackList) {
        const noteArray = Array.isArray(notes) ? notes : [notes];
        const volumeScale = Math.min(1, 1 / Math.sqrt(noteArray.length));
        const start = startTime ?? (this.ctx.currentTime + 0.01);

        const scheduled = [];
        noteArray.forEach(note => {
            if (note !== 'R' && note !== 'REST' && note !== '-') {
                const voice = this._triggerSoundWithVolume(note, duration, volumeScale, start, trackList);
                if (voice) scheduled.push(voice);
            }
        });

        this.log(`Chord: [${noteArray.join(', ')}] @${start.toFixed(3)}`);
        return scheduled;
    }

    _triggerSoundWithVolume(noteName, duration, volumeScale = 1, startTime = this.ctx.currentTime, trackList) {
        const freq = this.noteFrequencies[noteName];
        if (!freq) {
            console.warn(`[Piano] Note not found: ${noteName}`);
            return;
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }

        const start = Math.max(startTime ?? this.ctx.currentTime, this.ctx.currentTime);
        const slot = duration || this.defaultSustain;

        const gate = Math.max(0.02, slot * 0.90);
        const release = Math.min(0.12, Math.max(0.03, slot * 0.25));
        const stopAt = start + gate + release;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = this.oscType;
        osc.frequency.setValueAtTime(freq, start);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4200, start);
        filter.Q.setValueAtTime(0.6, start);

        const peak = 0.75 * volumeScale;
        const sustain = 0.20 * volumeScale;

        gain.gain.cancelScheduledValues(start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(peak, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain), start + 0.045);
        gain.gain.setValueAtTime(Math.max(0.0001, sustain), start + gate);
        gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain ?? this.ctx.destination);

        osc.start(start);
        osc.stop(stopAt + 0.005);

        const voiceInfo = { osc, gain, startTime: start, stopTime: stopAt };
        if (trackList) trackList.push(voiceInfo);

        const cleanupDelay = Math.max(0, (voiceInfo.stopTime - this.ctx.currentTime) * 1000 + 200);
        setTimeout(() => {
            try { osc.disconnect(); filter.disconnect(); gain.disconnect(); } catch (e) { }
            if (trackList) {
                const idx = trackList.indexOf(voiceInfo);
                if (idx !== -1) trackList.splice(idx, 1);
            }
        }, cleanupDelay);

        return voiceInfo;
    }

    // ====== 兼容 gate+release 的“谱子适配” ======
    _adaptNotesForEnvelope(notes) {
        const out = [];
        for (let i = 0; i < notes.length; i++) {
            const [note, ms] = notes[i];

            // 压缩很短的休止（旧谱常用来做人为断奏，新包络不需要这么多）
            if (note === 'R' || note === 'REST' || note === '-') {
                if (ms <= 80) continue;
                if (ms <= 160) { out.push(['R', 80]); continue; }
                out.push([note, ms]);
                continue;
            }

            // 短音补偿：新包络会提前收音，短音听起来更短
            let newMs = ms;
            if (ms < 180) newMs = Math.round(ms * 1.35);
            else if (ms < 260) newMs = Math.round(ms * 1.22);
            else if (ms < 380) newMs = Math.round(ms * 1.10);

            out.push([note, newMs]);
        }
        return out;
    }

    // ====== 读取谱子（多轨 & 合奏展开）======
    getSheets() {
        return this.sheets;
    }

    getSheet(sheetId) {
        return this.sheets[sheetId] || null;
    }

    // 缓存已解析的谱子，确保渲染和播放使用同一数据
    _resolvedCache = new Map();

    // 展开 sheet -> { name, notes, events }（支持多轨合并显示，events 与渲染一一对应）
    _resolveSheetForRender(sheetId) {
        // 检查缓存
        if (this._resolvedCache.has(sheetId)) {
            return this._resolvedCache.get(sheetId);
        }

        const sheet = this.getSheet(sheetId);
        if (!sheet) return null;

        // 使用 _buildEventsFromSheet 生成事件，确保播放和渲染用同一数据源
        const { events, bpm, beatMs } = this._buildEventsFromSheet(sheet);
        
        // 将 events 转换为渲染用的 notes 格式，保持索引对应
        const notes = events.map(ev => [ev.n, ev.durMs]);

        const result = { name: sheet.name || sheetId, notes, events };
        
        // 缓存结果
        this._resolvedCache.set(sheetId, result);
        
        return result;
    }

    // ====== 播放：普通 sheet（会 stop）======
    playSheet(sheetId, onNote, onEnd) {
        return this._playSheetInternal(sheetId, onNote, onEnd, { overlay: false });
    }

    // ====== 播放：叠加（不会 stop）======
    playSheetOverlay(sheetId, onNote, onEnd) {
        return this._playSheetInternal(sheetId, onNote, onEnd, { overlay: true });
    }


    async loadSheetsFromJson(url) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.sheets = data || {};
            this.sheetsLoaded = true;
            // 清除缓存，因为 sheets 已更新
            this._resolvedCache.clear();
            this.log(`Sheets loaded: ${Object.keys(this.sheets).length}`);
            return true;
        } catch (e) {
            console.error('[Piano] Failed to load sheets:', e);
            this.sheetsLoaded = false;
            return false;
        }
    }

    _playSheetInternal(sheetId, onNote, onEnd, opts = { overlay: false }) {
        // 使用 _resolveSheetForRender 确保与渲染使用同一数据源
        const resolved = this._resolveSheetForRender(sheetId);
        if (!resolved) {
            console.warn(`[Piano] Sheet not found: ${sheetId}`);
            return false;
        }

        const sheet = this.getSheet(sheetId);

        // 非叠加模式则停止之前的播放
        if (!opts.overlay && this.isPlaying) {
            this.stopSheet();
        }

        this.isPlaying = true;
        this.onNotePlay = onNote;
        this.onSheetEnd = onEnd;

        if (!opts.overlay) {
            this.playTimeouts = [];
            this.scheduledSheetNodes.length = 0;
        }

        this._ensureContextRunning('playSheet');

        const scheduleUiCallback = (callback, targetTime) => {
            const delayMs = Math.max(0, (targetTime - this.ctx.currentTime) * 1000);
            const timer = setTimeout(callback, delayMs);
            this.playTimeouts.push(timer);
        };

        // 播放速度系数：0.80 = 慢 20%
        const speed = 0.80;
        const baseStart = this.ctx.currentTime + 0.12;

        // ===== 核心：使用与渲染相同的 events =====
        const events = resolved.events;

        // ===== 核心：统一调度 =====
        const totalSec = this._scheduleEvents(
            events,
            baseStart,
            speed,
            scheduleUiCallback,
            onNote,
            this.scheduledSheetNodes
        );

        const finishAt = baseStart + totalSec + 0.12;

        scheduleUiCallback(() => {
            // overlay 模式不强制把 isPlaying 关掉（你可能在叠加播放多个）
            if (!opts.overlay) {
                this.isPlaying = false;
                this.scheduledSheetNodes.length = 0;
            }
            if (onEnd) onEnd();
            this.log(`Sheet finished: ${sheetId}`);
        }, finishAt);

        this.log(`Playing sheet: ${sheet.name || sheetId} (events=${events.length})`);
        return true;
    }
    _buildEventsFromSheet(sheet) {
        // 统一 BPM -> beatMs
        const bpm = sheet.bpm || 120;
        const beatMs = 60000 / bpm;

        // 统一把 sheet.notes 当成单轨
        const tracks = (sheet.tracks && Array.isArray(sheet.tracks) && sheet.tracks.length)
            ? sheet.tracks
            : [{ role: 'melody', notes: (sheet.notes || []).map(([note, ms]) => ({ n: note, ms })) }];

        const events = [];

        // 每条轨道自己累加时间，但产出 event 时都用 tSec（相对谱子起点）
        for (const track of tracks) {
            const role = track.role || 'track';
            let tMs = 0;

            for (const it of (track.notes || [])) {
                // 支持两种输入：
                // 1) 新 JSON: { n: 'C4' / ['C4','E4'], d: 拍数 }
                // 2) 旧 notes: { n: 'C4', ms: 毫秒 }（给兼容用）
                const n = (it && typeof it === 'object') ? it.n : null;

                let durMs = 0;
                if (it && typeof it === 'object') {
                    if (typeof it.ms === 'number') durMs = it.ms;                 // 兼容
                    else durMs = (it.d || 0) * beatMs;                            // 推荐：拍数
                }

                // 允许 track 里直接写 ["C4", 400] 这种（再兼容一次）
                if (!n && Array.isArray(it) && it.length >= 2) {
                    events.push({ tSec: tMs / 1000, n: it[0], durMs: it[1], role });
                    tMs += it[1];
                    continue;
                }

                events.push({ tSec: tMs / 1000, n, durMs, role });
                tMs += durMs;
            }
        }

        // 同一时刻：bass/harmony 先、melody 后（听感更稳）
        const rolePriority = { bass: 0, harmony: 1, melody: 2 };
        events.sort((a, b) => {
            if (a.tSec !== b.tSec) return a.tSec - b.tSec;
            return (rolePriority[a.role] ?? 9) - (rolePriority[b.role] ?? 9);
        });

        return { bpm, beatMs, events };
    }
    _scheduleEvents(events, baseStart, speed, scheduleUiCallback, onNote, trackList) {
  // 先把事件转换成 _adaptNotesForEnvelope 需要的结构，但要保留 start 时间
  // 我们不再靠“顺序 offset”，而是每个事件自带 tSec。
  const adapted = events.map(ev => [ev.n, ev.durMs, ev.tSec, ev.role]);

  // 如果你有 _adaptNotesForEnvelope(notes) 只接受 [[n,ms],...]
  // 那我们在这里按事件粒度适配（推荐：对每个 note 单独适配，最稳）
  const adaptOne = (n, ms) => {
    const arr = this._adaptNotesForEnvelope ? this._adaptNotesForEnvelope([[n, ms]]) : [[n, ms]];
    return arr && arr[0] ? arr[0] : [n, ms];
  };

  for (let i = 0; i < adapted.length; i++) {
    const [nRaw, msRaw, tSec, role] = adapted[i];

    // speed：你现在定义 0.80 = 慢 20%，所以 “真实播放时长”要除以 speed
    const durMsScaled = (msRaw / Math.max(0.001, speed));
    const durSec = durMsScaled / 1000;

    const noteStart = baseStart + (tSec / Math.max(0.001, speed));

    // UI：高亮（事件序号 i）
    if (onNote) {
      scheduleUiCallback(() => {
        if (!this.isPlaying || !onNote) return;

        let display = '·';
        if (nRaw === 'R' || nRaw === 'REST' || nRaw === '-') display = '·';
        else if (Array.isArray(nRaw)) display = nRaw.join('+');
        else display = nRaw;

        // 如果你希望 UI 能区分轨道：`${role}:${display}`
        onNote(display, Math.round(durMsScaled), i);
      }, noteStart);
    }

    // 声音
    if (nRaw === 'R' || nRaw === 'REST' || nRaw === '-' || durSec <= 0) {
      continue;
    }

    // 包络适配（对每个事件）
    const [n, ms] = adaptOne(nRaw, msRaw);
    const durSecAdapted = (ms / Math.max(0.001, speed)) / 1000;

    if (Array.isArray(n)) {
      this.playChord(n, durSecAdapted, noteStart, trackList);
    } else {
      this.play(n, durSecAdapted, noteStart, trackList);
    }
  }

  // 返回结束时间（相对 baseStart）
  const endSec = events.reduce((m, ev) => Math.max(m, ev.tSec + ev.durMs / 1000), 0);
  return endSec / Math.max(0.001, speed);
}


    _scheduleNotes(notes, baseStart, speed, scheduleUiCallback, onNote, sheetId, onEnd, overlay) {
        let offsetSec = 0;

        notes.forEach((noteItem, index) => {
            const [note, durationMs] = noteItem;
            const durationSec = (durationMs / 1000) / speed;
            const noteStart = baseStart + offsetSec;

            // 休止符
            if (note === 'R' || note === 'REST' || note === '-') {
                if (onNote) {
                    scheduleUiCallback(() => {
                        if (this.isPlaying && onNote) onNote('·', durationMs, index);
                    }, noteStart);
                }
                offsetSec += durationSec;
                return;
            }

            // “渲染专用”的标签行（例如轨道名标签，不发声）
            if (typeof note === 'string' && note.startsWith('[') && note.endsWith(']')) {
                if (onNote) {
                    scheduleUiCallback(() => {
                        if (this.isPlaying && onNote) onNote(note, 0, index);
                    }, noteStart);
                }
                // 此类事件不占用时间轴
                return;
            }

            // 和弦
            if (Array.isArray(note)) {
                this.playChord(note, durationSec, noteStart, this.scheduledSheetNodes);
                if (onNote) {
                    const chordDisplay = note.join('+');
                    scheduleUiCallback(() => {
                        if (this.isPlaying && onNote) onNote(chordDisplay, durationMs, index);
                    }, noteStart);
                }
                offsetSec += durationSec;
                return;
            }

            // 单音
            this.play(note, durationSec, noteStart, this.scheduledSheetNodes);
            if (onNote) {
                scheduleUiCallback(() => {
                    if (this.isPlaying && onNote) onNote(note, durationMs, index);
                }, noteStart);
            }
            offsetSec += durationSec;
        });

        const finishAt = baseStart + offsetSec + 0.12;
        if (onEnd) {
            scheduleUiCallback(() => {
                // 若非叠加播放，播放结束时重置全局状态
                if (!overlay) {
                    this.isPlaying = false;
                    this.scheduledSheetNodes.length = 0;
                }
                if (onEnd) onEnd();
                this.log(`Sheet finished: ${sheetId}`);
            }, finishAt);
        }
    }

    stopSheet() {
        this.playTimeouts.forEach(timeout => clearTimeout(timeout));
        this.playTimeouts = [];
        this.isPlaying = false;

        const now = this.ctx.currentTime;
        this.scheduledSheetNodes.forEach(({ osc, gain, startTime }) => {
            try {
                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(0, now);
            } catch (e) { }

            try {
                osc.stop(Math.max(now, startTime + 0.001));
            } catch (e) { }

            try { osc.disconnect(); gain.disconnect(); } catch (e) { }
        });
        this.scheduledSheetNodes.length = 0;

        this.stopAllNotes();
        this.log('Sheet stopped');
    }

    isSheetPlaying() {
        return this.isPlaying;
    }

    log(msg) {
        if (this.debug) console.log(`%c[Piano] ${msg}`, 'color: #00bcd4; font-weight: bold;');
    }
}

// ========== 提示弹窗控制 ==========
const helpBtn = document.getElementById('helpBtn');
const tipsModal = document.getElementById('tipsModal');
const tipsClose = document.getElementById('tipsClose');
const tipsTitle = document.getElementById('tipsTitle');
const tipsList = document.getElementById('tipsList');

function isMobileScreen() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || ('ontouchstart' in window)
        || (navigator.maxTouchPoints > 0);
}

const defaultTipsContentDesktop = {
    title: '💡 使用提示',
    items: [
        '点击琴键播放音符',
        '按住琴键持续发声，松开停止',
        'C2八度(Shift): ! @ # $ % ^ & * ( ) _ +',
        'C3八度: Z S X D C V G B H N J M',
        'C4八度: Q 2 W 3 E R 5 T 6 Y 7 U',
        'C5八度: I 9 O 0 P [ = ] \\ A L F',
        'C6八度: 1 4 8 - K ; \' , . /'
    ]
};

const defaultTipsContentMobile = {
    title: '💡 使用提示',
    items: [
        '点击琴键播放音符',
        '按住琴键持续发声，松开停止',
        'C3八度: Z S X D C V G B H N J M',
        'C4八度: Q 2 W 3 E R 5 T 6 Y 7 U',
        'C5八度: I 9 O 0 P [ = ] \\ A L F',
        '📱 手机端显示 C3-C5 三个八度'
    ]
};

function getDefaultTipsContent() {
    return isMobileScreen() ? defaultTipsContentMobile : defaultTipsContentDesktop;
}

const widthWarningContent = {
    title: '⚠️ 页面宽度不足',
    items: [
        '当前窗口宽度无法完整显示所有琴键',
        '可以横向滚动钢琴区域查看更多琴键',
        '建议将浏览器窗口调宽或使用全屏模式',
        '推荐宽度: 1300px 以上'
    ]
};

function showTips(content) {
    tipsTitle.textContent = content.title;
    tipsList.innerHTML = content.items.map(item => `<li>${item}</li>`).join('');
    tipsModal.classList.add('show');
}

helpBtn.addEventListener('click', () => {
    showTips(getDefaultTipsContent());
});

tipsClose.addEventListener('click', () => {
    tipsModal.classList.remove('show');
});

tipsModal.addEventListener('click', (e) => {
    if (e.target === tipsModal) tipsModal.classList.remove('show');
});

// ========== 页面宽度检测 ==========
const pianoElement = document.getElementById('piano');
let widthWarningShown = false;
let lastWidthSufficient = true;

function checkPianoWidth() {
    const pianoWidth = pianoElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    const isWidthSufficient = viewportWidth >= pianoWidth + 80;

    if (!isWidthSufficient && lastWidthSufficient && !widthWarningShown) {
        setTimeout(() => {
            if (!tipsModal.classList.contains('show')) {
                showTips(widthWarningContent);
                widthWarningShown = true;
            }
        }, 500);
    }
    lastWidthSufficient = isWidthSufficient;
}
setTimeout(checkPianoWidth, 1000);

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (lastWidthSufficient) widthWarningShown = false;
        checkPianoWidth();
    }, 300);
});

// ========== 音色选择控制 ==========
const toneSelect = document.getElementById('toneSelect');

// ========== 设备类型检测 ==========
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || ('ontouchstart' in window)
        || (navigator.maxTouchPoints > 0);
}

function setupDeviceType() {
    if (isMobileDevice()) {
        document.body.classList.add('mobile-device');
        console.log('[Piano] Mobile device detected - showing C3, C4 and C5 octaves');
    } else {
        document.body.classList.remove('mobile-device');
        console.log('[Piano] Desktop device detected - showing all octaves');
    }
}
setupDeviceType();

// ========== 手机竖屏检测 ==========
const rotateHint = document.getElementById('rotateHint');
const rotateHintDismiss = document.getElementById('rotateHintDismiss');
let forcePortrait = false;

function checkOrientation() {
    const isMobile = isMobileDevice();
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isMobile && isPortrait && !forcePortrait) {
        document.body.classList.add('mobile-portrait');
    } else {
        document.body.classList.remove('mobile-portrait');
    }
}
rotateHintDismiss.addEventListener('click', () => {
    forcePortrait = true;
    document.body.classList.add('force-portrait');
    document.body.classList.remove('mobile-portrait');
});
checkOrientation();

window.addEventListener('resize', () => {
    if (window.innerWidth > window.innerHeight) {
        forcePortrait = false;
        document.body.classList.remove('force-portrait');
    }
    checkOrientation();
});
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (window.innerWidth > window.innerHeight) {
            forcePortrait = false;
            document.body.classList.remove('force-portrait');
        }
        checkOrientation();
    }, 100);
});

// ========== 钢琴引擎初始化 ==========
const piano = new SimplePiano({ debug: true });

// 关键：启动时加载谱子
(async () => {
    // 当前页面在 /playPiano/index.html 或 /playPiano/xxx.html
    // 我们取 pathname 的第一段作为项目根：/playPiano
    const seg = window.location.pathname.split('/').filter(Boolean)[0];
    const projectRoot = seg ? `/${seg}` : '';

    const url = `${projectRoot}/json/puzi.json`;
    console.log('[Piano] Fetching sheets:', url);

    const ok = await piano.loadSheetsFromJson(url);
    if (!ok) {
        console.warn('[Piano] Sheets not loaded. Check:', url);
    }
})();

// 键盘映射表
const keyMap = {
    '!': 'C2', '@': 'C#2', '#': 'D2', '$': 'D#2', '%': 'E2',
    '^': 'F2', '&': 'F#2', '*': 'G2', '(': 'G#2', ')': 'A2', '_': 'A#2', '+': 'B2',
    'z': 'C3', 's': 'C#3', 'x': 'D3', 'd': 'D#3', 'c': 'E3',
    'v': 'F3', 'g': 'F#3', 'b': 'G3', 'h': 'G#3', 'n': 'A3', 'j': 'A#3', 'm': 'B3',
    'q': 'C4', '2': 'C#4', 'w': 'D4', '3': 'D#4', 'e': 'E4',
    'r': 'F4', '5': 'F#4', 't': 'G4', '6': 'G#4', 'y': 'A4', '7': 'A#4', 'u': 'B4',
    'i': 'C5', '9': 'C#5', 'o': 'D5', '0': 'D#5', 'p': 'E5',
    '[': 'F5', '=': 'F#5', ']': 'G5', '\\': 'G#5', 'a': 'A5', 'l': 'A#5', 'f': 'B5',
    '1': 'C6', '4': 'C#6', '8': 'D6', '-': 'D#6', 'k': 'E6',
    ';': 'F6', "'": 'F#6', ',': 'G6', '.': 'G#6', '/': 'A6'
};

const noteToKey = {};
for (const [key, note] of Object.entries(keyMap)) noteToKey[note] = key.toUpperCase();

const currentNoteDisplay = document.getElementById('currentNote');

function updateNoteDisplay(noteName) {
    currentNoteDisplay.textContent = noteName;
    currentNoteDisplay.classList.add('active');
}
function clearNoteDisplay() {
    currentNoteDisplay.classList.remove('active');
}

// 鼠标/触摸事件 - 点击琴键
document.querySelectorAll('.key').forEach(key => {
    const noteName = key.dataset.note;

    key.addEventListener('mousedown', () => {
        piano.startNote(noteName);
        updateNoteDisplay(noteName);
        key.classList.add('pressed');
    });

    key.addEventListener('mouseup', () => {
        piano.stopNote(noteName);
        clearNoteDisplay();
        key.classList.remove('pressed');
    });

    key.addEventListener('mouseleave', () => {
        piano.stopNote(noteName);
        clearNoteDisplay();
        key.classList.remove('pressed');
    });

    key.addEventListener('touchstart', (e) => {
        e.preventDefault();
        piano.startNote(noteName);
        updateNoteDisplay(noteName);
        key.classList.add('pressed');
    });

    key.addEventListener('touchend', () => {
        piano.stopNote(noteName);
        clearNoteDisplay();
        key.classList.remove('pressed');
    });
});

const pressedKeys = new Set();

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keyMap[key] && !pressedKeys.has(key)) {
        pressedKeys.add(key);
        const noteName = keyMap[key];
        piano.startNote(noteName);
        updateNoteDisplay(noteName);

        const keyElement = document.querySelector(`.key[data-note="${noteName}"]`);
        if (keyElement) keyElement.classList.add('pressed');
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keyMap[key]) {
        pressedKeys.delete(key);
        const noteName = keyMap[key];
        piano.stopNote(noteName);
        clearNoteDisplay();

        const keyElement = document.querySelector(`.key[data-note="${noteName}"]`);
        if (keyElement) keyElement.classList.remove('pressed');
    }
});

window.addEventListener('blur', () => {
    piano.stopAllNotes();
    pressedKeys.clear();
    document.querySelectorAll('.key.pressed').forEach(key => key.classList.remove('pressed'));
    clearNoteDisplay();
});

// ========== 预设琴谱功能 ==========
let currentSheetItem = null;
let currentSheetId = null;
let currentNoteIndex = -1;
const sheetDisplay = document.getElementById('sheetDisplay');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const notationBtn = document.getElementById('notationBtn');
let noteElements = [];
let showKeyboard = false;

function noteToDisplay(note) {
    if (showKeyboard) return noteToKey[note] || note;
    return note;
}

// 渲染琴谱到中间面板（支持多轨显示）
function renderSheet(sheetId) {
    const resolved = piano._resolveSheetForRender(sheetId);
    if (!resolved) return;

    sheetDisplay.innerHTML = '';
    noteElements = [];
    currentNoteIndex = -1;

    resolved.notes.forEach((noteItem, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-item';

        const note = noteItem[0];
        
        // 跳过无效音符（null/undefined）但保留索引位置
        if (note === null || note === undefined) {
            noteDiv.textContent = '·';
            noteDiv.classList.add('rest');
            noteDiv.dataset.index = index;
            noteElements.push(noteDiv);
            sheetDisplay.appendChild(noteDiv);
            return;
        }
        
        noteDiv.dataset.note = JSON.stringify(note);

        if (typeof note === 'string' && note.startsWith('[') && note.endsWith(']')) {
            noteDiv.textContent = note;
            noteDiv.classList.add('rest');
            noteDiv.dataset.index = index;
            noteElements.push(noteDiv);
            sheetDisplay.appendChild(noteDiv);
            return;
        }

        if (Array.isArray(note)) {
            if (showKeyboard) {
                const keys = note.map(n => noteToKey[n] || '?').join('');
                noteDiv.textContent = keys.length > 3 ? keys.slice(0, 3) + '..' : keys;
            } else {
                noteDiv.textContent = `♫${note.length}`;
            }
            noteDiv.title = note.join(' + ');
            noteDiv.classList.add('chord');
        } else if (note === 'R' || note === 'REST' || note === '-') {
            noteDiv.textContent = '·';
            noteDiv.classList.add('rest');
        } else {
            noteDiv.textContent = noteToDisplay(note);
        }

        noteDiv.dataset.index = index;
        noteElements.push(noteDiv);
        sheetDisplay.appendChild(noteDiv);
    });
}

function onNotePlay(note, duration, noteIndex) {
    updateNoteDisplay(note);

    if (currentNoteIndex >= 0 && currentNoteIndex < noteElements.length) {
        noteElements[currentNoteIndex].classList.remove('current');
        noteElements[currentNoteIndex].classList.add('played');
    }
    currentNoteIndex = noteIndex;
    if (currentNoteIndex >= 0 && currentNoteIndex < noteElements.length) {
        noteElements[currentNoteIndex].classList.add('current');
        noteElements[currentNoteIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    const keyElement = document.querySelector(`.key[data-note="${note}"]`);
    if (keyElement) {
        keyElement.classList.add('pressed');
        setTimeout(() => keyElement.classList.remove('pressed'), duration * 0.8);
    }
}

function onSheetEnd() {
    if (currentSheetItem) currentSheetItem.classList.remove('playing');
    clearNoteDisplay();
    updateControlButtons(false);

    if (currentNoteIndex >= 0 && currentNoteIndex < noteElements.length) {
        noteElements[currentNoteIndex].classList.remove('current');
        noteElements[currentNoteIndex].classList.add('played');
    }
}

function updateControlButtons(isPlaying) {
    if (isPlaying) {
        playBtn.disabled = true;
        stopBtn.disabled = false;
    } else if (currentSheetId) {
        playBtn.disabled = false;
        stopBtn.disabled = true;
    } else {
        playBtn.disabled = true;
        stopBtn.disabled = true;
    }
}

function stopSheetUI() {
    piano.stopSheet();
    document.querySelectorAll('.key.pressed').forEach(key => key.classList.remove('pressed'));
    if (currentSheetItem) currentSheetItem.classList.remove('playing');
    clearNoteDisplay();
    updateControlButtons(false);
}

function resetSheetDisplay() {
    noteElements.forEach(el => el.classList.remove('current', 'played'));
    currentNoteIndex = -1;
}

playBtn.addEventListener('click', async () => {
    if (!piano.sheetsLoaded) {
        console.warn('[Piano] Sheets not loaded yet.');
        return;
    }
    if (currentSheetId && !piano.isSheetPlaying()) {
        resetSheetDisplay();
        if (currentSheetItem) currentSheetItem.classList.add('playing');
        updateControlButtons(true);

        // 调用播放（多轨谱面会自动并行播放各轨）
        piano.playSheet(currentSheetId, onNotePlay, onSheetEnd);
    }
});

stopBtn.addEventListener('click', () => {
    stopSheetUI();
});

notationBtn.addEventListener('click', () => {
    showKeyboard = !showKeyboard;

    const icon = notationBtn.querySelector('.notation-icon');
    const text = notationBtn.querySelector('.notation-text');
    if (showKeyboard) {
        icon.textContent = '🎵';
        text.textContent = '音符';
        notationBtn.classList.add('active');
    } else {
        icon.textContent = '⌨';
        text.textContent = '按键';
        notationBtn.classList.remove('active');
    }

    if (currentSheetId) {
        const savedIndex = currentNoteIndex;
        const playedIndices = [];
        noteElements.forEach((el, i) => {
            if (el.classList.contains('played')) playedIndices.push(i);
        });

        renderSheet(currentSheetId);

        playedIndices.forEach(i => {
            if (noteElements[i]) noteElements[i].classList.add('played');
        });
        if (savedIndex >= 0 && noteElements[savedIndex]) {
            noteElements[savedIndex].classList.add('current');
        }
        currentNoteIndex = savedIndex;
    }
});

// 选择谱子（.sheet-item 的 data-sheet 属性需对应 JSON 中曲目键名）
document.querySelectorAll('.sheet-item').forEach(item => {
    item.addEventListener('click', async () => {
        const sheetId = item.dataset.sheet;

        if (!piano.sheetsLoaded) {
            console.warn('[Piano] Sheets not loaded yet.');
            return;
        }

        if (piano.isSheetPlaying()) stopSheetUI();

        document.querySelectorAll('.sheet-item.active').forEach(i => i.classList.remove('active'));

        currentSheetItem = item;
        currentSheetItem.classList.add('active');
        currentSheetId = sheetId;

        renderSheet(sheetId);
        updateControlButtons(false);
    });
});
