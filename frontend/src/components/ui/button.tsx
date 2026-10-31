import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20",
      secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
      ghost: "hover:bg-slate-800 text-slate-300",
      danger: "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30",
      success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
