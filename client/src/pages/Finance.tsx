import { useEffect, useState } from "react";
import { Button, Card, Screen } from "../components/UI";
import { api } from "../api";

export default function Finance() {
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [income, setIncome] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [savingsBalance, setSavingsBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [savingsDeposit, setSavingsDeposit] = useState<number>(0);
  const [savingsWithdraw, setSavingsWithdraw] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [latest, savings] = await Promise.all([
          api.financeLatest().catch(() => ({ balance: 0 } as any)),
          api.savingsGet(),
        ]);
        setCurrentBalance(latest?.balance ?? 0);
        setBalance(latest?.balance ?? 0);
        setSavingsBalance(savings?.balance ?? 0);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const notify = (message: string, type: "success" | "error") => {
    setMsg(message);
    setMsgType(type);
  };

  const clearMessage = () => {
    setMsg(null);
    setMsgType(null);
  };

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      notify(error.message, "error");
    } else {
      notify("Не удалось выполнить операцию", "error");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();
    try {
      await api.createSnapshot({ date, income, expenses, balance });
      setCurrentBalance(balance);
      notify("Снимок сохранён. Баланс обновлён.", "success");
    } catch (error) {
      handleError(error);
    }
  };

  const submitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();
    try {
      const result = await api.balanceDeposit(depositAmount);
      setCurrentBalance(result.balance);
      setBalance(result.balance);
      setDepositAmount(0);
      notify("Баланс пополнен.", "success");
    } catch (error) {
      handleError(error);
    }
  };

  const submitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();
    try {
      const result = await api.balanceWithdraw(withdrawAmount);
      setCurrentBalance(result.balance);
      setBalance(result.balance);
      setWithdrawAmount(0);
      notify("Средства списаны с текущего счёта.", "success");
    } catch (error) {
      handleError(error);
    }
  };

  const submitSavingsDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();
    try {
      const result = await api.savingsDeposit(savingsDeposit);
      setSavingsBalance(result.balance);
      const latest = await api.financeLatest().catch(() => ({ balance: 0 } as any));
      setCurrentBalance(latest?.balance ?? 0);
      setBalance(latest?.balance ?? 0);
      setSavingsDeposit(0);
      notify("Перевод в накопительный счёт выполнен.", "success");
    } catch (error) {
      handleError(error);
    }
  };

  const submitSavingsWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();
    try {
      const result = await api.savingsWithdraw(savingsWithdraw);
      setSavingsBalance(result.balance);
      setCurrentBalance(result.currentBalance);
      setBalance(result.currentBalance);
      setSavingsWithdraw(0);
      notify("Средства возвращены на текущий счёт.", "success");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Screen>
      <div className="py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Finance snapshot</h1>
        <Card>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Текущий счёт</h2>
            <div className="text-sm text-white/70">Доступно: ₽ {currentBalance.toLocaleString("ru-RU")}</div>
            <div className="space-y-3">
              <form className="space-y-3" onSubmit={submitDeposit}>
                <div>
                  <div className="text-sm mb-1 text-white/70">Сумма пополнения</div>
                  <input
                    type="number"
                    className="w-full rounded-xl bg-white/5 px-3 py-2"
                    value={depositAmount}
                    min={0}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                  />
                </div>
                <Button type="submit" disabled={depositAmount <= 0}>Пополнить</Button>
              </form>
              <form className="space-y-3" onSubmit={submitWithdraw}>
                <div>
                  <div className="text-sm mb-1 text-white/70">Списать сумму</div>
                  <input
                    type="number"
                    className="w-full rounded-xl bg-white/5 px-3 py-2"
                    value={withdrawAmount}
                    min={0}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  />
                </div>
                <Button type="submit" disabled={withdrawAmount <= 0}>Списать</Button>
              </form>
            </div>
          </div>
        </Card>
        <Card>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Накопительный счёт</h2>
            <div className="text-sm text-white/70">На счёте: ₽ {savingsBalance.toLocaleString("ru-RU")}</div>
            <div className="space-y-3">
              <form className="space-y-3" onSubmit={submitSavingsDeposit}>
                <div>
                  <div className="text-sm mb-1 text-white/70">Перевести с текущего</div>
                  <input
                    type="number"
                    className="w-full rounded-xl bg-white/5 px-3 py-2"
                    value={savingsDeposit}
                    min={0}
                    onChange={(e) => setSavingsDeposit(Number(e.target.value))}
                  />
                </div>
                <Button type="submit" disabled={savingsDeposit <= 0}>Перевести</Button>
              </form>
              <form className="space-y-3" onSubmit={submitSavingsWithdraw}>
                <div>
                  <div className="text-sm mb-1 text-white/70">Вернуть на текущий счёт</div>
                  <input
                    type="number"
                    className="w-full rounded-xl bg-white/5 px-3 py-2"
                    value={savingsWithdraw}
                    min={0}
                    onChange={(e) => setSavingsWithdraw(Number(e.target.value))}
                  />
                </div>
                <Button type="submit" disabled={savingsWithdraw <= 0}>Вернуть</Button>
              </form>
            </div>
          </div>
        </Card>
        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm mb-1 text-white/70">Date</div>
                <input type="date" className="w-full rounded-xl bg-white/5 px-3 py-2"
                       value={date} onChange={(e)=>setDate(e.target.value)} />
              </div>
              <div>
                <div className="text-sm mb-1 text-white/70">Income</div>
                <input type="number" className="w-full rounded-xl bg-white/5 px-3 py-2"
                       value={income} onChange={(e)=>setIncome(+e.target.value)} />
              </div>
              <div>
                <div className="text-sm mb-1 text-white/70">Expenses</div>
                <input type="number" className="w-full rounded-xl bg-white/5 px-3 py-2"
                       value={expenses} onChange={(e)=>setExpenses(+e.target.value)} />
              </div>
              <div>
                <div className="text-sm mb-1 text-white/70">Balance</div>
                <input type="number" className="w-full rounded-xl bg-white/5 px-3 py-2"
                       value={balance} onChange={(e)=>setBalance(+e.target.value)} />
              </div>
            </div>
            <Button type="submit">Save</Button>
          </form>
        </Card>
        {msg && (
          <div
            className={`text-sm ${msgType === "error" ? "text-red-400" : "text-emerald-400"}`}
          >
            {msg}
          </div>
        )}
      </div>
    </Screen>
  );
}
