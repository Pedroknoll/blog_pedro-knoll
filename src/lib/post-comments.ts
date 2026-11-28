// Comentários do post (RF-19, T-28, BRAND §9.14). O iframe de giscus.app só
// nasce quando a seção se aproxima da tela, por um IntersectionObserver: antes
// disso, nada vai para giscus.app. A altura vem do resizeHeight do widget, e o
// tema acompanha o data-theme da raiz (RF-17).
import {
  GISCUS_ORIGIN,
  SESSION_KEY,
  giscusTheme,
  pageOrigin,
  parseStoredSession,
  readMessage,
  sessionFromSearch,
  setConfigMessage,
  widgetUrl,
  type GiscusConfig,
} from "~/lib/giscus";
import { isTheme } from "~/lib/theme";

// Distância da seção à tela em que o iframe começa a carregar.
const ROOT_MARGIN = "600px 0px";

function readStorage(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, value);
  } catch {
    // Sem armazenamento, a sessão vale só nesta página.
  }
}

/** Grava a sessão que volta do login e a tira da URL; devolve a sessão atual. */
function takeSession(): string | null {
  const fresh = sessionFromSearch(location.search);
  if (fresh) {
    writeStorage(JSON.stringify(fresh));
    history.replaceState(history.state, "", pageOrigin(location.href));
    return fresh;
  }
  const stored = parseStoredSession(readStorage());
  if (stored.invalid) writeStorage(null);
  return stored.session;
}

function currentTheme(): string {
  const theme = document.documentElement.dataset.theme;
  return giscusTheme(isTheme(theme) ? theme : "light");
}

export function initPostComments(): void {
  const section = document.querySelector<HTMLElement>("[data-post-comments]");
  const holder = section?.querySelector<HTMLElement>("[data-comments-frame]");
  if (!section || !holder) return;
  const {
    repo,
    repoId,
    category,
    categoryId,
    lang,
    term,
    description,
    backLink,
  } = section.dataset;
  if (!repo || !repoId || !category || !categoryId || !lang || !term) return;
  const config: GiscusConfig = { repo, repoId, category, categoryId, lang };

  let session = takeSession();
  let frame: HTMLIFrameElement | null = null;

  function source(): string {
    return widgetUrl(config, {
      origin: pageOrigin(location.href),
      term: term ?? "",
      description: description ?? "",
      backLink: backLink ?? "",
      theme: currentTheme(),
      session,
    });
  }

  function mount(): void {
    frame = document.createElement("iframe");
    frame.title = "Comentários";
    // color-scheme normal, como no default.css do giscus: com o site no
    // escuro e o widget noutro esquema, o Chrome pinta o iframe de branco.
    frame.className =
      "block w-full border-0 [color-scheme:normal] data-focused:outline-2 data-focused:outline-offset-3 data-focused:outline-accent";
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("allow", "clipboard-write");
    frame.setAttribute("loading", "lazy");
    frame.src = source();
    holder?.replaceChildren(frame);
  }

  // Com o foco dentro do iframe, o Chrome não aplica :focus nem
  // :focus-visible a ele: a janela perde o foco, e o contorno vem do
  // data-focused, até o foco voltar à página.
  window.addEventListener("blur", () => {
    if (frame && document.activeElement === frame) frame.dataset.focused = "";
  });
  window.addEventListener("focus", () => {
    if (frame) delete frame.dataset.focused;
  });

  window.addEventListener("message", (event) => {
    if (!frame || event.source !== frame.contentWindow) return;
    const message = readMessage(event);
    if (!message) return;
    if (message.kind === "resize") {
      frame.style.height = `${message.height}px`;
      return;
    }
    session = null;
    writeStorage(null);
    frame.src = source();
  });

  new MutationObserver(() => {
    frame?.contentWindow?.postMessage(
      setConfigMessage(currentTheme()),
      GISCUS_ORIGIN,
    );
  }).observe(document.documentElement, { attributeFilter: ["data-theme"] });

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      mount();
    },
    { rootMargin: ROOT_MARGIN },
  );
  observer.observe(section);
}
