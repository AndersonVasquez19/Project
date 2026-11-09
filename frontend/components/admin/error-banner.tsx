type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      {message}
      {onRetry && (
        <button
          type="button"
          className="ml-2 font-semibold underline underline-offset-2"
          onClick={onRetry}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
