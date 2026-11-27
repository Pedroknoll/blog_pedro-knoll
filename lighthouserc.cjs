const fs = require("fs");
const path = require("path");

const assertions = {
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
  "categories:seo": ["error", { minScore: 0.95, aggregationMethod: "median" }],
};

function collectDir(distName) {
  if (path.isAbsolute(distName) || distName.startsWith(".")) return distName;
  return `./${distName}`;
}

function postSlugs(distDir) {
  const blogDir = path.join(distDir, "blog");
  if (!fs.existsSync(blogDir)) return [];
  return fs
    .readdirSync(blogDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(path.join(blogDir, entry.name, "index.html")),
    )
    .map((entry) => entry.name)
    .sort();
}

function configFor(staticDistDir, urls, outputDir) {
  return {
    ci: {
      collect: {
        staticDistDir,
        url: urls,
        numberOfRuns: 5,
      },
      assert: { assertions },
      upload: {
        target: "filesystem",
        outputDir,
      },
    },
  };
}

const scope = process.env.LIGHTHOUSE_SCOPE;

if (scope === undefined) {
  const distDir = path.join(__dirname, "dist");

  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    throw new Error(
      "O Lighthouse precisa de dist/index.html. Rode o build de produção antes.",
    );
  }

  const slugs = postSlugs(distDir);

  if (slugs.length === 0) {
    throw new Error(
      "O Lighthouse precisa de ao menos um post em dist/blog/. Não há autodescoberta.",
    );
  }

  // T-86: no modo posts, só a home e os posts tocados que estão no dist/;
  // sem a variável, vazia ou com full, a lista inteira.
  const mode = process.env.LIGHTHOUSE_MODE || "full";
  let measured;
  if (mode === "full") {
    measured = slugs;
  } else if (mode === "posts") {
    const touched = new Set(
      (process.env.LIGHTHOUSE_POSTS ?? "").split(/\s+/).filter(Boolean),
    );
    measured = slugs.filter((slug) => touched.has(slug));
  } else {
    throw new Error(
      `LIGHTHOUSE_MODE=${mode} não é um modo do Lighthouse. Os modos são full e posts.`,
    );
  }

  module.exports = configFor(
    "./dist",
    [
      "http://localhost/",
      ...measured.map((slug) => `http://localhost/blog/${slug}/`),
    ],
    "./lhci-report",
  );
} else if (scope === "fixtures") {
  const distName = process.env.LIGHTHOUSE_DIST ?? "dist";
  const distDir = path.resolve(distName);
  const slugs = postSlugs(distDir).filter((slug) =>
    slug.startsWith("fixture-"),
  );

  if (slugs.length === 0) {
    throw new Error(
      `O Lighthouse de fixtures precisa de ao menos um post em ${distName}/blog/fixture-*/. Não há autodescoberta.`,
    );
  }

  module.exports = configFor(
    collectDir(distName),
    slugs.map((slug) => `http://localhost/blog/${slug}/`),
    "./lhci-report/fixtures",
  );
} else {
  throw new Error(
    `LIGHTHOUSE_SCOPE=${scope} não é um escopo do Lighthouse. O escopo conhecido é fixtures.`,
  );
}
