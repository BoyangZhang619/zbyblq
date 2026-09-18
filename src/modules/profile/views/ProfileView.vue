<template>
  <div class="profile">
    <div class="page-content">
      <header class="profile__header">
        <h1 class="profile__title">个人中心</h1>
        <p class="profile__subtitle">外观与偏好设置</p>
      </header>

      <!-- 明暗模式 -->
      <section class="profile__section">
        <h2 class="profile__section-title">外观模式</h2>
        <div class="profile__modes" role="radiogroup" aria-label="外观模式">
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
            <span>{{ option.label }}</span>
          </button>
        </div>
      </section>

      <!-- 主题色板 -->
      <section class="profile__section">
        <h2 class="profile__section-title">主题配色</h2>
        <div class="profile__swatches" role="radiogroup" aria-label="主题配色">
          <button
            v-for="name in ACCENT_NAMES"
            :key="name"
            class="profile__swatch"
            :class="[`accent-${name}`, { 'is-active': accent === name }]"
            type="button"
            role="radio"
            :aria-checked="accent === name"
            :aria-label="ACCENT_LABELS[name]"
            :title="ACCENT_LABELS[name]"
            @click="setAccent(name)"
          >
            <span class="profile__swatch-dot"></span>
            <span class="profile__swatch-name">{{ ACCENT_LABELS[name] }}</span>
          </button>
        </div>
      </section>

      <!-- 账户：待定 -->
      <section class="profile__section">
        <h2 class="profile__section-title">账户</h2>
        <div class="profile__placeholder">
          <AppIcon name="nav-profile" :size="24" decorative />
          <p class="profile__placeholder-text">
            账户系统尚未启用。启用后可跨设备同步偏好与工具数据。
          </p>
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
  ACCENT_LABELS,
  type ThemeMode,
} from '@/shared/composables/useTheme'

/**
 * 个人中心
 *
 * 当前承载外观设置。账户系统接入后（见 docs/05-account-system.md），
 * 本页将扩展出登录状态、资料编辑与同步管理。
 */

const { mode, accent, setMode, setAccent } = useTheme()

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: IconName }[] = [
  { value: 'light', label: '浅色', icon: 'theme-light' },
  { value: 'dark',  label: '深色', icon: 'theme-dark' },
  { value: 'auto',  label: '跟随系统', icon: 'settings' },
]
</script>

<style scoped>
@import './profile.css';
</style>
