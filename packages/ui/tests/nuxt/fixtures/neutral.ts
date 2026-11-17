// Fictitious fixtures for the components of app/components/, shared by their mounted tests and
// their playground pages. They name no product, person or domain.

export const NAVIGATION_GROUPS = [
  {
    items: [{ label: 'Home', icon: 'i-lucide-house', to: '/home' }],
  },
  {
    label: 'Work',
    items: [
      { label: 'Inbox', icon: 'i-lucide-inbox', to: '/inbox', count: 4, countLabel: 'Waiting' },
      {
        label: 'Archive',
        icon: 'i-lucide-archive',
        to: '/archive',
        count: 0,
        countLabel: 'Waiting',
      },
    ],
  },
];
