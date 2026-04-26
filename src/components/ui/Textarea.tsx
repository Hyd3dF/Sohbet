import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn("input-base resize-none min-h-[80px]", className)}
      {...rest}
    />
  ),
);
Textarea.displayName = "Textarea";
