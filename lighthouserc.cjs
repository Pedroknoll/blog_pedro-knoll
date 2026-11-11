const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  throw new Error(
    "O Lighthouse precisa de dist/index.html. Rode o build de produção antes.",
  );
}

const blogDir = path.join(distDir, "blog");
const slugs = fs.existsSync(blogDir)
  ? fs
      .readdirSync(blogDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          fs.existsSync(path.join(blogDir, entry.name, "index.html")),
      )
      .map((entry) => entry.name)
      .sort()
  : [];

if (slugs.length === 0) {
  throw new Error(
    "O Lighthouse precisa de ao menos um post em dist/blog/. Não há autodescoberta.",
  );
}

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: [
        "http://localhost/",
        ...slugs.map((slug) => `http://localhost/blog/${slug}/`),
      ],
      numberOfRuns: 5,
    },
    assert: {
      assertions: {
        "largest-contentful-paint": [
          "error",
          { maxNumericValue: 2000, aggregationMethod: "median" },
        ],
        "cumulative-layout-shift": [
          "error",
          { maxNumericValue: 0.05, aggregationMethod: "median" },
        ],
        "categories:performance": [
          "error",
          { minScore: 0.95, aggregationMethod: "median" },
        ],
        "categories:accessibility": [
          "error",
          { minScore: 0.95, aggregationMethod: "median" },
        ],
        "categories:best-practices": [
          "error",
          { minScore: 0.95, aggregationMethod: "median" },
        ],
        "categories:seo": [
          "error",
          { minScore: 0.95, aggregationMethod: "median" },
        ],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lhci-report",
    },
  },
};
