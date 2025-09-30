// src/components/BottomNav.tsx
import { NavLink } from "react-router-dom";
import styles from "../pages/styles/Home.module.css"; // переиспользуем твои классы

export default function BottomNav() {
  return (
    <nav className={styles.bottomNav} aria-label="Основная навигация">
      <NavLink
        to="/home"
        end
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ""}`
        }
      >
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M12 3l9 8h-3v9h-12v-9h-3z" />
        </svg>
        <span>Главная</span>
      </NavLink>

      <NavLink
        to="/pet"
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ""}`
        }
      >
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M12 4a5 5 0 015 5v2h1a2 2 0 012 2v6h-16v-6a2 2 0 012-2h1v-2a5 5 0 015-5z" />
        </svg>
        <span>Питомец</span>
      </NavLink>

       <NavLink
        to="/shop"
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ""}`
        }
      >
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M5 7h14l-1.5 12h-11z" />
          <path d="M9 7c0-1.657 1.343-3 3-3s3 1.343 3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>Магазин</span>
      </NavLink>

      <NavLink
        to="/missions"
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ""}`
        }
      >
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M7 4h13v4h-13zM4 10h16v4h-16zM7 16h13v4h-13z" />
        </svg>
        <span>Миссии</span>
      </NavLink>

      <NavLink
        to="/tests"
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ""}`
        }
      >
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M5 4h14v16H5z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M8 8h8M8 12h5M8 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>Тесты</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ""}`
        }
      >
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z" />
        </svg>
        <span>Профиль</span>
      </NavLink>
    </nav>
  );
}