<script setup lang="ts">
import MqEventTag, { type MqEventTone } from './MqEventTag.vue';
import MqLiveDot from './MqLiveDot.vue';
import MqTimelineDot, { type MqDotKind } from './MqTimelineDot.vue';

// The one caption of the generic components, under a timeline or a table:
// a list of marks, each with what it means, in the order given, the groups parted by a thin
// rule. A mark is a tag tone, a dot shape or the live dot; any other mark (a status pill, a
// badge, a code chip) comes from the slot mark-<key>, in a box of one size (5.5rem) that it
// fills. Ruled above when asked, as under a timeline.
export interface MqLegendItem {
  key: string;
  label?: string;
  tag?: MqEventTone;
  dot?: MqDotKind;
  live?: boolean;
  /** The slot's mark is a swatch, in the swatches' one box (26 × 14 px), as a text's highlights. */
  swatch?: boolean;
  separator?: boolean;
}

withDefaults(defineProps<{ items: readonly MqLegendItem[]; label: string; ruled?: boolean }>(), {
  ruled: false,
});
defineSlots<Record<`mark-${string}`, (props: { item: MqLegendItem }) => unknown>>();
</script>

<template>
  <ul
    role="list"
    :aria-label="label"
    class="text-text-secondary flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
    :class="ruled ? 'border-t border-(--mq-border-light) pt-2' : ''"
  >
    <template v-for="item in items" :key="item.key">
      <li
        v-if="item.separator"
        role="presentation"
        aria-hidden="true"
        class="h-3.5 w-px bg-(--mq-border)"
        data-testid="legend-separator"
      />
      <li
        v-else
        role="listitem"
        class="inline-flex items-center gap-1.5 whitespace-nowrap"
        data-testid="legend-item"
      >
        <MqEventTag v-if="item.tag" :tone="item.tag" swatch />
        <MqTimelineDot v-else-if="item.dot" :kind="item.dot" />
        <MqLiveDot v-else-if="item.live" :label="item.label ?? ''" decorative />
        <!-- A mark from a slot sits in one box of one size, as the swatches share one; the
             mark fills it, its label centred. -->
        <span
          v-else-if="item.swatch"
          class="grid h-3.5 w-6.5 shrink-0"
          aria-hidden="true"
          data-testid="legend-swatch"
        >
          <slot :name="`mark-${item.key}`" :item="item" />
        </span>
        <span v-else class="grid w-22 shrink-0 *:justify-center" data-testid="legend-mark">
          <slot :name="`mark-${item.key}`" :item="item" />
        </span>
        {{ item.label }}
      </li>
    </template>
  </ul>
</template>
