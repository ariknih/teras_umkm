import { GridSkeleton } from '@/components/ui/GhostSkeleton'

export default function CommunityDirectoryLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7F9] py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-[1200px] mx-auto space-y-6">
        <div className="h-56 sm:h-64 bg-white/60 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GridSkeleton count={6} type="community" />
        </div>
      </div>
    </div>
  )
}
