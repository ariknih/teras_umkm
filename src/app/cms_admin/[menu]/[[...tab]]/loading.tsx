export default function CmsAdminMenuLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-1.5 mb-6">
        <div className="h-8 w-24 bg-surface-container-low rounded-lg" />
        <div className="h-8 w-24 bg-surface-container-low rounded-lg" />
        <div className="h-8 w-24 bg-surface-container-low rounded-lg" />
      </div>

      <div className="bg-white border border-border-subtle rounded-[var(--radius-brand)] p-6 shadow-sm space-y-4">
        <div className="h-5 w-48 bg-surface-container-low rounded-md" />
        <div className="h-9 w-full bg-surface-container-low rounded-lg" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-surface-container-low rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
