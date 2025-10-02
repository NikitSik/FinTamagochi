import { useId } from "react";

type CoinIconVariant = "gold" | "brandSafe";

type Props = {
  size?: number;
  variant?: CoinIconVariant;
};

export function CoinIcon({ size = 18, variant = "gold" }: Props) {
  const uid = useId();
  const gradientId = `${uid}-${variant}`;

  const stops =
    variant === "gold"
      ? [
          { offset: "0%", color: "#F8D46B" },
          { offset: "45%", color: "#F1C24A" },
          { offset: "100%", color: "#D4A017" },
        ]
      : [
          { offset: "0%", color: "#58FFFF" },
          { offset: "100%", color: "#1919EF" },
        ];

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          {stops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill={`url(#${gradientId})`} />
      <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(0, 0, 0, 0.2)" strokeWidth="1" />
      <path
        d="M12 7v10M9 10.5h6M9 13.5h6"
        stroke="rgba(0, 0, 0, 0.4)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8" r="2" fill="rgba(255, 255, 255, 0.28)" />
    </svg>
  );
}
