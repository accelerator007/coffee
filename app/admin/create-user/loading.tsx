import Skeleton from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-14 border-b border-border bg-background/90" />
      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 rounded-2xl" />
      </main>
    </div>
  )
}
