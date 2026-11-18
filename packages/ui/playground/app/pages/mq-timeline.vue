<script setup lang="ts">
import {
  LEGEND_ITEMS,
  TIMELINE_CATEGORIES,
  TIMELINE_ENTRIES,
  TIMELINE_FILTERS,
} from '../../../tests/nuxt/fixtures/neutral';

const base = {
  filters: TIMELINE_FILTERS,
  categories: TIMELINE_CATEGORIES,
  allLabel: 'All',
  loadMoreLabel: 'Load more',
  noneLabel: 'none',
  liveLabel: 'Live today',
  legend: LEGEND_ITEMS,
  legendLabel: 'Key',
  expandAllLabel: 'Unfold all',
  collapseAllLabel: 'Fold all',
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqTimeline</h1>
    <PlaygroundState
      title="A log with filters, a legend and details"
      note="Newest first. Columns: date, category, what happened, who, result, live, chevron. Who: the robot alone (its name in the tooltip), a person by icon and name. Click a line: it unfolds under itself, aligned on the status tag; « Unfold all » at the filters' end."
      width="44rem"
    >
      <MqTimeline v-bind="base" :entries="TIMELINE_ENTRIES">
        <template #details="{ entry }">
          <span class="font-mono">REASON_{{ entry.key.toUpperCase() }}</span>
          <span>Note: a fictitious line of detail.</span>
          <span
            >Run <span class="font-mono">run-2026-11-0{{ entry.key.slice(1) }}</span></span
          >
        </template>
      </MqTimeline>
    </PlaygroundState>
    <PlaygroundState
      title="Older entries exist"
      note="« Load more » under the legend."
      width="44rem"
    >
      <MqTimeline v-bind="base" :entries="TIMELINE_ENTRIES" has-more />
    </PlaygroundState>
    <PlaygroundState title="Loading" note="Three skeleton lines." width="44rem">
      <MqTimeline v-bind="base" />
    </PlaygroundState>
  </div>
</template>
