import { describe, expect, it } from 'vitest';
import { mountInApp } from './support/mount';
import MqSegmentedFilter from '../../app/components/MqSegmentedFilter.vue';
import { SEGMENT_GROUPS } from './fixtures/neutral';

const base = { label: 'State', allLabel: 'All', groups: SEGMENT_GROUPS };

describe('MqSegmentedFilter', () => {
  it('is a group named by its label, which it does not show', async () => {
    const wrapper = await mountInApp(MqSegmentedFilter, { props: { ...base, modelValue: null } });
    const band = wrapper.find('[role="group"]');
    expect(band.attributes('aria-label')).toBe('State');
    expect(band.text().startsWith('State')).toBe(false);
  });

  it('draws « all » first, then each group after a thin rule, each segment with its count', async () => {
    const wrapper = await mountInApp(MqSegmentedFilter, { props: { ...base, modelValue: null } });
    expect(wrapper.findAll('button').map((b) => b.text().replace(/\s+/g, ' '))).toEqual([
      'All',
      'Open 7',
      "Waiting 1'234",
      'Mine 0',
    ]);
    expect(wrapper.findAll('[data-testid="segment-rule"]')).toHaveLength(2);
    const counts = wrapper.findAll('[data-testid="segment-count"]');
    expect(counts).toHaveLength(3);
    expect(counts.every((count) => count.classes().includes('font-mono'))).toBe(true);
  });

  it('shows the count of « all » when given', async () => {
    const wrapper = await mountInApp(MqSegmentedFilter, {
      props: { ...base, allCount: 1241, modelValue: null },
    });
    expect(wrapper.findAll('button')[0]!.text().replace(/\s+/g, ' ')).toBe("All 1'241");
  });

  it('presses the chosen segment, raised in white with navy text, and mutes an empty one', async () => {
    const wrapper = await mountInApp(MqSegmentedFilter, {
      props: { ...base, modelValue: 'waiting' },
    });
    const chosen = wrapper.find('button[aria-pressed="true"]');
    expect(chosen.text()).toContain('Waiting');
    expect(chosen.classes()).toEqual(
      expect.arrayContaining(['bg-(--mq-surface)', 'text-(--mq-accent)', 'shadow-sm']),
    );
    expect(wrapper.findAll('button[aria-pressed="true"]')).toHaveLength(1);
    const mine = wrapper.findAll('button').find((b) => b.text().startsWith('Mine'))!;
    expect(mine.attributes('data-empty')).toBe('true');
    expect(wrapper.findAll('button')[0]!.attributes('aria-pressed')).toBe('false');
  });

  it('emits the value of a segment clicked, and null for « all »', async () => {
    const wrapper = await mountInApp(MqSegmentedFilter, { props: { ...base, modelValue: 'open' } });
    await wrapper
      .findAll('button')
      .find((b) => b.text().startsWith('Mine'))!
      .trigger('click');
    await wrapper.findAll('button')[0]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['mine'], [null]]);
  });

  it('keeps each group whole when the band wraps: its rule and segments in one unbroken run', async () => {
    const wrapper = await mountInApp(MqSegmentedFilter, { props: { ...base, modelValue: null } });
    const groups = wrapper.findAll('[data-testid="segment-group"]');
    expect(
      groups.map((group) => group.findAll('button').map((b) => b.text().split(' ')[0])),
    ).toEqual([['Open', 'Waiting'], ['Mine']]);
    for (const group of groups) {
      expect(group.classes()).toEqual(expect.arrayContaining(['inline-flex', 'flex-nowrap']));
      expect(group.find('[data-testid="segment-rule"]').exists()).toBe(true);
    }
  });

  it('wraps its segments inside the band, each label kept on one line', async () => {
    const wrapper = await mountInApp(MqSegmentedFilter, { props: { ...base, modelValue: null } });
    expect(wrapper.find('[role="group"]').classes()).toEqual(
      expect.arrayContaining(['flex-wrap', 'whitespace-nowrap', 'bg-(--mq-surface-alt)']),
    );
  });
});
