import { useState } from "react";
import { Button, Card, Screen } from "../components/UI";
import { api } from "../api";

export default function Finance() {
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [income, setIncome] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    await api.createSnapshot({ date, income, expenses, balance });
    setMsg("Snapshot saved. Pet state will reflect it.");
  };

  return (
    <Screen>
      <div className="py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Finance snapshot</h1>
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
        {msg && <div className="text-emerald-400 text-sm">{msg}</div>}
      </div>
    </Screen>
  );
}
