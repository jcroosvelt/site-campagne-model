import ReactMarkdown from "react-markdown";
import { isSafeHref } from "@/lib/utils";

/** Rendu Markdown sécurisé : le HTML brut est ignoré (protection XSS), les liens sont filtrés. */
export function Markdown({ children, className = "prose-campaign" }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        skipHtml
        urlTransform={(url) => (isSafeHref(url) ? url : "")}
        components={{
          a: ({ href, children: c }) => {
            const external = href && /^https?:\/\//.test(href);
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {c}
              </a>
            );
          },
          img: ({ src, alt }) => (typeof src === "string" && isSafeHref(src) ? <img src={src} alt={alt ?? ""} loading="lazy" className="rounded-sm" /> : null),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
