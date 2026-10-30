import { codeTitle } from "./code-title.ts";

export function shikiCodeFrame() {
  return {
    name: "code-frame",
    root(node) {
      const index = node.children.findIndex(
        (child) => child.type === "element" && child.tagName === "pre",
      );
      if (index < 0) return;

      const title = codeTitle(this.options.meta?.__raw);
      const bar = {
        type: "element",
        tagName: "div",
        properties: { class: "code-bar" },
        children: [],
      };
      if (title !== undefined) {
        bar.children.push({
          type: "element",
          tagName: "span",
          properties: { class: "code-name" },
          children: [{ type: "text", value: title }],
        });
      }

      const pre = node.children[index];
      node.children[index] = {
        type: "element",
        tagName: "div",
        properties: { class: "code-frame" },
        children: [bar, pre],
      };
    },
  };
}
