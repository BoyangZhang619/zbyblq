<template>
  <div class="bg-view">
    <router-view />
    <BottomNav v-if="bottomNav.includes(currentRoute.name as string)" />
  </div>
</template>

<script setup lang="ts">
import BottomNav from '@/modules/shell/components/BottomNav.vue'
import router from '@/app/router';
import { toRaw } from 'vue';

const currentRoute = toRaw(router.currentRoute);
const bottomNav = ['home', 'sort', 'profile'];

</script>

<style>
@import '@/design/global.css';
</style>