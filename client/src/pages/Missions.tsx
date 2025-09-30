// src/pages/Missions.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./styles/Missions.module.css";
import { Button, Card, Pill, Screen } from "../components/UI";
import { api, type Mission } from "../api";
import { formatMissionReward, getMissionMeta } from "./MissionData";

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

  const canClaim = (m: Mission) =>
    m.progress.status === "Done" && !(m.progress.rewardClaimed ?? false);

  const canStep = (m: Mission) => m.progress.status !== "Done" || m.repeatable;

  const percent = (m: Mission) =>
    Math.min(100, Math.round((m.progress.counter / Math.max(1, m.progress.target)) * 100));

  const handleStep = async (id: number) => {
    setActingId(id);
    try {
      await api.missionStep(id);
    }
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
            items.map((m) => {
              const meta = getMissionMeta(m);
              return (
                <Card key={m.id} className={styles.missionCard}>
                  <div className={styles.top}>
                    <div className={styles.titleRow}>
                      <h3 className={styles.missionTitle}>{m.title}</h3>
                       {meta?.tagline && (
                      <span className={styles.missionTagline}>{meta.tagline}</span>
                    )}
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

                <div className={styles.rewardRow}>
                  <span className={styles.rewardLabel}>Награда:</span>
                  <span className={styles.rewardValue}>{formatMissionReward(m)}</span>
                </div>

                {m.repeatable && (
                  <div className={styles.repeatable}>Повторяемая миссия</div>
                )}

                <div className={styles.actions}>
                  <Button
                    className={styles.stepBtn}
                    onClick={() => handleStep(m.id)}
                    disabled={actingId === m.id || !canStep(m)}
                  >
                    Шаг
                  </Button>

                  <Button
                    className={styles.claimBtn}
                    onClick={() => handleClaim(m.id)}
                    disabled={!canClaim(m) || actingId === m.id}
                  >
                    {canClaim(m) ? "Забрать награду" : statusLabel(m)}
                  </Button>
                  <Link className={styles.moreLink} to={`/missions/${m.code}`}>
                    Подробнее
                  </Link>
                </div>
              </Card>
            );
            })}
        </main>
      </div>
    </Screen>
  );
}


function statusLabel(m: Mission): string {
  if (m.progress.status === "Done") {
    return m.progress.rewardClaimed ? "Награда получена" : "Готово";
  }
  return "В процессе";
}
