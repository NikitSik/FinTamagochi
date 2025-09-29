import type { SVGProps } from "react";

export default function Parrot(props: SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;

  return (
    <svg
      viewBox="0 0 360 360"
      width="100%"
      height="100%"
      role="img"
      aria-label="Попугай"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...rest}
    >
      <defs>
        <radialGradient id="parrot-body" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#6ff0ff" />
          <stop offset="100%" stopColor="#0096d2" />
        </radialGradient>
        <radialGradient id="parrot-belly" cx="50%" cy="60%" r="80%">
          <stop offset="0%" stopColor="#ffe36f" />
          <stop offset="100%" stopColor="#ffaf2b" />
        </radialGradient>
        <linearGradient id="parrot-wing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6fb9" />
          <stop offset="100%" stopColor="#c738ff" />
        </linearGradient>
        <style>
          {`
            .shadow { transform-origin: 180px 300px; animation: shadow 3s ease-in-out infinite; }
            .body { transform-origin: 180px 220px; animation: sway 3s ease-in-out infinite; }
            .head { transform-origin: 188px 150px; animation: nod 4.8s ease-in-out infinite; }
            .wing { transform-origin: 115px 220px; animation: flap 3.6s ease-in-out infinite; }
            .crest { transform-origin: 210px 112px; animation: crest 3.2s ease-in-out infinite; }
            .blink ellipse { transform-origin: center; animation: blink 6s infinite; }

            @keyframes shadow { 0%,100% { transform: scale(1); opacity: .22; } 50% { transform: scale(1.08); opacity: .16; } }
            @keyframes sway { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.2px); } }
            @keyframes nod { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-3deg); } }
            @keyframes flap { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-8deg); } }
            @keyframes crest { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(4deg); } }
            @keyframes blink { 0%,94%,100% { transform: scaleY(1); } 96%,98% { transform: scaleY(.12); } }

            @media (prefers-reduced-motion: reduce) {
              .shadow, .body, .head, .wing, .crest, .blink ellipse { animation: none !important; }
            }
          `}
        </style>
      </defs>

      <ellipse className="shadow" cx="180" cy="302" rx="86" ry="20" fill="rgba(0,0,0,.18)" />

      <g className="wing">
        <path
          d="M136 200 C88 220 88 280 146 300 L188 252 Z"
          fill="url(#parrot-wing)"
          opacity="0.92"
        />
      </g>

      <g className="body">
        <path
          d="M180 116 C220 116 250 148 252 194 C254 246 224 292 180 292 C136 292 106 246 108 194 C110 148 140 116 180 116 Z"
          fill="url(#parrot-body)"
        />
        <ellipse cx="180" cy="226" rx="64" ry="60" fill="url(#parrot-belly)" opacity="0.92" />
        <path d="M180 190 C205 190 224 208 224 232 C224 252 206 268 180 268" fill="rgba(255,255,255,.24)" />
      </g>

      <g className="head">
        <path
          d="M208 102 C238 104 264 128 264 158 C264 188 236 210 204 208 L162 188 Z"
          fill="url(#parrot-body)"
        />
        <g className="crest">
          <path d="M210 108 L244 96 L232 132 Z" fill="#ff6f61" />
          <path d="M204 104 L226 88 L216 124 Z" fill="#ffa26f" />
        </g>

        <g className="blink">
          <ellipse cx="222" cy="160" rx="12" ry="12" fill="#0f172a" />
          <circle cx="224" cy="156" r="3" fill="#fff" />
        </g>

        <path
          d="M198 166 C220 150 242 154 252 164 C252 176 236 192 214 196 Z"
          fill="#ffb347"
        />
        <path
          d="M214 188 C230 186 242 180 246 170 C244 182 236 194 220 200 Z"
          fill="#f97316"
        />
      </g>

      <g>
        <path
          d="M156 276 C152 300 164 312 180 312 C196 312 208 300 204 276 Z"
          fill="#1f2937"
        />
        <path d="M164 276 C166 288 172 294 180 294 C188 294 194 288 196 276 Z" fill="#334155" />
      </g>
    </svg>
  );
}