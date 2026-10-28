export const KINDS = ["concept", "tutorial", "lab", "playbook"] as const;

export type Kind = (typeof KINDS)[number];

export const KIND_LABELS: Record<Kind, string> = {
  concept: "Conceito",
  tutorial: "Tutorial",
  lab: "Lab",
  playbook: "Playbook",
};
