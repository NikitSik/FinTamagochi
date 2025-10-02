import type { ReactNode } from "react";
import { Button as BrandButton, type ButtonProps } from "./ui/Button";
import { Card as BrandCard, type CardProps } from "./ui/Card";
import { cn } from "../utils/cn";
import styles from "./UI.module.css";

export function Card(props: CardProps) {
  return <BrandCard {...props} />;
}

export function Button(props: ButtonProps) {
  return <BrandButton {...props} />;
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.screen, className)}>{children}</div>;
}
