<script setup lang="ts">
import { LEGEND_ITEMS } from '../../../tests/nuxt/fixtures/neutral';

const TONES = LEGEND_ITEMS.flatMap((item) => ('tag' in item ? [item] : []));
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqEventTag</h1>
    <PlaygroundState title="Each tone" note="What happened, the tag's tone saying how it ended.">
      <div class="flex w-40 flex-col gap-2">
        <MqEventTag v-for="item in TONES" :key="item.key" :label="item.label" :tone="item.tag" />
      </div>
    </PlaygroundState>
    <PlaygroundState title="As swatches" note="The empty marks a caption keys.">
      <div class="flex gap-3">
        <MqEventTag v-for="item in TONES" :key="item.key" :tone="item.tag" swatch />
      </div>
    </PlaygroundState>
  </div>
</template>
