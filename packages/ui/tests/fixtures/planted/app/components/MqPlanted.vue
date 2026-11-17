<!-- A planted offence for every template and component guard of tests/unit/guards.test.ts. Never mounted. -->
<script setup lang="ts">
import type { PlantedItem } from '#planted-types';
const items = await useFetch<PlantedItem[]>('/api/planted');
const go = () => navigateTo('/planted');
</script>

<template>
  <div class="bg-[#ffffff] text-blue-500">
    <span title="Planted title">Planted words</span>
    <input placeholder="Planted placeholder" :aria-label="'Planted label'" />
    <span>{{ 'Planted literal' }}</span>
  </div>
</template>
