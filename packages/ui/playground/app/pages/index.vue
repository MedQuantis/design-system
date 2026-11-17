<script setup lang="ts">
// Every colour and variant the theme sets, with fictitious text only.
const COLORS = ['primary', 'neutral', 'success', 'warning', 'error', 'info'] as const;
const VARIANTS = ['solid', 'outline', 'soft', 'subtle', 'ghost', 'link'] as const;
const open = ref(false);
const note = ref('');
</script>

<template>
  <div class="flex max-w-4xl flex-col gap-8">
    <header class="flex flex-col gap-2">
      <h1 class="font-display text-xl font-medium">Themed Nuxt UI components</h1>
      <p class="text-sm text-text-secondary">
        The layer's theme alone: Nuxt UI's components in the design system's colours, radii and
        fonts. Every text on this page is fictitious.
      </p>
    </header>

    <section class="flex flex-col gap-3" aria-labelledby="buttons">
      <h2 id="buttons" class="font-display text-lg font-medium">Buttons</h2>
      <div v-for="color in COLORS" :key="color" class="flex flex-wrap items-center gap-2">
        <UButton
          v-for="variant in VARIANTS"
          :key="variant"
          :color="color"
          :variant="variant"
          :label="`${color} ${variant}`"
        />
      </div>
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="alerts">
      <h2 id="alerts" class="font-display text-lg font-medium">Alerts</h2>
      <UAlert
        v-for="color in COLORS"
        :key="color"
        :color="color"
        variant="subtle"
        icon="i-lucide-info"
        :title="`A ${color} alert`"
        description="The sample text of a fictitious notice."
      />
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="badges">
      <h2 id="badges" class="font-display text-lg font-medium">Badges</h2>
      <div class="flex flex-wrap gap-2">
        <template v-for="color in COLORS" :key="color">
          <UBadge :color="color" variant="solid" :label="color" />
          <UBadge :color="color" variant="soft" :label="color" />
          <UBadge :color="color" variant="outline" :label="color" />
        </template>
      </div>
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="inputs">
      <h2 id="inputs" class="font-display text-lg font-medium">Input</h2>
      <UInput v-model="note" placeholder="A fictitious note" icon="i-lucide-search" class="max-w-sm" />
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="modal">
      <h2 id="modal" class="font-display text-lg font-medium">Modal</h2>
      <UModal v-model:open="open" title="A fictitious decision" description="The sample text of a modal.">
        <UButton label="Open the modal" />
        <template #body>
          <p class="text-sm">Nothing here is saved: the playground has no API.</p>
        </template>
        <template #footer>
          <UButton color="neutral" variant="outline" label="Cancel" @click="open = false" />
          <UButton color="warning" label="Confirm" @click="open = false" />
        </template>
      </UModal>
    </section>
  </div>
</template>
