import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./styles/MissionDetails.module.css";
import { api, type Mission } from "../api";
import { Button, Screen } from "../components/UI";
import { formatMissionReward, getMissionMeta } from "./MissionData";

export default function MissionDetails() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [acting, setActing] = useState<null | "step" | "claim">(null);

  async function load(currentCode: string) {
    setLoading(true);
    setErr(null);
    try {
      const list = await api.missions();
      const found = list.find((m) => m.code === currentCode) ?? null;
      if (!found) {
        setErr("Миссия не найдена");
      }
      setMission(found);
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось загрузить миссию");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!code) {
      navigate("/missions", { replace: true });
      return;
    }
    load(code).catch(console.error);
  }, [code, navigate]);

  const meta = useMemo(() => getMissionMeta(mission ?? undefined), [mission]);
  const progressPercent = useMemo(() => {
    if (!mission) return 0;
    return Math.min(100, Math.round((mission.progress.counter / Math.max(1, mission.progress.target)) * 100));
  }, [mission]);

  const canClaim = mission && mission.progress.status === "Done" && !(mission.progress.rewardClaimed ?? false);
  const canStep = mission && (mission.repeatable || mission.progress.status !== "Done");

  async function step() {
    if (!mission) return;
    setActing("step");
    try {
      await api.missionStep(mission.id);
      await load(mission.code);
    } catch (e: any) {
      alert(e?.message ?? "Не удалось обновить прогресс");
    } finally {
      setActing(null);
    }
  }

  async function claim() {
    if (!mission) return;
    setActing("claim");
    try {
      await api.missionClaim(mission.id);
      await load(mission.code);
    } catch (e: any) {
      alert(e?.message ?? "Не удалось получить награду");
    } finally {
      setActing(null);
    }
  }

  const tasks = meta?.tasks ?? [];
  const stepCount = mission ? Math.min(mission.progress.counter, mission.progress.target) : 0;
  const statusText = mission
    ? mission.repeatable
      ? "Повторяемая миссия"
      : mission.progress.status === "Done"
      ? mission.progress.rewardClaimed
        ? "Награда получена"
        : "Готово к получению"
      : "В процессе"
    : "";

  return (
    <Screen>
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Назад">
            ←
          </button>
          <h1 className={styles.title}>{mission?.title ?? "Миссия"}</h1>
        </header>

        <main className={styles.main}>
          {loading && (
            <>
              <div className={styles.heroSkeleton} />
              <div className={styles.cardSkeleton} />
              <div className={styles.cardSkeleton} />
            </>
          )}

          {!loading && err && <div className={styles.err}>{err}</div>}

          {!loading && mission && (
            <>
              <section
                className={styles.hero}
                style={meta?.heroGradient ? { background: meta.heroGradient } : undefined}
              >
                <div className={styles.heroContent}>
                  {meta?.tagline && <span className={styles.heroTag}>{meta.tagline}</span>}
                  <h2 className={styles.heroTitle}>{mission.title}</h2>
                  {meta?.summary && <p className={styles.heroSummary}>{meta.summary}</p>}

                  <div className={styles.heroStats}>
                    <div className={styles.progressBlock}>
                      <span className={styles.progressLabel}>Прогресс</span>
                      <div className={styles.progressBar}>
                        <i style={{ width: `${progressPercent}%` }} />
                      </div>
                      <span className={styles.progressValue}>
                        {mission.progress.counter}/{mission.progress.target}
                      </span>
                    </div>

                    <div className={styles.rewardBlock}>
                      <span className={styles.progressLabel}>Награда</span>
                      <strong className={styles.rewardValue}>{formatMissionReward(mission)}</strong>
                    </div>
                  </div>
                </div>

                {meta?.heroIcon && <div className={styles.heroArt}>{meta.heroIcon}</div>}
              </section>

              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Задания</h3>
                  <span className={styles.statusChip}>{statusText}</span>
                </div>
                <ul className={styles.taskList}>
                  {tasks.map((task, index) => {
                    const completed = index < stepCount;
                    const current = !completed && index === stepCount;
                    return (
                      <li
                        key={task.title}
                        className={`${styles.taskItem} ${completed ? styles.taskDone : ""} ${current ? styles.taskCurrent : ""}`}
                      >
                        <span className={styles.taskIndex}>{index + 1}</span>
                        <div className={styles.taskBody}>
                          <p className={styles.taskTitle}>{task.title}</p>
                          <p className={styles.taskDescription}>{task.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {meta?.benefits?.length ? (
                <section className={styles.card}>
                  <h3 className={styles.sectionTitle}>Что даст миссия</h3>
                  <ul className={styles.benefitList}>
                    {meta.benefits.map((item) => (
                      <li key={item} className={styles.benefitItem}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {meta?.resources?.length ? (
                <section className={styles.card}>
                  <h3 className={styles.sectionTitle}>Материалы и подсказки</h3>
                  <ul className={styles.resourceList}>
                    {meta.resources.map((res) => (
                      <li key={res.url}>
                        <a className={styles.resourceLink} href={res.url} target="_blank" rel="noreferrer">
                          {res.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className={`${styles.card} ${styles.actionsCard}`}>
                <div className={styles.actions}>
                  <Button className={styles.actionBtn} onClick={step} disabled={!canStep || acting === "step"}>
                    {acting === "step" ? "Отмечаем..." : "Отметить шаг"}
                  </Button>
                  <Button
                    className={`${styles.actionBtn} ${styles.claimBtn}`}
                    onClick={claim}
                    disabled={!canClaim || acting === "claim"}
                  >
                    {canClaim ? (acting === "claim" ? "Получаем..." : "Забрать награду") : "Недоступно"}
                  </Button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </Screen>
  );
}