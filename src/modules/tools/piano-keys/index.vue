<template>
  <div class="piano-keys">
    <div class="page-content">
      <header class="piano-keys__header">
        <h1 class="piano-keys__title">{{ tt('title') }}</h1>
        <p class="piano-keys__subtitle">{{ tt('subtitle') }}</p>
      </header>

      <p v-if="!supported" class="piano-keys__error">{{ tt('unsupported') }}</p>

      <!-- 演奏状态 -->
      <div class="piano-keys__status">
        <div class="piano-keys__note-box">
          <span class="piano-keys__note-label">{{ tt('currentNote') }}</span>
          <span class="piano-keys__note" :class="{ 'is-active': noteActive }">
            {{ currentNote || '-' }}
          </span>
        </div>

        <label class="piano-keys__tone" for="piano-tone">
          <span class="piano-keys__tone-label">{{ tt('tone') }}</span>
          <select
            id="piano-tone"
            class="piano-keys__select"
            :value="tone"
            @change="onToneChange"
          >
            <option v-for="id in TONE_IDS" :key="id" :value="id">
              {{ tt(TONE_LABELS[id]) }}
            </option>
          </select>
        </label>

        <button
          class="piano-keys__btn"
          type="button"
          aria-controls="piano-tips"
          :aria-expanded="tipsOpen"
          @click="tipsOpen = !tipsOpen"
        >
          <AppIcon name="hint" :size="16" decorative />
          {{ tt('tips') }}
        </button>
      </div>

      <!-- 键盘 -->
      <section class="piano-keys__stage">
        <div ref="scrollRef" class="piano-keys__scroll">
          <div class="piano-keys__keyboard" role="group" :aria-label="tt('keyboardAria')">
            <div
              v-for="group in KEYBOARD"
              :key="group.octave"
              class="piano-keys__octave"
              :data-octave="group.octave"
            >
              <button
                v-for="key in group.keys"
                :key="key.note"
                class="piano-keys__key"
                :class="[key.black ? 'is-black' : 'is-white', { 'is-pressed': pressedNotes.has(key.note) }]"
                type="button"
                :aria-label="keyAria(key)"
                @pointerdown="pressNote(key.note)"
                @pointerup="releaseNote(key.note)"
                @pointerleave="releaseNote(key.note)"
                @pointercancel="releaseNote(key.note)"
              >
                <span v-if="key.label" class="piano-keys__key-label" aria-hidden="true">
                  {{ key.label }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <p v-if="overflowing" class="piano-keys__hint">{{ tt('tipScroll') }}</p>
      </section>

      <!-- 曲谱 -->
      <section class="piano-keys__stage">
        <h2 class="piano-keys__label">{{ tt('scores') }}</h2>

        <div class="piano-keys__songs" role="radiogroup" :aria-label="tt('scores')">
          <button
            v-for="id in SHEET_IDS"
            :key="id"
            class="piano-keys__song"
            :class="{ 'is-active': selectedId === id, 'is-playing': isPlaying && selectedId === id }"
            type="button"
            role="radio"
            :aria-checked="selectedId === id"
            @click="selectSheet(id)"
          >
            <span class="piano-keys__song-name">{{ sheetName(id) }}</span>
            <span class="piano-keys__song-desc">{{ sheetDesc(id) }}</span>
          </button>
        </div>

        <div class="piano-keys__strip">
          <p v-if="!events.length" class="piano-keys__empty">
            <AppIcon name="tool-piano" :size="24" decorative />
            {{ tt('pickSong') }}
          </p>
          <span
            v-for="(event, index) in events"
            :key="index"
            :ref="(el) => setNoteRef(el, index)"
            class="piano-keys__note-chip"
            :class="chipClass(event, index)"
            :title="chipTitle(event)"
          >
            {{ chipText(event) }}
          </span>
        </div>

        <div class="piano-keys__actions">
          <button
            class="piano-keys__btn piano-keys__btn--primary"
            type="button"
            :disabled="!canPlay"
            @click="startPlayback"
          >
            {{ isPlaying ? tt('playing') : tt('play') }}
          </button>
          <button
            class="piano-keys__btn"
            type="button"
            :disabled="!canStop"
            @click="stopPlayback"
          >
            {{ tt('stop') }}
          </button>
          <button
            class="piano-keys__btn"
            type="button"
            :aria-pressed="showKeyboard"
            :disabled="!events.length"
            @click="showKeyboard = !showKeyboard"
          >
            {{ tt('notationKey') }}
          </button>
        </div>
      </section>

      <!-- 操作提示。旧版是遮罩弹窗，改为就地展开：内容更长（多了一行
           横屏与滚动的说明），常驻页面比遮挡键盘更合用 -->
      <section v-show="tipsOpen" id="piano-tips" class="piano-keys__tips">
        <h2 class="piano-keys__label">{{ tt('tipsTitle') }}</h2>
        <ul class="piano-keys__tips-list">
          <li>{{ tt('tipClick') }}</li>
          <li>{{ tt('tipHold') }}</li>
          <li>{{ tt('tipScroll') }}</li>
        </ul>
        <h3 class="piano-keys__label">{{ tt('keyboardMap') }}</h3>
        <ul class="piano-keys__tips-list piano-keys__tips-list--keys">
          <li v-for="row in KEY_ROWS" :key="row">{{ tt(row) }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { AppIcon } from '@/shared/icons'
import { lt, useToolI18n } from '@/shared/i18n'
import { messages, type PianoMessageKey } from './locales'
import { KEYBOARD, KEYBOARD_NOTES, KEY_TO_NOTE, NOTE_TO_KEY, TONE_IDS, type PianoKey } from './data/notes'
import { SHEETS, SHEET_IDS } from './data/sheets'
import { usePiano } from './composables/usePiano'
import { buildEvents, isLabel, isRest, REST_MARK, useSheetPlayer } from './composables/useSheetPlayer'
import type { OscType, ScoreEvent } from './types'

/**
 * Piano Keys
 *
 * 融合迁移完成（docs/09-tool-page-spec.md 的 Stage 2 + Stage 3）：
 * 由 iframe 桥接旧版静态页改为原生 Vue 组件。合成参数、包络时间点、
 * 播放速度、曲谱数据全部逐值照搬，详见各 composable 的文件头。
 *
 * 与旧界面的差异（均为视图层，不涉及声音）：
 * 1. 曲谱随模块打包，不再运行时 fetch JSON。旧版因此有一整套
 *    「谱子尚未加载」的空窗期处理，现在不存在加载失败这一状态。
 * 2. 操作提示由遮罩弹窗改为就地展开的面板；横屏建议与「窗口宽度不足」
 *    的告警合并为一条提示，只在键盘确实溢出时出现。
 * 3. 手机端不再按 UA 判定，改为 CSS 的断点：触屏窄屏同样只显示
 *    C3–C5，但键盘保留横向滚动，被折叠的音仍可触达。
 * 4. 琴谱里表示和弦音数的记号，由 U+266B 换成了文字（该码位落在全站
 *    禁用的 emoji 区段内），传达的是同一信息：和弦由几个音叠成。
 */

const { tt } = useToolI18n(messages)

const { engine, tone, setTone } = usePiano()
const { isPlaying, play, stop } = useSheetPlayer(engine)

/** 浏览器是否具备 Web Audio。缺失时不发声，界面给出文字说明 */
const supported = engine.supported

/** 音色名到文案键的映射。写成常量表，漏配会在编译期报错 */
const TONE_LABELS = {
  triangle: 'toneTriangle',
  sine: 'toneSine',
  square: 'toneSquare',
  sawtooth: 'toneSawtooth',
} as const satisfies Record<OscType, PianoMessageKey>

/** 提示里的键位表，按八度从低到高 */
const KEY_ROWS = ['keyC2', 'keyC3', 'keyC4', 'keyC5', 'keyC6'] as const

/* ============================================
   状态
   ============================================ */

const currentNote = ref('')
const noteActive = ref(false)
const tipsOpen = ref(false)
const showKeyboard = ref(false)

/** 高亮的琴键：手动按住的与谱面演奏的共用一套，与旧版一致 */
const pressedNotes = ref(new Set<string>())

const selectedId = ref<string | null>(null)

/** 谱面：当前播放到的位置，与已放过的位置 */
const currentIndex = ref(-1)
const played = ref(new Set<number>())

/** 当前曲目的事件序列 */
const events = computed<ScoreEvent[]>(() => {
  const sheet = selectedId.value ? SHEETS[selectedId.value] : null
  return sheet ? buildEvents(sheet) : []
})

const canPlay = computed(() => selectedId.value !== null && !isPlaying.value)
const canStop = computed(() => isPlaying.value)

function sheetName(id: string): string {
  const sheet = SHEETS[id]
  return sheet && sheet.name ? lt(sheet.name) : id
}

function sheetDesc(id: string): string {
  const sheet = SHEETS[id]
  return sheet && sheet.desc ? lt(sheet.desc) : ''
}

/* ============================================
   演奏：鼠标、触摸与电脑键盘
   ============================================ */

function pressNote(note: string): void {
  engine.startNote(note)
  currentNote.value = note
  noteActive.value = true
  pressedNotes.value.add(note)
}

function releaseNote(note: string): void {
  engine.stopNote(note)
  noteActive.value = false
  pressedNotes.value.delete(note)
}

/** 已在按键状态里的物理键，避免长按重复触发 */
const heldKeys = new Set<string>()

function onKeyDown(event: KeyboardEvent): void {
  const key = event.key.toLowerCase()
  const note = KEY_TO_NOTE[key]
  if (!note || heldKeys.has(key)) return

  heldKeys.add(key)
  pressNote(note)
}

function onKeyUp(event: KeyboardEvent): void {
  const key = event.key.toLowerCase()
  const note = KEY_TO_NOTE[key]
  if (!note) return

  heldKeys.delete(key)
  releaseNote(note)
}

/** 窗口失焦：全部松键。否则切走窗口后会留下停不下来的长音 */
function onWindowBlur(): void {
  engine.stopAllNotes()
  heldKeys.clear()
  pressedNotes.value.clear()
  noteActive.value = false
}

function keyAria(key: PianoKey): string {
  return key.label ? tt('keyAria', { note: key.note, key: key.label }) : key.note
}

/* ============================================
   琴谱
   ============================================ */

const flashTimers: number[] = []

/** 演奏到某个音时，把对应的琴键压一下 */
function flashKey(display: string, durationMs: number): void {
  if (!KEYBOARD_NOTES.has(display)) return

  pressedNotes.value.add(display)
  flashTimers.push(
    window.setTimeout(() => {
      pressedNotes.value.delete(display)
    }, durationMs * 0.8),
  )
}

const noteRefs: HTMLElement[] = []

function setNoteRef(el: Element | ComponentPublicInstance | null, index: number): void {
  if (el instanceof HTMLElement) noteRefs[index] = el
}

/** 跟随当前音滚动，让长谱面始终看得见正在弹的位置 */
async function scrollToNote(index: number): Promise<void> {
  await nextTick()
  noteRefs[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

function handleSheetNote(display: string, durationMs: number, index: number): void {
  currentNote.value = display
  noteActive.value = true
  flashKey(display, durationMs)

  if (currentIndex.value >= 0) played.value.add(currentIndex.value)
  currentIndex.value = index

  void scrollToNote(index)
}

function handleSheetEnd(): void {
  if (currentIndex.value >= 0) {
    played.value.add(currentIndex.value)
    currentIndex.value = -1
  }
  noteActive.value = false
}

function resetStrip(): void {
  played.value.clear()
  currentIndex.value = -1
}

function selectSheet(id: string): void {
  if (isPlaying.value) stopPlayback()
  selectedId.value = id
  resetStrip()
}

function startPlayback(): void {
  if (!canPlay.value) return
  resetStrip()
  play(events.value, handleSheetNote, handleSheetEnd)
}

function stopPlayback(): void {
  stop()
  pressedNotes.value.clear()
  noteActive.value = false
}

/* ============================================
   琴谱记号
   ============================================ */

/** 谱面记号：按键显示时用键位字符，音符显示时用音名 */
function chipText(event: ScoreEvent): string {
  const note = event.n

  if (note === null || note === undefined) return REST_MARK

  if (Array.isArray(note)) {
    if (showKeyboard.value) {
      const keys = note.map((n) => NOTE_TO_KEY[n] || '?').join('')
      return keys.length > 3 ? `${keys.slice(0, 3)}..` : keys
    }
    return tt('chordCount', { count: note.length })
  }

  if (typeof note !== 'string') return REST_MARK
  if (isLabel(note)) return note
  if (isRest(note)) return REST_MARK
  return showKeyboard.value ? NOTE_TO_KEY[note] || note : note
}

function chipClass(event: ScoreEvent, index: number): Record<string, boolean> {
  const note = event.n
  return {
    'is-chord': Array.isArray(note),
    'is-rest': note === null || note === undefined || isRest(note) || isLabel(note),
    'is-current': index === currentIndex.value,
    'is-played': played.value.has(index),
  }
}

function chipTitle(event: ScoreEvent): string | undefined {
  return Array.isArray(event.n) ? event.n.join(' + ') : undefined
}

/* ============================================
   音色
   ============================================ */

function onToneChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  const next = TONE_IDS.find((id) => id === value)
  if (next) setTone(next)
}

/* ============================================
   键盘是否溢出：溢出时才提示可以横向滚动
   ============================================ */

const scrollRef = ref<HTMLElement | null>(null)
const overflowing = ref(false)
let observer: ResizeObserver | null = null

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onWindowBlur)

  const el = scrollRef.value
  if (!el) return

  const measure = (): void => {
    overflowing.value = el.scrollWidth > el.clientWidth + 1
  }
  measure()

  observer = new ResizeObserver(measure)
  observer.observe(el)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', onWindowBlur)

  observer?.disconnect()
  for (const id of flashTimers) clearTimeout(id)
  flashTimers.length = 0
})
</script>

<style scoped>
@import './piano-keys.css';
</style>
