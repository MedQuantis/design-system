import { describe, expect, it } from 'vitest';
import { mountInApp } from './support/mount';
import MqLiveDot from '../../app/components/MqLiveDot.vue';

describe('MqLiveDot', () => {
  it('draws a green dot with a pale halo, named by its label for screen readers and in its title', async () => {
    const wrapper = await mountInApp(MqLiveDot, { props: { label: 'live today' } });
    const dot = wrapper.find('[data-testid="live-dot"]');
    expect(dot.attributes('role')).toBe('img');
    expect(dot.attributes('aria-label')).toBe('live today');
    expect(dot.attributes('title')).toBe('live today');
    expect(dot.classes()).toEqual(
      expect.arrayContaining([
        'rounded-full',
        'bg-(--mq-success)',
        'ring-3',
        'ring-(--mq-success)/20',
      ]),
    );
  });

  it('is decorative in a caption, where its label is said beside it', async () => {
    const wrapper = await mountInApp(MqLiveDot, { props: { label: 'live', decorative: true } });
    const dot = wrapper.find('[data-testid="live-dot"]');
    expect(dot.attributes('aria-hidden')).toBe('true');
    expect(dot.attributes('role')).toBeUndefined();
  });
});
