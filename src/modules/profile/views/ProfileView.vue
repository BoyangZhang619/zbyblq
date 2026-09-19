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
          <PlantIcon :name="avatarPlant" :size="68" decorative />
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

          <p class="me__whisper">{{ whisper }}</p>
        </div>

        <router-link class="me__settings" :to="{ name: 'settings' }" :aria-label="t('profile.settings')">
          <AppIcon name="settings" :size="18" decorative />
        </router-link>
      </section>

      <!-- 形象选择：点开头像才出现 -->
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
              <PlantIcon :name="p" :size="38" decorative />
            </button>
          </li>
        </ul>
      </section>

      <!-- ============ 花园 + 最近使用 ============ -->
      <div class="me__split">
        <section class="me__col me__col--garden">
          <h2 class="me__heading">
            {{ t('profile.garden') }}
            <span class="me__count">{{ t('profile.garden.hint', { count: visitedCount, total }) }}</span>
          </h2>

          <!--
            2 列 × 3 行，横向翻页查看其余。
            花园从「一次看全的图鉴」变成「翻着看的相册」——12 株挤进 6 格
            会看不清，翻页反而让每株都有足够的尺寸。
          -->
          <div
            ref="gardenViewport"
            class="me__pages"
            @scroll.passive="onGardenScroll"
          >
            <ul v-for="(page, pi) in gardenPages" :key="pi" class="me__garden">
              <li v-for="tool in page" :key="tool.id">
                <router-link
                  class="me__plot"
                  :class="{ 'is-grown': isVisited(tool.id) }"
                  :to="tool.route.path"
                  :aria-label="lt(tool.title)"
                >
                  <PlantIcon :name="tool.plant" :size="52" decorative />
                </router-link>
              </li>
            </ul>
          </div>

          <ul v-if="gardenPages.length > 1" class="me__dots" aria-hidden="true">
            <li
              v-for="(_, i) in gardenPages"
              :key="i"
              class="me__dot"
              :class="{ 'is-active': i === gardenPage }"
            />
          </ul>
        </section>

        <section class="me__col me__col--recent">
          <h2 class="me__heading">{{ t('profile.recent') }}</h2>

          <ul v-if="recent.length" class="me__recent">
            <li v-for="tool in recent" :key="tool.id">
              <router-link class="me__row" :to="tool.route.path">
                <PlantIcon :name="tool.plant" :size="26" decorative />
                <span class="me__rowname">{{ lt(tool.title) }}</span>
              </router-link>
            </li>
          </ul>

          <p v-else class="me__empty">{{ t('profile.recent.empty') }}</p>
        </section>
      </div>

      <!-- ============ 足迹 ============ -->
      <section class="me__section">
        <h2 class="me__heading">{{ t('profile.footprint') }}</h2>
        <AppHeatmap :data="daily" :weeks="9" />
      </section>

      <!-- ============ 行囊 ============ -->
      <section class="me__section">
        <h2 class="me__heading">{{ t('profile.satchel') }}</h2>

        <div class="me__satchel">
          <p class="me__satchel-hint">{{ t('profile.satchel.hint') }}</p>

          <div class="me__satchel-actions">
            <button class="me__btn me__btn--primary" type="button" @click="doExport">
              <AppIcon name="save" :size="16" decorative />
              {{ t('profile.satchel.export') }}
            </button>

            <button class="me__btn" type="button" @click="pickImport">
              <AppIcon name="upload" :size="16" decorative />
              {{ t('profile.satchel.import') }}
            </button>

            <input
              ref="fileInput"
              class="visually-hidden"
              type="file"
              accept="application/json,.json"
              tabindex="-1"
              @change="doImport"
            />
          </div>

          <p v-if="satchelMessage" class="me__satchel-msg" role="status">{{ satchelMessage }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { AppIcon } from '@/shared/icons'
import { PlantIcon, type PlantName } from '@/shared/mascot'
import { t, lt, useWhisper } from '@/shared/i18n'
import { useProfile, AVATAR_PLANTS } from '@/shared/composables/useProfile'
import { usePortableData, type ImportResult } from '@/shared/composables/usePortableData'
import AppHeatmap from '@/shared/ui/AppHeatmap.vue'
import { getTools, type ToolManifest } from '@/modules/tools'

/**
 * 个人页
 *
 * 三块内容，对应三个问题：
 *   我是谁        —— 身份卡
 *   我做过什么    —— 花园、足迹、最近使用
 *   东西怎么带走  —— 行囊
 *
 * 最后一块是「不上云」这个选择的必要补偿：没有账号就没有云端备份，
 * 本地数据一旦清掉就没了，所以进出口要放在显眼处。
 */

const { nickname, avatarPlant, daily, visitedCount, recentToolIds, setNickname, setAvatar, isVisited } =
  useProfile()
const { download, importJSON } = usePortableData()
const whisper = useWhisper()

const tools = getTools()
const total = tools.length

const displayName = computed(() => nickname.value ?? t('profile.defaultName'))

/* ============================================
   花园：2 列 × 3 行分页
   ============================================ */
const PER_PAGE = 6

const gardenPages = computed<ToolManifest[][]>(() => {
  const pages: ToolManifest[][] = []
  for (let i = 0; i < tools.length; i += PER_PAGE) {
    pages.push(tools.slice(i, i + PER_PAGE))
  }
  return pages
})

const gardenViewport = ref<HTMLElement | null>(null)
const gardenPage = ref(0)

function onGardenScroll(): void {
  const el = gardenViewport.value
  if (!el) return
  gardenPage.value = Math.round(el.scrollLeft / el.clientWidth)
}

/* ============================================
   最近使用
   ============================================ */
const recent = computed(() =>
  recentToolIds.value
    .map(id => tools.find(x => x.id === id))
    .filter((x): x is ToolManifest => x !== undefined),
)

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

/* ============================================
   行囊
   ============================================ */
const fileInput = ref<HTMLInputElement | null>(null)
const satchelMessage = ref('')

function doExport(): void {
  download()
  satchelMessage.value = ''
}

function pickImport(): void {
  fileInput.value?.click()
}

function doImport(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const result: ImportResult = importJSON(String(reader.result ?? ''))
    if (result.ok) {
      satchelMessage.value = t('profile.satchel.imported')
      // 各模块只在启动时读一次 localStorage，必须重载才能生效
      window.setTimeout(() => window.location.reload(), 600)
      return
    }
    const key = `profile.satchel.err.${result.reason ?? 'empty'}` as const
    satchelMessage.value = t(key)
  }
  reader.readAsText(file)
}

onMounted(() => {
  satchelMessage.value = ''
})
</script>

<style scoped>
@import './profile.css';
</style>
