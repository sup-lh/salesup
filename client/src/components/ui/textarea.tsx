import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-primary/15 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-24 w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-base leading-6 shadow-xs transition-[border-color,box-shadow,background-color] outline-none focus-visible:ring-[3px] enabled:hover:border-primary/45 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60 read-only:bg-muted/40 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
