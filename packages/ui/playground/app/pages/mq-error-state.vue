<script setup lang="ts">
import { ERROR_ACTION, ERROR_STATES, ERROR_STILL_DOWN } from '../../../tests/nuxt/fixtures/neutral';

const retrying = ref(false);
function retry(): void {
  retrying.value = true;
  setTimeout(() => (retrying.value = false), 1500);
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="font-display text-xl font-medium">MqErrorState</h1>
    <PlaygroundState title="Not found" note="The asked address under the text, the way back solid.">
      <MqErrorState v-bind="ERROR_STATES.notFound" :action="ERROR_ACTION" />
    </PlaygroundState>
    <PlaygroundState
      title="Unavailable"
      note="A retry instead of the way back; click it for the loading state."
    >
      <MqErrorState v-bind="ERROR_STATES.unavailable" :retrying="retrying" @retry="retry" />
    </PlaygroundState>
    <PlaygroundState title="Unavailable after a failed retry" note="The live line says so.">
      <MqErrorState v-bind="ERROR_STATES.unavailable" :retry-state="ERROR_STILL_DOWN" />
    </PlaygroundState>
    <PlaygroundState title="Unexpected" note="The request id framed with its copy button.">
      <MqErrorState v-bind="ERROR_STATES.unexpected" :action="ERROR_ACTION" />
    </PlaygroundState>
    <PlaygroundState title="Unexpected in a narrow column" width="22rem">
      <MqErrorState
        v-bind="ERROR_STATES.unexpected"
        request-id="req-0042-a-long-identifier-that-has-to-wrap-somewhere"
        :action="ERROR_ACTION"
      />
    </PlaygroundState>
  </div>
</template>
