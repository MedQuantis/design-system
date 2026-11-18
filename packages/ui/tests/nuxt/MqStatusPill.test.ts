import { describe, expect, it } from 'vitest';
import { mountInApp } from './support/mount';
import MqStatusPill from '../../app/components/MqStatusPill.vue';
import { PILLS } from './fixtures/neutral';

const pill = (wrapper: Awaited<ReturnType<typeof mountInApp>>) =>
  wrapper.find('[data-testid="pill"]');

describe('MqStatusPill', () => {
  it.each([
    ['neutral', ['text-text-secondary', 'border-(--mq-border-strong)', 'bg-(--mq-surface)']],
    ['warning', ['text-(--mq-warning)', 'border-(--mq-warning-fill)', 'bg-(--mq-warning-tint)']],
    ['primary', ['text-(--mq-accent)', 'border-(--mq-accent)', 'bg-(--mq-accent-pale)']],
  ] as const)('draws its label as an outlined tag in the %s tone', async (tone, classes) => {
    const wrapper = await mountInApp(MqStatusPill, { props: { label: 'Open', tone } });
    expect(pill(wrapper).text()).toBe('Open');
    expect(pill(wrapper).attributes('data-colour')).toBe(tone);
    expect(pill(wrapper).classes()).toEqual(
      expect.arrayContaining(['border', 'rounded-sm', ...classes]),
    );
  });

  it('shows its detail under the tag, and nothing without one', async () => {
    const [first] = PILLS;
    const withDetail = await mountInApp(MqStatusPill, { props: { ...first } });
    expect(withDetail.text()).toContain(first.detail);
    const without = await mountInApp(MqStatusPill, {
      props: { label: first.label, tone: first.tone },
    });
    expect(without.text()).toBe(first.label);
  });

  it('halos the tag when emphasised, and only then', async () => {
    const emphasised = await mountInApp(MqStatusPill, {
      props: { label: 'In review', tone: 'primary', emphasis: true },
    });
    expect(pill(emphasised).attributes('data-mine')).toBe('true');
    expect(pill(emphasised).classes()).toEqual(expect.arrayContaining(['ring-2']));
    const plain = await mountInApp(MqStatusPill, {
      props: { label: 'In review', tone: 'primary' },
    });
    expect(pill(plain).attributes('data-mine')).toBeUndefined();
    expect(pill(plain).classes()).not.toContain('ring-2');
  });

  it('fills its box with the label centred when asked, as in a legend', async () => {
    const filled = await mountInApp(MqStatusPill, {
      props: { label: 'Open', tone: 'neutral', fill: true },
    });
    expect(filled.classes()).toContain('items-stretch');
    expect(pill(filled).classes()).toEqual(expect.arrayContaining(['justify-center', 'h-5']));
    const plain = await mountInApp(MqStatusPill, { props: { label: 'Open', tone: 'neutral' } });
    expect(plain.classes()).toContain('items-start');
    expect(pill(plain).classes()).not.toContain('justify-center');
  });
});
