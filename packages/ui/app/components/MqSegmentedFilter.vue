<script setup lang="ts">
import { formatCount } from '../utils/format';

export interface MqSegment {
  value: string;
  label: string;
  count: number;
}

withDefaults(
  defineProps<{
    /** The band's accessible name; not shown. */
    label: string;
    allLabel: string;
    allCount?: number | null;
    /** Each group follows a thin rule. */
    groups: MqSegment[][];
  }>(),
  { allCount: null },
);
// null is « all », the absent filter.
const model = defineModel<string | null>({ default: null });

const segmentClass = (chosen: boolean, empty: boolean): string =>
  [
    'h-6.5 gap-1.5 rounded-sm px-2.5 font-normal',
    chosen
      ? 'bg-(--mq-surface) text-(--mq-accent) font-medium shadow-sm hover:bg-(--mq-surface)'
      : empty
        ? 'text-text-tertiary'
        : 'text-text-secondary',
  ].join(' ');
</script>

<template>
  <!-- One light band, the chosen segment raised in white. On a narrow screen the band
       wraps by whole group: a group's rule and segments stay on one line together. -->
  <div
    class="flex min-w-0 flex-wrap items-center gap-0.5 rounded-md border border-(--mq-border) bg-(--mq-surface-alt) p-0.75 whitespace-nowrap"
    role="group"
    :aria-label="label"
  >
    <UButton
      size="sm"
      color="neutral"
      variant="ghost"
      :class="segmentClass(model === null, false)"
      :aria-pressed="model === null ? 'true' : 'false'"
      @click="model = null"
    >
      {{ allLabel }}
      <span
        v-if="allCount !== null"
        class="font-mono text-xs tabular-nums"
        :class="model === null ? 'text-(--mq-accent)' : 'text-text-tertiary'"
        >{{ formatCount(allCount) }}</span
      >
    </UButton>
    <span
      v-for="(group, index) in groups"
      :key="index"
      class="inline-flex flex-nowrap items-center gap-0.5"
      data-testid="segment-group"
    >
      <span
        class="mx-0.75 h-4 w-px bg-(--mq-border-strong)"
        data-testid="segment-rule"
        aria-hidden="true"
      />
      <UButton
        v-for="segment in group"
        :key="segment.value"
        size="sm"
        color="neutral"
        variant="ghost"
        :class="segmentClass(model === segment.value, segment.count === 0)"
        :aria-pressed="model === segment.value ? 'true' : 'false'"
        :data-empty="segment.count === 0 ? 'true' : 'false'"
        @click="model = segment.value"
      >
        {{ segment.label }}
        <span
          class="font-mono text-xs tabular-nums"
          :class="model === segment.value ? 'text-(--mq-accent)' : 'text-text-tertiary'"
          data-testid="segment-count"
          >{{ formatCount(segment.count) }}</span
        >
      </UButton>
    </span>
  </div>
</template>
