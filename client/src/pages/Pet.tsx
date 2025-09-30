import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import styles from "./styles/Pet.module.css";
import { api, type PetState, type ShopItem } from "../api";
import Cat from "../components/pets/cat";
import Dog from "../components/pets/dog";
import PetCarousel, { type PetSlide } from "../components/PetCarousel";

// вместо JSX.Element — ComponentType
const ALL_PETS: Record<string, ComponentType<any>> = {
  dog: Dog,
  cat: Cat,
};

const LOCK_HINTS: Record<string, string> = {
  cat: "Выполни миссию \"Защита от мошенников\"",
};

type ShopMeta = {
  badge: string;
  subtitle: string;
  description: string;
  accent: string;
  icon: ReactNode;
};

const IconMeal = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden focusable="false" className={styles.shopSvg}>
    <rect x="6" y="28" width="52" height="26" rx="13" fill="#FFB74D" />
    <path d="M12 30c6-16 34-16 40 0" fill="#FFE082" />
    <rect x="12" y="44" width="40" height="6" rx="3" fill="#F57C00" />
    <circle cx="24" cy="34" r="4" fill="#FF7043" />
    <circle cx="40" cy="34" r="4" fill="#FF7043" />
  </svg>
);

const IconEnergy = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden focusable="false" className={styles.shopSvg}>
    <rect x="10" y="18" width="44" height="28" rx="14" fill="#80DEEA" />
    <path d="M22 12l8 8h-6l10 14-4-12h6z" fill="#00ACC1" />
    <path d="M20 46h24" stroke="#006064" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const IconCity = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden focusable="false" className={styles.shopSvg}>
    <rect x="8" y="24" width="16" height="32" rx="3" fill="#4FC3F7" />
    <rect x="28" y="16" width="16" height="40" rx="3" fill="#0288D1" />
    <rect x="48" y="28" width="10" height="28" rx="3" fill="#01579B" />
    <circle cx="18" cy="12" r="6" fill="#FFC107" />
    <path d="M4 56h56" stroke="#0D47A1" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const IconCozy = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden focusable="false" className={styles.shopSvg}>
    <path d="M8 36l24-18 24 18v18H8z" fill="#FFAB91" />
    <rect x="20" y="40" width="12" height="14" rx="2" fill="#FBE9E7" />
    <rect x="36" y="44" width="10" height="10" rx="2" fill="#FFF3E0" />
    <path d="M4 36h56" stroke="#D84315" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const IconPlanner = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden focusable="false" className={styles.shopSvg}>
    <rect x="12" y="10" width="40" height="44" rx="6" fill="#B39DDB" />
    <rect x="18" y="20" width="28" height="4" rx="2" fill="#311B92" />
    <rect x="18" y="30" width="20" height="4" rx="2" fill="#311B92" />
    <circle cx="42" cy="32" r="4" fill="#FFC400" />
    <path d="M22 42h20" stroke="#5E35B1" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const IconInsurance = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden focusable="false" className={styles.shopSvg}>
    <path d="M12 18h40v30L32 54 12 48z" fill="#81C784" />
    <path d="M22 30l8 8 12-14" stroke="#1B5E20" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="16" y="14" width="32" height="6" rx="3" fill="#388E3C" />
  </svg>
);

const IconDefault = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden focusable="false" className={styles.shopSvg}>
    <circle cx="32" cy="32" r="22" fill="#B0BEC5" />
    <path d="M32 16v32M16 32h32" stroke="#37474F" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const TYPE_LABEL: Record<ShopItem["type"], string> = {
  food: "Еда",
  bg: "Фон",
  item: "Предмет",
  pet: "Питомец",
};

const SHOP_META: Record<string, ShopMeta> = {
  food_balanced_meal: {
    badge: "Еда",
    subtitle: "Старт дня без финансового стресса",
    description: "Рацион \"Баланс инвестора\" повышает сытость на 20% и поднимает настроение питомца.",
    accent: "linear-gradient(140deg,#FFECB3 0%,#FFB74D 100%)",
    icon: <IconMeal />,
  },
  food_energy_bowl: {
    badge: "Еда",
    subtitle: "Бодрость перед инвестиционной сессией",
    description: "Боул \"Энергия рынка\" восполняет 45% сытости и помогает сфокусироваться.",
    accent: "linear-gradient(140deg,#E0F7FA 0%,#26C6DA 100%)",
    icon: <IconEnergy />,
  },
  bg_city_lights: {
    badge: "Фон",
    subtitle: "Вечерний вид на деловой центр",
    description: "Ночной мегаполис с подсветкой небоскрёбов — идеальный фон для достижения целей.",
    accent: "linear-gradient(140deg,#E3F2FD 0%,#1565C0 100%)",
    icon: <IconCity />,
  },
  bg_cozy_home: {
    badge: "Фон",
    subtitle: "Тихий вечер в тёплом доме",
    description: "Тёплый домик с мягким светом напоминает, зачем вы копите финансовую подушку.",
    accent: "linear-gradient(140deg,#FBE9E7 0%,#FF8A65 100%)",
    icon: <IconCozy />,
  },
  item_budget_planner: {
    badge: "Гаджет",
    subtitle: "Организуй доходы и расходы",
    description: "Цифровой помощник помогает фиксировать траты и ускоряет прогресс в миссиях.",
    accent: "linear-gradient(140deg,#EDE7F6 0%,#7E57C2 100%)",
    icon: <IconPlanner />,
  },
  item_travel_insurance: {
    badge: "Сервис",
    subtitle: "Защита поездок по всему миру",
    description: "Уверенность в поездках дарит питомцу +10 к здоровью и спокойствию.",
    accent: "linear-gradient(140deg,#E8F5E9 0%,#66BB6A 100%)",
    icon: <IconInsurance />,
  },
};

const fallbackMeta = (item: ShopItem): ShopMeta => ({
  badge: TYPE_LABEL[item.type] ?? "Предмет",
  subtitle: item.title,
  description: "Описание скоро появится.",
  accent: "linear-gradient(140deg,#ECEFF1 0%,#CFD8DC 100%)",
  icon: <IconDefault />,
});

export default function Pet() {
  const [state, setState] = useState<PetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const carouselKey = useMemo(() => (state?.ownedPetIds ?? []).join("-"), [state?.ownedPetIds]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopErr, setShopErr] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.petState();
        setState(s);
      } catch (e: any) {
        setErr(e?.message ?? "Не удалось загрузить питомца");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const bgClass = useMemo(() => {
    switch (state?.background) {
       case "sky":
        return styles.bgSky;
      case "room":
        return styles.bgRoom;
      case "city":
        return styles.bgCity;
      case "cozy":
        return styles.bgCozy;
      default:
        return styles.bgDefault;
    }
  }, [state?.background]);

  const slides: PetSlide[] = useMemo(() => {
  const order = Object.keys(ALL_PETS);
    const owned = new Set(state?.ownedPetIds ?? []);
    return order.map((id) => {
      const Comp = ALL_PETS[id];
      return {
        id,
        render: <Comp className={styles.pet} />,
        locked: !owned.has(id),
        hint: LOCK_HINTS[id],
      } satisfies PetSlide;
    });
  }, [state?.ownedPetIds]);


  const initialIndex = useMemo(() => {
    if (!state?.selectedPetId) return 0;
    const idx = slides.findIndex(s => s.id === state.selectedPetId);
    return Math.max(0, idx);
  }, [state?.selectedPetId, slides]);

  async function act(name: Parameters<typeof api.petAction>[0], payload?: any) {
    try {
      const s = await api.petAction(name, payload);
      setState(s);
    } catch (e: any) {
      alert(e?.message ?? "Ошибка");
    }
  }

   useEffect(() => {
    if (!shopOpen) return;
    setShopLoading(true);
    setShopErr(null);
    api.shopItems()
      .then((items) => setShopItems(items))
      .catch((e: any) => setShopErr(e?.message ?? "Не удалось загрузить магазин"))
      .finally(() => setShopLoading(false));
  }, [shopOpen]);

  async function purchase(item: ShopItem) {
    setBuyingId(item.id);
    try {
      const newState = await api.shopPurchase(item.id);
      setState(newState);
    } catch (e: any) {
      alert(e?.message ?? "Не удалось купить предмет");
    } finally {
      setBuyingId(null);
    }
  }

  if (loading) return <div className={styles.page}><main className={styles.main}><div className={styles.card}>Загрузка…</div></main></div>;
  if (err || !state) return <div className={styles.page}><main className={styles.main}><div className={styles.card}>{err ?? "Ошибка"}</div></main></div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Питомец</h1>
        <div className={styles.coins}><i />{state.coins}</div>
      </header>

      <main className={styles.main}>
        <section className={`${styles.scene} ${bgClass}`}>
          <PetCarousel
            key={carouselKey}
            slides={slides}
            initialIndex={initialIndex}
            onChange={async (i) => {
            const id = slides[i].id;

            // Заблокирован — можно смотреть, но нельзя выбирать
            if (slides[i].locked) {
              return; // ничего не делаем
            }

            if (id !== state.selectedPetId) {
              try {
                await api.petSelect(id);
                setState(s => (s ? { ...s, selectedPetId: id } : s));
              } catch {
                // если бэк вернул 400 — просто игнорируем, слайд уже на месте
              }
            }
          }}
          />
        </section>

        <section className={styles.card}>
          <div className={styles.stats}>
            <Stat label="Настроение" value={state.mood} />
            <Stat label="Сытость" value={state.satiety} />
            <Stat label="Здоровье" value={state.health} />
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={() => act("play")}>Поиграть</button>
            <button className={styles.btnPrimary} onClick={() => act("heal")}>Вылечить</button>
            <button className={styles.btnSecondary} onClick={() => setShopOpen(true)}>Магазин</button>
          </div>
        </section>

        {shopOpen && (
          <div className={styles.modalBackdrop} onClick={() => setShopOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <h2 className={styles.modalTitle}>Магазин</h2>
                <button className={styles.closeIcon} aria-label="Закрыть" onClick={() => setShopOpen(false)}>
                  ×
                </button>
              </div>
              <p className={styles.modalLead}>
                Подбирайте продукты, которые помогают растить финансовые привычки и радуют питомца.
              </p>
              {shopErr && <div className={styles.err}>{shopErr}</div>}
               {shopLoading ? (
                <ul className={`${styles.shopGrid} ${styles.shopGridSkeleton}`}>
                  <li className={styles.shopSkeleton} />
                  <li className={styles.shopSkeleton} />
                  <li className={styles.shopSkeleton} />
                </ul>
              ) : (
                <ul className={styles.shopGrid}>
                  {shopItems.map((it) => {
                    const meta = SHOP_META[it.id] ?? fallbackMeta(it);
                    const disabled = (state?.coins ?? 0) < it.price || buyingId === it.id;
                    return (
                      <li key={it.id} className={styles.shopProduct}>
                        <div className={styles.shopIllustration} style={{ backgroundImage: meta.accent }}>
                          {meta.icon}
                        </div>
                        <div className={styles.shopInfo}>
                          <div className={styles.shopTagRow}>
                            <span className={styles.shopBadge}>{meta.badge}</span>
                            <span className={styles.shopPrice}>{it.price} мон.</span>
                          </div>
                          <h3 className={styles.shopName}>{it.title}</h3>
                          <p className={styles.shopSubtitle}>{meta.subtitle}</p>
                          <p className={styles.shopDescription}>{meta.description}</p>
                          <div className={styles.shopActions}>
                            <button
                              className={styles.buyBtn}
                              disabled={disabled}
                              onClick={() => purchase(it)}
                            >
                              {buyingId === it.id ? "Покупаем..." : "Купить"}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value}%</span>
      </div>
      <div className={styles.progress}><i style={{ width: `${value}%` }} /></div>
    </div>
  );
}
