import { useEffect } from "react";
import { getSiteUrl, ogImageUrl, SITE_NAME } from "./config";

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(payload) {
  document.head.querySelectorAll("script[data-seo-jsonld]").forEach((n) => n.remove());
  if (!payload) return;
  const items = Array.isArray(payload) ? payload : [payload];
  items.forEach((data, i) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", String(i));
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  });
}

export default function SeoHead({
  title,
  description,
  path = "/",
  noindex = false,
  image,
  jsonLd,
  keywords,
}) {
  useEffect(() => {
    const site = getSiteUrl();
    const canonical = path === "/" ? `${site}/` : `${site}${path.startsWith("/") ? path : `/${path}`}`;
    const ogImage = image || ogImageUrl();
    const robots = noindex ? "noindex, nofollow" : "index, follow";

    document.title = title;
    document.documentElement.lang = "en";

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "googlebot", robots);
    if (keywords) upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "author", SITE_NAME);
    upsertMeta("name", "application-name", SITE_NAME);

    upsertLink("canonical", canonical);

    upsertMeta("property", "og:type", noindex ? "website" : "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "en_US");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:image:alt", `${SITE_NAME} — encrypted cloud storage`);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    setJsonLd(noindex ? null : jsonLd);
  }, [title, description, path, noindex, image, keywords, JSON.stringify(jsonLd)]);

  return null;
}
