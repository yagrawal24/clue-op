import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md bg-[#F3F4F6] px-4 py-2 text-base text-[#111827] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:bg-white focus-visible:border-2 focus-visible:border-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
