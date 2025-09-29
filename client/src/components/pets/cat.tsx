import * as React from "react";

export default function Cat(props: React.SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;

  return (
    <svg
      viewBox="0 0 360 360"
      width="100%"
      height="100%"
      role="img"
      aria-label="Котёнок"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...rest}
    >
      <defs>
        <radialGradient id="cat-fur" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFF7F0" />
          <stop offset="100%" stopColor="#F0E7DB" />
        </radialGradient>
        <radialGradient id="paw" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#F9F2E9" />
          <stop offset="100%" stopColor="#EDE3D7" />
        </radialGradient>
        <style>
          {`
          .shadow { transform-origin: 180px 292px; animation: shadowPulse 3.2s ease-in-out infinite; }
          .body   { transform-origin: 180px 220px; animation: breath 3.2s ease-in-out infinite; }
          .head   { transform-origin: 180px 130px; animation: nod 4.6s ease-in-out infinite; }
          .tail   { transform-origin: 240px 230px; animation: tail 1.6s ease-in-out infinite; }
          .blink ellipse { transform-origin: center; animation: blink 5s infinite; }

          @keyframes breath { 0%,100%{transform:translateY(0);} 50%{transform:translateY(2px);} }
          @keyframes shadowPulse { 0%,100%{transform:scaleX(1);opacity:.22;} 50%{transform:scaleX(1.06);opacity:.18;} }
          @keyframes nod { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(1px) rotate(-2deg);} }
          @keyframes tail { 0%{transform:rotate(10deg);} 50%{transform:rotate(-8deg);} 100%{transform:rotate(10deg);} }
          @keyframes blink { 0%,94%,100%{transform:scaleY(1);} 96%,98%{transform:scaleY(.15);} }

          @media (prefers-reduced-motion: reduce) {
            .shadow,.body,.head,.tail,.blink ellipse { animation:none!important; }
          }
        `}
        </style>
      </defs>

      {/* Тень */}
      <ellipse className="shadow" cx="180" cy="298" rx="88" ry="20" fill="rgba(0,0,0,.22)" />

      {/* Хвост — за телом и ближе к корпусу */}
      <g className="tail" transform="translate(-8,-6)">
        <path
          d="M242 232c26 6 36 24 20 40-8 8-22 8-28-4"
          fill="none"
          stroke="#E8DED2"
          strokeWidth="16"
          strokeLinecap="round"
        />
      </g>

      {/* ТЕЛО И ЛАПКИ — рисуем раньше, чтобы голова была сверху */}
      <g className="body">
        <path
          d="M120 180c0-40 28-66 60-66s60 26 60 66v42c0 36-30 58-60 58s-60-22-60-58v-42z"
          fill="url(#cat-fur)"
        />
        {/* лапы */}
        <g>
          <rect x="128" y="254" width="44" height="38" rx="18" fill="url(#paw)" />
          <rect x="188" y="254" width="44" height="38" rx="18" fill="url(#paw)" />
        </g>
        {/* полоски на лапках — чуть левее и ниже */}
        <g transform="translate(-6,6)" stroke="#8F84C9" strokeWidth="6" strokeLinecap="round" opacity=".7">
          <line x1="150" y1="254" x2="150" y2="284" />
          <line x1="172" y1="254" x2="172" y2="284" />
          <line x1="206" y1="254" x2="206" y2="284" />
          <line x1="228" y1="254" x2="228" y2="284" />
        </g>
      </g>

      {/* ГОЛОВА — поверх тела */}
      <g className="head">
        {/* Уши — полутреугольные, мягко закруглённые */}
        <g>
          {/* левое ухо */}
          <path d="M120 128 Q134 80 160 118 Q144 122 120 128 Z" fill="url(#cat-fur)" />
          <path d="M128 122 Q138 92 156 116 Q144 120 128 122 Z" fill="#9C8AE0" opacity=".8" />
          {/* правое ухо */}
          <path d="M240 128 Q226 80 200 118 Q216 122 240 128 Z" fill="url(#cat-fur)" />
          <path d="M232 122 Q222 92 204 116 Q216 120 232 122 Z" fill="#9C8AE0" opacity=".8" />
        </g>

        {/* Морда */}
        <rect x="104" y="122" width="152" height="92" rx="40" fill="url(#cat-fur)" />

        {/* Глазки */}
        <g className="blink">
          <ellipse cx="150" cy="164" rx="10" ry="10" fill="#0E111A" />
          <ellipse cx="210" cy="164" rx="10" ry="10" fill="#0E111A" />
        </g>
        <circle cx="147" cy="161" r="2.5" fill="#fff" />
        <circle cx="207" cy="161" r="2.5" fill="#fff" />

        {/* Щёчки */}
        <circle cx="136" cy="176" r="9" fill="#D7CFEF" opacity=".9" />
        <circle cx="224" cy="176" r="9" fill="#D7CFEF" opacity=".9" />

        {/* Нос-рот */}
        <path d="M174 176a6 6 0 0 1 12 0c0 4-4 6-6 6s-6-2-6-6z" fill="#0E111A" />
        <path d="M180 182c0 8-6 14-14 14" stroke="#0E111A" strokeWidth="5" strokeLinecap="round" />
        <path d="M180 182c0 8 6 14 14 14" stroke="#0E111A" strokeWidth="5" strokeLinecap="round" />

        {/* Усы */}
        <g stroke="#8F84C9" strokeWidth="6" strokeLinecap="round" opacity=".85">
          <line x1="124" y1="172" x2="146" y2="172" />
          <line x1="124" y1="180" x2="146" y2="180" />
          <line x1="236" y1="172" x2="214" y2="172" />
          <line x1="236" y1="180" x2="214" y2="180" />
        </g>

        {/* Плечики */}
        <g stroke="#D8D0E8" strokeWidth="8" strokeLinecap="round">
          <line x1="136" y1="206" x2="154" y2="206" />
          <line x1="206" y1="206" x2="224" y2="206" />
        </g>
      </g>

      {/* ОШЕЙНИК И МЕДАЛЬКА — поверх головы/тела */}
      <g>
        {/* красная лента ошейника */}
        <rect x="108" y="206" width="144" height="16" rx="8" fill="#E74C3C" />
        {/* крепление медальки */}
        <path d="M174 222h12" stroke="#D4AC0D" strokeWidth="3" strokeLinecap="round" />
        {/* золотая медалька */}
        <circle cx="180" cy="232" r="14" fill="#F1C40F" stroke="#D4AC0D" strokeWidth="3" />
      </g>
    </svg>
  );
}
