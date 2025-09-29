import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles/Register.module.css";
import { api, setAuthToken } from "../api";

export default function Register() {
  const nav = useNavigate();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit =
    nickname.trim().length >= 3 && password.length >= 4 && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      setErr(null);
      const res = await api.register({ nickname: nickname.trim(), password });
      setAuthToken(res.token);        // пишет и в runtime, и в localStorage
      localStorage.setItem("uid", res.userId);
      nav("/home", { replace: true });

    } catch (e: any) {
      setErr(e?.message || "Ошибка регистрации");
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
            {loading ? "Создаём..." : "Создать аккаунт"}
          </button>

          <Link to="/login" className={styles.link}>
            Войти
          </Link>
        </form>
      </div>
    </div>
  );
}
