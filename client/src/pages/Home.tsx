import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./styles/Home.module.css";
import { api, type User } from "../api";
import Dog from "../components/pets/dog";
import Cat from "../components/pets/cat";

type View = {
  coins: number;
  savings: number;
  current: number;
  selectedPetId: "dog" | "cat";
  owner: string;
};

export default function Home() {
  const [view, setView] = useState<View>({ coins: 0, savings: 0, current: 0, selectedPetId: "dog", owner: "мой счёт" });
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
    });
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function saveSnapshot(e: React.FormEvent) {
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

  async function deposit(e: React.FormEvent) {
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
        <h1 className={styles.title}>ФинТамагочи</h1>
      </header>

      <main className={styles.main}>
        {/* Общий баланс + список счетов */}
        <section className={styles.balanceCard}>
          <div className={styles.balanceTop}>
            <span className={styles.balanceCaption}>Баланс (₽)</span>
            <strong className={styles.balanceValue}>
              {new Intl.NumberFormat("ru-RU").format(totalRUB)}
            </strong>
          </div>

          <ul className={styles.accounts}>
            <li className={styles.accountRow}>
              <div className={styles.accountInfo}>
                <span className={styles.accountTitle}>Текущий счёт</span>
                <span className={styles.accountNumber}>• {view.owner}</span>
              </div>
              <div className={styles.accountAmt}>
                ₽ {new Intl.NumberFormat("ru-RU").format(view.current)}
              </div>
            </li>

            <li className={styles.accountRow}>
              <div className={styles.accountInfo}>
                <span className={styles.accountTitle}>Накопительный</span>
                <span className={styles.accountNumber}>• {view.owner}</span>
              </div>
              <div className={styles.accountAmt}>
                ₽ {new Intl.NumberFormat("ru-RU").format(view.savings)}
              </div>
            </li>

            {/* Игровые монеты — отдельная строка, не входит в ₽ баланс */}
            <li className={styles.accountRow}>
              <div className={styles.accountInfo}>
                <span className={styles.accountTitle}>Игровые монеты</span>
                <span className={styles.accountNumber}>• внутриигровые</span>
              </div>
              <div className={styles.accountAmt}>
                {view.coins}
              </div>
            </li>
          </ul>

          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={() => setOpened("snapshot")}>
              Пополнить доход
            </button>
            <button className={styles.secondaryBtn} onClick={() => setOpened("deposit")}>
              В накопительный
            </button>
          </div>
        </section>

        {/* Питомец */}
        <section className={styles.petCard}>
          <div className={styles.petLeft}>
            <h2 className={styles.petTitle}>Твой питомец</h2>
            <p className={styles.petHint}>Кормите и выполняйте миссии — повышайте уровень финансового здоровья.</p>

            <div className={styles.petStats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Настроение</span>
                <div className={styles.progress}><i style={{ width: "70%" }} /></div>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Сытость</span>
                <div className={styles.progress}><i style={{ width: "55%" }} /></div>
              </div>
            </div>
          </div>

          <div className={styles.petRight} aria-label="Питомец">
            <div className={styles.petCircle}>
              <PetHead />
            </div>
              <Link className={styles.linkBtn} to="/tests">Пройти тесты</Link>
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
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalPanel} onClick={e=>e.stopPropagation()}>
        <div className={styles.modalTitle}>{title}</div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}
function L({label, children}:{label:string; children:React.ReactNode}) {
  return (
    <label className={styles.modalField}>
      <span>{label}</span>
      {children}
    </label>
  );
}
