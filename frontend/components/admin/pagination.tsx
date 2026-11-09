import Link from "next/link";

export type PaginatorLink = {
  url: string | null;
  label: string;
  active: boolean;
};

export type PaginatorData = {
  current_page: number;
  last_page: number;
  links: PaginatorLink[];
};

type PaginationProps = {
  paginator: PaginatorData;
};

function visibleLabel(label: string): string {
  return label
    .replaceAll("&laquo;", "«")
    .replaceAll("&raquo;", "»")
    .replace(/<[^>]*>/g, "");
}

export function Pagination({ paginator }: PaginationProps) {
  if (paginator.last_page <= 1) {
    return null;
  }

  return (
    <div className="admin-pagination">
      <nav aria-label="Paginación">
        <ul className="flex flex-wrap items-center justify-center gap-1">
          {paginator.links.map((link, index) => (
            <li key={`${index}-${link.label}`}>
              {link.url && !link.active ? (
                <Link
                  aria-label={visibleLabel(link.label)}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#64748B] transition hover:border-[#287FB5]/40 hover:bg-[#F4F7FB] hover:text-[#176B9A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B9A]"
                  href={link.url}
                >
                  {visibleLabel(link.label)}
                </Link>
              ) : (
                <span
                  aria-current={link.active ? "page" : undefined}
                  aria-disabled={!link.url}
                  className={
                    link.active
                      ? "inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-[#176B9A] bg-[#176B9A] px-3 text-sm font-semibold text-white"
                      : "inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#94A3B8]"
                  }
                >
                  {visibleLabel(link.label)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
