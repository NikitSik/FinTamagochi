// src/pages/Missions.tsx
import { useEffect, useState } from "react";
import styles from "./styles/Missions.module.css";
import { Button, Card, Pill, Screen } from "../components/UI";
import { api, type Mission } from "../api"; // берём тип отсюда

export default function Missions() {
  const [items, setItems] = useState<Mission[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const data = await api.missions(); // data: Mission[]
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || "Не удалось загрузить миссии");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const canClaim = (m: Mission) => m.progress.counter >= m.progress.target;

  const percent = (m: Mission) =>
    Math.min(100, Math.round((m.progress.counter / Math.max(1, m.progress.target)) * 100));

  const handleStep = async (id: number) => {
    setActingId(id);
    try { await api.missionStep(id); }
    finally { setActingId(null); await load(); }
  };

  const handleClaim = async (id: number) => {
    setActingId(id);
    try { await api.missionClaim(id); }
    finally { setActingId(null); await load(); }
  };

  return (
    <Screen>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Миссии</h1>
        </header>

        <main className={styles.main}>
          {err && <div className={styles.err}>{err}</div>}

          {loading && (
            <>
              <div className={styles.skelCard} />
              <div className={styles.skelCard} />
              <div className={styles.skelCard} />
            </>
          )}

          {!loading && items.length === 0 && (
            <div className={styles.empty}>Пока нет активных миссий</div>
          )}

          {!loading &&
            items.map((m) => (
              <Card key={m.id} className={styles.missionCard}>
                <div className={styles.top}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.missionTitle}>{m.title}</h3>
                    {m.description && <p className={styles.missionDesc}>{m.description}</p>}
                  </div>
                  <Pill className={styles.pill}>
                    {m.progress.counter}/{m.progress.target}
                  </Pill>
                </div>

                <div className={styles.meta}>
                  <div className={styles.progress}>
                    <i style={{ width: `${percent(m)}%` }} />
                  </div>
                  <span className={styles.metaText}>{percent(m)}%</span>
                </div>

                <div className={styles.actions}>
                  <Button
                    className={styles.stepBtn}
                    onClick={() => handleStep(m.id)}
                    disabled={actingId === m.id}
                  >
                    Шаг
                  </Button>

                  <Button
                    className={styles.claimBtn}
                    onClick={() => handleClaim(m.id)}
                    disabled={!canClaim(m) || actingId === m.id}
                  >
                    Забрать награду
                    {typeof m.reward === "number" ? ` (+${m.reward})` : ""}
                  </Button>
                </div>
              </Card>
            ))}
        </main>
      </div>
    </Screen>
  );
}
