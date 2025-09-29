// src/pages/Profile.tsx
import { useEffect, useRef, useState } from "react"; // + useRef
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles/Profile.module.css";
import { api, setAuthToken, type User } from "../api";
import ThemeToggle from "../components/ThemeToggle";

export default function Profile() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);            // <— NEW

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);                // <— NEW

  useEffect(() => {
    const token = localStorage.getItem("token");
    const uid = localStorage.getItem("uid");
    if (!token || !uid) { nav("/login", { replace: true }); return; }
    setAuthToken(token);

    (async () => {
      try {
        const me = await api.me();
        setUser(me);
      } catch (e: any) {
        setErr(e?.message || "Не удалось загрузить профиль");
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  if (loading) return (
    <div className={styles.page}><main className={styles.main}><div className={styles.card}>Загрузка…</div></main></div>
  );
  if (err || !user) return (
    <div className={styles.page}><main className={styles.main}><div className={styles.card}>{err ?? "Ошибка"}</div></main></div>
  );

  const avatar = user.avatarUrl ?? null;
  const name = user.nickname ?? "Пользователь";
  const uid = user.id ?? (localStorage.getItem("uid") ?? "—");
  const level = user.level ?? 1;
  const finHealth = user.finHealth ?? 72;
  const email = (user as any).email ?? "user@example.com";
  const phone = (user as any).phone ?? "+7••• •• ••";

  // === NEW: обработка выбора/загрузки файла ===
  const onPickAvatar = () => fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // лёгкая валидация
    if (!file.type.startsWith("image/")) { alert("Выберите изображение"); return; }
    if (file.size > 3 * 1024 * 1024) { alert("Слишком большой файл (до 3 МБ)"); return; }

    try {
      setUploading(true);

      // optimistic UI: сразу показываем превью
      const localUrl = URL.createObjectURL(file);
      setUser((u) => u ? { ...u, avatarUrl: localUrl } : u);

      // аплоад
      const url = await api.uploadAvatar(file); // вернет публичный avatarUrl

      // финально ставим настоящий url
      setUser((u) => u ? { ...u, avatarUrl: url } : u);
    } catch (e: any) {
      alert(e?.message ?? "Не удалось загрузить аватар");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = ""; // очистить инпут
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Профиль</h1>
      </header>

      <main className={styles.main}>
        {/* Шапка пользователя */}
        <section className={styles.userCard}>
          <div className={`${styles.avatarWrap} ${uploading ? styles.avatarLoading : ""}`}>
            {avatar ? (
              <img src={avatar} alt="Аватар" className={styles.avatar} />
            ) : (
              <div className={styles.avatar}>{name.slice(0, 1).toUpperCase()}</div>
            )}

            {/* Скрытый input для выбора файла */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className={styles.userInfo}>
            <div className={styles.userName}>{name}</div>
            <div className={styles.userMeta}>UID: {uid}</div>
            <div className={styles.badges}>
              <span className={styles.badge}>Уровень {level}</span>
              <span className={styles.badgeSoft}>Фин. здоровье: {finHealth}%</span>
            </div>
          </div>

          {/* Кнопка "Изменить" запускает выбор файла */}
          <button className={styles.editBtn} onClick={onPickAvatar} disabled={uploading}>
            {uploading ? "Загрузка…" : "Изменить"}
          </button>
        </section>

        {/* Аккаунт */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Аккаунт</h2>
          <ul className={styles.list}>
            <li className={styles.row}><span>Email</span><span className={styles.muted}>{email}</span></li>
            <li className={styles.row}><span>Телефон</span><span className={styles.muted}>{phone}</span></li>
          </ul>
        </section>

        {/* Безопасность */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Безопасность</h2>
          <ul className={styles.list}>
            <li className={styles.rowLink}><span>Изменить пароль</span><button className={styles.linkBtn}>Сменить</button></li>
          </ul>
        </section>

        {/* Настройки */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Настройки</h2>
          <ul className={styles.list}>
            <li className={styles.row}>
              <span>Уведомления</span>
              <label className={styles.switch}><input type="checkbox" defaultChecked /><i /></label>
            </li>
            <li className={styles.row}>
              <span>Смена темы</span>
              <ThemeToggle className={styles.switch} />
            </li>
            <li className={styles.rowLink}>
              <span>Язык</span><button className={styles.linkBtn}>Русский</button>
            </li>
          </ul>
        </section>

        <button
          className={styles.logout}
          onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("uid"); window.location.href = "/login"; }}
        >Выйти из аккаунта</button>
      </main>

      <nav className={styles.bottomNav}>
        <Link to="/home" className={styles.navItem}>Главная</Link>
        <Link to="/pet" className={styles.navItem}>Питомец</Link>
        <Link to="/missions" className={styles.navItem}>Миссии</Link>
        <Link to="/profile" className={`${styles.navItem} ${styles.active}`}>Профиль</Link>
      </nav>
    </div>
  );
}
