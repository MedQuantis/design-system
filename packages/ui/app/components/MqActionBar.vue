<script setup lang="ts">
import { h, resolveComponent, useId, useSlots, type Component, type VNode } from 'vue';

// The acts at the foot of a decision window, in the order given (the main act last, on the
// right). A refused act is disabled and its reason said once under the acts. An act that
// opens a form hands its button to the slot popover-<key>, which wraps it in its popover
// and emits for itself; the bar emits act with the key of any other act clicked.
// danger: the design system's danger outline, for a destructive act (with its icon or a
// destructive verb); never the main act's fill.
// On a phone (below 768px, the design system's phone breakpoint) the bar keeps the main act and
// the pinned ones in a row and folds the others behind « more », which grows the bar upwards
// with them, two by two. A popover slot is told the layout (phone), so its form can open as a
// sheet from the bottom there.
// note: why the acts are blocked, said in the danger colour beside them (above the row on a
// phone), its link emitting note, so the screen can show what blocks them.
export type MqActVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export interface MqActNote {
  text: string;
  /** The link after the text, which emits note. */
  link: string;
}
export interface MqAct {
  key: string;
  label: string;
  variant: MqActVariant;
  /** An icon before the label, i-lucide-*. */
  icon?: string;
  disabled?: boolean;
  /** Why the act is refused; said under the acts while it is disabled. */
  reason?: string | null;
  /** Said on hovering the act, disabled or not. */
  tooltip?: string | null;
  /** The act opens the slot popover-<key> rather than emitting. */
  popover?: boolean;
  /** On a phone, the act stays in the bar's row beside the main act instead of folding. */
  pinned?: boolean;
}

const props = withDefaults(
  defineProps<{
    actions: readonly MqAct[];
    busy?: boolean;
    /** The name of « more » and of the folded acts it shows, on a phone. */
    moreLabel?: string;
    note?: MqActNote | null;
  }>(),
  { busy: false, moreLabel: '', note: null },
);
const emit = defineEmits<{ act: [key: string]; note: [] }>();
defineSlots<
  Record<
    `popover-${string}`,
    (props: { trigger: Component; disabled: boolean; phone: boolean }) => unknown
  >
>();

const LOOK: Record<
  MqActVariant,
  { color: 'primary' | 'neutral' | 'error'; variant: 'solid' | 'outline' | 'ghost' }
> = {
  primary: { color: 'primary', variant: 'solid' },
  secondary: { color: 'neutral', variant: 'outline' },
  danger: { color: 'error', variant: 'outline' },
  ghost: { color: 'neutral', variant: 'ghost' },
};

// The phone layout is chosen in the browser, so one layout is in the page at a time.
const PHONE = '(max-width: 767.98px)';
const phone = ref(false);
const open = ref(false);
let media: MediaQueryList | undefined;
function onMedia(event: MediaQueryListEvent): void {
  phone.value = event.matches;
  if (!event.matches) open.value = false;
}
onMounted(() => {
  if (typeof window.matchMedia !== 'function') return;
  media = window.matchMedia(PHONE);
  phone.value = media.matches;
  media.addEventListener('change', onMedia);
});
onBeforeUnmount(() => media?.removeEventListener('change', onMedia));

// Kept: the main act and the pinned ones; the rest fold, unless nothing would stay in the row.
const stays = (act: MqAct): boolean => act.variant === 'primary' || Boolean(act.pinned);
const anyStays = computed(() => props.actions.some(stays));
const kept = computed(() => props.actions.filter((act) => !anyStays.value || stays(act)));
const folded = computed(() => props.actions.filter((act) => anyStays.value && !stays(act)));
const trayId = useId();

// Every act the same width (8rem at least), its label centred, a longer label widening it; on a
// phone the row's acts share its width and the folded ones fill their half of the tray.
const width = (act: MqAct): string =>
  !phone.value ? 'min-w-32' : folded.value.includes(act) ? 'w-full' : 'min-w-0 flex-1';
const buttonProps = (act: MqAct) => ({
  label: act.label,
  icon: act.icon,
  ...LOOK[act.variant],
  disabled: Boolean(act.disabled) || props.busy,
  loading: props.busy && act.variant === 'primary',
  'data-variant': act.variant,
  class: `${width(act)} justify-center disabled:opacity-45`,
});

// A disabled button fires no pointer event, so a tooltip hangs on a wrapper that takes the hover.
const UTooltip = resolveComponent('UTooltip');
const withTooltip = (act: MqAct, button: VNode): VNode =>
  act.tooltip
    ? h(UTooltip, { text: act.tooltip }, () =>
        h('span', { class: 'inline-flex', 'data-testid': 'act-tooltip' }, [button]),
      )
    : button;

// One trigger component per popover act, so its slot can wrap the bar's own button.
const UButton = resolveComponent('UButton');
const triggers = computed(
  () =>
    new Map(
      props.actions
        .filter((act) => act.popover)
        .map((act) => [
          act.key,
          (() => withTooltip(act, h(UButton, buttonProps(act)))) as Component,
        ]),
    ),
);

// One act: its popover slot wrapping its trigger, or its button; a folded act chosen folds the bar.
const slots = useSlots();
function choose(act: MqAct): void {
  emit('act', act.key);
  open.value = false;
}
const Act = (attrs: { act: MqAct }) => {
  const { act } = attrs;
  if (!act.popover)
    return withTooltip(act, h(UButton, { ...buttonProps(act), onClick: () => choose(act) }));
  const trigger = triggers.value.get(act.key)!;
  const slot = slots[`popover-${act.key}`];
  return slot ? slot({ trigger, disabled: Boolean(act.disabled), phone: phone.value }) : h(trigger);
};
Act.props = ['act'];

const Note = () =>
  props.note
    ? h(
        'p',
        {
          class: 'text-xs text-(--mq-danger)',
          'data-testid': 'acts-note',
        },
        [
          `${props.note.text} · `,
          h(
            'button',
            { type: 'button', class: 'underline', onClick: () => emit('note') },
            props.note.link,
          ),
        ],
      )
    : null;

const reasonsOf = (acts: readonly MqAct[]): string[] => [
  ...new Set(acts.filter((act) => act.disabled && act.reason).map((act) => act.reason as string)),
];
const reasons = computed(() => reasonsOf(props.actions));
</script>

<template>
  <div v-if="phone" class="flex w-full flex-col gap-2">
    <div
      v-if="open && folded.length"
      :id="trayId"
      class="grid grid-cols-2 gap-2 border-b border-(--mq-border-light) pb-2"
      role="group"
      :aria-label="moreLabel"
      data-testid="acts-tray"
    >
      <span class="text-text-tertiary col-span-2 text-xs tracking-wide uppercase">{{
        moreLabel
      }}</span>
      <Act v-for="act in folded" :key="act.key" :act="act" />
      <p
        v-for="reason in reasonsOf(folded)"
        :key="reason"
        class="text-text-secondary col-span-2 text-right text-xs"
        data-testid="refusal"
      >
        {{ reason }}
      </p>
    </div>
    <Note class="self-end" />
    <div class="flex gap-2">
      <UButton
        v-if="folded.length"
        icon="i-lucide-ellipsis"
        color="neutral"
        :variant="open ? 'soft' : 'outline'"
        :aria-label="moreLabel"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="trayId"
        data-testid="more-acts"
        @click="open = !open"
      />
      <Act v-for="act in kept" :key="act.key" :act="act" />
    </div>
    <p
      v-for="reason in reasonsOf(kept)"
      :key="reason"
      class="text-text-secondary text-right text-xs"
      data-testid="refusal"
    >
      {{ reason }}
    </p>
  </div>
  <div v-else class="flex flex-col items-end gap-1">
    <div class="flex flex-wrap items-center justify-end gap-3">
      <Note />
      <div class="flex flex-wrap justify-end gap-2">
        <Act v-for="act in actions" :key="act.key" :act="act" />
      </div>
    </div>
    <p
      v-for="reason in reasons"
      :key="reason"
      class="text-text-secondary text-xs"
      data-testid="refusal"
    >
      {{ reason }}
    </p>
  </div>
</template>
