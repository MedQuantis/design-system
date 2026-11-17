import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { UButton } from '#components';

// A Nuxt app built from the layer alone: the app config is the layer's, merged by Nuxt, and Nuxt UI
// draws with it.
describe('the theme of the layer', () => {
  it('maps the Nuxt UI colours onto the design system scales', () => {
    expect(useAppConfig().ui.colors).toMatchObject({
      primary: 'navy',
      error: 'danger',
      success: 'success',
      warning: 'warning',
      info: 'info',
      neutral: 'stone',
    });
  });

  it('draws a solid warning button with the warning fill and its ink', async () => {
    const button = await mountSuspended(UButton, { props: { color: 'warning' } });
    const classes = button.get('button').classes();
    expect(classes).toContain('bg-(--mq-warning-fill)');
    expect(classes).toContain('text-(--mq-on-warning-fill)');
    expect(classes).toContain('rounded-sm');
  });

  it('draws a soft warning button on the tint with ink text', async () => {
    const button = await mountSuspended(UButton, { props: { color: 'warning', variant: 'soft' } });
    const classes = button.get('button').classes();
    expect(classes).toContain('bg-(--mq-warning-tint)');
    expect(classes).toContain('text-(--mq-ink)');
  });
});
