import { useEffect, useRef, type ReactElement } from "react";
import { NavLink } from "react-router-dom";
import styles from "./BottomNav.module.css";

type Item = {
  to: string;
  label: string;
  icon: ReactElement;
};

const ITEMS: Item[] = [
  {
    to: "/home",
    label: "Главная",
    icon: (
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
        <path fill="none" d="M4 10.5 12 4l8 6.5V20H4Z" strokeLinecap="round" strokeLinejoin="round" />
        <path fill="none" d="M9.5 20v-5.5h5V20" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/pet",
    label: "Питомец",
    icon: (
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
        <path fill="none" d="M4.5 12c0-2.8 2.3-5 5.1-5h4.8c2.8 0 5.1 2.2 5.1 5v8H4.5Z" strokeLinecap="round" strokeLinejoin="round" />
        <path fill="none" d="M8.5 11.5c0-1.7 1.3-3 3-3s3 1.3 3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/missions",
    label: "Миссии",
    icon: (
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
        <path fill="none" d="M6 4.5h12v4H6Z" strokeLinecap="round" strokeLinejoin="round" />
        <path fill="none" d="M4 11h16v4H4Z" strokeLinecap="round" strokeLinejoin="round" />
        <path fill="none" d="M6 17.5h12v4H6Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Профиль",
    icon: (
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
        <path fill="none" d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z" strokeLinecap="round" strokeLinejoin="round" />
        <path fill="none" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = navRef.current;
    if (!element) return;

    const updateOffset = () => {
      document.documentElement.style.setProperty(
        "--bottom-nav-height",
        `${element.offsetHeight}px`
      );
    };

    updateOffset();

    const resizeObserver = new ResizeObserver(updateOffset);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty("--bottom-nav-height");
    };
  }, []);

  return (
    <div className={styles.wrapper} role="presentation">
      <nav ref={navRef} className={styles.bar} aria-label="Основная навигация">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/home"}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
