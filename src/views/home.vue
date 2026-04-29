<template>
  <div class="home-view">
    <div>{{ currentRoute.name }}</div>
    <!-- Home page content goes here -->
  </div>
</template>

<script setup lang="ts">
import { toRaw } from 'vue';
import router from '@/router';

const currentRoute = toRaw(router.currentRoute);
</script>

<style scoped>
</style>