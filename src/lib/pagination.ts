export const PAGE_SIZE = 12;

export type PostPage<T> = {
  items: T[];
  href: string;
  prev: string | null;
  next: string | null;
};

function hrefFor(page: number): string {
  return page === 1 ? "/" : `/page/${page}/`;
}

export function paginatePosts<T>(
  items: readonly T[],
  pageSize = PAGE_SIZE,
): PostPage<T>[] {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  return Array.from({ length: pageCount }, (_, index) => {
    const page = index + 1;
    return {
      items: items.slice(index * pageSize, page * pageSize),
      href: hrefFor(page),
      prev: page === 1 ? null : hrefFor(page - 1),
      next: page === pageCount ? null : hrefFor(page + 1),
    };
  });
}
