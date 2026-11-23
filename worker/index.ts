import { handleVotes, jsonResponse } from "./votes";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/votes") return handleVotes(request, env);
    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "not_found" }, 404);
    }
    return env.ASSETS.fetch(request);
  },
};
