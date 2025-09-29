import * as React from "react";

export default function Dog(props: React.SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;

  return (
    <svg
      viewBox="0 0 360 360"
      width="100%"
      height="100%"
      role="img"
      aria-label="Щенок"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...rest}
    >
      <defs>
        <radialGradient id="dog-fur" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFF6EA" />
          <stop offset="100%" stopColor="#EFDCC7" />
        </radialGradient>
        <radialGradient id="dog-spot" cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#A9866B" />
          <stop offset="100%" stopColor="#8B6B54" />
        </radialGradient>
        <radialGradient id="dog-paw" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#FAEFE3" />
          <stop offset="100%" stopColor="#EBD7C3" />
        </radialGradient>
        <radialGradient id="dog-tongue" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FF86A0" />
          <stop offset="100%" stopColor="#E36B85" />
        </radialGradient>

        <style>
          {`
            .shadow { transform-origin: 180px 300px; animation: shadowPulse 3.2s ease-in-out infinite; }
            .body   { transform-origin: 180px 230px; animation: breath 3.2s ease-in-out infinite; }
            .head   { transform-origin: 180px 140px; animation: nod 4.6s ease-in-out infinite; }
            .tail   { transform-origin: 248px 232px; animation: tail 1.4s ease-in-out infinite; }
            .blink ellipse { transform-origin: center; animation: blink 5s infinite; }
            .tongue { transform-origin: 180px 194px; animation: pant 1.6s ease-in-out infinite; }

            @keyframes breath { 0%,100%{transform:translateY(0);} 50%{transform:translateY(2px);} }
            @keyframes shadowPulse { 0%,100%{transform:scaleX(1);opacity:.22;} 50%{transform:scaleX(1.06);opacity:.18;} }
            @keyframes nod { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(1px) rotate(1.6deg);} }
            @keyframes tail { 0%{transform:rotate(16deg);} 50%{transform:rotate(-12deg);} 100%{transform:rotate(16deg);} }
            @keyframes blink { 0%,94%,100%{transform:scaleY(1);} 96%,98%{transform:scaleY(.12);} }
            @keyframes pant { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(1.2px) rotate(1.6deg);} }

            @media (prefers-reduced-motion: reduce) {
              .shadow,.body,.head,.tail,.blink ellipse,.tongue { animation:none!important; }
            }
          `}
        </style>
      </defs>

      {/* Тень */}
      <ellipse className="shadow" cx="180" cy="302" rx="90" ry="22" fill="rgba(0,0,0,.22)" />

      {/* Хвост — как раньше, но ближе к телу */}
      <g className="tail">
        <path
          d="M248 232
             c 22 8 32 26 18 38
             c -9 8 -23 6 -30 -6"
          fill="none"
          stroke="#E6D3BD"
          strokeWidth="16"
          strokeLinecap="round"
        />
      </g>

      {/* Тело и лапы */}
      <g className="body">
        <path
          d="M116 186c0-40 30-68 64-68s64 28 64 68v44c0 38-32 62-64 62s-64-24-64-62v-44z"
          fill="url(#dog-fur)"
        />

        {/* Пятно на боку */}
        <ellipse cx="228" cy="220" rx="24" ry="18" fill="url(#dog-spot)" opacity=".75" />

        {/* Лапы */}
        <g>
          <rect x="130" y="260" width="46" height="40" rx="18" fill="url(#dog-paw)" />
          <rect x="188" y="260" width="46" height="40" rx="18" fill="url(#dog-paw)" />
          <g fill="#C7AD97" opacity=".65">
            <circle cx="146" cy="286" r="4.2" />
            <circle cx="160" cy="286" r="4.2" />
            <circle cx="204" cy="286" r="4.2" />
            <circle cx="218" cy="286" r="4.2" />
          </g>
        </g>
      </g>

      {/* Голова */}
      <g className="head">
        {/* Ровные симметричные уши */}
        <path d="M146 110 L166 90 L174 118 Q160 116 146 110 Z" fill="url(#dog-spot)" />
        <path d="M214 110 L194 90 L186 118 Q200 116 214 110 Z" fill="url(#dog-spot)" />

        {/* Морда */}
        <rect x="104" y="122" width="152" height="96" rx="44" fill="url(#dog-fur)" />

        {/* Маска у левого глаза */}
        <ellipse cx="152" cy="166" rx="22" ry="20" fill="url(#dog-spot)" opacity=".85" />

        {/* Глаза */}
        <g className="blink">
          <ellipse cx="150" cy="166" rx="9.5" ry="9.5" fill="#0E111A" />
          <ellipse cx="210" cy="166" rx="9.5" ry="9.5" fill="#0E111A" />
        </g>
        <circle cx="147" cy="163" r="2.4" fill="#fff" />
        <circle cx="207" cy="163" r="2.4" fill="#fff" />

        {/* Нос */}
        <path d="M174 176a6 6 0 0 1 12 0c0 4-4 6-6 6s-6-2-6-6z" fill="#0E111A" />

        {/* Улыбка */}
        <path d="M180 182c0 9-8 16-20 16" stroke="#0E111A" strokeWidth="5" strokeLinecap="round" />
        <path d="M180 182c0 9 8 16 20 16" stroke="#0E111A" strokeWidth="5" strokeLinecap="round" />

        {/* Язык — строго по центру под носом */}
        <path
          className="tongue"
          d="M172 192
             c-3 3 -4 6 -4 10
             c0 7 6 12 12 12
             s12-5 12-12
             c0-4 -1-7 -4-10
             c-5 2 -11 2 -16 0z"
          fill="url(#dog-tongue)"
        />

        {/* Щёчки */}
        <circle cx="136" cy="178" r="8.5" fill="#F0D2D8" opacity=".9" />
        <circle cx="224" cy="178" r="8.5" fill="#F0D2D8" opacity=".9" />
      </g>

      {/* Ошейник и косточка — по центру */}
      <g>
        <rect x="110" y="212" width="140" height="16" rx="8" fill="#2E86DE" />
        {/* кольцо строго по центру */}
        <circle cx="180" cy="228" r="6" fill="#D4AC0D" />
        {/* косточка центрируется группой */}
        <g transform="translate(180,240)">
          <path
            d="M-36 -5
               c-7 -7  3 -17 12 -13
               c 3  1  6  1  9  0
               c 9 -4 19  6 12 13
               c 7  7 -3  17 -12 13
               c-3 -1 -6 -1 -9  0
               c-9  4 -19 -6 -12 -13z"
            fill="#FFFFFF"
            stroke="#D0D0D0"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}
