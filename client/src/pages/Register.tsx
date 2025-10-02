import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles/Auth.module.css";
import { api, setAuthToken } from "../api";

export default function Register() {
  const nav = useNavigate();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const passwordsMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  const canSubmit =
    nickname.trim().length >= 3 &&
    password.length >= 4 &&
    confirmPassword.length >= 4 &&
    !passwordsMismatch &&
    !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      setSubmitErr(null);
      if (passwordsMismatch) {
        setSubmitErr("Пароли не совпадают");
        setLoading(false);
        return;
      }

      const res = await api.register({ nickname: nickname.trim(), password });
      setAuthToken(res.token);        // пишет и в runtime, и в localStorage
      localStorage.setItem("uid", res.userId);
      nav("/home", { replace: true });

    } catch (e: any) {
      setSubmitErr(e?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  const errorMessage = passwordsMismatch
    ? "Пароли не совпадают"
    : submitErr;

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Регистрация</h1>

        <form onSubmit={onSubmit} className={styles.authForm} noValidate>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="register-nickname">
              Никнейм
            </label>
            <input
              id="register-nickname"
              className={styles.input}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setSubmitErr(null);
              }}
              autoComplete="username"
              placeholder="Придумайте ник"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="register-password">
              Пароль
            </label>
            <input
              id="register-password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setSubmitErr(null);
              }}
              autoComplete="new-password"
              placeholder="Не менее 4 символов"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="register-password-repeat">
              Повтор пароля
            </label>
            <input
              id="register-password-repeat"
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setSubmitErr(null);
              }}
              autoComplete="new-password"
              placeholder="Повторите пароль"
              required
              aria-invalid={passwordsMismatch ? true : undefined}
            />
          </div>

          <div
            className={styles.error}
            role="status"
            aria-live="polite"
            aria-hidden={errorMessage ? undefined : true}
          >
            {errorMessage ?? ""}
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={!canSubmit}>
            {loading ? "Создаём…" : "Создать аккаунт"}
          </button>
        </form>

        <p className={styles.authAlt}>
          Уже есть аккаунт? <Link to="/login" className={styles.authLink}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
