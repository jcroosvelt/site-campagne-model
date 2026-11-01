import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { hasDatabase, prisma } from "./db";
import { SECTIONS, buildSchema, type SectionKey, type SectionValue } from "./settings-schema";

function merge<T>(defaults: T, stored: unknown): T {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return defaults;
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [k, v] of Object.entries(stored as Record<string, unknown>)) {
    if (k in out && v !== undefined && v !== null) out[k] = v;
  }
  return out as T;
}

/** Lit une section de paramètres (valeurs stockées fusionnées avec les valeurs par défaut). */
export const getSetting = cache(async <K extends SectionKey>(key: K): Promise<SectionValue<K>> => {
  if (!hasDatabase()) return SECTIONS[key].defaults as unknown as SectionValue<K>;
  const row = await prisma.setting.findUnique({ where: { key } });
  return merge(SECTIONS[key].defaults as unknown as SectionValue<K>, row?.value);
});

export async function saveSetting<K extends SectionKey>(key: K, raw: unknown): Promise<SectionValue<K>> {
  const schema = buildSchema(SECTIONS[key].fields as never);
  const value = schema.parse(raw) as SectionValue<K>;
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: value as Prisma.InputJsonValue },
    update: { value: value as Prisma.InputJsonValue },
  });
  return value;
}
