import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { mountInApp } from './support/mount';
import MqTimeline from '../../app/components/MqTimeline.vue';
import {
  LEGEND_ITEMS,
  TIMELINE_CATEGORIES,
  TIMELINE_ENTRIES,
  TIMELINE_FILTERS,
} from './fixtures/neutral';

type Entry = (typeof TIMELINE_ENTRIES)[number];
const base = {
  entries: TIMELINE_ENTRIES,
  filters: TIMELINE_FILTERS,
  categories: TIMELINE_CATEGORIES,
  allLabel: 'All',
  loadMoreLabel: 'Load more',
  noneLabel: 'none',
  liveLabel: 'live today',
  expandAllLabel: 'Unfold all',
  collapseAllLabel: 'Fold all',
};
const mount = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  mountInApp(MqTimeline, {
    props: { ...base, ...props },
    slots: slots as Record<string, () => unknown>,
  });
type Wrapper = Awaited<ReturnType<typeof mount>>;
const rows = (wrapper: Wrapper) => wrapper.findAll('[data-testid="history-row"]');
const line = (wrapper: Wrapper, i: number) =>
  rows(wrapper)[i]!.find('[data-testid="timeline-line"]');
const filterButtons = (wrapper: Wrapper) => wrapper.findAll('[data-testid="source-filter"] button');

describe('MqTimeline', () => {
  it('draws one line per entry in the order given', async () => {
    const wrapper = await mount();
    expect(rows(wrapper)).toHaveLength(3);
    expect(rows(wrapper).map((r) => r.attributes('data-key'))).toEqual(['e3', 'e2', 'e1']);
  });

  it('lays a line out in columns: date, category, what happened, who, result, live, chevron', async () => {
    const wrapper = await mount();
    const cells = line(wrapper, 1).element.children;
    expect([...cells].map((c) => c.getAttribute('data-cell'))).toEqual([
      'date',
      'category',
      'event',
      'who',
      'result',
      'live',
      'chevron',
    ]);
    expect(line(wrapper, 1).classes()).toEqual(
      expect.arrayContaining([
        'md:grid',
        'md:grid-cols-[7.75rem_1.125rem_9.375rem_minmax(max-content,1fr)_max-content_1rem_0.8125rem]',
      ]),
    );
    expect(line(wrapper, 1).find('[data-cell="date"]').text()).toMatch(/02\.11\.2026/);
    expect(line(wrapper, 0).find('[data-cell="who"]').text()).toBe('Alex Example');
  });

  it('cuts no column: who and the result take the width they need, the tag names its whole label in its tooltip', async () => {
    const long = 'a name long enough to be cut in a fixed column';
    const wrapper = await mount({
      entries: [{ ...TIMELINE_ENTRIES[0]!, who: long, result: 'a result longer than six rem' }],
    });
    const who = line(wrapper, 0).find('[data-cell="who"]');
    const result = line(wrapper, 0).find('[data-cell="result"]');
    expect(who.find('[data-testid="who-name"]').classes()).not.toContain('truncate');
    expect(who.text()).toBe(long);
    expect(result.classes()).not.toContain('truncate');
    expect(result.classes()).toContain('whitespace-nowrap');
    expect(line(wrapper, 0).find('[data-testid="event-tag"]').attributes('title')).toBe(
      'check asked',
    );
  });

  it('reads a day with no time as the day alone', async () => {
    const wrapper = await mount({
      entries: [{ ...TIMELINE_ENTRIES[2]!, at: '2026-11-01' }],
    });
    expect(line(wrapper, 0).find('[data-cell="date"]').text()).toBe('01.11.2026');
  });

  it('draws an entry’s technical line under it, aligned on the status tag, only when given', async () => {
    const wrapper = await mount({
      entries: [
        { ...TIMELINE_ENTRIES[0]!, tech: 'setup v4 · tool-a · CODE' },
        TIMELINE_ENTRIES[1]!,
      ],
    });
    const tech = rows(wrapper)[0]!.find('[data-testid="timeline-tech"]');
    expect(tech.text()).toBe('setup v4 · tool-a · CODE');
    expect(tech.classes()).toEqual(
      expect.arrayContaining(['font-mono', 'md:ps-[calc(7.75rem+1.125rem+1.875rem)]']),
    );
    expect(rows(wrapper)[1]!.find('[data-testid="timeline-tech"]').exists()).toBe(false);
  });

  it('draws who wrote an entry with its icon before the name, or the icon alone, the name in its tooltip', async () => {
    const wrapper = await mount();
    const who = (i: number) => line(wrapper, i).find('[data-cell="who"]');
    expect(who(0).find('.iconify').exists()).toBe(true);
    expect(who(0).text()).toBe('Alex Example');
    expect(who(1).find('.iconify').exists()).toBe(true);
    expect(who(1).attributes('title')).toBe('Robot');
    expect(who(1).find('.sr-only').text()).toBe('Robot');
    expect(who(1).find('[data-testid="who-name"]').exists()).toBe(false);
    // No icon given: the name alone.
    expect(who(2).find('.iconify').exists()).toBe(false);
    expect(who(2).text()).toBe('Publisher');
  });

  it('names a line’s category by its icon, the name in its tooltip and for screen readers', async () => {
    const wrapper = await mount();
    const category = line(wrapper, 2).find('[data-cell="category"]');
    expect(category.attributes('title')).toBe('Publication');
    expect(category.find('.iconify').exists()).toBe(true);
    expect(category.find('.sr-only').text()).toBe('Publication');
  });

  it('draws a category from outside the product, a publisher, in the decoration hue', async () => {
    const wrapper = await mount();
    const icon = (i: number) => line(wrapper, i).find('[data-cell="category"] .iconify');
    expect(icon(0).classes()).toContain('text-(--mq-accent)');
    expect(icon(2).classes()).toContain('text-(--mq-decoration)');
    expect(icon(2).classes()).not.toContain('text-(--mq-accent)');
  });

  it('says what happened in a status tag of the entry’s tone, a step by default', async () => {
    const wrapper = await mount();
    const tones = rows(wrapper).map((r) =>
      r.find('[data-testid="event-tag"]').attributes('data-tone'),
    );
    expect(tones).toEqual(['person', 'accepted', 'publication']);
    expect(line(wrapper, 0).find('[data-testid="event-tag"]').text()).toBe('check asked');
    const plain = await mount({
      entries: [{ key: 'x', at: TIMELINE_ENTRIES[0]!.at, title: 'asked' }],
    });
    expect(plain.find('[data-testid="event-tag"]').attributes('data-tone')).toBe('step');
  });

  it('says who wrote an entry by its dot’s shape', async () => {
    const wrapper = await mount();
    const kinds = rows(wrapper).map((r) =>
      r.find('[data-testid="timeline-dot"]').attributes('data-kind'),
    );
    expect(kinds).toEqual(['filled', 'outline', 'square']);
  });

  it('puts the result at the right in mono, « none » in italics when there is none, nothing when it does not apply', async () => {
    const wrapper = await mount();
    const result = (i: number) => line(wrapper, i).find('[data-cell="result"]');
    expect(result(1).text()).toBe('4471.02');
    expect(result(1).classes()).toEqual(expect.arrayContaining(['font-mono', 'text-right']));
    expect(result(0).text()).toBe('none');
    expect(result(0).classes()).toContain('italic');
    expect(result(2).text()).toBe('');
  });

  it('marks the entry live today with the live dot, and only it', async () => {
    const wrapper = await mount();
    expect(rows(wrapper).map((r) => r.attributes('data-served'))).toEqual([
      'false',
      'true',
      'false',
    ]);
    expect(rows(wrapper).map((r) => r.find('[data-testid="live-dot"]').exists())).toEqual([
      false,
      true,
      false,
    ]);
    expect(line(wrapper, 1).find('[data-testid="live-dot"]').attributes('aria-label')).toBe(
      'live today',
    );
  });

  it('draws the trace from dot to dot, not past the last line', async () => {
    const wrapper = await mount();
    expect(rows(wrapper).map((r) => r.find('[data-testid="timeline-trace"]').exists())).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('unfolds a line under it, aligned on the status tag, its chevron at the line’s end turned down', async () => {
    const wrapper = await mount(
      {},
      {
        details: ({ entry }: { entry: Entry }) => h('span', { 'data-testid': 'detail' }, entry.key),
      },
    );
    const chevron = () => line(wrapper, 1).find('[data-cell="chevron"]');
    expect(chevron().classes()).toContain('-rotate-90');
    expect(line(wrapper, 1).attributes('aria-expanded')).toBe('false');
    await line(wrapper, 1).trigger('click');
    expect(line(wrapper, 1).attributes('aria-expanded')).toBe('true');
    expect(chevron().classes()).not.toContain('-rotate-90');
    expect(line(wrapper, 1).classes()).toContain('bg-(--mq-surface-alt)');
    const details = rows(wrapper)[1]!.find('[data-testid="timeline-details"]');
    expect(details.find('[data-testid="detail"]').text()).toBe('e2');
    expect(details.classes()).toEqual(
      expect.arrayContaining(['md:ps-[calc(7.75rem+1.125rem+1.875rem)]', 'flex-col', 'text-xs']),
    );
    await line(wrapper, 1).trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="detail"]').exists()).toBe(false);
  });

  it('unfolds every line at once, and folds them all again', async () => {
    const wrapper = await mount(
      {},
      {
        details: ({ entry }: { entry: Entry }) => h('span', { 'data-testid': 'detail' }, entry.key),
      },
    );
    const toggle = () => wrapper.find('[data-testid="toggle-all"]');
    expect(toggle().text()).toBe('Unfold all');
    await toggle().trigger('click');
    expect(rows(wrapper).map((_, i) => line(wrapper, i).attributes('aria-expanded'))).toEqual([
      'true',
      'true',
      'true',
    ]);
    expect(toggle().text()).toBe('Fold all');
    await toggle().trigger('click');
    expect(rows(wrapper).map((_, i) => line(wrapper, i).attributes('aria-expanded'))).toEqual([
      'false',
      'false',
      'false',
    ]);
    expect(toggle().text()).toBe('Unfold all');
  });

  it('says « fold all » once every line shown is unfolded by hand', async () => {
    const wrapper = await mount();
    for (let i = 0; i < 3; i++) await line(wrapper, i).trigger('click');
    expect(wrapper.find('[data-testid="toggle-all"]').text()).toBe('Fold all');
  });

  it('offers no « unfold all » without its labels', async () => {
    const wrapper = await mount({ expandAllLabel: undefined, collapseAllLabel: undefined });
    expect(wrapper.find('[data-testid="toggle-all"]').exists()).toBe(false);
  });

  it('offers « all » then each filter with its icon and count, leaving out a filter with none', async () => {
    const wrapper = await mount();
    expect(filterButtons(wrapper).map((b) => b.text().replace(/\s+/g, ' ').trim())).toEqual([
      'All 3',
      'Robot 2',
      'Person 1',
    ]);
    expect(filterButtons(wrapper).map((b) => b.attributes('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(filterButtons(wrapper)[1]!.find('.iconify').exists()).toBe(true);
    expect(filterButtons(wrapper)[0]!.classes()).toEqual(
      expect.arrayContaining(['rounded-full', 'bg-(--mq-accent)', 'text-on-accent']),
    );
    expect(filterButtons(wrapper)[1]!.classes()).toEqual(
      expect.arrayContaining(['rounded-full', 'border']),
    );
  });

  it('filters the lines by the pill chosen, and back to all', async () => {
    const wrapper = await mount();
    await filterButtons(wrapper)[1]!.trigger('click');
    expect(rows(wrapper)).toHaveLength(2);
    expect(filterButtons(wrapper)[1]!.attributes('aria-pressed')).toBe('true');
    await filterButtons(wrapper)[0]!.trigger('click');
    expect(rows(wrapper)).toHaveLength(3);
  });

  it('keys its marks in a legend under the lines', async () => {
    const wrapper = await mount({ legend: LEGEND_ITEMS, legendLabel: 'Key' });
    expect(wrapper.find('[aria-label="Key"]').exists()).toBe(true);
    const none = await mount();
    expect(none.find('[data-testid="legend-item"]').exists()).toBe(false);
  });

  it('shows a skeleton while the entries load', async () => {
    const wrapper = await mount({ entries: undefined });
    expect(wrapper.find('[data-testid="history-loading"]').exists()).toBe(true);
    expect(rows(wrapper)).toHaveLength(0);
  });

  it('offers « load more » when older entries exist, emitting more', async () => {
    const without = await mount();
    expect(without.findAll('button').some((b) => b.text() === 'Load more')).toBe(false);
    const wrapper = await mount({ hasMore: true });
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Load more')!
      .trigger('click');
    expect(wrapper.emitted('more')).toHaveLength(1);
  });
});
