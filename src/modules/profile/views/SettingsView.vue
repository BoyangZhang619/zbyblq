<template>
  <div class="set">
    <div class="page-content">
      <button class="set__back" type="button" @click="back">
        <AppIcon name="arrow-left" :size="16" decorative />
        {{ t('nav.profile') }}
      </button>

      <header class="set__head">
        <h1 class="set__title">{{ t('settings.title') }}</h1>
      </header>

      <!-- 外观模式 -->
      <section class="set__group">
        <h2 class="set__label">{{ t('profile.appearance') }}</h2>
        <div class="set__choices" role="radiogroup" :aria-label="t('profile.appearance')">
          <button
            v-for="option in MODE_OPTIONS"
            :key="option.value"
            class="set__choice"
            :class="{ 'is-active': mode === option.value }"
            type="button"
            role="radio"
            :aria-checked="mode === option.value"
            @click="setMode(option.value)"
          >
            <AppIcon :name="option.icon" :size="18" decorative />
            <span>{{ t(option.labelKey) }}</span>
          </button>
        </div>
      </section>

      <!-- 主题配色 -->
      <section class="set__group">
        <h2 class="set__label">{{ t('profile.accent') }}</h2>
        <div class="set__swatches" role="radiogroup" :aria-label="t('profile.accent')">
          <button
            v-for="name in ACCENT_NAMES"
            :key="name"
            class="set__swatch"
            :class="[`accent-${name}`, { 'is-active': accent === name }]"
            type="button"
            role="radio"
            :aria-checked="accent === name"
            :aria-label="accentLabel(name)"
            :title="accentLabel(name)"
            @click="setAccent(name)"
          >
            <span class="set__dot"></span>
          </button>
        </div>
      </section>

      <!-- 语言 -->
      <section class="set__group">
        <h2 class="set__label">{{ t('profile.language') }}</h2>
        <div class="set__choices" role="radiogroup" :aria-label="t('profile.language')">
          <button
            v-for="code in locales"
            :key="code"
            class="set__choice"
            :class="{ 'is-active': locale === code }"
            type="button"
            role="radio"
            :aria-checked="locale === code"
            @click="setLocale(code)"
          >
            <span>{{ localeLabels[code] }}</span>
          </button>
        </div>
      </section>

      <!-- 花园 -->
      <section class="set__group">
        <h2 class="set__label">{{ t('profile.garden') }}</h2>
        <button class="set__action" type="button" @click="resetGarden">
          <AppIcon name="trash" :size="16" decorative />
          {{ t('profile.garden.reset') }}
        </button>
        <p class="set__hint">{{ t('settings.garden.reset.hint') }}</p>
      </section>

      <!-- 关于 -->
      <section class="set__group">
        <h2 class="set__label">{{ t('settings.about') }}</h2>
        <p class="set__about">{{ t('settings.about.text') }}</p>
        <p class="set__hint">{{ t('settings.version') }} · {{ version }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { AppIcon, type IconName } from '@/shared/icons'
import { useTheme, ACCENT_NAMES, type AccentName, type ThemeMode } from '@/shared/composables/useTheme'
import { useProfile } from '@/shared/composables/useProfile'
import { useI18n, type MessageKey } from '@/shared/i18n'

/**
 * 设置页
 *
 * 与个人页的分工：个人页承载「我是谁、我用过什么」，是表达性的；
 * 设置页承载「应用怎么表现」，是功能性的。外观、语言、数据清理
 * 这类杂项集中在此，个人页因此得以保持轻。
 */

const router = useRouter()
const { mode, accent, setMode, setAccent } = useTheme()
const { resetGarden } = useProfile()
const { locale, locales, localeLabels, t, setLocale } = useI18n()

const version = __APP_VERSION__

const MODE_OPTIONS: { value: ThemeMode; labelKey: MessageKey; icon: IconName }[] = [
  { value: 'light', labelKey: 'profile.mode.light', icon: 'theme-light' },
  { value: 'dark',  labelKey: 'profile.mode.dark',  icon: 'theme-dark' },
  { value: 'auto',  labelKey: 'profile.mode.auto',  icon: 'settings' },
]

/** 色板文案键与色板 ID 一一对应，写成映射以保证类型完整 */
const ACCENT_KEYS: Record<AccentName, MessageKey> = {
  sun: 'accent.sun',
  mint: 'accent.mint',
  rose: 'accent.rose',
  peach: 'accent.peach',
  sky: 'accent.sky',
  lilac: 'accent.lilac',
}

function accentLabel(name: AccentName): string {
  return t(ACCENT_KEYS[name])
}

function back(): void {
  router.push({ name: 'profile' })
}
</script>

<style scoped>
@import './settings.css';
</style>
