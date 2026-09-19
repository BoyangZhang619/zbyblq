/**
 * Kalimba 拇指琴的界面文案
 *
 * 放本工具目录内而非全局文案表 `shared/i18n/locales/`：工具的文案与工具
 * 的生命周期绑定，删工具时应一并带走；集中存放还会让并行开发的工具改同
 * 一份文件。参见 docs/09-tool-page-spec.md §5
 */

import type { Locale } from '@/shared/i18n'

/**
 * 基准语种。键集合由此推导，漏翻或键名拼错都会在 vue-tsc 阶段报错
 */
const zhCN = {
  title: 'Kalimba 拇指琴',
  subtitle: '纯 WebAudio 合成：轻拨起音、悠长余音与一点空间感',

  // 音频
  enableAudio: '启用音频',
  audioEnabled: '音频已启用',
  enableHint: '浏览器要求先有一次点击才允许出声',

  // 调式与音色
  scale: '调式',
  'scale.c_major': 'C 大调',
  'scale.a_minor': 'A 小调',
  'scale.pentatonic': '五声音阶',
  master: '主音量',
  release: '延音',
  brightness: '亮度',
  vibrato: '颤音',
  space: '空间感',

  // 录音与播放
  record: '录制',
  stopRecord: '停止录制',
  play: '播放',
  pause: '暂停',
  clear: '清空',
  randomMelody: '随机小旋律',

  // 状态
  statusIdle: '未启用音频',
  statusNeedAudio: '先点「启用音频」哦',
  statusUnsupported: '当前浏览器不支持 WebAudio，无法演奏',
  statusReady: '就绪：可以演奏了',
  statusEnabled: '音频已启用',
  statusScaleChanged: '已切换调式',
  statusRecording: '录制中：开始弹一段吧（Space 可播放或暂停）',
  statusRecorded: '录制完成：{count} 个音',
  statusRecordedEmpty: '录制结束：没有记录到音',
  statusCleared: '已清空录音',
  statusNoRecording: '还没有录音：先点「录制」弹一段',
  statusPlaying: '播放中（循环）',
  statusPaused: '已暂停',
  statusRandomReady: '已生成随机小旋律：{count} 个音（Space 播放或暂停）',

  // 琴键
  keysTitle: '琴键',
  keysAria: 'Kalimba 琴键区',
  keyAria: '{note}，按键 {key}',
  hintKeyboard: '键盘 1~9 / Q~I',
  hintSpace: 'Space 播放 / 暂停',

  // 小技巧
  tipsTitle: '小技巧',
  tip1: '想要更像拇指琴：亮度 40~65，延音 700~1100，空间感 15~35',
  tip2: '五声音阶随便弹都好听，适合录一段循环做背景音',
  tip3: '觉得音太刺耳，就调低亮度或主音量',
}

/**
 * 英文文案。类型标注为基准语种的形状，缺键与多键都会编译失败
 */
const en: typeof zhCN = {
  title: 'Kalimba',
  subtitle: 'A WebAudio thumb piano with a soft pluck, a long release and a touch of space',

  enableAudio: 'Enable audio',
  audioEnabled: 'Audio on',
  enableHint: 'Browsers need one click before they allow any sound',

  scale: 'Scale',
  'scale.c_major': 'C major',
  'scale.a_minor': 'A minor',
  'scale.pentatonic': 'Pentatonic',
  master: 'Master',
  release: 'Release',
  brightness: 'Brightness',
  vibrato: 'Vibrato',
  space: 'Space',

  record: 'Record',
  stopRecord: 'Stop recording',
  play: 'Play',
  pause: 'Pause',
  clear: 'Clear',
  randomMelody: 'Random melody',

  statusIdle: 'Audio off',
  statusNeedAudio: 'Tap "Enable audio" first',
  statusUnsupported: 'This browser has no WebAudio support, so the kalimba cannot play',
  statusReady: 'Ready — start playing',
  statusEnabled: 'Audio on',
  statusScaleChanged: 'Scale changed',
  statusRecording: 'Recording — play something (Space to play or pause)',
  statusRecorded: 'Recorded {count} notes',
  statusRecordedEmpty: 'Nothing was recorded',
  statusCleared: 'Recording cleared',
  statusNoRecording: 'No recording yet — hit Record and play something',
  statusPlaying: 'Playing (looping)',
  statusPaused: 'Paused',
  statusRandomReady: 'Random melody ready: {count} notes (Space to play or pause)',

  keysTitle: 'Tines',
  keysAria: 'Kalimba keys',
  keyAria: '{note}, key {key}',
  hintKeyboard: 'Keys 1~9 / Q~I',
  hintSpace: 'Space play / pause',

  tipsTitle: 'Tips',
  tip1: 'For the warmest tone: brightness 40~65, release 700~1100, space 15~35',
  tip2: 'The pentatonic scale sounds good whatever you play — handy for a background loop',
  tip3: 'If it sounds harsh, lower the brightness or the master volume',
}

/** 本工具的文案键。status 与参数标签都由它约束，拼错即编译失败 */
export type KalimbaKey = keyof typeof zhCN

export const messages: Record<Locale, Record<KalimbaKey, string>> = {
  'zh-CN': zhCN,
  en,
}
