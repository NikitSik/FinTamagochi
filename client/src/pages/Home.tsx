import { useEffect, useState, type ChangeEvent } from "react";
import styles from "./styles/Home.module.css";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { InputField } from "../components/ui/InputField";
import { api, type User } from "../api";

type ActionStatus = {
  type: "success" | "error";
  text: string;
};

type View = {
  coins: number;
  savings: number;
  current: number;
  owner: string;
};

const rubFormatter = new Intl.NumberFormat("ru-RU");

export default function Home() {
  const [view, setView] = useState<View>({
    coins: 0,
    savings: 0,
    current: 0,
    owner: "мой счёт",
  });
  const [actionStatus, setActionStatus] = useState<ActionStatus | null>(null);
  const [pendingAction, setPendingAction] = useState<"topup" | "savings" | null>(null);
  const [modalAction, setModalAction] = useState<"topup" | "savings" | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);

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

  function openModal(action: "topup" | "savings") {
    setModalAction(action);
    setAmountInput("");
    setAmountError(null);
  }

  function handleTopUp() {
    openModal("topup");
  }

  function handleTransferToSavings() {
    openModal("savings");
  }

  function closeModal() {
    if (pendingAction !== null) return;
    setModalAction(null);
    setAmountInput("");
    setAmountError(null);
  }

  async function submitModal() {
    if (!modalAction) return;

    const amount = parseAmount(amountInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      setAmountError("Введите корректную сумму");
      return;
    }

    if (modalAction === "savings" && amount > view.current) {
      setAmountError("Недостаточно средств на текущем счёте");
      return;
    }

    setAmountError(null);

    try {
      if (modalAction === "topup") {
        await withAction("topup", () => api.balanceDeposit(amount));
        setActionStatus({ type: "success", text: "Баланс успешно пополнен" });
      } else {
        await withAction("savings", () => api.savingsDeposit(amount));
        setActionStatus({ type: "success", text: "Перевод выполнен" });
      }
      closeModal();
    } catch {
      // already handled
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Добро пожаловать, {view.owner}</p>
          <div className={styles.titleRow}>
            <h1>ФинТамагочи</h1>
            <div className={styles.totalPill} aria-live="polite">
              <span className={styles.totalLabel}>Общий баланс</span>
              <strong className={styles.totalValue}>₽ {formatRUB(totalRUB)}</strong>
            </div>
          </div>
        </div>
        <p className={styles.lead}>Следите за финансами и питомцем в одном приложении.</p>
      </header>

      <Card padding="lg" className={styles.summaryCard}>
        <header className={styles.summaryHeader}>
          <div>
            <h2>Мой счёт</h2>
            <p className={styles.summaryHint}>Актуальный баланс и доступные ресурсы.</p>
          </div>
        </header>

        <div className={styles.summaryTotalBlock}>
          <span className={styles.summaryTotalLabel}>Баланс</span>
          <span className={styles.summaryTotalValue}>₽ {formatRUB(totalRUB)}</span>
        </div>

        <div className={styles.accountList}>
          {accounts.map((account) => (
            <div className={styles.accountRow} key={account.key}>
              <div className={styles.accountMeta}>
                <span className={styles.accountTitle}>{account.title}</span>
                <span className={styles.accountNote}>{account.note}</span>
              </div>
              <span className={styles.accountValue}>
                {account.currency ? `₽ ${formatRUB(account.amount)}` : account.amount}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <Button onClick={handleTopUp} disabled={pendingAction !== null}>
            Пополнить баланс
          </Button>
          <Button
            variant="secondary"
            onClick={handleTransferToSavings}
            disabled={pendingAction !== null}
          >
            Перевести в накопительный
          </Button>
        </div>

        {actionStatus && (
          <p
            className={
              actionStatus.type === "success"
                ? styles.actionMessageSuccess
                : styles.actionMessageError
            }
            role="status"
            aria-live="polite"
          >
            {actionStatus.text}
          </p>
        )}
      </Card>

      {modalAction && (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeModal}>
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-label={
              modalAction === "topup"
                ? "Пополнение баланса"
                : "Перевод в накопительный счёт"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>
              {modalAction === "topup" ? "Пополнить баланс" : "Перевести в накопительный"}
            </h3>
            <form
              className={styles.modalBody}
              onSubmit={(event) => {
                event.preventDefault();
                submitModal().catch(() => undefined);
              }}
            >
              <InputField
                label="Сумма в рублях"
                inputMode="decimal"
                autoFocus
                placeholder="Например, 100.50"
                value={amountInput}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setAmountInput(event.target.value);
                  if (amountError) setAmountError(null);
                }}
                error={amountError}
              />
              <div className={styles.modalActions}>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={closeModal}
                  disabled={pendingAction !== null}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={pendingAction !== null}>
                  Подтвердить
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
