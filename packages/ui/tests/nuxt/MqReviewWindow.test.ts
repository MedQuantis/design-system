import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { mountInApp } from './support/mount';
import MqReviewWindow from '../../app/components/MqReviewWindow.vue';
import { WINDOW_LABELS, WINDOW_SECTIONS, WINDOW_TABS } from './fixtures/neutral';

const base = {
  open: true,
  title: 'A case',
  tabs: WINDOW_TABS,
  sections: WINDOW_SECTIONS,
  ...WINDOW_LABELS,
  positionLabel: (n: string, total: string) => `${n} / ${total}`,
  positionSpokenLabel: (n: string, total: string) => `case ${n} of ${total}`,
};
const FILLED: Record<string, () => unknown> = {
  title: () => h('span', { 'data-testid': 'my-title' }, 'Case A'),
  subtitle: () => h('span', { 'data-testid': 'my-subtitle' }, 'Two items'),
  badges: () => h('span', { 'data-testid': 'my-badge' }, 'Badge'),
  stepper: () => h('span', { 'data-testid': 'my-stepper' }, 'Steps'),
  context: () => h('p', { 'data-testid': 'my-context' }, 'The problem'),
  'tab-text': () => h('p', { 'data-testid': 'tab-text' }, 'The text'),
  'tab-log': () => h('p', { 'data-testid': 'tab-log' }, 'The log'),
  banner: () => h('p', { 'data-testid': 'my-banner' }, 'Heads up'),
  'section-proposal': () => h('p', { 'data-testid': 'proposal' }, 'Two codes'),
  'digest-proposal': () => 'A1 · B2',
  'section-decision': () => h('p', { 'data-testid': 'decision' }, 'A form'),
  'section-change': () => h('p', { 'data-testid': 'change' }, 'Before and after'),
  'digest-change': () => 'one code',
  footer: () => h('button', { 'data-testid': 'my-act' }, 'Approve'),
};
const without = (key: string): Record<string, () => unknown> =>
  Object.fromEntries(Object.entries(FILLED).filter(([name]) => name !== key));

const mount = (
  props: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = FILLED,
) =>
  mountInApp(MqReviewWindow, {
    props: { ...base, ...props },
    slots,
    attachTo: document.body,
  });
const $ = (selector: string) => document.body.querySelector(selector);
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)];
const button = (label: string) => $(`button[aria-label="${label}"]`) as HTMLButtonElement;
const sectionTitles = () =>
  [...$('ol[aria-label="Steps of the decision"]')!.querySelectorAll('h3')].map((t) =>
    t.textContent?.replace(/\s+/g, ' ').trim(),
  );

// Each window is unmounted after its test (tests/nuxt/support/setup.ts).
afterEach(() => vi.unstubAllGlobals());

describe('MqReviewWindow', () => {
  it('heads the window in three lines: the title and the queue, the subtitle, the badges facing the stepper', async () => {
    await mount();
    expect($('[data-testid="header-title"] [data-testid="my-title"]')).not.toBeNull();
    expect($('[data-testid="header-subtitle"] [data-testid="my-subtitle"]')).not.toBeNull();
    const badges = $('[data-testid="header-badges"]')!;
    expect(badges.querySelector('[data-testid="my-badge"]')).not.toBeNull();
    expect(
      badges.querySelector('[data-testid="header-steps"] [data-testid="my-stepper"]'),
    ).not.toBeNull();
  });

  it('centres the stepper’s middle disc on the header from xl up, the badges at its left', async () => {
    await mount();
    const line = $('[data-testid="header-badges"]')!;
    expect([...line.classList]).toEqual(
      expect.arrayContaining(['xl:grid', 'xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]']),
    );
    // A 40rem stepper of three equal slots: its middle disc's centre lies 40rem / 3 + 0.6875rem
    // into it; shifted by half its width less that, the disc falls on the header's midpoint.
    expect([...$('[data-testid="header-steps"]')!.classList]).toEqual(
      expect.arrayContaining([
        'xl:col-start-2',
        'xl:justify-self-center',
        'xl:translate-x-[calc(20rem-40rem/3-0.6875rem)]',
      ]),
    );
  });

  it('navigates the queue: previous, the place, next, close, named by their labels', async () => {
    const wrapper = await mount({
      hasPrevious: true,
      hasNext: false,
      position: { index: 2, total: 1234 },
    });
    expect($('[role="group"][aria-label="Queue"]')).not.toBeNull();
    expect(button('Previous').disabled).toBe(false);
    expect(button('Next').disabled).toBe(true);
    const place = $('[data-testid="queue-position"]')!;
    expect(place.querySelector('[aria-hidden="true"]')?.textContent).toBe("3 / 1'234");
    expect(place.querySelector('.sr-only')?.textContent).toBe("case 3 of 1'234");
    button('Previous').click();
    button('Close').click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('previous')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
  });

  it('puts the header controls on the title line, before the queue', async () => {
    await mount(
      {},
      { ...FILLED, controls: () => h('label', { 'data-testid': 'my-control' }, 'Expert') },
    );
    const control = $('[data-testid="header-title"] [data-testid="my-control"]')!;
    expect(control).not.toBeNull();
    const queue = $('[role="group"][aria-label="Queue"]')!;
    expect(control.compareDocumentPosition(queue) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('draws no controls without their slot', async () => {
    await mount();
    expect($('[data-testid="header-controls"]')).toBeNull();
  });

  it('says « not in the list » when the item is outside the queue', async () => {
    await mount({ position: null });
    expect($('[data-testid="queue-position"]')?.textContent?.trim()).toBe('not in the list');
  });

  it('says nothing of the place while the queue is unread', async () => {
    await mount({ position: undefined });
    expect($('[data-testid="queue-position"]')).toBeNull();
  });

  it('lays the body in two panes stacking below lg: context and tabs left, banner and sections right', async () => {
    await mount();
    const panes = $('[data-testid="window-panes"]')!;
    expect([...panes.classList]).toEqual(expect.arrayContaining(['grid', 'lg:grid-cols-2']));
    const [left, right] = [...panes.children];
    expect(left!.querySelector('[data-testid="my-context"]')).not.toBeNull();
    expect(left!.querySelector('[role="tablist"]')).not.toBeNull();
    expect(right!.querySelector('[data-testid="my-banner"]')).not.toBeNull();
  });

  it('parts the panes with a light rule: in the middle side by side, under the left pane stacked', async () => {
    await mount();
    const [left, right] = [...$('[data-testid="window-panes"]')!.children];
    expect([...left!.classList]).toEqual(
      expect.arrayContaining([
        'border-(--mq-border-light)',
        'border-b',
        'pb-6',
        'lg:border-b-0',
        'lg:border-e',
        'lg:pb-0',
        'lg:pe-6',
      ]),
    );
    expect([...right!.classList]).toContain('lg:ps-6');
    expect([...$('[data-testid="window-panes"]')!.classList]).toContain('lg:gap-0');
  });

  it('holds the screen’s height from lg, the body still and each pane scrolling in its own frame', async () => {
    await mount({ tab: 'text' });
    expect([...$('[role="dialog"]')!.classList]).toContain('lg:h-[calc(100dvh-4rem)]');
    const panes = $('[data-testid="window-panes"]')!;
    expect([...panes.parentElement!.classList]).toEqual(
      expect.arrayContaining(['lg:min-h-0', 'lg:overflow-hidden']),
    );
    expect([...panes.classList]).toEqual(
      expect.arrayContaining(['lg:h-full', 'lg:grid-rows-[minmax(0,1fr)]']),
    );
    const [left, right] = [...panes.children];
    expect([...left!.classList]).toContain('lg:min-h-0');
    expect([...right!.classList]).toEqual(
      expect.arrayContaining(['lg:min-h-0', 'lg:overflow-y-auto']),
    );
    expect(right!.getAttribute('data-testid')).toBe('pane-side');
  });

  it('keeps the context and the tab bar fixed above the tab’s own scroll frame', async () => {
    await mount({ tab: 'text' });
    const [left] = [...$('[data-testid="window-panes"]')!.children];
    const frame = left!.querySelector('[data-testid="pane-tab-frame"]')!;
    expect([...frame.classList]).toEqual(
      expect.arrayContaining(['lg:min-h-0', 'lg:flex-1', 'lg:overflow-y-auto']),
    );
    expect(frame.querySelector('[data-testid="tab-text"]')).not.toBeNull();
    expect(frame.querySelector('[role="tablist"]')).toBeNull();
    expect(frame.querySelector('[data-testid="my-context"]')).toBeNull();
    const context = left!.querySelector('[data-testid="pane-context"]')!;
    expect(context.querySelector('[data-testid="my-context"]')).not.toBeNull();
    expect([...context.classList]).toContain('shrink-0');
  });

  it('shows the chosen tab’s slot, the tab a model', async () => {
    const wrapper = await mount({ tab: 'text' });
    expect($('[data-testid="tab-text"]')).not.toBeNull();
    expect($('[data-testid="tab-log"]')).toBeNull();
    await wrapper.setProps({ tab: 'log' });
    expect($('[data-testid="tab-log"]')).not.toBeNull();
    expect($$('[role="tab"]').map((t) => t.textContent?.trim())).toEqual(['Text', 'Log 3']);
  });

  it('draws the screen’s controls at the tab bar’s right, on the tabs’ own line', async () => {
    await mount(
      { tab: 'text' },
      {
        ...FILLED,
        'tabs-trailing': () => h('span', { 'data-testid': 'my-trailing' }, 'One Two'),
      },
    );
    const list = $('[role="tablist"]')!;
    const trailing = $('[data-testid="tabs-trailing"]')!;
    expect(trailing.querySelector('[data-testid="my-trailing"]')).not.toBeNull();
    // Beside the tab list, not in it: a tab list holds tabs only.
    expect(list.contains(trailing)).toBe(false);
    expect(trailing.parentElement!.contains(list)).toBe(true);
    expect([...trailing.classList]).toEqual(expect.arrayContaining(['absolute', 'end-0']));
  });

  it('draws nothing at the tab bar’s right without its slot', async () => {
    await mount({ tab: 'text' });
    expect($('[data-testid="tabs-trailing"]')).toBeNull();
  });

  it('numbers the sections in order, named by the sections label', async () => {
    await mount();
    expect(sectionTitles()).toEqual(['1 Proposal', '2 Your decision', '3 The change']);
  });

  it('leaves out a section whose slot is not filled, and numbers the others afresh', async () => {
    await mount({}, without('section-decision'));
    expect(sectionTitles()).toEqual(['1 Proposal', '2 The change']);
  });

  it('draws an untitled section as its slot alone, with no heading or number', async () => {
    await mount({
      sections: [{ key: 'decision' }, { key: 'change', title: 'The change' }],
    });
    const steps = $('ol[aria-label="Steps of the decision"]')!;
    expect(steps.querySelector('[data-testid="decision"]')).not.toBeNull();
    expect(sectionTitles()).toEqual(['1 The change']);
    expect(steps.querySelectorAll('li')).toHaveLength(2);
  });

  it('folds a foldable section as a native details, open by default, its digest beside the title once folded', async () => {
    await mount();
    const details = $$('ol[aria-label="Steps of the decision"] details') as HTMLDetailsElement[];
    expect(details).toHaveLength(2);
    expect(details.every((d) => d.open)).toBe(true);
    expect($('[data-testid="section-digest"]')).toBeNull();
    details[0]!.open = false;
    details[0]!.dispatchEvent(new Event('toggle'));
    await new Promise((resolve) => setTimeout(resolve));
    expect($('[data-testid="section-digest"]')?.textContent?.trim()).toBe('A1 · B2');
  });

  it('draws the footer when its slot is filled', async () => {
    await mount();
    expect($('[data-testid="my-act"]')).not.toBeNull();
  });

  it('draws no footer without its slot', async () => {
    await mount({}, without('footer'));
    expect($('[data-testid="my-act"]')).toBeNull();
  });

  it('while loading: a skeleton for the title and the body, no subtitle, badges or panes', async () => {
    await mount({ loading: true });
    expect($('[data-testid="header-title"] [data-testid="my-title"]')).toBeNull();
    expect($('[data-testid="modal-loading"]')).not.toBeNull();
    expect($('[data-testid="header-subtitle"]')).toBeNull();
    expect($('[data-testid="window-panes"]')).toBeNull();
  });

  it('is named by its visible title, a heading above its sections', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount();
    const name = document.getElementById($('[role="dialog"]')!.getAttribute('aria-labelledby')!);
    expect(name?.tagName).toBe('H2');
    expect(name?.querySelector('[data-testid="my-title"]')).not.toBeNull();
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/DialogTitle/);
    warn.mockRestore();
  });

  it('keeps its name while loading, the title prop read out beside the skeleton', async () => {
    await mount({ loading: true });
    const name = document.getElementById($('[role="dialog"]')!.getAttribute('aria-labelledby')!);
    expect(name?.textContent?.trim()).toBe('A case');
    expect(name?.querySelector('.sr-only')).not.toBeNull();
  });

  it('fills the screen on a phone, so its footer stays at the screen’s foot', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    await mount();
    expect($('[data-testid="review-window"]')?.getAttribute('data-fullscreen')).toBe('true');
  });
});
