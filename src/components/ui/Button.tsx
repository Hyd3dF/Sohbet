import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", className, ...rest }, ref) => {
    const cls =
      variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "btn-ghost";
    return <button ref={ref} className={cn(cls, className)} {...rest} />;
  },
);
Button.displayName = "Button";
