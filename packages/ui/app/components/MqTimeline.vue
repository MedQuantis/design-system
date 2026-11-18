<script setup lang="ts">
import { formatDate, formatDateTime } from '../utils/format';
import MqEventTag, { type MqEventTone } from './MqEventTag.vue';
import MqLegend, { type MqLegendItem } from './MqLegend.vue';
import MqLiveDot from './MqLiveDot.vue';
import MqTimelineDot, { type MqDotKind } from './MqTimelineDot.vue';

// A decision log as a timeline, one line per entry in the order given (newest first), in
// columns from the md breakpoint up: the date, the category's icon, what happened as a status
// tag, who, the result at the right, the live dot, the chevron. No column is cut: who and the
// result take the width they need, and the fixed-size tag names its whole label in its tooltip.
// The dot before the line says who wrote it by its shape and a trace joins the dots. An entry's
// technical line sits under it, aligned on the status tag. A line unfolds under itself, aligned
// on the status tag, from the slot details; its chevron, at the line's end, turns down. Filter
// pills with icons and counts above with « unfold all » at their end, a legend below, « load
// more » last. Who wrote a line is its icon and name, or its icon alone.
export interface MqTimelineEntry {
  key: string;
  /** An ISO timestamp, or a day (`YYYY-MM-DD`) read with no time. */
  at: string;
  /** What happened, in the status tag. */
  title: string;
  tone?: MqEventTone;
  /** Who wrote the entry, by the dot's shape. */
  dot?: MqDotKind;
  who?: string | null;
  /** An icon before who: a person, a robot. */
  whoIcon?: string;
  /** The icon alone, the name in its tooltip and for screen readers (a robot). */
  whoIconOnly?: boolean;
  /** The key of the entry's category, drawn by its icon. */
  category?: string;
  /** The result at the right; null says noneLabel, absent says nothing. */
  result?: string | null;
  /** The whole result, in the tooltip, when the column shortens it. */
  resultTitle?: string;
  /** The entry live today; the live dot marks it. */
  highlighted?: boolean;
  /** The key of the filter the entry falls under. */
  filter?: string;
  /** A technical line under the entry (the setup that produced it, its code). */
  tech?: string | null;
}
export interface MqTimelineFilter {
  key: string;
  label: string;
  icon?: string;
}
export interface MqTimelineCategory {
  key: string;
  label: string;
  icon: string;
  /** Written outside the product (a publisher): its icon in the decoration hue. */
  outside?: boolean;
}

// entries undefined: the log is still loading. hasMore: older entries exist than those given.
const props = withDefaults(
  defineProps<{
    entries?: readonly MqTimelineEntry[];
    filters?: readonly MqTimelineFilter[];
    categories?: readonly MqTimelineCategory[];
    allLabel: string;
    loadMoreLabel: string;
    noneLabel?: string;
    liveLabel?: string;
    legend?: readonly MqLegendItem[];
    legendLabel?: string;
    /** « Unfold all » and « fold all »; the toggle is drawn when both are given. */
    expandAllLabel?: string;
    collapseAllLabel?: string;
    hasMore?: boolean;
    loadingMore?: boolean;
  }>(),
  {
    entries: undefined,
    filters: () => [],
    categories: () => [],
    noneLabel: '',
    liveLabel: '',
    legend: () => [],
    legendLabel: '',
    expandAllLabel: undefined,
    collapseAllLabel: undefined,
    hasMore: false,
    loadingMore: false,
  },
);
const emit = defineEmits<{ more: [] }>();
defineSlots<{ details?: (props: { entry: MqTimelineEntry }) => unknown }>();

const filter = ref<string | null>(null);
const expanded = ref(new Set<string>());

const counts = computed(() =>
  props.filters
    .map((f) => ({ ...f, count: (props.entries ?? []).filter((e) => e.filter === f.key).length }))
    .filter((f) => f.count > 0),
);
const shown = computed(() =>
  (props.entries ?? []).filter((e) => filter.value === null || e.filter === filter.value),
);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const dateOf = (at: string): string => (DAY.test(at) ? formatDate(at) : formatDateTime(at));
const categoryOf = (entry: MqTimelineEntry): MqTimelineCategory | undefined =>
  props.categories.find((c) => c.key === entry.category);

// Every line shown unfolded: the toggle folds them all; else it unfolds them all.
const allExpanded = computed(
  () => shown.value.length > 0 && shown.value.every((e) => expanded.value.has(e.key)),
);
function toggleAll(): void {
  expanded.value = allExpanded.value ? new Set() : new Set(shown.value.map((e) => e.key));
}

function toggle(key: string): void {
  const next = new Set(expanded.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expanded.value = next;
}

const PILL =
  'inline-flex h-6.5 items-center gap-1.5 rounded-full border px-2.5 text-xs whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--mq-focus-ring-color)';
const pillClass = (pressed: boolean): string[] => [
  PILL,
  pressed
    ? 'border-(--mq-accent) bg-(--mq-accent) text-on-accent'
    : 'border-(--mq-border) bg-(--mq-surface) text-text',
];
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-if="entries === undefined" data-testid="history-loading" class="flex flex-col gap-2">
      <USkeleton v-for="n in 3" :key="n" class="h-6 w-full" />
    </div>
    <template v-else>
      <div class="flex flex-wrap items-center gap-1.5">
        <div class="flex flex-wrap items-center gap-1.5" data-testid="source-filter">
          <button
            type="button"
            :class="pillClass(filter === null)"
            :aria-pressed="filter === null ? 'true' : 'false'"
            @click="filter = null"
          >
            {{ allLabel }}
            <span
              class="font-mono tabular-nums"
              :class="filter === null ? 'text-(--mq-accent-pale)' : 'text-text-tertiary'"
              >{{ entries.length }}</span
            >
          </button>
          <button
            v-for="f in counts"
            :key="f.key"
            type="button"
            :class="pillClass(filter === f.key)"
            :aria-pressed="filter === f.key ? 'true' : 'false'"
            @click="filter = f.key"
          >
            <UIcon
              v-if="f.icon"
              :name="f.icon"
              class="size-3.25"
              :class="filter === f.key ? 'text-on-accent' : 'text-(--mq-accent)'"
            />
            {{ f.label }}
            <span
              class="font-mono tabular-nums"
              :class="filter === f.key ? 'text-(--mq-accent-pale)' : 'text-text-tertiary'"
              >{{ f.count }}</span
            >
          </button>
        </div>
        <button
          v-if="expandAllLabel && collapseAllLabel"
          type="button"
          class="text-text-secondary ms-auto inline-flex h-6.5 items-center gap-1.5 rounded-sm px-1.5 text-xs hover:bg-(--mq-surface-alt) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--mq-focus-ring-color)"
          data-testid="toggle-all"
          @click="toggleAll"
        >
          <UIcon
            :name="allExpanded ? 'i-lucide-chevrons-down-up' : 'i-lucide-chevrons-up-down'"
            class="size-3.5"
          />
          {{ allExpanded ? collapseAllLabel : expandAllLabel }}
        </button>
      </div>
      <ol class="flex flex-col gap-2">
        <li
          v-for="(entry, index) in shown"
          :key="entry.key"
          class="relative grid grid-cols-[0.875rem_minmax(0,1fr)] gap-x-3"
          :data-key="entry.key"
          data-testid="history-row"
          :data-served="entry.highlighted ? 'true' : 'false'"
        >
          <!-- The trace from this dot to the next, across the gap between the lines. -->
          <span
            v-if="index < shown.length - 1"
            class="absolute start-1.5 top-4 -bottom-4 w-px bg-(--mq-border)"
            aria-hidden="true"
            data-testid="timeline-trace"
          />
          <MqTimelineDot :kind="entry.dot ?? 'outline'" class="relative z-1 mt-1.75" />
          <UCollapsible :open="expanded.has(entry.key)" class="min-w-0">
            <button
              type="button"
              class="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-sm px-1.5 py-1 text-left text-sm hover:bg-(--mq-surface-alt) md:grid md:grid-cols-[7.75rem_1.125rem_9.375rem_minmax(max-content,1fr)_max-content_1rem_0.8125rem] md:flex-nowrap md:whitespace-nowrap"
              :class="expanded.has(entry.key) ? 'bg-(--mq-surface-alt)' : ''"
              :aria-expanded="expanded.has(entry.key) ? 'true' : 'false'"
              data-testid="timeline-line"
              @click="toggle(entry.key)"
            >
              <span class="text-text-secondary font-mono text-xs" data-cell="date">{{
                dateOf(entry.at)
              }}</span>
              <span
                class="inline-flex items-center"
                :title="categoryOf(entry)?.label"
                data-cell="category"
              >
                <template v-if="categoryOf(entry)">
                  <UIcon
                    :name="categoryOf(entry)!.icon"
                    class="size-3.5"
                    :class="
                      categoryOf(entry)!.outside ? 'text-(--mq-decoration)' : 'text-(--mq-accent)'
                    "
                  />
                  <span class="sr-only">{{ categoryOf(entry)!.label }}</span>
                </template>
              </span>
              <span class="min-w-0" data-cell="event">
                <MqEventTag :label="entry.title" :tone="entry.tone ?? 'step'" />
              </span>
              <span
                class="text-text-secondary inline-flex min-w-0 items-center gap-1.5"
                :title="entry.whoIconOnly ? (entry.who ?? undefined) : undefined"
                data-cell="who"
              >
                <UIcon
                  v-if="entry.whoIcon"
                  :name="entry.whoIcon"
                  class="size-3.5 shrink-0 text-(--mq-accent)"
                />
                <span v-if="entry.whoIconOnly" class="sr-only">{{ entry.who ?? '' }}</span>
                <span v-else class="whitespace-nowrap" data-testid="who-name">{{
                  entry.who ?? ''
                }}</span>
              </span>
              <span
                class="text-right whitespace-nowrap"
                :class="
                  entry.result === null
                    ? 'font-body text-text-tertiary text-xs italic'
                    : 'font-mono text-xs'
                "
                :title="entry.resultTitle"
                data-cell="result"
                >{{ entry.result === null ? noneLabel : (entry.result ?? '') }}</span
              >
              <span class="inline-flex justify-center" data-cell="live">
                <MqLiveDot v-if="entry.highlighted" :label="liveLabel" />
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                class="size-3.25 text-(--mq-decoration) transition-transform"
                :class="expanded.has(entry.key) ? '' : '-rotate-90'"
                data-cell="chevron"
              />
            </button>
            <div
              v-if="entry.tech"
              class="text-text-tertiary px-1.5 pb-1 font-mono text-xs break-all md:ps-[calc(7.75rem+1.125rem+1.875rem)]"
              data-testid="timeline-tech"
            >
              {{ entry.tech }}
            </div>
            <template #content>
              <div
                class="text-text-tertiary flex flex-col gap-0.5 px-1.5 pt-0.5 pb-2 text-xs md:ps-[calc(7.75rem+1.125rem+1.875rem)]"
                data-testid="timeline-details"
              >
                <slot name="details" :entry="entry" />
              </div>
            </template>
          </UCollapsible>
        </li>
      </ol>
      <MqLegend v-if="legend.length" :items="legend" :label="legendLabel" ruled class="mt-1" />
      <div v-if="hasMore" class="flex justify-center">
        <UButton
          :label="loadMoreLabel"
          color="neutral"
          variant="outline"
          size="sm"
          :loading="loadingMore"
          @click="emit('more')"
        />
      </div>
    </template>
  </div>
</template>
