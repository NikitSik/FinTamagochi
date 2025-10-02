import { useState } from "react";
import { api, setAuthToken } from "../api";
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles/Auth.module.css";

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
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Вход</h1>

        <form onSubmit={onSubmit} className={styles.authForm} noValidate>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="login-nickname">
              Логин (никнейм или почта)
            </label>
            <input
              id="login-nickname"
              className={styles.input}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setErr(null);
              }}
              autoComplete="username"
              placeholder="Например, user@bank.ru"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="login-password">
              Пароль
            </label>
            <input
              id="login-password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErr(null);
              }}
              autoComplete="current-password"
              placeholder="Введите пароль"
              required
            />
          </div>

          <div
            className={styles.error}
            role="status"
            aria-live="polite"
            aria-hidden={err ? undefined : true}
          >
            {err ?? ""}
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={!canSubmit}>
            {loading ? "Входим…" : "Войти"}
          </button>
        </form>

        <p className={styles.authAlt}>
          Нет аккаунта? <Link to="/register" className={styles.authLink}>Регистрация</Link>
        </p>
      </div>
    </div>
  );
}
