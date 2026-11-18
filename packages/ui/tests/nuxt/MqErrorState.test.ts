import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountInApp } from './support/mount';
import MqErrorState from '../../app/components/MqErrorState.vue';
import { ERROR_ACTION, ERROR_STATES, ERROR_STILL_DOWN } from './fixtures/neutral';

const { notFound, unavailable, unexpected } = ERROR_STATES;

describe('MqErrorState', () => {
  it('draws each kind as a card with its state, tone, icon and eyebrow', async () => {
    const looks = {
      notFound: ['not-found', 'neutral', 'search-x', 'text-(--mq-tertiary)'],
      unavailable: ['unavailable', 'warning', 'cloud-off', 'text-(--mq-warning)'],
      unexpected: ['unexpected', 'danger', 'triangle-alert', 'text-(--mq-danger)'],
    } as const;
    for (const state of [notFound, unavailable, unexpected]) {
      const wrapper = await mountInApp(MqErrorState, {
        props: { ...state, action: ERROR_ACTION },
      });
      const [name, tone, icon, eyebrowTone] = looks[state.kind];
      const card = wrapper.find('[data-testid="error-card"]');
      expect(card.attributes('data-state'), state.kind).toBe(name);
      expect(card.attributes('data-tone'), state.kind).toBe(tone);
      expect(card.classes()).toContain('max-w-140');
      expect(card.html()).toContain(icon);
      const eyebrow = card.find('[data-testid="error-eyebrow"]');
      expect(eyebrow.text()).toBe(state.eyebrow);
      expect(eyebrow.classes()).toContain(eyebrowTone);
      expect(card.find('h2').text()).toBe(state.title);
      expect(card.text()).toContain(state.description);
    }
  });

  it('shows the asked address on the not-found kind only', async () => {
    const found = await mountInApp(MqErrorState, { props: { ...notFound, action: ERROR_ACTION } });
    expect(found.find('[data-testid="error-path"]').text()).toBe('/items/unknown-key');
    const other = await mountInApp(MqErrorState, {
      props: { ...unexpected, path: '/items/unknown-key', action: ERROR_ACTION },
    });
    expect(other.find('[data-testid="error-path"]').exists()).toBe(false);
  });

  it('frames the request id with its label and a copy button on the unexpected kind only', async () => {
    let written = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => void (written = text) },
    });
    const wrapper = await mountInApp(MqErrorState, {
      props: { ...unexpected, action: ERROR_ACTION },
    });
    const frame = wrapper.find('[data-testid="request-id-frame"]');
    expect(frame.text()).toContain('Request header');
    expect(frame.find('[data-testid="request-id"]').text()).toBe('req-0042');
    const copy = frame.find('button');
    expect(copy.text()).toBe('Copy');
    expect(copy.attributes('aria-label')).toBe('Copy the request identifier');
    await copy.trigger('click');
    await flushPromises();
    expect(written).toBe('req-0042');
    expect(frame.find('button').text()).toBe('Copied');
    const other = await mountInApp(MqErrorState, {
      props: { ...notFound, requestId: 'req-0042', action: ERROR_ACTION },
    });
    expect(other.find('[data-testid="request-id-frame"]').exists()).toBe(false);
  });

  it('offers a retry that emits, with a polite live line, on the unavailable kind only', async () => {
    const wrapper = await mountInApp(MqErrorState, {
      props: { ...unavailable, action: ERROR_ACTION },
    });
    expect(wrapper.find('a').exists()).toBe(false);
    const retry = wrapper.findAll('button').find((b) => b.text() === 'Try again');
    await retry!.trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
    const line = wrapper.find('[data-testid="retry-state"]');
    expect(line.attributes('aria-live')).toBe('polite');
    expect(line.text()).toBe('');
    const other = await mountInApp(MqErrorState, { props: { ...notFound, action: ERROR_ACTION } });
    expect(other.find('[data-testid="retry-state"]').exists()).toBe(false);
  });

  it('fills the live line only once mounted, so a screen reader announces it', async () => {
    const changed: Node[] = [];
    const observer = new MutationObserver((records) =>
      records.forEach((record) => changed.push(record.target)),
    );
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const wrapper = await mountInApp(MqErrorState, {
      props: { ...unavailable, retryState: ERROR_STILL_DOWN },
      attachTo: document.body,
    });
    await flushPromises();
    observer.disconnect();
    const line = wrapper.find('[data-testid="retry-state"]').element;
    expect(line.textContent?.trim()).toBe(ERROR_STILL_DOWN);
    expect(changed.some((node) => node === line || line.contains(node))).toBe(true);
  });

  it('shows the retry as loading while retrying', async () => {
    const wrapper = await mountInApp(MqErrorState, { props: { ...unavailable, retrying: true } });
    const retry = wrapper.findAll('button').find((b) => b.text().includes('Try again'));
    expect(retry!.attributes('disabled')).toBeDefined();
    expect(retry!.html()).toContain('animate-spin');
  });

  it('leads back through the action on the other kinds, solid when not found', async () => {
    for (const [state, variant] of [
      [notFound, 'solid'],
      [unexpected, 'outline'],
    ] as const) {
      const wrapper = await mountInApp(MqErrorState, {
        props: { ...state, action: ERROR_ACTION },
      });
      const back = wrapper.find('a');
      expect([back.text(), back.attributes('href')]).toEqual(['Back to the list', '/items']);
      expect(back.find('.iconify').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'UButton' }).props('variant'), state.kind).toBe(variant);
    }
  });

  it('labels each card by its own title, so two cards on a page keep distinct ids', async () => {
    const wrapper = await mountInApp({
      components: { MqErrorState },
      setup: () => ({ notFound, unexpected, action: ERROR_ACTION }),
      template:
        '<div><MqErrorState v-bind="notFound" :action="action" /><MqErrorState v-bind="unexpected" :action="action" /></div>',
    });
    const cards = wrapper.findAll('[data-testid="error-card"]');
    const ids = cards.map((card) => card.find('h2').attributes('id'));
    expect(new Set(ids).size).toBe(2);
    cards.forEach((card, index) => expect(card.attributes('aria-labelledby')).toBe(ids[index]));
  });
});
