import { h, nextTick, reactive, type Component } from 'vue';
import type { VueWrapper } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { UApp } from '#components';

interface MountOptions {
  props?: Record<string, unknown>;
  slots?: Record<string, () => unknown>;
  attachTo?: Element;
  /** The address the app opens on, for what follows the current route. */
  route?: string;
}

/**
 * Mounts a component inside UApp, as the app does, so tooltips and toasts find their
 * providers. Returns the component's own wrapper; `setProps` updates its props.
 */
export async function mountInApp(
  component: Component,
  options: MountOptions = {},
): Promise<VueWrapper> {
  const props = reactive({ ...options.props });
  const root = await mountSuspended(
    { render: () => h(UApp, null, { default: () => h(component, props, options.slots) }) },
    { attachTo: options.attachTo, route: options.route },
  );
  const inner = root.findComponent(component) as VueWrapper;
  return Object.assign(inner, {
    setProps: async (next: Record<string, unknown>) => {
      Object.assign(props, next);
      await nextTick();
    },
  });
}
