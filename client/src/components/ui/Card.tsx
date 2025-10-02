import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Card.module.css";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "md" | "lg";
  children: ReactNode;
};

export function Card({ padding = "md", className, children, ...rest }: CardProps) {
  return (
    <div className={cn(styles.card, styles[padding], className)} {...rest}>
      {children}
    </div>
  );
}
