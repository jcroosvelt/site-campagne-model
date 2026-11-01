import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { ipFromRequest, isSameOrigin } from "@/lib/request";

const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse/i;

/** Comptage anonyme des visiteurs uniques par jour : empreinte hachée et salée quotidiennement, sans cookie. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return new Response(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });
  const dayStr = new Date().toISOString().slice(0, 10);
  const visitorHash = createHash("sha256").update(`${env.appSecret()}|${dayStr}|${ipFromRequest(req)}|${ua}`).digest("hex").slice(0, 32);
  const day = new Date(`${dayStr}T00:00:00Z`);
  await prisma.visitorDay.upsert({
    where: { day_visitorHash: { day, visitorHash } },
    create: { day, visitorHash },
    update: { views: { increment: 1 } },
  });
  return new Response(null, { status: 204 });
}
