export default function AcademyLoading() {
  return (
    <div className="relative min-h-screen bg-bg-dark pt-24 pb-24 px-6 md:px-10">
      <div className="relative z-10 max-w-[1200px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-16 text-center max-w-2xl mx-auto space-y-4">
          <div className="h-4 w-32 bg-surface-container-low rounded-full mx-auto" />
          <div className="h-10 w-3/4 bg-surface-container-high rounded-lg mx-auto" />
          <div className="h-6 w-full bg-surface-container-low rounded mx-auto mt-4" />
          <div className="h-6 w-5/6 bg-surface-container-low rounded mx-auto" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 Skeleton */}
          <div className="border border-border-subtle rounded-2xl bg-surface-dark overflow-hidden flex flex-col justify-between p-6 md:p-10 shadow-md h-[400px]">
            <div className="space-y-6">
              <div className="h-12 w-12 bg-surface-container-high rounded-full" />
              <div className="space-y-4">
                <div className="h-8 w-1/2 bg-surface-container-high rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-surface-container-low rounded" />
                  <div className="h-4 w-5/6 bg-surface-container-low rounded" />
                  <div className="h-4 w-4/5 bg-surface-container-low rounded" />
                </div>
              </div>
            </div>
            <div className="pt-8">
              <div className="h-12 w-32 bg-surface-container-high rounded-[24px]" />
            </div>
          </div>

          {/* Card 2 Skeleton */}
          <div className="border border-border-subtle rounded-2xl bg-surface-dark overflow-hidden flex flex-col justify-between p-6 md:p-10 shadow-md h-[400px]">
            <div className="space-y-6">
              <div className="h-12 w-12 bg-surface-container-high rounded-full" />
              <div className="space-y-4">
                <div className="h-8 w-1/2 bg-surface-container-high rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-surface-container-low rounded" />
                  <div className="h-4 w-5/6 bg-surface-container-low rounded" />
                  <div className="h-4 w-4/5 bg-surface-container-low rounded" />
                </div>
              </div>
            </div>
            <div className="pt-8">
              <div className="h-12 w-32 bg-surface-container-high rounded-[24px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
