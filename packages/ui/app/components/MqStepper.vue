<script setup lang="ts">
// A read-only row of steps: where an item stands in a process of a few steps. A list of
// steps rather than the interactive UStepper, since nothing here is clicked.
export type MqStepState = 'done' | 'current' | 'optional' | 'required' | 'skipped' | 'pending';
export interface MqStep {
  key: string;
  title: string;
  /** A line under the title (who, what is awaited); none when absent. */
  detail?: string;
  state: MqStepState;
}

const props = defineProps<{
  steps: readonly MqStep[];
  /** The list's accessible name. */
  label: string;
}>();

// One equal slot per step, so the discs stay in place from item to item whatever their details
// say. A step before a line gives its title a fixed room (5.5rem, wrapping past it) and its
// detail a longer one, up to 0.5rem before the next disc, under the line. The short line sits
// midway between the end of the title's room (1.375rem disc, 0.5rem gap, 5.5rem) and the next
// disc (the slot's end), a current disc's 3px halo counted as part of it: it keeps its place
// whatever the text says. The last step's label takes its whole slot.
const TITLE_ROOM_END = '7.375rem';
const columns = computed(() => `repeat(${props.steps.length}, minmax(0, 1fr))`);
const before = (index: number): boolean => index < props.steps.length - 1;
const halo = (step: MqStep | undefined): string => (step?.state === 'current' ? '3px' : '0px');
const lineLeft = (index: number): string =>
  `calc((100% + ${TITLE_ROOM_END} - ${halo(props.steps[index + 1])}) / 2 - 1rem)`;

// The current step a filled navy disc with a pale halo and a navy title; a done step a pale
// disc with its check; the others outlined (dashed while optional or skipped) with muted titles.
const CIRCLE: Record<MqStepState, string> = {
  done: 'bg-(--mq-accent-pale) text-(--mq-accent) border-(--mq-accent)',
  current: 'bg-(--mq-accent) text-on-accent border-(--mq-accent) ring-3 ring-(--mq-accent-pale)',
  optional: 'border-dashed border-(--mq-border-strong) bg-(--mq-surface) text-text-tertiary',
  required: 'border-(--mq-border-strong) bg-(--mq-surface) text-text-tertiary',
  skipped: 'border-dashed border-(--mq-border) bg-(--mq-surface) text-text-tertiary',
  pending: 'border-(--mq-border-strong) bg-(--mq-surface) text-text-tertiary',
};
const TITLE: Record<MqStepState, string> = {
  done: 'text-text-secondary font-medium',
  current: 'text-(--mq-accent) font-medium',
  optional: 'text-text-tertiary font-medium',
  required: 'text-text-tertiary font-medium',
  skipped: 'text-text-tertiary font-medium',
  pending: 'text-text-tertiary font-medium',
};
const DETAIL: Record<MqStepState, string> = {
  done: 'text-text-tertiary',
  current: 'text-text',
  optional: 'text-text-tertiary',
  required: 'text-(--mq-warning) font-medium',
  skipped: 'text-text-tertiary',
  pending: 'text-text-tertiary',
};
</script>

<template>
  <!-- Fixed step slots, so the circles and lines stay in place from item to item; a detail
       wraps rather than being cut off. On a phone the steps stack and the lines are hidden. -->
  <ol
    class="grid grid-cols-1 items-start gap-y-2 sm:w-160 sm:grid-cols-(--stepper-columns)"
    :style="{ '--stepper-columns': columns }"
    :aria-label="label"
  >
    <li
      v-for="(step, index) in steps"
      :key="step.key"
      class="relative flex min-w-0 items-start gap-2"
      :data-step="step.key"
      :data-state="step.state"
      :aria-current="step.state === 'current' ? 'step' : undefined"
    >
      <span
        class="inline-grid size-5.5 shrink-0 place-items-center rounded-full border text-xs font-medium"
        :class="CIRCLE[step.state]"
        data-testid="step-marker"
      >
        <UIcon v-if="step.state === 'done'" name="i-lucide-check" class="size-3.5" />
        <template v-else>{{ index + 1 }}</template>
      </span>
      <span class="flex min-w-0 flex-1 flex-col leading-tight">
        <span
          class="font-display text-sm"
          :class="[TITLE[step.state], before(index) ? 'max-w-22 wrap-break-word' : '']"
          data-testid="step-title"
          >{{ step.title }}</span
        >
        <span
          v-if="step.detail"
          class="text-xs"
          :class="[DETAIL[step.state], before(index) ? 'max-w-[calc(100%-0.5rem)]' : '']"
          data-testid="step-detail"
          >{{ step.detail }}</span
        >
      </span>
      <!-- Level with the discs' middle: half a disc, less half the line. -->
      <span
        v-if="before(index)"
        aria-hidden="true"
        class="absolute top-[calc(0.6875rem-0.5px)] hidden h-px w-8 sm:block"
        :class="step.state === 'done' ? 'bg-(--mq-accent)' : 'bg-(--mq-border)'"
        :style="{ left: lineLeft(index) }"
        data-testid="step-line"
      />
    </li>
  </ol>
</template>
