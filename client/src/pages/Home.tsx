import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./styles/Home.module.css";
import { api, type User } from "../api";
import Dog from "../components/pets/dog";
import Cat from "../components/pets/cat";

const rubFormatter = new Intl.NumberFormat("ru-RU");

type View = {
  coins: number;
  savings: number;
  current: number;
  selectedPetId: "dog" | "cat";
  owner: string;
  mood: number;
  satiety: number;
  health: number;
};

export default function Home() {
  const [view, setView] = useState<View>({
    coins: 0,
    savings: 0,
    current: 0,
    selectedPetId: "dog",
    owner: "мой счёт",
    mood: 0,
    satiety: 0,
    health: 0,
  });
  const [opened, setOpened] = useState<"snapshot" | "deposit" | null>(null);
  const [busy, setBusy] = useState(false);

  // формы
  const [income, setIncome]   = useState("");
  const [expenses, setExpenses] = useState("");
  const [balance, setBalance] = useState("");
  const [amount, setAmount]   = useState("");

  const totalRUB = Math.round(view.current + view.savings);
  const parsedAmount = Number(amount.trim().replace(",", "."));
  const isAmountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const stats = [
    { label: "Настроение", value: view.mood },
    { label: "Сытость", value: view.satiety },
    { label: "Здоровье", value: view.health },
  ];

  const accounts = [
    {
      key: "current",
      title: "Текущий счёт",
      subtitle: `• ${view.owner}`,
      amount: view.current,
      currency: "₽",
      note: "Свободные средства",
    },
    {
      key: "savings",
      title: "Накопительный",
      subtitle: `• ${view.owner}`,
      amount: view.savings,
      currency: "₽",
      note: "Отложено на цели",
    },
    {
      key: "coins",
      title: "Игровые монеты",
      subtitle: "• внутриигровые",
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
      selectedPetId: (pet.selectedPetId as View["selectedPetId"]) ?? "dog",
      savings: sav.balance ?? 0,
      current: latest?.balance ?? 0,
      owner: me?.nickname ?? me?.email ?? "мой счёт",
      mood: pet.mood ?? 0,
      satiety: pet.satiety ?? 0,
      health: pet.health ?? 0,
    });
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function saveSnapshot(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const incomeValue = Number((income || "0").replace(",", "."));
      const expenseValue = Number((expenses || "0").replace(",", "."));
      const balanceValue = Number((balance || "0").replace(",", "."));
      await api.createSnapshot({
        date: new Date().toISOString().slice(0,10),
        income: incomeValue,
        expenses: expenseValue,
        balance: balanceValue,
      });
      await load();
      setOpened(null);
      setIncome("");
      setExpenses("");
      setBalance("");
    } finally { setBusy(false); }
  }

  async function deposit(e: FormEvent) {
    e.preventDefault();
    const raw = amount.trim().replace(",", ".");
    const numeric = Number(raw);
    if (!numeric || numeric <= 0) return;
    setBusy(true);
    try {
      await api.savingsDeposit(numeric);
      await load();
      setOpened(null);
      setAmount("");
    } catch (e: any) {
      alert(e?.message ?? "Не удалось перевести в накопительный счёт");
    } finally { setBusy(false); }
  }

  function PetHead() {
    const common = { className: styles.petCircleSvg } as any;
    switch (view.selectedPetId) {
      case "cat":
        return <Cat {...common} />;
      default:
        return <Dog {...common} />;
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
        <section className={styles.grid}>
          <article className={`${styles.surface} ${styles.summaryCard}`}>
            <div className={styles.summaryHeader}>
              <div>
                <h2>Финансовый обзор</h2>
                <p className={styles.summaryHint}>Следите за ежедневными балансами и быстро фиксируйте изменения.</p>
              </div>
              <span className={styles.badge}>Рубли</span>
            </div>

            <p className={styles.summaryTotal}>₽ {formatRUB(totalRUB)}</p>

            <div className={styles.summaryBreakdown}>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Текущий счёт</span>
                <span className={styles.breakdownValue}>₽ {formatRUB(view.current)}</span>
                <span className={styles.breakdownNote}>Свободные средства на сегодня</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Накопительный</span>
                <span className={styles.breakdownValue}>₽ {formatRUB(view.savings)}</span>
                <span className={styles.breakdownNote}>Отложено на ваши цели</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Игровые монеты</span>
                <span className={styles.breakdownValue}>{view.coins}</span>
                <span className={styles.breakdownNote}>Заработайте больше в миссиях</span>
              </div>
            </div>

            <div className={styles.quickActions}>
              <button className={styles.primaryBtn} onClick={() => setOpened("snapshot")}>
                Зафиксировать доход
              </button>
              <button className={styles.secondaryBtn} onClick={() => setOpened("deposit")}>
                Перевести в накопления
              </button>
            </div>
          </article>

          <article className={`${styles.surface} ${styles.petCard}`}>
            <div className={styles.petContent}>
              <div>
                <h2 className={styles.petTitle}>Твой питомец</h2>
                <p className={styles.petHint}>Кормите, заботьтесь и выполняйте миссии, чтобы улучшать финансовое здоровье.</p>
              </div>
              <div className={styles.petStats}>
                {stats.map((stat) => (
                  <div className={styles.statCard} key={stat.label}>
                    <span className={styles.statLabel}>{stat.label}</span>
                    <span className={styles.statValue}>{stat.value}%</span>
                    <div className={styles.statBar}>
                      <span className={styles.statBarFill} style={{ width: `${Math.min(stat.value, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.petVisual} aria-label="Питомец">
              <div className={styles.petCircle}>
                <PetHead />
              </div>
              <Link className={styles.missionLink} to="/missions/ANTIFRAUD_TUTORIAL">Миссия с тестом</Link>
            </div>
          </article>
        </section>

        <section className={`${styles.surface} ${styles.accountsSection}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Счета и балансы</h2>
            <p className={styles.sectionText}>Смотрите детали по каждому счёту и контролируйте прогресс накоплений.</p>
          </div>

          <div className={styles.accountsGrid}>
            {accounts.map((account) => (
              <div className={styles.accountCard} key={account.key}>
                <span className={styles.accountLabel}>{account.title}</span>
                <span className={styles.accountValue}>
                  {account.currency ? (
                    <>
                      <span className={styles.accountCurrency}>{account.currency}</span>
                      {" "}
                      {formatRUB(account.amount)}
                    </>
                  ) : (
                    account.amount
                  )}
                </span>
                <span className={styles.accountMeta}>{account.subtitle}</span>
                <span className={styles.accountNote}>{account.note}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* модалка: снепшот */}
      {opened === "snapshot" && (
        <Modal onClose={() => setOpened(null)} title="Изменить финансы">
          <form onSubmit={saveSnapshot} className="grid gap-3">
            <L label="Доход (₽)"><input type="number" inputMode="decimal" value={income} placeholder="Например, 120000" onChange={e=>setIncome(e.target.value)} /></L>
            <L label="Расходы (₽)"><input type="number" inputMode="decimal" value={expenses} placeholder="Например, 85000" onChange={e=>setExpenses(e.target.value)} /></L>
            <L label="Баланс текущего (₽)"><input type="number" inputMode="decimal" value={balance} placeholder="Сколько осталось" onChange={e=>setBalance(e.target.value)} /></L>
            <button className={styles.primaryBtn} disabled={busy}>{busy ? "Сохраняем..." : "Сохранить"}</button>
          </form>
        </Modal>
      )}

      {/* модалка: перевод */}
      {opened === "deposit" && (
        <Modal onClose={() => setOpened(null)} title="Перевод в накопительный">
          <form onSubmit={deposit} className="grid gap-3">
            <L label="Сумма (₽)"><input type="number" inputMode="decimal" value={amount} placeholder="Например, 5000" onChange={e=>setAmount(e.target.value)} /></L>
            <button className={styles.primaryBtn} disabled={busy || !isAmountValid}>{busy ? "Отправляем..." : "Перевести"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* простые утилки модалки */
function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalPanel} onClick={e=>e.stopPropagation()}>
        <div className={styles.modalTitle}>{title}</div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}
function L({label, children}:{label:string; children:ReactNode}) {
  return (
    <label className={styles.modalField}>
      <span>{label}</span>
      {children}
    </label>
  );
}
