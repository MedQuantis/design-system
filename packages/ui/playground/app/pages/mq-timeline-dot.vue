<script setup lang="ts">
import { LEGEND_ITEMS } from '../../../tests/nuxt/fixtures/neutral';

const DOTS = LEGEND_ITEMS.flatMap((item) => ('dot' in item ? [item] : []));
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqTimelineDot</h1>
    <PlaygroundState
      title="Each shape"
      note="Who wrote the entry: a robot, a person, a helper, a publisher."
    >
      <div class="flex flex-col gap-2 text-sm">
        <span v-for="item in DOTS" :key="item.key" class="inline-flex items-center gap-2">
          <MqTimelineDot :kind="item.dot" /> {{ item.label }}
        </span>
      </div>
    </PlaygroundState>
  </div>
</template>
