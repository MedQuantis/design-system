<script setup lang="ts">
import { ACTS } from '../../../tests/nuxt/fixtures/neutral';

const clicked = ref<string | null>(null);
// « Save » stays beside the main act on a phone; the others fold behind « more ».
const acts = ACTS.map((act) => (act.key === 'save' ? { ...act, pinned: true } : act));
const allowed = acts.filter((act) => act.key !== 'archive');
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqActionBar</h1>
    <PlaygroundState
      title="Acts in order, one refused"
      note="The main act last, on the right; the refused act disabled and its reason said under the acts; « Delete » the danger outline with its icon. « Ask someone » and « Return » open a popover."
    >
      <MqActionBar :actions="acts" more-label="Other acts" @act="clicked = $event">
        <template #popover-ask="{ trigger, disabled }">
          <UPopover :disabled="disabled" :content="{ side: 'top', align: 'end' }">
            <component :is="trigger" />
            <template #content>
              <p class="w-64 p-3 text-sm">A form to choose someone goes here.</p>
            </template>
          </UPopover>
        </template>
        <template #popover-return="{ trigger, disabled }">
          <UPopover :disabled="disabled" :content="{ side: 'top', align: 'end' }">
            <component :is="trigger" />
            <template #content>
              <p class="w-64 p-3 text-sm">A form for a comment goes here.</p>
            </template>
          </UPopover>
        </template>
      </MqActionBar>
      <p class="text-text-tertiary mt-3 text-xs">Last act: {{ clicked ?? 'none' }}</p>
    </PlaygroundState>
    <PlaygroundState title="Every act allowed" note="No reason under the acts.">
      <MqActionBar :actions="allowed" more-label="Other acts" />
    </PlaygroundState>
    <PlaygroundState
      title="Busy"
      note="Every act disabled while a decision is sent; the main act loading."
    >
      <MqActionBar :actions="allowed" more-label="Other acts" busy />
    </PlaygroundState>
    <PlaygroundState
      title="On a phone"
      note="Below 768 px: the main act and « Save » (pinned) in the row; « … » grows the bar upwards with the others, two by two. Narrow the window to see it."
      width="24rem"
    >
      <MqActionBar :actions="allowed" more-label="Other acts" />
    </PlaygroundState>
  </div>
</template>
