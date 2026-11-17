<script setup lang="ts">
// One state of a component: its name, what it shows, and the slot that draws it.
defineProps<{ title: string; note?: string; width?: string }>();
</script>

<template>
  <section class="flex flex-col gap-2">
    <h2 class="font-display text-base font-medium">{{ title }}</h2>
    <p v-if="note" class="text-text-secondary text-xs">{{ note }}</p>
    <div
      class="rounded-md border border-(--mq-border-light) bg-(--mq-surface) p-4"
      :style="width ? { maxWidth: width } : undefined"
    >
      <slot />
    </div>
  </section>
</template>
