import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./InputField.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  caption?: string;
  error?: string | null;
  icon?: ReactNode;
  className?: string;
};

export const InputField = forwardRef<HTMLInputElement, Props>(
  ({ label, caption, error, icon, className, ...props }, ref) => {
    return (
      <label className={cn(styles.field, error && styles.invalid, className)}>
        {label && <span className={styles.label}>{label}</span>}
        <div className={styles.control}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input ref={ref} {...props} />
        </div>
        {caption && !error && <span className={styles.caption}>{caption}</span>}
        {error && <span className={styles.error}>{error}</span>}
      </label>
    );
  }
);

InputField.displayName = "InputField";
