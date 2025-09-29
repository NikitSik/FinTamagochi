import * as React from "react";

export default function ParrotBody(props: React.SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;

  return (
    <svg
      viewBox="0 0 360 360"
      width="100%"
      height="100%"
      role="img"
      aria-label="Тело попугая"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...rest}
    >
      <defs>
        <radialGradient id="parrot-body" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#6ff0ff" />
          <stop offset="100%" stopColor="#0096d2" />
        </radialGradient>
      </defs>

      {/* Тело попугая */}
      <g>
        <path
          d="M120 180c0-40 28-66 60-66s60 26 60 66v42c0 36-30 58-60 58s-60-22-60-58v-42z"
          fill="url(#parrot-body)"
        />
        {/* Брюшко попугая */}
        <path
          d="M140 210c0-18 28-30 60-30s60 12 60 30v20c0 16-28 28-60 28s-60-12-60-28v-20z"
          fill="url(#parrot-body)"
        />
      </g>
    </svg>
  );
}
