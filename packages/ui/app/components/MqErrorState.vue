<script setup lang="ts">
/** The way an error leads back: a list or any screen the app chooses. */
export interface MqErrorStateAction {
  label: string;
  to: string;
}

// One of three error states as a centred card, every word given by the caller: not found
// (neutral), unavailable (warning, with a retry) and unexpected (danger, with a request id).
const props = withDefaults(
  defineProps<{
    kind: 'notFound' | 'unavailable' | 'unexpected';
    eyebrow: string;
    title: string;
    description: string;
    /** The address asked for, shown on the not-found kind. */
    path?: string | null;
    /** Shown framed with a copy button on the unexpected kind. */
    requestId?: string | null;
    /** The name the frame gives the request id, such as the header that carried it. */
    requestIdLabel?: string;
    copyLabel?: string;
    copiedLabel?: string;
    copyAriaLabel?: string;
    retryLabel?: string;
    retrying?: boolean;
    /** The sentence of the unavailable kind's live line; empty says nothing. */
    retryState?: string;
    /** The way back of the not-found and unexpected kinds. */
    action?: MqErrorStateAction | null;
  }>(),
  {
    path: null,
    requestId: null,
    requestIdLabel: undefined,
    copyLabel: undefined,
    copiedLabel: undefined,
    copyAriaLabel: undefined,
    retryLabel: undefined,
    retrying: false,
    retryState: '',
    action: null,
  },
);
const emit = defineEmits<{ retry: [] }>();

const STATES = {
  notFound: {
    state: 'not-found',
    tone: 'neutral',
    icon: 'i-lucide-search-x',
    tile: 'bg-(--mq-surface-alt) text-(--mq-decoration)',
    eyebrow: 'text-(--mq-tertiary)',
  },
  unavailable: {
    state: 'unavailable',
    tone: 'warning',
    icon: 'i-lucide-cloud-off',
    tile: 'bg-(--mq-warning-tint) text-(--mq-warning)',
    eyebrow: 'text-(--mq-warning)',
  },
  unexpected: {
    state: 'unexpected',
    tone: 'danger',
    icon: 'i-lucide-triangle-alert',
    tile: 'bg-(--mq-surface-alt) text-(--mq-danger)',
    eyebrow: 'text-(--mq-danger)',
  },
} as const;
const look = computed(() => STATES[props.kind]);

// The live line is drawn empty and filled once mounted: a region that arrives holding its text
// is not announced, and an error page can come back as a new node after each failed retry.
const announcing = ref(false);
onMounted(() => {
  void nextTick(() => {
    announcing.value = true;
  });
});
const liveLine = computed(() => (announcing.value ? props.retryState : ''));

const copied = ref(false);
async function copyRequestId(): Promise<void> {
  if (!props.requestId) return;
  await navigator.clipboard?.writeText(props.requestId);
  copied.value = true;
}
</script>

<template>
  <section
    class="mx-auto mt-6 flex w-full max-w-140 flex-col items-center gap-3 rounded-md border border-(--mq-border-light) bg-(--mq-surface) p-6 shadow-(--mq-shadow-small) text-center max-md:mt-0 max-md:px-4 max-md:py-5"
    :data-state="look.state"
    :data-tone="look.tone"
    data-testid="error-card"
    aria-labelledby="error-state-title"
  >
    <div class="grid size-10 place-items-center rounded-md" :class="look.tile" aria-hidden="true">
      <UIcon :name="look.icon" class="size-5.5" />
    </div>
    <span
      class="font-mono text-(length:--mq-font-size-eyebrow) tracking-widest uppercase"
      :class="look.eyebrow"
      data-testid="error-eyebrow"
      >{{ eyebrow }}</span
    >
    <h2
      id="error-state-title"
      class="font-display text-(length:--mq-font-size-h3) leading-tight font-medium"
    >
      {{ title }}
    </h2>
    <p class="text-text-secondary max-w-96">{{ description }}</p>

    <span
      v-if="kind === 'notFound' && path"
      class="text-text-tertiary font-mono text-xs wrap-anywhere"
      data-testid="error-path"
      >{{ path }}</span
    >

    <div
      v-if="kind === 'unexpected' && requestId"
      class="flex w-full items-center gap-2 rounded-sm border border-(--mq-border) bg-(--mq-canvas) py-2 ps-3 pe-2 text-left max-sm:flex-wrap"
      data-testid="request-id-frame"
    >
      <span
        class="text-text-tertiary font-mono text-(length:--mq-font-size-eyebrow) whitespace-nowrap max-sm:basis-full"
        >{{ requestIdLabel }}</span
      >
      <code
        class="text-text min-w-0 flex-1 font-mono text-(length:--mq-font-size-label) wrap-anywhere select-all"
        data-testid="request-id"
        >{{ requestId }}</code
      >
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        icon="i-lucide-copy"
        :label="copied ? copiedLabel : copyLabel"
        :aria-label="copyAriaLabel"
        @click="copyRequestId"
      />
    </div>

    <div class="mt-2 flex flex-wrap justify-center gap-3">
      <UButton
        v-if="kind === 'unavailable'"
        :label="retryLabel"
        icon="i-lucide-rotate-cw"
        :loading="retrying"
        @click="emit('retry')"
      />
      <UButton
        v-else-if="action"
        :to="action.to"
        :label="action.label"
        icon="i-lucide-arrow-left"
        :color="kind === 'notFound' ? 'primary' : 'neutral'"
        :variant="kind === 'notFound' ? 'solid' : 'outline'"
      />
    </div>
    <!-- Always drawn while unavailable, so the live region exists before it is filled. -->
    <p
      v-if="kind === 'unavailable'"
      class="text-text-tertiary min-h-6 text-(length:--mq-font-size-label)"
      aria-live="polite"
      data-testid="retry-state"
    >
      {{ liveLine }}
    </p>
  </section>
</template>
