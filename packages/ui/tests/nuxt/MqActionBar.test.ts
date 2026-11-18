import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, type Component } from 'vue';
import { mountInApp } from './support/mount';
import MqActionBar from '../../app/components/MqActionBar.vue';
import { ACTS } from './fixtures/neutral';

const mount = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) =>
  mountInApp(MqActionBar, {
    props: { actions: ACTS, ...props },
    slots: slots as Record<string, () => unknown>,
  });
type Wrapper = Awaited<ReturnType<typeof mount>>;
const buttons = (wrapper: Wrapper) =>
  wrapper.findAll('button').map((b) => [b.text(), b.attributes('disabled') !== undefined]);
const button = (wrapper: Wrapper, label: string) =>
  wrapper.findAll('button').find((b) => b.text() === label)!;

describe('MqActionBar', () => {
  it('draws its acts in the order given, the main act last', async () => {
    const wrapper = await mount();
    expect(buttons(wrapper)).toEqual([
      ['Ask someone', false],
      ['Return', false],
      ['Archive', true],
      ['Delete', false],
      ['Save', false],
      ['Approve', false],
    ]);
  });

  it('draws each variant: primary solid, secondary outlined, ghost plain', async () => {
    const wrapper = await mount();
    const variant = (label: string) => button(wrapper, label).attributes('data-variant');
    expect([variant('Approve'), variant('Save'), variant('Ask someone')]).toEqual([
      'primary',
      'secondary',
      'ghost',
    ]);
    expect(button(wrapper, 'Approve').classes().join(' ')).toContain('bg-primary');
    expect(button(wrapper, 'Save').classes().join(' ')).toContain('ring');
  });

  it('draws a dangerous act outlined in the danger colour, with its icon', async () => {
    const wrapper = await mount();
    const danger = button(wrapper, 'Delete');
    expect(danger.attributes('data-variant')).toBe('danger');
    expect(danger.classes().join(' ')).toContain('text-error');
    expect(danger.classes().join(' ')).toContain('ring-error');
    expect(danger.classes()).not.toContain('bg-error'); // an outline: no solid fill
    expect(danger.find('.iconify').exists()).toBe(true);
    expect(button(wrapper, 'Save').find('.iconify').exists()).toBe(false);
  });

  it('never shows a dangerous act loading while busy, only disabled', async () => {
    const wrapper = await mount({ busy: true });
    const danger = button(wrapper, 'Delete');
    expect(danger.attributes('disabled')).toBeDefined();
    expect(danger.find('.animate-spin').exists()).toBe(false);
  });

  it('gives every act the same minimum width, its label centred, a longer label wider', async () => {
    const wrapper = await mount(
      {},
      {
        'popover-return': ({ trigger }: { trigger: Component }) => h('div', [h(trigger)]),
      },
    );
    for (const b of wrapper.findAll('button')) {
      expect(b.classes()).toEqual(expect.arrayContaining(['min-w-32', 'justify-center']));
    }
  });

  it('emits act with the key of the act clicked', async () => {
    const wrapper = await mount();
    await button(wrapper, 'Save').trigger('click');
    await button(wrapper, 'Approve').trigger('click');
    expect(wrapper.emitted('act')).toEqual([['save'], ['approve']]);
  });

  it('disables a refused act and says its reason once under the acts', async () => {
    const twice = [
      ...ACTS,
      {
        key: 'purge',
        label: 'Purge',
        variant: 'secondary',
        disabled: true,
        reason: ACTS[2].reason,
      },
    ];
    const wrapper = await mount({ actions: twice });
    await button(wrapper, 'Archive').trigger('click');
    expect(wrapper.emitted('act')).toBeUndefined();
    const reasons = wrapper.findAll('[data-testid="refusal"]').map((p) => p.text());
    expect(reasons).toEqual(['Only the owner may archive']);
  });

  it('says no reason when every act is allowed', async () => {
    const wrapper = await mount({ actions: ACTS.filter((a) => a.key !== 'archive') });
    expect(wrapper.find('[data-testid="refusal"]').exists()).toBe(false);
  });

  it('says a blocking note beside the acts, its link emitting note', async () => {
    const wrapper = await mount({ note: { text: 'Two errors block saving', link: 'Show' } });
    const note = wrapper.find('[data-testid="acts-note"]');
    expect(note.text().replace(/\s+/g, ' ')).toBe('Two errors block saving · Show');
    expect(note.classes().join(' ')).toContain('--mq-danger');
    // In the acts' row, before them.
    expect(note.element.nextElementSibling?.querySelector('button')?.textContent?.trim()).toBe(
      'Ask someone',
    );
    await note.find('button').trigger('click');
    expect(wrapper.emitted('note')).toEqual([[]]);
    expect(wrapper.emitted('act')).toBeUndefined();
  });

  it('draws a disabled act faded, as the prototype does', async () => {
    const wrapper = await mount();
    expect(button(wrapper, 'Archive').classes()).toContain('disabled:opacity-45');
  });

  it('wraps an act with a tooltip so it still says it while disabled', async () => {
    const acts = ACTS.map((act) =>
      act.key === 'archive' ? { ...act, tooltip: 'Fix the errors to archive.' } : act,
    );
    const wrapper = await mount({ actions: acts });
    const tooltips = wrapper.findAllComponents({ name: 'UTooltip' });
    expect(tooltips.map((t) => t.props('text'))).toEqual(['Fix the errors to archive.']);
    const archive = button(wrapper, 'Archive');
    expect(archive.attributes('disabled')).toBeDefined();
    // A disabled button fires no pointer event: the wrapper takes the hover.
    expect(archive.element.parentElement?.getAttribute('data-testid')).toBe('act-tooltip');
  });

  it('says no note when none is given', async () => {
    const wrapper = await mount();
    expect(wrapper.find('[data-testid="acts-note"]').exists()).toBe(false);
  });

  it('disables every act while busy, the main act loading', async () => {
    const wrapper = await mount({ busy: true });
    expect(buttons(wrapper).every(([, disabled]) => disabled)).toBe(true);
    expect(button(wrapper, 'Approve').find('.animate-spin').exists()).toBe(true);
    expect(button(wrapper, 'Save').find('.animate-spin').exists()).toBe(false);
  });

  it('hands an act with a popover to its slot, with its button as the trigger, and emits nothing itself', async () => {
    const wrapper = await mount(
      {},
      {
        'popover-return': ({ trigger, disabled }: { trigger: Component; disabled: boolean }) =>
          h('div', { 'data-testid': 'return-popover', 'data-disabled': String(disabled) }, [
            h(trigger),
          ]),
      },
    );
    const holder = wrapper.find('[data-testid="return-popover"]');
    expect(holder.exists()).toBe(true);
    expect(holder.attributes('data-disabled')).toBe('false');
    expect(holder.find('button').text()).toBe('Return');
    await holder.find('button').trigger('click');
    expect(wrapper.emitted('act')).toBeUndefined();
  });

  it('keeps a popover act’s button disabled while busy, the popover itself left to its act', async () => {
    const wrapper = await mount(
      { busy: true },
      {
        'popover-ask': ({ trigger, disabled }: { trigger: Component; disabled: boolean }) =>
          h('div', { 'data-testid': 'ask-popover', 'data-disabled': String(disabled) }, [
            h(trigger),
          ]),
      },
    );
    const holder = wrapper.find('[data-testid="ask-popover"]');
    expect(holder.attributes('data-disabled')).toBe('false');
    expect(holder.find('button').attributes('disabled')).toBeDefined();
  });
});

// Below 768px (the design system's phone breakpoint) the bar keeps the main act and the
// pinned ones in view and folds the others behind « more », which grows the bar upwards.
describe('MqActionBar on a phone', () => {
  const onPhone = (matches: boolean) =>
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  afterEach(() => vi.unstubAllGlobals());

  const PHONE_ACTS = ACTS.map((act) => (act.key === 'save' ? { ...act, pinned: true } : act));
  const phone = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) => {
    onPhone(true);
    return mount({ actions: PHONE_ACTS, moreLabel: 'Other acts', ...props }, slots);
  };
  const more = (wrapper: Wrapper) => wrapper.find('[data-testid="more-acts"]');
  const tray = (wrapper: Wrapper) => wrapper.find('[data-testid="acts-tray"]');
  const labels = (wrapper: Wrapper) => wrapper.findAll('button').map((b) => b.text());

  it('keeps the main act and the pinned ones in view, the others folded behind « more »', async () => {
    const wrapper = await phone();
    expect(more(wrapper).exists()).toBe(true);
    expect(more(wrapper).attributes('aria-label')).toBe('Other acts');
    expect(more(wrapper).attributes('aria-expanded')).toBe('false');
    expect(labels(wrapper)).toEqual(['', 'Save', 'Approve']);
    expect(tray(wrapper).exists()).toBe(false);
  });

  it('spans the width it is given, so the row acts share it rather than shrink under their labels', async () => {
    const wrapper = await phone();
    expect(wrapper.classes()).toContain('w-full');
  });

  it('grows the bar upwards with the folded acts, two by two, and folds it again', async () => {
    const wrapper = await phone();
    await more(wrapper).trigger('click');
    expect(more(wrapper).attributes('aria-expanded')).toBe('true');
    expect(tray(wrapper).attributes('id')).toBe(more(wrapper).attributes('aria-controls'));
    expect(tray(wrapper).classes()).toContain('grid-cols-2');
    expect(
      tray(wrapper)
        .findAll('button')
        .map((b) => b.text()),
    ).toEqual(['Ask someone', 'Return', 'Archive', 'Delete']);
    // The tray sits above the bar's own row.
    const order = [
      ...wrapper.element.querySelectorAll('[data-testid="acts-tray"], [data-testid="more-acts"]'),
    ];
    expect(order.map((e) => e.getAttribute('data-testid'))).toEqual(['acts-tray', 'more-acts']);
    await more(wrapper).trigger('click');
    expect(tray(wrapper).exists()).toBe(false);
  });

  it('says a folded act’s refusal in the tray', async () => {
    const wrapper = await phone();
    await more(wrapper).trigger('click');
    expect(wrapper.find('[data-testid="refusal"]').text()).toBe('Only the owner may archive');
  });

  it('emits a folded act and folds the bar', async () => {
    const wrapper = await phone();
    await more(wrapper).trigger('click');
    await tray(wrapper)
      .findAll('button')
      .find((b) => b.text() === 'Delete')!
      .trigger('click');
    expect(wrapper.emitted('act')).toEqual([['delete']]);
    expect(tray(wrapper).exists()).toBe(false);
  });

  it('hands a folded popover act to its slot, its trigger in the tray', async () => {
    const wrapper = await phone(
      {},
      {
        'popover-return': ({ trigger }: { trigger: Component }) =>
          h('div', { 'data-testid': 'return-popover' }, [h(trigger)]),
      },
    );
    await more(wrapper).trigger('click');
    expect(tray(wrapper).find('[data-testid="return-popover"] button').text()).toBe('Return');
  });

  it('tells a popover slot whether the bar is in its phone layout, for a sheet there', async () => {
    const seen: boolean[] = [];
    const slots = {
      'popover-return': ({ trigger, phone }: { trigger: Component; phone: boolean }) => {
        seen.push(phone);
        return h(trigger);
      },
    };
    // The layout is read once mounted, so only the renders from the tray on count.
    const onIt = await phone({}, slots);
    seen.length = 0;
    await more(onIt).trigger('click');
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(Boolean)).toBe(true);

    seen.length = 0;
    onPhone(false);
    await mount({ actions: PHONE_ACTS, moreLabel: 'Other acts' }, slots);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.some(Boolean)).toBe(false);
  });

  it('says a blocking note above the row on a phone, its link still emitting note', async () => {
    const wrapper = await phone({ note: { text: 'Two errors block saving', link: 'Show' } });
    const note = wrapper.find('[data-testid="acts-note"]');
    expect(note.text().replace(/\s+/g, ' ')).toBe('Two errors block saving · Show');
    const order = [
      ...wrapper.element.querySelectorAll('[data-testid="acts-note"], [data-testid="more-acts"]'),
    ];
    expect(order.map((e) => e.getAttribute('data-testid'))).toEqual(['acts-note', 'more-acts']);
    await note.find('button').trigger('click');
    expect(wrapper.emitted('note')).toEqual([[]]);
  });

  it('draws no « more » when nothing is folded', async () => {
    const wrapper = await phone({
      actions: PHONE_ACTS.filter((act) => act.variant === 'primary' || act.key === 'save'),
    });
    expect(more(wrapper).exists()).toBe(false);
    expect(labels(wrapper)).toEqual(['Save', 'Approve']);
  });

  it('folds nothing when no act would stay in the row', async () => {
    const wrapper = await phone({ actions: [ACTS[1], ACTS[3]] });
    expect(more(wrapper).exists()).toBe(false);
    expect(labels(wrapper)).toEqual(['Return', 'Delete']);
  });

  it('lays the acts out in one row above the phone breakpoint, as before', async () => {
    onPhone(false);
    const wrapper = await mount({ actions: PHONE_ACTS, moreLabel: 'Other acts' });
    expect(more(wrapper).exists()).toBe(false);
    expect(labels(wrapper)).toEqual([
      'Ask someone',
      'Return',
      'Archive',
      'Delete',
      'Save',
      'Approve',
    ]);
  });
});
