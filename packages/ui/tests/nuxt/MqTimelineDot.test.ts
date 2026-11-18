import { describe, expect, it } from 'vitest';
import { mountInApp } from './support/mount';
import MqTimelineDot from '../../app/components/MqTimelineDot.vue';

describe('MqTimelineDot', () => {
  it.each([
    ['outline', ['rounded-full', 'border-(--mq-border-strong)', 'bg-(--mq-surface)']],
    ['filled', ['rounded-full', 'border-(--mq-accent)', 'bg-(--mq-accent)']],
    ['dashed', ['rounded-full', 'border-dashed', 'border-(--mq-border-strong)']],
    ['square', ['rounded-xs', 'border-(--mq-decoration)', 'bg-(--mq-surface)']],
  ] as const)('says who wrote an entry by its shape: %s', async (kind, classes) => {
    const wrapper = await mountInApp(MqTimelineDot, { props: { kind } });
    const dot = wrapper.find('[data-testid="timeline-dot"]');
    expect(dot.attributes('data-kind')).toBe(kind);
    expect(dot.attributes('aria-hidden')).toBe('true');
    expect(dot.classes()).toEqual(expect.arrayContaining(['border-2', ...classes]));
  });
});
