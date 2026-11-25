/**
 * Full-screen loading indicator shown while the authentication state is
 * being restored from the backend (application startup).
 */
export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100">
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700"
      />
      <p role="status" className="text-sm text-slate-500">
        Cargando…
      </p>
    </div>
  );
}
