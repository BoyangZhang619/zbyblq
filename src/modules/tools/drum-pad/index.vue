<template>
  <div class="drum-pad">
    <div class="page-content">
      <header class="drum-pad__header">
        <h1 class="drum-pad__title">{{ tt('title') }}</h1>
        <p class="drum-pad__subtitle">{{ tt('subtitle') }}</p>
        <ul class="drum-pad__hints">
          <li class="drum-pad__hint">{{ tt('hintKeys') }}</li>
          <li class="drum-pad__hint">{{ tt('hintSpace') }}</li>
        </ul>
      </header>

      <!-- 控制台 -->
      <section class="drum-pad__panel">
        <div class="drum-pad__actions">
          <button
            class="drum-pad__btn drum-pad__btn--primary"
            type="button"
            :disabled="audioEnabled"
            @click="enableAudio"
          >
            {{ audioEnabled ? tt('audioOn') : tt('audioEnable') }}
          </button>

          <button class="drum-pad__btn drum-pad__btn--danger" type="button" @click="clearPattern">
            <AppIcon name="trash" :size="16" decorative />
            {{ tt('clear') }}
          </button>
        </div>

        <div class="drum-pad__fields">
          <div class="drum-pad__field">
            <label class="drum-pad__label" for="drum-pad-bpm">{{ tt('bpm') }}</label>
            <input
              id="drum-pad-bpm"
              v-model.number="bpm"
              class="drum-pad__range"
              type="range"
              min="60"
              max="180"
            />
            <span class="drum-pad__value">{{ bpm }}</span>
          </div>

          <div class="drum-pad__field">
            <label class="drum-pad__label" for="drum-pad-master">{{ tt('master') }}</label>
            <input
              id="drum-pad-master"
              v-model.number="master"
              class="drum-pad__range"
              type="range"
              min="0"
              max="100"
            />
            <span class="drum-pad__value">{{ master }}</span>
          </div>

          <div class="drum-pad__field">
            <label class="drum-pad__label" for="drum-pad-kick">{{ tt('kickTone') }}</label>
            <input
              id="drum-pad-kick"
              v-model.number="kickTone"
              class="drum-pad__range"
              type="range"
              min="30"
              max="90"
            />
            <span class="drum-pad__value">{{ kickTone }}</span>
          </div>

          <div class="drum-pad__field">
            <label class="drum-pad__label" for="drum-pad-snare">{{ tt('snareNoise') }}</label>
            <input
              id="drum-pad-snare"
              v-model.number="snareNoise"
              class="drum-pad__range"
              type="range"
              min="0"
              max="100"
            />
            <span class="drum-pad__value">{{ snareNoise }}</span>
          </div>

          <div class="drum-pad__field">
            <label class="drum-pad__label" for="drum-pad-hat">{{ tt('hatBright') }}</label>
            <input
              id="drum-pad-hat"
              v-model.number="hatBright"
              class="drum-pad__range"
              type="range"
              min="0"
              max="100"
            />
            <span class="drum-pad__value">{{ hatBright }}</span>
          </div>

          <div class="drum-pad__field">
            <label class="drum-pad__label" for="drum-pad-space">{{ tt('spaceFx') }}</label>
            <input
              id="drum-pad-space"
              v-model.number="spaceFx"
              class="drum-pad__range"
              type="range"
              min="0"
              max="100"
            />
            <span class="drum-pad__value">{{ spaceFx }}</span>
          </div>
        </div>

        <!-- 走带 -->
        <div class="drum-pad__transport">
          <button
            class="drum-pad__btn"
            type="button"
            :disabled="!audioEnabled"
            @click="togglePlay"
          >
            {{ isPlaying ? tt('pause') : tt('play') }}
          </button>

          <button
            class="drum-pad__btn"
            type="button"
            :disabled="!audioEnabled"
            @click="stop"
          >
            {{ tt('stop') }}
          </button>

          <button
            class="drum-pad__btn"
            :class="{ 'is-active': isRecording }"
            type="button"
            :disabled="!audioEnabled"
            :aria-pressed="isRecording"
            @click="toggleRec"
          >
            {{ isRecording ? tt('stopRecord') : tt('record') }}
          </button>

          <p class="drum-pad__status" role="status">
            <AppIcon :name="statusIcon" :size="16" decorative />
            {{ tt(statusKey) }}
          </p>
        </div>
      </section>

      <!-- 鼓垫 -->
      <section class="drum-pad__card">
        <div class="drum-pad__pads" role="group" :aria-label="tt('padsLabel')">
          <button
            v-for="pad in pads"
            :key="pad.id"
            class="drum-pad__pad"
            :class="{ 'is-on': flashing.has(pad.id), 'is-silent': isSilentPad(pad.id) }"
            type="button"
            @click="triggerPad(pad.id)"
          >
            <span class="drum-pad__pad-name">{{ tt(pad.label) }}</span>
            <span class="drum-pad__pad-meta">
              <span>{{ pad.id.toUpperCase() }}</span>
              <span>{{ pad.key }}</span>
            </span>
          </button>
        </div>

        <p class="drum-pad__legend">
          <span class="drum-pad__legend-tip">{{ tt('legendTip') }}</span>{{ tt('legendBody') }}
        </p>
      </section>

      <!-- 音序器 -->
      <section class="drum-pad__card">
        <div class="drum-pad__seq-head">
          <h2 class="drum-pad__seq-title">{{ tt('seqTitle') }}</h2>
          <p class="drum-pad__seq-sub">{{ tt('seqSub') }}</p>
        </div>

        <div class="drum-pad__seq-scroll">
          <table class="drum-pad__seq" :aria-label="tt('seqLabel')">
            <tbody>
              <tr v-for="track in tracks" :key="track.id">
                <th class="drum-pad__seq-row" scope="row">{{ tt(track.label) }}</th>
                <td v-for="step in steps" :key="step" class="drum-pad__seq-cell">
                  <button
                    class="drum-pad__step"
                    :class="{
                      'is-on': pattern[track.id][step],
                      'is-playhead': playhead === step,
                      'is-barline': hasBarline(step),
                    }"
                    type="button"
                    :aria-pressed="pattern[track.id][step]"
                    :aria-label="tt('seqStep', { step: step + 1, track: tt(track.label) })"
                    @click="toggleStep(track.id, step)"
                  ></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="drum-pad__legend">{{ tt('seqHint') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon } from '@/shared/icons'
import type { IconName } from '@/shared/icons'
import { useToolI18n } from '@/shared/i18n'
import { messages } from './locales'
import { useDrumPad } from './composables/useDrumPad'
import { hasBarline, isSilentPad } from './composables/usePattern'

/**
 * Drum Pad 鼓机
 *
 * 融合迁移完成（docs/09-tool-page-spec.md 的 Stage 2 + Stage 3）：
 * 由 iframe 桥接 public/drum/ 改为原生 Vue 组件，接入设计令牌与图标体系；
 * 合成与走带逻辑提取到 composables/，视图不含音频代码。
 *
 * 合成参数逐值照搬旧实现，音色与旧版一致。旧版用 emoji 表达走带状态
 * （三角、方块、圆圈），图标注册表中没有对应的功能图标，因此走带按钮
 * 改为纯文字，见交付报告。
 */

const { tt } = useToolI18n(messages)

const {
  pads,
  tracks,
  steps,
  bpm,
  master,
  kickTone,
  snareNoise,
  hatBright,
  spaceFx,
  audioEnabled,
  isPlaying,
  isRecording,
  playhead,
  statusKey,
  pattern,
  flashing,
  enableAudio,
  triggerPad,
  togglePlay,
  stop,
  toggleRec,
  clearPattern,
  toggleStep,
} = useDrumPad()

/** 状态行的装饰图标。文字才是主要反馈，图标只做辅助 */
const statusIcon = computed<IconName>(() => {
  if (!audioEnabled.value) return 'status-info'
  if (isRecording.value) return 'status-warning'
  if (isPlaying.value) return 'status-success'
  return 'status-info'
})
</script>

<style scoped>
@import './drum-pad.css';
</style>
