<script setup lang="ts">
// What happened, as a small outlined tag whose tone says how it ended: accepted and applied
// (navy outline), rejected (dashed), a person's decision (pale navy fill), a publication
// (light fill), or a step (plain). As a swatch it is the empty mark a caption keys.
export type MqEventTone = 'step' | 'accepted' | 'rejected' | 'person' | 'publication';

withDefaults(defineProps<{ label?: string; tone?: MqEventTone; swatch?: boolean }>(), {
  label: '',
  tone: 'step',
  swatch: false,
});

const TONE: Record<MqEventTone, string> = {
  step: 'border-(--mq-border) bg-(--mq-surface) text-text-secondary',
  accepted: 'border-(--mq-accent) bg-(--mq-surface) text-(--mq-accent)',
  rejected: 'border-dashed border-(--mq-border-strong) bg-(--mq-surface) text-text',
  person: 'border-(--mq-accent-pale) bg-(--mq-accent-pale) text-(--mq-accent)',
  publication: 'border-(--mq-surface-alt) bg-(--mq-surface-alt) text-text-secondary',
};
</script>

<template>
  <span
    class="block truncate rounded-sm border"
    :class="[TONE[tone], swatch ? 'h-3.5 w-6.5 shrink-0' : 'h-5 px-2 text-xs leading-4.5']"
    :data-tone="tone"
    :title="swatch ? undefined : label"
    :aria-hidden="swatch ? 'true' : undefined"
    data-testid="event-tag"
    >{{ swatch ? '' : label }}</span
  >
</template>
