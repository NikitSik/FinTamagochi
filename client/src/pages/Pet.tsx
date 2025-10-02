import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import styles from "./styles/Pet.module.css";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { CoinIcon } from "../components/ui/CoinIcon";
import PetCarousel, { type PetSlide } from "../components/PetCarousel";
import Cat from "../components/pets/cat";
import Dog from "../components/pets/dog";
import { api, type PetState, type ShopItem } from "../api";
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
      case "sky":
        return styles.bgSky;
      case "room":
        return styles.bgRoom;
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
    api
      .shopItems()
      .then((items) => setShopItems(items))
      .catch((e: any) => setShopErr(e?.message ?? "Не удалось загрузить магазин"))
      .finally(() => setShopLoading(false));
  }, [shopOpen, shopItems.length]);

  async function purchase(item: ShopItem) {
    setBuyingId(item.id);
    try {
      const newState = await api.shopPurchase(item.id);
      setState(newState);
      if (item.type === "food") setMessage("Корм добавлен в инвентарь");
      else if (item.type === "medicine") setMessage("Аптечка добавлена в инвентарь");
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
    const item = medicineStock[0];
    if (!item) {
      alert("Нет подходящих предметов для лечения");
      setPendingAction(null);
      return;
    }
    try {
      await act("heal", { itemId: item.itemId });
      setMessage(`Питомец чувствует себя лучше (${item.title})`);
    } catch {
      // handled in act
    } finally {
      setPendingAction(null);
    }
  }

  async function handleFeed() {
    setPendingAction("feed");
    const item = foodStock[0];
    if (!item) {
      alert("Нет корма — загляните в магазин");
      setPendingAction(null);
      return;
    }
    try {
      await act("feed", { itemId: item.itemId });
      setMessage(`Питомец накормлен (${item.title})`);
    } catch {
      // handled in act
    } finally {
      setPendingAction(null);
    }
  }

  const filteredItems = useMemo(
    () => filterItems(shopItems, shopFilter),
    [shopItems, shopFilter]
  );
  const ownedItemIds = useMemo(() => new Set(state?.items ?? []), [state?.items]);

  const consumables = state?.consumables ?? [];
  const foodStock = useMemo(
    () => consumables.filter((item) => item.type === "food" && item.count > 0),
    [consumables]
  );
  const medicineStock = useMemo(
    () => consumables.filter((item) => item.type === "medicine" && item.count > 0),
    [consumables]
  );
  const totalFood = useMemo(() => foodStock.reduce((sum, item) => sum + item.count, 0), [foodStock]);
  const totalMedicine = useMemo(
    () => medicineStock.reduce((sum, item) => sum + item.count, 0),
    [medicineStock]
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}>Загрузка…</div>
      </div>
    );
  }

  if (err || !state) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}>{err ?? "Ошибка"}</div>
      </div>
    );
  }

  const coins = state.coins;
  const canHeal = totalMedicine > 0 && pendingAction !== "heal";
  const canFeed = totalFood > 0 && pendingAction !== "feed";
  const hasInventory = consumables.length > 0 || state.items.length > 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Питомец</h1>
        <div className={styles.coinsBadge} aria-live="polite">
          <CoinIcon size={16} />
          <span>{coins}</span>
        </div>
      </header>

      {message && <div className={`${styles.notice} ${styles.noticeInfo}`}>{message}</div>}
      {state.satiety < 25 && (
        <div className={`${styles.notice} ${styles.noticeWarn}`}>
          Питомец проголодался — накормите его!
        </div>
      )}
      {state.health < 40 && (
        <div className={`${styles.notice} ${styles.noticeWarn}`}>
          Здоровье на исходе — ему нужна забота.
        </div>
      )}

      <Card className={styles.petCard}>
        <div className={`${styles.scene} ${bgClass}`}>
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
        </div>
        <div className={styles.petInfo}>
          <span className={styles.petBadge}>Открыто {state.ownedPetIds.length}</span>
          <h2 className={styles.petName}>{prettyPetName(state.selectedPetId)}</h2>
          <p className={styles.petHint}>Выполняйте миссии, чтобы открывать новых друзей.</p>
        </div>
      </Card>

      <Card className={styles.stateCard}>
        <div className={styles.stateHeader}>
          <h2>Состояние</h2>
          <span className={styles.stateSubtitle}>Слева статус, справа проценты</span>
        </div>
        <div className={styles.statsGrid}>
          <ProgressBar label="Настроение" value={state.mood} variant="mood" />
          <ProgressBar label="Сытость" value={state.satiety} variant="satiety" />
          <ProgressBar label="Здоровье" value={state.health} variant="health" />
        </div>
        <div className={styles.actionRow}>
          <Button
            variant="primary"
            onClick={handleFeed}
            disabled={!canFeed}
          >
            {pendingAction === "feed"
              ? "Кормим…"
              : totalFood > 0
              ? `Кормить (×${totalFood})`
              : "Кормить"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShopOpen(true);
              setShopFilter("all");
            }}
          >
            Магазин
          </Button>
          <Button
            variant="ghost"
            onClick={handleHeal}
            disabled={!canHeal}
          >
            {pendingAction === "heal"
              ? "Лечим…"
              : totalMedicine > 0
              ? `Вылечить (×${totalMedicine})`
              : "Вылечить"}
          </Button>
        </div>
      </Card>

      <Card className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <div>
            <span className={styles.summaryLabel}>Выбранный питомец</span>
            <div className={styles.summaryValue}>{prettyPetName(state.selectedPetId)}</div>
          </div>
          <div>
            <span className={styles.summaryLabel}>Питомцев собрано</span>
            <div className={styles.summaryValue}>
              {state.ownedPetIds.length} / {slides.length}
            </div>
          </div>
        </div>
        <p className={styles.summaryHint}>
          Выполняйте миссии и заглядывайте в магазин, чтобы открыть новых друзей.
        </p>
        <Link className={styles.summaryLink} to="/missions/ANTIFRAUD_TUTORIAL">
          Перейти к миссии с тестом
        </Link>
      </Card>

      <Card className={styles.inventoryCard}>
        <h2>Инвентарь</h2>
        {hasInventory ? (
          <div className={styles.inventoryList}>
            {consumables.map((item) => (
              <span key={`consumable-${item.itemId}`} className={styles.inventoryItem}>
                {item.title} ×{item.count}
              </span>
            ))}
            {state.items.map((item) => (
              <span key={`item-${item}`} className={styles.inventoryItem}>
                {item}
              </span>
            ))}
          </div>
        ) : (
          <div className={styles.inventoryEmpty}>Пока пусто — загляните в магазин.</div>
        )}
      </Card>

      {shopOpen && (
        <div className={styles.modalBackdrop} onClick={() => setShopOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Магазин</h2>
                <p className={styles.modalSubtitle}>
                  Выберите всё необходимое для заботы о питомце
                </p>
              </div>
              <div className={styles.balanceWidget}>
                <span className={styles.balanceWidgetLabel}>Баланс</span>
                <div className={styles.balanceWidgetValue}>
                  <CoinIcon size={14} />
                  <span>{coins}</span>
                </div>
              </div>
            </header>
            <div className={styles.shopFilters}>
              {SHOP_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.shopFilter} ${
                    shopFilter === tab.id ? styles.shopFilterActive : ""
                  }`}
                  onClick={() => setShopFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {shopErr && <div className={styles.err}>{shopErr}</div>}
            <ul className={styles.shopList}>
              {shopLoading && (
                <li className={`${styles.shopRow} ${styles.shopRowState}`}>Загрузка…</li>
              )}
              {!shopLoading && !filteredItems.length && (
                <li className={`${styles.shopRow} ${styles.shopRowState}`}>
                  Подходящих товаров нет
                </li>
              )}
              {!shopLoading &&
                filteredItems.map((it) => {
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
                          <div className={styles.shopPrice}>
                            <CoinIcon size={14} />
                            <span>{it.price}</span>
                          </div>
                        </div>
                        {it.description && (
                          <div className={styles.shopDescription}>{it.description}</div>
                        )}
                        {effectText(it.effect) && (
                          <div className={styles.shopEffect}>{effectText(it.effect)}</div>
                        )}
                      </div>
                      <div className={styles.shopRowFooter}>
                        <Button
                          variant="secondary"
                          className={styles.buyBtn}
                          fullWidth={false}
                          disabled={!canBuy || buyingId === it.id}
                          onClick={() => purchase(it)}
                        >
                          {owned
                            ? "Недоступно"
                            : buyingId === it.id
                            ? "Покупаем…"
                            : "Купить"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
            </ul>
            <div className={styles.modalFooter}>
              <Button
                variant="ghost"
                fullWidth={false}
                className={styles.modalClose}
                onClick={() => setShopOpen(false)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function prettyPetName(id?: string | null) {
  switch (id) {
    case "cat":
      return "Кот";
    case "dog":
      return "Пёс";
    default:
      return "Питомец";
  }
}
