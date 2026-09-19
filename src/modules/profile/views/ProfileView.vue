<template>
  <div class="me">
    <div class="page-content">
      <!-- ============ 身份卡 ============ -->
      <section class="me__card">
        <button
          class="me__avatar"
          type="button"
          :aria-label="t('profile.avatar.hint')"
          :aria-expanded="picking"
          @click="picking = !picking"
        >
          <PlantIcon :name="avatarPlant" :size="72" decorative />
        </button>

        <div class="me__ident">
          <form v-if="editing" class="me__nameform" @submit.prevent="saveName">
            <input
              ref="nameInput"
              v-model="draft"
              class="me__nameinput"
              type="text"
              maxlength="16"
              :placeholder="t('profile.name.placeholder')"
              :aria-label="t('profile.name.edit')"
              @blur="saveName"
            />
          </form>
          <button
            v-else
            class="me__name"
            type="button"
            :aria-label="t('profile.name.edit')"
            @click="startEdit"
          >
            {{ displayName }}
          </button>

          <p class="me__stat">{{ t('profile.garden.hint', { count: visitedCount, total: total }) }}</p>
        </div>

        <router-link class="me__settings" :to="{ name: 'settings' }" :aria-label="t('profile.settings')">
          <AppIcon name="settings" :size="18" decorative />
        </router-link>
      </section>

      <!-- 形象选择：点开头像才出现，不占常驻空间 -->
      <section v-if="picking" class="me__picker">
        <ul class="me__plants">
          <li v-for="p in AVATAR_PLANTS" :key="p">
            <button
              class="me__plant"
              :class="{ 'is-active': p === avatarPlant }"
              type="button"
              :aria-label="p"
              :aria-pressed="p === avatarPlant"
              @click="chooseAvatar(p)"
            >
              <PlantIcon :name="p" :size="40" decorative />
            </button>
          </li>
        </ul>
      </section>

      <!-- ============ 我的花园 ============ -->
      <section class="me__section">
        <h2 class="me__heading">{{ t('profile.garden') }}</h2>
        <ul class="me__garden">
          <li v-for="tool in tools" :key="tool.id">
            <router-link
              class="me__plot"
              :class="{ 'is-grown': isVisited(tool.id) }"
              :to="tool.route.path"
              :aria-label="lt(tool.title)"
            >
              <PlantIcon :name="tool.plant" :size="46" decorative />
            </router-link>
          </li>
        </ul>
      </section>

      <!-- ============ 最近使用 ============ -->
      <section class="me__section">
        <h2 class="me__heading">{{ t('profile.recent') }}</h2>

        <ul v-if="recent.length" class="me__recent">
          <li v-for="tool in recent" :key="tool.id">
            <router-link class="me__row" :to="tool.route.path">
              <PlantIcon :name="tool.plant" :size="30" decorative />
              <span class="me__rowname">{{ lt(tool.title) }}</span>
              <AppIcon name="arrow-right" :size="15" class="me__chevron" decorative />
            </router-link>
          </li>
        </ul>

        <p v-else class="me__empty">{{ t('profile.recent.empty') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { AppIcon } from '@/shared/icons'
import { PlantIcon, type PlantName } from '@/shared/mascot'
import { t, lt } from '@/shared/i18n'
import { useProfile, AVATAR_PLANTS } from '@/shared/composables/useProfile'
import { getTools } from '@/modules/tools'

/**
 * 个人页
 *
 * 设计取向是「有趣、个性化」，而非设置面板：
 * 形象可选、花园会随使用生长、显示最近用过什么。
 * 杂项设置移到 /settings。
 *
 * 花园机制：用过的工具，其植物以原色显示；未用过的降为暗淡。
 * 刻意不显示进度条、不发催促，只是一个「你走过的痕迹」。
 */

const { nickname, avatarPlant, visitedCount, recentToolIds, setNickname, setAvatar, isVisited } =
  useProfile()

const tools = getTools()
const total = tools.length

const recent = computed(() =>
  recentToolIds.value
    .map(id => tools.find(x => x.id === id))
    .filter((x): x is (typeof tools)[number] => x !== undefined),
)

/** 未起名时回退到 i18n 的默认问候语 */
const displayName = computed(() => nickname.value ?? t('app.greeting'))

/* ============================================
   改名
   ============================================ */
const editing = ref(false)
const draft = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

async function startEdit(): Promise<void> {
  draft.value = displayName.value
  editing.value = true
  await nextTick()
  nameInput.value?.select()
}

function saveName(): void {
  if (!editing.value) return
  setNickname(draft.value)
  editing.value = false
}

/* ============================================
   形象
   ============================================ */
const picking = ref(false)

function chooseAvatar(plant: PlantName): void {
  setAvatar(plant)
  picking.value = false
}
</script>

<style scoped>
@import './profile.css';
</style>
