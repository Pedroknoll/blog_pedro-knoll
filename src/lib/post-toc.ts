// Índice do post (RF-26, T-129, BRAND §9.3): progresso da leitura e seção
// ativa. O script só lê posições e escreve transform, texto e aria-current;
// não mede para posicionar nada (RNF-01).

/** Fração lida da prosa: 0 com o topo do texto no topo da tela, 1 com o fim do texto no fim da tela. */
export function readingProgress(
  top: number,
  height: number,
  viewportHeight: number,
): number {
  const range = height - viewportHeight;
  if (range <= 0) return top + height <= viewportHeight ? 1 : 0;
  return Math.min(1, Math.max(0, -top / range));
}

/**
 * Índice do último h2 cujo topo passou da linha (topo menor ou igual a ela),
 * ou -1. No fim do texto (`atEnd`), o último h2, mesmo que não tenha passado.
 */
export function activeIndex(
  tops: readonly number[],
  line: number,
  atEnd = false,
): number {
  if (atEnd && tops.length > 0) return tops.length - 1;
  let active = -1;
  for (let index = 0; index < tops.length; index += 1) {
    if ((tops[index] ?? Number.POSITIVE_INFINITY) <= line) active = index;
  }
  return active;
}

/** Linha da seção ativa: 15% da altura da tela, perto do topo do índice sticky. */
const ACTIVE_LINE = 0.15;

export function initPostToc(): void {
  const nav = document.querySelector<HTMLElement>("[data-post-toc]");
  const prose = document.querySelector<HTMLElement>(
    "article [data-pagefind-body]",
  );
  if (!nav || !prose) return;
  const fill = nav.querySelector<HTMLElement>("[data-toc-fill]");
  const percent = nav.querySelector<HTMLElement>("[data-toc-percent]");
  const links = [...nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']")];
  const headings = links.map((link) =>
    document.getElementById((link.getAttribute("href") ?? "").slice(1)),
  );

  let current = -2;
  let scheduled = false;

  function update() {
    scheduled = false;
    const viewport = window.innerHeight;
    const rect = prose!.getBoundingClientRect();
    const tops = headings.map((heading) =>
      heading ? heading.getBoundingClientRect().top : Number.POSITIVE_INFINITY,
    );
    const progress = readingProgress(rect.top, rect.height, viewport);
    const active = activeIndex(tops, viewport * ACTIVE_LINE, progress >= 1);

    if (fill) fill.style.transform = `scaleX(${progress})`;
    if (percent) percent.textContent = `${Math.round(progress * 100)}%`;
    if (active !== current) {
      current = active;
      links.forEach((link, index) => {
        if (index === active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  update();
}
