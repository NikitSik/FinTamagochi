import { useEffect, useState } from "react";
import styles from "./styles/Home.module.css";
import { api, type User } from "../api";

type ActionStatus = {
  type: "success" | "error";
  text: string;
};

const rubFormatter = new Intl.NumberFormat("ru-RU");

type View = {
  coins: number;
  savings: number;
  current: number;
  owner: string;
};

export default function Home() {
  const [view, setView] = useState<View>({
    coins: 0,
    savings: 0,
    current: 0,
    owner: "мой счёт",
  });
  const [actionStatus, setActionStatus] = useState<ActionStatus | null>(null);
  const [pendingAction, setPendingAction] = useState<"topup" | "savings" | null>(null);

  const totalRUB = Math.round(view.current + view.savings);

  const accounts = [
    {
      key: "current",
      title: "Текущий счёт",
      amount: view.current,
      currency: "₽",
      note: "Свободные средства",
    },
    {
      key: "savings",
      title: "Накопительный",
      amount: view.savings,
      currency: "₽",
      note: "Отложено на цели",
    },
    {
      key: "coins",
      title: "Игровые монеты",
      amount: view.coins,
      currency: null,
      note: "Потратьте в магазине",
    },
  ] as const;

  function formatRUB(value: number) {
    return rubFormatter.format(Math.round(value));
  }

  async function load() {
    const [pet, sav, latest, me] = await Promise.all([
      api.petState(),
      api.savingsGet(),
      api.financeLatest().catch(() => ({ balance: 0 } as any)),
      api.me().catch(() => null as User | null),
    ]);
    setView({
      coins: pet.coins,
      savings: sav.balance ?? 0,
      current: latest?.balance ?? 0,
      owner: me?.nickname ?? me?.email ?? "мой счёт",
    });
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  function parseAmount(input: string | null) {
    if (input == null) return NaN;
    const normalized = input.replace(/,/g, ".").trim();
    return Number.parseFloat(normalized);
  }

  function showAmountPrompt(message: string) {
    return parseAmount(window.prompt(message));
  }

  async function withAction<T>(action: "topup" | "savings", fn: () => Promise<T>) {
    setPendingAction(action);
    setActionStatus(null);
    try {
      const result = await fn();
      await load();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        setActionStatus({ type: "error", text: error.message });
      } else {
        setActionStatus({ type: "error", text: "Не удалось выполнить операцию" });
      }
      throw error;
    } finally {
      setPendingAction(null);
    }
  }

  async function handleTopUp() {
    const amount = showAmountPrompt("Введите сумму пополнения (₽)");
    if (!Number.isFinite(amount) || amount <= 0) {
      if (!Number.isNaN(amount)) {
        setActionStatus({ type: "error", text: "Введите корректную сумму" });
      }
      return;
    }

    try {
      await withAction("topup", () => api.balanceDeposit(amount));
      setActionStatus({ type: "success", text: "Баланс успешно пополнен" });
    } catch {
      // состояние уже обновлено в withAction
    }
  }

  async function handleTransferToSavings() {
    const amount = showAmountPrompt("Сколько перевести в накопительный счёт? (₽)");
    if (!Number.isFinite(amount) || amount <= 0) {
      if (!Number.isNaN(amount)) {
        setActionStatus({ type: "error", text: "Введите корректную сумму" });
      }
      return;
    }

    try {
      await withAction("savings", () => api.savingsDeposit(amount));
      setActionStatus({ type: "success", text: "Перевод выполнен" });
    } catch {
      // сообщение уже показано
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.hero}>
          <div>
            <p className={styles.subtitle}>Добро пожаловать, {view.owner}</p>
            <h1 className={styles.title}>ФинТамагочи</h1>
          </div>
          <div className={styles.totalPill} aria-live="polite">
            <span className={styles.totalLabel}>Общий баланс</span>
            <strong className={styles.totalValue}>₽ {formatRUB(totalRUB)}</strong>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={`${styles.surface} ${styles.summaryCard}`}>
          <div className={styles.summaryHeader}>
            <div>
              <h2>Мой счёт</h2>
              <p className={styles.summaryHint}>
                Актуальный баланс и доступные ресурсы.
              </p>
            </div>
            <span className={styles.badge}>₽</span>
          </div>

          <p className={styles.summaryTotal}>₽ {formatRUB(totalRUB)}</p>

          <div className={styles.summaryBreakdown}>
            {accounts.map((account) => (
              <div className={styles.breakdownItem} key={account.key}>
                <span className={styles.breakdownLabel}>{account.title}</span>
                <span className={styles.breakdownValue}>
                  {account.currency ? `₽ ${formatRUB(account.amount)}` : account.amount}
                </span>
                <span className={styles.breakdownNote}>{account.note}</span>
              </div>
            ))}
          </div>

          <div className={styles.quickActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleTopUp}
              disabled={pendingAction !== null}
            >
              Пополнить баланс
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleTransferToSavings}
              disabled={pendingAction !== null}
            >
              Перевести в накопительный
            </button>
          </div>

          {actionStatus && (
            <p
              className={`${styles.actionMessage} ${
                actionStatus.type === "success"
                  ? styles.actionMessageSuccess
                  : styles.actionMessageError
              }`}
              role="status"
              aria-live="polite"
            >
              {actionStatus.text}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
