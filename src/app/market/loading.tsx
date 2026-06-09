export default function MarketLoading() {
  return (
    <div className="relative min-h-screen bg-bg-dark pt-8 pb-24 px-4 md:px-10">
      <div className="relative z-10 max-w-[1440px] mx-auto space-y-8 animate-pulse">
        {/* Top Header / Search Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="h-10 w-full md:w-1/3 bg-surface-container-low rounded-xl" />
          <div className="flex gap-3 overflow-x-hidden w-full md:w-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-surface-container-low rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Promo Banner Skeleton */}
        <div className="h-48 md:h-64 w-full bg-surface-container-low rounded-2xl" />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar / Filters Skeleton */}
          <div className="hidden lg:block w-64 shrink-0 space-y-6">
            <div className="h-6 w-32 bg-surface-container-high rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 w-full bg-surface-container-low rounded" />
              ))}
            </div>
          </div>

          {/* Product Grid Skeleton */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="border border-border-subtle rounded-2xl bg-surface-dark overflow-hidden flex flex-col justify-between shadow-md h-[340px]">
                  {/* Image Placeholder */}
                  <div className="h-40 w-full bg-surface-container-low" />
                  <div className="p-4 flex-grow space-y-3">
                    {/* Title */}
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-surface-container-high rounded" />
                      <div className="h-4 w-3/4 bg-surface-container-low rounded" />
                    </div>
                    {/* Price */}
                    <div className="h-5 w-1/2 bg-primary/20 rounded mt-2" />
                    {/* Rating/Store */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-3 w-1/3 bg-surface-container-low rounded" />
                      <div className="h-3 w-1/4 bg-surface-container-low rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
