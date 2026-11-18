<script setup lang="ts">
import { STEP_SHAPES } from '../../../tests/nuxt/fixtures/neutral';

const SHAPES = [
  {
    shape: 'optional',
    title: 'A second look optional',
    note: 'The first step current; the second dashed.',
  },
  {
    shape: 'required',
    title: 'A second look required',
    note: 'The second step’s detail in the warning tone.',
  },
  {
    shape: 'underWay',
    title: 'Under way',
    note: 'The first step done, its line navy; the second current.',
  },
  { shape: 'done', title: 'Every step done', note: 'No current step.' },
  {
    shape: 'skipped',
    title: 'A step skipped',
    note: 'The skipped step dashed on the light border.',
  },
] as const;
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqStepper</h1>
    <PlaygroundState v-for="s in SHAPES" :key="s.shape" :title="s.title" :note="s.note">
      <MqStepper :steps="STEP_SHAPES[s.shape]" label="Approval" />
    </PlaygroundState>
    <PlaygroundState
      title="Two steps"
      note="As many slots as steps; on a window below 640 px the steps stack."
    >
      <MqStepper :steps="STEP_SHAPES.optional.slice(0, 2)" label="Approval" />
    </PlaygroundState>
  </div>
</template>
