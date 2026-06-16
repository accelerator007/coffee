import Skeleton from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-14 border-b border-border bg-background/90" />
      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full flex flex-col gap-5">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </main>
    </div>
  )
}
