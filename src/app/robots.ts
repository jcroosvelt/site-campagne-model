import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSetting("seo");
  return {
    rules: seo.indexable ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/faire-un-don/confirmation"] } : { userAgent: "*", disallow: "/" },
    sitemap: `${env.appUrl()}/sitemap.xml`,
  };
}
