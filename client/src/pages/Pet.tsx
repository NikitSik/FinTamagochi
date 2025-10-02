import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import styles from "./styles/Pet.module.css";
import { api, type PetState, type ShopItem } from "../api";
import Cat from "../components/pets/cat";
import Dog from "../components/pets/dog";
import PetCarousel, { type PetSlide } from "../components/PetCarousel";
import {
  SHOP_FILTERS,
  effectText,
  filterItems,
  prettyType,
  type ShopFilter,
} from "../utils/shop";


const ALL_PETS: Record<string, ComponentType<any>> = {
  dog: Dog,
  cat: Cat,
};

const LOCK_HINTS: Record<string, string> = {
  cat: "Выполни миссию \"Защита от мошенников\"",
  parrot: "Выполни миссию \"Инвесткопилка\"",
};

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

  const filteredItems = useMemo(
    () => filterItems(shopItems, shopFilter),
    [shopItems, shopFilter]
  );
  const ownedItemIds = useMemo(() => new Set(state?.items ?? []), [state?.items]);

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
        <div className={styles.walletCard}>
          <span className={styles.walletCaption}>Игровых монет</span>
          <strong className={styles.walletValue}>{coins}</strong>
        </div>
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

        <div className={styles.alerts}>
          {message && <div className={`${styles.note} ${styles.noteInfo}`}>{message}</div>}
          {state.satiety < 25 && <div className={`${styles.note} ${styles.noteWarn}`}>Питомец проголодался — накормите его!</div>}
          {state.health < 40 && <div className={`${styles.note} ${styles.noteWarn}`}>Здоровье на исходе — ему нужна забота.</div>}
        </div>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Состояние</h2>
          <div className={styles.statsGrid}>
            <Stat label="Настроение" value={state.mood} />
            <Stat label="Сытость" value={state.satiety} />
            <Stat label="Здоровье" value={state.health} />
          </div>
          <div className={styles.playBlock}>
            <div className={styles.actionGroup}>
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
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.summaryCard}`}>
          <div className={styles.summaryRow}>
            <div>
              <span className={styles.summaryLabel}>Выбранный питомец</span>
              <div className={styles.summaryValue}>{prettyPetName(state.selectedPetId)}</div>
            </div>
            <div>
              <span className={styles.summaryLabel}>Питомцев собрано</span>
              <div className={styles.summaryValue}>{state.ownedPetIds.length} / {slides.length}</div>
            </div>
          </div>
          <p className={styles.summaryHint}>Выполняйте миссии и заглядывайте в магазин, чтобы открыть новых друзей.</p>
          <Link className={styles.testsLink} to="/missions/ANTIFRAUD_TUTORIAL">Перейти к миссии с тестом</Link>
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
        <Link className={`${styles.actionButton} ${styles.actionButtonLink}`} to="/missions/ANTIFRAUD_TUTORIAL">
          Миссия
        </Link>
      </footer>

      {shopOpen && (
        <div className={styles.modalBackdrop} onClick={() => setShopOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Магазин</h2>
                <p className={styles.modalSubtitle}>Выберите всё необходимое для заботы о питомце</p>
              </div>
              <div className={styles.balanceWidget}>
                <span className={styles.balanceCaption}>Баланс</span>
                <strong className={styles.balanceValue}>{coins} мон.</strong>
              </div>
            </header>
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
              {shopLoading && <li className={`${styles.shopRow} ${styles.shopRowState}`}>Загрузка…</li>}
              {!shopLoading && !filteredItems.length && (
                <li className={`${styles.shopRow} ${styles.shopRowState}`}>Подходящих товаров нет</li>
              )}
              {!shopLoading && filteredItems.map((it) => {
                const owned = it.type === "item" && ownedItemIds.has(it.id);
                const canBuy = coins >= it.price && buyingId !== it.id && !owned;
                return (
                  <li key={it.id} className={styles.shopRow}>
                    <div className={styles.shopRowContent}>
                      <div className={styles.shopRowHeader}>
                        <div>
                          <div className={styles.shopTitle}>{it.title}</div>
                          <div className={styles.shopMetaRow}>
                            <span className={styles.shopMeta}>{prettyType(it.type)}</span>
                            {owned && <span className={styles.shopOwned}>Уже в инвентаре</span>}
                          </div>
                        </div>
                        <div className={styles.shopPrice}>{it.price} мон.</div>
                      </div>
                      {it.description && <div className={styles.shopDescription}>{it.description}</div>}
                      {effectText(it.effect) && <div className={styles.shopEffect}>{effectText(it.effect)}</div>}
                    </div>
                    <div className={styles.shopRowFooter}>
                      <button
                        className={styles.buyBtn}
                        disabled={!canBuy || buyingId === it.id}
                        onClick={() => purchase(it)}
                      >
                        {owned ? "Недоступно" : buyingId === it.id ? "Покупаем…" : "Купить"}
                      </button>
                    </div>
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

function prettyPetName(id?: string | null) {
  switch (id) {
    case "cat": return "Кот";
    case "dog": return "Пёс";
    default: return "Питомец";
  }
}