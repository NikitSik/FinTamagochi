import { useId } from "react";

type Props = {
  size?: number;
};

export function CoinIcon({ size = 18 }: Props) {
  const gradientId = `${useId()}-coin-g`;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#58FFFF" />
          <stop offset="100%" stopColor="#1919EF" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill={`url(#${gradientId})`} />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="1"
      />
      <path
        d="M12 7v10M9 10.5h6M9 13.5h6"
        stroke="#000"
        strokeOpacity=".35"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

