<script setup lang="ts">
import { computed } from 'vue';
import type { NavigationMenuItem } from '@nuxt/ui';
import { formatCount } from '../utils/format';

export interface MqNavigationItem {
  label: string;
  icon: string;
  to: string;
  /** Shown as a badge beside the label when above zero. */
  count?: number | null;
  /** The badge's accessible name. */
  countLabel?: string;
  /** The screen's open items, drawn on its icon on the folded rail; given to the current one. */
  openCount?: number | null;
  /** How the open count is read out, added to the link's name. */
  openCountLabel?: string;
}
export interface MqNavigationGroup {
  /** The group's heading, hidden on the folded rail. */
  label?: string;
  items: MqNavigationItem[];
}

const props = defineProps<{ groups: MqNavigationGroup[]; collapsed?: boolean }>();

// Only the folded rail draws the open count: the unfolded sidebar shows the person's own count.
function railCount(item: MqNavigationItem): number | null {
  const count = item.openCount ?? 0;
  return props.collapsed && count > 0 ? count : null;
}

// The drawn figure stays within the icon's width; the link's name says the whole count.
const RAIL_CAP = 99;
const railFigure = (count: number): string =>
  count > RAIL_CAP ? `${RAIL_CAP}+` : formatCount(count);

// One array per group, which the menu separates; a heading is a label item.
const items = computed<NavigationMenuItem[][]>(() =>
  props.groups.map((group) => [
    ...(group.label ? [{ label: group.label, type: 'label' as const }] : []),
    ...group.items.map((item) => {
      const openCount = railCount(item);
      return {
        label: item.label,
        icon: item.icon,
        to: item.to,
        // The drawn figure is hidden from assistive technology, so the name says it.
        'aria-label':
          openCount !== null && item.openCountLabel
            ? `${item.label}, ${item.openCountLabel}`
            : item.label,
        count: item.count ?? 0,
        countLabel: item.countLabel,
        openCount,
      };
    }),
  ]),
);
</script>

<template>
  <UNavigationMenu :items="items" orientation="vertical" :collapsed="collapsed" tooltip>
    <template #item-leading="{ item, active, ui }">
      <UIcon
        v-if="item.icon"
        :name="item.icon"
        data-slot="linkLeadingIcon"
        :class="ui.linkLeadingIcon({ active, disabled: !!item.disabled })"
      />
      <span
        v-if="item.openCount"
        class="pointer-events-none absolute top-px right-0 min-w-3.5 rounded-xs bg-(--mq-accent) px-0.75 text-center font-mono text-(length:--mq-font-size-eyebrow) leading-3.5 text-(--mq-on-accent)"
        aria-hidden="true"
        data-testid="nav-open-count"
        >{{ railFigure(item.openCount) }}</span
      >
    </template>
    <template #item-trailing="{ item }">
      <UBadge
        v-if="(item.count ?? 0) > 0"
        :label="String(item.count)"
        color="primary"
        variant="solid"
        size="sm"
        data-testid="nav-count"
        :aria-label="item.countLabel"
      />
    </template>
  </UNavigationMenu>
</template>
