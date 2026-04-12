export default function MapLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-foreground" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </main>
  );
}
