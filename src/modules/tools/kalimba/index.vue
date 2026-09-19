<template>
  <div class="kalimba">
    <div class="page-content">
      <header class="kalimba__header">
        <h1 class="kalimba__title">{{ tt('title') }}</h1>
        <p class="kalimba__subtitle">{{ tt('subtitle') }}</p>
      </header>

      <!-- 启用音频：浏览器要求先有一次用户手势 -->
      <section class="kalimba__section">
        <button
          class="kalimba__btn kalimba__btn--primary"
          type="button"
          :disabled="enabled || !supported"
          @click="enableAudio"
        >
          <AppIcon v-if="enabled" name="status-success" :size="16" decorative />
          {{ enabled ? tt('audioEnabled') : tt('enableAudio') }}
        </button>
        <p class="kalimba__hint">{{ tt('enableHint') }}</p>
      </section>

      <!-- 调式与音色 -->
      <section class="kalimba__section kalimba__panel">
        <div class="kalimba__field">
          <label class="kalimba__label" for="kalimba-scale">{{ tt('scale') }}</label>
          <select
            id="kalimba-scale"
            class="kalimba__select"
            :value="scale"
            @change="onScaleChange"
          >
            <option v-for="id in SCALE_IDS" :key="id" :value="id">
              {{ tt(`scale.${id}`) }}
            </option>
          </select>
        </div>

        <div v-for="spec in PARAM_SPECS" :key="spec.key" class="kalimba__field">
          <div class="kalimba__field-head">
            <label class="kalimba__label" :for="`kalimba-${spec.key}`">{{ tt(spec.key) }}</label>
            <span class="kalimba__value">{{ params[spec.key] }}</span>
          </div>
          <input
            :id="`kalimba-${spec.key}`"
            v-model.number="params[spec.key]"
            class="app-range"
            type="range"
            :min="spec.min"
            :max="spec.max"
            step="1"
          />
        </div>
      </section>

      <!-- 录音与回放 -->
      <section class="kalimba__section">
        <div class="kalimba__transport">
          <button
            class="kalimba__btn"
            :class="{ 'is-recording': isRecording }"
            type="button"
            :disabled="!enabled"
            @click="toggleRec"
          >
            <span v-if="isRecording" class="kalimba__rec-dot" aria-hidden="true"></span>
            {{ isRecording ? tt('stopRecord') : tt('record') }}
          </button>

          <button
            class="kalimba__btn"
            :class="{ 'is-playing': isPlaying }"
            type="button"
            :disabled="!enabled"
            @click="togglePlay"
          >
            {{ isPlaying ? tt('pause') : tt('play') }}
          </button>

          <button class="kalimba__btn" type="button" :disabled="!enabled" @click="clearRecord">
            <AppIcon name="trash" :size="16" decorative />
            {{ tt('clear') }}
          </button>

          <button class="kalimba__btn" type="button" :disabled="!enabled" @click="playRandomMelody">
            <AppIcon name="sparkle" :size="16" decorative />
            {{ tt('randomMelody') }}
          </button>
        </div>

        <!-- 状态变化必须同时给出文字反馈，不能只改颜色或图标 -->
        <p class="kalimba__status" role="status" aria-live="polite">{{ statusText }}</p>
      </section>

      <!-- 琴键 -->
      <section class="kalimba__section">
        <h2 class="kalimba__section-title">{{ tt('keysTitle') }}</h2>

        <div class="kalimba__keys" role="group" :aria-label="tt('keysAria')">
          <div class="kalimba__tines">
            <button
              v-for="tine in tines"
              :key="tine.note"
              class="kalimba__tine"
              :class="{ 'is-on': activeKeys.has(tine.index) }"
              type="button"
              :style="{ '--kalimba-tine-factor': tine.factor }"
              :aria-label="tt('keyAria', { note: tine.note, key: tine.key })"
              @click="playKey(tine.index, 1.0)"
            >
              <span class="kalimba__tine-note" aria-hidden="true">
                {{ tine.letter }}<span class="kalimba__tine-octave">{{ tine.octave }}</span>
              </span>
              <span class="kalimba__tine-key" aria-hidden="true">{{ tine.key }}</span>
            </button>
          </div>
        </div>

        <ul class="kalimba__hints">
          <li class="kalimba__chip">{{ tt('hintKeyboard') }}</li>
          <li class="kalimba__chip">{{ tt('hintSpace') }}</li>
        </ul>
      </section>

      <!-- 小技巧 -->
      <details class="kalimba__tips">
        <summary class="kalimba__tips-summary">
          <AppIcon name="hint" :size="16" decorative />
          {{ tt('tipsTitle') }}
          <AppIcon class="kalimba__tips-chevron" name="arrow-right" :size="16" decorative />
        </summary>
        <ul class="kalimba__tips-list">
          <li>{{ tt('tip1') }}</li>
          <li>{{ tt('tip2') }}</li>
          <li>{{ tt('tip3') }}</li>
        </ul>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useToolI18n } from '@/shared/i18n'
import { SCALE_IDS, isScaleId } from './utils/music'
import { PARAM_SPECS } from './composables/useKalimbaSynth'
import { useKalimba } from './composables/useKalimba'
import { messages } from './locales'

/**
 * Kalimba 拇指琴
 *
 * 融合迁移 Stage 2 + 3（docs/09-tool-page-spec.md）：由 iframe 桥接旧版
 * 静态页改为原生 Vue 组件。乐理与几何在 utils/music.ts，WebAudio 合成在
 * composables/useKalimbaSynth.ts，演奏状态机在 composables/useKalimba.ts。
 *
 * 合成参数逐值照搬，音色与原版一致；界面接入设计令牌、图标体系与 i18n。
 */

const { tt } = useToolI18n(messages)

const {
  params,
  enabled,
  supported,
  scale,
  status,
  isRecording,
  isPlaying,
  activeKeys,
  tines,
  playKey,
  pressCode,
  toggleRec,
  togglePlay,
  clearRecord,
  playRandomMelody,
  enableAudio,
  changeScale,
  dispose,
} = useKalimba()

/** 状态行：逻辑层只给文案键，这里随语言变化重算 */
const statusText = computed(() => tt(status.value.key, status.value.params))

function onScaleChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (!isScaleId(value)) return
  scale.value = value
  changeScale()
}

/**
 * 全局键盘：1~9 / Q~I 演奏，Space 播放或暂停
 *
 * 与原实现一致，按下即阻止默认行为——否则 Space 会滚动页面。
 * 差别：焦点在琴键上时按 Space，原实现会同时触发该琴键与播放开关，
 * 此处统一为播放开关，与界面提示一致。
 */
function onKeydown(event: KeyboardEvent): void {
  if (pressCode(event.code)) event.preventDefault()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  dispose()
})
</script>

<style scoped>
@import './kalimba.css';
</style>
