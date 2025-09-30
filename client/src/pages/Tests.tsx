import { useEffect, useMemo, useState } from "react";
import styles from "./styles/Tests.module.css";
import { api, type Mission } from "../api";
import { Button, Card, Screen } from "../components/UI";

const QUESTIONS = [
  {
    id: "q1",
    text: "Вам звонят из \"банка\" и просят назвать код из SMS. Что делаете?",
    options: [
      { value: "a", label: "Называю код, чтобы не блокировали счёт" },
      { value: "b", label: "Кладу трубку и перезваниваю по номеру с карты" },
      { value: "c", label: "Прошу перезвонить позже" },
    ],
    correct: "b",
    explanation: "Настоящий банк не попросит код. Перезвоните по официальному номеру.",
  },
  {
    id: "q2",
    text: "Сообщение в мессенджере предлагает срочно перевести деньги родственнику. Как поступить?",
    options: [
      { value: "a", label: "Перевожу сразу — вдруг беда" },
      { value: "b", label: "Проверяю звонком, действительно ли помощь нужна" },
      { value: "c", label: "Отправляю данные карты для подтверждения" },
    ],
    correct: "b",
    explanation: "Позвоните родному человеку или свяжитесь другим способом.",
  },
  {
    id: "q3",
    text: "На сайте увидели акцию с подарками за опрос и просят ввести номер карты. Ваши действия?",
    options: [
      { value: "a", label: "Ввожу номер и CVC — подарок же бесплатный" },
      { value: "b", label: "Закрываю сайт, это похоже на фишинг" },
      { value: "c", label: "Пишу данные в чат поддержки" },
    ],
    correct: "b",
    explanation: "Фишинговые сайты маскируются под акции — не вводите данные карты.",
  },
  {
    id: "q4",
    text: "Аноним просит установить приложение для удалённого доступа \"чтобы помочь\". Что ответите?",
    options: [
      { value: "a", label: "Ставлю приложение — вдруг и правда поможет" },
      { value: "b", label: "Отказываюсь и сообщаю в банк" },
      { value: "c", label: "Разрешаю доступ, но только на 5 минут" },
    ],
    correct: "b",
    explanation: "Удалённый доступ дают только мошенникам. Никогда не устанавливайте такие программы по просьбе незнакомцев.",
  },
  {
    id: "q5",
    text: "Получили письмо о выигрыше, нужно оплатить комиссию для перевода приза. Как реагируете?",
    options: [
      { value: "a", label: "Оплачиваю комиссию — вдруг повезло" },
      { value: "b", label: "Пересылаю письмо друзьям" },
      { value: "c", label: "Удаляю письмо — это мошенничество" },
    ],
    correct: "c",
    explanation: "Любые просьбы оплатить \"комиссию\" за приз — явный обман.",
  },
] as const;

export default function Tests() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [missionErr, setMissionErr] = useState<string | null>(null);
  const [missionBusy, setMissionBusy] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const correctCount = useMemo(
    () => QUESTIONS.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0),
    [answers]
  );

  const completed = correctCount === QUESTIONS.length;
  const progressText = mission
    ? `${mission.progress.counter}/${mission.progress.target}`
    : "—";

  useEffect(() => {
    loadMission().catch(console.error);
  }, []);

  async function loadMission() {
    try {
      setMissionErr(null);
      setMissionBusy(true);
      const data = await api.missions();
      const m = data.find((x) => x.code === "ANTIFRAUD_TUTORIAL") ?? null;
      setMission(m ?? null);
    } catch (e: any) {
      setMissionErr(e?.message ?? "Не удалось загрузить прогресс миссии");
    } finally {
      setMissionBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecked(true);
    if (!mission || mission.progress.counter >= mission.progress.target) {
      return;
    }
    if (!completed) {
      return;
    }

    setSubmitting(true);
    try {
      await api.missionStep(mission.id);
      await loadMission();
    } catch (err: any) {
      alert(err?.message ?? "Не удалось засчитать прогресс");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClaim() {
    if (!mission) return;
    setClaiming(true);
    try {
      await api.missionClaim(mission.id);
      await loadMission();
      alert("Награда получена! Загляните к питомцу, чтобы встретить нового друга.");
    } catch (err: any) {
      alert(err?.message ?? "Не удалось получить награду");
    } finally {
      setClaiming(false);
    }
  }

  function resetTest() {
    setAnswers({});
    setChecked(false);
  }

  return (
    <Screen>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Тесты по безопасности</h1>
          <p className={styles.lead}>
            Закрепите знания из миссии «Защита от мошенников». Все ответы должны быть правильными, чтобы зачесть прогресс.
          </p>
        </header>

        {missionErr && <div className={styles.err}>{missionErr}</div>}

        <section className={styles.progressCard}>
          <div>
            <span className={styles.progressLabel}>Прогресс миссии</span>
            <strong className={styles.progressValue}>{progressText}</strong>
          </div>
          <div className={styles.progressStatus}>
            {mission?.progress.status === "Done"
              ? mission.progress.rewardClaimed
                ? "Награда получена"
                : "Можно получить награду"
              : "Миссия в процессе"}
          </div>
        </section>

        <form className={styles.quiz} onSubmit={handleSubmit}>
          {QUESTIONS.map((q, idx) => (
            <Card key={q.id} className={styles.question}>
              <div className={styles.questionHead}>
                <span className={styles.questionIndex}>{idx + 1}</span>
                <h2 className={styles.questionText}>{q.text}</h2>
              </div>

              <div className={styles.options}>
                {q.options.map((option) => {
                  const active = answers[q.id] === option.value;
                  const isCorrect = option.value === q.correct;
                  const showState = checked;
                  const wrongChoice = showState && active && !isCorrect;
                  const rightChoice = showState && isCorrect;
                  return (
                    <label
                      key={option.value}
                      className={`${styles.option} ${active ? styles.optionActive : ""} ${rightChoice ? styles.optionCorrect : ""} ${wrongChoice ? styles.optionWrong : ""}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={option.value}
                        checked={active}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: option.value }))}
                        disabled={submitting || claiming}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>

              {checked && <p className={styles.explanation}>{q.explanation}</p>}
            </Card>
          ))}

          <div className={styles.actions}>
            <Button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || claiming || missionBusy}
            >
              {submitting ? "Отмечаем..." : completed ? "Засчитать прогресс" : "Проверить ответы"}
            </Button>
            <button type="button" className={styles.resetBtn} onClick={resetTest} disabled={submitting || claiming}>
              Сбросить ответы
            </button>
          </div>
        </form>

        {checked && (
          <div className={`${styles.result} ${completed ? styles.resultSuccess : styles.resultWarn}`}>
            {completed
              ? "Все ответы верные — можно зачесть прогресс миссии."
              : `Правильных ответов: ${correctCount} из ${QUESTIONS.length}. Исправьте ошибки и попробуйте ещё раз.`}
          </div>
        )}

        {mission && mission.progress.status === "Done" && !(mission.progress.rewardClaimed ?? false) && (
          <Button
            className={styles.claimBtn}
            onClick={handleClaim}
            disabled={claiming}
          >
            {claiming ? "Получаем..." : `Забрать награду (${mission.reward.coins} монет)`}
          </Button>
        )}
      </div>
    </Screen>
  );
}