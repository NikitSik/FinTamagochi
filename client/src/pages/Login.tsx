import { useState } from "react";
import { api, setAuthToken } from "../api";
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles/Login.module.css"


export default function Login() {
  const nav = useNavigate();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = nickname.trim().length >= 3 && password.length >= 4 && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setErr(null);
    try {
      const res = await api.login({ nickname: nickname.trim(), password });
      // сохраняем токен
      setAuthToken(res.token);
      localStorage.setItem("uid", res.userId);
      nav("/home", { replace: true });
    } catch (e: any) {
      setErr(e.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>ФинТамагочи</h1>

        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.label}>
            Никнейм
            <input
              className={styles.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className={styles.label}>
            Пароль
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          {err && <div className={styles.error}>{err}</div>}

          <button type="submit" className={styles.button} disabled={!canSubmit}>
            {loading ? "Создаём..." : "Войти"}
          </button>

          <Link to="/register" className={styles.link}>
            Регистрация
          </Link>
        </form>
      </div>
    </div>
  );
}
