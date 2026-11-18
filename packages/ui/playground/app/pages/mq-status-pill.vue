<script setup lang="ts">
import { PILLS } from '../../../tests/nuxt/fixtures/neutral';
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqStatusPill</h1>
    <PlaygroundState title="Each tone, with a detail" note="Neutral, warning and primary.">
      <div class="flex flex-wrap gap-6">
        <MqStatusPill v-for="pill in PILLS" :key="pill.tone" v-bind="pill" />
      </div>
    </PlaygroundState>
    <PlaygroundState title="Emphasised" note="A halo: the state concerns the person looking.">
      <MqStatusPill
        label="In review"
        detail="asked of you since 03.11.2026"
        tone="primary"
        emphasis
      />
    </PlaygroundState>
    <PlaygroundState title="Without a detail" note="As a legend draws the marks.">
      <div class="flex flex-wrap gap-6">
        <MqStatusPill
          v-for="pill in PILLS"
          :key="pill.tone"
          :label="pill.label"
          :tone="pill.tone"
        />
      </div>
    </PlaygroundState>
  </div>
</template>
