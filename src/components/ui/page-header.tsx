import * as React from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface PageHeaderBreadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: PageHeaderBreadcrumb[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Fil d'Ariane" className="mb-2 flex flex-wrap items-center gap-1.5">
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={`${breadcrumb.label}-${index}`}>
                {index > 0 && <ChevronRight aria-hidden="true" className="size-3.5 text-muted-foreground" />}
                {breadcrumb.href ? (
                  <Link
                    href={breadcrumb.href}
                    className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-foreground">{breadcrumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
