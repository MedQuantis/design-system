<script setup lang="ts">
import { SEGMENT_GROUPS } from '../../../tests/nuxt/fixtures/neutral';

const plain = ref<string | null>(null);
const counted = ref<string | null>('waiting');
const narrow = ref<string | null>(null);
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqSegmentedFilter</h1>
    <PlaygroundState
      title="Groups after « all »"
      note="The chosen segment raised in white; an empty one muted; a rule before each group."
    >
      <MqSegmentedFilter v-model="plain" label="State" all-label="All" :groups="SEGMENT_GROUPS" />
      <p class="text-text-tertiary mt-2 font-mono text-xs">value: {{ plain ?? 'null' }}</p>
    </PlaygroundState>
    <PlaygroundState title="A count on « all »">
      <MqSegmentedFilter
        v-model="counted"
        label="State"
        all-label="All"
        :all-count="1241"
        :groups="SEGMENT_GROUPS"
      />
    </PlaygroundState>
    <PlaygroundState
      title="A narrow width"
      note="Whole groups wrap: a group never splits across lines."
      width="14rem"
    >
      <MqSegmentedFilter v-model="narrow" label="State" all-label="All" :groups="SEGMENT_GROUPS" />
    </PlaygroundState>
  </div>
</template>
