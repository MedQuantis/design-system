import { describe, expect, it } from 'vitest';
import { mountInApp } from './support/mount';
import MqEventTag from '../../app/components/MqEventTag.vue';

const tag = (wrapper: Awaited<ReturnType<typeof mountInApp>>) =>
  wrapper.find('[data-testid="event-tag"]');

describe('MqEventTag', () => {
  it.each([
    ['step', ['border-(--mq-border)', 'bg-(--mq-surface)', 'text-text-secondary']],
    ['accepted', ['border-(--mq-accent)', 'text-(--mq-accent)']],
    ['rejected', ['border-dashed', 'border-(--mq-border-strong)', 'text-text']],
    ['person', ['border-(--mq-accent-pale)', 'bg-(--mq-accent-pale)', 'text-(--mq-accent)']],
    ['publication', ['border-(--mq-surface-alt)', 'bg-(--mq-surface-alt)']],
  ] as const)(
    'draws what happened as a small outlined tag in the %s tone',
    async (tone, classes) => {
      const wrapper = await mountInApp(MqEventTag, { props: { label: 'Published', tone } });
      expect(tag(wrapper).text()).toBe('Published');
      expect(tag(wrapper).attributes('data-tone')).toBe(tone);
      expect(tag(wrapper).classes()).toEqual(
        expect.arrayContaining(['border', 'rounded-sm', 'truncate', ...classes]),
      );
    },
  );

  it('is a step by default', async () => {
    const wrapper = await mountInApp(MqEventTag, { props: { label: 'Asked' } });
    expect(tag(wrapper).attributes('data-tone')).toBe('step');
  });

  it('draws an empty swatch for a caption, hidden from screen readers', async () => {
    const wrapper = await mountInApp(MqEventTag, { props: { tone: 'person', swatch: true } });
    expect(tag(wrapper).text()).toBe('');
    expect(tag(wrapper).attributes('aria-hidden')).toBe('true');
    expect(tag(wrapper).classes()).toEqual(expect.arrayContaining(['w-6.5', 'h-3.5']));
  });
});
