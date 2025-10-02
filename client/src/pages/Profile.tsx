import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./styles/Profile.module.css";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { InputField } from "../components/ui/InputField";
import { api, setAuthToken, type User } from "../api";

export default function Profile() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const uid = localStorage.getItem("uid");
    if (!token || !uid) {
      nav("/login", { replace: true });
      return;
    }
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

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}>Загрузка…</div>
      </div>
    );
  }

  if (err || !user) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}>{err ?? "Ошибка"}</div>
      </div>
    );
  }

  const avatar = user.avatarUrl ?? null;
  const name = user.nickname ?? "Пользователь";
  const uid = user.id ?? (localStorage.getItem("uid") ?? "—");
  const level = user.level ?? 1;
  const finHealth = user.finHealth ?? 72;
  const email = (user as any).email ?? "user@example.com";
  const phone = (user as any).phone ?? "+7••• •• ••";

  const onPickAvatar = () => fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Выберите изображение");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Слишком большой файл (до 3 МБ)");
      return;
    }

    try {
      setUploading(true);
      const localUrl = URL.createObjectURL(file);
      setUser((u) => (u ? { ...u, avatarUrl: localUrl } : u));
      const url = await api.uploadAvatar(file);
      setUser((u) => (u ? { ...u, avatarUrl: url } : u));
    } catch (e: any) {
      alert(e?.message ?? "Не удалось загрузить аватар");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Профиль</h1>
        <p className={styles.lead}>Управляйте аккаунтом и настройками приложения.</p>
      </header>

      <Card padding="lg" className={styles.userCard}>
        <div className={`${styles.avatarWrap} ${uploading ? styles.avatarLoading : ""}`}>
          {avatar ? (
            <img src={avatar} alt="Аватар" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>{name.slice(0, 1).toUpperCase()}</div>
          )}
          <span className={styles.avatarRing} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className={styles.fileInput}
          />
        </div>
        <div className={styles.userInfo}>
          <h2 className={styles.userName}>{name}</h2>
          <p className={styles.userMeta}>UID {uid}</p>
          <div className={styles.badges}>
            <span className={styles.badge}>Уровень {level}</span>
            <span className={styles.badgeSoft}>Фин. здоровье {finHealth}%</span>
          </div>
        </div>
        <Button
          variant="primary"
          fullWidth={false}
          onClick={onPickAvatar}
          disabled={uploading}
        >
          {uploading ? "Загрузка…" : "Изменить"}
        </Button>
      </Card>

      <Card className={styles.sectionCard}>
        <h2>Аккаунт</h2>
        <div className={styles.fields}>
          <InputField
            label="Email"
            value={email}
            readOnly
            icon={
              <svg viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M4 6h16v12H4z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 7l8 6 8-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <InputField
            label="Телефон"
            value={phone}
            readOnly
            icon={
              <svg viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M7 3h3l1 4-2 1c1.2 2.4 3.2 4.4 5.6 5.6l1-2 4 1v3c0 1.1-.9 2-2 2-8.3 0-15-6.7-15-15 0-1.1.9-2 2-2z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        </div>
      </Card>

      <Card className={styles.sectionCard}>
        <h2>Безопасность</h2>
        <div className={styles.rowBetween}>
          <div>
            <p className={styles.rowTitle}>Изменить пароль</p>
            <p className={styles.rowHint}>Рекомендуем обновлять пароль каждые 3 месяца.</p>
          </div>
          <Button variant="ghost" fullWidth={false} className={styles.smallBtn}>
            Сменить
          </Button>
        </div>
      </Card>

      <Card className={styles.sectionCard}>
        <h2>Настройки</h2>
        <div className={styles.settingsList}>
          <label className={styles.settingItem}>
            <span>
              <span className={styles.rowTitle}>Уведомления</span>
              <span className={styles.rowHint}>Сообщать о миссиях и наградах</span>
            </span>
            <input type="checkbox" defaultChecked className={styles.toggle} />
          </label>
          <div className={styles.settingItem}>
            <span>
              <span className={styles.rowTitle}>Язык</span>
              <span className={styles.rowHint}>Интерфейс приложения</span>
            </span>
            <Button variant="ghost" fullWidth={false} className={styles.smallBtn}>
              Русский
            </Button>
          </div>
        </div>
      </Card>

      <Button
        variant="ghost"
        className={styles.logout}
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("uid");
          window.location.href = "/login";
        }}
      >
        Выйти из аккаунта
      </Button>
    </div>
  );
}
