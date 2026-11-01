import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, pages, href, labels }: { page: number; pages: number; href: (p: number) => string; labels: { previous: string; next: string; page: string } }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-between border-t border-line pt-6 text-sm">
      {page > 1 ? <Link href={href(page - 1)} className="inline-flex items-center gap-2 font-medium text-navy-900"><ChevronLeft className="h-4 w-4" aria-hidden />{labels.previous}</Link> : <span />}
      <span className="text-muted">{labels.page} {page} / {pages}</span>
      {page < pages ? <Link href={href(page + 1)} className="inline-flex items-center gap-2 font-medium text-navy-900">{labels.next}<ChevronRight className="h-4 w-4" aria-hidden /></Link> : <span />}
    </nav>
  );
}
