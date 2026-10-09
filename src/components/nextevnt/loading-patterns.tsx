import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface">
      <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr] gap-4 bg-surface-subtle px-4 py-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-14" /><Skeleton className="h-3 w-16" /></div>
      {Array.from({ length: rows }).map((_, index) => <div key={index} className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr] items-center gap-4 border-t border-border-subtle px-4 py-4"><div className="flex items-center gap-3"><Skeleton className="size-9 shrink-0 rounded-full" /><Skeleton className="h-3 w-28" /></div><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-3 w-16" /></div>)}
    </div>
  );
}

function MediaCardSkeleton({ vendor }: { vendor?: boolean }) {
  return <Card className="overflow-hidden"><Skeleton className="aspect-[3/2] w-full rounded-none" /><CardContent className="grid gap-3"><div className="flex items-center gap-3">{vendor ? <Skeleton className="size-8 rounded-full" /> : null}<div className="grid flex-1 gap-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-2/5" /></div></div><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /><div className="flex gap-2 pt-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-28" /></div></CardContent></Card>;
}

export function EventCardSkeleton() { return <MediaCardSkeleton />; }
export function VendorCardSkeleton() { return <MediaCardSkeleton vendor />; }
export function ImageSkeleton() { return <Skeleton className="aspect-[16/10] w-full rounded-[var(--radius-lg)]" />; }

export function DashboardSectionSkeleton() {
  return <div className="grid gap-4"><div className="flex items-center justify-between"><Skeleton className="h-5 w-40" /><Skeleton className="h-8 w-20" /></div><div className="grid gap-3 lg:grid-cols-3">{[1, 2, 3].map((item) => <Card key={item}><CardContent className="grid gap-3 py-5"><Skeleton className="size-9 rounded-[var(--radius-md)]" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></CardContent></Card>)}</div></div>;
}

export function FormSkeleton() {
  return <div className="grid gap-5 rounded-[var(--radius-lg)] border border-border-subtle bg-surface p-6"><div className="grid gap-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-full" /></div><div className="grid gap-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-10 w-full" /></div><div className="grid gap-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-24 w-full" /></div></div>;
}
