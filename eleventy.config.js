import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import callouts from "./lib/callouts.js";
import tableOfContents from "./lib/toc.js";

export default function (eleventyConfig) {
  // Rewrites absolute links (/css/..., /posts/...) so the site also works
  // when hosted under a sub-path such as https://user.github.io/repo-name/
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Colored code in ```bash / ```python / ... blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // > [!WARNING] style callout boxes in Markdown
  eleventyConfig.amendLibrary("md", (md) => md.use(callouts).use(tableOfContents));

  // Files copied as-is into the finished site
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("cv");

  // Posts of one drawer (tag), newest first
  eleventyConfig.addFilter("byTag", (posts, tag) =>
    posts
      .filter((p) => p.data.tag === tag)
      .sort((a, b) => b.date - a.date)
  );

  // 28 SEP 2026
  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  eleventyConfig.addFilter("fmtDate", (d) => {
    const x = new Date(d);
    return `${String(x.getUTCDate()).padStart(2, "0")} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  });

  return {
    // Curly braces in posts (e.g. {{7*7}} in a code block) must stay untouched
    markdownTemplateEngine: false,
    pathPrefix: process.env.PATH_PREFIX || "/",
    dir: { input: ".", includes: "_includes", data: "_data", output: "_site" }
  };
}
