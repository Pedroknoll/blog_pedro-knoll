import type { Page } from "@playwright/test";

// Stub do widget do Giscus (RF-19, T-28): responde no lugar de giscus.app,
// manda o resizeHeight ao site, como o widget de verdade, e grava em
// `body[data-received]` a última mensagem que recebe do site. Nenhum teste
// fala com giscus.app.

export const GISCUS_STUB_HEIGHT = 321;

const STUB = `<!doctype html>
<html><body>
<script>
  window.addEventListener("message", (event) => {
    document.body.dataset.received = JSON.stringify(event.data);
  });
  parent.postMessage({ giscus: { resizeHeight: ${GISCUS_STUB_HEIGHT} } }, "*");
</script>
</body></html>`;

export async function stubGiscus(
  page: Page,
  requests?: string[],
): Promise<void> {
  await page.route("https://giscus.app/**", (route) => {
    requests?.push(route.request().url());
    return route.fulfill({ contentType: "text/html", body: STUB });
  });
}

/** Para os specs que rolam até o fim do post: o iframe não vai à rede. */
export async function blockGiscus(page: Page): Promise<void> {
  await page.route("https://giscus.app/**", (route) => route.abort());
}
