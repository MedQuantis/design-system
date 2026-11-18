<script setup lang="ts">
import { FILTER_GROUPS, FILTER_OPTIONS } from '../../../tests/nuxt/fixtures/neutral';

const LONG = [
  { value: 'long', label: 'An option whose label runs far longer than the field', count: 3 },
  ...FILTER_OPTIONS,
];
const flat = ref<string | null>(null);
const grouped = ref<string | null>('warm');
const counted = ref<string | null>(null);
const long = ref<string | null>(null);
const placed = ref<string | null>('warm');
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqFilterSelect</h1>
    <PlaygroundState
      title="Flat options"
      note="« All » is null; counts muted after each label; an option at zero muted whole."
    >
      <MqFilterSelect v-model="flat" label="Colour" all-label="All" :options="FILTER_OPTIONS" />
      <p class="text-text-tertiary mt-2 font-mono text-xs">value: {{ flat ?? 'null' }}</p>
    </PlaygroundState>
    <PlaygroundState
      title="Options in groups"
      note="« All » in a group of its own, then each group under a rule."
    >
      <MqFilterSelect v-model="grouped" label="Colour" all-label="All" :options="FILTER_GROUPS" />
      <p class="text-text-tertiary mt-2 font-mono text-xs">value: {{ grouped ?? 'null' }}</p>
    </PlaygroundState>
    <PlaygroundState title="A count on « all »">
      <MqFilterSelect
        v-model="counted"
        label="Colour"
        all-label="All"
        :all-count="1246"
        :options="FILTER_OPTIONS"
      />
    </PlaygroundState>
    <PlaygroundState
      title="« All » placed by the caller, a count on the closed field"
      note="allIndex puts « all » among the first group; triggerCount shows the chosen option's count."
    >
      <MqFilterSelect
        v-model="placed"
        label="Colour"
        all-label="All"
        :all-count="1246"
        :all-index="2"
        :options="FILTER_GROUPS"
        trigger-count
      />
    </PlaygroundState>
    <PlaygroundState title="A long label in a narrow column" width="16rem">
      <MqFilterSelect v-model="long" label="Colour" all-label="All" :options="LONG" />
    </PlaygroundState>
  </div>
</template>
