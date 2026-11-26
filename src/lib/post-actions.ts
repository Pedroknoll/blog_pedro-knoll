// Bloco de voto e compartilhar (RF-23, T-130, BRAND §9.14). O bloco da
// lateral aparece quando o filete do cabeçalho sai da tela ou quando o fim do
// texto entra nela, por um IntersectionObserver, sem ouvir o scroll; o CSS
// faz o resto (só opacity e transform). O botão Copiar link só existe com
// JavaScript e clipboard.
import { isPastHeader } from "~/lib/share";

const COPY_RESET_MS = 1500;
const COPY_TEXT = "Copiar link";
// Na tela, só Copiado: Link copiado quebrava a linha dos links na lateral.
// O nome acessível e o aviso dizem o que foi copiado.
const COPIED_TEXT = "Copiado";
const COPIED_LABEL = "Link copiado";

function addCopyButton(
  block: HTMLElement,
  writeText: (text: string) => Promise<void>,
  status: HTMLElement,
) {
  const list = block.querySelector<HTMLElement>("[data-share-links]");
  const url = block.dataset.shareUrl;
  if (!list || !url) return;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.shareCopy = "";
  button.className = list.dataset.itemClass ?? "";
  button.textContent = COPY_TEXT;
  button.setAttribute("aria-label", COPY_TEXT);
  list.append(button);

  let timer: number | undefined;
  button.addEventListener("click", () => {
    void writeText(url).then(
      () => {
        button.textContent = COPIED_TEXT;
        button.setAttribute("aria-label", COPIED_LABEL);
        status.textContent = COPIED_LABEL;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          button.textContent = COPY_TEXT;
          button.setAttribute("aria-label", COPY_TEXT);
          status.textContent = "";
        }, COPY_RESET_MS);
      },
      () => {},
    );
  });
}

export function initPostActions(): void {
  const blocks = [
    ...document.querySelectorAll<HTMLElement>("[data-post-actions]"),
  ];
  if (blocks.length === 0) return;

  const writeText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
  if (writeText) {
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    status.className = "sr-only";
    document.querySelector("article")?.append(status);
    for (const block of blocks) addCopyButton(block, writeText, status);
  }

  const rail = blocks.find((block) => block.dataset.postActions === "rail");
  const header = document.querySelector("[data-post-header]");
  const end = document.querySelector("[data-rail-end]");
  if (!rail || !header || !("IntersectionObserver" in window)) return;

  // Aparece com o filete fora da tela, por cima, ou com o fim do texto na
  // tela: num post curto, o filete pode nunca sair.
  let pastHeader = false;
  let endInView = false;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === header) {
        pastHeader = isPastHeader({
          isIntersecting: entry.isIntersecting,
          top: entry.boundingClientRect.top,
        });
      } else {
        endInView = entry.isIntersecting;
      }
    }
    rail.toggleAttribute("data-shown", pastHeader || endInView);
  });
  observer.observe(header);
  if (end) observer.observe(end);
}
