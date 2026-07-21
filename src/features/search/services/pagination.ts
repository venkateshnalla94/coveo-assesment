export type PaginationState = {
  currentPage: number;
  firstResult: number;
  lastResult: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function getPaginationState({
  page,
  pageSize,
  totalCount,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
}): PaginationState {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalCount) / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const firstResult = totalCount === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const lastResult = Math.min(totalCount, currentPage * safePageSize);

  return {
    currentPage,
    firstResult,
    lastResult,
    pageSize: safePageSize,
    totalCount,
    totalPages,
  };
}
