import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center", className)}>
      {icon && <div className="text-muted-foreground/50" aria-hidden="true">{icon}</div>}
      <div>
        <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
