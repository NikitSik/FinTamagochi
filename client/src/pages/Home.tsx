import { useEffect, useState } from "react";
import styles from "./styles/Home.module.css";
import { api } from "../api";
import Dog from "../components/pets/dog";
import Cat from "../components/pets/cat";
import Parrot from "../components/pets/parrot";

type View = {
  coins: number;
  savings: number;     
  current: number;    
   selectedPetId: "dog" | "cat" | "parrot";
};

export default function Home() {
  const [view, setView] = useState<View>({ coins: 0, savings: 0, current: 0, selectedPetId: "dog" });
  const [opened, setOpened] = useState<"snapshot" | "deposit" | null>(null);
  const [busy, setBusy] = useState(false);

  // формы
  const [income, setIncome]   = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount]   = useState(0);

  const totalRUB = Math.round(view.current + view.savings);

  async function load() {
    const [pet, sav, latest] = await Promise.all([
      api.petState(),
      api.savingsGet(),
      api.financeLatest().catch(() => ({ balance: 0 } as any)),
    ]);
    setView({
      coins: pet.coins,
      selectedPetId: (pet.selectedPetId as View["selectedPetId"]) ?? "dog",
      savings: sav.balance ?? 0,
      current: latest?.balance ?? 0,
    });
  }

  useEffect(() => { load().catch(console.error); }, []);

  async function saveSnapshot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createSnapshot({
        date: new Date().toISOString().slice(0,10),
        income, expenses, balance
      });
      await load();
      setOpened(null);
    } finally { setBusy(false); }
  }

  async function deposit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) return;
    setBusy(true);
    try {
      await api.savingsDeposit(amount);
      await load();
      setOpened(null);
      setAmount(0);
    } finally { setBusy(false); }
  }

  function PetHead() {
    const common = { className: styles.petCircleSvg } as any;
    switch (view.selectedPetId) {
      case "cat":
        return <Cat {...common} />;
      case "parrot":
        return <Parrot {...common} />;
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
                <span className={styles.accountNumber}>• демо</span>
              </div>
              <div className={styles.accountAmt}>
                ₽ {new Intl.NumberFormat("ru-RU").format(view.current)}
              </div>
            </li>

            <li className={styles.accountRow}>
              <div className={styles.accountInfo}>
                <span className={styles.accountTitle}>Накопительный</span>
                <span className={styles.accountNumber}>• демо</span>
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
          </div>
        </section>
      </main>

      {/* модалка: снепшот */}
      {opened === "snapshot" && (
        <Modal onClose={() => setOpened(null)} title="Изменить финансы">
          <form onSubmit={saveSnapshot} className="grid gap-3">
            <L label="Доход (₽)"><input type="number" value={income} onChange={e=>setIncome(+e.target.value)} /></L>
            <L label="Расходы (₽)"><input type="number" value={expenses} onChange={e=>setExpenses(+e.target.value)} /></L>
            <L label="Баланс текущего (₽)"><input type="number" value={balance} onChange={e=>setBalance(+e.target.value)} /></L>
            <button className={styles.primaryBtn} disabled={busy}>{busy ? "Сохраняем..." : "Сохранить"}</button>
          </form>
        </Modal>
      )}

      {/* модалка: перевод */}
      {opened === "deposit" && (
        <Modal onClose={() => setOpened(null)} title="Перевод в накопительный">
          <form onSubmit={deposit} className="grid gap-3">
            <L label="Сумма (₽)"><input type="number" value={amount} onChange={e=>setAmount(+e.target.value)} /></L>
            <button className={styles.primaryBtn} disabled={busy || amount<=0}>{busy ? "Отправляем..." : "Перевести"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* простые утилки модалки */
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"grid", placeItems:"center", zIndex:1000 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"90%", maxWidth:420, background:"rgba(20,22,35,.95)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:16, color:"#fff" }}>
        <div style={{fontWeight:700, marginBottom:8}}>{title}</div>
        {children}
      </div>
    </div>
  );
}
function L({label, children}:{label:string; children:React.ReactNode}) {
  return (<label style={{display:"grid", gap:6}}>
    <span style={{opacity:.7, fontSize:12}}>{label}</span>
    {children}
  </label>);
}
