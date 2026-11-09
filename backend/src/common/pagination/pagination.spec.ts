import { pageMeta, pagingDefaults, resolveOrderBy } from './pagination';

type Order = Record<string, 'asc' | 'desc'>;

describe('pagination helpers', () => {
  it('builds page metadata', () => {
    expect(pageMeta(2, 10, 21)).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
    expect(pageMeta(1, 10, 0).totalPages).toBe(0);
  });

  it('applies defaults and computes the offset', () => {
    expect(pagingDefaults({}, 200)).toEqual({ page: 1, limit: 200, skip: 0 });
    expect(pagingDefaults({ page: 3, limit: 25 }, 10)).toEqual({
      page: 3,
      limit: 25,
      skip: 50,
    });
  });

  describe('resolveOrderBy', () => {
    const fields = {
      name: (d: 'asc' | 'desc'): Order[] => [{ name: d }],
    };
    const fallback: Order[] = [{ id: 'asc' }];

    it('uses the fallback when the sort is missing or unknown', () => {
      expect(resolveOrderBy(undefined, 'desc', fields, fallback)).toBe(
        fallback,
      );
      expect(resolveOrderBy('password', 'desc', fields, fallback)).toBe(
        fallback,
      );
    });

    it('maps a whitelisted field, defaults to asc and appends the tiebreaker', () => {
      expect(
        resolveOrderBy('name', undefined, fields, fallback, [{ id: 'asc' }]),
      ).toEqual([{ name: 'asc' }, { id: 'asc' }]);
      expect(resolveOrderBy('name', 'desc', fields, fallback)).toEqual([
        { name: 'desc' },
      ]);
    });
  });
});
