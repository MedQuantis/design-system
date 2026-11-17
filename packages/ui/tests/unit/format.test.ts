import { describe, expect, it } from 'vitest';
import { formatShares, wholeShares } from '../../app/utils/format';

const NBSP = ' ';

describe('wholeShares: whole percentages of a set, by the largest remainder', () => {
  it('adds up to 100 where rounding each share would not', () => {
    // 1/3 each: rounding alone gives 33 + 33 + 33 = 99.
    expect(wholeShares([1, 1, 1]).reduce((sum, share) => sum + share, 0)).toBe(100);
    // 80.13, 11.86, 4.01, 2.40, 1.60: floors 98, the two largest remainders take the rest.
    expect(wholeShares([1000, 148, 50, 30, 20])).toEqual([80, 12, 4, 2, 2]);
  });

  it('breaks a tie between equal remainders in the order of the set', () => {
    expect(wholeShares([1, 1, 1])).toEqual([34, 33, 33]);
    expect(wholeShares([2, 1, 1])).toEqual([50, 25, 25]);
  });

  it('gives nothing to an empty set or a set of zeros', () => {
    expect(wholeShares([])).toEqual([]);
    expect(wholeShares([0, 0])).toEqual([0, 0]);
  });
});

describe('formatShares', () => {
  it('writes each share with a non-breaking space before %', () => {
    expect(formatShares([3, 1])).toEqual([`75${NBSP}%`, `25${NBSP}%`]);
  });

  it('reads « < 1 % » for a non-zero share that rounds to 0, and 0 % for none', () => {
    expect(formatShares([1000, 1, 0])).toEqual([`100${NBSP}%`, `<${NBSP}1${NBSP}%`, `0${NBSP}%`]);
  });

  it('reads 0 % for every share of a zero total', () => {
    expect(formatShares([0, 0])).toEqual([`0${NBSP}%`, `0${NBSP}%`]);
  });
});
