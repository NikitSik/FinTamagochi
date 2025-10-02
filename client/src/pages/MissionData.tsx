import type { ReactNode } from "react";
import type { Mission } from "../api";
import styles from "./styles/MissionDetails.module.css";

export type MissionTask = {
  title: string;
  description: string;
};

export type MissionResource = {
  title: string;
  url: string;
};

export type MissionMeta = {
  tagline: string;
  summary: string;
  heroGradient: string;
  heroIcon: ReactNode;
  tasks: MissionTask[];
  benefits: string[];
  resources?: MissionResource[];
};

const DepositIcon = () => (
  <svg viewBox="0 0 80 80" role="img" aria-hidden focusable="false" className={styles.heroSvg}>
    <rect x="14" y="18" width="52" height="44" rx="10" fill="#FFD54F" />
    <path d="M20 26h40v4H20z" fill="#FFB300" />
    <circle cx="40" cy="42" r="10" fill="#FFF8E1" />
    <path d="M40 34v16m-6-6h12" stroke="#FFB300" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CushionIcon = () => (
  <svg viewBox="0 0 80 80" role="img" aria-hidden focusable="false" className={styles.heroSvg}>
    <ellipse cx="40" cy="44" rx="26" ry="18" fill="#B2EBF2" />
    <ellipse cx="40" cy="36" rx="20" ry="12" fill="#80DEEA" />
    <path d="M26 36c4-8 24-8 28 0" stroke="#00838F" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 48h32" stroke="#00ACC1" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 80 80" role="img" aria-hidden focusable="false" className={styles.heroSvg}>
    <path d="M40 14l22 10v16c0 14-8 26-22 32-14-6-22-18-22-32V24z" fill="#CE93D8" />
    <path d="M32 38l6 7 10-11" stroke="#4A148C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BudgetIcon = () => (
  <svg viewBox="0 0 80 80" role="img" aria-hidden focusable="false" className={styles.heroSvg}>
    <rect x="16" y="18" width="48" height="44" rx="10" fill="#A5D6A7" />
    <rect x="22" y="24" width="36" height="8" rx="4" fill="#66BB6A" />
    <path d="M26 38h28" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round" />
    <path d="M26 46h20" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round" />
    <circle cx="50" cy="50" r="6" fill="#2E7D32" />
  </svg>
);

export const MISSION_META: Record<string, MissionMeta> = {
  DEPOSIT_6M: {
    tagline: "Выбираем вклад на полгода и дольше",
    summary: "Сформируйте стабильный пассивный доход: изучите ставки, сравните предложения и оформите вклад с капитализацией.",
    heroGradient: "linear-gradient(135deg,#FFF3E0 0%,#FFB74D 100%)",
    heroIcon: <DepositIcon />,
    tasks: [
      { title: "Изучите предложения", description: "Перейдите на страницу вкладов и выберите вклад от 6 месяцев." },
      { title: "Рассчитайте доходность", description: "Используйте калькулятор доходности и сохраните подходящий вариант." },
      { title: "Оформите заявку", description: "Отправьте онлайн-заявку или отметьте, что уже оформили вклад в отделении." },
    ],
    benefits: [
      "Получаете 200 монет для прокачки питомца",
      "Учитесь работать с долгосрочными накоплениями",
      "Формируете привычку откладывать заранее",
    ],
    resources: [
      { title: "Как выбирать вклад", url: "https://www.banki.ru/wikibank/deposit/" },
      { title: "Калькулятор сложных процентов", url: "https://finplanner.ru/calculators/compound" },
    ],
  },
  SAVINGS_CUSHION: {
    tagline: "Строим финансовую подушку",
    summary: "Три недели последовательных действий помогут сформировать резерв на случай непредвиденных расходов.",
    heroGradient: "linear-gradient(135deg,#E0F7FA 0%,#26C6DA 100%)",
    heroIcon: <CushionIcon />,
    tasks: [
      { title: "Поставьте цель", description: "Определите сумму равную месячным расходам и зафиксируйте её в приложении." },
      { title: "Настройте автоперевод", description: "Выберите день недели и настройте регулярный перевод на накопительный счёт." },
      { title: "Отметьте три пополнения", description: "Каждую неделю фиксируйте факт пополнения, чтобы увидеть прогресс." },
    ],
    benefits: [
      "Питомец получает 300 монет и XP",
      "Формируется привычка регулярных накоплений",
      "Появляется уверенность в финансовой безопасности",
    ],
    resources: [
      { title: "Зачем нужна подушка безопасности", url: "https://journal.tinkoff.ru/guide/financial-safety-cushion/" },
    ],
  },
  ANTIFRAUD_TUTORIAL: {
    tagline: "Учимся распознавать мошенников",
    summary: "За вечер вы разберёте типичные схемы обмана и закрепите знания небольшим тестом.",
    heroGradient: "linear-gradient(135deg,#F3E5F5 0%,#BA68C8 100%)",
    heroIcon: <ShieldIcon />,
    tasks: [
      { title: "Прочитайте памятку", description: "Изучите памятку по защите персональных данных и банковских реквизитов." },
      { title: "Посмотрите кейсы", description: "Ознакомьтесь с тремя реальными историями и отметьте признаки мошенничества." },
      { title: "Пройдите тест", description: "Ответьте на 5 вопросов и закрепите материал — результат можно пересдать." },
    ],
    benefits: [
      "Получаете 200 монет и открываете кота",
      "Узнаёте актуальные схемы мошенников",
      "Повышаете цифровую гигиену",
    ],
    resources: [
      { title: "Памятка Банка России", url: "https://www.cbr.ru/finmarket/" },
    ],
  },
  WEEKLY_BUDGET: {
    tagline: "Неделя осознанных трат",
    summary: "Отслеживайте расходы, чтобы найти лишние покупки и перераспределить деньги на важные цели.",
    heroGradient: "linear-gradient(135deg,#E8F5E9 0%,#81C784 100%)",
    heroIcon: <BudgetIcon />,
    tasks: [
      { title: "Запланируйте покупки", description: "Составьте список обязательных расходов на неделю и выделите лимит на импульсивные траты." },
      { title: "Отмечайте дни без лишнего", description: "Три раза за неделю удержитесь от незапланированных покупок и отметьте результат." },
      { title: "Подведите итоги", description: "Запишите выводы: сколько удалось сэкономить и куда направите свободные средства." },
    ],
    benefits: [
      "Питомец получает 250 монет и 200 XP",
      "Появляется контроль над ежедневными расходами",
      "Находится ресурс для накопительных целей",
    ],
    resources: [
      { title: "Шаблон бюджета 50/30/20", url: "https://journal.tinkoff.ru/spending-plan/" },
    ],
  },
};

export function getMissionMeta(mission: Mission | undefined) {
  if (!mission) return null;
  return MISSION_META[mission.code] ?? null;
}

export function getMissionRewardParts(m: Mission) {
  const petNames: Record<string, string> = {
    cat: "Кот",
    dog: "Пёс",
  };

  return {
    coins: m.reward?.coins ?? null,
    xp: m.reward?.xp ?? null,
    pet: m.reward?.petId ? petNames[m.reward.petId] ?? m.reward.petId : null,
  } as const;
}