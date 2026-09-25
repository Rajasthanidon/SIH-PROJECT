function NotFoundPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft">
      <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600">The route you requested does not exist in the current foundation build.</p>
    </div>
  );
}

export default NotFoundPage;
