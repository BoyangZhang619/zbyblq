<template>
  <div class="profile">
    <div class="page-content">
      <header class="profile__header">
        <h1 class="profile__title">{{ t('profile.title') }}</h1>
        <p class="profile__subtitle">{{ t('profile.subtitle') }}</p>
      </header>

      <!-- 语言 -->
      <section class="profile__section">
        <h2 class="profile__section-title">{{ t('profile.language') }}</h2>
        <div class="profile__modes" role="radiogroup" :aria-label="t('profile.language')">
          <button
            v-for="code in locales"
            :key="code"
            class="profile__mode"
            :class="{ 'is-active': locale === code }"
            type="button"
            role="radio"
            :aria-checked="locale === code"
            @click="setLocale(code)"
          >
            <AppIcon name="settings" :size="20" decorative />
            <span>{{ localeLabels[code] }}</span>
          </button>
        </div>
      </section>

      <!-- 明暗模式 -->
      <section class="profile__section">
        <h2 class="profile__section-title">{{ t('profile.appearance') }}</h2>
        <div class="profile__modes" role="radiogroup" :aria-label="t('profile.appearance')">
          <button
            v-for="option in MODE_OPTIONS"
            :key="option.value"
            class="profile__mode"
            :class="{ 'is-active': mode === option.value }"
            type="button"
            role="radio"
            :aria-checked="mode === option.value"
            @click="setMode(option.value)"
          >
            <AppIcon :name="option.icon" :size="20" decorative />
            <span>{{ t(option.labelKey) }}</span>
          </button>
        </div>
      </section>

      <!-- 主题色板 -->
      <section class="profile__section">
        <h2 class="profile__section-title">{{ t('profile.accent') }}</h2>
        <div class="profile__swatches" role="radiogroup" :aria-label="t('profile.accent')">
          <button
            v-for="name in ACCENT_NAMES"
            :key="name"
            class="profile__swatch"
            :class="[`accent-${name}`, { 'is-active': accent === name }]"
            type="button"
            role="radio"
            :aria-checked="accent === name"
            :aria-label="accentLabel(name)"
            :title="accentLabel(name)"
            @click="setAccent(name)"
          >
            <span class="profile__swatch-dot"></span>
            <span class="profile__swatch-name">{{ accentLabel(name) }}</span>
          </button>
        </div>
      </section>

      <!-- 账户：待定 -->
      <section class="profile__section">
        <h2 class="profile__section-title">{{ t('profile.account') }}</h2>
        <div class="profile__placeholder">
          <AppIcon name="nav-profile" :size="24" decorative />
          <p class="profile__placeholder-text">{{ t('profile.account.pending') }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AppIcon, type IconName } from '@/shared/icons'
import {
  useTheme,
  ACCENT_NAMES,
  type AccentName,
  type ThemeMode,
} from '@/shared/composables/useTheme'
import { useI18n, type MessageKey } from '@/shared/i18n'

/**
 * 个人中心
 *
 * 承载语言、外观与主题设置。账户系统接入后（见 docs/05-account-system.md），
 * 本页将扩展出登录状态、资料编辑与同步管理。
 */

const { mode, accent, setMode, setAccent } = useTheme()
const { locale, locales, localeLabels, t, setLocale } = useI18n()

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
</script>

<style scoped>
@import './profile.css';
</style>
