import { describe, expect, it } from 'vitest';
import { mountInApp } from './support/mount';
import MqFilterSelect from '../../app/components/MqFilterSelect.vue';
import { FILTER_GROUPS, FILTER_OPTIONS } from './fixtures/neutral';

const options = (): Element[] => [...document.body.querySelectorAll('[role="option"]')];
const labels = (): (string | undefined)[] =>
  options().map((o) => o.textContent?.replace(/\s+/g, ' ').trim());

describe('MqFilterSelect', () => {
  it('shows its label inside the field, beside the value, and names the field by it', async () => {
    const wrapper = await mountInApp(MqFilterSelect, {
      props: { modelValue: null, label: 'Colour', allLabel: 'All', options: FILTER_OPTIONS },
    });
    const leading = wrapper.element.querySelector('[data-slot="leading"]');
    const value = wrapper.element.querySelector('[data-slot="value"]');
    expect(leading?.textContent?.trim()).toBe('Colour');
    expect(value?.textContent).toContain('All');
    expect(leading?.contains(value!)).toBe(false);
    expect(leading?.classList.contains('absolute')).toBe(false);
    expect(wrapper.find('[aria-label="Colour"]').exists()).toBe(true);
  });

  it('lists « all » first, then each option with its count after its label', async () => {
    await mountInApp(MqFilterSelect, {
      props: {
        modelValue: null,
        label: 'Colour',
        allLabel: 'All',
        options: FILTER_OPTIONS,
        defaultOpen: true,
      },
    });
    expect(labels()).toEqual(['All', 'Red 12', 'Green 0', "Blue 1'234"]);
  });

  it('ends each option with its count, right-aligned in mono with aligned figures', async () => {
    await mountInApp(MqFilterSelect, {
      props: {
        modelValue: null,
        label: 'Colour',
        allLabel: 'All',
        options: FILTER_OPTIONS,
        defaultOpen: true,
      },
    });
    const blue = options().find((o) => o.textContent?.includes('Blue'))!;
    const count = blue.querySelector('[data-testid="option-count"]')!;
    expect(count.textContent).toBe("1'234");
    expect([...count.classList]).toEqual(
      expect.arrayContaining(['ms-auto', 'font-mono', 'tabular-nums']),
    );
    expect(options()[0]!.querySelector('[data-testid="option-count"]')).toBeNull();
  });

  it('reserves the check mark’s room on every option, so the counts stay in one column', async () => {
    await mountInApp(MqFilterSelect, {
      props: {
        modelValue: 'red',
        label: 'Colour',
        allLabel: 'All',
        options: FILTER_OPTIONS,
        defaultOpen: true,
      },
    });
    for (const option of options()) {
      const trailing = option.querySelector('[data-slot="itemTrailing"]')!;
      expect([...trailing.classList]).toEqual(expect.arrayContaining(['w-5', 'shrink-0']));
    }
  });

  it('mutes an option at zero', async () => {
    await mountInApp(MqFilterSelect, {
      props: {
        modelValue: null,
        label: 'Colour',
        allLabel: 'All',
        options: FILTER_OPTIONS,
        defaultOpen: true,
      },
    });
    const green = options().find((o) => o.textContent?.includes('Green'));
    const red = options().find((o) => o.textContent?.includes('Red'));
    expect(green?.querySelector('[data-empty="true"]')).not.toBeNull();
    expect(red?.querySelector('[data-empty="true"]')).toBeNull();
  });

  it('shows the count of « all » when given', async () => {
    await mountInApp(MqFilterSelect, {
      props: {
        modelValue: null,
        label: 'Colour',
        allLabel: 'All',
        allCount: 1246,
        options: FILTER_OPTIONS,
        defaultOpen: true,
      },
    });
    expect(labels()[0]).toBe("All 1'246");
  });

  it('separates options given in groups, « all » in a group of its own', async () => {
    await mountInApp(MqFilterSelect, {
      props: {
        modelValue: null,
        label: 'Colour',
        allLabel: 'All',
        options: FILTER_GROUPS,
        defaultOpen: true,
      },
    });
    expect(labels()).toEqual([
      'All',
      'Warm colours 12',
      "Cool colours 1'234",
      'Red 12',
      'Green 0',
      "Blue 1'234",
    ]);
    expect(document.body.querySelectorAll('[data-slot="group"]')).toHaveLength(3);
    const viewport = document.body.querySelector('[data-slot="viewport"]');
    expect(viewport?.className).toMatch(/(^|\s)divide-y(\s|$)/);
  });

  it('places « all » where the caller puts it, among the first group’s options', async () => {
    await mountInApp(MqFilterSelect, {
      props: {
        modelValue: null,
        label: 'Colour',
        allLabel: 'All',
        allIndex: 1,
        options: FILTER_GROUPS,
        defaultOpen: true,
      },
    });
    expect(labels()).toEqual([
      'Warm colours 12',
      'All',
      "Cool colours 1'234",
      'Red 12',
      'Green 0',
      "Blue 1'234",
    ]);
    expect(document.body.querySelectorAll('[data-slot="group"]')).toHaveLength(2);
  });

  it('places « all » where the caller puts it in a flat list', async () => {
    await mountInApp(MqFilterSelect, {
      props: {
        modelValue: null,
        label: 'Colour',
        allLabel: 'All',
        allIndex: 2,
        options: FILTER_OPTIONS,
        defaultOpen: true,
      },
    });
    expect(labels()).toEqual(['Red 12', 'Green 0', 'All', "Blue 1'234"]);
  });

  it('shows the chosen option’s count on the closed trigger when asked, beside its value', async () => {
    const counted = await mountInApp(MqFilterSelect, {
      props: {
        modelValue: 'blue',
        label: 'Colour',
        allLabel: 'All',
        options: FILTER_OPTIONS,
        triggerCount: true,
      },
    });
    expect(counted.find('[data-slot="value"]').text()).toBe('Blue');
    const count = counted.find('[data-testid="trigger-count"]');
    expect(count.text()).toBe("1'234");
    expect([...count.classes()]).toEqual(expect.arrayContaining(['font-mono', 'tabular-nums']));
    const all = await mountInApp(MqFilterSelect, {
      props: {
        modelValue: null,
        label: 'Colour',
        allLabel: 'All',
        allCount: 1246,
        options: FILTER_OPTIONS,
        triggerCount: true,
      },
    });
    expect(all.find('[data-slot="value"]').text()).toBe('All');
    expect(all.find('[data-testid="trigger-count"]').text()).toBe("1'246");
    const plain = await mountInApp(MqFilterSelect, {
      props: { modelValue: 'blue', label: 'Colour', allLabel: 'All', options: FILTER_OPTIONS },
    });
    expect(plain.find('[data-testid="trigger-count"]').exists()).toBe(false);
  });

  it('shows the chosen option, emits its value, and emits null for « all »', async () => {
    const wrapper = await mountInApp(MqFilterSelect, {
      props: { modelValue: 'blue', label: 'Colour', allLabel: 'All', options: FILTER_OPTIONS },
    });
    expect(wrapper.find('[data-slot="value"]').text()).toBe('Blue');
    const menu = wrapper.findComponent({ name: 'USelectMenu' });
    menu.vm.$emit('update:modelValue', 'red');
    menu.vm.$emit('update:modelValue', 'ALL');
    expect(wrapper.emitted('update:modelValue')).toEqual([['red'], [null]]);
  });
});
