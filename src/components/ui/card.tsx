import * as React from "react"

import { cn } from "@/lib/utils"

type CardVariant = 'default' | 'glass' | 'elevated' | 'flat';

function Card({
  className,
  size = "default",
  variant = "default",
  noPadding = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm";
  variant?: CardVariant;
  noPadding?: boolean;
}) {
  const variantMap: Record<CardVariant, string> = {
    default:  'bg-bg-2 dark:bg-zinc-950 border border-border shadow-sm hover:shadow-md transition-all duration-300',
    glass:    'bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-xl shadow-indigo-900/5 hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-500',
    elevated: 'bg-bg-2 border border-border shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
    flat:     'bg-transparent border-none shadow-none',
  };
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl text-sm",
        variantMap[variant],
        noPadding ? '' : 'py-4',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
