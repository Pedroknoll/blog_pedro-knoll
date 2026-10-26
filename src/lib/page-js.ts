export type PageJsItem = {
  origin: string;
  gzipBytes: number;
};

export type PageJsResult = {
  items: PageJsItem[];
  total: number;
};

export type ReadDist = (path: string) => string | undefined;

function unimplemented(
  html: string,
  pagePath: string,
  readFile: ReadDist,
): never {
  throw new Error("não implementado", {
    cause: [html, pagePath, readFile],
  });
}

export function countPageJs(
  html: string,
  pagePath: string,
  readFile: ReadDist,
): PageJsResult {
  return unimplemented(html, pagePath, readFile);
}
