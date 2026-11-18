import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { mountInApp } from './support/mount';
import MqLegend from '../../app/components/MqLegend.vue';
import MqStatusPill from '../../app/components/MqStatusPill.vue';
import { LEGEND_ITEMS, PILLS } from './fixtures/neutral';

const mount = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  mountInApp(MqLegend, {
    props: { items: LEGEND_ITEMS, label: 'Key', ...props },
    slots: slots as Record<string, () => unknown>,
  });
type Wrapper = Awaited<ReturnType<typeof mount>>;
const items = (wrapper: Wrapper) => wrapper.findAll('[role="listitem"]');

describe('MqLegend', () => {
  it('lists each mark with its label, in the order given, named by its label', async () => {
    const wrapper = await mount();
    const legend = wrapper.find('[role="list"][aria-label="Key"]');
    expect(legend.exists()).toBe(true);
    expect(items(wrapper).map((i) => i.text())).toEqual([
      'accepted, applied',
      'rejected',
      'a person’s decision',
      'publication',
      'step',
      'robot',
      'person',
      'helper',
      'publisher',
      'live',
    ]);
  });

  it('draws the tags as swatches, the dots by shape, « live » as the live dot', async () => {
    const wrapper = await mount();
    expect(items(wrapper)[2]!.find('[data-testid="event-tag"]').attributes('data-tone')).toBe(
      'person',
    );
    expect(items(wrapper)[8]!.find('[data-testid="timeline-dot"]').attributes('data-kind')).toBe(
      'square',
    );
    expect(items(wrapper)[9]!.find('[data-testid="live-dot"]').attributes('aria-hidden')).toBe(
      'true',
    );
  });

  it('separates the groups with a thin rule, out of the list for screen readers', async () => {
    const wrapper = await mount();
    const rule = wrapper.find('[data-testid="legend-separator"]');
    expect(rule.attributes('aria-hidden')).toBe('true');
    expect(rule.attributes('role')).toBe('presentation');
    expect(rule.classes()).toEqual(expect.arrayContaining(['w-px', 'bg-(--mq-border)']));
  });

  it('draws any other mark from the slot mark-<key>, as a table’s status pills', async () => {
    const pills = PILLS.map((p, i) => ({ key: `pill-${i}`, label: p.detail }));
    const wrapper = await mount(
      { items: pills },
      Object.fromEntries(
        PILLS.map((p, i) => [
          `mark-pill-${i}`,
          () => h(MqStatusPill, { label: p.label, tone: p.tone }),
        ]),
      ),
    );
    expect(
      items(wrapper).map((i) => i.find('[data-testid="pill"]').attributes('data-colour')),
    ).toEqual(['neutral', 'warning', 'primary']);
    expect(items(wrapper)[0]!.text()).toContain(PILLS[0].detail);
  });

  it('gives every mark from a slot the same box, the mark filling it, as the swatches share one size', async () => {
    const pills = PILLS.map((p, i) => ({ key: `pill-${i}`, label: p.detail }));
    const wrapper = await mount(
      { items: pills },
      Object.fromEntries(
        PILLS.map((p, i) => [
          `mark-pill-${i}`,
          () => h(MqStatusPill, { label: p.label, tone: p.tone, fill: true }),
        ]),
      ),
    );
    const boxes = wrapper.findAll('[data-testid="legend-mark"]');
    expect(boxes).toHaveLength(3);
    for (const box of boxes)
      expect(box.classes()).toEqual(expect.arrayContaining(['grid', 'w-22', 'shrink-0']));
  });

  it('draws a swatch from its slot in the swatches’ one box, as a text’s highlights', async () => {
    const wrapper = await mount(
      { items: [{ key: 'quote', label: 'quote', swatch: true }] },
      {
        'mark-quote': () =>
          h('span', { 'data-testid': 'my-swatch', class: 'bg-(--mq-accent-pale-2)' }),
      },
    );
    const box = wrapper.find('[data-testid="legend-swatch"]');
    expect(box.classes()).toEqual(expect.arrayContaining(['h-3.5', 'w-6.5', 'shrink-0']));
    expect(box.attributes('aria-hidden')).toBe('true');
    expect(box.find('[data-testid="my-swatch"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="legend-mark"]').exists()).toBe(false);
  });

  it('is ruled above only when asked, as under a timeline', async () => {
    const plain = await mount();
    expect(plain.find('[role="list"]').classes()).not.toContain('border-t');
    const ruled = await mount({ ruled: true });
    expect(ruled.find('[role="list"]').classes()).toEqual(
      expect.arrayContaining(['border-t', 'border-(--mq-border-light)', 'pt-2']),
    );
  });
});
