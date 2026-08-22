import { FAQ_ITEMS, SITE_NAME, SUPPORT_EMAIL, absoluteUrl, getSiteUrl, ogImageUrl } from "./config.js";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl("/datastock-logo.svg"),
    email: SUPPORT_EMAIL,
    description: "DataStock is a secure, end-to-end encrypted cloud storage platform with 10 GB free forever.",
    sameAs: [
      "https://github.com",
      "https://twitter.com",
    ],
  };
}

export function websiteJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: site,
    description: "Encrypted cloud storage to upload, organize, and share files with 10 GB free.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: site,
      logo: absoluteUrl("/datastock-logo.svg"),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site}/help?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: SITE_NAME,
    url: getSiteUrl(),
    applicationCategory: "CloudStorageApplication",
    operatingSystem: "Web, Windows, macOS, Linux, iOS, Android",
    description:
      "Web-based encrypted cloud storage for uploading, organizing, and sharing files and folders with zero-knowledge encryption.",
    image: ogImageUrl(),
    featureList: [
      "10 GB Free Encrypted Storage",
      "Client-side End-to-End Encryption (AES-GCM + RSA)",
      "Instant In-browser Document & Media Previews (PDF, DOCX, XLSX, Video, Audio)",
      "Secure File & Folder Sharing with View/Edit Permissions",
      "30-day Trash Retention & One-Click Recovery",
      "Cross-device Responsiveness with 60 FPS Smooth UI",
    ],
    offers: [
      {
        "@type": "Offer",
        name: "Basic Plan",
        price: "0",
        priceCurrency: "INR",
        description: "10 GB free encrypted cloud storage forever",
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "149",
        priceCurrency: "INR",
        description: "2 TB high-speed encrypted cloud storage",
      },
      {
        "@type": "Offer",
        name: "Family Plan",
        price: "399",
        priceCurrency: "INR",
        description: "5 TB shared encrypted cloud storage for up to 6 members",
      },
    ],
  };
}

export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPageJsonLd(items = FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function homeJsonLdGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      websiteJsonLd(),
      softwareApplicationJsonLd(),
      faqPageJsonLd(),
    ],
  };
}

export function jsonLdForPublicRoute(routeId) {
  if (routeId === "home") return homeJsonLdGraph();
  if (routeId === "help") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        faqPageJsonLd(),
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Help Center", path: "/help" },
        ]),
      ],
    };
  }
  if (routeId === "pricing") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        softwareApplicationJsonLd(),
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]),
      ],
    };
  }
  if (routeId === "login" || routeId === "signup") {
    return breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: routeId === "login" ? "Log in" : "Sign up", path: routeId === "login" ? "/login" : "/signup" },
    ]);
  }
  return null;
}

