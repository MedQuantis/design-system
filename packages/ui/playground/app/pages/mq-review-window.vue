<script setup lang="ts">
import {
  ACTS,
  STEP_SHAPES,
  WINDOW_LABELS,
  WINDOW_SECTIONS,
  WINDOW_TABS,
} from '../../../tests/nuxt/fixtures/neutral';

const open = ref(true);
const tab = ref('text');
const index = ref(2);
const loading = ref(false);
// Enough lines to overflow both panes, so each scrolls in its own frame from lg.
const long = ref(false);
const lines = (count: number) => Array.from({ length: count }, (_, n) => n + 1);
const acts = ACTS.map((act) => (act.key === 'save' ? { ...act, pinned: true } : act));
const place = (n: string, total: string) => `${n} / ${total}`;
const spoken = (n: string, total: string) => `case ${n} of ${total}`;
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqReviewWindow</h1>
    <PlaygroundState
      title="A decision window"
      note="Three header lines; the left pane's tabs, the right pane's numbered sections (1 and 3 fold, showing their digest); the action bar in the footer. On a phone it fills the screen, its footer at the screen's foot. From lg the window holds the screen's height and each pane scrolls in its own frame, the context and the tab bar fixed: show the long case to see it."
    >
      <div class="flex flex-wrap gap-2">
        <UButton label="Open the window" @click="open = true" />
        <UButton
          :label="loading ? 'Show the item' : 'Show it loading'"
          color="neutral"
          variant="outline"
          @click="loading = !loading"
        />
        <UButton
          :label="long ? 'Show the short case' : 'Show the long case'"
          color="neutral"
          variant="outline"
          @click="long = !long"
        />
      </div>
      <MqReviewWindow
        v-model:open="open"
        v-model:tab="tab"
        title="A case"
        :loading="loading"
        :tabs="WINDOW_TABS"
        :sections="WINDOW_SECTIONS"
        v-bind="WINDOW_LABELS"
        :position="{ index, total: 1234 }"
        :has-previous="index > 0"
        has-next
        :position-label="place"
        :position-spoken-label="spoken"
        @previous="index--"
        @next="index++"
      >
        <template #title>
          <span class="font-display text-xl font-medium">A1 · Case A, a first request</span>
        </template>
        <template #subtitle>
          <span class="text-sm"><b class="font-medium">Item One</b> · ten pages</span>
        </template>
        <template #badges>
          <UBadge label="Opened 01.11.2026" color="neutral" variant="outline" size="sm" />
        </template>
        <template #stepper>
          <MqStepper :steps="STEP_SHAPES.underWay" label="Approval" />
        </template>
        <template #context>
          <UCard variant="soft">
            <p class="text-sm">Two codes disagree on this text.</p>
          </UCard>
        </template>
        <template #tab-text>
          <p class="text-sm">The text of the case.</p>
          <template v-if="long">
            <p v-for="n in lines(40)" :key="n" class="text-sm">Line {{ n }} of the text.</p>
          </template>
        </template>
        <template #tab-log><p class="text-sm">Three entries of its log.</p></template>
        <template #section-proposal><p class="text-sm">Two codes in play.</p></template>
        <template #digest-proposal>A1 · B2</template>
        <template #section-decision>
          <p class="text-sm">The decision's form.</p>
          <template v-if="long">
            <p v-for="n in lines(40)" :key="n" class="text-sm">Field {{ n }} of the form.</p>
          </template>
        </template>
        <template #section-change><p class="text-sm">Today and after.</p></template>
        <template #digest-change>after: B2</template>
        <template #footer>
          <MqActionBar :actions="acts" more-label="Other acts" />
        </template>
      </MqReviewWindow>
    </PlaygroundState>
  </div>
</template>
