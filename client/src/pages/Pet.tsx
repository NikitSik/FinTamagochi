import { useEffect, useMemo, useState, type ComponentType } from "react";
import styles from "./styles/Pet.module.css";
import { api, type PetState, type ShopItem } from "../api";
import Cat from "../components/pets/cat";
import Dog from "../components/pets/dog";
import PetCarousel, { type PetSlide } from "../components/PetCarousel";


type ShopFilter = "all" | "food" | "bg" | "item" | "pet";

const ALL_PETS: Record<string, ComponentType<any>> = {
  dog: Dog,
  cat: Cat,
};

const LOCK_HINTS: Record<string, string> = {
  cat: "Выполни миссию \"Защита от мошенников\"",
  parrot: "Выполни миссию \"Инвесткопилка\"",
};

const SHOP_FILTERS: { id: ShopFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "food", label: "Еда" },
  { id: "bg", label: "Фоны" },
  { id: "item", label: "Игрушки" },
  { id: "pet", label: "Питомцы" },
];

const HEAL_COST = 25;
const FEED_COST = 5;
const QUICK_FEED_PAYLOAD = { satiety: 22, mood: 3 };

export default function Pet() {
  const [state, setState] = useState<PetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopErr, setShopErr] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [shopFilter, setShopFilter] = useState<ShopFilter>("all");
  const [pendingAction, setPendingAction] = useState<"heal" | "feed" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const carouselKey = useMemo(() => (state?.ownedPetIds ?? []).join("-"), [state?.ownedPetIds]);

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

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);

  const bgClass = useMemo(() => {
    switch (state?.background) {
      case "sky": return styles.bgSky;
      case "room": return styles.bgRoom;
      default: return styles.bgDefault;
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
    const idx = slides.findIndex((s) => s.id === state.selectedPetId);
    return Math.max(0, idx);
  }, [state?.selectedPetId, slides]);

  async function act(name: Parameters<typeof api.petAction>[0], payload?: any) {
    try {
      const s = await api.petAction(name, payload);
      setState(s);
    } catch (e: any) {
      alert(e?.message ?? "Ошибка");
      throw e;
    }
  }

  useEffect(() => {
    if (!shopOpen || shopItems.length) return;
    setShopLoading(true);
    setShopErr(null);
    api.shopItems()
      .then((items) => setShopItems(items))
      .catch((e: any) => setShopErr(e?.message ?? "Не удалось загрузить магазин"))
      .finally(() => setShopLoading(false));
  }, [shopOpen, shopItems.length]);

  async function purchase(item: ShopItem) {
    setBuyingId(item.id);
    try {
      const newState = await api.shopPurchase(item.id);
      setState(newState);
      if (item.type === "food") setMessage("Питомец довольно урчит");
      else if (item.type === "bg") setMessage("Фон обновлён!");
      else if (item.type === "item") setMessage("Игрушка добавлена в инвентарь");
      else if (item.type === "pet") setMessage("Новый питомец ждёт знакомства");
    } catch (e: any) {
      alert(e?.message ?? "Не удалось купить предмет");
    } finally {
      setBuyingId(null);
    }
  }

  async function handleHeal() {
    setPendingAction("heal");
    try {
      await act("heal");
      setMessage("Питомец чувствует себя лучше");
    } catch {
      // сообщение показано в act
    } finally {
      setPendingAction(null);
    }
  }

  async function handleFeed() {
    setPendingAction("feed");
    try {
      await act("feed", QUICK_FEED_PAYLOAD);
      setMessage("Питомец накормлен");
    } catch {
      // сообщение показано в act
    } finally {
      setPendingAction(null);
    }
  }

  const filteredItems = useMemo(() => {
    if (!shopItems.length) return [] as ShopItem[];
    return shopItems
      .filter((it) => shopFilter === "all" ? true : it.type === shopFilter)
      .sort((a, b) => a.price - b.price);
  }, [shopItems, shopFilter]);

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.card}>Загрузка…</div>
        </main>
      </div>
    );
  }

  if (err || !state) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.card}>{err ?? "Ошибка"}</div>
        </main>
      </div>
    );
  }

  const coins = state.coins;
  const canHeal = coins >= HEAL_COST && pendingAction !== "heal";
  const canFeed = coins >= FEED_COST && pendingAction !== "feed";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Питомец</h1>
        <div className={styles.coins}><i />{coins}</div>
      </header>

      <main className={styles.main}>
        <section className={`${styles.scene} ${bgClass}`}>
          <PetCarousel
            key={carouselKey}
            slides={slides}
            initialIndex={initialIndex}
            onChange={async (i) => {
              const id = slides[i].id;
              if (slides[i].locked) return;
              if (id !== state.selectedPetId) {
                try {
                  await api.petSelect(id);
                  setState((s) => (s ? { ...s, selectedPetId: id } : s));
                } catch {
                  /* ignore */
                }
              }
            }}
          />
        </section>

        {message && <div className={styles.message}>{message}</div>}
        {state.satiety < 25 && <div className={styles.warning}>Питомец проголодался — накормите его!</div>}
        {state.health < 40 && <div className={styles.warning}>Здоровье на исходе — ему нужна забота.</div>}

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Состояние</h2>
          <div className={styles.stats}>
            <Stat label="Настроение" value={state.mood} />
            <Stat label="Сытость" value={state.satiety} />
            <Stat label="Здоровье" value={state.health} />
          </div>
          <div className={styles.playBlock}>
            <button className={styles.playBtn} onClick={() => act("play")}>Поиграть</button>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Инвентарь</h2>
          {state.items.length ? (
            <div className={styles.inventoryList}>
              {state.items.map((item) => (
                <span key={item} className={styles.inventoryItem}>{item}</span>
              ))}
            </div>
          ) : (
            <div className={styles.inventoryEmpty}>Пока пусто — загляните в магазин.</div>
          )}
        </section>
      </main>

      <footer className={styles.actionBar}>
        <button
          className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
          onClick={() => { setShopOpen(true); setShopFilter("all"); }}
        >
          Магазин
        </button>
        <button
          className={styles.actionButton}
          disabled={!canHeal}
          onClick={handleHeal}
        >
          {pendingAction === "heal" ? "Лечим…" : `Вылечить (${HEAL_COST})`}
        </button>
        <button
          className={styles.actionButton}
          disabled={!canFeed}
          onClick={handleFeed}
        >
          {pendingAction === "feed" ? "Кормим…" : `Кормить (${FEED_COST})`}
        </button>
      </footer>

      {shopOpen && (
        <div className={styles.modalBackdrop} onClick={() => setShopOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Магазин</h2>
            <div className={styles.shopFilters}>
              {SHOP_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.shopFilter} ${shopFilter === tab.id ? styles.shopFilterActive : ""}`}
                  onClick={() => setShopFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {shopErr && <div className={styles.err}>{shopErr}</div>}
            <ul className={styles.shopList}>
              {shopLoading && <li className={styles.shopRow}>Загрузка…</li>}
              {!shopLoading && !filteredItems.length && (
                <li className={styles.shopRow}>Подходящих товаров нет</li>
              )}
              {!shopLoading && filteredItems.map((it) => {
                const canBuy = coins >= it.price && buyingId !== it.id;
                return (
                  <li key={it.id} className={styles.shopRow}>
                    <div>
                      <div className={styles.shopTitle}>{it.title}</div>
                      <div className={styles.shopMeta}>{prettyType(it.type)}</div>
                      {it.description && <div className={styles.shopDescription}>{it.description}</div>}
                      {effectText(it.effect) && <div className={styles.shopEffect}>{effectText(it.effect)}</div>}
                      <div className={styles.shopPrice}>{it.price} мон.</div>
                    </div>
                    <button
                      className={styles.buyBtn}
                      disabled={!canBuy || buyingId === it.id}
                      onClick={() => purchase(it)}
                    >
                      {buyingId === it.id ? "Покупаем…" : "Купить"}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={() => setShopOpen(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function prettyType(type: ShopItem["type"]): string {
  switch (type) {
    case "food": return "Еда";
    case "bg": return "Фон";
    case "item": return "Игрушка";
    case "pet": return "Питомец";
    default: return type;
  }
}

function effectText(effect?: ShopItem["effect"] | null): string | null {
  if (!effect) return null;
  const parts: string[] = [];
  if (effect.satiety) parts.push(`+${effect.satiety} к сытости`);
  if (effect.mood) parts.push(`+${effect.mood} к настроению`);
  if (effect.health) parts.push(`+${effect.health} к здоровью`);
  return parts.length ? parts.join(" · ") : null;
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