import { Skeleton } from '@/components/ui/skeleton'

export default function GroupLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>

      <Skeleton className="h-9 w-full rounded-lg" />

      {/* podium-ish block */}
      <div className="rounded-3xl bg-card ring-1 ring-white/10 px-4 pt-10 pb-6">
        <div className="flex items-end justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="flex flex-col items-center gap-2 -translate-y-3">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5 ring-1 ring-white/8">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
