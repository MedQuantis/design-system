import { describe, expect, it } from 'vitest';
import { mountInApp } from './support/mount';
import MqStepper from '../../app/components/MqStepper.vue';
import { STEP_SHAPES } from './fixtures/neutral';

type Shape = keyof typeof STEP_SHAPES;
const LABEL = 'Approval';
const mount = (shape: Shape, props: Record<string, unknown> = {}) =>
  mountInApp(MqStepper, { props: { steps: STEP_SHAPES[shape], label: LABEL, ...props } });

type Wrapper = Awaited<ReturnType<typeof mount>>;
const steps = (wrapper: Wrapper) => wrapper.findAll('[data-step]');
const marker = (wrapper: Wrapper, index: number) =>
  steps(wrapper)[index]!.find('[data-testid="step-marker"]');
const title = (wrapper: Wrapper, index: number) =>
  steps(wrapper)[index]!.find('[data-testid="step-title"]');
const detail = (wrapper: Wrapper, index: number) =>
  steps(wrapper)[index]!.find('[data-testid="step-detail"]');

describe('MqStepper', () => {
  it('lists its steps in order, each with its key, state, title and detail, named by its label', async () => {
    const wrapper = await mount('required');
    expect(wrapper.find('ol').attributes('aria-label')).toBe(LABEL);
    expect(
      steps(wrapper).map((s) => [s.attributes('data-step'), s.attributes('data-state')]),
    ).toEqual([
      ['draft', 'current'],
      ['check', 'required'],
      ['close', 'pending'],
    ]);
    expect(title(wrapper, 1).text()).toBe('Checked');
    expect(detail(wrapper, 1).text()).toBe('needed: your confirmation');
  });

  it('fills the current step’s disc in navy with a pale halo and draws its title in navy', async () => {
    const wrapper = await mount('optional');
    const current = wrapper.find('[aria-current="step"]');
    expect(current.attributes('data-step')).toBe('draft');
    expect(marker(wrapper, 0).classes()).toEqual(
      expect.arrayContaining(['bg-(--mq-accent)', 'text-on-accent', 'ring-3']),
    );
    expect(title(wrapper, 0).classes()).toEqual(
      expect.arrayContaining(['text-(--mq-accent)', 'font-medium']),
    );
    expect(wrapper.findAll('[aria-current="step"]')).toHaveLength(1);
  });

  it('draws a done step as a pale disc with its check, the others numbered', async () => {
    const wrapper = await mount('underWay');
    expect(marker(wrapper, 0).classes()).toContain('bg-(--mq-accent-pale)');
    expect(marker(wrapper, 0).find('.iconify').exists()).toBe(true);
    expect(marker(wrapper, 1).text()).toBe('2');
    expect(marker(wrapper, 2).text()).toBe('3');
  });

  it('outlines the steps not reached with muted titles, dashed while optional or skipped', async () => {
    const optional = await mount('optional');
    expect(marker(optional, 1).classes()).toContain('border-dashed');
    expect(marker(optional, 2).classes()).not.toContain('border-dashed');
    expect([1, 2].map((i) => title(optional, i).classes())).toEqual([
      expect.arrayContaining(['text-text-tertiary']),
      expect.arrayContaining(['text-text-tertiary']),
    ]);
    const skipped = await mount('skipped');
    expect(marker(skipped, 1).classes()).toEqual(
      expect.arrayContaining(['border-dashed', 'border-(--mq-border)']),
    );
  });

  it('draws a required step’s detail in the warning tone', async () => {
    const wrapper = await mount('required');
    expect(detail(wrapper, 1).classes()).toContain('text-(--mq-warning)');
    expect(detail(wrapper, 2).classes()).not.toContain('text-(--mq-warning)');
  });

  it('draws the line after a done step in navy, the others in the border colour', async () => {
    const wrapper = await mount('underWay');
    const lines = wrapper.findAll('[data-testid="step-line"]');
    expect(lines.map((l) => l.classes().includes('bg-(--mq-accent)'))).toEqual([true, false]);
  });

  it('draws a short line after every step but the last, midway between the title’s room and the next disc', async () => {
    const wrapper = await mount('optional');
    expect(steps(wrapper).map((s) => s.find('[data-testid="step-line"]').exists())).toEqual([
      true,
      true,
      false,
    ]);
    const lines = wrapper.findAll('[data-testid="step-line"]');
    expect(lines[0]!.attributes('aria-hidden')).toBe('true');
    expect(lines[0]!.classes()).toEqual(expect.arrayContaining(['absolute', 'w-8', 'h-px']));
    // From the end of the title's room (disc 1.375rem, gap 0.5rem, title 5.5rem) to the next
    // disc (the slot's end), less half the line; its middle level with the discs' middle.
    expect(lines[1]!.attributes('style')).toContain(
      'left: calc((100% + 7.375rem - 0px) / 2 - 1rem)',
    );
    expect(lines[0]!.classes()).toContain('top-[calc(0.6875rem-0.5px)]');
  });

  it('counts a current next disc’s halo as part of it', async () => {
    const wrapper = await mount('underWay');
    const lines = wrapper.findAll('[data-testid="step-line"]').map((l) => l.attributes('style'));
    expect(lines[0]).toContain('left: calc((100% + 7.375rem - 3px) / 2 - 1rem)');
    expect(lines[1]).toContain('left: calc((100% + 7.375rem - 0px) / 2 - 1rem)');
  });

  it('gives a title its room before the line, and a detail a longer one, up to the next disc', async () => {
    const wrapper = await mount('optional');
    expect(title(wrapper, 0).classes()).toContain('max-w-22');
    expect(detail(wrapper, 0).classes()).toContain('max-w-[calc(100%-0.5rem)]');
    expect(detail(wrapper, 0).classes()).not.toContain('max-w-22');
    expect(detail(wrapper, 0).classes()).not.toContain('hyphens-auto');
    // The last step has no line after it: its label takes its whole slot.
    expect(title(wrapper, 2).classes()).not.toContain('max-w-22');
    expect(detail(wrapper, 2).classes()).not.toContain('max-w-[calc(100%-0.5rem)]');
  });

  it('every step done: no current step', async () => {
    const wrapper = await mount('done');
    expect(steps(wrapper).map((s) => s.attributes('data-state'))).toEqual(['done', 'done', 'done']);
    expect(wrapper.find('[aria-current="step"]').exists()).toBe(false);
  });

  it('keeps each step in a fixed slot from sm up, stacks them on a phone, and wraps a detail', async () => {
    const wrapper = await mount('optional');
    const list = wrapper.find('ol');
    expect(list.classes()).toEqual(expect.arrayContaining(['grid-cols-1']));
    expect(list.attributes('style')).toContain('--stepper-columns: repeat(3, minmax(0, 1fr))');
    expect(detail(wrapper, 0).classes()).not.toContain('truncate');
  });

  it('gives as many slots as steps', async () => {
    const two = STEP_SHAPES.optional.slice(0, 2);
    const wrapper = await mountInApp(MqStepper, { props: { steps: two, label: LABEL } });
    expect(steps(wrapper)).toHaveLength(2);
    expect(wrapper.find('ol').attributes('style')).toContain(
      '--stepper-columns: repeat(2, minmax(0, 1fr))',
    );
  });

  it('leaves the detail line out when a step has none', async () => {
    const [first] = STEP_SHAPES.optional;
    const wrapper = await mountInApp(MqStepper, {
      props: { steps: [{ key: first.key, title: first.title, state: first.state }], label: LABEL },
    });
    expect(detail(wrapper, 0).exists()).toBe(false);
  });
});
