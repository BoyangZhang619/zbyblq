/**
 * 鼓机控制器
 *
 * 把合成引擎（useDrumSynth）、图案数据（usePattern）与走带（播放/停止/录制）
 * 串起来，向视图暴露一份响应式状态。views 只负责渲染与事件绑定，
 * 不含任何音频或计时逻辑。
 *
 * 走带与录制的行为逐条对齐旧实现：
 * - 播放从当前步继续（暂停不清零），停止才回到第 0 步
 * - 空格键等同「播放 / 停止」，而播放按钮是「播放 / 暂停」——旧版如此
 * - 录制只写 4 条音序器行，敲下 Ghost 鼓垫不写
 *
 * 参见 docs/09-tool-page-spec.md §9
 */

import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import {
  createDrumSynth,
  MASTER_DEFAULT_RATIO,
  FX_SEND_DEFAULT_RATIO,
  type SynthParams,
} from './useDrumSynth'
import {
  PADS,
  STEP_INDEXES,
  STEPS,
  TRACKS,
  makeEmptyPattern,
  padToTrack,
  stepIntervalMs,
  type PadId,
  type Pattern,
  type TrackId,
} from './usePattern'
import type { DrumMessageKey } from '../locales'

/** 鼓垫的点亮时长。旧版固定 90ms */
const FLASH_MS = 90

export function useDrumPad() {
  const synth = createDrumSynth()

  /* ============================================
     参数。默认值与旧版 index.html 的 value 一致
     ============================================ */

  const bpm = ref(120)
  const master = ref(MASTER_DEFAULT_RATIO * 100)
  const kickTone = ref(55)
  const snareNoise = ref(70)
  const hatBright = ref(75)
  const spaceFx = ref(FX_SEND_DEFAULT_RATIO * 100)

  /* ============================================
     状态
     ============================================ */

  /** 音频图是否已建立。未建立时走带按钮禁用 */
  const audioEnabled = ref(false)
  const isPlaying = ref(false)
  const isRecording = ref(false)

  /** 走带位置，暂停后保留，下一次播放从这里继续 */
  const playStep = ref(0)

  /**
   * 音序器高亮的列。null 表示尚未播放过，此时不高亮任何一列——
   * 旧版只在 play / stop 时设置高亮，初始无高亮
   */
  const playhead = ref<number | null>(null)

  const statusKey = ref<DrumMessageKey>('status.audioOff')
  const pattern = ref<Pattern>(makeEmptyPattern())

  /** 正在点亮的鼓垫。用集合而非数组，判定是 O(1) */
  const flashing = ref<Set<string>>(new Set())

  const flashTimers = new Map<string, ReturnType<typeof setTimeout>>()

  /* ============================================
     工具
     ============================================ */

  function currentParams(): SynthParams {
    return {
      kickTone: kickTone.value,
      snareNoise: snareNoise.value,
      hatBright: hatBright.value,
    }
  }

  function flash(id: string): void {
    const pending = flashTimers.get(id)
    if (pending) clearTimeout(pending)
    flashing.value.add(id)
    flashTimers.set(id, setTimeout(() => {
      flashing.value.delete(id)
      flashTimers.delete(id)
    }, FLASH_MS))
  }

  /* ============================================
     演奏
     ============================================ */

  function triggerPad(id: PadId, time?: number): void {
    if (!synth.isReady()) {
      statusKey.value = 'status.needAudio'
      return
    }

    const t = time ?? synth.now()
    flash(id)

    // 录制：把这次触发写进当前步，只写 4 条音序器行
    if (isRecording.value) {
      const step = playStep.value % STEPS
      const track = padToTrack(id)
      if (track) pattern.value[track][step] = true
    }

    synth.trigger(id, t)
  }

  /* ============================================
     走带
     ============================================ */

  let timer: ReturnType<typeof setTimeout> | null = null

  function tick(): void {
    const t = synth.now()

    // 按图案敲响本步的每一行
    for (const track of TRACKS) {
      if (pattern.value[track.id][playStep.value]) triggerPad(track.pad, t)
    }

    playStep.value = (playStep.value + 1) % STEPS
    playhead.value = playStep.value

    if (!isPlaying.value) return
    timer = setTimeout(tick, stepIntervalMs(bpm.value))
  }

  function play(): void {
    if (!synth.isReady() || isPlaying.value) return

    isPlaying.value = true
    statusKey.value = isRecording.value ? 'status.playingRec' : 'status.playing'

    playStep.value = playStep.value % STEPS
    playhead.value = playStep.value

    timer = setTimeout(tick, 0)
  }

  function pause(): void {
    if (!isPlaying.value) return

    isPlaying.value = false
    clearTimer()
    statusKey.value = isRecording.value ? 'status.pausedRec' : 'status.paused'
  }

  function stop(): void {
    if (!synth.isReady()) return

    isPlaying.value = false
    clearTimer()
    playStep.value = 0
    playhead.value = 0
    statusKey.value = isRecording.value ? 'status.stoppedRec' : 'status.stopped'
  }

  function clearTimer(): void {
    if (timer) clearTimeout(timer)
    timer = null
  }

  /** 播放按钮：在播放与暂停之间切换 */
  function togglePlay(): void {
    if (isPlaying.value) pause()
    else play()
  }

  /** 空格键：在播放与停止之间切换。旧版如此，与按钮并不一致 */
  function toggleBySpace(): void {
    if (isPlaying.value) stop()
    else play()
  }

  function toggleRec(): void {
    if (!synth.isReady()) return

    isRecording.value = !isRecording.value
    statusKey.value = isRecording.value
      ? 'status.recording'
      : isPlaying.value ? 'status.playing' : 'status.idle'
  }

  function clearPattern(): void {
    pattern.value = makeEmptyPattern()
  }

  function toggleStep(track: TrackId, step: number): void {
    pattern.value[track][step] = !pattern.value[track][step]
  }

  /* ============================================
     音频开关
     ============================================ */

  async function enableAudio(): Promise<void> {
    if (audioEnabled.value) return

    try {
      await synth.enable(master.value / 100, spaceFx.value / 100, currentParams())
      audioEnabled.value = true
      statusKey.value = 'status.ready'
    } catch {
      statusKey.value = 'audioFailed'
    }
  }

  /* 参数改动即时下发：音量与空间感改的是增益节点，音色参数在下一次触发时生效 */
  watch([master, spaceFx, kickTone, snareNoise, hatBright], () => {
    synth.setMasterRatio(master.value / 100)
    synth.setFxSendRatio(spaceFx.value / 100)
    synth.setParams(currentParams())
  })

  /* ============================================
     键盘
     ============================================ */

  function onKeydown(event: KeyboardEvent): void {
    // 空格：播放 / 停止
    if (event.code === 'Space') {
      event.preventDefault()
      if (!synth.isReady()) return
      toggleBySpace()
      return
    }

    // 鼓垫映射
    const pad = PADS.find(p => p.code === event.code)
    if (pad) {
      event.preventDefault()
      triggerPad(pad.id)
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    clearTimer()
    for (const pending of flashTimers.values()) clearTimeout(pending)
    flashTimers.clear()
  })

  return {
    /* 常量 */
    pads: PADS,
    tracks: TRACKS,
    steps: STEP_INDEXES,

    /* 参数 */
    bpm,
    master,
    kickTone,
    snareNoise,
    hatBright,
    spaceFx,

    /* 状态 */
    audioEnabled,
    isPlaying,
    isRecording,
    playhead,
    statusKey,
    pattern,
    flashing,

    /* 操作 */
    enableAudio,
    triggerPad,
    togglePlay,
    stop,
    toggleRec,
    clearPattern,
    toggleStep,
  }
}
