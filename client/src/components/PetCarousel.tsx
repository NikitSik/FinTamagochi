// components/PetCarousel.tsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "../pages/styles/PetCarousel.module.css";

export type PetSlide = {
  id: string;
  render: React.ReactNode;
  locked?: boolean;      
  hint?: string;
};

type Props = {
  slides: PetSlide[];
  initialIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
};

export default function PetCarousel({ slides, initialIndex = 0, onChange, className = "" }: Props) {
  const [index, setIndex] = useState(Math.min(Math.max(0, initialIndex), slides.length - 1));
  const [drag, setDrag] = useState({ startX: 0, deltaX: 0, active: false });

  useEffect(() => { onChange?.(index); }, [index, onChange]);

  function go(to: number) {
    const clamped = Math.min(Math.max(0, to), slides.length - 1);
    setIndex(clamped);
  }

  // swipe
  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ startX: e.clientX, deltaX: 0, active: true });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.active) return;
    setDrag((d) => ({ ...d, deltaX: e.clientX - d.startX }));
  }
  function onPointerUp() {
    if (!drag.active) return;
    const threshold = 60;
    if (drag.deltaX <= -threshold && index < slides.length - 1) go(index + 1);
    else if (drag.deltaX >= threshold && index > 0) go(index - 1);
    setDrag({ startX: 0, deltaX: 0, active: false });
  }

  const translateX = useMemo(
    () => `calc(${(-index * 100)}% + ${drag.deltaX}px)`,
    [index, drag.deltaX]
  );

  return (
    <div className={`${styles.wrap} ${className}`} aria-roledescription="карусель питомцев">
      <div
        className={styles.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={`${styles.track} ${drag.active ? styles.trackDragging : styles.trackSnapping}`}
          style={{ transform: `translateX(${translateX})` }}
        >
          {slides.map((s, i) => (
            <div key={s.id} className={styles.slide} aria-hidden={i !== index}>
              <div className={`${styles.slideInner} ${s.locked ? styles.slideLocked : ""}`}>
                {s.render}
                {s.locked && (
                  <div className={styles.lockOverlay} aria-hidden>
                    <span className={styles.lockBadge}>🔒</span>
                     {s.hint && <span className={styles.lockHint}>{s.hint}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* точки */}
      <div className={styles.dots} role="tablist" aria-label="Питомцы">
        {slides.map((s, i) => (
          <button
            key={`${s.id}-dot`}
            role="tab"
            aria-selected={i === index}
            className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
            onClick={() => go(i)}
            aria-label={`Питомец ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
