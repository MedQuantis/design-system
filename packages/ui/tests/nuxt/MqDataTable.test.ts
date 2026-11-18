import { describe, expect, it } from 'vitest';
import { h, type Component } from 'vue';
import { mountInApp } from './support/mount';
import MqDataTable from '../../app/components/MqDataTable.vue';
import { SORT_LABELS, TABLE_COLUMNS, TABLE_ROWS } from './fixtures/neutral';

// The table is generic over its row type, which the mount helper's Component type does not
// carry; the rows below are typed where the slots read them.
const Table = MqDataTable as unknown as Component;
type Row = (typeof TABLE_ROWS)[number];
const cells = {
  'cell-case': ({ row }: { row: Row }) => h('span', { 'data-testid': 'case' }, row.case),
  'cell-owner': ({ row }: { row: Row }) => row.owner,
  'cell-opened': ({ row }: { row: Row }) => row.opened,
};
const base = {
  columns: TABLE_COLUMNS,
  rows: TABLE_ROWS,
  sortLabels: SORT_LABELS,
  sortByLabel: 'Sort by',
  emptyTitle: 'Nothing open',
  emptyDescription: 'Change a filter to see more.',
  loadMoreLabel: 'Load more',
  shownLabel: '3 of 7 shown',
  frameTestId: 'cases',
};
const mount = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  mountInApp(Table, {
    props: { ...base, ...props },
    slots: { ...cells, ...slots } as unknown as Record<string, () => unknown>,
  });

describe('MqDataTable', () => {
  it('draws one row per item, keyed, each cell from its column’s slot', async () => {
    const wrapper = await mount();
    expect(wrapper.findAll('th').map((th) => th.text())).toEqual(['Case', 'Owner', 'Opened']);
    const rows = wrapper.findAll('tbody tr');
    expect(rows.map((row) => row.attributes('data-key'))).toEqual(['case-1', 'case-2', 'case-3']);
    expect(rows[1]!.findAll('td').map((td) => td.text())).toEqual([
      'A second case',
      'Team South',
      '02.11.2026',
    ]);
  });

  it('fixes the declared column widths under a fixed layout, a long value wrapping', async () => {
    const wrapper = await mount();
    const widths = wrapper
      .findAll('colgroup col')
      .map((col) => (col.element as HTMLElement).style.width);
    expect(widths).toEqual(['40%', '35%', '25%']);
    expect(wrapper.find('table').classes()).toContain('table-fixed');
    expect(wrapper.find('tbody td').classes()).toContain('wrap-break-word');
  });

  it('holds a navy header at the top of its own scrolling frame, named by its test id', async () => {
    const wrapper = await mount({ minWidth: '40rem' });
    const frame = wrapper.find('[data-testid="cases"]');
    expect(frame.classes()).toEqual(expect.arrayContaining(['overflow-auto', 'min-h-0']));
    expect(wrapper.find('thead').classes()).toEqual(
      expect.arrayContaining(['sticky', 'top-0', 'bg-(--mq-accent)']),
    );
    // The minimum width holds from 768 px up; a phone shows cards instead.
    const table = wrapper.find('table');
    expect((table.element as HTMLElement).style.getPropertyValue('--table-min-width')).toBe(
      '40rem',
    );
    expect(table.classes()).toContain('md:min-w-(--table-min-width)');
  });

  it('marks the sorted column with a solid arrow, the others with a faint chevron', async () => {
    const wrapper = await mount({ sort: 'OPENED', order: 'desc' });
    const marks = wrapper.findAll('th [data-testid="sort-mark"]');
    expect(marks.map((mark) => mark.attributes('data-sort'))).toEqual(['none', 'descending']);
    expect(marks.every((mark) => mark.attributes('aria-hidden') === 'true')).toBe(true);
    expect(marks[0]!.classes()).toContain('opacity-50');
    expect(marks[1]!.classes()).not.toContain('opacity-50');
    expect(wrapper.findAll('th').map((th) => th.attributes('aria-sort'))).toEqual([
      'none',
      undefined,
      'descending',
    ]);
  });

  it('names the sort in the sorted header, and only there', async () => {
    const wrapper = await mount({ sort: 'CASE', order: 'asc' });
    const buttons = wrapper.findAll('th button');
    expect(buttons[0]!.text()).toBe('Case, sorted ascending');
    expect(buttons[0]!.find('.sr-only').text()).toBe(', sorted ascending');
    expect(buttons[1]!.text()).toBe('Opened');
  });

  it('emits the sort a header asks for, toggling the order of the sorted column', async () => {
    const wrapper = await mount({ sort: 'CASE', order: 'asc' });
    const buttons = wrapper.findAll('th button');
    await buttons[0]!.trigger('click');
    await buttons[1]!.trigger('click');
    expect(wrapper.emitted('sort')).toEqual([
      [{ sort: 'CASE', order: 'desc' }],
      [{ sort: 'OPENED', order: 'asc' }],
    ]);
  });

  it('opens a row by click, and moves and opens with J, K, the arrows and Enter', async () => {
    const wrapper = await mount();
    await wrapper.findAll('tbody tr')[2]!.trigger('click');
    expect(wrapper.emitted('open')).toEqual([['case-3']]);
    const frame = wrapper.find('[data-testid="cases"]');
    for (const key of ['k', 'ArrowUp', 'j', 'ArrowDown', 'k', 'Enter']) {
      await frame.trigger('keydown', { key });
    }
    expect(wrapper.emitted('open')?.[1]).toEqual(['case-2']);
    expect(wrapper.find('tbody tr[aria-selected="true"]').attributes('data-key')).toBe('case-2');
  });

  it('tints the rows its emphasis picks', async () => {
    const wrapper = await mount({ rowEmphasis: (row: Row) => row.flagged });
    const tinted = wrapper
      .findAll('tbody tr')
      .filter((row) => row.attributes('data-mine') === 'true');
    expect(tinted.map((row) => row.attributes('data-key'))).toEqual(['case-2']);
  });

  it('draws five skeleton rows while loading, and no legend', async () => {
    const wrapper = await mount(
      { loading: true, rows: [] },
      { legend: () => h('p', { 'data-testid': 'legend' }, 'Key') },
    );
    expect(wrapper.findAll('[data-testid="row-skeleton"]')).toHaveLength(5);
    expect(wrapper.find('[data-testid="legend"]').exists()).toBe(false);
  });

  it('offers the next page while the total exceeds the rows, and asks for it', async () => {
    const wrapper = await mount({ total: 7 });
    const partial = wrapper.find('[data-testid="partial-list"]');
    expect(partial.text()).toContain('3 of 7 shown');
    await partial.find('button').trigger('click');
    expect(wrapper.emitted('more')).toHaveLength(1);
    const whole = await mount({ total: 3 });
    expect(whole.find('[data-testid="partial-list"]').exists()).toBe(false);
  });

  it('reads its empty title, with the description only under filters, and no legend', async () => {
    const legend = { legend: () => h('p', { 'data-testid': 'legend' }, 'Key') };
    const all = await mount({ rows: [] }, legend);
    expect(all.text()).toContain('Nothing open');
    expect(all.text()).not.toContain('Change a filter');
    expect(all.find('[data-testid="legend"]').exists()).toBe(false);
    const filtered = await mount({ rows: [], filtered: true });
    expect(filtered.text()).toContain('Change a filter to see more.');
  });

  it('shows its legend under the frame when rows are shown', async () => {
    const wrapper = await mount({}, { legend: () => h('p', { 'data-testid': 'legend' }, 'Key') });
    const legend = wrapper.find('[data-testid="legend"]');
    expect(legend.exists()).toBe(true);
    expect(wrapper.find('[data-testid="cases"]').element.contains(legend.element)).toBe(false);
  });

  describe('with a selection column', () => {
    const selection = {
      selectable: true,
      selectRowLabel: (row: Row) => `Select ${row.case}`,
      selectAllLabel: 'Select every case shown',
    };
    const boxes = (wrapper: Awaited<ReturnType<typeof mount>>) =>
      wrapper.findAll('tbody [role="checkbox"]');
    const header = (wrapper: Awaited<ReturnType<typeof mount>>) =>
      wrapper.find('thead [role="checkbox"]');

    it('draws a first column of boxes, each named for its row', async () => {
      const wrapper = await mount({ ...selection, selected: [] });
      expect(boxes(wrapper).map((box) => box.attributes('aria-label'))).toEqual([
        'Select A first case',
        'Select A second case',
        'Select A third case',
      ]);
      expect(header(wrapper).attributes('aria-label')).toBe('Select every case shown');
      expect(wrapper.findAll('colgroup col')).toHaveLength(4);
    });

    it('toggles a row without opening it', async () => {
      const wrapper = await mount({ ...selection, selected: [] });
      await boxes(wrapper)[1]!.trigger('click');
      expect(wrapper.emitted('update:selected')).toEqual([[['case-2']]]);
      expect(wrapper.emitted('open')).toBeUndefined();
    });

    it('selects every selectable row shown from the header, and reads mixed when some are', async () => {
      const wrapper = await mount({ ...selection, selected: ['case-1'] });
      expect(header(wrapper).attributes('aria-checked')).toBe('mixed');
      await header(wrapper).trigger('click');
      expect(wrapper.emitted('update:selected')?.[0]).toEqual([['case-1', 'case-2', 'case-3']]);
      const all = await mount({ ...selection, selected: ['case-1', 'case-2', 'case-3'] });
      expect(header(all).attributes('aria-checked')).toBe('true');
      await header(all).trigger('click');
      expect(all.emitted('update:selected')?.[0]).toEqual([[]]);
    });

    it('disables a row its rule leaves out, with the reason as its title, and skips it from « all »', async () => {
      const wrapper = await mount({
        ...selection,
        selected: [],
        isSelectable: (row: Row) => !row.flagged,
        disabledReason: () => 'Flagged cases are handled one by one',
      });
      const second = boxes(wrapper)[1]!;
      expect(second.attributes('disabled')).toBeDefined();
      // Greyed, so it reads as unavailable before anyone hovers it.
      expect(second.classes()).toContain('bg-(--mq-surface-alt)');
      expect(boxes(wrapper)[2]!.classes()).not.toContain('bg-(--mq-surface-alt)');
      expect(second.element.closest('td')!.getAttribute('title')).toBe(
        'Flagged cases are handled one by one',
      );
      await header(wrapper).trigger('click');
      expect(wrapper.emitted('update:selected')?.[0]).toEqual([['case-1', 'case-3']]);
    });

    it('draws the header box white with a navy mark, so it shows on the navy header', async () => {
      const wrapper = await mount({ ...selection, selected: ['case-1'] });
      const box = header(wrapper);
      expect(box.classes()).toEqual(expect.arrayContaining(['bg-(--mq-surface)']));
      const mark = box.find('[data-slot="indicator"]');
      expect(mark.classes()).toEqual(
        expect.arrayContaining(['bg-(--mq-surface)', 'text-(--mq-accent)']),
      );
    });

    it('toggles the keyboard row with the space bar', async () => {
      const wrapper = await mount({ ...selection, selected: [] });
      const frame = wrapper.find('[data-testid="cases"]');
      await frame.trigger('keydown', { key: 'j' });
      await frame.trigger('keydown', { key: ' ' });
      expect(wrapper.emitted('update:selected')).toEqual([[['case-2']]]);
    });
  });

  it('draws no selection column unless asked', async () => {
    const wrapper = await mount();
    expect(wrapper.find('[role="checkbox"]').exists()).toBe(false);
    expect(wrapper.findAll('colgroup col')).toHaveLength(3);
  });

  describe('on a phone', () => {
    const phoneSelection = {
      selectable: true,
      selected: [],
      selectRowLabel: (row: Row) => `Select ${row.case}`,
      selectAllLabel: 'Select every case shown',
    };

    it('turns each row into its own card, the frame giving way to the gap between cards', async () => {
      const wrapper = await mount();
      expect(wrapper.find('tbody').classes()).toEqual(
        expect.arrayContaining(['max-md:flex', 'max-md:flex-col', 'max-md:gap-2']),
      );
      expect(wrapper.find('tbody tr').classes()).toEqual(
        expect.arrayContaining(['max-md:block', 'max-md:rounded-md', 'max-md:border']),
      );
      expect(wrapper.find('[data-testid="cases"]').classes()).toEqual(
        expect.arrayContaining(['max-md:border-0', 'max-md:bg-transparent', 'max-md:shadow-none']),
      );
    });

    it('labels each field but the first in a fixed track of capitals, its phone label first', async () => {
      const wrapper = await mount();
      const cells = wrapper.findAll('tbody tr')[0]!.findAll('td');
      expect(cells.map((cell) => cell.attributes('data-label'))).toEqual([
        undefined,
        'Team',
        'Opened',
      ]);
      expect(cells[1]!.classes()).toEqual(
        expect.arrayContaining([
          'max-md:ms-27',
          'max-md:before:content-[attr(data-label)]',
          'max-md:before:uppercase',
          'max-md:before:w-27',
        ]),
      );
      // The name is drawn, not written: the cell's text stays its value.
      expect(cells[1]!.text()).toBe('Team North');
    });

    it('draws a fine line between field rows, none above the first', async () => {
      const wrapper = await mount();
      const cells = wrapper.findAll('tbody tr')[0]!.findAll('td');
      expect(cells[1]!.classes()).not.toContain('max-md:border-t');
      expect(cells[1]!.classes()).toContain('max-md:before:top-2');
      expect(cells[2]!.classes()).toEqual(
        expect.arrayContaining(['max-md:border-t', 'max-md:before:border-t']),
      );
    });

    it('leaves out the line of a field its column says is empty', async () => {
      const columns = TABLE_COLUMNS.map((column) =>
        column.key === 'owner' ? { ...column, emptyOnPhone: (row: Row) => row.flagged } : column,
      );
      const wrapper = await mount({ columns });
      const owner = (index: number) => wrapper.findAll('tbody tr')[index]!.findAll('td')[1]!;
      expect(owner(1).classes()).toContain('max-md:hidden');
      expect(owner(0).classes()).not.toContain('max-md:hidden');
    });

    it('pins a row’s box to the card’s top right, the card keeping room for it', async () => {
      const wrapper = await mount(phoneSelection);
      const row = wrapper.findAll('tbody tr')[0]!;
      expect(row.classes()).toEqual(expect.arrayContaining(['max-md:relative', 'max-md:pe-10']));
      expect(row.find('td').classes()).toEqual(
        expect.arrayContaining(['max-md:absolute', 'max-md:top-3', 'max-md:right-3']),
      );
    });

    it('offers the sortable columns as a sort bar above the list, hidden from 768 px up', async () => {
      const wrapper = await mount({ sort: 'OPENED', order: 'asc' });
      const bar = wrapper.find('[data-testid="phone-sort"]');
      expect(bar.classes()).toContain('md:hidden');
      expect(bar.attributes('aria-label')).toBe('Sort by');
      const buttons = bar.findAll('button');
      expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual(['false', 'true']);
      await buttons[1]!.trigger('click');
      await buttons[0]!.trigger('click');
      expect(wrapper.emitted('sort')).toEqual([
        [{ sort: 'OPENED', order: 'desc' }],
        [{ sort: 'CASE', order: 'asc' }],
      ]);
    });

    it('keeps « select all » in the phone bar, the header row being hidden', async () => {
      const wrapper = await mount(phoneSelection);
      const box = wrapper.find('[data-testid="phone-sort"] [role="checkbox"]');
      expect(box.attributes('aria-label')).toBe('Select every case shown');
      await box.trigger('click');
      expect(wrapper.emitted('update:selected')?.[0]).toEqual([['case-1', 'case-2', 'case-3']]);
    });

    it('hides the column headers, the cards carrying their labels', async () => {
      const wrapper = await mount();
      expect(wrapper.find('thead').classes()).toContain('max-md:hidden');
    });
  });
});
