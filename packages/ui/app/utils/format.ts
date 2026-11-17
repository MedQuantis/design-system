// Figures and dates as the design system writes them (guidelines/data-patterns.md
// §Numbers): the straight apostrophe groups thousands, a non-breaking space joins a
// figure to its %, shares of a whole are whole percentages that add up to 100, dates read
// DD.MM.YYYY.

const NBSP = ' ';
const ZURICH = 'Europe/Zurich';

export function formatCount(value: number): string {
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/**
 * Whole percentages of a set that add up to 100: each share floored, the points left over
 * going to the largest remainders, the earlier share first on a tie. A zero total gives zeros.
 */
export function wholeShares(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total <= 0) return counts.map(() => 0);
  const exact = counts.map((count) => (count / total) * 100);
  const shares = exact.map(Math.floor);
  let left = 100 - shares.reduce((sum, share) => sum + share, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (left <= 0) break;
    shares[index] = (shares[index] ?? 0) + 1;
    left -= 1;
  }
  return shares;
}

/** One whole share as written: a non-zero count whose share rounds to 0 reads « < 1 % ». */
export function formatShare(share: number, count: number): string {
  return share === 0 && count > 0 ? `<${NBSP}1${NBSP}%` : `${share}${NBSP}%`;
}

export function formatShares(counts: readonly number[]): string[] {
  const shares = wholeShares(counts);
  return counts.map((count, index) => formatShare(shares[index] ?? 0, count));
}

/** `YYYY-MM-DD` or an ISO timestamp as `DD.MM.YYYY`, the timestamp in Zurich time. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '–';
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (plain) return `${plain[3]}.${plain[2]}.${plain[1]}`;
  const parts = zurichParts(value);
  return `${parts.day}.${parts.month}.${parts.year}`;
}

/** An ISO timestamp as `HH:MM` in Zurich time. */
export function formatTime(value: string): string {
  const parts = zurichParts(value);
  return `${parts.hour}:${parts.minute}`;
}

export function formatDateTime(value: string): string {
  return `${formatDate(value)} ${formatTime(value)}`;
}

/** The instant a day (`YYYY-MM-DD`) starts in Zurich, in milliseconds. */
export function zurichMidnight(day: string): number {
  const utcMidnight = Date.parse(`${day}T00:00:00Z`);
  // Zurich's offset that night: midnight never falls in a clock change, made at 02:00 or 03:00.
  const wall = zurichParts(new Date(utcMidnight).toISOString());
  const wallAsUtc = Date.UTC(
    Number(wall.year),
    Number(wall.month) - 1,
    Number(wall.day),
    Number(wall.hour),
    Number(wall.minute),
  );
  return utcMidnight - (wallAsUtc - utcMidnight);
}

/** Whole days between `since` and `now`, never below zero. */
export function daysSince(since: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(since).getTime()) / 86_400_000));
}

function zurichParts(value: string): Record<'day' | 'month' | 'year' | 'hour' | 'minute', string> {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZURICH,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  );
  return {
    day: parts.day ?? '',
    month: parts.month ?? '',
    year: parts.year ?? '',
    hour: parts.hour ?? '',
    minute: parts.minute ?? '',
  };
}
