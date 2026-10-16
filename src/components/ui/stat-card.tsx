import * as React from "react"
import { Loader2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: React.ReactNode
  description?: string
  icon?: React.ReactNode
  trend?: React.ReactNode
  loading?: boolean
  tone?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

const toneStyles = {
  default: { icon: "var(--primary)", background: "var(--primary-dim)" },
  success: { icon: "var(--success)", background: "var(--success-dim)" },
  warning: { icon: "var(--warning)", background: "var(--warning-dim)" },
  danger: { icon: "var(--danger)", background: "var(--danger-dim)" },
  info: { icon: "var(--info)", background: "var(--info-dim)" },
} as const

export function StatCard({
  label,
  value,
  description,
  icon,
  trend,
  loading = false,
  tone = "default",
  className,
}: StatCardProps) {
  const colors = toneStyles[tone]

  return (
    <article
      className={cn("relative rounded-2xl border border-border bg-bg-2 p-4 shadow-sm transition-shadow hover:shadow-md", className)}
      aria-busy={loading}
    >
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{ background: colors.background, color: colors.icon }}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Chargement" />}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
        {loading ? <span className="inline-block h-7 w-20 animate-pulse rounded-md bg-muted" aria-label="Chargement" /> : value}
      </p>
      {(description || trend) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: colors.icon }}>
              <TrendingUp aria-hidden="true" className="size-3" />
              {trend}
            </span>
          )}
          {description && <span>{description}</span>}
        </div>
      )}
    </article>
  )
}
