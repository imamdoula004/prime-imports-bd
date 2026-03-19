'use client';

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200/60",
                className
            )}
            {...props}
        />
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-[12px] p-4 border border-black/[0.08] shadow-[0_10px_24px_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.12)] flex flex-col gap-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="mt-auto pt-2 flex items-center justify-between">
                <Skeleton className="h-6 w-1/4 rounded-lg" />
                <Skeleton className="h-8 w-1/3 rounded-lg" />
            </div>
        </div>
    );
}
