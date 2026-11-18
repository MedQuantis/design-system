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

export const FILTER_OPTIONS = [
  { value: 'red', label: 'Red', count: 12 },
  { value: 'green', label: 'Green', count: 0 },
  { value: 'blue', label: 'Blue', count: 1234 },
];

export const FILTER_GROUPS = [
  [
    { value: 'warm', label: 'Warm colours', count: 12 },
    { value: 'cool', label: 'Cool colours', count: 1234 },
  ],
  FILTER_OPTIONS,
];

export const SEGMENT_GROUPS = [
  [
    { value: 'open', label: 'Open', count: 7 },
    { value: 'waiting', label: 'Waiting', count: 1234 },
  ],
  [{ value: 'mine', label: 'Mine', count: 0 }],
];

export const PILLS = [
  { label: 'Open', detail: 'waiting for a first look', tone: 'neutral' },
  { label: 'Open', detail: 'a second look needed', tone: 'warning' },
  { label: 'In review', detail: 'with a colleague since 03.11.2026', tone: 'primary' },
] as const;

export const TABLE_COLUMNS = [
  { key: 'case', label: 'Case', width: '40%', sort: 'CASE' },
  { key: 'owner', label: 'Owner', width: '35%', phoneLabel: 'Team' },
  { key: 'opened', label: 'Opened', width: '25%', sort: 'OPENED' },
];

export const TABLE_ROWS = [
  {
    key: 'case-1',
    case: 'A first case',
    owner: 'Team North',
    opened: '01.11.2026',
    flagged: false,
  },
  {
    key: 'case-2',
    case: 'A second case',
    owner: 'Team South',
    opened: '02.11.2026',
    flagged: true,
  },
  { key: 'case-3', case: 'A third case', owner: 'Team East', opened: '03.11.2026', flagged: false },
];

export const SORT_LABELS = { ascending: 'sorted ascending', descending: 'sorted descending' };
