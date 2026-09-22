import { FAQ_ITEMS } from "./faq.js";

export const DEFAULT_SITE_URL = "https://data-stock.vercel.app";
export const SITE_NAME = "DataStock";
export const SITE_TAGLINE = "Encrypted cloud storage";
export const DEFAULT_OG_IMAGE = "/og-image.png";
export const SUPPORT_EMAIL = "support@datastock.app";

export function getSiteUrl() {
  const fromVite =
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SITE_URL;
  const fromProcess =
    typeof globalThis !== "undefined" && globalThis.process?.env?.VITE_SITE_URL;
  const raw = fromVite || fromProcess || DEFAULT_SITE_URL;
  return String(raw).replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  const site = getSiteUrl();
  if (!path || path === "/") return `${site}/`;
  return `${site}${path.startsWith("/") ? path : `/${path}`}`;
}

export function ogImageUrl() {
  return absoluteUrl(DEFAULT_OG_IMAGE);
}

/** Public routes that should be indexed and listed in sitemap.xml */
export const PUBLIC_INDEXABLE_ROUTES = [
  {
    id: "home",
    path: "/",
    title: "DataStock — Encrypted Cloud Storage | 10 GB Free",
    description:
      "DataStock is encrypted cloud storage for files and folders. Upload, organize, and share securely with 10 GB free forever. No credit card required.",
    keywords: "encrypted cloud storage, secure file sharing, online drive, DataStock",
  },
  {
    id: "pricing",
    path: "/pricing",
    title: "Cloud Storage Pricing — Free, Pro & Family | DataStock",
    description:
      "Compare DataStock plans: 10 GB free, 2 TB Pro, and 5 TB Family. Transparent monthly or yearly pricing for encrypted cloud storage.",
    keywords: "cloud storage pricing, DataStock plans, 10 GB free storage",
  },
  {
    id: "help",
    path: "/help",
    title: "Help Center & FAQs | DataStock",
    description:
      "Guides for uploading files, sharing folders, storage limits, account security, and billing on DataStock encrypted cloud storage.",
    keywords: "DataStock help, cloud storage FAQ, file sharing guide",
  },
  {
    id: "login",
    path: "/login",
    title: "Log in to DataStock",
    description:
      "Sign in to your DataStock account with email, OTP, or Google to access encrypted files and folders from any device.",
    keywords: "DataStock login, sign in cloud storage",
  },
  {
    id: "signup",
    path: "/signup",
    title: "Create a DataStock Account | 10 GB Free",
    description:
      "Sign up for DataStock and get 10 GB of encrypted cloud storage. Organize files, share securely, and access your drive from the web.",
    keywords: "DataStock sign up, free cloud storage account",
  },
];

export const PRIVATE_NOINDEX_ROUTES = [
  {
    id: "dashboard",
    path: "/dashboard",
    title: "My Drive | DataStock",
    description: "Your private DataStock drive. This page is not listed in search engines.",
  },
  {
    id: "profile",
    path: "/profile",
    title: "Account settings | DataStock",
    description: "Manage your DataStock profile and account. This page is not listed in search engines.",
  },
  {
    id: "notifications",
    path: "/notifications",
    title: "Notifications | DataStock",
    description: "Your DataStock notifications. This page is not listed in search engines.",
  },
  {
    id: "trash",
    path: "/trash",
    title: "Trash | DataStock",
    description: "Restore or permanently delete files. This page is not listed in search engines.",
  },
  {
    id: "payment-success",
    path: "/payment-success",
    title: "Payment complete | DataStock",
    description: "Subscription confirmation. This page is not listed in search engines.",
  },
  {
    id: "share",
    path: "/share",
    title: "Shared file | DataStock",
    description: "A private or password-protected share link. This page is not listed in search engines.",
  },
  {
    id: "not-found",
    path: "/404",
    title: "Page not found | DataStock",
    description: "This DataStock page does not exist.",
  },
];

export function getPageSeo(id) {
  return (
    PUBLIC_INDEXABLE_ROUTES.find((r) => r.id === id) ||
    PRIVATE_NOINDEX_ROUTES.find((r) => r.id === id)
  );
}

export { FAQ_ITEMS };
