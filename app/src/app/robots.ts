import type { MetadataRoute } from "next";

// The public pages may be indexed; demo, sign-in links, people's pages and APIs never.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/access", "/prototype", "/auth", "/me", "/clinic", "/system", "/api"] }],
  };
}
