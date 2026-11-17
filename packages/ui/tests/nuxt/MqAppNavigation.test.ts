import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { mountInApp } from './support/mount';
import { UDashboardGroup } from '#components';
import MqAppNavigation from '../../app/components/MqAppNavigation.vue';
import { NAVIGATION_GROUPS } from './fixtures/neutral';

describe('MqAppNavigation', () => {
  it('links every item of every group in order, with its icon and accessible name', async () => {
    const wrapper = await mountInApp(MqAppNavigation, { props: { groups: NAVIGATION_GROUPS } });
    const links = wrapper.findAll('a').map((a) => [a.text(), a.attributes('href')]);
    expect(links).toEqual([
      ['Home', '/home'],
      ['Inbox4', '/inbox'],
      ['Archive', '/archive'],
    ]);
    expect(wrapper.find('a[href="/home"]').attributes('aria-label')).toBe('Home');
    expect(
      wrapper.find('a[href="/home"] .iconify, a[href="/home"] [class*="i-lucide-house"]').exists(),
    ).toBe(true);
  });

  it('heads a group with its label, and a group without one with nothing', async () => {
    const wrapper = await mountInApp(MqAppNavigation, { props: { groups: NAVIGATION_GROUPS } });
    const labels = wrapper.findAll('div[data-slot="label"]').map((label) => label.text());
    expect(labels).toEqual(['Work']);
  });

  it('badges an item’s count only above zero, named by its count label', async () => {
    const wrapper = await mountInApp(MqAppNavigation, { props: { groups: NAVIGATION_GROUPS } });
    const counts = wrapper.findAll('[data-testid="nav-count"]');
    expect(counts.map((count) => count.text())).toEqual(['4']);
    expect(counts[0]!.attributes('aria-label')).toBe('Waiting');
    expect(wrapper.find('a[href="/archive"] [data-testid="nav-count"]').exists()).toBe(false);
  });

  it('folded to a rail, hides the group headings and names each link by its tooltip', async () => {
    const wrapper = await mountInApp({
      render: () =>
        h(UDashboardGroup, null, () =>
          h(MqAppNavigation, { groups: NAVIGATION_GROUPS, collapsed: true }),
        ),
    });
    expect(wrapper.findAll('div[data-slot="label"]')).toHaveLength(0);
    expect(wrapper.find('a[href="/inbox"]').attributes('aria-label')).toBe('Inbox');
  });

  describe('the open count on the folded rail', () => {
    const groups = NAVIGATION_GROUPS.map((group) => ({
      ...group,
      items: group.items.map((item) =>
        item.to === '/inbox' ? { ...item, openCount: 7, openCountLabel: '7 open' } : item,
      ),
    }));
    const mountRail = (collapsed = true, given = groups) =>
      mountInApp({
        render: () =>
          h(UDashboardGroup, null, () => h(MqAppNavigation, { groups: given, collapsed })),
      });

    it('draws an item’s open count on its icon, and names the link with it', async () => {
      const wrapper = await mountRail();
      expect(wrapper.findAll('[data-testid="nav-open-count"]')).toHaveLength(1);
      const badge = wrapper.find('a[href="/inbox"] [data-testid="nav-open-count"]');
      expect(badge.text()).toBe('7');
      // The link's name carries the count; the drawn figure is not read twice.
      expect(badge.attributes('aria-hidden')).toBe('true');
      expect(wrapper.find('a[href="/inbox"]').attributes('aria-label')).toBe('Inbox, 7 open');
      expect(wrapper.find('a[href="/archive"]').attributes('aria-label')).toBe('Archive');
    });

    it('caps the drawn figure at « 99+ », the link still named with the whole count', async () => {
      const wrapper = await mountRail(true, [
        {
          items: [
            {
              label: 'Inbox',
              icon: 'i-lucide-inbox',
              to: '/inbox',
              openCount: 1240,
              openCountLabel: '1240 open',
            },
          ],
        },
      ]);
      expect(wrapper.find('[data-testid="nav-open-count"]').text()).toBe('99+');
      expect(wrapper.find('a[href="/inbox"]').attributes('aria-label')).toBe('Inbox, 1240 open');
      const ninetyNine = await mountRail(true, [
        { items: [{ label: 'Inbox', icon: 'i-lucide-inbox', to: '/inbox', openCount: 99 }] },
      ]);
      expect(ninetyNine.find('[data-testid="nav-open-count"]').text()).toBe('99');
    });

    it('draws nothing at zero, nor unfolded, where the label shows the item’s own count', async () => {
      const zero = await mountRail(true, [
        { items: [{ label: 'Inbox', icon: 'i-lucide-inbox', to: '/inbox', openCount: 0 }] },
      ]);
      expect(zero.find('[data-testid="nav-open-count"]').exists()).toBe(false);
      expect(zero.find('a[href="/inbox"]').attributes('aria-label')).toBe('Inbox');
      const unfolded = await mountRail(false);
      expect(unfolded.find('[data-testid="nav-open-count"]').exists()).toBe(false);
      expect(unfolded.find('a[href="/inbox"]').attributes('aria-label')).toBe('Inbox');
    });
  });
});
