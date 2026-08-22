import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { PUBLIC_INDEXABLE_ROUTES, DEFAULT_SITE_URL, SITE_NAME } from "./src/seo/config.js";
import { jsonLdForPublicRoute } from "./src/seo/structuredData.js";

function siteUrl() {
  return String(process.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHead({ title, description, path, keywords }) {
  const origin = siteUrl();
  const canonical = path === "/" ? `${origin}/` : `${origin}${path}`;
  const image = `${origin}/og-image.png`;
  const gsc = process.env.VITE_GSC_VERIFICATION || "";

  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta name="googlebot" content="index, follow" />`,
    keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : "",
    `<meta name="author" content="${SITE_NAME}" />`,
    `<meta name="application-name" content="${SITE_NAME}" />`,
    gsc ? `<meta name="google-site-verification" content="${escapeHtml(gsc)}" />` : "",
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="${SITE_NAME} — encrypted cloud storage" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");
}

function buildJsonLd(routeId) {
  const data = jsonLdForPublicRoute(routeId);
  if (!data) return "";
  return `<script type="application/ld+json" data-seo-jsonld="0">${JSON.stringify(data)}</script>`;
}

function replaceBlock(html, start, end, inner) {
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!re.test(html)) {
    throw new Error(`SEO markers missing: ${start}`);
  }
  return html.replace(re, `${start}\n    ${inner}\n    ${end}`);
}

function writeSitemap(outDir) {
  const origin = siteUrl();
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_INDEXABLE_ROUTES.map((route) => {
    const loc = route.path === "/" ? `${origin}/` : `${origin}${route.path}`;
    const priority = route.path === "/" ? "1.0" : "0.8";
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  writeFileSync(join(outDir, "sitemap.xml"), xml);
}

function writeRobots(outDir) {
  const origin = siteUrl();
  const body = `User-agent: *
Allow: /
Allow: /pricing
Allow: /help
Allow: /login
Allow: /signup

Disallow: /dashboard
Disallow: /profile
Disallow: /settings
Disallow: /notifications
Disallow: /trash
Disallow: /payment-success
Disallow: /share/

Sitemap: ${origin}/sitemap.xml
`;
  writeFileSync(join(outDir, "robots.txt"), body);
}

export function seoPrerenderPlugin() {
  return {
    name: "datastock-seo-prerender",
    apply: "build",
    writeBundle(options) {
      const outDir = options.dir || join(process.cwd(), "dist");
      const indexPath = join(outDir, "index.html");
      const template = readFileSync(indexPath, "utf8");

      for (const route of PUBLIC_INDEXABLE_ROUTES) {
        let html = template;
        html = replaceBlock(
          html,
          "<!--seo-head-->",
          "<!--/seo-head-->",
          buildHead(route)
        );
        html = replaceBlock(
          html,
          "<!--seo-jsonld-->",
          "<!--/seo-jsonld-->",
          buildJsonLd(route.id)
        );

        const target =
          route.path === "/" ? indexPath : join(outDir, route.path.slice(1), "index.html");
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, html);
      }

      writeSitemap(outDir);
      writeRobots(outDir);
    },
  };
}
