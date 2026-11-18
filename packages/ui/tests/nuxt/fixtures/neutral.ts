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

// Three steps of a fictitious approval, in each shape a review takes: a second look
// optional, a second look required, one done and one under way, every step done, one skipped.
export const STEP_SHAPES = {
  optional: [
    { key: 'draft', title: 'Drafted', detail: 'ready to decide', state: 'current' },
    { key: 'check', title: 'Checked', detail: 'optional', state: 'optional' },
    { key: 'close', title: 'Closed', detail: 'alone or by two', state: 'pending' },
  ],
  required: [
    { key: 'draft', title: 'Drafted', detail: 'suggested by a helper', state: 'current' },
    { key: 'check', title: 'Checked', detail: 'needed: your confirmation', state: 'required' },
    { key: 'close', title: 'Closed', detail: 'by two or set aside', state: 'pending' },
  ],
  underWay: [
    { key: 'draft', title: 'Drafted', detail: 'decided by Alex Example', state: 'done' },
    { key: 'check', title: 'Checked', detail: 'yours to check', state: 'current' },
    { key: 'close', title: 'Closed', detail: 'by two', state: 'pending' },
  ],
  done: [
    { key: 'draft', title: 'Drafted', detail: 'first look', state: 'done' },
    { key: 'check', title: 'Checked', detail: 'by Sam Example', state: 'done' },
    { key: 'close', title: 'Closed', detail: 'by two', state: 'done' },
  ],
  skipped: [
    { key: 'draft', title: 'Drafted', detail: 'first look', state: 'done' },
    { key: 'check', title: 'Checked', detail: 'not asked for', state: 'skipped' },
    { key: 'close', title: 'Closed', detail: 'alone', state: 'done' },
  ],
} as const;

// The acts of a fictitious approval's footer, in the order a screen gives them: a link-like
// act, a secondary one opening a form, a refused one with its reason, a destructive one with
// its icon, and the main act last.
export const ACTS = [
  { key: 'ask', label: 'Ask someone', variant: 'ghost', popover: true },
  { key: 'return', label: 'Return', variant: 'secondary', popover: true },
  {
    key: 'archive',
    label: 'Archive',
    variant: 'secondary',
    disabled: true,
    reason: 'Only the owner may archive',
  },
  { key: 'delete', label: 'Delete', variant: 'danger', icon: 'i-lucide-trash-2' },
  { key: 'save', label: 'Save', variant: 'secondary' },
  { key: 'approve', label: 'Approve', variant: 'primary' },
] as const;

// A fictitious decision log, newest first, of two categories (work and publication) and
// three sources; the second entry the one live today.
export const TIMELINE_FILTERS = [
  { key: 'robot', label: 'Robot', icon: 'i-lucide-bot' },
  { key: 'person', label: 'Person', icon: 'i-lucide-user' },
  { key: 'helper', label: 'Helper', icon: 'i-lucide-sparkles' },
];

export const TIMELINE_CATEGORIES = [
  { key: 'work', label: 'Work', icon: 'i-lucide-tag' },
  { key: 'publication', label: 'Publication', icon: 'i-lucide-book-open', outside: true },
];

export const TIMELINE_ENTRIES = [
  {
    key: 'e3',
    at: '2026-11-03T09:15:00Z',
    title: 'check asked',
    who: 'Alex Example',
    whoIcon: 'i-lucide-user',
    filter: 'person',
    dot: 'filled',
    tone: 'person',
    category: 'work',
    result: null,
  },
  {
    key: 'e2',
    at: '2026-11-02T08:00:00Z',
    title: 'published',
    who: 'Robot',
    whoIcon: 'i-lucide-bot',
    whoIconOnly: true,
    filter: 'robot',
    dot: 'outline',
    tone: 'accepted',
    category: 'work',
    result: '4471.02',
    highlighted: true,
  },
  {
    key: 'e1',
    at: '2026-11-01T07:30:00Z',
    title: 'new text',
    who: 'Publisher',
    filter: 'robot',
    dot: 'square',
    tone: 'publication',
    category: 'publication',
  },
];

// The caption of a fictitious decision log: each tag tone, then each dot, then « live ».
export const LEGEND_ITEMS = [
  { key: 'accepted', label: 'accepted, applied', tag: 'accepted' },
  { key: 'rejected', label: 'rejected', tag: 'rejected' },
  { key: 'person', label: 'a person’s decision', tag: 'person' },
  { key: 'publication', label: 'publication', tag: 'publication' },
  { key: 'step', label: 'step', tag: 'step' },
  { key: 'sep', separator: true },
  { key: 'robot', label: 'robot', dot: 'outline' },
  { key: 'human', label: 'person', dot: 'filled' },
  { key: 'helper', label: 'helper', dot: 'dashed' },
  { key: 'publisher', label: 'publisher', dot: 'square' },
  { key: 'live', label: 'live', live: true },
] as const;

// A fictitious decision window: two tabs on the left, three sections on the right, two of
// them folding.
export const WINDOW_TABS = [
  { key: 'text', label: 'Text' },
  { key: 'log', label: 'Log 3' },
];
export const WINDOW_SECTIONS = [
  { key: 'proposal', title: 'Proposal', foldable: true },
  { key: 'decision', title: 'Your decision' },
  { key: 'change', title: 'The change', foldable: true },
];
export const WINDOW_LABELS = {
  queueLabel: 'Queue',
  previousLabel: 'Previous',
  nextLabel: 'Next',
  closeLabel: 'Close',
  notListedLabel: 'not in the list',
  sectionsLabel: 'Steps of the decision',
};

// The words of a fictitious error page, one set per state, and the way back it offers.
export const ERROR_ACTION = { label: 'Back to the list', to: '/items' };
export const ERROR_STATES = {
  notFound: {
    kind: 'notFound',
    eyebrow: 'Not found',
    title: 'No page here',
    description: 'Nothing answers this address. The link may be cut short.',
    path: '/items/unknown-key',
  },
  unavailable: {
    kind: 'unavailable',
    eyebrow: 'Unavailable',
    title: 'The service is down for a moment',
    description: 'It does not answer for now. Try again in a few moments.',
    retryLabel: 'Try again',
  },
  unexpected: {
    kind: 'unexpected',
    eyebrow: 'Error',
    title: 'Something went wrong',
    description: 'The request failed. Give this identifier to the team if it happens again.',
    requestId: 'req-0042',
    requestIdLabel: 'Request header',
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
    copyAriaLabel: 'Copy the request identifier',
  },
} as const;
export const ERROR_STILL_DOWN = 'Still down at the last try, at 09:30.';
