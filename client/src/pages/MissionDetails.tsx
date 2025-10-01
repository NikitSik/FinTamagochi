import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./styles/MissionDetails.module.css";
import { api, type Mission } from "../api";
import { Button, Screen } from "../components/UI";
import { formatMissionReward, getMissionMeta } from "./MissionData";
import { ANTIFRAUD_QUESTIONS } from "../utils/antifraudQuestions";

export default function MissionDetails() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [acting, setActing] = useState<null | "step" | "claim">(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizClaiming, setQuizClaiming] = useState(false);
  const quizRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    setAnswers({});
    setQuizChecked(false);
  }, [mission?.id]);

  const meta = useMemo(() => getMissionMeta(mission ?? undefined), [mission]);
  const progressPercent = useMemo(() => {
    if (!mission) return 0;
    return Math.min(100, Math.round((mission.progress.counter / Math.max(1, mission.progress.target)) * 100));
  }, [mission]);

  const canClaim = mission && mission.progress.status === "Done" && !(mission.progress.rewardClaimed ?? false);
  const canStep = mission && (mission.repeatable || mission.progress.status !== "Done");
  const isAntifraudMission = mission?.code === "ANTIFRAUD_TUTORIAL";
  const progressText = mission ? `${mission.progress.counter}/${mission.progress.target}` : "—";
  const correctCount = useMemo(
    () => ANTIFRAUD_QUESTIONS.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0),
    [answers]
  );
  const quizCompleted = correctCount === ANTIFRAUD_QUESTIONS.length;

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

  async function handleQuizSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mission || mission.progress.counter >= mission.progress.target) {
      setQuizChecked(true);
      return;
    }
    setQuizChecked(true);
    if (!quizCompleted) {
      return;
    }

    setQuizSubmitting(true);
    try {
      await api.missionStep(mission.id);
      await load(mission.code);
    } catch (err: any) {
      alert(err?.message ?? "Не удалось засчитать прогресс");
    } finally {
      setQuizSubmitting(false);
    }
  }

  async function handleQuizClaim() {
    if (!mission || !canClaim) return;
    setActing("claim");
    setQuizClaiming(true);
    try {
      await api.missionClaim(mission.id);
      await load(mission.code);
      alert("Награда получена! Загляните к питомцу, чтобы встретить нового друга.");
    } catch (err: any) {
      alert(err?.message ?? "Не удалось получить награду");
    } finally {
      setQuizClaiming(false);
      setActing(null);
    }
  }

  function resetQuiz() {
    setAnswers({});
    setQuizChecked(false);
  }

  function scrollToQuiz() {
    if (quizRef.current) {
      quizRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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

                  {isAntifraudMission && (
                    <button type="button" className={styles.heroLink} onClick={scrollToQuiz}>Пройти тест</button>
                  )}

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

              {isAntifraudMission && (
                <section ref={quizRef} className={`${styles.card} ${styles.quizCard}`}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Тест по безопасности</h3>
                    <span className={styles.quizProgress}>{progressText}</span>
                  </div>
                  <p className={styles.quizLead}>
                    Ответьте правильно на все вопросы, чтобы зачесть шаг миссии «Защита от мошенников».
                  </p>

                  <form className={styles.quizForm} onSubmit={handleQuizSubmit}>
                    {ANTIFRAUD_QUESTIONS.map((question, idx) => {
                      const active = answers[question.id];
                      return (
                        <div key={question.id} className={styles.quizQuestion}>
                          <div className={styles.quizQuestionHead}>
                            <span className={styles.quizIndex}>{idx + 1}</span>
                            <h4 className={styles.quizQuestionText}>{question.text}</h4>
                          </div>

                          <div className={styles.quizOptions}>
                            {question.options.map((option) => {
                              const isCorrect = option.value === question.correct;
                              const selected = active === option.value;
                              const showState = quizChecked;
                              const wrongChoice = showState && selected && !isCorrect;
                              const rightChoice = showState && isCorrect;
                              return (
                                <label
                                  key={option.value}
                                  className={`${styles.quizOption} ${selected ? styles.quizOptionActive : ""} ${rightChoice ? styles.quizOptionCorrect : ""} ${wrongChoice ? styles.quizOptionWrong : ""}`}
                                >
                                  <input
                                    type="radio"
                                    name={question.id}
                                    value={option.value}
                                    checked={selected}
                                    onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.value }))}
                                    disabled={quizSubmitting || quizClaiming}
                                  />
                                  <span>{option.label}</span>
                                </label>
                              );
                            })}
                          </div>

                          {quizChecked && <p className={styles.quizExplanation}>{question.explanation}</p>}
                        </div>
                      );
                    })}

                    <div className={styles.quizActions}>
                      <Button
                        type="submit"
                        className={styles.quizSubmitBtn}
                        disabled={quizSubmitting || quizClaiming || acting === "step" || acting === "claim"}
                      >
                        {quizSubmitting
                          ? "Отмечаем..."
                          : quizCompleted
                          ? "Засчитать прогресс"
                          : "Проверить ответы"}
                      </Button>
                      <button
                        type="button"
                        className={styles.quizResetBtn}
                        onClick={resetQuiz}
                        disabled={quizSubmitting || quizClaiming}
                      >
                        Сбросить ответы
                      </button>
                    </div>
                  </form>

                  {quizChecked && (
                    <div
                      className={`${styles.quizResult} ${quizCompleted ? styles.quizResultSuccess : styles.quizResultWarn}`}
                    >
                      {quizCompleted
                        ? "Все ответы верные — можно зачесть прогресс миссии."
                        : `Правильных ответов: ${correctCount} из ${ANTIFRAUD_QUESTIONS.length}. Исправьте ошибки и попробуйте ещё раз.`}
                    </div>
                  )}

                  {canClaim && (
                    <Button
                      className={`${styles.quizSubmitBtn} ${styles.quizClaimBtn}`}
                      onClick={handleQuizClaim}
                      disabled={quizClaiming}
                      type="button"
                    >
                      {quizClaiming ? "Получаем..." : `Забрать награду (${mission.reward.coins} монет)`}
                    </Button>
                  )}
                </section>
              )}

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