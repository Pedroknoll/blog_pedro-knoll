export type TocHeading = {
  depth: number;
  slug: string;
  text: string;
};

export type TocItem = {
  depth: number;
  slug: string;
  text: string;
  children: TocItem[];
};

export function buildToc(headings: readonly TocHeading[]): TocItem[] {
  const items: TocItem[] = [];
  let currentH2: TocItem | undefined;

  for (const heading of headings) {
    if (heading.depth !== 2 && heading.depth !== 3) continue;

    const item: TocItem = {
      depth: heading.depth,
      slug: heading.slug,
      text: heading.text,
      children: [],
    };

    if (heading.depth === 2) {
      items.push(item);
      currentH2 = item;
      continue;
    }

    if (currentH2) {
      currentH2.children.push(item);
      continue;
    }

    items.push(item);
  }

  return items;
}
