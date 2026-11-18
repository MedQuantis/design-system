<script setup lang="ts">
import { DialogTitle } from 'reka-ui';
import { formatCount } from '../utils/format';

// A decision window: a modal whose header reads in three lines (the title with the queue's
// navigation, the screen's controls and close; a subtitle; the badges facing the stepper, which drops under them short
// of room), and whose body holds two panes stacking below lg: the context and tabs (the screen's controls at their right) on the left,
// a banner and numbered sections on the right (an untitled one its content alone), a foldable section a native details showing its
// digest once folded; the footer last. Side by side, the window holds the screen's height and
// each pane scrolls in its own frame, the left one below its context and tab bar, so neither
// leaves view as the screen's content grows. It fills the screen on a phone, so the footer
// stays at the screen's foot. The screen fills every slot and owns every request.
export interface MqWindowTab {
  key: string;
  label: string;
}
export interface MqWindowSection {
  key: string;
  /** Without one, the section is its slot alone, unnumbered: its content names itself. */
  title?: string;
  /** A native details, open by default, showing the slot digest-<key> once folded. */
  foldable?: boolean;
}
/** The item's place in the list behind the window, counted from 0. */
export interface MqQueuePosition {
  index: number;
  total: number;
}

// loading: the item is not read yet. position null: the item is not in the list behind the
// window; undefined: the list is not read yet.
const props = withDefaults(
  defineProps<{
    title: string;
    loading?: boolean;
    tabs?: readonly MqWindowTab[];
    sections?: readonly MqWindowSection[];
    hasPrevious?: boolean;
    hasNext?: boolean;
    position?: MqQueuePosition | null;
    queueLabel: string;
    previousLabel: string;
    nextLabel: string;
    closeLabel: string;
    notListedLabel: string;
    sectionsLabel: string;
    /** « n / total », shown; and its spoken form, for screen readers. */
    positionLabel: (index: string, total: string) => string;
    positionSpokenLabel: (index: string, total: string) => string;
  }>(),
  {
    loading: false,
    tabs: () => [],
    sections: () => [],
    hasPrevious: false,
    hasNext: false,
    position: undefined,
  },
);
const open = defineModel<boolean>('open', { default: false });
const tab = defineModel<string>('tab', { default: '' });
const emit = defineEmits<{ previous: []; next: []; close: [] }>();
const slots = useSlots();

const place = computed(() =>
  props.position
    ? ([formatCount(props.position.index + 1), formatCount(props.position.total)] as const)
    : null,
);
const tabItems = computed(() => props.tabs.map((t) => ({ label: t.label, value: t.key })));
// The sections whose slot the screen fills, numbered in that order.
// A function, not a computed: slots are not reactive, so the render reads them afresh.
const shownSections = (): MqWindowSection[] =>
  props.sections.filter((section) => slots[`section-${section.key}`] !== undefined);
// A titled section's number, counting the titled sections shown before it.
const numberOf = (index: number): number =>
  shownSections()
    .slice(0, index + 1)
    .filter((section) => section.title).length;
const folded = ref(new Set<string>());
function onToggle(key: string, event: Event): void {
  const isOpen = (event.target as HTMLDetailsElement).open;
  if (isOpen !== folded.value.has(key)) return;
  const next = new Set(folded.value);
  if (isOpen) next.delete(key);
  else next.add(key);
  folded.value = next;
}

// The phone layout is chosen in the browser: below 768px the window fills the screen.
const PHONE = '(max-width: 767.98px)';
const phone = ref(false);
let media: MediaQueryList | undefined;
const onMedia = (event: MediaQueryListEvent): void => {
  phone.value = event.matches;
};
onMounted(() => {
  if (typeof window.matchMedia !== 'function') return;
  media = window.matchMedia(PHONE);
  phone.value = media.matches;
  media.addEventListener('change', onMedia);
});
onBeforeUnmount(() => media?.removeEventListener('change', onMedia));

function close(): void {
  open.value = false;
  emit('close');
}
</script>

<template>
  <UModal
    v-model:open="open"
    :close="false"
    :fullscreen="phone"
    :ui="{
      content: 'sm:max-w-[82.5rem] lg:h-[calc(100dvh-4rem)]',
      header: 'shrink-0',
      body: 'lg:min-h-0 lg:overflow-hidden',
    }"
    :title="title"
  >
    <template #header>
      <!-- Three lines: the title and the navigation; the subtitle; the badges facing the
           stepper, which drops under them short of room and stacks on a phone. -->
      <div
        class="flex w-full min-w-0 flex-col gap-2"
        data-testid="review-window"
        :data-fullscreen="phone ? 'true' : 'false'"
      >
        <div class="flex items-start justify-between gap-4" data-testid="header-title">
          <!-- The visible title names the window for screen readers; the header slot replaces
               Nuxt UI's own title, and the title prop keeps it from adding a hidden one. While
               loading, the title prop is read out beside the skeleton. -->
          <DialogTitle class="min-w-0">
            <template v-if="loading">
              <USkeleton class="h-8 w-72" />
              <span class="sr-only">{{ title }}</span>
            </template>
            <slot v-else name="title" />
          </DialogTitle>
          <div class="flex shrink-0 items-center gap-1">
            <!-- The screen's own header controls (screen 3's expert switch), before the queue. -->
            <div
              v-if="slots.controls"
              class="me-2 flex items-center gap-2"
              data-testid="header-controls"
            >
              <slot name="controls" />
            </div>
            <!-- Spaced so a focus ring (3px at a 2px offset) stays clear of the count. -->
            <div role="group" :aria-label="queueLabel" class="flex items-center gap-2">
              <UButton
                icon="i-lucide-chevron-left"
                color="neutral"
                variant="ghost"
                square
                :aria-label="previousLabel"
                :disabled="!hasPrevious"
                @click="emit('previous')"
              />
              <span
                v-if="position !== undefined"
                class="text-text-tertiary font-mono text-xs whitespace-nowrap"
                data-testid="queue-position"
              >
                <template v-if="place">
                  <span aria-hidden="true">{{ positionLabel(...place) }}</span>
                  <span class="sr-only">{{ positionSpokenLabel(...place) }}</span>
                </template>
                <template v-else>{{ notListedLabel }}</template>
              </span>
              <UButton
                icon="i-lucide-chevron-right"
                color="neutral"
                variant="ghost"
                square
                :aria-label="nextLabel"
                :disabled="!hasNext"
                @click="emit('next')"
              />
            </div>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              square
              :aria-label="closeLabel"
              @click="close"
            />
          </div>
        </div>
        <template v-if="!loading">
          <div data-testid="header-subtitle">
            <slot name="subtitle" />
          </div>
          <!-- From xl up three columns: the badges, the stepper centred on the header, an empty
               column as wide as the badges'; below, the stepper drops under the badges. -->
          <div
            class="flex flex-col gap-3 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-end xl:gap-x-6"
            data-testid="header-badges"
          >
            <span class="flex min-w-0 flex-wrap items-center gap-2 xl:self-center">
              <slot name="badges" />
            </span>
            <!-- The middle step's disc falls on the header's midpoint, over the panes' divider:
                 the 40rem stepper of three equal slots shifted by half its width less its
                 middle disc's centre (40rem / 3 + 0.6875rem). -->
            <div
              class="min-w-0 xl:col-start-2 xl:inline-flex xl:translate-x-[calc(20rem-40rem/3-0.6875rem)] xl:justify-self-center"
              data-testid="header-steps"
            >
              <slot name="stepper" />
            </div>
          </div>
        </template>
      </div>
    </template>
    <template #body>
      <div v-if="loading" class="flex flex-col gap-3" data-testid="modal-loading">
        <USkeleton class="h-24 w-full" />
        <USkeleton class="h-64 w-full" />
      </div>
      <!-- A light rule parts the panes: in the window's middle side by side, under the left pane
           once they stack. Side by side the body stays still and each pane scrolls in its frame;
           a frame reaches 0.375rem past its content so a focus ring at its edge is not cut. -->
      <div
        v-else
        class="grid gap-6 lg:h-full lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:gap-0"
        data-testid="window-panes"
      >
        <div
          class="flex min-w-0 flex-col gap-4 border-b border-(--mq-border-light) pb-6 lg:min-h-0 lg:border-e lg:border-b-0 lg:pe-6 lg:pb-0"
        >
          <div class="flex shrink-0 flex-col gap-4" data-testid="pane-context">
            <slot name="context" />
          </div>
          <!-- The screen's controls sit over the tab bar's right end, beside the tab list rather
               than in it, since a tab list holds tabs only. -->
          <div v-if="tabItems.length" class="relative shrink-0">
            <UTabs v-model="tab" :items="tabItems" :content="false" variant="link" />
            <div
              v-if="slots['tabs-trailing']"
              class="absolute inset-y-0 end-0 flex items-center ps-2"
              data-testid="tabs-trailing"
            >
              <slot name="tabs-trailing" />
            </div>
          </div>
          <div
            class="min-w-0 lg:-m-1.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:p-1.5"
            data-testid="pane-tab-frame"
          >
            <slot :name="`tab-${tab}`" />
          </div>
        </div>
        <div
          class="flex min-w-0 flex-col gap-4 lg:-my-1.5 lg:-me-1.5 lg:min-h-0 lg:overflow-y-auto lg:py-1.5 lg:ps-6 lg:pe-1.5"
          data-testid="pane-side"
        >
          <slot name="banner" />
          <ol class="flex flex-col gap-4" :aria-label="sectionsLabel">
            <li
              v-for="(section, index) in shownSections()"
              :key="section.key"
              class="flex min-w-0 flex-col gap-2"
            >
              <div v-if="!section.title" class="flex min-w-0 flex-col gap-3">
                <slot :name="`section-${section.key}`" />
              </div>
              <details
                v-else-if="section.foldable"
                :open="!folded.has(section.key)"
                class="flex min-w-0 flex-col gap-2"
                @toggle="onToggle(section.key, $event)"
              >
                <summary
                  class="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden"
                >
                  <h3 class="font-display flex items-center gap-2 font-medium">
                    <span
                      aria-hidden="true"
                      class="bg-(--mq-accent) text-on-accent inline-grid size-5.5 shrink-0 place-items-center rounded-full text-xs"
                      >{{ numberOf(index) }}</span
                    >
                    {{ section.title }}
                  </h3>
                  <span
                    v-if="folded.has(section.key)"
                    class="text-text-secondary min-w-0 font-mono text-xs"
                    data-testid="section-digest"
                  >
                    <slot :name="`digest-${section.key}`" />
                  </span>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="text-text-tertiary ms-auto size-4 shrink-0 transition-transform"
                    :class="folded.has(section.key) ? '-rotate-90' : ''"
                    aria-hidden="true"
                  />
                </summary>
                <div class="flex min-w-0 flex-col gap-3 pt-2 sm:ps-7.5">
                  <slot :name="`section-${section.key}`" />
                </div>
              </details>
              <template v-else>
                <h3 class="font-display flex items-center gap-2 font-medium">
                  <span
                    aria-hidden="true"
                    class="bg-(--mq-accent) text-on-accent inline-grid size-5.5 shrink-0 place-items-center rounded-full text-xs"
                    >{{ numberOf(index) }}</span
                  >
                  {{ section.title }}
                </h3>
                <div class="flex min-w-0 flex-col gap-3 sm:ps-7.5">
                  <slot :name="`section-${section.key}`" />
                </div>
              </template>
            </li>
          </ol>
        </div>
      </div>
    </template>
    <template v-if="!loading && slots.footer" #footer>
      <div class="flex w-full justify-end">
        <slot name="footer" />
      </div>
    </template>
  </UModal>
</template>
