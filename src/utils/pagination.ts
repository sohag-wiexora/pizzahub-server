import { asOptionalNumber } from './query.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

const MAX_PAGE_SIZE = 50;

/**
 * Reads page/limit query params with sane defaults and hard limits.
 * The PizzaHub client renders whole lists (no pager), so the default page is
 * the maximum page — otherwise a dashboard would silently show only the first
 * 10 records.
 */
export const parsePagination = (query: Record<string, unknown>): Pagination => {
  const page = Math.max(1, asOptionalNumber(query.page) ?? 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, asOptionalNumber(query.limit) ?? MAX_PAGE_SIZE));

  return { page, limit, skip: (page - 1) * limit };
};

export const buildMeta = (
  total: number,
  pageInfo: Pick<Pagination, 'page' | 'limit'>,
): PaginationMeta => ({
  page: pageInfo.page,
  limit: pageInfo.limit,
  total,
  totalPage: Math.ceil(total / pageInfo.limit),
});
