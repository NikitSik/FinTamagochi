import { cn } from "../../utils/cn";
import styles from "./ProgressBar.module.css";

type ProgressVariant = "mood" | "satiety" | "health" | "default";

type Props = {
  label: string;
  value: number;
  variant?: ProgressVariant;
  className?: string;
  tone?: "light" | "dark";
};

export function ProgressBar({ label, value, variant = "default", className, tone = "light" }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn(styles.progress, tone === "dark" && styles.progressDark, className)}>
      <div className={styles.header}>
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className={styles.track}>
        <div
          className={cn(styles.fill, styles[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
