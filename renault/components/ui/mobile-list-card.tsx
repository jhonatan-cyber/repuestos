"use client"

import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export function MobileList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3 md:hidden", className)} {...props} />
}

export function MobileListCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-colors",
        className,
      )}
      {...props}
    />
  )
}

export function MobileListHeader({
  title,
  subtitle,
  trailing,
  titleClassName,
}: {
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  titleClassName?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <div className={cn("truncate text-sm font-semibold text-foreground", titleClassName)}>
          {title}
        </div>
        {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}

export function MobileListGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-3 grid grid-cols-2 gap-3", className)} {...props} />
}

export function MobileListField({
  label,
  value,
  className,
}: {
  label: ReactNode
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export function MobileListActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3",
        className,
      )}
      {...props}
    />
  )
}

export function MobileListState({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("module-empty flex items-center justify-center md:hidden", className)}>
      {message}
    </div>
  )
}
