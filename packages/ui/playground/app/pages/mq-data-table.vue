<script setup lang="ts">
import {
  PILLS,
  SORT_LABELS,
  TABLE_COLUMNS,
  TABLE_ROWS,
} from '../../../tests/nuxt/fixtures/neutral';

// The table's legend: each status pill with what it means, then a tinted row.
const TABLE_LEGEND = [
  ...PILLS.map((pill, index) => ({ key: `pill-${index}`, label: pill.detail, pill })),
  { key: 'tint', label: 'A tinted row concerns you.', pill: null },
];

type Row = (typeof TABLE_ROWS)[number];
const sort = ref('CASE');
const order = ref<'asc' | 'desc'>('asc');
const opened = ref<string | null>(null);
const sorted = computed(() => {
  const key = sort.value === 'OPENED' ? 'opened' : 'case';
  const rows = [...TABLE_ROWS].sort((a, b) => a[key].localeCompare(b[key]));
  return order.value === 'asc' ? rows : rows.reverse();
});
const flagged = (row: Row): boolean => row.flagged;
const picked = ref<string[]>(['case-1']);
const common = {
  columns: TABLE_COLUMNS,
  sortLabels: SORT_LABELS,
  sortByLabel: 'Sort by',
  emptyTitle: 'Nothing open',
  emptyDescription: 'Change a filter to see more.',
  loadMoreLabel: 'Load more',
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqDataTable</h1>
    <PlaygroundState
      title="Rows, sort and keyboard"
      note="Click a header to sort; click a row or use J, K and Enter in the frame; the flagged row is tinted."
    >
      <MqDataTable
        v-bind="common"
        :rows="sorted"
        :sort="sort"
        :order="order"
        :row-emphasis="flagged"
        @sort="
          (value) => {
            sort = value.sort;
            order = value.order;
          }
        "
        @open="(key) => (opened = key)"
      >
        <template #cell-case="{ row }">
          <span class="font-medium">{{ row.case }}</span>
        </template>
        <template #cell-owner="{ row }">{{ row.owner }}</template>
        <template #cell-opened="{ row }">
          <span class="font-mono">{{ row.opened }}</span>
        </template>
        <!-- The package has no legend component yet: a plain list stands in for the slot. -->
        <template #legend>
          <ul class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs" aria-label="Key">
            <li v-for="item in TABLE_LEGEND" :key="item.key" class="flex items-center gap-2">
              <MqStatusPill
                v-if="item.pill"
                :label="item.pill.label"
                :tone="item.pill.tone"
                fill
              />
              <span class="text-text-secondary">{{ item.label }}</span>
            </li>
          </ul>
        </template>
      </MqDataTable>
      <p class="text-text-tertiary mt-2 font-mono text-xs">opened: {{ opened ?? 'none' }}</p>
    </PlaygroundState>
    <PlaygroundState
      title="With a selection column"
      note="The flagged row cannot be picked (hover its box); the header box picks every pickable row shown; Space toggles the keyboard row."
    >
      <MqDataTable
        v-model:selected="picked"
        v-bind="common"
        :rows="TABLE_ROWS"
        selectable
        :is-selectable="(row) => !row.flagged"
        :disabled-reason="() => 'Flagged cases are handled one by one'"
        :select-row-label="(row) => `Select ${row.case}`"
        select-all-label="Select every case shown"
      >
        <template #cell-case="{ row }">{{ row.case }}</template>
        <template #cell-owner="{ row }">{{ row.owner }}</template>
        <template #cell-opened="{ row }">{{ row.opened }}</template>
      </MqDataTable>
      <p class="text-text-tertiary mt-2 font-mono text-xs">
        selected: {{ picked.join(', ') || 'none' }}
      </p>
    </PlaygroundState>
    <PlaygroundState title="A partial list" note="More rows under the filters than loaded.">
      <MqDataTable v-bind="common" :rows="TABLE_ROWS" :total="7" shown-label="3 of 7 shown">
        <template #cell-case="{ row }">{{ row.case }}</template>
        <template #cell-owner="{ row }">{{ row.owner }}</template>
        <template #cell-opened="{ row }">{{ row.opened }}</template>
      </MqDataTable>
    </PlaygroundState>
    <PlaygroundState title="Loading">
      <MqDataTable v-bind="common" :rows="[]" loading />
    </PlaygroundState>
    <PlaygroundState title="Empty under a filter">
      <MqDataTable v-bind="common" :rows="[]" filtered />
    </PlaygroundState>
    <PlaygroundState
      title="A minimum width in a narrow column"
      note="The table scrolls sideways inside its frame."
      width="20rem"
    >
      <MqDataTable v-bind="common" :rows="TABLE_ROWS" min-width="30rem">
        <template #cell-case="{ row }">{{ row.case }}</template>
        <template #cell-owner="{ row }">{{ row.owner }}</template>
        <template #cell-opened="{ row }">{{ row.opened }}</template>
      </MqDataTable>
    </PlaygroundState>
  </div>
</template>
