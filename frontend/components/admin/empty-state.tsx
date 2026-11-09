import Link from "next/link";

type EmptyStateProps = {
  title: string;
  message: string;
  actionUrl?: string | null;
  actionText?: string | null;
  icon?: string;
};

export function EmptyState({
  title,
  message,
  actionUrl = null,
  actionText = null,
  icon = "fa-folder-open",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F4F7FB]/70 px-6 py-10 text-center">
      <span className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#176B9A]/20 bg-[#176B9A]/10 text-xl text-[#176B9A] shadow-sm">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </span>
      <h2 className="text-base font-bold text-[#172B3A]">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-[#64748B]">{message}</p>
      {actionUrl && actionText && (
        <Link href={actionUrl} className="admin-btn-primary mt-5">
          <i className="fa-solid fa-plus" aria-hidden="true" />
          {actionText}
        </Link>
      )}
    </div>
  );
}
