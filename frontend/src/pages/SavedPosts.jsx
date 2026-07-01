export default function SavedPosts() {
  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-text-primary mb-1">Saved Posts 📄</h2>
        <p className="text-sm text-text-secondary">View and manage your generated LinkedIn posts</p>
      </div>
      <div className="animate-fade-in bg-bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="text-center py-12 px-6">
          <div className="text-5xl mb-4 opacity-50">📄</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Saved Posts Coming Soon</h3>
          <p className="text-sm text-text-secondary max-w-[360px] mx-auto">
            This page will be built in Part 3. Browse, search, filter, copy, and manage your posts.
          </p>
        </div>
      </div>
    </div>
  );
}
