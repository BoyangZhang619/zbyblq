/**
 * Piano Keys 的界面文案
 *
 * 工具级文案放在工具目录内，不写进全局文案表，理由见
 * src/shared/i18n/index.ts 的「工具级文案」一节。
 *
 * 完整性由类型保证：en 声明为 typeof zhCN，漏翻或拼错键名都会在
 * vue-tsc 阶段报错。
 */

const zhCN = {
  title: 'Piano Keys',
  subtitle: '点击琴键或使用键盘演奏',

  /* 演奏控制 */
  currentNote: '当前音符',
  tone: '音色',
  toneTriangle: '三角波（钢琴）',
  toneSine: '正弦波（纯音）',
  toneSquare: '方波（游戏）',
  toneSawtooth: '锯齿波（电子）',

  /* 提示 */
  tips: '操作提示',
  tipsTitle: '使用提示',
  tipClick: '点击琴键播放音符',
  tipHold: '按住琴键持续发声，松开停止',
  tipScroll: '琴键可横向滚动，屏幕越宽能同时看到的音越多',
  keyboardMap: '键盘映射',
  keyC2: 'C2 八度（Shift）: ! @ # $ % ^ & * ( ) _ +',
  keyC3: 'C3 八度: Z S X D C V G B H N J M',
  keyC4: 'C4 八度: Q 2 W 3 E R 5 T 6 Y 7 U',
  keyC5: 'C5 八度: I 9 O 0 P [ = ] \\ A L F',
  keyC6: "C6 八度: 1 4 8 - K ; ' , . /",

  /* 曲谱 */
  scores: '预设琴谱',
  pickSong: '选择一首曲目',
  play: '播放',
  playing: '播放中',
  stop: '停止',
  notationKey: '按键',
  chordCount: '{count} 音',

  /* 无障碍 */
  keyAria: '{note}，按键 {key}',
  keyboardAria: '钢琴键盘',
  unsupported: '当前浏览器不支持 Web Audio，无法发声',
}

const en: typeof zhCN = {
  title: 'Piano Keys',
  subtitle: 'Play with the on-screen keys or your computer keyboard',

  currentNote: 'Current note',
  tone: 'Tone',
  toneTriangle: 'Triangle (piano)',
  toneSine: 'Sine (pure tone)',
  toneSquare: 'Square (game)',
  toneSawtooth: 'Sawtooth (synth)',

  tips: 'Tips',
  tipsTitle: 'How to play',
  tipClick: 'Click a key to play a note',
  tipHold: 'Hold a key to sustain, release to stop',
  tipScroll: 'Scroll the keys sideways; the wider the screen, the more notes you see',
  keyboardMap: 'Keyboard map',
  keyC2: 'C2 octave (Shift): ! @ # $ % ^ & * ( ) _ +',
  keyC3: 'C3 octave: Z S X D C V G B H N J M',
  keyC4: 'C4 octave: Q 2 W 3 E R 5 T 6 Y 7 U',
  keyC5: 'C5 octave: I 9 O 0 P [ = ] \\ A L F',
  keyC6: "C6 octave: 1 4 8 - K ; ' , . /",

  scores: 'Preset scores',
  pickSong: 'Pick a song',
  play: 'Play',
  playing: 'Playing',
  stop: 'Stop',
  notationKey: 'Keys',
  chordCount: '{count} notes',

  keyAria: '{note}, key {key}',
  keyboardAria: 'Piano keyboard',
  unsupported: 'This browser does not support Web Audio, so no sound can be played',
}

export const messages = { 'zh-CN': zhCN, en }

/** 本工具的全部文案键。供 .vue 里做「常量表到文案键」的映射时取类型 */
export type PianoMessageKey = keyof typeof zhCN
