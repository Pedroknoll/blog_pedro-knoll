export type VoteMap = Record<string, number>;

type VoteWindow = Window & { __pkVotes?: Promise<VoteMap | null> };

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readVotes(body: unknown): VoteMap | null {
  if (!body || typeof body !== "object") return null;
  const votes = (body as { votes?: unknown }).votes;
  if (!votes || typeof votes !== "object" || Array.isArray(votes)) return null;
  const map: VoteMap = {};
  for (const [slug, value] of Object.entries(votes)) {
    const count = finiteNumber(value);
    if (count !== null) map[slug] = count;
  }
  return map;
}

export function loadVotes(): Promise<VoteMap | null> {
  const view = window as VoteWindow;
  if (!view.__pkVotes) {
    view.__pkVotes = fetch("/api/votes")
      .then(async (response) => {
        if (!response.ok) return null;
        return readVotes(await response.json());
      })
      .catch(() => null);
  }
  return view.__pkVotes;
}
