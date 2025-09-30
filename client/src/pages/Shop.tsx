import { useEffect, useMemo, useState } from "react";
import styles from "./styles/Shop.module.css";
import { api, type PetState, type ShopItem } from "../api";
import { effectText, filterItems, prettyType, SHOP_FILTERS, type ShopFilter } from "../utils/shop";
import { Screen, Button, Card } from "../components/UI";

export default function Shop() {
  const [petState, setPetState] = useState<PetState | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [filter, setFilter] = useState<ShopFilter>("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const [state, list] = await Promise.all([
          api.petState(),
          api.shopItems(),
        ]);
        setPetState(state);
        setItems(list);
      } catch (e: any) {
        setErr(e?.message ?? "Не удалось загрузить магазин");
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

  const coins = petState?.coins ?? 0;
  const filteredItems = useMemo(() => filterItems(items, filter), [items, filter]);

  async function purchase(item: ShopItem) {
    setBuyingId(item.id);
    try {
      const state = await api.shopPurchase(item.id);
      setPetState(state);
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

  return (
    <Screen>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Магазин</h1>
          <p className={styles.subtitle}>Корм, игрушки, питомцы и фоны — всё, что нужно вашему другу.</p>
          <div className={styles.wallet}>Баланс: <strong>{coins}</strong> монет</div>
        </header>

        <main className={styles.main}>
          <div className={styles.tabs} role="tablist" aria-label="Категории магазина">
            {SHOP_FILTERS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={filter === tab.id}
                className={`${styles.tab} ${filter === tab.id ? styles.tabActive : ""}`}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {err && <div className={styles.err}>{err}</div>}
          {message && <div className={`${styles.note} ${styles.noteInfo}`}>{message}</div>}

          {loading && (
            <div className={styles.loader}>Загружаем предложения…</div>
          )}

          {!loading && !filteredItems.length && !err && (
            <div className={styles.empty}>Подходящих товаров нет</div>
          )}

          <div className={styles.grid}>
            {filteredItems.map((item) => {
              const canBuy = coins >= item.price && buyingId !== item.id;
              return (
                <Card key={item.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div>
                      <div className={styles.cardTitle}>{item.title}</div>
                      <div className={styles.cardMeta}>{prettyType(item.type)}</div>
                    </div>
                    <span className={styles.price}>{item.price} мон.</span>
                  </div>

                  {item.description && (
                    <p className={styles.description}>{item.description}</p>
                  )}
                  {effectText(item.effect) && (
                    <div className={styles.effect}>{effectText(item.effect)}</div>
                  )}

                  <Button
                    className={styles.buyBtn}
                    disabled={!canBuy}
                    onClick={() => purchase(item)}
                  >
                    {buyingId === item.id ? "Покупаем…" : "Купить"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </Screen>
  );
}