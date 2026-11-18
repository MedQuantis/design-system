<script setup lang="ts">
export type MqPillTone = 'neutral' | 'warning' | 'primary';

withDefaults(
  defineProps<{
    label: string;
    tone: MqPillTone;
    /** A line under the tag (who, since when); none when absent. */
    detail?: string | null;
    /** A halo: the state concerns the person looking. */
    emphasis?: boolean;
    /** The tag fills its box, its label centred, as in a legend's mark box. */
    fill?: boolean;
  }>(),
  { detail: null, emphasis: false, fill: false },
);

const TONE: Record<MqPillTone, string> = {
  neutral: 'text-text-secondary border-(--mq-border-strong) bg-(--mq-surface)',
  warning: 'text-(--mq-warning) border-(--mq-warning-fill) bg-(--mq-warning-tint)',
  primary: 'text-(--mq-accent) border-(--mq-accent) bg-(--mq-accent-pale)',
};
</script>

<template>
  <div class="flex flex-col gap-1" :class="fill ? 'items-stretch' : 'items-start'">
    <!-- An outlined tag in its state's tone, haloed when the state concerns the viewer. -->
    <span
      class="inline-flex items-center rounded-sm border px-2 text-xs leading-tight font-medium whitespace-nowrap"
      :class="[
        TONE[tone],
        emphasis ? 'ring-2 ring-(--mq-accent-pale)' : '',
        fill ? 'h-5 justify-center' : 'py-0.5',
      ]"
      :data-colour="tone"
      :data-mine="emphasis ? 'true' : undefined"
      data-testid="pill"
      >{{ label }}</span
    >
    <span v-if="detail" class="text-text-tertiary text-xs">{{ detail }}</span>
  </div>
</template>
