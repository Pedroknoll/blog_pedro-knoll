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
  void headings;
  throw new Error("não implementado");
}
