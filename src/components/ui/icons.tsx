import {
  Briefcase, Building2, GraduationCap, HeartPulse, Landmark, Leaf, Palette, Scale, ShieldCheck, TrendingUp, Users, Wheat,
  type LucideIcon,
} from "lucide-react";

export const THEME_ICONS: Record<string, LucideIcon> = {
  education: GraduationCap,
  health: HeartPulse,
  economy: TrendingUp,
  employment: Briefcase,
  security: ShieldCheck,
  agriculture: Wheat,
  infrastructure: Building2,
  environment: Leaf,
  justice: Scale,
  youth: Users,
  culture: Palette,
  landmark: Landmark,
};
export { THEME_ICON_KEYS } from "./icons-keys";

export function ThemeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = THEME_ICONS[name] ?? Landmark;
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}

type SocialProps = { className?: string };
const base = (path: string) =>
  function SocialIcon({ className }: SocialProps) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d={path} />
      </svg>
    );
  };

export const SOCIAL_ICONS = {
  facebook: base("M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z"),
  instagram: base("M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.9-7.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21 8.2c-.1-1.5-.4-2.8-1.5-3.8C18.4 3.4 17.1 3 15.6 3 14 2.9 10 2.9 8.4 3c-1.5.1-2.8.4-3.8 1.4S3.1 6.7 3 8.2c-.1 1.6-.1 6 0 7.6.1 1.5.4 2.8 1.5 3.8s2.3 1.4 3.8 1.5c1.6.1 5.6.1 7.2 0 1.5-.1 2.8-.4 3.8-1.5 1.1-1 1.4-2.3 1.5-3.8.1-1.6.1-6 .2-7.6Zm-2 9.4c-.3.8-1 1.4-1.8 1.8-1.2.5-4.2.4-5.2.4s-4 .1-5.2-.4a3 3 0 0 1-1.8-1.8c-.5-1.2-.4-4.1-.4-5.6s-.1-4.4.4-5.6c.3-.8 1-1.4 1.8-1.8C8 4.1 11 4.2 12 4.2s4-.1 5.2.4c.8.3 1.4 1 1.8 1.8.5 1.2.4 4.1.4 5.6s.1 4.4-.4 5.6Z"),
  x: base("M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"),
  youtube: base("M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z"),
  tiktok: base("M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.8a5.7 5.7 0 1 0 4.9 5.6V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z"),
  linkedin: base("M6.9 8.8H3.6V20h3.3V8.8ZM5.2 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM20.4 13.6c0-3-.7-5.1-4.1-5.1-1.7 0-2.8.9-3.2 1.8h-.1V8.8H9.8V20h3.3v-5.5c0-1.5.3-2.9 2.1-2.9 1.8 0 1.8 1.7 1.8 3V20h3.4v-6.4Z"),
  whatsapp: base("M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 5-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.1 8.1 0 1 1 12 20.1Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"),
} as const;
export type SocialKey = keyof typeof SOCIAL_ICONS;
