/**
 * Pagination types for list operations
 */

/**
 * Input parameters for pagination
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Metadata about pagination
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Factory function to create paginated results
 *
 * @example
 * ```typescript
 * const data = await repository.findAll();
 * const result = createPaginatedResult(data, total, { page: 1, limit: 10 });
 * ```
 */
export const createPaginatedResult = <T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1,
    },
  };
};

/**
 * Default pagination parameters
 */
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  limit: 10,
  sortBy: 'dtmCreated',
  sortOrder: 'DESC',
};

/**
 * Validate pagination parameters
 */
export const validatePaginationParams = (
  params: Partial<PaginationParams>
): PaginationParams => {
  const page = Math.max(1, params.page ?? DEFAULT_PAGINATION.page);
  const limit = Math.min(
    100,
    Math.max(1, params.limit ?? DEFAULT_PAGINATION.limit)
  );

  return {
    page,
    limit,
    sortBy: params.sortBy ?? DEFAULT_PAGINATION.sortBy,
    sortOrder: params.sortOrder ?? DEFAULT_PAGINATION.sortOrder,
  };
};

/**
 * Calculate offset for SQL queries
 */
export const calculateOffset = (params: PaginationParams): number => {
  return (params.page - 1) * params.limit;
};
