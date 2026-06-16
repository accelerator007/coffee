import Skeleton from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-14 border-b border-border bg-background/90" />
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </main>
    </div>
  )
}
