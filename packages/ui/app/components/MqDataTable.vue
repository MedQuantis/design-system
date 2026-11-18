<script setup lang="ts" generic="T extends { key: string }">
import { computed, ref, watch } from 'vue';

export interface MqColumn<R = never> {
  key: string;
  label: string;
  /** A share of the table, e.g. '24%': the widths together fill it. */
  width: string;
  /** The sort this column asks for; not sortable when absent. */
  sort?: string;
  /** A shorter name for a phone card's label track. */
  phoneLabel?: string;
  /** A row whose field has no value: its line is left out of the phone card. */
  emptyOnPhone?: (row: R) => boolean;
}
type Order = 'asc' | 'desc';
type AriaSort = 'ascending' | 'descending' | 'none';

// A semantic table rather than UTable: the server sorts the whole list, so the table
// keeps its order; each row carries its key, its selection and its tint for the keyboard
// and the page.
const props = withDefaults(
  defineProps<{
    columns: MqColumn<T>[];
    rows: T[];
    /** Read after the sorted header's label, for screen readers: « sorted ascending ». */
    sortLabels: Record<Exclude<AriaSort, 'none'>, string>;
    /** Names the phone's sort bar. */
    sortByLabel: string;
    emptyTitle: string;
    emptyDescription?: string;
    loadMoreLabel: string;
    /** « n of N shown », worded by the page. */
    shownLabel?: string;
    loading?: boolean;
    /** A filter is on: the empty state adds its description. */
    filtered?: boolean;
    sort?: string;
    order?: Order;
    /** The rows under the filters, loaded or not; more than `rows` offers the next page. */
    total?: number | null;
    loadingMore?: boolean;
    /** Tints a row (a review asked of the viewer, say). */
    rowEmphasis?: (row: T) => boolean;
    /** Below this width the table scrolls sideways inside its frame, never the page. */
    minWidth?: string;
    frameTestId?: string;
    /** A first column of boxes selects rows (`v-model:selected`, the rows' keys). */
    selectable?: boolean;
    /** Leaves a row out of the selection; every row counts when absent. */
    isSelectable?: (row: T) => boolean;
    /** Why a row cannot be selected, shown on its disabled box. */
    disabledReason?: (row: T) => string;
    selectRowLabel?: (row: T) => string;
    selectAllLabel?: string;
  }>(),
  {
    emptyDescription: undefined,
    shownLabel: '',
    loading: false,
    filtered: false,
    sort: undefined,
    order: 'asc',
    total: null,
    loadingMore: false,
    rowEmphasis: undefined,
    minWidth: undefined,
    frameTestId: undefined,
    selectable: false,
    isSelectable: undefined,
    disabledReason: undefined,
    selectRowLabel: undefined,
    selectAllLabel: undefined,
  },
);
const emit = defineEmits<{
  open: [key: string];
  more: [];
  sort: [value: { sort: string; order: Order }];
}>();
defineSlots<
  { [cell: `cell-${string}`]: (props: { row: T; index: number }) => unknown } & {
    legend?: () => unknown;
  }
>();

const picked = defineModel<string[]>('selected', { default: () => [] });

// The keyboard's row, apart from the rows picked by their boxes.
const selected = ref(0);
watch(
  () => props.rows.length,
  (length) => (selected.value = Math.min(selected.value, Math.max(0, length - 1))),
);

const canPick = (row: T): boolean => props.isSelectable?.(row) ?? true;
const pickable = computed(() => props.rows.filter(canPick).map((row) => row.key));
const allState = computed<boolean | 'indeterminate'>(() => {
  const chosen = pickable.value.filter((key) => picked.value.includes(key)).length;
  if (chosen === 0) return false;
  return chosen === pickable.value.length ? true : 'indeterminate';
});
function togglePick(row: T): void {
  if (!canPick(row)) return;
  picked.value = picked.value.includes(row.key)
    ? picked.value.filter((key) => key !== row.key)
    : [...picked.value, row.key];
}
function toggleAll(): void {
  const shown = new Set(pickable.value);
  picked.value =
    allState.value === true
      ? picked.value.filter((key) => !shown.has(key))
      : [...picked.value.filter((key) => !shown.has(key)), ...pickable.value];
}

function ariaSort(key: string): AriaSort {
  if (props.sort !== key) return 'none';
  return props.order === 'asc' ? 'ascending' : 'descending';
}
function toggleSort(key: string): void {
  const order = props.sort === key && props.order === 'asc' ? 'desc' : 'asc';
  emit('sort', { sort: key, order });
}
function onKeydown(event: KeyboardEvent): void {
  if (props.rows.length === 0) return;
  if (event.key === 'j' || event.key === 'ArrowDown') {
    selected.value = Math.min(selected.value + 1, props.rows.length - 1);
  } else if (event.key === 'k' || event.key === 'ArrowUp') {
    selected.value = Math.max(selected.value - 1, 0);
  } else if (event.key === 'Enter') {
    const row = props.rows[selected.value];
    if (row) emit('open', row.key);
  } else if (event.key === ' ' && props.selectable) {
    const row = props.rows[selected.value];
    if (row) togglePick(row);
  } else return;
  event.preventDefault();
}
const emphasised = (row: T): boolean => props.rowEmphasis?.(row) ?? false;
const sortable = computed(() =>
  props.columns.filter((column): column is MqColumn<T> & { sort: string } => !!column.sort),
);
// A phone card: the first cell heads it; each other cell is a field under its column's
// name, in a fixed track of capitals, a fine line between fields.
const FIELD =
  'max-md:relative max-md:ms-27 max-md:px-0 max-md:py-1.5 max-md:before:absolute max-md:before:-left-27 max-md:before:w-27 max-md:before:pe-2 max-md:before:truncate max-md:before:font-medium max-md:before:uppercase max-md:before:tracking-wide max-md:before:text-text-tertiary max-md:before:text-(length:--mq-font-size-table-header) max-md:before:content-[attr(data-label)]';
// The label sits on its value's first line; below the first field a line runs across the
// label and the value alike.
const FIRST_FIELD = 'max-md:before:top-2';
const RULED =
  'max-md:border-t max-md:border-(--mq-border-light) max-md:before:-top-px max-md:before:border-t max-md:before:border-(--mq-border-light) max-md:before:pt-2';
function cellClass(column: MqColumn<T>, position: number, row: T): string[] {
  if (position === 0) return ['max-md:px-0 max-md:pt-0 max-md:pb-2'];
  return [
    FIELD,
    position > 1 ? RULED : FIRST_FIELD,
    column.emptyOnPhone?.(row) ? 'max-md:hidden' : '',
  ];
}
const sortLabel = (key: string): string => {
  const state = ariaSort(key);
  return state === 'none' ? '' : `, ${props.sortLabels[state]}`;
};
const SORT_ICON: Record<AriaSort, string> = {
  ascending: 'i-lucide-arrow-up',
  descending: 'i-lucide-arrow-down',
  none: 'i-lucide-chevrons-up-down',
};
</script>

<template>
  <!-- The frame scrolls inside the page, its column headers held at its top, so the
       filters above and the legend below stay in view. -->
  <div class="flex min-h-0 flex-col gap-3">
    <!-- On a phone the column headers give way to cards, so « select all » and the sort
         move into a bar above them. -->
    <div
      v-if="sortable.length > 0 || selectable"
      class="flex flex-wrap items-center gap-1.5 md:hidden"
      role="group"
      :aria-label="sortByLabel"
      data-testid="phone-sort"
    >
      <UCheckbox
        v-if="selectable"
        class="me-2"
        :model-value="allState"
        :aria-label="selectAllLabel"
        :disabled="pickable.length === 0"
        @update:model-value="toggleAll"
      />
      <span v-if="sortable.length > 0" class="text-text-secondary text-xs" aria-hidden="true">{{
        sortByLabel
      }}</span>
      <UButton
        v-for="column in sortable"
        :key="column.key"
        size="xs"
        color="neutral"
        :variant="sort === column.sort ? 'soft' : 'ghost'"
        :aria-pressed="sort === column.sort ? 'true' : 'false'"
        :trailing-icon="SORT_ICON[ariaSort(column.sort)]"
        :label="column.label"
        @click="toggleSort(column.sort)"
      />
    </div>
    <div
      class="min-h-0 overflow-auto rounded-md border border-(--mq-border-light) bg-(--mq-surface) shadow-(--mq-shadow-small) focus-visible:outline-2 max-md:border-0 max-md:bg-transparent max-md:shadow-none"
      tabindex="0"
      :data-testid="frameTestId"
      @keydown="onKeydown"
    >
      <table
        class="w-full table-fixed border-collapse text-left text-(length:--mq-font-size-table-text) max-md:block md:min-w-(--table-min-width)"
        :style="minWidth ? { '--table-min-width': minWidth } : undefined"
      >
        <colgroup class="max-md:hidden">
          <col v-if="selectable" class="w-11" />
          <col v-for="column in columns" :key="column.key" :style="{ width: column.width }" />
        </colgroup>
        <thead class="bg-(--mq-accent) text-on-accent sticky top-0 z-10 max-md:hidden">
          <tr>
            <!-- On the navy header the box stays white with a navy mark, so it shows. -->
            <th v-if="selectable" class="px-3 py-2.75 align-middle">
              <UCheckbox
                :model-value="allState"
                :aria-label="selectAllLabel"
                :disabled="pickable.length === 0"
                :ui="{
                  base: 'bg-(--mq-surface) ring-(--mq-on-accent)',
                  indicator: 'bg-(--mq-surface) text-(--mq-accent)',
                }"
                @update:model-value="toggleAll"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              :aria-sort="column.sort ? ariaSort(column.sort) : undefined"
              class="px-3 py-2.75 align-middle font-medium text-(length:--mq-font-size-label) wrap-break-word"
            >
              <button
                v-if="column.sort"
                type="button"
                class="group inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mq-on-accent)"
                :class="sort === column.sort ? 'underline underline-offset-4' : ''"
                @click="toggleSort(column.sort)"
              >
                {{ column.label
                }}<span v-if="sort === column.sort" class="sr-only">{{
                  sortLabel(column.sort)
                }}</span
                ><UIcon
                  :name="SORT_ICON[ariaSort(column.sort)]"
                  aria-hidden="true"
                  data-testid="sort-mark"
                  :data-sort="ariaSort(column.sort)"
                  class="size-3.5 shrink-0"
                  :class="sort === column.sort ? '' : 'opacity-50 group-hover:opacity-100'"
                />
              </button>
              <template v-else>{{ column.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody v-if="loading" class="max-md:block">
          <tr v-for="n in 5" :key="n" class="max-md:block" data-testid="row-skeleton">
            <td v-if="selectable" class="p-3" />
            <td v-for="column in columns" :key="column.key" class="p-3 max-md:block max-md:py-1">
              <USkeleton class="h-4 w-full" />
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="rows.length > 0" class="max-md:flex max-md:flex-col max-md:gap-2">
          <tr
            v-for="(row, index) in rows"
            :key="row.key"
            :data-key="row.key"
            :data-mine="emphasised(row) ? 'true' : 'false'"
            :aria-selected="index === selected ? 'true' : 'false'"
            class="cursor-pointer border-t border-(--mq-border-light) first:border-t-0 hover:bg-(--mq-surface-alt) max-md:relative max-md:block max-md:rounded-md max-md:border max-md:p-3 max-md:shadow-(--mq-shadow-small) max-md:first:border-t"
            :class="[
              selectable ? 'max-md:pe-10' : '',
              emphasised(row) ? 'bg-(--mq-accent-pale-2)' : 'max-md:bg-(--mq-surface)',
              index === selected ? 'outline outline-(--mq-accent) -outline-offset-1' : '',
            ]"
            @click="
              selected = index;
              emit('open', row.key);
            "
          >
            <!-- The box toggles its row without opening it. -->
            <td
              v-if="selectable"
              class="p-3 align-middle max-md:absolute max-md:top-3 max-md:right-3 max-md:p-0"
              :title="canPick(row) ? undefined : disabledReason?.(row)"
              @click.stop
            >
              <UCheckbox
                :model-value="picked.includes(row.key)"
                :aria-label="selectRowLabel?.(row)"
                :disabled="!canPick(row)"
                :ui="canPick(row) ? undefined : { base: 'bg-(--mq-surface-alt)' }"
                @update:model-value="togglePick(row)"
              />
            </td>
            <!-- On a phone a row is a card: the first cell heads it, each other cell is a
                 field under its column's name, drawn from data-label so the name stays out
                 of the cell's text. -->
            <td
              v-for="(column, position) in columns"
              :key="column.key"
              class="p-3 align-middle wrap-break-word max-md:block"
              :class="cellClass(column, position, row)"
              :data-label="position > 0 ? (column.phoneLabel ?? column.label) : undefined"
            >
              <div class="min-w-0">
                <slot :name="`cell-${column.key}`" :row="row" :index="index" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="!loading && total !== null && total > rows.length"
        class="flex items-center justify-center gap-3 py-2 text-sm"
        data-testid="partial-list"
      >
        <span class="text-text-secondary tabular-nums">{{ shownLabel }}</span>
        <UButton
          :label="loadMoreLabel"
          color="neutral"
          variant="outline"
          size="sm"
          :loading="loadingMore"
          @click="emit('more')"
        />
      </div>
      <UEmpty
        v-if="!loading && rows.length === 0"
        icon="i-lucide-inbox"
        :title="emptyTitle"
        :description="filtered ? emptyDescription : undefined"
        variant="naked"
      />
    </div>
    <slot v-if="!loading && rows.length > 0" name="legend" />
  </div>
</template>
