<template>
  <div class="bg-view">
    <router-view />
    <BottomNav v-if="showBottomNav" />
  </div>
</template>

<script setup lang="ts">
import BottomNav from '@/components/base/main/bottomNav.vue'
import router from './router';
import { toRaw } from 'vue';

const currentRoute = toRaw(router.currentRoute);
const bottomNav = ['home', 'sort', 'profile'];
const showBottomNav = bottomNav.includes((currentRoute as any).name as string);

</script>

<style>
@import '@/css/global.css';
</style>