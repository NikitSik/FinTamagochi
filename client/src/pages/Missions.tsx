import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./styles/Missions.module.css";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { api, type Mission } from "../api";
import { formatMissionReward, getMissionMeta } from "./MissionData";

export default function Missions() {
  const [items, setItems] = useState<Mission[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [reward, setReward] = useState<null | {
    coins: number;
    xp: number;
    petId?: string | null;
  }>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const data = await api.missions();
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || "Не удалось загрузить миссии");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    if (!reward) return;
    const timer = window.setTimeout(() => setReward(null), 6000);
    return () => window.clearTimeout(timer);
  }, [reward]);

  const canClaim = (m: Mission) =>
    m.progress.status === "Done" && !(m.progress.rewardClaimed ?? false);

  const canStep = (m: Mission) => m.progress.status !== "Done" || m.repeatable;

  const percent = (m: Mission) =>
    Math.min(100, Math.round((m.progress.counter / Math.max(1, m.progress.target)) * 100));

  const handleStep = async (id: number) => {
    setActingId(id);
    try {
      await api.missionStep(id);
    } finally {
      setActingId(null);
      await load();
    }
  };

  const handleClaim = async (id: number) => {
    setActingId(id);
    try {
      const data = await api.missionClaim(id);
      setReward({ coins: data.coins, xp: data.xp, petId: data.petId });
    } finally {
      setActingId(null);
      await load();
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Миссии</h1>
        <p className={styles.lead}>Выполняйте задания и получайте награды.</p>
      </header>

      {err && <div className={styles.err}>{err}</div>}

      {loading && (
        <div className={styles.skeletons}>
          <div className={styles.skelCard} />
          <div className={styles.skelCard} />
          <div className={styles.skelCard} />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className={styles.empty}>Пока нет активных миссий</div>
      )}

      <div className={styles.list}>
        {!loading &&
          items.map((m) => {
            const meta = getMissionMeta(m);
            const progress = percent(m);
            return (
              <Card key={m.id} className={styles.missionCard}>
                <div className={styles.missionHeader}>
                  <div>
                    <h3 className={styles.missionTitle}>{m.title}</h3>
                    {meta?.tagline && (
                      <p className={styles.missionTagline}>{meta.tagline}</p>
                    )}
                  </div>
                  <span className={styles.counter}>{m.progress.counter}/{m.progress.target}</span>
                </div>
                {m.description && <p className={styles.missionDesc}>{m.description}</p>}

                <div className={styles.progressRow}>
                  <ProgressBar label="Прогресс" value={progress} />
                </div>

                <div className={styles.rewardRow}>
                  <span className={styles.rewardLabel}>Награда</span>
                  <span className={styles.rewardValue}>{formatMissionReward(m)}</span>
                </div>

                {m.repeatable && (
                  <div className={styles.repeatable}>Повторяемая миссия</div>
                )}

                <div className={styles.actions}>
                  <Button
                    onClick={() => handleStep(m.id)}
                    disabled={actingId === m.id || !canStep(m)}
                  >
                    Шаг
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleClaim(m.id)}
                    disabled={!canClaim(m) || actingId === m.id}
                  >
                    {canClaim(m) ? "Забрать награду" : statusLabel(m)}
                  </Button>
                </div>

                <div className={styles.links}>
                  <Link className={styles.moreLink} to={`/missions/${m.code}`}>
                    Подробнее
                  </Link>
                  {m.code === "ANTIFRAUD_TUTORIAL" && (
                    <Link className={styles.testLink} to="/tests">
                      Пройти тест
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
      </div>

      {reward && (
        <div className={styles.rewardBanner} role="status">
          <div>
            <strong>Награда: +{reward.coins} монет</strong>
            {reward.xp ? <span className={styles.rewardXp}> · {reward.xp} XP</span> : null}
            {reward.petId && (
              <span className={styles.rewardPet}>
                · Новый питомец: {reward.petId === "cat" ? "Кот" : reward.petId === "dog" ? "Пёс" : reward.petId}
              </span>
            )}
          </div>
          <div className={styles.rewardActions}>
            {reward.petId && (
              <Link className={styles.rewardLink} to="/pet">
                К питомцу
              </Link>
            )}
            <button className={styles.rewardClose} onClick={() => setReward(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function statusLabel(m: Mission): string {
  if (m.progress.status === "Done") {
    return m.progress.rewardClaimed ? "Награда получена" : "Готово";
  }
  return "В процессе";
}
