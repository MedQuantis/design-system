<script setup lang="ts">
import { LEGEND_ITEMS } from '../../../tests/nuxt/fixtures/neutral';

const LIVE = LEGEND_ITEMS.find((item) => 'live' in item)!;
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqLiveDot</h1>
    <PlaygroundState
      title="Live today"
      note="Hover it: its name is in the tooltip and for screen readers."
    >
      <MqLiveDot :label="LIVE.label" />
    </PlaygroundState>
  </div>
</template>
