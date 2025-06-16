import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "../../lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn("fixed z-50 bg-zinc-900 p-6 rounded-md shadow-lg max-w-lg w-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white", className)}
      {...props}
    />
  </DialogPrimitive.Portal>
))

DialogContent.displayName = "DialogContent"

export { Dialog, DialogTrigger, DialogContent }