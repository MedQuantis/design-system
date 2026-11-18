<script setup lang="ts">
import { computed } from 'vue';
import { formatCount } from '../utils/format';

export interface MqFilterOption {
  value: string;
  label: string;
  /** Shown muted after the label; an option at zero is muted whole. */
  count?: number | null;
}

// null is the absent filter, « all »; a menu item cannot hold null, hence ALL.
const ALL = 'ALL';
const props = withDefaults(
  defineProps<{
    /** Shown inside the field, beside the value, and naming it for screen readers. */
    label: string;
    allLabel: string;
    allCount?: number | null;
    /**
     * Where « all » stands: its index among a flat list's options, or among the first group's.
     * Absent, it leads the list, in a group of its own when the options are grouped.
     */
    allIndex?: number | null;
    /** A flat list, or groups the menu separates. */
    options: MqFilterOption[] | MqFilterOption[][];
    /** The chosen option's count, shown beside its value on the closed field. */
    triggerCount?: boolean;
  }>(),
  { allCount: null, allIndex: null, triggerCount: false },
);
const model = defineModel<string | null>({ default: null });

const insertAt = (options: MqFilterOption[], index: number, all: MqFilterOption) => [
  ...options.slice(0, index),
  all,
  ...options.slice(index),
];
const items = computed(() => {
  const all = { label: props.allLabel, value: ALL, count: props.allCount };
  if (!Array.isArray(props.options[0])) {
    const flat = props.options as MqFilterOption[];
    return props.allIndex === null ? [all, ...flat] : insertAt(flat, props.allIndex, all);
  }
  const [first = [], ...rest] = props.options as MqFilterOption[][];
  return props.allIndex === null
    ? [[all], first, ...rest]
    : [insertAt(first, props.allIndex, all), ...rest];
});
const selected = computed({
  get: () => model.value ?? ALL,
  set: (value: string) => (model.value = value === ALL ? null : value),
});
const chosen = computed(() =>
  (items.value.flat() as MqFilterOption[]).find((item) => item.value === selected.value),
);
</script>

<template>
  <!-- The label flows beside the value: the theme's leading slot is absolute, sized for an icon.
       Groups are divided by a rule; a flat list is one group. -->
  <USelectMenu
    v-model="selected"
    :items="items"
    value-key="value"
    :search-input="false"
    class="min-w-56"
    :aria-label="label"
    :ui="{
      base: 'ps-2.5',
      leading: 'static shrink-0 ps-0',
      viewport: 'divide-y divide-(--mq-border-light)',
      itemLabel: 'flex items-baseline gap-4',
      itemTrailing: 'w-5 shrink-0 justify-end',
    }"
  >
    <template #leading>
      <span class="text-text-secondary text-xs">{{ label }}</span>
    </template>
    <!-- The closed field reads its value, then the value's count muted in mono, as an option. -->
    <template v-if="triggerCount" #default="{ ui }">
      <span data-slot="value" :class="ui.value()">{{ chosen?.label }}</span>
      <span
        v-if="chosen?.count !== null && chosen?.count !== undefined"
        class="text-text-tertiary ms-2 shrink-0 font-mono text-xs tabular-nums"
        data-testid="trigger-count"
        >{{ formatCount(chosen.count) }}</span
      >
    </template>
    <template #item-label="{ item }">
      <!-- The count ends the option, right-aligned in mono, so a column of counts lines up. -->
      <span
        class="truncate"
        :data-empty="item.count === 0 ? 'true' : 'false'"
        :class="item.count === 0 ? 'text-text-tertiary' : ''"
        >{{ item.label }}</span
      >{{ ' '
      }}<span
        v-if="item.count !== null && item.count !== undefined"
        class="text-text-tertiary ms-auto font-mono text-xs tabular-nums"
        data-testid="option-count"
        >{{ formatCount(item.count) }}</span
      >
    </template>
  </USelectMenu>
</template>
