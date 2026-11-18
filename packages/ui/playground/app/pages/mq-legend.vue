<script setup lang="ts">
import { LEGEND_ITEMS, PILLS } from '../../../tests/nuxt/fixtures/neutral';

// A table's caption: its status pills and a badge, each in the legend's one box.
const TABLE_LEGEND = [
  ...PILLS.map((pill, index) => ({ key: `pill-${index}`, label: pill.detail })),
  { key: 'badge', label: 'a reference number' },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqLegend</h1>
    <PlaygroundState
      title="A timeline's caption"
      note="Each tag tone, a thin rule, then each dot shape and the live dot; ruled above."
      width="40rem"
    >
      <MqLegend :items="LEGEND_ITEMS" label="Key" ruled />
    </PlaygroundState>
    <PlaygroundState
      title="A table's caption"
      note="Any other mark from its slot mark-<key>: status pills and a badge, each filling the same box. Not ruled."
      width="40rem"
    >
      <MqLegend :items="TABLE_LEGEND" label="Key">
        <template v-for="(pill, index) in PILLS" :key="index" #[`mark-pill-${index}`]>
          <MqStatusPill :label="pill.label" :tone="pill.tone" fill />
        </template>
        <template #mark-badge>
          <UBadge label="20431" color="neutral" variant="outline" size="sm" class="font-mono" />
        </template>
      </MqLegend>
    </PlaygroundState>
  </div>
</template>
