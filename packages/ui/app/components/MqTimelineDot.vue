<script setup lang="ts">
// A timeline's dot: its shape says who wrote the entry. Outlined (a robot), filled navy (a
// person), dashed (a helper's proposal), square (a publisher outside the product).
export type MqDotKind = 'outline' | 'filled' | 'dashed' | 'square';

defineProps<{ kind: MqDotKind }>();

const KIND: Record<MqDotKind, string> = {
  outline: 'rounded-full border-(--mq-border-strong) bg-(--mq-surface)',
  filled: 'rounded-full border-(--mq-accent) bg-(--mq-accent)',
  dashed: 'rounded-full border-dashed border-(--mq-border-strong) bg-(--mq-surface)',
  square: 'rounded-xs border-(--mq-decoration) bg-(--mq-surface)',
};
</script>

<template>
  <span
    class="inline-block size-3 shrink-0 border-2"
    :class="KIND[kind]"
    :data-kind="kind"
    aria-hidden="true"
    data-testid="timeline-dot"
  />
</template>
