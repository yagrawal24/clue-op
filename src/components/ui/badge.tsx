import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#3B82F6] text-white hover:bg-[#2563EB]",
        secondary:
          "bg-[#10B981] text-white hover:bg-[#059669]",
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#DC2626]",
        outline: "border-2 border-[#E5E7EB] text-[#111827] hover:bg-[#F3F4F6]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
