<script setup lang="ts">
import { NAVIGATION_GROUPS } from '../../../tests/nuxt/fixtures/neutral';

const NO_COUNTS = NAVIGATION_GROUPS.map((group) => ({
  ...group,
  items: group.items.map((item) => ({ ...item, count: 0 })),
}));
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqAppNavigation</h1>
    <!-- The menu needs a dashboard group around it, as the app's sidebar gives it. -->
    <UDashboardGroup class="relative! flex flex-wrap gap-6">
      <PlaygroundState
        title="Unfolded"
        note="A group without a heading, then a headed group; a count shows above zero only."
        width="16rem"
      >
        <MqAppNavigation :groups="NAVIGATION_GROUPS" />
      </PlaygroundState>
      <PlaygroundState
        title="Folded to a rail"
        note="Headings hide; each link is named by its tooltip."
        width="5rem"
      >
        <MqAppNavigation :groups="NAVIGATION_GROUPS" collapsed />
      </PlaygroundState>
      <PlaygroundState title="No counts" note="Every count at zero: no badge." width="16rem">
        <MqAppNavigation :groups="NO_COUNTS" />
      </PlaygroundState>
    </UDashboardGroup>
  </div>
</template>
