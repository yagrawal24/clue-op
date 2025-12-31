import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:scale-105 active:scale-[0.98] h-14 px-8",
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#DC2626] hover:scale-105 active:scale-[0.98] h-14 px-8",
        outline:
          "border-[3px] border-[#3B82F6] bg-transparent text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white h-14 px-8",
        secondary:
          "bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB] hover:scale-105 active:scale-[0.98] h-14 px-8",
        ghost: "bg-transparent text-[#3B82F6] hover:bg-[#F3F4F6] h-14 px-8",
        link: "text-[#3B82F6] underline-offset-4 hover:underline h-auto px-0",
      },
      size: {
        default: "h-14 px-8",
        sm: "h-12 px-6 text-sm",
        lg: "h-16 px-10 text-base",
        icon: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
