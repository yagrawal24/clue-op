import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md bg-[#F3F4F6] px-4 py-2 text-base text-[#111827] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:bg-white focus-visible:border-2 focus-visible:border-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
