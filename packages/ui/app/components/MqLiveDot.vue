<script setup lang="ts">
// « Live »: a green dot with a pale halo, what is in service today. Its name is its label,
// for screen readers and in its tooltip; in a caption, where the label is written beside it,
// it is decorative.
withDefaults(defineProps<{ label: string; decorative?: boolean }>(), { decorative: false });
</script>

<template>
  <span
    class="inline-block size-2.5 shrink-0 rounded-full bg-(--mq-success) ring-3 ring-(--mq-success)/20"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : label"
    :aria-hidden="decorative ? 'true' : undefined"
    :title="decorative ? undefined : label"
    data-testid="live-dot"
  />
</template>
