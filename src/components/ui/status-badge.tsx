import * as React from "react"
import { cn } from "@/lib/utils"

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  tone?: StatusTone
  dot?: boolean
}

const toneStyles: Record<StatusTone, { color: string; background: string }> = {
  neutral: { color: "var(--text-muted)", background: "var(--bg-4)" },
  success: { color: "var(--success)", background: "var(--success-dim)" },
  warning: { color: "var(--warning)", background: "var(--warning-dim)" },
  danger: { color: "var(--danger)", background: "var(--danger-dim)" },
  info: { color: "var(--info)", background: "var(--info-dim)" },
}

export function StatusBadge({ children, tone = "neutral", dot = false, className, ...props }: StatusBadgeProps) {
  const styles = toneStyles[tone]

  return (
    <span
      className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", className)}
      style={{ color: styles.color, background: styles.background }}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
