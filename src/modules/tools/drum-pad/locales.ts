/**
 * Drum Pad 鼓机界面文案
 *
 * 放在工具自己的目录内，不改动 src/shared/i18n/locales/ 下的全局文案表——
 * 多个工具并行开发时集中存放必然冲突。参见 docs/09-tool-page-spec.md §5
 *
 * 形状必须是 Record<Locale, T>，这是 useToolI18n 的签名所要求的
 * （见 src/shared/i18n/index.ts）。中英两份必须齐全，缺一个语种
 * 会在 vue-tsc 阶段报错。
 *
 * 键名用点号分组：status.* 是状态行文案，pad.* 是鼓垫名，
 * track.* 是音序器行名。鼓垫名与音序器行名中英一致——它们是
 * 乐器的通用名称，与旧版界面保持相同呈现。
 */

const zhCN = {
  title: 'Drum Pad 鼓机',
  subtitle: '纯 WebAudio 合成鼓垫：键盘演奏 + 16 步编排循环，所有声音都由代码生成',
  hintKeys: '按键：Q W E R / A S D F / Z X C V',
  hintSpace: 'Space：播放/暂停',

  /* 控制台 */
  audioEnable: '启用音频',
  audioOn: '音频已启用',
  audioFailed: '音频无法启动，请检查浏览器的声音权限',
  bpm: 'BPM',
  master: '主音量',
  kickTone: 'Kick 低频',
  snareNoise: 'Snare 噪声',
  hatBright: 'Hat 亮度',
  spaceFx: '空间感',
  clear: '清空 Pattern',

  /* 走带 */
  play: '播放',
  pause: '暂停',
  stop: '停止',
  record: '录制',
  stopRecord: '停止录制',

  /* 状态 */
  'status.audioOff': '未启用音频',
  'status.needAudio': '先点「启用音频」哦',
  'status.ready': '就绪：可以敲鼓了',
  'status.playing': '播放中…',
  'status.playingRec': '播放中（录制）…',
  'status.paused': '已暂停',
  'status.pausedRec': '已暂停（录制）',
  'status.stopped': '已停止',
  'status.stoppedRec': '停止（录制）',
  'status.recording': '录制中：敲鼓写入当前小节',
  'status.idle': '就绪',

  /* 鼓垫 */
  padsLabel: '鼓垫区域',
  'pad.kick': 'Kick',
  'pad.snare': 'Snare',
  'pad.hatc': 'Hat C',
  'pad.hato': 'Hat O',
  'pad.clap': 'Clap',
  'pad.tom': 'Tom',
  'pad.perc': 'Perc',
  'pad.ride': 'Ride',
  'pad.kick2': 'Kick2',
  'pad.snare2': 'Snare2',
  'pad.hat2': 'Hat 2',
  'pad.fx': 'FX',
  'pad.mute1': 'Ghost',
  'pad.mute2': 'Ghost',
  'pad.mute3': 'Ghost',
  'pad.mute4': 'Ghost',

  /* 音序器 */
  seqTitle: '16 步 Pattern',
  seqSub: '每一行对应一种鼓，播放时会高亮当前步',
  seqHint: '点击格子打点',
  seqLabel: '步进音序器',
  seqStep: '第 {step} 步，{track}',
  'track.kick': 'KICK',
  'track.snare': 'SNARE',
  'track.hat': 'HAT',
  'track.clap': 'CLAP',

  /* 提示 */
  legendTip: '技巧：',
  legendBody: '先启用音频 → 试敲几下 → 点击录制 → 敲出一小节 → 播放循环',
}

/** 本工具的文案键。状态等需要在逻辑层流转的文案以此类型约束 */
export type DrumMessageKey = keyof typeof zhCN

const en: Record<DrumMessageKey, string> = {
  title: 'Drum Pad',
  subtitle: 'A pure WebAudio drum machine: play by keyboard, loop a 16-step pattern',
  hintKeys: 'Keys: Q W E R / A S D F / Z X C V',
  hintSpace: 'Space: play/pause',

  audioEnable: 'Enable audio',
  audioOn: 'Audio on',
  audioFailed: 'Audio could not start. Check the sound permission of your browser',
  bpm: 'BPM',
  master: 'Master',
  kickTone: 'Kick tone',
  snareNoise: 'Snare noise',
  hatBright: 'Hat brightness',
  spaceFx: 'Space',
  clear: 'Clear pattern',

  play: 'Play',
  pause: 'Pause',
  stop: 'Stop',
  record: 'Record',
  stopRecord: 'Stop recording',

  'status.audioOff': 'Audio is off',
  'status.needAudio': 'Enable the audio first',
  'status.ready': 'Ready: hit the pads',
  'status.playing': 'Playing…',
  'status.playingRec': 'Playing (recording)…',
  'status.paused': 'Paused',
  'status.pausedRec': 'Paused (recording)',
  'status.stopped': 'Stopped',
  'status.stoppedRec': 'Stopped (recording)',
  'status.recording': 'Recording: hits go into the current bar',
  'status.idle': 'Ready',

  padsLabel: 'Drum pads',
  'pad.kick': 'Kick',
  'pad.snare': 'Snare',
  'pad.hatc': 'Hat C',
  'pad.hato': 'Hat O',
  'pad.clap': 'Clap',
  'pad.tom': 'Tom',
  'pad.perc': 'Perc',
  'pad.ride': 'Ride',
  'pad.kick2': 'Kick2',
  'pad.snare2': 'Snare2',
  'pad.hat2': 'Hat 2',
  'pad.fx': 'FX',
  'pad.mute1': 'Ghost',
  'pad.mute2': 'Ghost',
  'pad.mute3': 'Ghost',
  'pad.mute4': 'Ghost',

  seqTitle: '16-step pattern',
  seqSub: 'One drum per row, the current step is highlighted while playing',
  seqHint: 'Click a cell to toggle a hit',
  seqLabel: 'Step sequencer',
  seqStep: 'Step {step}, {track}',
  'track.kick': 'KICK',
  'track.snare': 'SNARE',
  'track.hat': 'HAT',
  'track.clap': 'CLAP',

  legendTip: 'Tip: ',
  legendBody: 'Enable audio → try a few hits → record → play one bar → let it loop',
}

export const messages = { 'zh-CN': zhCN, en }
