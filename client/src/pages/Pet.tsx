import { useEffect, useMemo, useState, type ComponentType } from "react";
import styles from "./styles/Pet.module.css";
import { api, type PetState, type ShopItem } from "../api";
import Cat from "../components/pets/cat";
import Dog from "../components/pets/dog";
import Parrot from "../components/pets/parrot";
import PetCarousel, { type PetSlide } from "../components/PetCarousel";

// вместо JSX.Element — ComponentType
const ALL_PETS: Record<string, ComponentType<any>> = {
  dog: Dog,
  cat: Cat,
  parrot: Parrot,
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
      case "sky":  return styles.bgSky;
      case "room": return styles.bgRoom;
      default:     return styles.bgDefault;
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
              <h2 className={styles.modalTitle}>Магазин</h2>
              {shopErr && <div className={styles.err}>{shopErr}</div>}
              <ul className={styles.shopList}>
               {shopLoading && <li className={styles.shopRow}>Загрузка…</li>}
                {!shopLoading && shopItems.map((it) => (
                  <li key={it.id} className={styles.shopRow}>
                    <div>
                      <div className={styles.shopTitle}>{it.title}</div>
                      <div className={styles.shopMeta}>{prettyType(it.type)}</div>
                      <div className={styles.shopPrice}>{it.price} мон.</div>
                    </div>
                    <button
                      className={styles.buyBtn}
                      disabled={(state?.coins ?? 0) < it.price || buyingId === it.id}
                      onClick={() => purchase(it)}
                    >
                      Купить
                    </button>
                  </li>
                ))}
              </ul>
              <button className={styles.closeBtn} onClick={() => setShopOpen(false)}>Закрыть</button>
            </div>
          </div>
        )}
      </main>
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
