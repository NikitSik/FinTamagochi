import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "accent" | "secondary" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", type = "button", fullWidth = true, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(styles.button, styles[variant], fullWidth && styles.fullWidth, className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
